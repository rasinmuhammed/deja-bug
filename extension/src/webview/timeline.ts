import * as vscode from 'vscode';
import { MCPClient } from '../mcp/client';

/**
 * Enhanced Timeline Panel
 * Shows debugging journey with real data, stats, and search
 */
export class BugTimelinePanel {
    public static currentPanel: BugTimelinePanel | undefined;
    private readonly panel: vscode.WebviewPanel;
    private disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri, mcpClient: MCPClient | undefined) {
        const column = vscode.ViewColumn.One;

        // If we already have a panel, show it
        if (BugTimelinePanel.currentPanel) {
            BugTimelinePanel.currentPanel.panel.reveal(column);
            BugTimelinePanel.currentPanel.refresh(mcpClient);
            return;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            'bugTimeline',
            '🐛 Bug Timeline',
            column,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        BugTimelinePanel.currentPanel = new BugTimelinePanel(panel, extensionUri, mcpClient);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, private mcpClient: MCPClient | undefined) {
        this.panel = panel;

        // Set initial HTML
        this.update();

        // Listen for when the panel is disposed
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

        // Handle messages from webview
        this.panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'refresh':
                        await this.refresh(this.mcpClient);
                        break;
                    case 'search':
                        await this.search(message.query);
                        break;
                    case 'openBug':
                        await this.openBugReport(message.bugId);
                        break;
                    case 'exportGist':
                        await this.exportToGist(message.bugId);
                        break;
                }
            },
            null,
            this.disposables
        );
    }

    private async refresh(mcpClient: MCPClient | undefined) {
        if (!mcpClient) {
            this.panel.webview.html = this.getLoadingHTML();
            return;
        }

        try {
            // Fetch bugs and stats
            const [bugsResult, statsResult] = await Promise.all([
                mcpClient.callTool('get_all_bugs', { limit: 50 }),
                mcpClient.callTool('get_stats', {})
            ]);

            if (bugsResult.status === 'success' && bugsResult.bugs) {
                this.panel.webview.html = this.getTimelineHTML(bugsResult.bugs, statsResult);
            } else {
                this.panel.webview.html = this.getEmptyStateHTML();
            }
        } catch (error) {
            this.panel.webview.html = this.getErrorHTML(String(error));
        }
    }

    private async update() {
        this.panel.webview.html = this.getLoadingHTML();
        await this.refresh(this.mcpClient);
    }

    private async search(query: string) {
        if (!this.mcpClient || !query) return;

        try {
            const result = await this.mcpClient.callTool('get_all_bugs', {
                limit: 50,
                search: query
            });

            if (result.status === 'success') {
                const stats = await this.mcpClient.callTool('get_stats', {});
                this.panel.webview.html = this.getTimelineHTML(result.bugs, stats, query);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Search failed: ${error}`);
        }
    }

    private async openBugReport(bugId: string) {
        const reportPath = `${process.env.HOME}/.deja-bug/bugs/${bugId}.md`;
        try {
            const doc = await vscode.workspace.openTextDocument(reportPath);
            await vscode.window.showTextDocument(doc);
        } catch (error) {
            vscode.window.showErrorMessage(`Could not open bug report: ${error}`);
        }
    }

    private async exportToGist(bugId: string) {
        vscode.window.showInformationMessage('GitHub Gist export coming soon!');
        // TODO: Implement Gist export
    }

    private getLoadingHTML(): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-family: var(--vscode-font-family);
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .spinner {
            font-size: 48px;
            animation: spin 2s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="spinner">🐛</div>
</body>
</html>
        `;
    }

    private getEmptyStateHTML(): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: var(--vscode-font-family);
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            padding: 60px 40px;
            text-align: center;
        }
        .icon { font-size: 72px; margin-bottom: 20px; }
        h1 { font-size: 28px; margin-bottom: 15px; }
        p { opacity: 0.8; max-width: 500px; margin: 0 auto 30px; line-height: 1.6; }
        .cta {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 15px;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="icon">🐛</div>
    <h1>No Bugs Captured Yet</h1>
    <p>Start debugging and Deja-Bug will automatically capture your error fixes. Use <code>Cmd+Shift+D</code> to manually capture.</p>
    <button class="cta" onclick="refresh()">Refresh</button>
    
    <script>
        const vscode = acquireVsCodeApi();
        function refresh() {
            vscode.postMessage({ command: 'refresh' });
        }
    </script>
</body>
</html>
        `;
    }

    private getErrorHTML(error: string): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: var(--vscode-font-family);
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            padding: 40px;
        }
        .error {
            background: rgba(244, 135, 113, 0.1);
            border-left: 4px solid #f48771;
            padding: 20px;
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <div class="error">
        <h2>⚠️ Error Loading Timeline</h2>
        <p>${error}</p>
        <button onclick="location.reload()">Retry</button>
    </div>
</body>
</html>
        `;
    }

    private getTimelineHTML(bugs: any[], stats: any, searchQuery?: string): string {
        const bugCards = bugs.map(bug => this.getBugCardHTML(bug)).join('');

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: var(--vscode-font-family);
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            padding: 30px;
        }
        
        .header {
            margin-bottom: 30px;
        }
        
        h1 {
            font-size: 32px;
            margin-bottom: 20px;
        }
        
        /* Stats Dashboard */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: var(--vscode-editor-inactiveSelectionBackground);
            padding: 20px;
            border-radius: 12px;
            border: 1px solid var(--vscode-panel-border);
            text-align: center;
        }
        
        .stat-value {
            font-size: 36px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .stat-label {
            opacity: 0.8;
            font-size: 14px;
        }
        
        /* Search Bar */
        .search-container {
            margin-bottom: 25px;
        }
        
        .search-input {
            width: 100%;
            padding: 12px 16px;
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 8px;
            color: var(--vscode-input-foreground);
            font-size: 15px;
            font-family: var(--vscode-font-family);
        }
        
        .searchinput:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
        
        /* Bug Cards */
        .bug-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .bug-card {
            background: var(--vscode-editor-inactiveSelectionBackground);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 10px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .bug-card:hover {
            border-color: var(--vscode-focusBorder);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .bug-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }
        
        .bug-title {
            font-size: 16px;
            font-weight: 600;
        }
        
        .bug-time {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
            opacity: 0.7;
        }
        
        .bug-description {
            margin: 12px 0;
            line-height: 1.5;
            opacity: 0.9;
        }
        
        .bug-tags {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: 12px;
        }
        
        .tag {
            background: rgba(102, 126, 234, 0.2);
            color: #667eea;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 13px;
        }
        
        .bug-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid var(--vscode-panel-border);
        }
        
        .bug-date {
            font-size: 13px;
            opacity: 0.7;
        }
        
        .bug-actions {
            display: flex;
            gap: 8px;
        }
        
        .action-btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 13px;
            cursor: pointer;
        }
        
        .action-btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        @media print {
            body { background: white; color: black; }
            .stats-grid, .search-container, .bug-actions { display: none; }
            .bug-card { page-break-inside: avoid; border: 1px solid #ddd; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🐛 Your Debugging Journey</h1>
    </div>
    
    <!-- Stats Dashboard -->
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-value">${stats?.total_bugs || 0}</div>
            <div class="stat-label">Bugs Fixed</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats?.avg_fix_time || '0s'}</div>
            <div class="stat-label">Avg Fix Time</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">🔥 ${stats?.streak || 0}</div>
            <div class="stat-label">Day Streak</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats?.this_week || 0}</div>
            <div class="stat-label">This Week</div>
        </div>
    </div>
    
    <!-- Search -->
    <div class="search-container">
        <input 
            type="search" 
            class="search-input"
            placeholder="🔍 Search bugs... (e.g., 'null pointer', 'timeout', 'python')"
            value="${searchQuery || ''}"
            onkeyup="handleSearch(event)"
        />
    </div>
    
    <!-- Bug List -->
    <div class="bug-list">
        ${bugCards || '<p>No bugs found</p>'}
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        function handleSearch(event) {
            if (event.key === 'Enter') {
                vscode.postMessage({
                    command: 'search',
                    query: event.target.value
                });
            }
        }
        
        function openBug(bugId) {
            vscode.postMessage({
                command: 'openBug',
                bugId: bugId
            });
        }
        
        function exportGist(bugId, event) {
            event.stopPropagation();
            vscode.postMessage({
                command: 'exportGist',
                bugId: bugId
            });
        }
    </script>
</body>
</html>
        `;
    }

    private getBugCardHTML(bug: any): string {
        const tags = bug.tags || [];
        const tagsHTML = tags.map((tag: string) => `<span class="tag">${tag}</span>`).join('');
        
        return `
        <div class="bug-card" onclick="openBug('${bug.bug_id}')">
            <div class="bug-header">
                <div class="bug-title">${bug.root_cause || 'Bug Analysis'}</div>
                <div class="bug-time">⚡ ${bug.time_to_fix || 'N/A'}</div>
            </div>
            
            <div class="bug-tags">
                ${tagsHTML || '<span class="tag">untagged</span>'}
            </div>
            
            <div class="bug-footer">
                <div class="bug-date">${bug.date || bug.created || 'Unknown date'}</div>
                <div class="bug-actions">
                    <button class="action-btn" onclick="exportGist('${bug.bug_id}', event)">
                        📤 Share
                    </button>
                </div>
            </div>
        </div>
        `;
    }

    public dispose() {
        BugTimelinePanel.currentPanel = undefined;

        this.panel.dispose();

        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
