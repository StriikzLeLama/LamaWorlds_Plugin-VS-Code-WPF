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
import { StyleEditorPanel } from './panels/StyleEditorPanel';
import { PerformanceProfilerPanel } from './panels/PerformanceProfilerPanel';
import { BindingDebuggerPanel } from './panels/BindingDebuggerPanel';
import { AccessibilityCheckerPanel } from './panels/AccessibilityCheckerPanel';
import { NavigationGraphPanel } from './panels/NavigationGraphPanel';
import { MvvmWizard } from './mvvm/wizard';
import { XamlRefactor } from './ai/xamlRefactor';
import { GridGenerator } from './designer/gridGenerator/gridGenerator';
import { SnappingEngine } from './designer/snapping/snappingEngine';
import { BindingInspector } from './bindings/bindingInspector';
import { AccessibilityChecker } from './accessibility/checker';
import { GraphBuilder } from './navigation/graphBuilder';
import { WpfToAvaloniaConverter } from './converters/wpfToAvalonia';
import { WpfToMauiConverter } from './converters/wpfToMaui';
import { WpfToWinUI3Converter } from './converters/wpfToWinUI';
import { ThemeManagerPanel } from './panels/ThemeManagerPanel';

/**
 * Main extension entry point
 * LamaWorlds WPF Studio
 */
