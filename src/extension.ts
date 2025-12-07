import * as vscode from 'vscode';
import { CommandRegistry } from './commands/CommandRegistry';
import { XamlPreviewPanel } from './preview/XamlPreviewPanel';
import { ToolboxPanel } from './toolbox/ToolboxPanel';
import { ResourceExplorerPanel } from './inspector/ResourceExplorerPanel';
import { DebugInspectorPanel } from './inspector/DebugInspectorPanel';
import { RunPanel } from './utils/RunPanel';
import { AnimationEditorPanel } from './animator/AnimationEditorPanel';
import { ResponsiveDesignPanel } from './responsive/ResponsiveDesignPanel';
import { ComponentMarketplacePanel } from './toolbox/ComponentMarketplacePanel';
import { XamlNavigation } from './utils/XamlNavigation';

/**
 * Main extension entry point
 * LamaWorlds WPF Studio PRO
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('LamaWorlds WPF Studio PRO is now active!');

    // Initialize command registry
    CommandRegistry.initialize(context);

    // Register all commands
    const commandDisposables = CommandRegistry.registerCommands(context);
    context.subscriptions.push(...commandDisposables);

    // Register panel commands
    context.subscriptions.push(
        vscode.commands.registerCommand('lamaworlds.openXamlPreview', () => {
            XamlPreviewPanel.createOrShow(context.extensionUri);
        }),
        vscode.commands.registerCommand('lamaworlds.openToolbox', () => {
            ToolboxPanel.createOrShow(context.extensionUri);
        }),
        vscode.commands.registerCommand('lamaworlds.openResourceExplorer', () => {
            ResourceExplorerPanel.createOrShow(context.extensionUri);
        }),
        vscode.commands.registerCommand('lamaworlds.openDebugInspector', () => {
            DebugInspectorPanel.createOrShow(context.extensionUri);
        }),
        vscode.commands.registerCommand('lamaworlds.openRunPanel', () => {
            RunPanel.createOrShow(context.extensionUri);
        }),
        vscode.commands.registerCommand('lamaworlds.openAnimationEditor', () => {
            AnimationEditorPanel.createOrShow(context.extensionUri);
        }),
        vscode.commands.registerCommand('lamaworlds.openResponsiveDesign', () => {
            ResponsiveDesignPanel.createOrShow(context.extensionUri);
        }),
        vscode.commands.registerCommand('lamaworlds.openMarketplace', () => {
            ComponentMarketplacePanel.createOrShow(context.extensionUri);
        }),
        vscode.commands.registerCommand('lamaworlds.buildProject', async () => {
            await RunPanel.buildProject();
        }),
        vscode.commands.registerCommand('lamaworlds.runProject', async () => {
            await RunPanel.runProject();
        }),
        vscode.commands.registerCommand('lamaworlds.insertToolboxControl', async (controlType: string) => {
            await ToolboxPanel.insertControl(controlType);
        })
    );

    // Register XAML navigation provider (Ctrl+Click)
    const navigationProvider = new XamlNavigation();
    context.subscriptions.push(
        vscode.languages.registerDefinitionProvider(
            { language: 'xml', scheme: 'file' },
            {
                provideDefinition: async (document, position) => {
                    return await navigationProvider.provideDefinition(document, position);
                }
            }
        )
    );

    // File watchers for auto-refresh
    const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.xaml');
    fileWatcher.onDidChange(async (uri) => {
        const config = vscode.workspace.getConfiguration('lamaworlds.wpf');
        if (config.get('previewAutoRefresh', true)) {
            XamlPreviewPanel.refreshPreview(uri);
        }
        if (config.get('hotReloadEnabled', true)) {
            await CommandRegistry.getHotReloadEngine().onFileChanged(uri);
        }
    });
    context.subscriptions.push(fileWatcher);

    // Auto-open preview when XAML file is opened
    vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor && editor.document.fileName.endsWith('.xaml')) {
            const config = vscode.workspace.getConfiguration('lamaworlds.wpf');
            if (config.get('previewAutoRefresh', true)) {
                XamlPreviewPanel.createOrShow(context.extensionUri);
            }
        }
    });
}

export function deactivate() {
    // Cleanup
    CommandRegistry.getHotReloadEngine()?.dispose();
    XamlPreviewPanel.dispose();
    ToolboxPanel.dispose();
    ResourceExplorerPanel.dispose();
    DebugInspectorPanel.dispose();
    RunPanel.dispose();
    AnimationEditorPanel.dispose();
    ResponsiveDesignPanel.dispose();
    ComponentMarketplacePanel.dispose();
}