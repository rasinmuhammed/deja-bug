import * as vscode from 'vscode';

/**
 * Achievement System
 * Gamifies debugging with unlockable achievements
 */

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    check: (stats: any) => boolean;
}

const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'first_bug',
        title: '🎉 First Capture!',
        description: 'Your debugging journey begins',
        icon: '🐛',
        check: (stats) => stats.totalBugs === 1
    },
    {
        id: 'speed_demon',
        title: '⚡ Speed Demon',
        description: 'Fixed a bug in under 1 minute',
        icon: '⚡',
        check: (stats) => stats.fastestFix && stats.fastestFix < 60
    },
    {
        id: 'streak_3',
        title: '🔥 Getting Warmed Up',
        description: '3-day debugging streak',
        icon: '🔥',
        check: (stats) => stats.streak >= 3
    },
    {
        id: 'streak_7',
        title: '🔥 Week Warrior',
        description: '7-day debugging streak!',
        icon: '🔥🔥',
        check: (stats) => stats.streak >= 7
    },
    {
        id: 'productive_day',
        title: '💪 Productive Day',
        description: 'Fixed 5 bugs in one day',
        icon: '💪',
        check: (stats) => stats.todayCount >= 5
    },
    {
        id: 'bug_hunter',
        title: '🎯 Bug Hunter',
        description: 'Captured 10 bugs total',
        icon: '🎯',
        check: (stats) => stats.totalBugs >= 10
    },
    {
        id: 'veteran',
        title: '🏆 Debugging Veteran',
        description: 'Captured 50 bugs total',
        icon: '🏆',
        check: (stats) => stats.totalBugs >= 50
    }
];

export class AchievementManager {
    private context: vscode.ExtensionContext;
    private outputChannel: vscode.OutputChannel;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.outputChannel = vscode.window.createOutputChannel('Deja-Bug Achievements');
    }

    /**
     * Check for newly unlocked achievements
     */
    async checkAchievements(stats: any): Promise<void> {
        for (const achievement of ACHIEVEMENTS) {
            const unlocked = this.context.globalState.get(`achievement_${achievement.id}`, false);
            
            if (!unlocked && achievement.check(stats)) {
                await this.unlockAchievement(achievement);
            }
        }
    }

    /**
     * Unlock an achievement and show celebration
     */
    private async unlockAchievement(achievement: Achievement): Promise<void> {
        // Mark as unlocked
        await this.context.globalState.update(`achievement_${achievement.id}`, true);
        
        this.outputChannel.appendLine(`🏆 Achievement Unlocked: ${achievement.title}`);

        // Show celebration notification
        const choice = await vscode.window.showInformationMessage(
            `${achievement.icon} ${achievement.title}\n${achievement.description}`,
            'Share 📤',
            'View All'
        );

        if (choice === 'Share') {
            await this.shareAchievement(achievement);
        } else if (choice === 'View All') {
            await this.showAllAchievements();
        }
    }

    /**
     * Share achievement to clipboard
     */
    private async shareAchievement(achievement: Achievement): Promise<void> {
        const text = `🏆 Achievement Unlocked in Deja-Bug!\n\n${achievement.icon} ${achievement.title}\n${achievement.description}\n\n#DejaBug #Debugging`;
        
        await vscode.env.clipboard.writeText(text);
        vscode.window.showInformationMessage('📋 Achievement copied to clipboard! Share it on social media!');
    }

    /**
     * Show all achievements (locked and unlocked)
     */
    private async showAllAchievements(): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'achievements',
            '🏆 Achievements',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        const unlockedIds = new Set<string>();
        for (const achievement of ACHIEVEMENTS) {
            const unlocked = this.context.globalState.get(`achievement_${achievement.id}`, false);
            if (unlocked) {
                unlockedIds.add(achievement.id);
            }
        }

        panel.webview.html = this.getAchievementsHTML(unlockedIds);
    }

    /**
     * Get total unlocked count
     */
    getUnlockedCount(): number {
        let count = 0;
        for (const achievement of ACHIEVEMENTS) {
            if (this.context.globalState.get(`achievement_${achievement.id}`, false)) {
                count++;
            }
        }
        return count;
    }

    private getAchievementsHTML(unlockedIds: Set<string>): string {
        const achievementCards = ACHIEVEMENTS.map(a => {
            const unlocked = unlockedIds.has(a.id);
            return `
                <div class="achievement ${unlocked ? 'unlocked' : 'locked'}">
                    <div class="icon">${unlocked ? a.icon : '🔒'}</div>
                    <div class="content">
                        <h3>${a.title}</h3>
                        <p>${a.description}</p>
                    </div>
                    ${unlocked ? '<div class="badge">✓</div>' : ''}
                </div>
            `;
        }).join('');

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
            text-align: center;
            margin-bottom: 40px;
        }
        
        h1 {
            font-size: 32px;
            margin-bottom: 10px;
        }
        
        .progress {
            font-size: 18px;
            opacity: 0.8;
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .achievement {
            border: 2px solid var(--vscode-panel-border);
            border-radius: 12px;
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
            position: relative;
            transition: all 0.2s;
        }
        
        .achievement.unlocked {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
            border-color: #667eea;
        }
        
        .achievement.locked {
            opacity: 0.5;
        }
        
        .icon {
            font-size: 48px;
        }
        
        .content h3 {
            margin: 0 0 5px 0;
            font-size: 18px;
        }
        
        .content p {
            margin: 0;
            opacity: 0.8;
            font-size: 14px;
        }
        
        .badge {
            position: absolute;
            top: 10px;
            right: 10px;
            background: #667eea;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏆 Achievements</h1>
        <p class="progress">${unlockedIds.size} / ${ACHIEVEMENTS.length} unlocked</p>
    </div>
    
    <div class="grid">
        ${achievementCards}
    </div>
</body>
</html>
        `;
    }

    dispose() {
        this.outputChannel.dispose();
    }
}
