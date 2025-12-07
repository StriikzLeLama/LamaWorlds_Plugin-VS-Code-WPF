import * as vscode from 'vscode';

/**
 * NuGet Log Channel - Centralized logging for NuGet operations
 */
export class NuGetLogChannel {
    private static _instance: NuGetLogChannel | undefined;
    private _outputChannel: vscode.OutputChannel;

    private constructor() {
        this._outputChannel = vscode.window.createOutputChannel('LamaWorlds NuGet');
    }

    public static getInstance(): NuGetLogChannel {
        if (!NuGetLogChannel._instance) {
            NuGetLogChannel._instance = new NuGetLogChannel();
        }
        return NuGetLogChannel._instance;
    }

    public log(message: string, level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' = 'INFO') {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level}]`;
        this._outputChannel.appendLine(`${prefix} ${message}`);
        
        // Show channel for errors
        if (level === 'ERROR') {
            this._outputChannel.show(true);
        }
    }

    public info(message: string) {
        this.log(message, 'INFO');
    }

    public warn(message: string) {
        this.log(message, 'WARN');
    }

    public error(message: string) {
        this.log(message, 'ERROR');
    }

    public debug(message: string) {
        this.log(message, 'DEBUG');
    }

    public show() {
        this._outputChannel.show(true);
    }

    public dispose() {
        this._outputChannel.dispose();
    }
}

