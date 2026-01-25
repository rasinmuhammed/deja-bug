import * as vscode from 'vscode';
import { CircularBuffer } from '../utils/circular-buffer';
import { detectError, extractFilePaths } from '../utils/error-patterns';
import { MCPClient } from '../mcp/client';

interface TerminalState {
    buffer: CircularBuffer;
    activeIncident: string | null; // incident ID if monitoring for resolution
    incidentStartTime: number | null; // timestamp when incident was reported
    lastExitCode: number | null;
}

/**
 * Monitors terminal output for errors and successful resolutions
 */
export class TerminalMonitor implements vscode.Disposable {
    private terminalStates = new Map<string, TerminalState>();
    private disposables: vscode.Disposable[] = [];
    private outputChannel: vscode.OutputChannel;

    constructor(private mcpClient: MCPClient) {
        this.outputChannel = vscode.window.createOutputChannel('Deja-Bug Monitor');

        const config = vscode.workspace.getConfiguration('deja-bug');
        const bufferSize = config.get<number>('bufferSize', 200);

        // Monitor terminal data
        this.disposables.push(
            vscode.window.onDidWriteTerminalData(event => {
                this.handleTerminalData(event.terminal, event.data, bufferSize);
            })
        );

        // Monitor terminal closure (to detect exit codes)
        this.disposables.push(
            vscode.window.onDidCloseTerminal(terminal => {
                this.handleTerminalClose(terminal);
            })
        );

        // Monitor new terminals
        this.disposables.push(
            vscode.window.onDidOpenTerminal(terminal => {
                this.log(`New terminal opened: ${terminal.name}`);
            })
        );
    }

    private getTerminalState(terminal: vscode.Terminal, bufferSize: number): TerminalState {
        const terminalId = this.getTerminalId(terminal);

        if (!this.terminalStates.has(terminalId)) {
            this.terminalStates.set(terminalId, {
                buffer: new CircularBuffer(bufferSize),
                activeIncident: null,
                incidentStartTime: null,
                lastExitCode: null
            });
        }

        return this.terminalStates.get(terminalId)!;
    }

    private getTerminalId(terminal: vscode.Terminal): string {
        return `${terminal.name}-${terminal.processId || 'unknown'}`;
    }

    private async handleTerminalData(
        terminal: vscode.Terminal,
        data: string,
        bufferSize: number
    ): Promise<void> {
        const state = this.getTerminalState(terminal, bufferSize);
        state.buffer.append(data);

        // Check for error patterns
        const { hasError, pattern } = detectError(data);

        if (hasError && !state.activeIncident) {
            this.log(`Error detected: ${pattern?.description}`);
            await this.reportIncident(terminal, state, data);
        }

        // Check for success indicators (when we have an active incident)
        if (state.activeIncident && this.isSuccessIndicator(data)) {
            this.log('Success detected after error - checking for resolution');
            await this.reportResolution(terminal, state);
        }
    }

    private isSuccessIndicator(data: string): boolean {
        // Look for success patterns
        const successPatterns = [
            /✓|✔|PASS|SUCCESS|All tests passed/i,
            /Build successful/i,
            /Compilation complete/i
        ];

        return successPatterns.some(pattern => pattern.test(data));
    }

    private async reportIncident(
        terminal: vscode.Terminal,
        state: TerminalState,
        errorData: string
    ): Promise<void> {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                return;
            }

            const errorLog = state.buffer.getAll();
            const git = vscode.extensions.getExtension('vscode.git')?.exports;
            const repository = git?.getAPI(1).repositories[0];
            const currentCommit = repository?.state.HEAD?.commit || 'unknown';

            const result = await this.mcpClient.callTool('report_incident', {
                error_log: errorLog,
                timestamp: Date.now(),
                terminal_id: this.getTerminalId(terminal),
                git_hash: currentCommit,
                cwd: workspaceFolder.uri.fsPath
            });

