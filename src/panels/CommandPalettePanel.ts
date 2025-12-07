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
        const commands = [
            // Project & MVVM
            { id: 'lamaworlds.createWpfProject', label: '📦 Create WPF Project', category: 'Project & MVVM', icon: '📦' },
            { id: 'lamaworlds.newWindow', label: '🪟 New Window (MVVM)', category: 'Project & MVVM', icon: '🪟' },
            { id: 'lamaworlds.newUserControl', label: '🎨 New UserControl', category: 'Project & MVVM', icon: '🎨' },
            { id: 'lamaworlds.newViewModel', label: '📋 New ViewModel', category: 'Project & MVVM', icon: '📋' },
            { id: 'lamaworlds.addRelayCommand', label: '⚡ Add RelayCommand', category: 'Project & MVVM', icon: '⚡' },
            { id: 'lamaworlds.generateDataTemplate', label: '📄 Generate DataTemplate', category: 'Project & MVVM', icon: '📄' },
            
            // Preview & Design
            { id: 'lamaworlds.openXamlPreview', label: '👁️ Open XAML Preview', category: 'Preview & Design', icon: '👁️' },
            { id: 'lamaworlds.openVisualTreeInspector', label: '🌳 Visual Tree Inspector', category: 'Preview & Design', icon: '🌳' },
            { id: 'lamaworlds.openToolbox', label: '🧰 Open Toolbox', category: 'Preview & Design', icon: '🧰' },
            { id: 'lamaworlds.openResourceExplorer', label: '🎨 Resource Explorer', category: 'Preview & Design', icon: '🎨' },
            { id: 'lamaworlds.openDebugInspector', label: '🔍 Debug Inspector', category: 'Preview & Design', icon: '🔍' },
            
            // AI Features
            { id: 'lamaworlds.aiGenerateUI', label: '✨ AI Generate UI', category: 'AI Features', icon: '✨' },
            { id: 'lamaworlds.aiOptimizeLayout', label: '💡 AI Optimize Layout', category: 'AI Features', icon: '💡' },
            { id: 'lamaworlds.aiAutoFix', label: '🔧 AI Auto-Fix XAML', category: 'AI Features', icon: '🔧' },
            { id: 'lamaworlds.aiGenerateViewModel', label: '🤖 AI Generate ViewModel', category: 'AI Features', icon: '🤖' },
            { id: 'lamaworlds.openAutoLayout', label: '📐 AI Auto-Layout Engine', category: 'AI Features', icon: '📐' },
            
            // Advanced Tools
            { id: 'lamaworlds.openAnimationEditor', label: '🎬 Animation Editor', category: 'Advanced Tools', icon: '🎬' },
            { id: 'lamaworlds.openResponsiveDesign', label: '📱 Responsive Design', category: 'Advanced Tools', icon: '📱' },
            { id: 'lamaworlds.openVisualStates', label: '🎭 Visual States Editor', category: 'Advanced Tools', icon: '🎭' },
            { id: 'lamaworlds.openMarketplace', label: '🛒 Component Marketplace', category: 'Advanced Tools', icon: '🛒' },
            
            // Build & Run
            { id: 'lamaworlds.openRunPanel', label: '▶️ Run & Build Panel', category: 'Build & Run', icon: '▶️' },
            { id: 'lamaworlds.buildProject', label: '🔨 Build Project', category: 'Build & Run', icon: '🔨' },
            { id: 'lamaworlds.runProject', label: '🚀 Run Project', category: 'Build & Run', icon: '🚀' },
            { id: 'lamaworlds.toggleHotReload', label: '🔄 Toggle Hot Reload', category: 'Build & Run', icon: '🔄' },
            
            // Refactoring
            { id: 'lamaworlds.extractToUserControl', label: '📦 Extract to UserControl', category: 'Refactoring', icon: '📦' },
            { id: 'lamaworlds.wrapWithGrid', label: '⊞ Wrap with Grid', category: 'Refactoring', icon: '⊞' },
            { id: 'lamaworlds.wrapWithBorder', label: '▦ Wrap with Border', category: 'Refactoring', icon: '▦' },
            { id: 'lamaworlds.wrapWithStackPanel', label: '▦ Wrap with StackPanel', category: 'Refactoring', icon: '▦' },
            { id: 'lamaworlds.convertGridToStackPanel', label: '↔️ Convert Grid to StackPanel', category: 'Refactoring', icon: '↔️' },
            { id: 'lamaworlds.renameBinding', label: '✏️ Rename Binding', category: 'Refactoring', icon: '✏️' },
            { id: 'lamaworlds.generateStyle', label: '🎨 Generate Style', category: 'Refactoring', icon: '🎨' }
        ];

        const categories = Array.from(new Set(commands.map(c => c.category)));

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lama Worlds Command Palette</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #007acc;
        }
        .header h1 {
            color: #007acc;
            font-size: 24px;
            margin-bottom: 10px;
        }
        .header p {
            color: #858585;
            font-size: 14px;
        }
        .category {
            margin-bottom: 30px;
        }
        .category-title {
            color: #4ec9b0;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 1px solid #3e3e42;
        }
        .commands-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 12px;
        }
        .command-btn {
            background: #2d2d30;
            border: 1px solid #3e3e42;
            border-radius: 6px;
            padding: 12px 16px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 12px;
            text-align: left;
        }
        .command-btn:hover {
            background: #094771;
            border-color: #007acc;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 122, 204, 0.3);
        }
        .command-icon {
            font-size: 20px;
            flex-shrink: 0;
        }
        .command-label {
            flex: 1;
            font-size: 14px;
            color: #d4d4d4;
        }
        .search-box {
            width: 100%;
            padding: 12px;
            background: #2d2d30;
            border: 1px solid #3e3e42;
            border-radius: 6px;
            color: #d4d4d4;
            font-size: 14px;
            margin-bottom: 20px;
        }
        .search-box:focus {
            outline: none;
            border-color: #007acc;
            box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
        }
        .hidden {
            display: none;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Lama Worlds WPF Studio PRO</h1>
        <p>Quick Access to All Commands</p>
    </div>
    
    <input type="text" class="search-box" id="searchBox" placeholder="🔍 Search commands...">
    
    ${categories.map(category => {
        const categoryCommands = commands.filter(c => c.category === category);
        return `
            <div class="category" data-category="${category}">
                <div class="category-title">${category}</div>
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
    
    <script>
        const vscode = acquireVsCodeApi();
        
        function executeCommand(commandId) {
            vscode.postMessage({
                command: 'executeCommand',
                commandId: commandId
            });
        }
        
        const searchBox = document.getElementById('searchBox');
        const categories = document.querySelectorAll('.category');
        const commandButtons = document.querySelectorAll('.command-btn');
        
        searchBox.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            
            commandButtons.forEach(btn => {
                const label = btn.querySelector('.command-label').textContent.toLowerCase();
                const matches = label.includes(searchTerm);
                btn.classList.toggle('hidden', !matches && searchTerm !== '');
            });
            
            categories.forEach(category => {
                const visibleCommands = Array.from(category.querySelectorAll('.command-btn')).filter(btn => !btn.classList.contains('hidden'));
                category.classList.toggle('hidden', visibleCommands.length === 0 && searchTerm !== '');
            });
        });
    </script>
</body>
</html>`;
    }
}

