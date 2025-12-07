import * as vscode from 'vscode';

/**
 * Tree Data Provider for Component Marketplace View
 */
export class MarketplaceTreeProvider implements vscode.TreeDataProvider<MarketplaceItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<MarketplaceItem | undefined | null | void> = new vscode.EventEmitter<MarketplaceItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<MarketplaceItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private context: vscode.ExtensionContext) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: MarketplaceItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: MarketplaceItem): Thenable<MarketplaceItem[]> {
        if (!element) {
            // Root level - show categories
            return Promise.resolve(this.getCategories());
        } else if (element.type === 'category') {
            // Category level - show components
            return Promise.resolve(this.getComponentsForCategory(element.category!));
        } else {
            return Promise.resolve([]);
        }
    }

    private getCategories(): MarketplaceItem[] {
        return [
            new MarketplaceItem('Featured Components', 'category', '⭐', undefined, 'featured'),
            new MarketplaceItem('Lama Worlds', 'category', '✨', undefined, 'lamaworlds'),
            new MarketplaceItem('UI Controls', 'category', '🎨', undefined, 'controls'),
            new MarketplaceItem('Layouts', 'category', '📐', undefined, 'layouts')
        ];
    }

    private getComponentsForCategory(category: string): MarketplaceItem[] {
        const components: { [key: string]: Array<{ label: string; icon: string; description: string }> } = {
            'featured': [
                { label: 'NeonButton', icon: '✨', description: 'Animated neon button with glow effects' },
                { label: 'GlassCard', icon: '💎', description: 'Glass morphism card component' },
                { label: 'HoloPanel', icon: '🌐', description: 'Holographic panel with depth' }
            ],
            'lamaworlds': [
                { label: 'NeonButton', icon: '✨', description: 'Premium neon button' },
                { label: 'GlassCard', icon: '💎', description: 'Glass morphism card' },
                { label: 'HoloPanel', icon: '🌐', description: 'Holographic panel' },
                { label: 'NeonToggle', icon: '🔘', description: 'Animated toggle switch' },
                { label: 'NavigationSidebar', icon: '📱', description: 'Modern navigation sidebar' }
            ],
            'controls': [
                { label: 'Custom Button', icon: '🔘', description: 'Customizable button' },
                { label: 'Animated TextBox', icon: '📝', description: 'TextBox with animations' }
            ],
            'layouts': [
                { label: 'Responsive Grid', icon: '⊞', description: 'Auto-responsive grid' },
                { label: 'Card Layout', icon: '📋', description: 'Card-based layout' }
            ]
        };

        const categoryComponents = components[category] || [];
        return categoryComponents.map(comp => 
            new MarketplaceItem(comp.label, 'component', comp.icon, comp.description, category)
        );
    }
}

class MarketplaceItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly type: 'category' | 'component',
        public readonly icon: string,
        public readonly description?: string,
        public readonly category?: string
    ) {
        super(`${icon} ${label}`, type === 'category' ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);

        this.tooltip = description || label;
        this.description = description || '';
        this.contextValue = type === 'category' ? 'marketplaceCategory' : 'marketplaceComponent';

        if (type === 'component') {
            this.command = {
                command: 'lamaworlds.openMarketplace',
                title: 'Open Marketplace',
                arguments: [label]
            };
        }
    }
}

