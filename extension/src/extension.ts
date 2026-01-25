import * as vscode from 'vscode';
import { TerminalMonitor } from './monitors/terminal-monitor';
import { MCPClient } from './mcp/client';

let terminalMonitor: TerminalMonitor | undefined;
let mcpClient: MCPClient | undefined;

export async function activate(context: vscode.ExtensionContext) {
    console.log('Deja-Bug extension is now active!');

    // Initialize MCP client
    mcpClient = new MCPClient(context);
    await mcpClient.start();

    // Initialize terminal monitor
    const config = vscode.workspace.getConfiguration('deja-bug');
    const autoCapture = config.get<boolean>('autoCapture', true);

    if (autoCapture) {
        terminalMonitor = new TerminalMonitor(mcpClient);
        context.subscriptions.push(terminalMonitor);
    }

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('deja-bug.showTimeline', () => {
            vscode.window.showInformationMessage('Bug timeline feature coming soon!');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('deja-bug.searchBugs', async () => {
            const query = await vscode.window.showInputBox({
                prompt: 'Search past bugs (e.g., "null pointer error")',
                placeHolder: 'Enter search query...'
            });

            if (query) {
                vscode.window.showInformationMessage(`Searching for: ${query} (feature coming soon)`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('deja-bug.manualCapture', async () => {
            if (terminalMonitor) {
                const result = await terminalMonitor.manualCapture();
                if (result) {
                    vscode.window.showInformationMessage(`✅ Bug manually captured! ID: ${result.bug_id}`);
                } else {
                    vscode.window.showWarningMessage('No active incident to capture. Trigger an error first.');
                }
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('deja-bug.restartServer', async () => {
            await mcpClient?.restart();
            vscode.window.showInformationMessage('Deja-Bug server restarted');
        })
    );

    vscode.window.showInformationMessage('Deja-Bug is ready to capture your debugging sessions!');
}

export function deactivate() {
    terminalMonitor?.dispose();
    mcpClient?.dispose();
}
