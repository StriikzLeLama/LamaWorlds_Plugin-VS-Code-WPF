import * as vscode from 'vscode';
import { CommandRegistry } from './commands/CommandRegistry';
import { XamlPreviewPanel } from './panels/XamlPreviewPanel';
import { ToolboxPanel } from './panels/ToolboxPanel';
import { ResourceExplorerPanel } from './panels/ResourceExplorerPanel';
import { DebugInspectorPanel } from './panels/DebugInspectorPanel';
import { RunPanel } from './panels/RunPanel';
import { AnimationEditorPanel } from './panels/AnimationEditorPanel';
import { ResponsiveDesignPanel } from './panels/ResponsiveDesignPanel';
import { ComponentMarketplacePanel } from './panels/ComponentMarketplacePanel';
import { InspectorPanel } from './inspector/inspectorPanel';
import { AutoLayoutPanel } from './ai/autoLayoutPanel';
import { BlendPanel } from './blend/blendPanel';
import { CommandPalettePanel } from './panels/CommandPalettePanel';
import { CommandTreeProvider } from './panels/CommandTreeProvider';
import { ToolboxTreeProvider } from './panels/ToolboxTreeProvider';
import { ResourceExplorerTreeProvider } from './panels/ResourceExplorerTreeProvider';
import { DebugInspectorTreeProvider } from './panels/DebugInspectorTreeProvider';
import { AnimationEditorTreeProvider } from './panels/AnimationEditorTreeProvider';
import { ResponsiveDesignTreeProvider } from './panels/ResponsiveDesignTreeProvider';
import { MarketplaceTreeProvider } from './panels/MarketplaceTreeProvider';
import { XamlNavigation } from './services/XamlNavigation';
import { DebugConsole } from './services/DebugConsole';
import { PerformanceMonitor } from './services/PerformanceMonitor';
import { NuGetPanel } from './panels/NuGetPanel';
import { AutoRestore } from './nuget/autoRestore';
import { ProjectScanner } from './nuget/projectScanner';
import { NuGetRestore } from './nuget/restore';
import { NuGetManager } from './nuget/manager';

