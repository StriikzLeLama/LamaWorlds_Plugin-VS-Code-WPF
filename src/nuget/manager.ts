import * as vscode from 'vscode';
import { spawn } from 'child_process';
import { ProjectScanner } from './projectScanner';
import { NuGetRestore } from './restore';
import { NuGetLogChannel } from './logChannel';

/**
 * NuGet Package Manager - Handles install, update, and remove operations
 */
export class NuGetManager {
    private static _logChannel = NuGetLogChannel.getInstance();
    private static _operationsInProgress = new Map<string, Promise<boolean>>();

    /**
     * Install a NuGet package
     */
    public static async installPackage(
        csprojPath: string,
        packageId: string,
        version?: string
    ): Promise<boolean> {
        const operationKey = `${csprojPath}:install:${packageId}`;
        
        // Check if operation is already in progress
        if (this._operationsInProgress.has(operationKey)) {
            this._logChannel.warn(`Install already in progress: ${packageId}`);
            return false;
        }

        const operation = this._performInstall(csprojPath, packageId, version);
        this._operationsInProgress.set(operationKey, operation);
        
        try {
            const result = await operation;
            return result;
        } finally {
            this._operationsInProgress.delete(operationKey);
        }
    }

    private static async _performInstall(
        csprojPath: string,
        packageId: string,
        version?: string
    ): Promise<boolean> {
        try {
            this._logChannel.info(`Installing package: ${packageId}${version ? ` (${version})` : ''}`);

            // Update .csproj file
            const updated = await ProjectScanner.updateCsprojWithPackage(
                csprojPath,
                'add',
                packageId,
                version
            );

            if (!updated) {
                this._logChannel.error(`Failed to update .csproj for package: ${packageId}`);
                vscode.window.showErrorMessage(`Failed to install package: ${packageId}`);
                return false;
            }

            // Run restore
            const restoreResult = await NuGetRestore.runRestore(csprojPath);
            
            if (restoreResult.success) {
                this._logChannel.info(`Successfully installed package: ${packageId}`);
                vscode.window.showInformationMessage(`Package installed: ${packageId}`);
                return true;
            } else {
                this._logChannel.error(`Restore failed after installing: ${packageId}`);
                vscode.window.showErrorMessage(
                    `Package added to project but restore failed: ${packageId}`,
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
            this._logChannel.error(`Install exception: ${errorMsg}`);
            vscode.window.showErrorMessage(`Failed to install package: ${errorMsg}`);
            return false;
        }
    }

    /**
     * Update a NuGet package to latest version
     */
    public static async updatePackage(
        csprojPath: string,
        packageId: string,
        version?: string
    ): Promise<boolean> {
        const operationKey = `${csprojPath}:update:${packageId}`;
        
        if (this._operationsInProgress.has(operationKey)) {
            this._logChannel.warn(`Update already in progress: ${packageId}`);
            return false;
        }

        const operation = this._performUpdate(csprojPath, packageId, version);
        this._operationsInProgress.set(operationKey, operation);
        
        try {
            return await operation;
        } finally {
            this._operationsInProgress.delete(operationKey);
        }
    }

    private static async _performUpdate(
        csprojPath: string,
        packageId: string,
        version?: string
    ): Promise<boolean> {
        try {
            this._logChannel.info(`Updating package: ${packageId}${version ? ` to ${version}` : ' to latest'}`);

            // If no version specified, try to get latest from NuGet API
            let targetVersion = version;
            if (!targetVersion) {
                const latestVersion = await this._getLatestVersion(packageId);
                targetVersion = latestVersion || undefined;
                if (!targetVersion) {
                    this._logChannel.warn(`Could not determine latest version for: ${packageId}, updating without version`);
                }
            }

            // Update .csproj file
            const updated = await ProjectScanner.updateCsprojWithPackage(
                csprojPath,
                'update',
                packageId,
                targetVersion
            );

            if (!updated) {
                this._logChannel.error(`Failed to update .csproj for package: ${packageId}`);
                vscode.window.showErrorMessage(`Failed to update package: ${packageId}`);
                return false;
            }

            // Run restore
            const restoreResult = await NuGetRestore.runRestore(csprojPath);
            
            if (restoreResult.success) {
                this._logChannel.info(`Successfully updated package: ${packageId}`);
                vscode.window.showInformationMessage(`Package updated: ${packageId}${targetVersion ? ` (${targetVersion})` : ''}`);
                return true;
            } else {
                this._logChannel.error(`Restore failed after updating: ${packageId}`);
                vscode.window.showErrorMessage(
                    `Package updated in project but restore failed: ${packageId}`,
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
            this._logChannel.error(`Update exception: ${errorMsg}`);
            vscode.window.showErrorMessage(`Failed to update package: ${errorMsg}`);
            return false;
        }
    }

    /**
     * Remove a NuGet package
     */
    public static async removePackage(
        csprojPath: string,
        packageId: string
    ): Promise<boolean> {
        const operationKey = `${csprojPath}:remove:${packageId}`;
        
        if (this._operationsInProgress.has(operationKey)) {
            this._logChannel.warn(`Remove already in progress: ${packageId}`);
            return false;
        }

        const operation = this._performRemove(csprojPath, packageId);
        this._operationsInProgress.set(operationKey, operation);
        
        try {
            return await operation;
        } finally {
            this._operationsInProgress.delete(operationKey);
        }
    }

    private static async _performRemove(
        csprojPath: string,
        packageId: string
    ): Promise<boolean> {
        try {
            this._logChannel.info(`Removing package: ${packageId}`);

            // Update .csproj file
            const updated = await ProjectScanner.updateCsprojWithPackage(
                csprojPath,
                'remove',
                packageId
            );

            if (!updated) {
                this._logChannel.error(`Failed to remove package from .csproj: ${packageId}`);
                vscode.window.showErrorMessage(`Failed to remove package: ${packageId}`);
                return false;
            }

            // Run restore
            const restoreResult = await NuGetRestore.runRestore(csprojPath);
            
            if (restoreResult.success) {
                this._logChannel.info(`Successfully removed package: ${packageId}`);
                vscode.window.showInformationMessage(`Package removed: ${packageId}`);
                return true;
            } else {
                this._logChannel.warn(`Restore failed after removing: ${packageId} (package was removed from .csproj)`);
                vscode.window.showWarningMessage(
                    `Package removed from project but restore had issues: ${packageId}`,
                    'View Log'
                ).then(selection => {
                    if (selection === 'View Log') {
                        this._logChannel.show();
                    }
                });
                return true; // Still return true since package was removed
            }
        } catch (error: any) {
            const errorMsg = error?.message || 'Unknown error';
            this._logChannel.error(`Remove exception: ${errorMsg}`);
            vscode.window.showErrorMessage(`Failed to remove package: ${errorMsg}`);
            return false;
        }
    }

    /**
     * Get latest version of a package from NuGet API
     */
    private static async _getLatestVersion(packageId: string): Promise<string | null> {
        try {
            const response = await fetch(`https://api.nuget.org/v3-flatcontainer/${packageId.toLowerCase()}/index.json`);
            if (!response.ok) {
                return null;
            }
            const data = await response.json() as { versions?: string[] };
            const versions = data.versions || [];
            return versions.length > 0 ? versions[versions.length - 1] : null;
        } catch (error: any) {
            this._logChannel.debug(`Could not fetch latest version for ${packageId}: ${error?.message || error}`);
            return null;
        }
    }
}

