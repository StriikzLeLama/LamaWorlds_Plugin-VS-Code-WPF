import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface Component {
    id: string;
    name: string;
    description: string;
    category: string;
    xaml: string;
    viewModel?: string;
    styles?: string;
    icon: string;
}

export class ComponentMarketplacePanel {
    public static currentPanel: ComponentMarketplacePanel | undefined;
    private static readonly viewType = 'componentMarketplace';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    private static readonly components: Component[] = [
        {
            id: 'glasscard',
            name: 'Glass Card',
            description: 'Glassmorphism card component with blur effect',
            category: 'Lama Worlds',
            xaml: `<Border Style="{StaticResource GlassCard}" Margin="10">
    <StackPanel>
        <TextBlock Text="Title" Style="{StaticResource Header1}"/>
        <TextBlock Text="Content" Foreground="{StaticResource TextSecondaryBrush}"/>
    </StackPanel>
</Border>`,
            icon: '$(symbol-color)'
        },
        {
            id: 'neonbutton',
            name: 'Neon Button',
            description: 'Button with neon glow effect',
            category: 'Lama Worlds',
            xaml: `<Button Content="Click Me" Style="{StaticResource NeonButton}" Command="{Binding CommandName}" />`,
            icon: '$(symbol-event)'
        },
        {
            id: 'holopanel',
            name: 'Holo Panel',
            description: 'Holographic panel with gradient background',
            category: 'Lama Worlds',
            xaml: `<Border Background="{StaticResource HoloBackgroundBrush}" CornerRadius="10" Padding="15">
    $0
</Border>`,
            icon: '$(symbol-structure)'
        },
        {
            id: 'sidebar',
            name: 'Sidebar Navigation',
            description: 'Sidebar navigation panel with menu items',
            category: 'Lama Worlds',
            xaml: `<Grid>
    <Grid.ColumnDefinitions>
        <ColumnDefinition Width="200"/>
        <ColumnDefinition Width="*"/>
    </Grid.ColumnDefinitions>
    <Border Grid.Column="0" Background="{StaticResource GlassBackgroundBrush}">
        <StackPanel>
            <Button Content="Home" Style="{StaticResource SidebarButton}"/>
            <Button Content="Settings" Style="{StaticResource SidebarButton}"/>
        </StackPanel>
    </Border>
    <ContentControl Grid.Column="1" Content="{Binding CurrentView}"/>
</Grid>`,
            icon: '$(list-unordered)'
        },
        {
            id: 'dashboard',
            name: 'Dashboard Layout',
            description: 'Complete dashboard layout with cards and widgets',
            category: 'Lama Worlds',
            xaml: `<Grid>
    <Grid.RowDefinitions>
        <RowDefinition Height="Auto"/>
        <RowDefinition Height="*"/>
    </Grid.RowDefinitions>
    <TextBlock Grid.Row="0" Text="Dashboard" Style="{StaticResource Header1}" Margin="20"/>
    <UniformGrid Grid.Row="1" Columns="3" Rows="2" Margin="20">
        <!-- Dashboard widgets -->
    </UniformGrid>
</Grid>`,
            icon: '$(dashboard)'
        },
        {
            id: 'login',
            name: 'Login Panel',
            description: 'Modern login form with glass effect',
            category: 'Lama Worlds',
            xaml: `<Border Style="{StaticResource GlassCard}" Width="400" Height="500" HorizontalAlignment="Center" VerticalAlignment="Center">
    <StackPanel Margin="30">
        <TextBlock Text="Login" Style="{StaticResource Header1}" HorizontalAlignment="Center" Margin="0,0,0,30"/>
        <TextBox Text="{Binding Username}" Margin="0,0,0,15" Padding="10"/>
        <PasswordBox Password="{Binding Password}" Margin="0,0,0,15" Padding="10"/>
        <Button Content="Sign In" Style="{StaticResource NeonButton}" Command="{Binding LoginCommand}" Margin="0,20,0,0"/>
    </StackPanel>
</Border>`,
            icon: '$(key)'
        },
        {
            id: 'settings',
            name: 'Settings Page',
            description: 'Settings page with sections and options',
            category: 'Lama Worlds',
            xaml: `<Grid>
    <Grid.RowDefinitions>
        <RowDefinition Height="Auto"/>
        <RowDefinition Height="*"/>
    </Grid.RowDefinitions>
    <TextBlock Grid.Row="0" Text="Settings" Style="{StaticResource Header1}" Margin="20"/>
    <ScrollViewer Grid.Row="1">
        <StackPanel Margin="20">
            <Border Style="{StaticResource GlassCard}" Margin="0,0,0,15">
                <StackPanel Margin="15">
                    <TextBlock Text="General" Style="{StaticResource Header2}" Margin="0,0,0,10"/>
                    <!-- Settings options -->
                </StackPanel>
            </Border>
        </StackPanel>
    </ScrollViewer>
</Grid>`,
            icon: '$(settings-gear)'
        }
    ];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async (message: any) => {
                switch (message.command) {
                    case 'installComponent':
                        await this._installComponent(message.componentId);
                        return;
                    case 'previewComponent':
                        this._previewComponent(message.componentId);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.ViewColumn.Two;

        if (ComponentMarketplacePanel.currentPanel) {
            ComponentMarketplacePanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            ComponentMarketplacePanel.viewType,
            'Component Marketplace',
            column,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri],
                retainContextWhenHidden: true
            }
        );

