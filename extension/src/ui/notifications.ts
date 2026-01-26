import * as vscode from 'vscode';
import { BugSummary } from '../llm/provider';

/**
 * Rich notification system
 * Shows beautiful webview panels for bug analysis
 */

export async function showBugAnalyzed(
    bugId: string,
    summary: BugSummary,
    reportPath: string
): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
        'bugSummary',
        '🐛 Bug Analyzed',
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    panel.webview.html = getBugSummaryHTML(summary);

    // Handle messages from webview
    panel.webview.onDidReceiveMessage(async message => {
        switch (message.command) {
            case 'viewReport':
                await openReport(reportPath);
                panel.dispose();
                break;
            case 'searchSimilar':
                await vscode.commands.executeCommand('deja-bug.searchBugs', summary.root_cause);
                break;
            case 'share':
                await shareToClipboard(summary);
                vscode.window.showInformationMessage('📋 Summary copied to clipboard!');
                break;
        }
    });
}

async function openReport(reportPath: string) {
    try {
        const doc = await vscode.workspace.openTextDocument(reportPath);
        await vscode.window.showTextDocument(doc, {
            preview: true,
            viewColumn: vscode.ViewColumn.One
        });
    } catch (error) {
        vscode.window.showErrorMessage(`Could not open report: ${error}`);
    }
}

async function shareToClipboard(summary: BugSummary) {
    const text = `🐛 Bug Analysis:\n\n${summary.root_cause}\n\n💡 Learning: ${summary.learning}\n\n${summary.tags.map(t => `#${t}`).join(' ')}`;
    await vscode.env.clipboard.writeText(text);
}

function getBugSummaryHTML(summary: BugSummary): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: var(--vscode-font-family);
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }

        .container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px;
            color: white;
            min-height: 100vh;
        }

        .header {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .icon {
            font-size: 32px;
        }

        .section {
            margin: 30px 0;
        }

        .section-title {
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            opacity: 0.8;
            margin-bottom: 10px;
        }

        .root-cause {
            font-size: 18px;
            line-height: 1.6;
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 12px;
            border-left: 4px solid rgba(255, 255, 255, 0.5);
        }

        .fix-explanation {
            font-size: 16px;
            line-height: 1.6;
            background: rgba(255, 255, 255, 0.08);
            padding: 20px;
            border-radius: 12px;
        }

        .learning {
            font-size: 16px;
            line-height: 1.6;
            background: rgba(255, 255, 255, 0.08);
            padding: 20px;
            border-radius: 12px;
            font-style: italic;
        }

        .tags {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 20px;
        }

        .tag {
            background: rgba(255, 255, 255, 0.2);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
        }

        .actions {
            display: flex;
            gap: 12px;
            margin-top: 40px;
            flex-wrap: wrap;
        }

        button {
            background: white;
            color: #667eea;
            border: none;
            padding: 14px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 15px;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        button:active {
            transform: translateY(0);
        }

        .primary {
            background: white;
        }

        .secondary {
            background: rgba(255, 255, 255, 0.2);
            color: white;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <span class="icon">🎯</span>
            <span>Root Cause Found</span>
        </div>

        <div class="section">
            <div class="section-title">🔍 What Went Wrong</div>
            <div class="root-cause">
                ${escapeHtml(summary.root_cause)}
            </div>
        </div>

        <div class="section">
            <div class="section-title">🛠️ The Fix</div>
            <div class="fix-explanation">
                ${escapeHtml(summary.fix_explanation)}
            </div>
        </div>

        <div class="section">
            <div class="section-title">💡 Key Learning</div>
            <div class="learning">
                "${escapeHtml(summary.learning)}"
            </div>
        </div>

        <div class="tags">
            ${summary.tags.map(tag => `<span class="tag">#${escapeHtml(tag)}</span>`).join('')}
        </div>

        <div class="actions">
            <button class="primary" onclick="viewReport()">
                📄 View Full Report
            </button>
            <button class="secondary" onclick="searchSimilar()">
                🔍 Find Similar Bugs
            </button>
            <button class="secondary" onclick="share()">
                📤 Copy to Clipboard
            </button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        function viewReport() {
            vscode.postMessage({ command: 'viewReport' });
        }
        
        function searchSimilar() {
            vscode.postMessage({ command: 'searchSimilar' });
        }
        
        function share() {
            vscode.postMessage({ command: 'share' });
        }
    </script>
</body>
</html>
    `;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
