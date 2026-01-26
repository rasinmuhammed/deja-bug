import * as vscode from 'vscode';
import { MCPClient } from './mcp/client';
import { TerminalMonitor } from './monitors/terminal-monitor';
import { BugTimelinePanel } from './webview/timeline';
import { LLMManager } from './llm/manager';
import { DejaBugStatusBar } from './ui/status-bar';
import { showWelcomeWalkthrough } from './ui/welcome';
import { AchievementManager } from './achievements/manager';

let mcpClient: MCPClient | undefined;
let llmManager: LLMManager | undefined;
let terminalMonitor: TerminalMonitor | undefined;
let statusBar: DejaBugStatusBar | undefined;
let achievementManager: AchievementManager | undefined;

export async function activate(context: vscode.ExtensionContext) {
    console.log('Deja-Bug extension is now active!');

    // Show welcome on first run
    if (!context.globalState.get('hasSeenWelcome')) {
        // Delay to let extension load first
        setTimeout(() => {
            showWelcomeWalkthrough(context);
        }, 1000);
    }

    // Initialize status bar first (always visible)
    statusBar = new DejaBugStatusBar(context);

    // Initialize achievement manager
    achievementManager = new AchievementManager(context);

    // Initialize MCP client
    mcpClient = new MCPClient(context);
    
    try {
        await mcpClient.start();
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to start Deja-Bug MCP server: ${error}`);
        // Continue without MCP - still useful for terminal monitoring
    }

    // Initialize LLM Manager with provider detection
    llmManager = new LLMManager(mcpClient);
    const llmAvailable = await llmManager.initialize();
    
    // Update status bar with LLM info
    const providerInfo = llmManager.getProviderInfo();
    if (providerInfo) {
        statusBar.setLLMProvider(providerInfo.displayName);
    } else {
        statusBar.setLLMProvider('None (Disabled)');
    }

    // Initialize terminal monitor (pass LLM manager)
    terminalMonitor = new TerminalMonitor(mcpClient, llmManager, statusBar, context);

    // Check achievements periodically
    setInterval(async () => {
        try {
            const stats = await mcpClient?.callTool('get_stats', {});
            if (stats && achievementManager) {
                await achievementManager.checkAchievements({
                    totalBugs: statusBar?.getBugCount() || 0,
                    ...stats
                });
            }
        } catch {
            // Silently fail if MCP not available
        }
    }, 30000); // Check every 30 seconds

    // Register commands
    const captureCommand = vscode.commands.registerCommand('deja-bug.manualCapture', async () => {
        await terminalMonitor?.manualCapture();
        
        // Check for achievements after capture
        setTimeout(async () => {
            try {
                const stats = await mcpClient?.callTool('get_stats', {});
                if (stats && achievementManager) {
                    await achievementManager.checkAchievements({
                        totalBugs: statusBar?.getBugCount() || 0,
                        ...stats
                    });
                }
            } catch {}
        }, 1000);
    });

    const timelineCommand = vscode.commands.registerCommand('deja-bug.showTimeline', () => {
        BugTimelinePanel.createOrShow(context.extensionUri);
    });

    const searchCommand = vscode.commands.registerCommand('deja-bug.searchBugs', async (query?: string) => {
        query = query || await vscode.window.showInputBox({
            prompt: 'Search past bugs',
            placeHolder: 'e.g., "null pointer error"'
        });

        if (query && terminalMonitor) {
            vscode.window.showInformationMessage('Semantic search feature available!');
        }
    });

    const restartCommand = vscode.commands.registerCommand('deja-bug.restartServer', async () => {
        await mcpClient?.restart();
        
        // Reinitialize LLM
        if (llmManager) {
            await llmManager.initialize();
            const info = llmManager.getProviderInfo();
            statusBar?.setLLMProvider(info?.displayName || 'None');
        }
        
        vscode.window.showInformationMessage('Deja-Bug server restarted');
    });

    context.subscriptions.push(
        mcpClient,
        llmManager,
        terminalMonitor,
        statusBar,
        achievementManager,
        captureCommand,
        timelineCommand,
        searchCommand,
        restartCommand
    );

    // Show welcome message with LLM info
    if (llmAvailable) {
        const info = llmManager.getProviderInfo();
        vscode.window.showInformationMessage(
            `🎉 Deja-Bug is ready! AI powered by ${info?.displayName}`
        );
    } else {
        vscode.window.showInformationMessage(
            '🐛 Deja-Bug is ready! (AI analysis disabled - install Ollama or use Cursor/Copilot)'
        );
    }
}

export function deactivate() {
    terminalMonitor?.dispose();
    llmManager?.dispose();
    statusBar?.dispose();
    achievementManager?.dispose();
    mcpClient?.dispose();
}
