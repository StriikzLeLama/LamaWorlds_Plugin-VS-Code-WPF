import * as vscode from 'vscode';

/**
 * Performance monitoring service
 */
export class PerformanceMonitor {
    private static _instance: PerformanceMonitor | undefined;
    private _metrics: Map<string, number[]> = new Map();
    private _outputChannel: vscode.OutputChannel;

    private constructor() {
        this._outputChannel = vscode.window.createOutputChannel('Lama Worlds Performance');
    }

    public static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor._instance) {
            PerformanceMonitor._instance = new PerformanceMonitor();
        }
        return PerformanceMonitor._instance;
    }

    /**
     * Measure execution time of a function
     */
    public async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
        const start = Date.now();
        try {
            const result = await fn();
            const duration = Date.now() - start;
            this._recordMetric(name, duration);
            return result;
        } catch (error) {
            const duration = Date.now() - start;
            this._recordMetric(`${name}_error`, duration);
            throw error;
        }
    }

    /**
     * Record a metric
     */
    private _recordMetric(name: string, value: number): void {
        if (!this._metrics.has(name)) {
            this._metrics.set(name, []);
        }
        const values = this._metrics.get(name)!;
        values.push(value);

        // Keep only last 100 measurements
        if (values.length > 100) {
            values.shift();
        }

        // Log if performance is poor
        if (value > 1000) {
            this._outputChannel.appendLine(`[PERF] ${name}: ${value}ms (SLOW)`);
        }
    }

    /**
     * Get statistics for a metric
     */
    public getStats(name: string): { avg: number; min: number; max: number; count: number } | null {
        const values = this._metrics.get(name);
        if (!values || values.length === 0) {
            return null;
        }

        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);

        return { avg, min, max, count: values.length };
    }

    /**
     * Show performance report
     */
    public showReport(): void {
        this._outputChannel.clear();
        this._outputChannel.appendLine('=== Performance Report ===\n');

        for (const [name, values] of this._metrics.entries()) {
            const stats = this.getStats(name);
            if (stats) {
                this._outputChannel.appendLine(`${name}:`);
                this._outputChannel.appendLine(`  Average: ${stats.avg.toFixed(2)}ms`);
                this._outputChannel.appendLine(`  Min: ${stats.min}ms`);
                this._outputChannel.appendLine(`  Max: ${stats.max}ms`);
                this._outputChannel.appendLine(`  Count: ${stats.count}`);
                this._outputChannel.appendLine('');
            }
        }

        this._outputChannel.show();
    }

    /**
     * Clear all metrics
     */
    public clear(): void {
        this._metrics.clear();
    }
}

