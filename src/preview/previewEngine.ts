import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Preview Engine - Manages communication with WPF renderer executable
 * Supports two rendering modes:
 * - FastLive: Uses XamlReader.Load for instant preview
 * - FullBuild: Compiles and runs the full project
 */
export class PreviewEngine {
    private static _instance: PreviewEngine | undefined;
    private _rendererProcess: ChildProcess | null = null;
    private _rendererPath: string | null = null;
    private _isInitialized: boolean = false;
    private _currentMode: 'FastLive' | 'FullBuild' = 'FastLive';

    private constructor() {}

    public static getInstance(): PreviewEngine {
        if (!PreviewEngine._instance) {
            PreviewEngine._instance = new PreviewEngine();
        }
        return PreviewEngine._instance;
    }

    /**
     * Initialize the preview engine and locate/build the renderer
     */
    public async initialize(context: vscode.ExtensionContext): Promise<void> {
        if (this._isInitialized) {
            return;
        }

        const extensionPath = context.extensionPath;
        const rendererProjectPath = path.join(extensionPath, 'preview-engine', 'renderer');
        const rendererExePath = path.join(rendererProjectPath, 'bin', 'Debug', 'net8.0-windows', 'renderer.exe');

        // Check if renderer exists, if not, build it
        if (!fs.existsSync(rendererExePath)) {
            await this.buildRenderer(rendererProjectPath);
        }

        this._rendererPath = rendererExePath;
        this._isInitialized = true;
    }

    /**
     * Build the renderer executable
     */
    private async buildRenderer(projectPath: string): Promise<void> {
        try {
            vscode.window.showInformationMessage('Building WPF renderer...');
            const { stdout, stderr } = await execAsync('dotnet build', {
                cwd: projectPath,
                timeout: 60000
            });

            if (stderr && !stderr.includes('warning')) {
                throw new Error(`Build failed: ${stderr}`);
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to build renderer: ${error.message}`);
            throw error;
        }
    }

    /**
     * Start the renderer process if not already running
     */
    private async ensureRendererRunning(): Promise<void> {
        if (this._rendererProcess && !this._rendererProcess.killed) {
            return;
        }

        if (!this._rendererPath || !fs.existsSync(this._rendererPath)) {
            throw new Error('Renderer executable not found. Please build the renderer first.');
        }

        this._rendererProcess = spawn(this._rendererPath, [], {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: false
        });

        this._rendererProcess.on('error', (error) => {
            vscode.window.showErrorMessage(`Renderer error: ${error.message}`);
        });

        this._rendererProcess.on('exit', (code) => {
            if (code !== 0 && code !== null) {
                console.error(`Renderer exited with code ${code}`);
            }
        });
    }

    /**
     * Render XAML using FastLive mode (XamlReader)
     */
    public async renderFastLive(xaml: string): Promise<RenderResult> {
        await this.ensureRendererRunning();

        return new Promise((resolve, reject) => {
            if (!this._rendererProcess) {
                reject(new Error('Renderer process not available'));
                return;
            }

            const timeout = setTimeout(() => {
                reject(new Error('Render timeout'));
            }, 30000);

            let outputBuffer = '';

            const dataHandler = (data: Buffer) => {
                outputBuffer += data.toString();
                const lines = outputBuffer.split('\n');
                
                // Check if we have a complete JSON response
                for (let i = 0; i < lines.length - 1; i++) {
                    const line = lines[i].trim();
                    if (line.startsWith('{')) {
                        try {
                            const response = JSON.parse(line);
                            clearTimeout(timeout);
                            this._rendererProcess?.stdout?.removeListener('data', dataHandler);
                            
                            if (response.type === 'error') {
                                reject(new Error(response.error || 'Unknown render error'));
                            } else if (response.type === 'renderComplete') {
                                resolve({
                                    imageBase64: response.imageBase64,
                                    width: response.width,
                                    height: response.height,
                                    layoutMap: null
                                });
                            }
                        } catch (e) {
                            // Continue reading
                        }
                    }
                }
                
                outputBuffer = lines[lines.length - 1];
            };

            this._rendererProcess.stdout?.on('data', dataHandler);

            // Send render command
            const message = JSON.stringify({
                type: 'render',
                xaml: xaml
            }) + '\n';

            this._rendererProcess.stdin?.write(message, (error) => {
                if (error) {
                    clearTimeout(timeout);
                    reject(error);
                }
            });
        });
    }

    /**
     * Get layout map for element hit testing
     */
    public async getLayoutMap(): Promise<LayoutElement | null> {
        await this.ensureRendererRunning();

        return new Promise((resolve, reject) => {
            if (!this._rendererProcess) {
                reject(new Error('Renderer process not available'));
                return;
            }

            const timeout = setTimeout(() => {
                reject(new Error('Layout map timeout'));
            }, 10000);

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
                            this._rendererProcess?.stdout?.removeListener('data', dataHandler);
                            
                            if (response.type === 'error') {
                                reject(new Error(response.error || 'Unknown layout error'));
                            } else if (response.type === 'layoutMap') {
                                resolve(response.layoutMap);
                            }
                        } catch (e) {
                            // Continue reading
                        }
                    }
                }
                
                outputBuffer = lines[lines.length - 1];
            };

            this._rendererProcess.stdout?.on('data', dataHandler);

            // Send getLayout command
            const message = JSON.stringify({
                type: 'getLayout'
            }) + '\n';

            this._rendererProcess.stdin?.write(message, (error) => {
                if (error) {
                    clearTimeout(timeout);
                    reject(error);
                }
            });
        });
    }

    /**
     * Set rendering mode
     */
    public setMode(mode: 'FastLive' | 'FullBuild'): void {
        this._currentMode = mode;
    }

    /**
     * Get current rendering mode
     */
    public getMode(): 'FastLive' | 'FullBuild' {
        return this._currentMode;
    }

    /**
     * Dispose and cleanup
     */
    public dispose(): void {
        if (this._rendererProcess) {
            try {
                // Send exit command
                const message = JSON.stringify({ type: 'exit' }) + '\n';
                this._rendererProcess.stdin?.write(message);
                
                setTimeout(() => {
                    if (this._rendererProcess && !this._rendererProcess.killed) {
                        this._rendererProcess.kill();
                    }
                }, 1000);
            } catch (error) {
                // Ignore errors during cleanup
            }
            this._rendererProcess = null;
        }
        this._isInitialized = false;
    }
}

/**
 * Render result interface
 */
export interface RenderResult {
    imageBase64: string;
    width: number;
    height: number;
    layoutMap: LayoutElement | null;
}

/**
 * Layout element interface (matches C# structure)
 */
export interface LayoutElement {
    id: string;
    type: string;
    name: string;
    bounds: Bounds;
    parentId: string;
    gridRow?: number;
    gridColumn?: number;
    canvasLeft?: number;
    canvasTop?: number;
    margin?: string;
    width?: number;
    height?: number;
    children?: LayoutElement[];
}

export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

