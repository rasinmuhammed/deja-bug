import * as vscode from 'vscode';

/**
 * Welcome walkthrough shown on first run
 */
export async function showWelcomeWalkthrough(context: vscode.ExtensionContext): Promise<void> {
    // Check if already seen
    if (context.globalState.get('hasSeenWelcome')) {
        return;
    }

    const panel = vscode.window.createWebviewPanel(
        'dejaBugWelcome',
        '🎉 Welcome to Deja-Bug',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );

    panel.webview.html = getWelcomeHTML();

    // Handle messages
    panel.webview.onDidReceiveMessage(async message => {
        switch (message.command) {
            case 'installOllama':
                vscode.env.openExternal(vscode.Uri.parse('https://ollama.com/download'));
                break;
            case 'getStarted':
                context.globalState.update('hasSeenWelcome', true);
                panel.dispose();
                vscode.window.showInformationMessage(
                    '🐛 Deja-Bug is ready! Try Cmd+Shift+D to capture any bug.'
                );
                break;
            case 'skip':
                context.globalState.update('hasSeenWelcome', true);
                panel.dispose();
                break;
        }
    });
}

function getWelcomeHTML(): string {
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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 60px 40px;
            min-height: 100vh;
        }

        .container {
            max-width: 700px;
            margin: 0 auto;
        }

        h1 {
            font-size: 48px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 15px
        }

        .subtitle {
            font-size: 24px;
            opacity: 0.9;
            margin-bottom: 50px;
        }

        .features {
            display: grid;
            gap: 20px;
            margin: 40px 0;
        }

        .feature {
            background: rgba(255, 255, 255, 0.1);
            padding: 25px;
            border-radius: 12px;
            border-left: 4px solid rgba(255, 255, 255, 0.5);
        }

        .feature-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .feature-desc {
            opacity: 0.9;
            line-height: 1.6;
        }

        .shortcuts {
            background: rgba(255, 255, 255, 0.15);
            padding: 30px;
            border-radius: 12px;
            margin: 30px 0;
        }

        .shortcut {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .shortcut:last-child {
            border-bottom: none;
        }

        .key {
            background: rgba(255, 255, 255, 0.2);
            padding: 6px 12px;
            border-radius: 6px;
            font-family: monospace;
            font-weight: 600;
        }

        .actions {
            display: flex;
            gap: 15px;
            margin-top: 40px;
        }

        button {
            flex: 1;
            padding: 16px 24px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .primary {
            background: white;
            color: #667eea;
        }

        .secondary {
            background: rgba(255, 255, 255, 0.2);
            color: white;
        }

        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        button:active {
            transform: translateY(0);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>
            <span>🐛</span>
            <span>Welcome to Deja-Bug!</span>
        </h1>
        
        <p class="subtitle">
            Your AI-powered debugging journal is ready
        </p>

        <div class="features">
            <div class="feature">
                <div class="feature-title">
                    <span>🎯</span>
                    <span>Auto-Detect Errors</span>
                </div>
                <p class="feature-desc">
                    Deja-Bug automatically watches your terminal for errors. No setup needed!
                </p>
            </div>

            <div class="feature">
                <div class="feature-title">
                    <span>🧠</span>
                    <span>AI Analysis</span>
                </div>
                <p class="feature-desc">
                    Local LLM analyzes your fixes and extracts key learnings. Works with Cursor, Copilot, or Ollama.
                </p>
            </div>

            <div class="feature">
                <div class="feature-title">
                    <span>🔍</span>
                    <span>Semantic Search</span>
                </div>
                <p class="feature-desc">
                    Find similar bugs you've fixed before using vector-based search.
                </p>
            </div>

            <div class="feature">
                <div class="feature-title">
                    <span>🔐</span>
                    <span>100% Private</span>
                </div>
                <p class="feature-desc">
                    Everything runs locally. Your code never leaves your machine.
                </p>
            </div>
        </div>

        <div class="shortcuts">
            <h3 style="margin-bottom: 20px;">⌨️ Keyboard Shortcuts</h3>
            
            <div class="shortcut">
                <span>Force capture current bug</span>
                <span class="key">Cmd + Shift + D</span>
            </div>

            <div class="shortcut">
                <span>View bug timeline</span>
                <span class="key">Cmd + Shift + P → Timeline</span>
            </div>

            <div class="shortcut">
                <span>Search past bugs</span>
                <span class="key">Cmd + Shift + P → Search</span>
            </div>
        </div>

        <div class="actions">
            <button class="primary" onclick="getStarted()">
                🚀 Get Started
            </button>
            <button class="secondary" onclick="skip()">
                Skip Tour
            </button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        function getStarted() {
            vscode.postMessage({ command: 'getStarted' });
        }
        
        function skip() {
            vscode.postMessage({ command: 'skip' });
        }
    </script>
</body>
</html>
    `;
}
