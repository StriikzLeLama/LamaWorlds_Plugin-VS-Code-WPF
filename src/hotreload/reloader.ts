import * as vscode from 'vscode';
import { HotReloadEngine } from '../services/HotReloadEngine';

/**
 * Enhanced Hot Reload V3 - Reload styles, resources, templates, DataContext, animations
 */
export class HotReloadV3 {
    private _hotReloadEngine: HotReloadEngine;
    private _reloadHandlers: Map<string, () => Promise<void>> = new Map();

    constructor(hotReloadEngine: HotReloadEngine) {
        this._hotReloadEngine = hotReloadEngine;
        this._registerHandlers();
    }

    /**
     * Register reload handlers for different resource types
     */
    private _registerHandlers(): void {
        // Style reload
        this._reloadHandlers.set('.xaml', async () => {
            // Reload XAML styles and templates
            await this._reloadStyles();
        });

        // Resource reload
        this._reloadHandlers.set('ResourceDictionary', async () => {
            await this._reloadResources();
        });

        // DataContext reload
        this._reloadHandlers.set('ViewModel', async () => {
            await this._reloadDataContext();
        });
    }

    /**
     * Handle file change with smart reload
     */
    public async onFileChanged(uri: vscode.Uri): Promise<void> {
        const fileName = uri.fsPath;
        const extension = fileName.substring(fileName.lastIndexOf('.'));

        // Determine reload type
        if (fileName.endsWith('.xaml')) {
            // Check if it's a style or template file
            const document = await vscode.workspace.openTextDocument(uri);
            const text = document.getText();
            
            if (text.includes('<Style') || text.includes('<ControlTemplate')) {
                await this._reloadStyles();
            } else {
                // Regular XAML - full reload
                await this._hotReloadEngine.onFileChanged(uri);
            }
        } else if (fileName.endsWith('.cs')) {
            // Check if it's a ViewModel
            if (fileName.includes('ViewModel') || fileName.includes('VM')) {
                await this._reloadDataContext();
            } else {
                // Regular code-behind - full reload
                await this._hotReloadEngine.onFileChanged(uri);
            }
        }
    }

    /**
     * Reload styles without full rebuild
     */
    private async _reloadStyles(): Promise<void> {
        vscode.window.showInformationMessage('Reloading styles...', 'Dismiss');
        
        // Notify preview panel to refresh styles
        // This would integrate with the preview engine
        // to reload only style resources
        
        // For now, trigger a preview refresh
        await vscode.commands.executeCommand('lamaworlds.openXamlPreview');
    }

    /**
     * Reload resources
     */
    private async _reloadResources(): Promise<void> {
        vscode.window.showInformationMessage('Reloading resources...', 'Dismiss');
        
        // Reload ResourceDictionary files
        // This would clear resource cache and reload
        
        await vscode.commands.executeCommand('lamaworlds.openXamlPreview');
    }

    /**
     * Reload DataContext
     */
    private async _reloadDataContext(): Promise<void> {
        vscode.window.showInformationMessage('Reloading DataContext...', 'Dismiss');
        
        // Reload ViewModel and update bindings
        // This would update the preview's DataContext without rebuilding
        
        await vscode.commands.executeCommand('lamaworlds.openXamlPreview');
    }

    /**
     * Reload animations
     */
    public async reloadAnimations(): Promise<void> {
        vscode.window.showInformationMessage('Reloading animations...', 'Dismiss');
        
        // Reload Storyboard definitions
        // This would update animation timelines without rebuilding
        
        await vscode.commands.executeCommand('lamaworlds.openAnimationEditor');
    }

    /**
     * Reload templates
     */
    public async reloadTemplates(): Promise<void> {
        vscode.window.showInformationMessage('Reloading templates...', 'Dismiss');
        
        // Reload ControlTemplate definitions
        // This would update template visual tree without rebuilding
        
        await vscode.commands.executeCommand('lamaworlds.openXamlPreview');
    }
}

