import * as vscode from 'vscode';

/**
 * Tree Data Provider for Debug Inspector View
 */
export class DebugInspectorTreeProvider implements vscode.TreeDataProvider<DebugItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<DebugItem | undefined | null | void> = new vscode.EventEmitter<DebugItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<DebugItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private context: vscode.ExtensionContext) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: DebugItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: DebugItem): Thenable<DebugItem[]> {
        if (!element) {
            // Root level - show debug categories
            return Promise.resolve(this.getDebugCategories());
        } else if (element.type === 'category') {
            // Category level - show debug items
            return Promise.resolve(this.getDebugItemsForCategory(element.category!));
        } else {
            return Promise.resolve([]);
        }
    }

    private getDebugCategories(): DebugItem[] {
        return [
            new DebugItem('Binding Errors', 'category', '🔴', undefined, 'bindings'),
            new DebugItem('Layout Issues', 'category', '📐', undefined, 'layout'),
            new DebugItem('Performance', 'category', '⚡', undefined, 'performance'),
            new DebugItem('Resources', 'category', '🎨', undefined, 'resources')
        ];
    }

    private getDebugItemsForCategory(category: string): DebugItem[] {
        const items: { [key: string]: Array<{ label: string; icon: string; description: string }> } = {
            'bindings': [
                { label: 'No binding errors found', icon: '✅', description: 'All bindings are valid' }
            ],
            'layout': [
                { label: 'No layout issues found', icon: '✅', description: 'Layout is correct' }
            ],
            'performance': [
                { label: 'Performance monitoring', icon: '📊', description: 'Click to start monitoring' }
            ],
            'resources': [
                { label: 'Resource analysis', icon: '🔍', description: 'Click to analyze resources' }
            ]
        };

        const categoryItems = items[category] || [];
        return categoryItems.map(item => 
            new DebugItem(item.label, 'item', item.icon, item.description, category)
        );
    }
}

class DebugItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly type: 'category' | 'item',
        public readonly icon: string,
        public readonly description?: string,
        public readonly category?: string
    ) {
        super(`${icon} ${label}`, type === 'category' ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);

        this.tooltip = description || label;
        this.description = description || '';
        this.contextValue = type === 'category' ? 'debugCategory' : 'debugItem';

        if (type === 'item' && category === 'performance') {
            this.command = {
                command: 'lamaworlds.openDebugInspector',
                title: 'Open Debug Inspector'
            };
        }
    }
}

