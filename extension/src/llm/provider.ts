/**
 * LLM Provider Interface
 * Abstracts different LLM backends (Cursor, Copilot, Ollama)
 */

export interface BugSummary {
    root_cause: string;
    fix_explanation: string;
    learning: string;
    tags: string[];
}

export interface LLMProvider {
    readonly name: string;
    readonly displayName: string;
    
    /**
     * Check if this provider is available in the current environment
     */
    available(): Promise<boolean>;
    
    /**
     * Analyze a bug and generate a summary
     */
    analyze(errorLog: string, gitDiff: string, timeToFix: number): Promise<BugSummary>;
    
    /**
     * Generate embeddings for semantic search (optional)
     */
    embed?(text: string): Promise<number[]>;
}

export interface LLMConfig {
    preferredProvider?: string;
    fallbackChain: string[];
    aiEnabled: boolean;
}
