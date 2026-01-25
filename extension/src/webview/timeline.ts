import * as vscode from 'vscode';

export class BugTimelinePanel {
    public static currentPanel: BugTimelinePanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (BugTimelinePanel.currentPanel) {
            BugTimelinePanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'dejaBugTimeline',
            'Deja-Bug Timeline',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [extensionUri]
            }
        );

        BugTimelinePanel.currentPanel = new BugTimelinePanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public dispose() {
        BugTimelinePanel.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.title = 'Deja-Bug Timeline';
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Deja-Bug Timeline</title>
    <style>
        body {
            padding: 20px;
            color: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
        }
        h1 {
            color: var(--vscode-titleBar-activeForeground);
            margin-bottom: 30px;
        }
        .timeline {
            position: relative;
            padding-left: 30px;
        }
        .timeline::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 2px;
            background: var(--vscode-textSeparator-foreground);
        }
        .bug-entry {
            position: relative;
            margin-bottom: 30px;
            padding: 15px;
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
        }
        .bug-entry::before {
            content: '';
            position: absolute;
            left: -37px;
            top: 20px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: var(--vscode-textLink-foreground);
            border: 2px solid var(--vscode-editor-background);
        }
        .bug-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .bug-id {
            font-family: monospace;
            color: var(--vscode-textLink-foreground);
            font-weight: bold;
        }
        .bug-time {
            color: var(--vscode-descriptionForeground);
            font-size: 0.9em;
        }
        .bug-cause {
            margin: 10px 0;
            color: var(--vscode-editor-foreground);
        }
        .tags {
            display: flex;
            gap: 8px;
            margin-top: 10px;
        }
        .tag {
            padding: 4px 8px;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            border-radius: 3px;
            font-size: 0.85em;
        }
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: var(--vscode-descriptionForeground);
        }
        .empty-state h2 {
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <h1>🐛 Deja-Bug Timeline</h1>
    
    <div id="timeline" class="timeline">
        <div class="empty-state">
            <h2>No bugs captured yet</h2>
            <p>Start debugging and Deja-Bug will automatically capture your fixes!</p>
        </div>
    </div>

    <script>
        // TODO: Fetch bugs from MCP server and render
        // For now, showing empty state
    </script>
</body>
</html>`;
    }
}
