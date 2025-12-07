import * as vscode from 'vscode';

/**
 * Tree Data Provider for Animation Editor View
 */
export class AnimationEditorTreeProvider implements vscode.TreeDataProvider<AnimationItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<AnimationItem | undefined | null | void> = new vscode.EventEmitter<AnimationItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<AnimationItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private context: vscode.ExtensionContext) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: AnimationItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: AnimationItem): Thenable<AnimationItem[]> {
        if (!element) {
            // Root level - show animation categories
            return Promise.resolve([
                new AnimationItem('No animations found', 'empty', '📭', 'Open a XAML file with animations to see them here')
            ]);
        }
        return Promise.resolve([]);
    }
}

class AnimationItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly type: 'animation' | 'empty',
        public readonly icon: string,
        public readonly description?: string
    ) {
        super(`${icon} ${label}`, vscode.TreeItemCollapsibleState.None);

        this.tooltip = description || label;
        this.description = description || '';

        if (type === 'animation') {
            this.command = {
                command: 'lamaworlds.openAnimationEditor',
                title: 'Open Animation Editor'
            };
        }
    }
}

