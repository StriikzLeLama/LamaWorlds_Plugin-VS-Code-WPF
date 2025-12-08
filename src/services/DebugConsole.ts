import * as vscode from 'vscode';

/**
 * Log Entry Interface
 */
export interface LogEntry {
    timestamp: Date;
    level: 'info' | 'warn' | 'error' | 'debug' | 'trace';
    category: string;
    message: string;
    context?: any;
    stackTrace?: string;
    duration?: number;
}

/**
 * Enhanced Debug Console Service
 * Provides comprehensive logging, error tracking, and performance monitoring
 */
export class DebugConsole {
    private static _instance: DebugConsole | undefined;
    private _outputChannel: vscode.OutputChannel;
    private _logs: LogEntry[] = [];
    private _maxLogs: number = 5000;
    private _enableDebug: boolean = true;
    private _errorNotifications: Set<string> = new Set();

    private constructor() {
        this._outputChannel = vscode.window.createOutputChannel('Lama Worlds Debug', { log: true });
        this._outputChannel.appendLine('=== Lama Worlds WPF Studio Debug Console ===');
        this._outputChannel.appendLine(`Initialized at ${new Date().toLocaleString()}`);
        this._outputChannel.appendLine('');
    }

    public static getInstance(): DebugConsole {
        if (!DebugConsole._instance) {
            DebugConsole._instance = new DebugConsole();
        }
        return DebugConsole._instance;
    }

    /**
     * Log info message with context
     */
    public info(message: string, category: string = 'General', context?: any): void {
        this._log('info', message, category, context);
    }

    /**
     * Log warning message with context
     */
    public warn(message: string, category: string = 'General', context?: any): void {
        this._log('warn', message, category, context);
    }

    /**
     * Log error message with full details
     */
    public error(message: string, error?: Error | any, category: string = 'Error', context?: any): void {
        let errorMessage = message;
        let stackTrace: string | undefined;

        if (error) {
            if (error instanceof Error) {
                errorMessage = `${message}: ${error.message}`;
                stackTrace = error.stack;
            } else if (typeof error === 'object') {
                errorMessage = `${message}: ${JSON.stringify(error, null, 2)}`;
            } else {
                errorMessage = `${message}: ${String(error)}`;
            }
        }

        this._log('error', errorMessage, category, context, stackTrace);

        // Show notification for new errors (throttled)
        const errorKey = `${category}:${message}`;
        if (!this._errorNotifications.has(errorKey)) {
            this._errorNotifications.add(errorKey);
            setTimeout(() => this._errorNotifications.delete(errorKey), 60000); // 1 minute

            // Auto-show output channel for errors
            this._outputChannel.show(true);
        }
    }

    /**
     * Log debug message
     */
    public debug(message: string, category: string = 'Debug', context?: any): void {
        if (this._enableDebug) {
            this._log('debug', message, category, context);
        }
    }

    /**
     * Log trace message (very detailed)
     */
    public trace(message: string, category: string = 'Trace', context?: any): void {
        if (this._enableDebug) {
            this._log('trace', message, category, context);
        }
    }

    /**
     * Log with performance timing
     */
    public time(label: string, category: string = 'Performance'): () => number {
        const start = Date.now();
        return (): number => {
            const duration = Date.now() - start;
            this._log('info', `${label} completed`, category, undefined, undefined, duration);
            return duration;
        };
    }

