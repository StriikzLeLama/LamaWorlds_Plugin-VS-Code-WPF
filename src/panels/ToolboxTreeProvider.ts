import * as vscode from 'vscode';
import { ToolboxPanel } from './ToolboxPanel';

/**
 * Tree Data Provider for Toolbox View with search and enhanced icons
 */
export class ToolboxTreeProvider implements vscode.TreeDataProvider<ToolboxItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ToolboxItem | undefined | null | void> = new vscode.EventEmitter<ToolboxItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ToolboxItem | undefined | null | void> = this._onDidChangeTreeData.event;
    private _searchFilter: string = '';

    constructor(private context: vscode.ExtensionContext) {}

    /**
     * Set search filter
     */
    public setSearchFilter(filter: string): void {
        this._searchFilter = filter.toLowerCase();
        this.refresh();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ToolboxItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ToolboxItem): Thenable<ToolboxItem[]> {
        if (!element) {
            // Root level - return categories
            return Promise.resolve(this.getCategories());
        } else if (element.type === 'category') {
            // Category level - return controls in that category
            return Promise.resolve(this.getControlsForCategory(element.category!));
        } else {
            // Control level - no children
            return Promise.resolve([]);
        }
    }

    private getCategories(): ToolboxItem[] {
        // If searching, show all categories, otherwise show normal categories
        return [
            new ToolboxItem('Standard Controls', 'category', '📦', undefined, 'standard'),
            new ToolboxItem('Layout Panels', 'category', '📐', undefined, 'layout'),
            new ToolboxItem('Lama Worlds Components', 'category', '✨', undefined, 'lamaworlds'),
            new ToolboxItem('Text & Input', 'category', '📝', undefined, 'input'),
            new ToolboxItem('Media & Images', 'category', '🖼️', undefined, 'media')
        ];
    }

    private getControlsForCategory(category: string): ToolboxItem[] {
        const controls: { [key: string]: Array<{ id: string; label: string; icon: string; description?: string }> } = {
            'standard': [
                { id: 'Button', label: 'Button', icon: '🔘' },
                { id: 'TextBox', label: 'TextBox', icon: '📝' },
                { id: 'Label', label: 'Label', icon: '🏷️' },
                { id: 'CheckBox', label: 'CheckBox', icon: '☑️' },
                { id: 'RadioButton', label: 'RadioButton', icon: '🔘' },
                { id: 'ComboBox', label: 'ComboBox', icon: '📋' },
                { id: 'ListBox', label: 'ListBox', icon: '📜' },
                { id: 'Image', label: 'Image', icon: '🖼️' }
            ],
            'layout': [
                { id: 'Grid', label: 'Grid', icon: '⊞' },
                { id: 'StackPanel', label: 'StackPanel', icon: '▦' },
                { id: 'Canvas', label: 'Canvas', icon: '🎨' },
                { id: 'DockPanel', label: 'DockPanel', icon: '📦' },
                { id: 'WrapPanel', label: 'WrapPanel', icon: '📋' },
                { id: 'UniformGrid', label: 'UniformGrid', icon: '⊞' }
            ],
            'lamaworlds': [
                { id: 'NeonButton', label: 'NeonButton', icon: '✨' },
                { id: 'GlassCard', label: 'GlassCard', icon: '💎' },
                { id: 'HoloPanel', label: 'HoloPanel', icon: '🌐' },
                { id: 'NeonToggle', label: 'NeonToggle', icon: '🔘' },
                { id: 'NavigationSidebar', label: 'NavigationSidebar', icon: '📱' }
            ],
            'input': [
                { id: 'PasswordBox', label: 'PasswordBox', icon: '🔒' },
                { id: 'RichTextBox', label: 'RichTextBox', icon: '📄' },
                { id: 'Slider', label: 'Slider', icon: '🎚️' },
                { id: 'ProgressBar', label: 'ProgressBar', icon: '📊' }
            ],
            'media': [
                { id: 'MediaElement', label: 'MediaElement', icon: '🎬' },
                { id: 'Viewbox', label: 'Viewbox', icon: '🔍' },
                { id: 'Border', label: 'Border', icon: '▦' },
                { id: 'ScrollViewer', label: 'ScrollViewer', icon: '📜' }
            ]
        };

        let categoryControls = controls[category] || [];
        
        // Apply search filter
        if (this._searchFilter) {
            categoryControls = categoryControls.filter(ctrl => 
                ctrl.label.toLowerCase().includes(this._searchFilter) ||
                ctrl.id.toLowerCase().includes(this._searchFilter) ||
                (ctrl.description && ctrl.description.toLowerCase().includes(this._searchFilter))
            );
        }
        
        return categoryControls.map(ctrl => 
            new ToolboxItem(ctrl.label, 'control', ctrl.icon, ctrl.id, category, ctrl.description)
        );
    }
}

class ToolboxItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly type: 'category' | 'control',
        public readonly icon: string,
        public readonly controlId?: string,
        public readonly category?: string,
        public readonly description?: string
    ) {
        super(`${icon} ${label}`, type === 'category' ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);

        this.tooltip = description || label;
        this.description = description || '';

        if (type === 'control' && controlId) {
            this.command = {
                command: 'lamaworlds.insertToolboxControl',
                title: `Insert ${label}`,
                arguments: [controlId]
            };
            this.contextValue = 'toolboxControl';
        } else {
            this.contextValue = 'toolboxCategory';
        }
    }
}

