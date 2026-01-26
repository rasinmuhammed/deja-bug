import { LLMProvider, BugSummary } from './provider';
import { MCPClient } from '../mcp/client';

/**
 * Ollama Provider (via MCP)
 * Uses existing MCP server with local Ollama
 */
export class OllamaProvider implements LLMProvider {
    readonly name = 'ollama';
    readonly displayName = 'Ollama (Local)';

    constructor(private mcpClient: MCPClient) {}

    async available(): Promise<boolean> {
        try {
            // Check if MCP client is initialized and Ollama is running
            const result = await this.mcpClient.callTool('health_check', {});
            return result?.status === 'ok';
        } catch {
            return false;
        }
    }

    async analyze(errorLog: string, gitDiff: string, timeToFix: number): Promise<BugSummary> {
        try {
            const result = await this.mcpClient.callTool('analyze_bug', {
                bug_id: '', // Not needed for standalone analysis
                error_log: errorLog,
                git_diff: gitDiff,
                time_to_fix: timeToFix,
                modified_files: []
            });

            if (result.status === 'error') {
                throw new Error(result.error);
            }

            return result.summary;
        } catch (error) {
            console.error('Ollama provider error:', error);
            throw error;
        }
    }

    async embed(text: string): Promise<number[]> {
        try {
            const result = await this.mcpClient.callTool('embed_text', { text });
            return result.embedding;
        } catch (error) {
            console.error('Ollama embedding error:', error);
            throw error;
        }
    }
}
