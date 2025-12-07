import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';
import { NuGetLogChannel } from './logChannel';

/**
 * NuGet Restore Engine - Handles dotnet restore operations
 */
export class NuGetRestore {
    private static _logChannel = NuGetLogChannel.getInstance();
    private static _restoreInProgress = new Set<string>();

    /**
     * Run dotnet restore on a .csproj file
     */
    public static async runRestore(csprojPath: string): Promise<{ success: boolean; output: string; error?: string }> {
        // Prevent concurrent restores on the same project
        if (this._restoreInProgress.has(csprojPath)) {
            this._logChannel.warn(`Restore already in progress for: ${csprojPath}`);
            return { success: false, output: '', error: 'Restore already in progress' };
        }

        this._restoreInProgress.add(csprojPath);
        this._logChannel.info(`Starting restore for: ${csprojPath}`);

        return new Promise((resolve) => {
            // Normalize path and ensure it's properly quoted for paths with spaces
            const normalizedPath = path.normalize(csprojPath);
            const projectDir = path.dirname(normalizedPath);
            
            // Build command with properly quoted path to handle spaces
            // Escape quotes and wrap path in quotes for Windows paths with spaces
            const escapedPath = normalizedPath.replace(/"/g, '\\"');
            const quotedPath = `"${escapedPath}"`;
            const command = `dotnet restore ${quotedPath}`;
            
            this._logChannel.debug(`Executing: ${command} in directory: ${projectDir}`);

            exec(command, {
                cwd: projectDir,
                maxBuffer: 10 * 1024 * 1024 // 10MB buffer
            }, (error, stdout, stderr) => {
                this._restoreInProgress.delete(csprojPath);
                
                const output = stdout || '';
                const errorOutput = stderr || '';

                if (error) {
                    this._logChannel.error(`Restore failed with code ${error.code || 'unknown'} for: ${csprojPath}`);
                    this._logChannel.debug(`Restore stderr: ${errorOutput}`);
                    this._logChannel.debug(`Restore stdout: ${output}`);
                    resolve({ success: false, output, error: errorOutput || error.message });
                } else {
                    this._logChannel.info(`Restore completed successfully for: ${csprojPath}`);
                    if (output) {
                        this._logChannel.debug(`Restore stdout: ${output.trim()}`);
                    }
                    if (errorOutput) {
                        this._logChannel.debug(`Restore stderr: ${errorOutput.trim()}`);
                    }
                    resolve({ success: true, output });
                }
            });
        });
    }

    /**
     * Run restore with user notification
     */
    public static async runRestoreWithNotification(csprojPath: string): Promise<boolean> {
        const projectName = require('path').basename(csprojPath);
        
        try {
            const result = await this.runRestore(csprojPath);
            
            if (result.success) {
                vscode.window.showInformationMessage(
                    `NuGet packages restored for ${projectName}`,
                    'View Log'
                ).then(selection => {
                    if (selection === 'View Log') {
                        this._logChannel.show();
                    }
                });
                return true;
            } else {
                vscode.window.showErrorMessage(
                    `Failed to restore NuGet packages for ${projectName}. Check the output log for details.`,
                    'View Log'
                ).then(selection => {
                    if (selection === 'View Log') {
                        this._logChannel.show();
                    }
                });
                return false;
            }
        } catch (error: any) {
            const errorMsg = error?.message || 'Unknown error';
            this._logChannel.error(`Restore exception: ${errorMsg}`);
            vscode.window.showErrorMessage(`NuGet restore failed: ${errorMsg}`);
            return false;
        }
    }
}

