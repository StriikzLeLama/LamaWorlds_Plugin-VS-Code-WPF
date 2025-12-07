import * as vscode from 'vscode';
import { NuGetRestore } from './restore';
import { ProjectScanner } from './projectScanner';
import { NuGetLogChannel } from './logChannel';

const RESTORED_PROJECTS_KEY = 'lamaworlds.nuget.restoredProjects';

/**
 * Auto-Restore - Automatically restores packages when project is opened
 */
export class AutoRestore {
    private static _logChannel = NuGetLogChannel.getInstance();

    /**
     * Initialize auto-restore on workspace open
     */
    public static async initialize(context: vscode.ExtensionContext) {
        // Restore on workspace folder change
        vscode.workspace.onDidChangeWorkspaceFolders(async (e) => {
            for (const folder of e.added) {
                await this._restoreWorkspaceFolder(folder, context);
            }
        });

        // Restore current workspace folders
        if (vscode.workspace.workspaceFolders) {
            for (const folder of vscode.workspace.workspaceFolders) {
                await this._restoreWorkspaceFolder(folder, context);
            }
        }

        // Restore when a .csproj file is opened
        vscode.workspace.onDidOpenTextDocument(async (document) => {
            if (document.fileName.endsWith('.csproj')) {
                const csprojPath = document.uri.fsPath;
                await this._restoreIfNeeded(csprojPath, context);
            }
        });
    }

    /**
     * Restore all .csproj files in a workspace folder
     */
    private static async _restoreWorkspaceFolder(
        folder: vscode.WorkspaceFolder,
        context: vscode.ExtensionContext
    ) {
        try {
            const fs = require('fs');
            const path = require('path');

            // Recursively find all .csproj files
            const findCsprojFiles = (dir: string, fileList: string[] = []): string[] => {
                const files = fs.readdirSync(dir);
                
                for (const file of files) {
                    const filePath = path.join(dir, file);
                    const stat = fs.statSync(filePath);
                    
                    // Skip node_modules, bin, obj directories
                    if (stat.isDirectory()) {
                        const dirName = path.basename(filePath);
                        if (dirName === 'node_modules' || dirName === 'bin' || dirName === 'obj' || dirName.startsWith('.')) {
                            continue;
                        }
                        findCsprojFiles(filePath, fileList);
                    } else if (file.endsWith('.csproj')) {
                        fileList.push(filePath);
                    }
                }
                
                return fileList;
            };

            const csprojFiles = findCsprojFiles(folder.uri.fsPath);

            for (const csprojPath of csprojFiles) {
                await this._restoreIfNeeded(csprojPath, context);
            }
        } catch (error: any) {
            this._logChannel.debug(`Error scanning workspace folder: ${error?.message || error}`);
        }
    }

    /**
     * Restore a project if it hasn't been restored in this session
     */
    private static async _restoreIfNeeded(
        csprojPath: string,
        context: vscode.ExtensionContext
    ) {
        try {
            const restoredProjects = context.globalState.get<string[]>(RESTORED_PROJECTS_KEY, []);
            
            // Check if already restored in this session
            if (restoredProjects.includes(csprojPath)) {
                this._logChannel.debug(`Skipping auto-restore (already restored): ${csprojPath}`);
                return;
            }

            const projectName = require('path').basename(csprojPath);
            this._logChannel.info(`Auto-restoring packages for: ${projectName}`);

            const result = await NuGetRestore.runRestore(csprojPath);
            
            if (result.success) {
                // Mark as restored
                restoredProjects.push(csprojPath);
                await context.globalState.update(RESTORED_PROJECTS_KEY, restoredProjects);

                // Show notification
                vscode.window.showInformationMessage(
                    `NuGet packages restored for ${projectName}`,
                    'View Log'
                ).then(selection => {
                    if (selection === 'View Log') {
                        this._logChannel.show();
                    }
                });
            } else {
                this._logChannel.warn(`Auto-restore failed for: ${projectName}`);
            }
        } catch (error: any) {
            this._logChannel.error(`Auto-restore exception: ${error?.message || error}`);
        }
    }

    /**
     * Clear restored projects cache (useful for testing or manual re-restore)
     */
    public static async clearCache(context: vscode.ExtensionContext) {
        await context.globalState.update(RESTORED_PROJECTS_KEY, []);
        this._logChannel.debug('Cleared auto-restore cache');
    }
}

