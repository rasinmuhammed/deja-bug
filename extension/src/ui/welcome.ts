import * as vscode from 'vscode';

/**
 * Welcome walkthrough shown on first run
 * Designer-level UI with professional color palette
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
    <title>Welcome to Deja-Bug</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,600;1,9..144,600&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        :root {
            --cream: #EEE8DF;
            --beige: #C4BCB0;
            --deep-ocean: #2C365A;
            --ocean-light: #3d4a6e;
            --text-primary: #1a1a1a;
            --text-secondary: #5a5a5a;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--cream);
            color: var(--text-primary);
            line-height: 1.6;
            padding: 0;
            margin: 0;
            overflow-x: hidden;
        }
        
        .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 60px 40px;
            animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        /* Header */
        .header {
            text-align: center;
            margin-bottom: 80px;
        }
        
        .logo {
            font-size: 72px;
            margin-bottom: 24px;
            display: inline-block;
            animation: bounce 3s ease-in-out infinite;
        }
        
        @keyframes bounce {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            25% { transform: translateY(-15px) rotate(-3deg); }
            75% { transform: translateY(-10px) rotate(3deg); }
        }
        
        h1 {
            font-family: 'Fraunces', serif;
            font-size: 56px;
            font-weight: 600;
            color: var(--deep-ocean);
            margin-bottom: 20px;
            letter-spacing: -0.03em;
            line-height: 1.1;
        }
        
        .subtitle {
            font-size: 20px;
            color: var(--text-secondary);
            font-weight: 400;
            max-width: 600px;
            margin: 0 auto;
            line-height: 1.5;
        }
        
        /* Feature Grid */
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 24px;
            margin-bottom: 70px;
        }
        
        .feature {
            background: white;
            border-radius: 20px;
            padding: 36px 32px;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            border: 2px solid transparent;
            position: relative;
            overflow: hidden;
        }
        
        .feature::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: var(--deep-ocean);
            transform: translateX(-100%);
            transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .feature:hover::before {
            transform: translateX(0);
        }
        
        .feature:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 60px rgba(44, 54, 90, 0.15);
            border-color: var(--beige);
        }
        
        .feature-icon {
            font-size: 48px;
            margin-bottom: 24px;
            display: block;
            filter: grayscale(0.2);
        }
        
        .feature h3 {
            font-size: 22px;
            font-weight: 600;
            color: var(--deep-ocean);
            margin-bottom: 14px;
            letter-spacing: -0.01em;
        }
        
        .feature p {
            color: var(--text-secondary);
            font-size: 15px;
            line-height: 1.7;
        }
        
        /* Shortcuts Section */
        .shortcuts {
            background: var(--deep-ocean);
            color: white;
            border-radius: 24px;
            padding: 48px 44px;
            margin-bottom: 50px;
            position: relative;
            overflow: hidden;
        }
        
        .shortcuts::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -20%;
            width: 500px;
            height: 500px;
            background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
            pointer-events: none;
        }
        
        .shortcuts h2 {
            font-family: 'Fraunces', serif;
            font-size: 32px;
            margin-bottom: 32px;
            font-weight: 600;
            position: relative;
        }
        
        .shortcut-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            position: relative;
        }
        
        .shortcut {
            display: flex;
            align-items: center;
            gap: 20px;
            padding: 20px 24px;
            background: rgba(255, 255, 255, 0.08);
            border-radius: 14px;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .shortcut:hover {
            background: rgba(255, 255, 255, 0.12);
            transform: translateX(4px);
            border-color: rgba(255, 255, 255, 0.2);
        }
        
        .shortcut-key {
            background: rgba(255, 255, 255, 0.15);
            padding: 10px 16px;
            border-radius: 10px;
            font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
            font-size: 13px;
            font-weight: 600;
            white-space: nowrap;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .shortcut-desc {
            font-size: 15px;
            opacity: 0.95;
            line-height: 1.4;
        }
        
        /* Actions */
        .actions {
            display: flex;
            gap: 20px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .btn {
            font-family: 'Inter', sans-serif;
            font-size: 17px;
            font-weight: 600;
            padding: 18px 40px;
            border-radius: 14px;
            border: none;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            letter-spacing: -0.01em;
        }
        
        .btn::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: translate(-50%, -50%);
            transition: width 0.6s, height 0.6s;
        }
        
        .btn:active::before {
            width: 400px;
            height: 400px;
            transition: width 0s, height 0s;
        }
        
        .btn-primary {
            background: var(--deep-ocean);
            color: white;
            box-shadow: 0 8px 24px rgba(44, 54, 90, 0.25);
        }
        
        .btn-primary:hover {
            background: var(--ocean-light);
            transform: translateY(-3px);
            box-shadow: 0 12px 32px rgba(44, 54, 90, 0.35);
        }
        
        .btn-primary:active {
            transform: translateY(-1px);
        }
        
        .btn-secondary {
            background: transparent;
            color: var(--deep-ocean);
            border: 2px solid var(--beige);
        }
        
        .btn-secondary:hover {
            background: var(--beige);
            border-color: var(--beige);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(196, 188, 176, 0.3);
        }
        
        .btn span {
            position: relative;
            z-index: 1;
        }
        
        /* Footer */
        .footer {
            text-align: center;
            margin-top: 70px;
            padding-top: 50px;
            border-top: 2px solid var(--beige);
            color: var(--text-secondary);
            font-size: 15px;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .container {
                padding: 40px 24px;
            }
            
            h1 {
                font-size: 40px;
            }
            
            .features {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            
            .shortcuts {
                padding: 36px 28px;
            }
            
            .shortcut-list {
                grid-template-columns: 1fr;
            }
            
            .actions {
                flex-direction: column;
                width: 100%;
            }
            
            .btn {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🐛</div>
            <h1>Welcome to Deja-Bug</h1>
            <p class="subtitle">Your AI debugging journal that learns from YOUR bugs and makes you a better developer</p>
        </div>
        
        <div class="features">
            <div class="feature">
                <span class="feature-icon">🎯</span>
                <h3>Auto-Detect Errors</h3>
                <p>Watches your terminal and automatically captures bugs the moment they happen. Zero setup required.</p>
            </div>
            
            <div class="feature">
                <span class="feature-icon">🧠</span>
                <h3>AI Analysis</h3>
                <p>Uses Cursor AI, Copilot, or Ollama to analyze root causes and extract learnings from your fixes.</p>
            </div>
            
            <div class="feature">
                <span class="feature-icon">🔍</span>
                <h3>Pattern Detection</h3>
                <p>Learns YOUR patterns and warns you: "You've fixed this 3 times before!"</p>
            </div>
            
            <div class="feature">
                <span class="feature-icon">🔐</span>
                <h3>100% Private</h3>
                <p>Everything runs locally. Your code never leaves your machine. No cloud, no tracking.</p>
            </div>
        </div>
        
        <div class="shortcuts">
            <h2>⌨️ Keyboard Shortcuts</h2>
            <div class="shortcut-list">
                <div class="shortcut">
                    <span class="shortcut-key">⌘⇧D</span>
                    <span class="shortcut-desc">Force capture bug</span>
                </div>
                <div class="shortcut">
                    <span class="shortcut-key">⌘⇧P</span>
                    <span class="shortcut-desc">Show timeline</span>
                </div>
                <div class="shortcut">
                    <span class="shortcut-key">⌘⇧P</span>
                    <span class="shortcut-desc">View patterns</span>
                </div>
            </div>
        </div>
        
        <div class="actions">
            <button class="btn btn-primary" onclick="getStarted()">
                <span>Get Started →</span>
            </button>
            <button class="btn btn-secondary" onclick="skip()">
                <span>Skip for now</span>
            </button>
        </div>
        
        <div class="footer">
            <p>Built with ❤️ for developers who want to learn from every bug</p>
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
