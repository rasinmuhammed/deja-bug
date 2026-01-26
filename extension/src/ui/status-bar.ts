import * as vscode from 'vscode';

/**
 * Status Bar Item for Deja-Bug
 * Shows bug count and LLM status
 */
export class DejaBugStatusBar {
    private statusBarItem: vscode.StatusBarItem;
    private bugCount = 0;
    private llmProvider = 'None';

    constructor(context: vscode.ExtensionContext) {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        
        this.statusBarItem.command = 'deja-bug.showTimeline';
        
        // Load saved bug count
        this.bugCount = context.globalState.get('totalBugs', 0);
        
        this.update();
        this.statusBarItem.show();
        
        context.subscriptions.push(this.statusBarItem);
    }

    setLLMProvider(name: string) {
        this.llmProvider = name;
        this.update();
    }

    onBugCaptured() {
        this.bugCount++;
        
        // Pulse animation
        this.statusBarItem.text = `$(bug~spin) ${this.bugCount}`;
        
        setTimeout(() => {
            this.update();
        }, 2000);
    }

    update() {
        if (this.bugCount === 0) {
            this.statusBarItem.text = `$(bug) Deja-Bug`;
        } else {
            this.statusBarItem.text = `$(bug) ${this.bugCount} bug${this.bugCount === 1 ? '' : 's'}`;
        }

        const tooltipLines = [
            '🐛 Deja-Bug Active',
            '',
            `Bugs captured: ${this.bugCount}`,
            `AI Provider: ${this.llmProvider}`,
            '',
            '💡 Click to view timeline'
        ];

        this.statusBarItem.tooltip = tooltipLines.join('\n');
    }

    getBugCount(): number {
        return this.bugCount;
    }

    dispose() {
        this.statusBarItem.dispose();
    }
}
