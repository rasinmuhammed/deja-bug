import * as vscode from 'vscode';
import { MCPClient } from './mcp/client';
import { TerminalMonitor } from './monitors/terminal-monitor';
import { BugTimelinePanel } from './webview/timeline';
import { LLMManager } from './llm/manager';
import { DejaBugStatusBar } from './ui/status-bar';
import { showWelcomeWalkthrough } from './ui/welcome';
import { AchievementManager } from './achievements/manager';
import { PatternDetector } from './insights/detector';

let mcpClient: MCPClient | undefined;
let llmManager: LLMManager | undefined;
let terminalMonitor: TerminalMonitor | undefined;
let statusBar: DejaBugStatusBar | undefined;
let achievementManager: AchievementManager | undefined;
let patternDetector: PatternDetector | undefined;

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

    // Initialize pattern detector
    patternDetector = new PatternDetector(context, mcpClient);

    // Initialize terminal monitor (pass LLM manager)
    terminalMonitor = new TerminalMonitor(mcpClient, llmManager, statusBar, context);

    // Check achievements & patterns periodically
    setInterval(async () => {
        try {
            const stats = await mcpClient?.callTool('get_stats', {});
            if (stats && achievementManager) {
                await achievementManager.checkAchievements({
                    totalBugs: statusBar?.getBugCount() || 0,
                    ...stats
                });
            }
            
            // Check for patterns every 5 minutes
            if (patternDetector) {
                await patternDetector.checkPatterns();
            }
        } catch {
            // Silently fail if MCP not available
        }
    }, 30000); // Check every 30 seconds

    // Check for monthly insights on first of month
    const lastInsightsCheck = context.globalState.get('lastInsightsMonth', 0);
    const currentMonth = new Date().getMonth();
    if (lastInsightsCheck !== currentMonth && statusBar.getBugCount() >= 10) {
        setTimeout(async () => {
            if (patternDetector) {
                await patternDetector.generateMonthlyInsights();
                context.globalState.update('lastInsightsMonth', currentMonth);
            }
        }, 5000); // Delay to not interrupt startup
    }

    // Register commands
    const captureCommand = vscode.commands.registerCommand('deja-bug.manualCapture', async () => {
        await terminalMonitor?.manualCapture();
        
        // Check for achievements & patterns after capture
        setTimeout(async () => {
            try {
                const stats = await mcpClient?.callTool('get_stats', {});
                if (stats && achievementManager) {
                    await achievementManager.checkAchievements({
                        totalBugs: statusBar?.getBugCount() || 0,
                        ...stats
                    });
                }
                
                if (patternDetector) {
                    await patternDetector.checkPatterns();
                }
            } catch {}
        }, 1000);
    });

    const timelineCommand = vscode.commands.registerCommand('deja-bug.showTimeline', () => {
        BugTimelinePanel.createOrShow(context.extensionUri, mcpClient);
    });

    const patternsCommand = vscode.commands.registerCommand('deja-bug.showPatterns', async () => {
        if (patternDetector) {
            await patternDetector.showPatternsPanel();
        }
    });

    const insightsCommand = vscode.commands.registerCommand('deja-bug.showInsights', async () => {
        if (patternDetector) {
            await patternDetector.generateMonthlyInsights();
        }
    });

    const searchCommand = vscode.commands.registerCommand('deja-bug.searchBugs', async (query?: string) => {
        query = query || await vscode.window.showInputBox({
            prompt: 'Search past bugs',
            placeHolder: 'e.g., "null pointer error"'
        });

        if (query && mcpClient) {
            try {
                const results = await mcpClient.callTool('search_similar_bugs', { query, k: 5 });
                if (results?.results?.length > 0) {
                    vscode.window.showInformationMessage(
                        `Found ${results.count} similar bugs!`,
                        'View Results'
                    );
                } else {
                    vscode.window.showInformationMessage('No similar bugs found');
                }
            } catch {}
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
        patternDetector,
        captureCommand,
        timelineCommand,
        patternsCommand,
        insightsCommand,
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
    patternDetector?.dispose();
    mcpClient?.dispose();
}