            if (result?.incident_id) {
                state.activeIncident = result.incident_id;
                state.incidentStartTime = Date.now();
                this.log(`Incident ${result.incident_id} reported. Monitoring for resolution...`);

                // Show subtle notification
                vscode.window.showInformationMessage(
                    `Deja-Bug: Error captured, watching for fix...`,
                    'View'
                ).then(selection => {
                    if (selection === 'View') {
                        this.outputChannel.show();
                    }
                });
            }
        } catch (error) {
            this.log(`Error reporting incident: ${error}`);
        }
    }

    private async reportResolution(
        terminal: vscode.Terminal,
        state: TerminalState
    ): Promise<void> {
        if (!state.activeIncident) {
            return;
        }

        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                return;
            }

            // Check capture mode
            const config = vscode.workspace.getConfiguration('deja-bug');
            const captureMode = config.get<string>('captureMode', 'smart');

            if (captureMode === 'off') {
                this.log('Capture mode is OFF, skipping resolution');
                state.activeIncident = null;
                state.incidentStartTime = null;
                return;
            }

            // Calculate time to fix
            const now = Date.now();
            const timeToFixMs = state.incidentStartTime ? now - state.incidentStartTime : 0;
            const timeToFixSec = Math.floor(timeToFixMs / 1000);

            // Smart mode: check minimum resolution time
            if (captureMode === 'smart') {
                const minTime = config.get<number>('minResolutionTime', 120);
                if (timeToFixSec < minTime) {
                    this.log(`⏭️  Quick fix (${timeToFixSec}s < ${minTime}s threshold). Not capturing.`);
                    state.activeIncident = null;
                    state.incidentStartTime = null;
                    return;
                }
            }

            // Get git diff
            const git = vscode.extensions.getExtension('vscode.git')?.exports;
            const repository = git?.getAPI(1).repositories[0];

            // Get unstaged + staged changes
            const diff = await repository?.diff() || '';

            // Get list of modified files
            const modifiedFiles = repository?.state.workingTreeChanges.map(
                (change: any) => change.uri.fsPath
            ) || [];

            const result = await this.mcpClient.callTool('report_resolution', {
                incident_id: state.activeIncident,
                timestamp: now,
                git_diff: diff,
                modified_files: modifiedFiles,
                exit_code: 0,
                time_to_fix_seconds: timeToFixSec
            });

            if (result?.status === 'captured') {
                this.log(`✓ Bug captured! Confidence: ${(result.confidence * 100).toFixed(0)}%, Time to fix: ${timeToFixSec}s`);

                vscode.window.showInformationMessage(
                    `🐛 Bug fixed and captured! (${(result.confidence * 100).toFixed(0)}% confidence, ${timeToFixSec}s to fix)`,
                    'View'
                ).then(selection => {
                    if (selection === 'View') {
                        // Open the bug markdown file
                        const bugPath = `${workspaceFolder.uri.fsPath}/.deja-bug/bugs/${result.bug_id}.md`;
                        vscode.workspace.openTextDocument(bugPath).then(doc => {
                            vscode.window.showTextDocument(doc);
                        });
                    }
                });

                state.activeIncident = null;
                state.incidentStartTime = null;
            } else {
                this.log(`Resolution not captured (${result?.status}). Confidence too low.`);
                state.activeIncident = null;
                state.incidentStartTime = null;
            }
        } catch (error) {
            this.log(`Error reporting resolution: ${error}`);
            state.activeIncident = null;
            state.incidentStartTime = null;
        }
    }

  /**
   * Manual capture: Force capture the current bug regardless of time threshold
   */
  async manualCapture(): Promise<any> {
    // Find the active terminal with an incident
    for (const [terminalId, state] of this.terminalStates.entries()) {
      if (state.activeIncident) {
        this.log(`📝 Manual capture triggered for incident ${state.activeIncident}`);
        
        try {
          const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
          if (!workspaceFolder) {
            return null;
          }

          const git = vscode.extensions.getExtension('vscode.git')?.exports;
          const repository = git?.getAPI(1).repositories[0];
          const diff = await repository?.diff() || '';
          const modifiedFiles = repository?.state.workingTreeChanges.map(
            (change: any) => change.uri.fsPath
          ) || [];

          const timeToFixSec = state.incidentStartTime 
            ? Math.floor((Date.now() - state.incidentStartTime) / 1000)
            : 0;

          const result = await this.mcpClient.callTool('report_resolution', {
            incident_id: state.activeIncident,
            timestamp: Date.now(),
            git_diff: diff,
            modified_files: modifiedFiles,
            exit_code: 0,
            time_to_fix_seconds: timeToFixSec,
            manual_capture: true  // Override automatic filters
          });

          state.activeIncident = null;
          state.incidentStartTime = null;

          return result;
        } catch (error) {
          this.log(`Error in manual capture: ${error}`);
          return null;
        }
      }
    }

    this.log('⚠️ No active incident found for manual capture');
    return null;
  }

  private handleTerminalClose(terminal: vscode.Terminal): void {
        const terminalId = this.getTerminalId(terminal);
        this.terminalStates.delete(terminalId);
        this.log(`Terminal closed: ${terminal.name}`);
    }

    private log(message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] ${message}`);
    }

    dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.terminalStates.clear();
        this.outputChannel.dispose();
    }
}
