import * as vscode from 'vscode';

/**
 * Enhanced Debug Console Service
 * Provides logging, error tracking, and performance monitoring
 */
export class DebugConsole {
    private static _instance: DebugConsole | undefined;
    private _outputChannel: vscode.OutputChannel;
    private _logs: Array<{ timestamp: Date; level: 'info' | 'warn' | 'error' | 'debug'; message: string }> = [];
    private _maxLogs: number = 1000;

    private constructor() {
        this._outputChannel = vscode.window.createOutputChannel('Lama Worlds Debug', { log: true });
    }

    public static getInstance(): DebugConsole {
        if (!DebugConsole._instance) {
            DebugConsole._instance = new DebugConsole();
        }
        return DebugConsole._instance;
    }

    /**
     * Log info message
     */
    public info(message: string): void {
        this._log('info', message);
    }

    /**
     * Log warning message
     */
    public warn(message: string): void {
        this._log('warn', message);
    }

    /**
     * Log error message
     */
    public error(message: string, error?: Error): void {
        const errorMessage = error ? `${message}: ${error.message}\n${error.stack}` : message;
        this._log('error', errorMessage);
    }

    /**
     * Log debug message
     */
    public debug(message: string): void {
        this._log('debug', message);
    }

    /**
     * Internal log method
     */
    private _log(level: 'info' | 'warn' | 'error' | 'debug', message: string): void {
        const timestamp = new Date();
        const logEntry = { timestamp, level, message };
        
        this._logs.push(logEntry);
        
        // Keep only last N logs
        if (this._logs.length > this._maxLogs) {
            this._logs.shift();
        }

        // Format message
        const formattedMessage = `[${timestamp.toLocaleTimeString()}] [${level.toUpperCase()}] ${message}`;
        
        // Write to output channel
        switch (level) {
            case 'error':
                this._outputChannel.appendLine(formattedMessage);
                break;
            case 'warn':
                this._outputChannel.appendLine(formattedMessage);
                break;
            default:
                this._outputChannel.appendLine(formattedMessage);
        }
    }

    /**
     * Show the debug console
     */
    public show(): void {
        this._outputChannel.show();
    }

    /**
     * Clear all logs
     */
    public clear(): void {
        this._logs = [];
        this._outputChannel.clear();
    }

    /**
     * Get all logs
     */
    public getLogs(level?: 'info' | 'warn' | 'error' | 'debug'): Array<{ timestamp: Date; level: string; message: string }> {
        if (level) {
            return this._logs.filter(log => log.level === level);
        }
        return [...this._logs];
    }

    /**
     * Get error count
     */
    public getErrorCount(): number {
        return this._logs.filter(log => log.level === 'error').length;
    }

    /**
     * Get warning count
     */
    public getWarningCount(): number {
        return this._logs.filter(log => log.level === 'warn').length;
    }
}