        ComponentMarketplacePanel.currentPanel = new ComponentMarketplacePanel(panel, extensionUri);
    }

    public static dispose() {
        if (ComponentMarketplacePanel.currentPanel) {
            ComponentMarketplacePanel.currentPanel.dispose();
        }
    }

    public dispose() {
        ComponentMarketplacePanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update() {
        const categories = Array.from(new Set(ComponentMarketplacePanel.components.map(c => c.category)));
        
        let html = '<h2>🛍️ Component Marketplace</h2>';
        html += '<p style="font-size: 11px; color: var(--vscode-descriptionForeground); margin-bottom: 20px;">';
        html += 'Browse and install ready-to-use WPF components';
        html += '</p>';

        for (const category of categories) {
            const categoryComponents = ComponentMarketplacePanel.components.filter(c => c.category === category);
            html += `<div class="category-section">
                <h3>${category}</h3>
                <div class="components-grid">`;
            
            for (const component of categoryComponents) {
                html += `
                    <div class="component-card" data-id="${component.id}">
                        <div class="component-icon">${component.icon}</div>
                        <div class="component-info">
                            <div class="component-name">${component.name}</div>
                            <div class="component-description">${component.description}</div>
                        </div>
                        <div class="component-actions">
                            <button class="btn-preview" onclick="previewComponent('${component.id}')">Preview</button>
                            <button class="btn-install" onclick="installComponent('${component.id}')">Install</button>
                        </div>
                    </div>
                `;
            }
            
            html += `</div></div>`;
        }

        this._panel.webview.html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Component Marketplace</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 15px;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .category-section {
            margin-bottom: 30px;
        }
        .category-section h3 {
            font-size: 14px;
            text-transform: uppercase;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .components-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 15px;
        }
        .component-card {
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 15px;
            background: var(--vscode-editor-background);
            transition: all 0.3s;
            display: flex;
            flex-direction: column;
        }
        .component-card:hover {
            border-color: var(--vscode-button-background);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        .component-icon {
            font-size: 32px;
            margin-bottom: 10px;
        }
        .component-name {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 5px;
            color: var(--vscode-editor-foreground);
        }
        .component-description {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 15px;
            flex: 1;
        }
        .component-actions {
            display: flex;
            gap: 10px;
        }
        .btn-preview, .btn-install {
            flex: 1;
            padding: 8px 16px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
            transition: all 0.3s;
        }
        .btn-preview {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        .btn-install {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        .btn-preview:hover, .btn-install:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
    </style>
</head>
<body>
    ${html}
    <script>
        const vscode = acquireVsCodeApi();
        
        function previewComponent(id) {
            vscode.postMessage({
                command: 'previewComponent',
                componentId: id
            });
        }
        
        function installComponent(id) {
            vscode.postMessage({
                command: 'installComponent',
                componentId: id
            });
        }
    </script>
</body>
</html>`;
    }

    private async _installComponent(componentId: string) {
        const component = ComponentMarketplacePanel.components.find(c => c.id === componentId);
        if (!component) {
            vscode.window.showErrorMessage('Component not found.');
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document.fileName.endsWith('.xaml')) {
            vscode.window.showWarningMessage('Please open a XAML file first.');
            return;
        }

        const position = editor.selection.active;
        const indent = this._getIndent(editor.document, position.line);
        const formattedXaml = component.xaml
            .split('\n')
            .map((line, index) => index === 0 ? line : indent + line)
            .join('\n');

        await editor.edit(editBuilder => {
            editBuilder.insert(position, formattedXaml);
        });

        // If component has ViewModel, offer to create it
        if (component.viewModel) {
            const create = await vscode.window.showInformationMessage(
                `Component '${component.name}' installed! Create ViewModel?`,
                'Yes', 'No'
            );
            if (create === 'Yes') {
                // Create ViewModel file
                // Implementation would go here
            }
        }

        vscode.window.showInformationMessage(`Component '${component.name}' installed!`);
    }

    private _previewComponent(componentId: string) {
        const component = ComponentMarketplacePanel.components.find(c => c.id === componentId);
        if (component) {
            // Show preview in a new document
            vscode.workspace.openTextDocument({
                content: `<!-- Preview: ${component.name} -->\n${component.xaml}`,
                language: 'xml'
            }).then(doc => {
                vscode.window.showTextDocument(doc, vscode.ViewColumn.Two);
            });
        }
    }

    private _getIndent(document: vscode.TextDocument, line: number): string {
        const lineText = document.lineAt(line).text;
        const match = lineText.match(/^(\s*)/);
        return match ? match[1] : '';
    }
}
