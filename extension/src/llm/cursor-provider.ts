import * as vscode from 'vscode';
import { LLMProvider, BugSummary } from './provider';

/**
 * Cursor AI Provider
 * Uses VS Code's Language Model API (vscode.lm)
 */
export class CursorProvider implements LLMProvider {
    readonly name = 'cursor';
    readonly displayName = 'Cursor AI';

    async available(): Promise<boolean> {
        try {
            // Check if VS Code Language Model API is available
            const models = await vscode.lm.selectChatModels();
            return models.length > 0;
        } catch {
            return false;
        }
    }

    async analyze(errorLog: string, gitDiff: string, timeToFix: number): Promise<BugSummary> {
        try {
            const models = await vscode.lm.selectChatModels();
            if (!models.length) {
                throw new Error('No LLM models available');
            }

            const model = models[0];
            
            const prompt = this.buildPrompt(errorLog, gitDiff, timeToFix);
            
            const messages = [
                vscode.LanguageModelChatMessage.User(prompt)
            ];

            const response = await model.sendRequest(messages, {});
            
            let fullResponse = '';
            for await (const chunk of response.text) {
                fullResponse += chunk;
            }

            return this.parseSummary(fullResponse);
        } catch (error) {
            console.error('Cursor provider error:', error);
            throw error;
        }
    }

    private buildPrompt(errorLog: string, gitDiff: string, timeToFix: number): string {
        return `You are a debugging expert. Analyze this bug and provide insights in JSON format.

ERROR LOG:
${errorLog}

CODE CHANGES (git diff):
${gitDiff || 'No diff available'}

TIME TO FIX: ${timeToFix} seconds

Respond ONLY with valid JSON in this exact format:
{
  "root_cause": "Brief explanation of what caused the error",
  "fix_explanation": "How the fix addresses the root cause",
  "learning": "Key takeaway or best practice",
  "tags": ["tag1", "tag2", "tag3"]
}

Tags should be lowercase, 1-2 words each (e.g., "null-pointer", "type-error", "python").`;
    }

    private parseSummary(response: string): BugSummary {
        try {
            // Extract JSON from response (handle markdown code blocks)
            const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || 
                             response.match(/(\{[\s\S]*\})/);
            
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            const parsed = JSON.parse(jsonMatch[1]);
            
            return {
                root_cause: parsed.root_cause || 'Unable to determine root cause',
                fix_explanation: parsed.fix_explanation || 'Unable to determine fix',
                learning: parsed.learning || 'No specific learning extracted',
                tags: Array.isArray(parsed.tags) ? parsed.tags : []
            };
        } catch (error) {
            console.error('Failed to parse LLM response:', error);
            return {
                root_cause: 'LLM analysis failed to parse',
                fix_explanation: 'Could not extract fix explanation',
                learning: 'Review the error log manually',
                tags: []
            };
        }
    }
}
