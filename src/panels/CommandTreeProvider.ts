import * as vscode from 'vscode';

/**
 * Tree Data Provider for Command Palette in Sidebar
 */
export class CommandTreeProvider implements vscode.TreeDataProvider<CommandItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<CommandItem | undefined | null | void> = new vscode.EventEmitter<CommandItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<CommandItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private context: vscode.ExtensionContext) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: CommandItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: CommandItem): Thenable<CommandItem[]> {
        if (!element) {
            // Root level - return categories
            return Promise.resolve(this.getCategories());
        } else if (element.type === 'category') {
            // Category level - return commands in that category
            return Promise.resolve(this.getCommandsForCategory(element.category!));
        } else {
            // Command level - no children
            return Promise.resolve([]);
        }
    }

    private getCategories(): CommandItem[] {
        return [
            new CommandItem('Project & MVVM', 'category', '📦', undefined, 'project'),
            new CommandItem('Preview & Design', 'category', '👁️', undefined, 'preview'),
            new CommandItem('AI Features', 'category', '✨', undefined, 'ai'),
            new CommandItem('Advanced Tools', 'category', '🎬', undefined, 'tools'),
            new CommandItem('Build & Run', 'category', '▶️', undefined, 'build'),
            new CommandItem('Refactoring', 'category', '🔧', undefined, 'refactor')
        ];
    }

    private getCommandsForCategory(category: string): CommandItem[] {
        const commands: { [key: string]: Array<{ id: string; label: string; icon: string }> } = {
            'project': [
                { id: 'lamaworlds.createWpfProject', label: 'Create WPF Project', icon: '📦' },
                { id: 'lamaworlds.newWindow', label: 'New Window (MVVM)', icon: '🪟' },
                { id: 'lamaworlds.newUserControl', label: 'New UserControl', icon: '🎨' },
                { id: 'lamaworlds.newViewModel', label: 'New ViewModel', icon: '📋' },
                { id: 'lamaworlds.addRelayCommand', label: 'Add RelayCommand', icon: '⚡' },
                { id: 'lamaworlds.generateDataTemplate', label: 'Generate DataTemplate', icon: '📄' }
            ],
            'preview': [
                { id: 'lamaworlds.openXamlPreview', label: 'Open XAML Preview', icon: '👁️' },
                { id: 'lamaworlds.openVisualTreeInspector', label: 'Visual Tree Inspector', icon: '🌳' },
                { id: 'lamaworlds.openToolbox', label: 'Open Toolbox', icon: '🧰' },
                { id: 'lamaworlds.openResourceExplorer', label: 'Resource Explorer', icon: '🎨' },
                { id: 'lamaworlds.openDebugInspector', label: 'Debug Inspector', icon: '🔍' }
            ],
            'ai': [
                { id: 'lamaworlds.aiGenerateUI', label: 'AI Generate UI', icon: '✨' },
                { id: 'lamaworlds.aiOptimizeLayout', label: 'AI Optimize Layout', icon: '💡' },
                { id: 'lamaworlds.aiAutoFix', label: 'AI Auto-Fix XAML', icon: '🔧' },
                { id: 'lamaworlds.aiGenerateViewModel', label: 'AI Generate ViewModel', icon: '🤖' },
                { id: 'lamaworlds.openAutoLayout', label: 'AI Auto-Layout Engine', icon: '📐' }
            ],
            'tools': [
                { id: 'lamaworlds.openAnimationEditor', label: 'Animation Editor', icon: '🎬' },
                { id: 'lamaworlds.openResponsiveDesign', label: 'Responsive Design', icon: '📱' },
                { id: 'lamaworlds.openVisualStates', label: 'Visual States Editor', icon: '🎭' },
                { id: 'lamaworlds.openMarketplace', label: 'Component Marketplace', icon: '🛒' }
            ],
            'build': [
                { id: 'lamaworlds.openRunPanel', label: 'Run & Build Panel', icon: '▶️' },
                { id: 'lamaworlds.buildProject', label: 'Build Project', icon: '🔨' },
                { id: 'lamaworlds.runProject', label: 'Run Project', icon: '🚀' },
                { id: 'lamaworlds.toggleHotReload', label: 'Toggle Hot Reload', icon: '🔄' }
            ],
            'refactor': [
                { id: 'lamaworlds.extractToUserControl', label: 'Extract to UserControl', icon: '📦' },
                { id: 'lamaworlds.wrapWithGrid', label: 'Wrap with Grid', icon: '⊞' },
                { id: 'lamaworlds.wrapWithBorder', label: 'Wrap with Border', icon: '▦' },
                { id: 'lamaworlds.wrapWithStackPanel', label: 'Wrap with StackPanel', icon: '▦' },
                { id: 'lamaworlds.convertGridToStackPanel', label: 'Convert Grid to StackPanel', icon: '↔️' },
                { id: 'lamaworlds.renameBinding', label: 'Rename Binding', icon: '✏️' },
                { id: 'lamaworlds.generateStyle', label: 'Generate Style', icon: '🎨' }
            ]
        };

        const categoryCommands = commands[category] || [];
        return categoryCommands.map(cmd => 
            new CommandItem(cmd.label, 'command', cmd.icon, cmd.id, category)
        );
    }
}

class CommandItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly type: 'category' | 'command',
        public readonly icon: string,
        public readonly commandId?: string,
        public readonly category?: string
    ) {
        super(label, type === 'category' ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);

        this.tooltip = label;
        this.description = '';

        if (type === 'command' && commandId) {
            this.command = {
                command: commandId,
                title: label
            };
            this.contextValue = 'command';
        } else {
            this.contextValue = 'category';
        }
    }
}

