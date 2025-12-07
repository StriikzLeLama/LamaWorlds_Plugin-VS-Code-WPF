import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class HotReloadEngine {
    private _isEnabled: boolean = false;
    private _watchProcess: any = null;
    private _projectPath: string | null = null;
    private _outputChannel: vscode.OutputChannel;

    constructor(private context: vscode.ExtensionContext) {
        this._outputChannel = vscode.window.createOutputChannel('Lama Worlds Hot Reload');
        
        // Load saved state
        const config = vscode.workspace.getConfiguration('lamaworlds.wpf');
        this._isEnabled = config.get('hotReloadEnabled', true);

        // Find project on activation
        this._findProject();
    }

    async toggle() {
        if (this._isEnabled) {
            await this.disable();
        } else {
            await this.enable();
        }
    }

    async enable() {
        if (this._isEnabled) {
            return;
        }

        if (!this._projectPath) {
            this._findProject();
            if (!this._projectPath) {
                vscode.window.showErrorMessage('No WPF project found. Please open a .csproj file.');
                return;
            }
        }

        this._isEnabled = true;
        this._outputChannel.appendLine('Hot Reload: Starting...');

        try {
            // Start dotnet watch
            const projectDir = path.dirname(this._projectPath);
            this._watchProcess = exec(
                `dotnet watch build --no-restore`,
                { cwd: projectDir },
                (error, stdout, stderr) => {
                    if (error) {
                        this._outputChannel.appendLine(`Hot Reload Error: ${error.message}`);
                    }
                    if (stdout) {
                        this._outputChannel.appendLine(stdout);
                    }
                    if (stderr) {
                        this._outputChannel.appendLine(stderr);
                    }
                }
            );

            this._outputChannel.show();
            vscode.window.showInformationMessage('Hot Reload: Enabled');
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to start Hot Reload: ${error.message}`);
            this._isEnabled = false;
        }
    }

    async disable() {
        if (!this._isEnabled) {
            return;
        }

        this._isEnabled = false;

        if (this._watchProcess) {
            this._watchProcess.kill();
            this._watchProcess = null;
        }

        this._outputChannel.appendLine('Hot Reload: Disabled');
        vscode.window.showInformationMessage('Hot Reload: Disabled');
    }

    async onFileChanged(uri: vscode.Uri) {
        if (!this._isEnabled) {
            return;
        }

        const fileName = path.basename(uri.fsPath);
        
        // Only react to XAML and C# files
        if (fileName.endsWith('.xaml') || fileName.endsWith('.cs')) {
            this._outputChannel.appendLine(`File changed: ${fileName}`);
            
            // The dotnet watch process will handle the rebuild automatically
            // We just need to notify the preview panel if it's a XAML file
            if (fileName.endsWith('.xaml')) {
                // Trigger preview refresh
                vscode.commands.executeCommand('lamaworlds.openXamlPreview');
            }
        }
    }

    private _findProject() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return;
        }

        for (const folder of workspaceFolders) {
            const files = fs.readdirSync(folder.uri.fsPath);
            const csproj = files.find(f => f.endsWith('.csproj'));
            if (csproj) {
                this._projectPath = path.join(folder.uri.fsPath, csproj);
                break;
            }

            // Search recursively
            try {
                const allFiles = fs.readdirSync(folder.uri.fsPath, { recursive: true });
                const csprojFile = allFiles.find((f: string | Buffer) => {
                    const fStr = typeof f === 'string' ? f : f.toString();
                    return fStr.endsWith('.csproj');
                });
                if (csprojFile) {
                    const csprojPath = typeof csprojFile === 'string' ? csprojFile : csprojFile.toString();
                    this._projectPath = path.join(folder.uri.fsPath, csprojPath);
                    break;
                }
            } catch (error) {
                // Ignore
            }
        }
    }

    dispose() {
        this.disable();
        this._outputChannel.dispose();
    }
}
