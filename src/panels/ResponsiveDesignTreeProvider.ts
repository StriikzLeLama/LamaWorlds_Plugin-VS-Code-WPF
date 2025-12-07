import * as vscode from 'vscode';

/**
 * Tree Data Provider for Responsive Design View
 */
export class ResponsiveDesignTreeProvider implements vscode.TreeDataProvider<ResponsiveItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ResponsiveItem | undefined | null | void> = new vscode.EventEmitter<ResponsiveItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ResponsiveItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private context: vscode.ExtensionContext) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ResponsiveItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ResponsiveItem): Thenable<ResponsiveItem[]> {
        if (!element) {
            // Root level - show breakpoints
            return Promise.resolve([
                new ResponsiveItem('Mobile (0-600px)', 'breakpoint', '📱', '375x812'),
                new ResponsiveItem('Tablet (601-1024px)', 'breakpoint', '📱', '768x1024'),
                new ResponsiveItem('Desktop (1025px+)', 'breakpoint', '🖥️', '1366x768'),
                new ResponsiveItem('Custom Size', 'breakpoint', '⚙️', 'Custom')
            ]);
        }
        return Promise.resolve([]);
    }
}

class ResponsiveItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly type: 'breakpoint',
        public readonly icon: string,
        public readonly description?: string
    ) {
        super(`${icon} ${label}`, vscode.TreeItemCollapsibleState.None);

        this.tooltip = description || label;
        this.description = description || '';
        this.contextValue = 'responsiveBreakpoint';

        this.command = {
            command: 'lamaworlds.openResponsiveDesign',
            title: 'Open Responsive Design',
            arguments: [label]
        };
    }
}

