import * as vscode from 'vscode';
import { MCPClient } from './mcp/client';
import { TerminalMonitor } from './monitors/terminal-monitor';
import { BugTimelinePanel } from './webview/timeline';

let mcpClient: MCPClient | undefined;
let terminalMonitor: TerminalMonitor | undefined;

export async function activate(context: vscode.ExtensionContext) {
    console.log('Deja-Bug extension is now active!');

    // Initialize MCP client
    mcpClient = new MCPClient(context);
    
    try {
        await mcpClient.start();
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to start Deja-Bug: ${error}`);
        return;
    }

    // Initialize terminal monitor
    terminalMonitor = new TerminalMonitor(context, mcpClient);

    // Register commands
    const captureCommand = vscode.commands.registerCommand('deja-bug.manualCapture', () => {
        terminalMonitor?.triggerManualCapture();
    });

    const timelineCommand = vscode.commands.registerCommand('deja-bug.showTimeline', () => {
        BugTimelinePanel.createOrShow(context.extensionUri);
    });

    const searchCommand = vscode.commands.registerCommand('deja-bug.searchBugs', async () => {
        const query = await vscode.window.showInputBox({
            prompt: 'Search past bugs',
            placeHolder: 'e.g., "null pointer error"'
        });

        if (query && terminalMonitor) {
            vscode.window.showInformationMessage('Semantic search feature available!');
        }
    });

    const restartCommand = vscode.commands.registerCommand('deja-bug.restartServer', async () => {
        await mcpClient?.restart();
        vscode.window.showInformationMessage('Deja-Bug server restarted');
    });

    context.subscriptions.push(
        mcpClient,
        terminalMonitor,
        captureCommand,
        timelineCommand,
        searchCommand,
        restartCommand
    );

    vscode.window.showInformationMessage('Deja-Bug is ready!');
}

export function deactivate() {
    terminalMonitor?.dispose();
    mcpClient?.dispose();
}
