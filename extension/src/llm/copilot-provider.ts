import * as vscode from 'vscode';
import { LLMProvider, BugSummary } from './provider';

/**
 * GitHub Copilot Provider
 * Uses GitHub Copilot Chat extension API
 */
export class CopilotProvider implements LLMProvider {
    readonly name = 'copilot';
    readonly displayName = 'GitHub Copilot';

    async available(): Promise<boolean> {
        try {
            // Check if GitHub Copilot extension is installed and active
            const copilotExt = vscode.extensions.getExtension('github.copilot-chat');
            return copilotExt !== undefined && copilotExt.isActive;
        } catch {
            return false;
        }
    }

    async analyze(errorLog: string, gitDiff: string, timeToFix: number): Promise<BugSummary> {
        try {
            const prompt = this.buildPrompt(errorLog, gitDiff, timeToFix);
            
            // Use Copilot Chat API
            const response = await vscode.commands.executeCommand(
                'github.copilot.chat.sendMessages',
                [{
                    role: 'user',
                    content: prompt
                }]
            );

            // Response format varies, try to extract text
            const text = typeof response === 'string' 
                ? response 
                : JSON.stringify(response);

            return this.parseSummary(text);
        } catch (error) {
            console.error('Copilot provider error:', error);
            throw error;
        }
    }

    private buildPrompt(errorLog: string, gitDiff: string, timeToFix: number): string {
        return `Analyze this debugging session and provide insights in JSON format.

ERROR LOG:
${errorLog}

CODE CHANGES:
${gitDiff || 'No diff available'}

TIME TO FIX: ${timeToFix} seconds

Respond with JSON only:
{
  "root_cause": "What caused the error",
  "fix_explanation": "How the fix works",
  "learning": "Key takeaway",
  "tags": ["tag1", "tag2"]
}`;
    }

    private parseSummary(response: string): BugSummary {
        try {
            const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || 
                             response.match(/(\{[\s\S]*\})/);
            
            if (!jsonMatch) {
                throw new Error('No JSON in response');
            }

            const parsed = JSON.parse(jsonMatch[1]);
            
            return {
                root_cause: parsed.root_cause || 'Unable to determine',
                fix_explanation: parsed.fix_explanation || 'Unable to determine',
                learning: parsed.learning || 'No learning extracted',
                tags: Array.isArray(parsed.tags) ? parsed.tags : []
            };
        } catch {
            return {
                root_cause: 'Copilot analysis failed',
                fix_explanation: 'Could not parse response',
                learning: 'Review manually',
                tags: []
            };
        }
    }
}
