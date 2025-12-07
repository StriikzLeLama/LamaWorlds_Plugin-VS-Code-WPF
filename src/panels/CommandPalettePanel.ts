import * as vscode from 'vscode';
import { XamlPreviewPanel } from './XamlPreviewPanel';
import { ToolboxPanel } from './ToolboxPanel';
import { ResourceExplorerPanel } from './ResourceExplorerPanel';
import { DebugInspectorPanel } from './DebugInspectorPanel';
import { RunPanel } from './RunPanel';
import { AnimationEditorPanel } from './AnimationEditorPanel';
import { ResponsiveDesignPanel } from './ResponsiveDesignPanel';
import { ComponentMarketplacePanel } from './ComponentMarketplacePanel';
import { InspectorPanel } from '../inspector/inspectorPanel';
import { AutoLayoutPanel } from '../ai/autoLayoutPanel';
import { BlendPanel } from '../blend/blendPanel';

/**
 * Command Palette Panel - Quick access to all commands with buttons
 */
export class CommandPalettePanel {
    public static currentPanel: CommandPalettePanel | undefined;
    private static readonly viewType = 'lamaworldsCommandPalette';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private readonly _context: vscode.ExtensionContext;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._context = context;

        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async (message: any) => {
                await this._handleMessage(message);
            },
            null,
            this._disposables
        );
    }

    public static createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        const column = vscode.ViewColumn.One;

        if (CommandPalettePanel.currentPanel) {
            CommandPalettePanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            CommandPalettePanel.viewType,
            'Lama Worlds - Command Palette',
            column,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'webviews'),
                    vscode.Uri.joinPath(extensionUri, 'out')
                ],
                retainContextWhenHidden: true
            }
        );

        CommandPalettePanel.currentPanel = new CommandPalettePanel(panel, extensionUri, context);
    }

    public static dispose() {
        if (CommandPalettePanel.currentPanel) {
            CommandPalettePanel.currentPanel.dispose();
        }
    }

    public dispose() {
        CommandPalettePanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private async _handleMessage(message: any) {
        switch (message.command) {
            case 'executeCommand':
                await vscode.commands.executeCommand(message.commandId);
                break;
        }
    }

    private _update() {
        this._panel.webview.html = this._getWebviewContent();
    }

    private _getWebviewContent(): string {
        const webview = this._panel.webview;
        const commands = [
            // Project & MVVM
            { id: 'lamaworlds.createWpfProject', label: 'Create WPF Project', category: 'Project & MVVM', icon: '📦' },
            { id: 'lamaworlds.newWindow', label: 'New Window (MVVM)', category: 'Project & MVVM', icon: '🪟' },
            { id: 'lamaworlds.newUserControl', label: 'New UserControl', category: 'Project & MVVM', icon: '🎨' },
            { id: 'lamaworlds.newViewModel', label: 'New ViewModel', category: 'Project & MVVM', icon: '📋' },
            { id: 'lamaworlds.addRelayCommand', label: 'Add RelayCommand', category: 'Project & MVVM', icon: '⚡' },
            { id: 'lamaworlds.generateDataTemplate', label: 'Generate DataTemplate', category: 'Project & MVVM', icon: '📄' },
            
            // Preview & Design
            { id: 'lamaworlds.openXamlPreview', label: 'Open XAML Preview', category: 'Preview & Design', icon: '👁️' },
            { id: 'lamaworlds.openVisualTreeInspector', label: 'Visual Tree Inspector', category: 'Preview & Design', icon: '🌳' },
            { id: 'lamaworlds.openToolbox', label: 'Open Toolbox', category: 'Preview & Design', icon: '🧰' },
            { id: 'lamaworlds.openResourceExplorer', label: 'Resource Explorer', category: 'Preview & Design', icon: '🎨' },
            { id: 'lamaworlds.openDebugInspector', label: 'Debug Inspector', category: 'Preview & Design', icon: '🔍' },
            
            // AI Features
            { id: 'lamaworlds.aiGenerateUI', label: 'AI Generate UI', category: 'AI Features', icon: '✨' },
            { id: 'lamaworlds.aiOptimizeLayout', label: 'AI Optimize Layout', category: 'AI Features', icon: '💡' },
            { id: 'lamaworlds.aiAutoFix', label: 'AI Auto-Fix XAML', category: 'AI Features', icon: '🔧' },
            { id: 'lamaworlds.aiGenerateViewModel', label: 'AI Generate ViewModel', category: 'AI Features', icon: '🤖' },
            { id: 'lamaworlds.openAutoLayout', label: 'AI Auto-Layout Engine', category: 'AI Features', icon: '📐' },
            
            // Advanced Tools
            { id: 'lamaworlds.openAnimationEditor', label: 'Animation Editor', category: 'Advanced Tools', icon: '🎬' },
            { id: 'lamaworlds.openResponsiveDesign', label: 'Responsive Design', category: 'Advanced Tools', icon: '📱' },
            { id: 'lamaworlds.openVisualStates', label: 'Visual States Editor', category: 'Advanced Tools', icon: '🎭' },
            { id: 'lamaworlds.openMarketplace', label: 'Component Marketplace', category: 'Advanced Tools', icon: '🛒' },
            
            // NuGet Package Manager
            { id: 'lamaworlds.openNuGetManager', label: 'NuGet Manager', category: 'NuGet Packages', icon: '📦' },
            { id: 'lamaworlds.restoreNuGetPackages', label: 'Restore NuGet Packages', category: 'NuGet Packages', icon: '🔄' },
            { id: 'lamaworlds.installNuGetPackage', label: 'Install NuGet Package', category: 'NuGet Packages', icon: '➕' },
            { id: 'lamaworlds.updateNuGetPackage', label: 'Update NuGet Package', category: 'NuGet Packages', icon: '⬆️' },
            { id: 'lamaworlds.removeNuGetPackage', label: 'Remove NuGet Package', category: 'NuGet Packages', icon: '🗑️' },
            
            // Build & Run
            { id: 'lamaworlds.openRunPanel', label: 'Run & Build Panel', category: 'Build & Run', icon: '▶️' },
            { id: 'lamaworlds.buildProject', label: 'Build Project', category: 'Build & Run', icon: '🔨' },
            { id: 'lamaworlds.runProject', label: 'Run Project', category: 'Build & Run', icon: '🚀' },
            { id: 'lamaworlds.toggleHotReload', label: 'Toggle Hot Reload', category: 'Build & Run', icon: '🔄' },
            
            // Refactoring
            { id: 'lamaworlds.extractToUserControl', label: 'Extract to UserControl', category: 'Refactoring', icon: '📦' },
            { id: 'lamaworlds.wrapWithGrid', label: 'Wrap with Grid', category: 'Refactoring', icon: '⊞' },
            { id: 'lamaworlds.wrapWithBorder', label: 'Wrap with Border', category: 'Refactoring', icon: '▦' },
            { id: 'lamaworlds.wrapWithStackPanel', label: 'Wrap with StackPanel', category: 'Refactoring', icon: '▦' },
            { id: 'lamaworlds.convertGridToStackPanel', label: 'Convert Grid to StackPanel', category: 'Refactoring', icon: '↔️' },
            { id: 'lamaworlds.renameBinding', label: 'Rename Binding', category: 'Refactoring', icon: '✏️' },
            { id: 'lamaworlds.generateStyle', label: 'Generate Style', category: 'Refactoring', icon: '🎨' }
        ];

        const categories = Array.from(new Set(commands.map(c => c.category)));

        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webviews', 'commandPalette', 'commandPalette.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webviews', 'commandPalette', 'commandPalette.css'));

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lama Worlds Command Palette</title>
    <link href="${styleUri}" rel="stylesheet">
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <h1>🚀 Lama Worlds WPF Studio</h1>
                <p class="subtitle">Quick Access to All Commands</p>
            </div>
            <div class="shortcut-hint">
                <span class="badge">Press <kbd>Ctrl+Shift+L</kbd> to open anytime</span>
            </div>
        </div>
        
        <div class="search-container">
            <input type="text" class="search-box" id="searchBox" placeholder="🔍 Search commands... (Start typing to filter)" autofocus>
            <span class="command-count" id="commandCount">${commands.length} commands available</span>
        </div>
        
        <div class="content">
            ${categories.map(category => {
                const categoryCommands = commands.filter(c => c.category === category);
                return `
                    <div class="category" data-category="${category}">
                        <div class="category-header">
                            <div class="category-title">${category}</div>
                            <div class="category-count">${categoryCommands.length}</div>
                        </div>
                        <div class="commands-grid">
                            ${categoryCommands.map(cmd => `
                                <button class="command-btn" data-command="${cmd.id}" onclick="executeCommand('${cmd.id}')">
                                    <span class="command-icon">${cmd.icon}</span>
                                    <span class="command-label">${cmd.label}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    </div>
    
    <script src="${scriptUri}"></script>
</body>
</html>`;
    }
}

