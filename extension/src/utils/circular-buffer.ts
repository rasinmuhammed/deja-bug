import * as vscode from 'vscode';

/**
 * Circular buffer for efficient terminal output storage
 */
export class CircularBuffer {
    private buffer: string[];
    private maxSize: number;
    private head: number = 0;
    private size: number = 0;

    constructor(maxSize: number) {
        this.maxSize = maxSize;
        this.buffer = new Array(maxSize);
    }

    /**
     * Add a line to the buffer
     */
    append(line: string): void {
        this.buffer[this.head] = line;
        this.head = (this.head + 1) % this.maxSize;
        if (this.size < this.maxSize) {
            this.size++;
        }
    }

    /**
     * Get the last N lines from the buffer
     */
    getLast(n: number): string {
        const count = Math.min(n, this.size);
        const lines: string[] = [];

        for (let i = 0; i < count; i++) {
            const index = (this.head - count + i + this.maxSize) % this.maxSize;
            lines.push(this.buffer[index]);
        }

        return lines.join('');
    }

    /**
     * Get all lines from the buffer
     */
    getAll(): string {
        return this.getLast(this.size);
    }

    /**
     * Clear the buffer
     */
    clear(): void {
        this.size = 0;
        this.head = 0;
    }
}
