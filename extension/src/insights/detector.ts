import * as vscode from 'vscode';
import { MCPClient } from '../mcp/client';

/**
 * Pattern Detection & Insights System
 * Proactively detects patterns and shows personalized insights
 */

export class PatternDetector {
    private context: vscode.ExtensionContext;
    private mcpClient: MCPClient;
    private outputChannel: vscode.OutputChannel;
    private lastCheck: number = 0;

    constructor(context: vscode.ExtensionContext, mcpClient: MCPClient) {
        this.context = context;
        this.mcpClient = mcpClient;
        this.outputChannel = vscode.window.createOutputChannel('Deja-Bug Patterns');
    }

    /**
     * Check for patterns periodically
     */
    async checkPatterns(): Promise<void> {
        try {
            // Don't check too frequently
            const now = Date.now();
            if (now - this.lastCheck < 60000) {  // 1 minute cooldown
                return;
            }
            this.lastCheck = now;

            this.log('🔍 Checking for patterns...');

            const result = await this.mcpClient.callTool('detect_patterns', {
                days: 7
            });

            if (result.status !== 'success') {
                this.log(`No patterns found: ${result.status}`);
                return;
            }

            const { patterns, insights } = result;

            // Show high-severity insights
            for (const insight of insights) {
                if (insight.severity === 'high') {
                    await this.showPatternNotification(insight);
                }
            }

            // Store patterns for later viewing
            await this.context.globalState.update('latest_patterns', {
                patterns,
                insights,
                timestamp: Date.now()
            });

            this.log(`✅ Found ${insights.length} insights`);

        } catch (error) {
            this.log(`Error checking patterns: ${error}`);
        }
    }

    /**
     * Show pattern notification to user
     */
    private async showPatternNotification(insight: any): Promise<void> {
        const icon = this.getInsightIcon(insight.type);
        const message = `${icon} ${insight.title}\n\n${insight.message}`;

        const choice = await vscode.window.showInformationMessage(
            message,
            insight.action,
            'View All Patterns',
            'Dismiss'
        );

        if (choice === 'View All Patterns') {
            await this.showPatternsPanel();
        } else if (choice === insight.action) {
            // Execute the suggested action
            await this.executeInsightAction(insight);
        }
    }

    /**
     * Show patterns panel with all insights
     */
    async showPatternsPanel(): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'patterns',
            '🔍 Debugging Patterns',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        // Get latest patterns
        const result = await this.mcpClient.callTool('detect_patterns', { days: 7 });

        if (result.status === 'success') {
            panel.webview.html = this.getPatternsHTML(result);
        } else {
            panel.webview.html = this.getEmptyPatternsHTML();
        }
    }

    /**
     * Generate monthly insights
     */
    async generateMonthlyInsights(): Promise<void> {
        try {
            this.log('🎓 Generating monthly insights...');

            const insights = await this.mcpClient.callTool('generate_personalized_insights', {});

            if (insights.status !== 'success') {
                this.log(`Insufficient data for insights: ${insights.message || 'Unknown'}`);
                return;
            }

            // Show beautiful insights panel
            await this.showMonthlyInsightsPanel(insights.insights);

        } catch (error) {
            this.log(`Error generating monthly insights: ${error}`);
        }
    }

    /**
     * Show monthly insights panel
     */
    private async showMonthlyInsightsPanel(insights: any): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'monthlyInsights',
            '🎓 Your Debugging Insights',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = this.getMonthlyInsightsHTML(insights);

        // Handle messages
        panel.webview.onDidReceiveMessage(async message => {
            if (message.command === 'share') {
                await this.shareInsights(insights);
            }
        });
    }

    private getInsightIcon(type: string): string {
        const icons: Record<string, string> = {
            'repeated_error': '⚠️',
            'file_hotspot': '🔥',
            'time_pattern': '⏰',
            'improvement': '📈',
            'milestone': '🎉'
        };
        return icons[type] || '💡';
    }

    private async executeInsightAction(insight: any): Promise<void> {
        // For now, just show a helpful message
        vscode.window.showInformationMessage(`Tip: ${insight.action}`);
    }

    private getPatternsHTML(data: any): string {
        const { patterns, insights, total_bugs } = data;

        const insightCards = insights.map((insight: any) => `
            <div class="insight-card ${insight.severity}">
                <div class="insight-header">
                    <span class="icon">${this.getInsightIcon(insight.type)}</span>
                    <h3>${insight.title}</h3>
                </div>
                <p>${insight.message}</p>
                <button class="action-btn">${insight.action}</button>
            </div>
        `).join('');

        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        
        .header {
            margin-bottom: 30px;
        }
        
        h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }
        
        .subtitle {
            opacity: 0.8;
            font-size: 16px;
        }
        
        .insight-card {
            border-left: 4px solid var(--vscode-panel-border);
            padding: 20px;
            margin: 15px 0;
            border-radius: 8px;
            background: var(--vscode-editor-inactiveSelectionBackground);
        }
        
        .insight-card.high {
            border-left-color: #f48771;
        }
        
        .insight-card.positive {
            border-left-color: #89d185;
        }
        
        .insight-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
        }
        
        .icon {
            font-size: 24px;
        }
        
        h3 {
            margin: 0;
            font-size: 18px;
        }
        
        p {
            margin: 10px 0;
            line-height: 1.6;
        }
        
        .action-btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
        }
        
        .action-btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 Your Debugging Patterns</h1>
        <p class="subtitle">Analyzed ${total_bugs} bugs from the last 7 days</p>
    </div>
    
    ${insightCards || '<p>No patterns detected yet. Keep debugging!</p>'}
