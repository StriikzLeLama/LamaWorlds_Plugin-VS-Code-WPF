import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess, exec } from 'child_process';
import { promisify } from 'util';
import { DebugConsole } from '../services/DebugConsole';
import { PerformanceMonitor } from '../services/PerformanceMonitor';

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

        const debugConsole = DebugConsole.getInstance();
        const startTime = Date.now();
        debugConsole.info('Starting preview engine initialization...');

        const extensionPath = context.extensionPath;
        const rendererProjectPath = path.join(extensionPath, 'preview-engine', 'renderer');
        const rendererExePath = path.join(rendererProjectPath, 'bin', 'Debug', 'net8.0-windows', 'renderer.exe');

        // Check if renderer exists, if not, build it (with timeout)
        if (!fs.existsSync(rendererExePath)) {
            debugConsole.info('Renderer not found, building... (this may take 1-2 minutes on first run)');
            try {
                await Promise.race([
                    this.buildRenderer(rendererProjectPath),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Build timeout after 120 seconds')), 120000)
                    )
                ]);
                const buildTime = Math.floor((Date.now() - startTime) / 1000);
                debugConsole.info(`Renderer built successfully in ${buildTime} seconds`);
            } catch (error: any) {
                // If build fails, we'll use a fallback mode
                debugConsole.error('Renderer build failed or timed out', error);
                // Don't throw - allow fallback mode
                if (!fs.existsSync(rendererExePath)) {
                    throw new Error(`Renderer not found and build failed: ${error.message}`);
                }
            }
        } else {
            debugConsole.info('Renderer found, skipping build');
        }

        this._rendererPath = rendererExePath;
        this._isInitialized = true;
        
        const totalTime = Math.floor((Date.now() - startTime) / 1000);
        debugConsole.info(`Preview engine initialized in ${totalTime} seconds`);
    }

    /**
     * Build the renderer executable
     */
    private async buildRenderer(projectPath: string): Promise<void> {
        try {
            vscode.window.showInformationMessage('Building WPF renderer... This may take a minute.');
            
            // Check if dotnet is available
            try {
                await execAsync('dotnet --version', { timeout: 5000 });
            } catch (error) {
                throw new Error('dotnet CLI not found. Please install .NET 8 SDK.');
            }

            const { stdout, stderr } = await execAsync('dotnet build --configuration Debug', {
                cwd: projectPath,
                timeout: 120000, // 2 minutes
                maxBuffer: 10 * 1024 * 1024 // 10MB buffer
            });

            // Check if build was successful
            if (stderr && !stderr.includes('warning') && !stdout.includes('Build succeeded')) {
                // Check for common errors
                if (stderr.includes('SDK') || stderr.includes('framework')) {
                    throw new Error('Wrong .NET SDK version. Please install .NET 8 SDK.');
                }
                throw new Error(`Build failed: ${stderr.substring(0, 500)}`);
            }

            // Verify the executable was created
            const exePath = path.join(projectPath, 'bin', 'Debug', 'net8.0-windows', 'renderer.exe');
            if (!fs.existsSync(exePath)) {
                throw new Error('Renderer executable was not created. Build may have failed.');
            }

            vscode.window.showInformationMessage('Renderer built successfully!');
        } catch (error: any) {
            const errorMsg = error.message || 'Unknown build error';
            vscode.window.showErrorMessage(`Failed to build renderer: ${errorMsg}`);
            console.error('Renderer build error:', error);
            throw error;
        }
    }

    /**
     * Start the renderer process if not already running
     */
    private async ensureRendererRunning(): Promise<void> {
        if (this._rendererProcess && !this._rendererProcess.killed) {
            // Check if process is still alive
            try {
                process.kill(this._rendererProcess.pid || 0, 0); // Signal 0 = check if process exists
                return;
            } catch {
                // Process is dead, continue to restart
                this._rendererProcess = null;
            }
        }

        if (!this._rendererPath || !fs.existsSync(this._rendererPath)) {
            throw new Error('Renderer executable not found. Please build the renderer first.');
        }

        try {
            const debugConsole = DebugConsole.getInstance();
            
            this._rendererProcess = spawn(this._rendererPath, [], {
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: false,
                windowsHide: true,
                env: {
                    ...process.env,
                    // Force unbuffered output
                    PYTHONUNBUFFERED: '1' // Doesn't apply to .NET but shows intent
                }
            });
            
            // Force stdout to be unbuffered by setting it to line mode
            if (this._rendererProcess.stdout) {
                this._rendererProcess.stdout.setEncoding('utf8');
            }
            if (this._rendererProcess.stderr) {
                this._rendererProcess.stderr.setEncoding('utf8');
            }

            // Wait a bit for process to start
            await new Promise(resolve => setTimeout(resolve, 500));

            this._rendererProcess.on('error', (error) => {
                debugConsole.error('Renderer process error', error);
                this._rendererProcess = null;
                vscode.window.showErrorMessage(`Renderer error: ${error.message}`);
            });

            this._rendererProcess.on('exit', (code) => {
                if (code !== 0 && code !== null) {
                    debugConsole.warn(`Renderer exited with code ${code}`);
                }
                this._rendererProcess = null;
            });

            // Handle stderr (also contains debug logs)
            this._rendererProcess.stderr?.on('data', (data) => {
                const output = data.toString();
                if (output.trim()) {
                    // Check if it's a debug message or an error
                    if (output.includes('[DEBUG]') || output.includes('[Renderer]')) {
                        debugConsole.debug(`Renderer: ${output.trim()}`);
                    } else {
                        debugConsole.warn(`Renderer stderr: ${output.trim()}`);
                    }
                }
            });
        } catch (error: any) {
            this._rendererProcess = null;
            throw new Error(`Failed to start renderer: ${error.message}`);
        }
    }

    /**
     * Get placeholder image when renderer is unavailable
     */
    private _getPlaceholderImage(): string {
        // Simple 1x1 transparent PNG in base64
        return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    }

    /**
     * Render XAML using FastLive mode (XamlReader)
     */
    public async renderFastLive(xaml: string): Promise<RenderResult> {
        const debugConsole = DebugConsole.getInstance();
        const perfMonitor = PerformanceMonitor.getInstance();
        
        return await perfMonitor.measure('renderFastLive', async () => {
            try {
                await this.ensureRendererRunning();
            } catch (error: any) {
                debugConsole.error('Failed to start renderer', error);
                // Fallback: return a placeholder
                return {
                    imageBase64: this._getPlaceholderImage(),
                    width: 400,
                    height: 300,
                    layoutMap: null
                };
            }

            return new Promise<RenderResult>((resolve) => {
                if (!this._rendererProcess) {
                    debugConsole.warn('Renderer process not available, using fallback');
                    resolve({
                        imageBase64: this._getPlaceholderImage(),
                        width: 400,
                        height: 300,
                        layoutMap: null
                    });
                    return;
                }

                const timeout = setTimeout(() => {
                    debugConsole.warn('Render timeout, using fallback');
                    resolve({
                        imageBase64: this._getPlaceholderImage(),
                        width: 400,
                        height: 300,
                        layoutMap: null
                    });
                }, 10000); // Reduced timeout to 10 seconds

                let outputBuffer = '';

                const dataHandler = (data: Buffer) => {
                    const dataStr = data.toString();
                    debugConsole.debug(`Renderer stdout: ${dataStr.substring(0, 100)}...`);
                    outputBuffer += dataStr;
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
                                    debugConsole.error('Renderer error:', new Error(response.error || 'Unknown render error'));
                                    resolve({
                                        imageBase64: this._getPlaceholderImage(),
                                        width: 400,
                                        height: 300,
                                        layoutMap: null
                                    });
                                } else if (response.type === 'renderComplete') {
                                    debugConsole.info(`Rendered XAML successfully: ${response.width}x${response.height}`);
                                    resolve({
                                        imageBase64: response.imageBase64,
                                        width: response.width,
                                        height: response.height,
                                        layoutMap: null
                                    });
                                }
                            } catch (e: any) {
                                debugConsole.debug(`Parsing renderer output failed: ${e?.message || e}`);
                                // Continue reading
                            }
                        }
                    }
                    
                    outputBuffer = lines[lines.length - 1];
                };

                // Also listen to stderr for debugging
                const errorHandler = (data: Buffer) => {
                    const errorStr = data.toString();
                    debugConsole.warn(`Renderer stderr: ${errorStr}`);
                };

                this._rendererProcess.stderr?.on('data', errorHandler);

                let rendererReady = false;
                
                // Listen for ready signal FIRST
                const readyHandler = (data: Buffer) => {
                    const dataStr = data.toString();
                    debugConsole.debug(`Ready handler received: ${dataStr.substring(0, 100)}`);
                    
                    if (dataStr.includes('"type":"ready"') || dataStr.includes('ready')) {
                        rendererReady = true;
                        debugConsole.info('Renderer is ready!');
                        this._rendererProcess?.stdout?.removeListener('data', readyHandler);
                        
                        // Now attach the data handler for render responses
                        if (this._rendererProcess?.stdout) {
                            this._rendererProcess.stdout.on('data', dataHandler);
                        }
                        
                        // Now send render command
                        const message = JSON.stringify({
                            type: 'render',
                            xaml: xaml
                        }) + '\n';

                        debugConsole.debug(`Sending render command (${xaml.length} chars XAML)`);
                        
                        if (!this._rendererProcess || !this._rendererProcess.stdin) {
                            debugConsole.error('Renderer process or stdin not available');
                            clearTimeout(timeout);
                            resolve({
                                imageBase64: this._getPlaceholderImage(),
                                width: 400,
                                height: 300,
                                layoutMap: null
                            });
                            return;
                        }

                        try {
                            this._rendererProcess.stdin.write(message, 'utf8', (error) => {
                                if (error) {
                                    clearTimeout(timeout);
                                    debugConsole.error('Failed to send render command', error);
                                    resolve({
                                        imageBase64: this._getPlaceholderImage(),
                                        width: 400,
                                        height: 300,
                                        layoutMap: null
                                    });
                                } else {
                                    debugConsole.debug('Render command sent successfully');
                                }
                            });
                        } catch (error: any) {
                            clearTimeout(timeout);
                            debugConsole.error('Exception sending render command', error);
                            resolve({
                                imageBase64: this._getPlaceholderImage(),
                                width: 400,
                                height: 300,
                                layoutMap: null
                            });
                        }
                    }
                };

                // First listen for ready signal
                this._rendererProcess.stdout?.on('data', readyHandler);
                
                // Fallback: if no ready signal after 3 seconds, try anyway
                setTimeout(() => {
                    if (!rendererReady && this._rendererProcess) {
                        debugConsole.warn('No ready signal received after 3s, sending render command anyway');
                        this._rendererProcess.stdout?.removeListener('data', readyHandler);
                        
                        // Switch to normal data handler
                        if (this._rendererProcess.stdout) {
                            this._rendererProcess.stdout.on('data', dataHandler);
                        }
                        
                        // Send render command
                        const message = JSON.stringify({
                            type: 'render',
                            xaml: xaml
                        }) + '\n';

                        if (this._rendererProcess.stdin) {
                            debugConsole.debug('Sending render command (fallback mode)');
                            this._rendererProcess.stdin.write(message, 'utf8');
                        }
                    }
                }, 3000);
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

