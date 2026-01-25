/**
 * Common error patterns to detect in terminal output
 */
export interface ErrorPattern {
    pattern: RegExp;
    severity: 'error' | 'warning';
    description: string;
}

export const ERROR_PATTERNS: ErrorPattern[] = [
    // Generic error keywords
    {
        pattern: /Error:|ERROR:|error:/,
        severity: 'error',
        description: 'Generic error keyword'
    },
    {
        pattern: /Exception:|EXCEPTION:/,
        severity: 'error',
        description: 'Exception thrown'
    },
    {
        pattern: /FAIL:|FAILED:|Failed:/,
        severity: 'error',
        description: 'Test or operation failed'
    },

    // JavaScript/TypeScript errors
    {
        pattern: /TypeError:|ReferenceError:|SyntaxError:/,
        severity: 'error',
        description: 'JavaScript runtime error'
    },
    {
        pattern: /Cannot read propert(y|ies) .* of undefined/,
        severity: 'error',
        description: 'Null/undefined access'
    },

    // Python errors
    {
        pattern: /Traceback \(most recent call last\)/,
        severity: 'error',
        description: 'Python traceback'
    },
    {
        pattern: /NameError:|AttributeError:|KeyError:/,
        severity: 'error',
        description: 'Python runtime error'
    },

    // Build errors
    {
        pattern: /compilation error/i,
        severity: 'error',
        description: 'Compilation failed'
    },
    {
        pattern: /build failed/i,
        severity: 'error',
        description: 'Build process failed'
    },

    // Test failures
    {
        pattern: /\d+ failing/,
        severity: 'error',
        description: 'Test suite failures'
    },
    {
        pattern: /AssertionError/,
        severity: 'error',
        description: 'Assertion failed'
    }
];

/**
 * Check if terminal output contains an error pattern
 */
export function detectError(output: string): { hasError: boolean; pattern?: ErrorPattern } {
    for (const errorPattern of ERROR_PATTERNS) {
        if (errorPattern.pattern.test(output)) {
            return { hasError: true, pattern: errorPattern };
        }
    }
    return { hasError: false };
}

/**
 * Extract file paths from stack trace
 */
export function extractFilePaths(stackTrace: string): string[] {
    const paths: string[] = [];

    // Match common stack trace patterns
    const patterns = [
        /at .* \((.+?):(\d+):(\d+)\)/g,  // JavaScript: at func (file.ts:10:5)
        /File "(.+?)", line (\d+)/g,     // Python: File "file.py", line 10
        /(?:^|\s)([a-zA-Z0-9_\-./]+\.[a-zA-Z]{2,5}):(\d+)/g  // Generic: file.ext:line
    ];

    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(stackTrace)) !== null) {
            const filePath = match[1];
            if (filePath && !paths.includes(filePath)) {
                paths.push(filePath);
            }
        }
    }

    return paths;
}