    /**
     * Internal log method with enhanced formatting
     */
    private _log(
        level: 'info' | 'warn' | 'error' | 'debug' | 'trace',
        message: string,
        category: string,
        context?: any,
        stackTrace?: string,
        duration?: number
    ): void {
        const timestamp = new Date();
        const logEntry: LogEntry = {
            timestamp,
            level,
            category,
            message,
            context,
            stackTrace,
            duration
        };

        this._logs.push(logEntry);

        // Keep only last N logs
        if (this._logs.length > this._maxLogs) {
            this._logs.shift();
        }

        // Format message with enhanced details
        const timeStr = timestamp.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit'
        }) + '.' + timestamp.getMilliseconds().toString().padStart(3, '0');
        
        const levelStr = level.toUpperCase().padEnd(5);
        const categoryStr = category.padEnd(20);
        const durationStr = duration ? ` [${duration}ms]` : '';
        
        let formattedMessage = `[${timeStr}] [${levelStr}] [${categoryStr}]${durationStr} ${message}`;

        // Add context if present
        if (context) {
            try {
                const contextStr = typeof context === 'string' 
                    ? context 
                    : JSON.stringify(context, null, 2);
                formattedMessage += `\n  Context: ${contextStr}`;
            } catch (e) {
                formattedMessage += `\n  Context: [Unable to stringify]`;
            }
        }

        // Add stack trace for errors
        if (stackTrace && level === 'error') {
            formattedMessage += `\n  Stack Trace:\n${stackTrace.split('\n').map(line => `    ${line}`).join('\n')}`;
        }

        // Write to output channel with color coding (via level indicators)
        this._outputChannel.appendLine(formattedMessage);

        // Also log to console for trace/debug level
        if (level === 'trace' || level === 'debug') {
            console.debug(`[LamaWorlds] ${formattedMessage}`);
        }
    }

    /**
     * Show the debug console
     */
    public show(preserveFocus: boolean = false): void {
        this._outputChannel.show(preserveFocus);
    }

    /**
     * Clear all logs
     */
    public clear(): void {
        this._logs = [];
        this._outputChannel.clear();
        this._outputChannel.appendLine('=== Logs Cleared ===');
        this._outputChannel.appendLine(`Cleared at ${new Date().toLocaleString()}`);
        this._outputChannel.appendLine('');
    }

    /**
     * Get all logs with filtering
     */
    public getLogs(
        options?: {
            level?: 'info' | 'warn' | 'error' | 'debug' | 'trace';
            category?: string;
            since?: Date;
            limit?: number;
        }
    ): LogEntry[] {
        let filtered = [...this._logs];

        if (options?.level) {
            filtered = filtered.filter(log => log.level === options.level);
        }

        if (options?.category) {
            filtered = filtered.filter(log => log.category === options.category);
        }

        if (options?.since) {
            filtered = filtered.filter(log => log.timestamp >= options.since!);
        }

        if (options?.limit) {
            filtered = filtered.slice(-options.limit);
        }

        return filtered;
    }

    /**
     * Get error count
     */
    public getErrorCount(since?: Date): number {
        if (since) {
            return this._logs.filter(log => log.level === 'error' && log.timestamp >= since).length;
        }
        return this._logs.filter(log => log.level === 'error').length;
    }

    /**
     * Get warning count
     */
    public getWarningCount(since?: Date): number {
        if (since) {
            return this._logs.filter(log => log.level === 'warn' && log.timestamp >= since).length;
        }
        return this._logs.filter(log => log.level === 'warn').length;
    }

    /**
     * Export logs to file
     */
    public async exportLogs(): Promise<void> {
        const logs = this._logs.map(log => ({
            timestamp: log.timestamp.toISOString(),
            level: log.level,
            category: log.category,
            message: log.message,
            context: log.context,
            stackTrace: log.stackTrace,
            duration: log.duration
        }));

        const content = JSON.stringify(logs, null, 2);
        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(`lamaworlds-logs-${Date.now()}.json`),
            filters: {
                'JSON': ['json'],
                'Text': ['txt']
            }
        });

        if (uri) {
            const encoder = new TextEncoder();
            await vscode.workspace.fs.writeFile(uri, encoder.encode(content));
            vscode.window.showInformationMessage(`Logs exported to ${uri.fsPath}`);
        }
    }

    /**
     * Get recent errors with full details
     */
    public getRecentErrors(limit: number = 10): LogEntry[] {
        return this._logs
            .filter(log => log.level === 'error')
            .slice(-limit)
            .reverse();
    }

    /**
     * Enable/disable debug logging
     */
    public setDebugEnabled(enabled: boolean): void {
        this._enableDebug = enabled;
        this.info(`Debug logging ${enabled ? 'enabled' : 'disabled'}`, 'DebugConsole');
    }

    /**
     * Get statistics
     */
    public getStats(): {
        total: number;
        errors: number;
        warnings: number;
        byCategory: { [category: string]: number };
        recentErrors: number;
    } {
        const byCategory: { [category: string]: number } = {};
        
        this._logs.forEach(log => {
            byCategory[log.category] = (byCategory[log.category] || 0) + 1;
        });

        const oneHourAgo = new Date(Date.now() - 3600000);
        const recentErrors = this.getErrorCount(oneHourAgo);

        return {
            total: this._logs.length,
            errors: this.getErrorCount(),
            warnings: this.getWarningCount(),
            byCategory,
            recentErrors
        };
    }
}