export function activate(context: vscode.ExtensionContext) {
    // Initialize services FIRST
    const debugConsole = DebugConsole.getInstance();
    const performanceMonitor = PerformanceMonitor.getInstance();
    
    const initTime = debugConsole.time('Extension Activation', 'Initialization');
    
    debugConsole.info('LamaWorlds WPF Studio extension activation started', 'Initialization', {
        extensionId: context.extension.id,
        extensionPath: context.extensionPath,
        workspaceFolders: vscode.workspace.workspaceFolders?.length || 0
    });
    
    try {
        // Initialize command registry
        CommandRegistry.initialize(context);

        // Register all commands
        const commandDisposables = CommandRegistry.registerCommands(context);
        context.subscriptions.push(...commandDisposables);
    } catch (error: any) {
        debugConsole.error('Error initializing CommandRegistry', error, 'CommandRegistry', {
            extensionPath: context.extensionPath
        });
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
        debugConsole.error('Error creating Tree Views', error, 'TreeViews', {
            workspaceFolders: vscode.workspace.workspaceFolders?.length || 0
        });
        vscode.window.showErrorMessage(`Failed to initialize sidebar views: ${error?.message || error}`);
    }

    // Register panel commands with error handling
    context.subscriptions.push(
        vscode.commands.registerCommand('lamaworlds.openXamlPreview', () => {
            try {
                XamlPreviewPanel.createOrShow(context.extensionUri, context, { auto: false });
            } catch (error: any) {
                debugConsole.error('Error opening XAML Preview', error, 'XamlPreviewPanel');
                vscode.window.showErrorMessage(`Failed to open XAML Preview: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.openToolbox', () => {
            try {
                ToolboxPanel.createOrShow(context.extensionUri);
            } catch (error: any) {
                debugConsole.error('Error opening Toolbox', error, 'ToolboxPanel');
                vscode.window.showErrorMessage(`Failed to open Toolbox: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.openResourceExplorer', () => {
            try {
                ResourceExplorerPanel.createOrShow(context.extensionUri);
            } catch (error: any) {
                debugConsole.error('Error opening Resource Explorer', error, 'ResourceExplorerPanel');
                vscode.window.showErrorMessage(`Failed to open Resource Explorer: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.openDebugInspector', () => {
            try {
                DebugInspectorPanel.createOrShow(context.extensionUri);
            } catch (error: any) {
                debugConsole.error('Error opening Debug Inspector', error, 'DebugInspectorPanel');
                vscode.window.showErrorMessage(`Failed to open Debug Inspector: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.openRunPanel', () => {
            try {
                RunPanel.createOrShow(context.extensionUri);
            } catch (error: any) {
                debugConsole.error('Error opening Run Panel', error, 'RunPanel');
                vscode.window.showErrorMessage(`Failed to open Run Panel: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.openAnimationEditor', () => {
            try {
                AnimationEditorPanel.createOrShow(context.extensionUri);
            } catch (error: any) {
                debugConsole.error('Error opening Animation Editor', error, 'AnimationEditorPanel');
                vscode.window.showErrorMessage(`Failed to open Animation Editor: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.openResponsiveDesign', () => {
            try {
                ResponsiveDesignPanel.createOrShow(context.extensionUri);
            } catch (error: any) {
                debugConsole.error('Error opening Responsive Design', error, 'ResponsiveDesignPanel');
                vscode.window.showErrorMessage(`Failed to open Responsive Design: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.openMarketplace', () => {
            try {
                ComponentMarketplacePanel.createOrShow(context.extensionUri);
            } catch (error: any) {
                debugConsole.error('Error opening Marketplace', error, 'MarketplacePanel');
                vscode.window.showErrorMessage(`Failed to open Marketplace: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.buildProject', async () => {
            try {
                await RunPanel.buildProject();
            } catch (error: any) {
                debugConsole.error('Error building project', error, 'RunPanel');
                vscode.window.showErrorMessage(`Failed to build project: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.runProject', async () => {
            try {
                await RunPanel.runProject();
            } catch (error: any) {
                debugConsole.error('Error running project', error, 'RunPanel');
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
                debugConsole.error('Error inserting control', error, 'ToolboxPanel');
                vscode.window.showErrorMessage(`Failed to insert control: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.openVisualTreeInspector', () => {
            try {
                InspectorPanel.createOrShow(context.extensionUri);
            } catch (error: any) {
                debugConsole.error('Error opening Visual Tree Inspector', error, 'InspectorPanel');
                vscode.window.showErrorMessage(`Failed to open Visual Tree Inspector: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.openAutoLayout', () => {
            try {
                AutoLayoutPanel.createOrShow(context.extensionUri);
            } catch (error: any) {
                debugConsole.error('Error opening Auto Layout', error, 'AutoLayoutPanel');
                vscode.window.showErrorMessage(`Failed to open Auto Layout: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.openVisualStates', () => {
            try {
                BlendPanel.createOrShow(context.extensionUri);
            } catch (error: any) {
                debugConsole.error('Error opening Visual States', error, 'BlendPanel');
                vscode.window.showErrorMessage(`Failed to open Visual States: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.openCommandPalette', () => {
            try {
                CommandPalettePanel.createOrShow(context.extensionUri, context);
            } catch (error: any) {
                debugConsole.error('Error opening Command Palette', error, 'CommandPalettePanel');
                vscode.window.showErrorMessage(`Failed to open Command Palette: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.openNuGetManager', () => {
            try {
                NuGetPanel.createOrShow(context.extensionUri, context);
            } catch (error: any) {
                debugConsole.error('Error opening NuGet Manager', error, 'NuGetPanel');
                vscode.window.showErrorMessage(`Failed to open NuGet Manager: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.restoreNuGetPackages', async () => {
            let csprojPath: string | null = null;
            try {
                csprojPath = await ProjectScanner.findNearestCsproj();
                if (!csprojPath) {
                    vscode.window.showErrorMessage('No .csproj file found. Please open a project file.');
                    return;
                }
                await NuGetRestore.runRestoreWithNotification(csprojPath);
            } catch (error: any) {
                debugConsole.error('Error restoring NuGet packages', error, 'NuGetRestore', { csprojPath });
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
        }),
        vscode.commands.registerCommand('lamaworlds.openStyleEditor', () => {
            try {
                StyleEditorPanel.createOrShow(context.extensionUri, context);
            } catch (error: any) {
                console.error('Error opening Style Editor:', error);
                vscode.window.showErrorMessage(`Failed to open Style Editor: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.openPerformanceProfiler', () => {
            try {
                PerformanceProfilerPanel.createOrShow(context.extensionUri, context);
            } catch (error: any) {
                console.error('Error opening Performance Profiler:', error);
                vscode.window.showErrorMessage(`Failed to open Performance Profiler: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.openBindingDebugger', () => {
            try {
                BindingDebuggerPanel.createOrShow(context.extensionUri, context);
            } catch (error: any) {
                console.error('Error opening Binding Debugger:', error);
                vscode.window.showErrorMessage(`Failed to open Binding Debugger: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.convertToMvvm', async () => {
            try {
                const editor = vscode.window.activeTextEditor;
                if (!editor || !editor.document.fileName.endsWith('.xaml')) {
                    vscode.window.showErrorMessage('Please open a XAML file first');
                    return;
                }
                await MvvmWizard.convertToMvvm(editor.document);
            } catch (error: any) {
                console.error('Error converting to MVVM:', error);
                vscode.window.showErrorMessage(`Failed to convert to MVVM: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.aiRefactorXaml', async () => {
            try {
                const editor = vscode.window.activeTextEditor;
                if (!editor || !editor.document.fileName.endsWith('.xaml')) {
                    vscode.window.showErrorMessage('Please open a XAML file first');
                    return;
                }
                const refactored = await XamlRefactor.simplifyXaml(editor.document);
                const edit = new vscode.WorkspaceEdit();
                const fullRange = new vscode.Range(
                    editor.document.positionAt(0),
                    editor.document.positionAt(editor.document.getText().length)
                );
                edit.replace(editor.document.uri, fullRange, refactored);
                await vscode.workspace.applyEdit(edit);
                vscode.window.showInformationMessage('XAML refactored successfully');
            } catch (error: any) {
                console.error('Error refactoring XAML:', error);
                vscode.window.showErrorMessage(`Failed to refactor XAML: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.distributeHorizontally', async () => {
            try {
                vscode.window.showInformationMessage('Distribute Horizontally - Feature coming soon');
            } catch (error: any) {
                console.error('Error distributing horizontally:', error);
                vscode.window.showErrorMessage(`Failed to distribute: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.distributeVertically', async () => {
            try {
                vscode.window.showInformationMessage('Distribute Vertically - Feature coming soon');
            } catch (error: any) {
                console.error('Error distributing vertically:', error);
                vscode.window.showErrorMessage(`Failed to distribute: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.generateGrid', async () => {
            try {
                vscode.window.showInformationMessage('Generate Grid - Feature coming soon');
            } catch (error: any) {
                console.error('Error generating grid:', error);
                vscode.window.showErrorMessage(`Failed to generate grid: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.openAccessibilityChecker', () => {
            try {
                AccessibilityCheckerPanel.createOrShow(context.extensionUri, context);
            } catch (error: any) {
                console.error('Error opening Accessibility Checker:', error);
                vscode.window.showErrorMessage(`Failed to open Accessibility Checker: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.openNavigationGraph', async () => {
            try {
                NavigationGraphPanel.createOrShow(context.extensionUri, context);
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (workspaceFolder) {
                    const graph = await GraphBuilder.buildGraph(workspaceFolder);
                    NavigationGraphPanel.currentPanel?.updateGraph(graph.nodes, graph.edges);
                }
            } catch (error: any) {
                console.error('Error opening Navigation Graph:', error);
                vscode.window.showErrorMessage(`Failed to open Navigation Graph: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.convertToAvalonia', async () => {
            try {
                const editor = vscode.window.activeTextEditor;
                if (!editor || !editor.document.fileName.endsWith('.xaml')) {
                    vscode.window.showErrorMessage('Please open a XAML file first');
                    return;
                }
                const converted = await WpfToAvaloniaConverter.convert(editor.document);
                const doc = await vscode.workspace.openTextDocument({
                    content: converted,
                    language: 'xml'
                });
                await vscode.window.showTextDocument(doc);
                vscode.window.showInformationMessage('Converted to Avalonia XAML');
            } catch (error: any) {
                console.error('Error converting to Avalonia:', error);
                vscode.window.showErrorMessage(`Failed to convert: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.convertToMaui', async () => {
            try {
                const editor = vscode.window.activeTextEditor;
                if (!editor || !editor.document.fileName.endsWith('.xaml')) {
                    vscode.window.showErrorMessage('Please open a XAML file first');
                    return;
                }
                const converted = await WpfToMauiConverter.convert(editor.document);
                const doc = await vscode.workspace.openTextDocument({
                    content: converted,
                    language: 'xml'
                });
                await vscode.window.showTextDocument(doc);
                vscode.window.showInformationMessage('Converted to MAUI XAML');
            } catch (error: any) {
                console.error('Error converting to MAUI:', error);
                vscode.window.showErrorMessage(`Failed to convert: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.convertToWinUI', async () => {
            try {
                const editor = vscode.window.activeTextEditor;
                if (!editor || !editor.document.fileName.endsWith('.xaml')) {
                    vscode.window.showErrorMessage('Please open a XAML file first');
                    return;
                }
                const converted = await WpfToWinUI3Converter.convert(editor.document);
                const doc = await vscode.workspace.openTextDocument({
                    content: converted,
                    language: 'xml'
                });
                await vscode.window.showTextDocument(doc);
                vscode.window.showInformationMessage('Converted to WinUI 3 XAML');
            } catch (error: any) {
                console.error('Error converting to WinUI:', error);
                vscode.window.showErrorMessage(`Failed to convert: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.checkAccessibility', async () => {
            try {
                const editor = vscode.window.activeTextEditor;
                if (!editor || !editor.document.fileName.endsWith('.xaml')) {
                    vscode.window.showErrorMessage('Please open a XAML file first');
                    return;
                }
                const issues = await AccessibilityChecker.checkAccessibility(editor.document);
                AccessibilityCheckerPanel.createOrShow(context.extensionUri, context);
                AccessibilityCheckerPanel.currentPanel?.updateIssues(issues);
                vscode.window.showInformationMessage(`Found ${issues.length} accessibility issues`);
            } catch (error: any) {
                console.error('Error checking accessibility:', error);
                vscode.window.showErrorMessage(`Failed to check accessibility: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.inspectBindings', async () => {
            try {
                const editor = vscode.window.activeTextEditor;
                if (!editor || !editor.document.fileName.endsWith('.xaml')) {
                    vscode.window.showErrorMessage('Please open a XAML file first');
                    return;
                }
                const bindings = await BindingInspector.extractBindings(editor.document);
                const validated = await BindingInspector.validateBindings(bindings);
                BindingDebuggerPanel.createOrShow(context.extensionUri, context);
                BindingDebuggerPanel.currentPanel?.updateBindings(validated);
            } catch (error: any) {
                console.error('Error inspecting bindings:', error);
                vscode.window.showErrorMessage(`Failed to inspect bindings: ${error?.message || error}`);
            }
        }),
        vscode.commands.registerCommand('lamaworlds.openThemeManager', () => {
            try {
                ThemeManagerPanel.createOrShow(context.extensionUri, context);
            } catch (error: any) {
                console.error('Error opening Theme Manager:', error);
                vscode.window.showErrorMessage(`Failed to open Theme Manager: ${error?.message || error}`);
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
                            debugConsole.error('Error providing definition', error, 'XamlNavigation', {
                                document: document.fileName,
                                position: position
                            });
                            return [];
                        }
                    }
                }
            )
        );
    } catch (error: any) {
        debugConsole.error('Error registering XAML navigation provider', error, 'XamlNavigation');
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
            debugConsole.error('Error in file watcher', error, 'FileWatcher', {
                uri: uri.fsPath
            });
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
            debugConsole.error('Error in editor change handler', error, 'EditorChangeHandler', {
                fileName: editor?.document.fileName
            });
        }
    });

    // Initialize NuGet auto-restore
    try {
        AutoRestore.initialize(context);
        debugConsole.info('NuGet auto-restore initialized');
    } catch (error: any) {
        debugConsole.error('Error initializing NuGet auto-restore', error, 'AutoRestore');
    }

    // Finalize activation
    const activationDuration = initTime();
    debugConsole.info('LamaWorlds WPF Studio extension activation completed', 'Initialization', {
        duration: activationDuration,
        stats: debugConsole.getStats()
    });

    // Add command to show debug console
    context.subscriptions.push(
        vscode.commands.registerCommand('lamaworlds.showDebugConsole', () => {
            debugConsole.show();
        }),
        vscode.commands.registerCommand('lamaworlds.exportLogs', async () => {
            await debugConsole.exportLogs();
        })
    );
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
    StyleEditorPanel.dispose();
    PerformanceProfilerPanel.dispose();
    BindingDebuggerPanel.dispose();
    AccessibilityCheckerPanel.dispose();
    NavigationGraphPanel.dispose();
    ThemeManagerPanel.dispose();
}