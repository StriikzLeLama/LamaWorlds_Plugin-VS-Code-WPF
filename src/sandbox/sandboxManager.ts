import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

/**
 * Sandbox Manager - Manages C# code execution in secure sandbox
 */
export class SandboxManager {
    private static _instance: SandboxManager | undefined;
    private _sandboxProcess: ChildProcess | null = null;
    private _sandboxPath: string | null = null;
    private _isInitialized: boolean = false;

    private constructor() {}

    public static getInstance(): SandboxManager {
        if (!SandboxManager._instance) {
            SandboxManager._instance = new SandboxManager();
        }
        return SandboxManager._instance;
    }

    /**
     * Initialize sandbox and build if needed
     */
    public async initialize(context: vscode.ExtensionContext): Promise<void> {
        if (this._isInitialized) {
            return;
        }

        const extensionPath = context.extensionPath;
        const sandboxProjectPath = path.join(extensionPath, 'sandbox-engine');
        const sandboxExePath = path.join(sandboxProjectPath, 'bin', 'Debug', 'net8.0', 'sandbox.exe');

        if (!fs.existsSync(sandboxExePath)) {
            await this.buildSandbox(sandboxProjectPath);
        }

        this._sandboxPath = sandboxExePath;
        this._isInitialized = true;
    }

    /**
     * Build sandbox executable
     */
    private async buildSandbox(projectPath: string): Promise<void> {
        try {
            vscode.window.showInformationMessage('Building sandbox engine...');
            const { stdout, stderr } = await execAsync('dotnet build', {
                cwd: projectPath,
                timeout: 60000
            });

            if (stderr && !stderr.includes('warning')) {
                throw new Error(`Build failed: ${stderr}`);
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to build sandbox: ${error.message}`);
            throw error;
        }
    }

    /**
     * Execute C# code in sandbox
     */
    public async executeCode(code: string, context: any): Promise<SandboxResult> {
        await this.ensureSandboxRunning();

        return new Promise((resolve, reject) => {
            if (!this._sandboxProcess) {
                reject(new Error('Sandbox process not available'));
                return;
            }

            const timeout = setTimeout(() => {
                reject(new Error('Execution timeout'));
            }, 30000);

            let outputBuffer = '';

            const dataHandler = (data: Buffer) => {
                outputBuffer += data.toString();
                const lines = outputBuffer.split('\n');
                
                for (let i = 0; i < lines.length - 1; i++) {
                    const line = lines[i].trim();
                    if (line.startsWith('{')) {
                        try {
                            const response = JSON.parse(line);
                            clearTimeout(timeout);
                            this._sandboxProcess?.stdout?.removeListener('data', dataHandler);
                            
                            if (response.success) {
                                resolve(response);
                            } else {
                                reject(new Error(response.error || 'Execution failed'));
                            }
                        } catch (e) {
                            // Continue reading
                        }
                    }
                }
                
                outputBuffer = lines[lines.length - 1];
            };

            this._sandboxProcess.stdout?.on('data', dataHandler);

            const message = JSON.stringify({
                type: 'execute',
                code: code,
                context: context
            }) + '\n';

            this._sandboxProcess.stdin?.write(message, (error) => {
                if (error) {
                    clearTimeout(timeout);
                    reject(error);
                }
            });
        });
    }

    /**
     * Ensure sandbox process is running
     */
    private async ensureSandboxRunning(): Promise<void> {
        if (this._sandboxProcess && !this._sandboxProcess.killed) {
            return;
        }

        if (!this._sandboxPath || !fs.existsSync(this._sandboxPath)) {
            throw new Error('Sandbox executable not found. Please build the sandbox first.');
        }

        this._sandboxProcess = spawn(this._sandboxPath, [], {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: false
        });

        this._sandboxProcess.on('error', (error) => {
            vscode.window.showErrorMessage(`Sandbox error: ${error.message}`);
        });

        this._sandboxProcess.on('exit', (code) => {
            if (code !== 0 && code !== null) {
                console.error(`Sandbox exited with code ${code}`);
            }
        });
    }

    /**
     * Dispose sandbox
     */
    public dispose(): void {
        if (this._sandboxProcess) {
            try {
                const message = JSON.stringify({ type: 'exit' }) + '\n';
                this._sandboxProcess.stdin?.write(message);
                
                setTimeout(() => {
                    if (this._sandboxProcess && !this._sandboxProcess.killed) {
                        this._sandboxProcess.kill();
                    }
                }, 1000);
            } catch (error) {
                // Ignore errors during cleanup
            }
            this._sandboxProcess = null;
        }
        this._isInitialized = false;
    }
}

export interface SandboxResult {
    success: boolean;
    output?: string;
    error?: string;
    stackTrace?: string;
    logs?: string[];
    returnValue?: any;
}