/**
 * Main extension entry point
 * LamaWorlds WPF Studio
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('LamaWorlds WPF Studio is now active!');
    
    // Initialize services
    const debugConsole = DebugConsole.getInstance();
    const performanceMonitor = PerformanceMonitor.getInstance();
    debugConsole.info('LamaWorlds WPF Studio extension activated');

    try {
        // Initialize command registry
        CommandRegistry.initialize(context);

        // Register all commands
        const commandDisposables = CommandRegistry.registerCommands(context);
        context.subscriptions.push(...commandDisposables);
    } catch (error: any) {
        console.error('Error initializing CommandRegistry:', error);
        vscode.window.showErrorMessage(`Failed to initialize Lama Worlds WPF Studio: ${error?.message || error}`);
    }

    try {
        // Register all Tree Data Providers for sidebar views
        const commandTreeProvider = new CommandTreeProvider(context);
        const commandTreeView = vscode.window.createTreeView('lamaworldsCommands', {
            treeDataProvider: commandTreeProvider,
            showCollapseAll: true
        });
        context.subscriptions.push(commandTreeView);

        const toolboxTreeProvider = new ToolboxTreeProvider(context);
        const toolboxTreeView = vscode.window.createTreeView('lamaworldsToolbox', {
            treeDataProvider: toolboxTreeProvider,
            showCollapseAll: true
        });
        context.subscriptions.push(toolboxTreeView);

        const resourceExplorerTreeProvider = new ResourceExplorerTreeProvider(context);
        const resourceExplorerTreeView = vscode.window.createTreeView('lamaworldsResourceExplorer', {
            treeDataProvider: resourceExplorerTreeProvider,
            showCollapseAll: true
        });
        context.subscriptions.push(resourceExplorerTreeView);

        const debugInspectorTreeProvider = new DebugInspectorTreeProvider(context);
        const debugInspectorTreeView = vscode.window.createTreeView('lamaworldsDebugInspector', {
            treeDataProvider: debugInspectorTreeProvider,
            showCollapseAll: true
        });
        context.subscriptions.push(debugInspectorTreeView);

        const animationEditorTreeProvider = new AnimationEditorTreeProvider(context);
        const animationEditorTreeView = vscode.window.createTreeView('lamaworldsAnimationEditor', {
            treeDataProvider: animationEditorTreeProvider,
            showCollapseAll: true
        });
        context.subscriptions.push(animationEditorTreeView);

        const responsiveDesignTreeProvider = new ResponsiveDesignTreeProvider(context);
        const responsiveDesignTreeView = vscode.window.createTreeView('lamaworldsResponsiveDesign', {
            treeDataProvider: responsiveDesignTreeProvider,
            showCollapseAll: true
        });
        context.subscriptions.push(responsiveDesignTreeView);

        const marketplaceTreeProvider = new MarketplaceTreeProvider(context);
        const marketplaceTreeView = vscode.window.createTreeView('lamaworldsMarketplace', {
            treeDataProvider: marketplaceTreeProvider,
            showCollapseAll: true
        });
        context.subscriptions.push(marketplaceTreeView);
    } catch (error: any) {
        console.error('Error creating Tree Views:', error);
        vscode.window.showErrorMessage(`Failed to initialize sidebar views: ${error?.message || error}`);
    }

    // Register panel commands with error handling
    context.subscriptions.push(
        vscode.commands.registerCommand('lamaworlds.openXamlPreview', () => {
            try {
                XamlPreviewPanel.createOrShow(context.extensionUri, context, { auto: false });
            } catch (error: any) {
                console.error('Error opening XAML Preview:', error);
                vscode.window.showErrorMessage(`Failed to open XAML Preview: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.openToolbox', () => {
            try {
                ToolboxPanel.createOrShow(context.extensionUri);
            } catch (error: any) {
                console.error('Error opening Toolbox:', error);
                vscode.window.showErrorMessage(`Failed to open Toolbox: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.openResourceExplorer', () => {
            try {
                ResourceExplorerPanel.createOrShow(context.extensionUri);
            } catch (error: any) {
                console.error('Error opening Resource Explorer:', error);
                vscode.window.showErrorMessage(`Failed to open Resource Explorer: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.openDebugInspector', () => {
            try {
                DebugInspectorPanel.createOrShow(context.extensionUri);
            } catch (error: any) {
                console.error('Error opening Debug Inspector:', error);
                vscode.window.showErrorMessage(`Failed to open Debug Inspector: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.openRunPanel', () => {
            try {
                RunPanel.createOrShow(context.extensionUri);
            } catch (error: any) {
                console.error('Error opening Run Panel:', error);
                vscode.window.showErrorMessage(`Failed to open Run Panel: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.openAnimationEditor', () => {
            try {
                AnimationEditorPanel.createOrShow(context.extensionUri);
            } catch (error: any) {
                console.error('Error opening Animation Editor:', error);
                vscode.window.showErrorMessage(`Failed to open Animation Editor: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.openResponsiveDesign', () => {
            try {
                ResponsiveDesignPanel.createOrShow(context.extensionUri);
            } catch (error: any) {
                console.error('Error opening Responsive Design:', error);
                vscode.window.showErrorMessage(`Failed to open Responsive Design: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.openMarketplace', () => {
            try {
                ComponentMarketplacePanel.createOrShow(context.extensionUri);
            } catch (error: any) {
                console.error('Error opening Marketplace:', error);
                vscode.window.showErrorMessage(`Failed to open Marketplace: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.buildProject', async () => {
            try {
                await RunPanel.buildProject();
            } catch (error: any) {
                console.error('Error building project:', error);
                vscode.window.showErrorMessage(`Failed to build project: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.runProject', async () => {
            try {
                await RunPanel.runProject();
            } catch (error: any) {
                console.error('Error running project:', error);
                vscode.window.showErrorMessage(`Failed to run project: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.insertToolboxControl', async (controlType: string) => {
            try {
                if (!controlType) {
                    vscode.window.showWarningMessage('No control type specified');
                    return;
                }
                await ToolboxPanel.insertControl(controlType);
            } catch (error: any) {
                console.error('Error inserting control:', error);
                vscode.window.showErrorMessage(`Failed to insert control: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.openVisualTreeInspector', () => {
            try {
                InspectorPanel.createOrShow(context.extensionUri);
            } catch (error: any) {
                console.error('Error opening Visual Tree Inspector:', error);
                vscode.window.showErrorMessage(`Failed to open Visual Tree Inspector: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.openAutoLayout', () => {
            try {
                AutoLayoutPanel.createOrShow(context.extensionUri);
            } catch (error: any) {
                console.error('Error opening Auto Layout:', error);
                vscode.window.showErrorMessage(`Failed to open Auto Layout: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.openVisualStates', () => {
            try {
                BlendPanel.createOrShow(context.extensionUri);
            } catch (error: any) {
                console.error('Error opening Visual States:', error);
                vscode.window.showErrorMessage(`Failed to open Visual States: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.openCommandPalette', () => {
            try {
                CommandPalettePanel.createOrShow(context.extensionUri, context);
            } catch (error: any) {
                console.error('Error opening Command Palette:', error);
                vscode.window.showErrorMessage(`Failed to open Command Palette: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.openNuGetManager', () => {
            try {
                NuGetPanel.createOrShow(context.extensionUri, context);
            } catch (error: any) {
                console.error('Error opening NuGet Manager:', error);
                vscode.window.showErrorMessage(`Failed to open NuGet Manager: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.restoreNuGetPackages', async () => {
            try {
                const csprojPath = await ProjectScanner.findNearestCsproj();
                if (!csprojPath) {
                    vscode.window.showErrorMessage('No .csproj file found. Please open a project file.');
                    return;
                }
                await NuGetRestore.runRestoreWithNotification(csprojPath);
            } catch (error: any) {
                console.error('Error restoring NuGet packages:', error);
                vscode.window.showErrorMessage(`Failed to restore packages: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.installNuGetPackage', async () => {
            try {
                const csprojPath = await ProjectScanner.findNearestCsproj();
                if (!csprojPath) {
                    vscode.window.showErrorMessage('No .csproj file found. Please open a project file.');
                    return;
                }
                const packageId = await vscode.window.showInputBox({
                    prompt: 'Enter NuGet package ID',
                    placeHolder: 'e.g., Newtonsoft.Json'
                });
                if (!packageId) {
                    return;
                }
                const version = await vscode.window.showInputBox({
                    prompt: 'Enter version (optional, leave empty for latest)',
                    placeHolder: 'e.g., 13.0.1'
                });
                await NuGetManager.installPackage(csprojPath, packageId, version || undefined);
            } catch (error: any) {
                console.error('Error installing NuGet package:', error);
                vscode.window.showErrorMessage(`Failed to install package: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.updateNuGetPackage', async () => {
            try {
                const csprojPath = await ProjectScanner.findNearestCsproj();
                if (!csprojPath) {
                    vscode.window.showErrorMessage('No .csproj file found. Please open a project file.');
                    return;
                }
                const packages = await ProjectScanner.parsePackageReferences(csprojPath);
                if (packages.length === 0) {
                    vscode.window.showInformationMessage('No packages installed in this project.');
                    return;
                }
                const packageId = await vscode.window.showQuickPick(
                    packages.map(p => p.Include),
                    { placeHolder: 'Select package to update' }
                );
                if (!packageId) {
                    return;
                }
                const version = await vscode.window.showInputBox({
                    prompt: 'Enter version (optional, leave empty for latest)',
                    placeHolder: 'e.g., 13.0.1'
                });
                await NuGetManager.updatePackage(csprojPath, packageId, version || undefined);
            } catch (error: any) {
                console.error('Error updating NuGet package:', error);
                vscode.window.showErrorMessage(`Failed to update package: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.removeNuGetPackage', async () => {
            try {
                const csprojPath = await ProjectScanner.findNearestCsproj();
                if (!csprojPath) {
                    vscode.window.showErrorMessage('No .csproj file found. Please open a project file.');
                    return;
                }
                const packages = await ProjectScanner.parsePackageReferences(csprojPath);
                if (packages.length === 0) {
                    vscode.window.showInformationMessage('No packages installed in this project.');
                    return;
                }
                const packageId = await vscode.window.showQuickPick(
                    packages.map(p => p.Include),
                    { placeHolder: 'Select package to remove' }
                );
                if (!packageId) {
                    return;
                }
                await NuGetManager.removePackage(csprojPath, packageId);
            } catch (error: any) {
                console.error('Error removing NuGet package:', error);
                vscode.window.showErrorMessage(`Failed to remove package: ${error?.message || error}`);
            }
        })
    );

    // Register XAML navigation provider (Ctrl+Click)
    try {
        const navigationProvider = new XamlNavigation(context);
        context.subscriptions.push(
            vscode.languages.registerDefinitionProvider(
                { language: 'xml', scheme: 'file' },
                {
                    provideDefinition: async (document, position) => {
                        try {
                            return await navigationProvider.provideDefinition(document, position);
                        } catch (error: any) {
                            console.error('Error providing definition:', error);
                            return [];
                        }
                    }
                }
            )
        );
    } catch (error: any) {
        console.error('Error registering XAML navigation provider:', error);
    }

    // File watchers for auto-refresh
    const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.xaml');
    fileWatcher.onDidChange(async (uri) => {
        try {
            const config = vscode.workspace.getConfiguration('lamaworlds.wpf');
            if (config.get('previewAutoRefresh', true)) {
                XamlPreviewPanel.refreshPreview(uri);
            }
            if (config.get('hotReloadEnabled', true)) {
                await CommandRegistry.getHotReloadEngine().onFileChanged(uri);
            }
        } catch (error: any) {
            console.error('Error in file watcher:', error);
        }
    });
    context.subscriptions.push(fileWatcher);

    // Auto-open preview when XAML file is opened
    vscode.window.onDidChangeActiveTextEditor((editor) => {
        try {
            if (editor && editor.document.fileName.endsWith('.xaml')) {
                const config = vscode.workspace.getConfiguration('lamaworlds.wpf');
                if (config.get('previewAutoRefresh', true)) {
                    XamlPreviewPanel.createOrShow(context.extensionUri, context, { auto: true });
                }
            }
        } catch (error: any) {
            console.error('Error in editor change handler:', error);
        }
    });

    // Initialize NuGet auto-restore
    try {
        AutoRestore.initialize(context);
        debugConsole.info('NuGet auto-restore initialized');
    } catch (error: any) {
        console.error('Error initializing NuGet auto-restore:', error);
        debugConsole.error(`Failed to initialize NuGet auto-restore: ${error?.message || error}`);
    }
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
    InspectorPanel.dispose();
    AutoLayoutPanel.dispose();
    BlendPanel.dispose();
    CommandPalettePanel.dispose();
    NuGetPanel.dispose();
}