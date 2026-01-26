import * as vscode from 'vscode';
import { LLMProvider, BugSummary, LLMConfig } from './provider';
import { CursorProvider } from './cursor-provider';
import { CopilotProvider } from './copilot-provider';
import { OllamaProvider } from './ollama-provider';
import { MCPClient } from '../mcp/client';

/**
 * LLM Manager
 * Handles provider detection, selection, and fallback
 */
export class LLMManager {
    private providers: Map<string, LLMProvider> = new Map();
    private activeProvider: LLMProvider | null = null;
    private outputChannel: vscode.OutputChannel;

    constructor(private mcpClient: MCPClient) {
        this.outputChannel = vscode.window.createOutputChannel('Deja-Bug LLM');
        
        // Register all providers
        this.providers.set('cursor', new CursorProvider());
        this.providers.set('copilot', new CopilotProvider());
        this.providers.set('ollama', new OllamaProvider(mcpClient));
    }

    /**
     * Detect and initialize the best available LLM provider
     */
    async initialize(): Promise<boolean> {
        this.log('🔍 Detecting available LLM providers...');

        const config = this.getConfig();
        
        if (!config.aiEnabled) {
            this.log('❌ AI features disabled in settings');
            return false;
        }

        // Try preferred provider first if set
        if (config.preferredProvider) {
            const preferred = this.providers.get(config.preferredProvider);
            if (preferred && await preferred.available()) {
                this.activeProvider = preferred;
                this.log(`✅ Using preferred provider: ${preferred.displayName}`);
                return true;
            }
        }

        // Fallback chain: Cursor → Copilot → Ollama
        const fallbackChain = config.fallbackChain || ['cursor', 'copilot', 'ollama'];
        
        for (const providerName of fallbackChain) {
            const provider = this.providers.get(providerName);
            if (!provider) continue;

            this.log(`Checking ${provider.displayName}...`);
            
            if (await provider.available()) {
                this.activeProvider = provider;
                this.log(`✅ Using ${provider.displayName}`);
                
                // Show notification if using fallback
                if (providerName !== 'cursor') {
                    vscode.window.showInformationMessage(
                        `Deja-Bug AI powered by ${provider.displayName}`
                    );
                }
                
                return true;
            }
        }

        // No provider available
        this.log('❌ No LLM provider available');
        this.showNoProviderWarning();
        return false;
    }

    /**
     * Analyze a bug using the active provider
     */
    async analyze(errorLog: string, gitDiff: string, timeToFix: number): Promise<BugSummary | null> {
        if (!this.activeProvider) {
            this.log('⚠️ No active LLM provider, skipping analysis');
            return null;
        }

        try {
            this.log(`🧠 Analyzing with ${this.activeProvider.displayName}...`);
            const summary = await this.activeProvider.analyze(errorLog, gitDiff, timeToFix);
            this.log('✅ Analysis complete');
            return summary;
        } catch (error) {
            this.log(`❌ Analysis failed: ${error}`);
            
            // Try fallback to next provider
            return await this.tryFallback(errorLog, gitDiff, timeToFix);
        }
    }

    /**
     * Try next provider in fallback chain
     */
    private async tryFallback(errorLog: string, gitDiff: string, timeToFix: number): Promise<BugSummary | null> {
        const currentName = this.activeProvider?.name;
        const config = this.getConfig();
        const chain = config.fallbackChain || ['cursor', 'copilot', 'ollama'];
        
        const currentIndex = chain.indexOf(currentName || '');
        const remainingProviders = chain.slice(currentIndex + 1);

        for (const providerName of remainingProviders) {
            const provider = this.providers.get(providerName);
            if (!provider) continue;

            if (await provider.available()) {
                this.log(`📦 Falling back to ${provider.displayName}`);
                this.activeProvider = provider;
                
                try {
                    return await provider.analyze(errorLog, gitDiff, timeToFix);
                } catch (error) {
                    this.log(`❌ ${provider.displayName} also failed`);
                    continue;
                }
            }
        }

        return null;
    }

    /**
     * Get embedding using active provider (if supported)
     */
    async embed(text: string): Promise<number[] | null> {
        if (!this.activeProvider?.embed) {
            return null;
        }

        try {
            return await this.activeProvider.embed(text);
        } catch {
            return null;
        }
    }

    /**
     * Get current provider info
     */
    getProviderInfo(): { name: string; displayName: string } | null {
        if (!this.activeProvider) {
            return null;
        }

        return {
            name: this.activeProvider.name,
            displayName: this.activeProvider.displayName
        };
    }

    private getConfig(): LLMConfig {
        const config = vscode.workspace.getConfiguration('deja-bug');
        return {
            preferredProvider: config.get('llm.preferredProvider'),
            fallbackChain: config.get('llm.fallbackChain', ['cursor', 'copilot', 'ollama']),
            aiEnabled: config.get('aiEnabled', true)
        };
    }

    private showNoProviderWarning() {
        vscode.window.showWarningMessage(
            'No AI provider found. Deja-Bug will capture bugs without analysis.',
            'Install Ollama',
            'Use Cursor AI',
            'Disable Warning'
        ).then(choice => {
            if (choice === 'Install Ollama') {
                vscode.env.openExternal(vscode.Uri.parse('https://ollama.com/download'));
            } else if (choice === 'Use Cursor AI') {
                vscode.window.showInformationMessage(
                    'Enable Cursor AI in settings or open in Cursor IDE'
                );
            } else if (choice === 'Disable Warning') {
                vscode.workspace.getConfiguration('deja-bug').update('aiEnabled', false, true);
            }
        });
    }

    private log(message: string) {
        this.outputChannel.appendLine(`[${new Date().toISOString()}] ${message}`);
    }

    dispose() {
        this.outputChannel.dispose();
    }
}
