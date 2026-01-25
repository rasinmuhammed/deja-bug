import * as vscode from 'vscode';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as path from 'path';

interface MCPRequest {
    jsonrpc: '2.0';
    method: string;
    params?: any;
    id: number;
}

interface MCPResponse {
    jsonrpc: '2.0';
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
    id: number;
}

/**
 * MCP Client that communicates with the Python server via stdio
 */
export class MCPClient implements vscode.Disposable {
    private serverProcess: ChildProcessWithoutNullStreams | null = null;
    private requestId = 0;
    private pendingRequests = new Map<number, {
        resolve: (value: any) => void;
        reject: (error: any) => void;
    }>();
    private outputChannel: vscode.OutputChannel;
    private isInitialized = false;

    constructor(private context: vscode.ExtensionContext) {
        this.outputChannel = vscode.window.createOutputChannel('Deja-Bug Server');
    }

    async start(): Promise<void> {
        if (this.serverProcess) {
            this.log('Server already running');
            return;
        }

        try {
            const serverPath = path.join(this.context.extensionPath, '..', 'server');

            this.log(`Starting MCP server from: ${serverPath}`);

            // Spawn Python MCP server using uv
            this.serverProcess = spawn('uv', ['run', 'python', '-m', 'deja_bug.server'], {
                cwd: serverPath,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            // Handle stdout (JSON-RPC responses)
            this.serverProcess.stdout.on('data', (data) => {
                const lines = data.toString().split('\n');
                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const response: MCPResponse = JSON.parse(line);
                            this.handleResponse(response);
                        } catch (error) {
                            this.log(`Failed to parse response: ${line}`);
                        }
                    }
                }
            });

            // Handle stderr (logs)
            this.serverProcess.stderr.on('data', (data) => {
                this.log(`[Server Error] ${data.toString()}`);
            });

            // Handle process exit
            this.serverProcess.on('exit', (code, signal) => {
                this.log(`Server exited with code ${code}, signal ${signal}`);
                this.serverProcess = null;
                this.isInitialized = false;

                // Reject all pending requests
                for (const [id, { reject }] of this.pendingRequests) {
                    reject(new Error('Server exited'));
                }
                this.pendingRequests.clear();
            });

            this.log('MCP server started successfully');

            // Send MCP initialize request
            await this.initializeMCP();

            // Show notification
            vscode.window.showInformationMessage('Deja-Bug server started');

        } catch (error) {
            this.log(`Failed to start server: ${error}`);
            vscode.window.showErrorMessage(`Failed to start Deja-Bug server: ${error}`);
            throw error;
        }
    }

    private async initializeMCP(): Promise<void> {
        this.log('Sending MCP initialize request...');
        
        const initRequest = {
            jsonrpc: '2.0',
            method: 'initialize',
            params: {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: {
                    name: 'deja-bug-vscode',
                    version: '0.1.0'
                }
            },
            id: 0
        };

        return new Promise((resolve, reject) => {
            this.pendingRequests.set(0, {
                resolve: (result: any) => {
                    this.log('MCP initialized successfully');
                    this.isInitialized = true;
                    resolve();
                },
                reject
            });

            try {
                const requestStr = JSON.stringify(initRequest) + '\n';
                this.serverProcess!.stdin.write(requestStr);
            } catch (error) {
                this.pendingRequests.delete(0);
                reject(error);
            }

            // Timeout after 10 seconds
            setTimeout(() => {
                if (this.pendingRequests.has(0)) {
                    this.pendingRequests.delete(0);
                    reject(new Error('MCP initialization timed out'));
                }
            }, 10000);
        });
    }

    async restart(): Promise<void> {
        await this.stop();
        await this.start();
    }

    async stop(): Promise<void> {
        if (this.serverProcess) {
            this.serverProcess.kill();
            this.serverProcess = null;
            this.log('Server stopped');
        }
    }

    async callTool(name: string, args: any): Promise<any> {
        if (!this.serverProcess) {
            throw new Error('MCP server not running');
        }

        if (!this.isInitialized) {
            this.log('Waiting for MCP initialization...');
            // Wait up to 10 seconds for initialization
            for (let i = 0; i < 100; i++) {
                if (this.isInitialized) break;
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            if (!this.isInitialized) {
                throw new Error('MCP server not initialized');
            }
        }

        return new Promise((resolve, reject) => {
            const id = ++this.requestId;
            
            // Use MCP protocol tools/call method
            const request: MCPRequest = {
                jsonrpc: '2.0',
                method: 'tools/call',
                params: {
                    name: name,
                    arguments: args
                },
                id
            };

            this.pendingRequests.set(id, { resolve, reject });

            try {
                const requestStr = JSON.stringify(request) + '\n';
                this.serverProcess!.stdin.write(requestStr);
                this.log(`>>> ${name}: ${JSON.stringify(args).substring(0, 100)}...`);
            } catch (error) {
                this.pendingRequests.delete(id);
                reject(error);
            }

            // Timeout after 30 seconds
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error(`Request ${name} timed out`));
                }
            }, 30000);
        });
    }

    private handleResponse(response: MCPResponse): void {
        const pending = this.pendingRequests.get(response.id);

        if (!pending) {
            this.log(`Received response for unknown request ${response.id}`);
            return;
        }

        this.pendingRequests.delete(response.id);

        if (response.error) {
            this.log(`<<< Error: ${response.error.message}`);
            pending.reject(new Error(response.error.message));
        } else {
            // Unwrap MCP content structure if present
            let result = response.result;
            
            // If result has MCP content array, extract and parse the text
            if (result?.content && Array.isArray(result.content) && result.content.length > 0) {
                const firstContent = result.content[0];
                if (firstContent.type === 'text' && firstContent.text) {
                    try {
                        // Parse the JSON string inside the text field
                        result = JSON.parse(firstContent.text);
                    } catch (e) {
                        // If parsing fails, use the text as-is
                        result = firstContent.text;
                    }
                }
            }
            
            this.log(`<<< Success: ${JSON.stringify(result).substring(0, 100)}...`);
            pending.resolve(result);
        }
    }

    private log(message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] ${message}`);
    }

    dispose(): void {
        this.stop();
        this.outputChannel.dispose();
    }
}