</body>
</html>
        `;
    }

    private getEmptyPatternsHTML(): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 60px 20px;
            text-align: center;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        
        .icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        
        h1 {
            font-size: 24px;
            margin-bottom: 10px;
        }
        
        p {
            opacity: 0.8;
            max-width: 500px;
            margin: 0 auto;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="icon">🔍</div>
    <h1>No Patterns Yet</h1>
    <p>Capture a few more bugs and Deja-Bug will start detecting patterns to help you improve!</p>
</body>
</html>
        `;
    }

    private getMonthlyInsightsHTML(insights: any): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            margin: 0;
        }
        
        .container {
            max-width: 700px;
            margin: 0 auto;
        }
        
        h1 {
            font-size: 32px;
            margin-bottom: 30px;
        }
        
        .section {
            background: rgba(255, 255, 255, 0.1);
            padding: 25px;
            border-radius: 12px;
            margin: 20px 0;
            backdrop-filter: blur(10px);
        }
        
        .section h2 {
            font-size: 20px;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        li {
            padding: 10px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        li:last-child {
            border-bottom: none;
        }
        
        .share-btn {
            background: white;
            color: #667eea;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎓 Your Debugging Insights</h1>
        
        <div class="section">
            <h2>💡 Common Mistakes</h2>
            <ul>
                ${insights.common_mistakes?.map((m: string) => `<li>${m}</li>`).join('') || '<li>Keep debugging to learn more!</li>'}
            </ul>
        </div>
        
        <div class="section">
            <h2>🛡️ Prevention Tips</h2>
            <ul>
                ${insights.prevention_tips?.map((t: string) => `<li>${t}</li>`).join('') || '<li>Tips will appear as you debug more!</li>'}
            </ul>
        </div>
        
        <div class="section">
            <h2>📈 Your Progress</h2>
            <p>${JSON.stringify(insights.learning_progress || {}).replace(/[{}"]/g, '').replace(/,/g, ', ')}</p>
        </div>
        
        <button class="share-btn" onclick="share()">📤 Share My Progress</button>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        function share() {
            vscode.postMessage({ command: 'share' });
        }
    </script>
</body>
</html>
        `;
    }

    private async shareInsights(insights: any): Promise<void> {
        const text = `🎓 My Debugging Insights from Deja-Bug!\n\n` +
            `💡 I've learned: ${insights.common_mistakes?.[0] || 'To debug better!'}\n\n` +
            `📈 Progress: Getting faster and smarter!\n\n#DejaBug #Debugging`;

        await vscode.env.clipboard.writeText(text);
        vscode.window.showInformationMessage('📋 Insights copied! Share on social media!');
    }

    private log(message: string): void {
        this.outputChannel.appendLine(`[${new Date().toISOString()}] ${message}`);
    }

    dispose() {
        this.outputChannel.dispose();
    }
}
