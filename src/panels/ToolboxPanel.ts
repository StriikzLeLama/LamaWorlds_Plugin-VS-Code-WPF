import * as vscode from 'vscode';
import * as path from 'path';

interface ToolboxControl {
    name: string;
    category: string;
    xaml: string;
    icon: string;
}

export class ToolboxPanel {
    public static currentPanel: ToolboxPanel | undefined;
    private static readonly viewType = 'toolbox';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    private static readonly controls: ToolboxControl[] = [
        {
            name: 'Button',
            category: 'Common',
            xaml: '<Button Content="Button" Margin="5" />',
            icon: '$(symbol-event)'
        },
        {
            name: 'TextBox',
            category: 'Common',
            xaml: '<TextBox Text="TextBox" Margin="5" />',
            icon: '$(edit)'
        },
        {
            name: 'TextBlock',
            category: 'Common',
            xaml: '<TextBlock Text="TextBlock" Margin="5" />',
            icon: '$(text-size)'
        },
        {
            name: 'Grid',
            category: 'Layout',
            xaml: '<Grid>\n    $0\n</Grid>',
            icon: '$(symbol-structure)'
        },
        {
            name: 'StackPanel',
            category: 'Layout',
            xaml: '<StackPanel>\n    $0\n</StackPanel>',
            icon: '$(list-ordered)'
        },
        {
            name: 'Border',
            category: 'Layout',
            xaml: '<Border BorderBrush="#CCCCCC" BorderThickness="1" CornerRadius="5" Padding="10">\n    $0\n</Border>',
            icon: '$(symbol-class)'
        },
        {
            name: 'Image',
            category: 'Media',
            xaml: '<Image Source="path/to/image.png" Stretch="Uniform" />',
            icon: '$(file-media)'
        },
        {
            name: 'NeonButton',
            category: 'Lama Worlds',
            xaml: '<Button Content="Neon Button" Style="{StaticResource NeonButton}" Command="{Binding CommandName}" />',
            icon: '$(symbol-event)'
        },
        {
            name: 'GlassCard',
            category: 'Lama Worlds',
            xaml: '<Border Style="{StaticResource GlassCard}" Margin="10">\n    <StackPanel>\n        <TextBlock Text="Title" Style="{StaticResource Header1}"/>\n        <TextBlock Text="Content" Foreground="{StaticResource TextSecondaryBrush}"/>\n    </StackPanel>\n</Border>',
            icon: '$(symbol-color)'
        },
        {
            name: 'HoloPanel',
            category: 'Lama Worlds',
            xaml: '<Border Background="{StaticResource HoloBackgroundBrush}" CornerRadius="10" Padding="15">\n    $0\n</Border>',
            icon: '$(symbol-structure)'
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
                    case 'insertControl':
                        await this._insertControl(message.controlName);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.ViewColumn.Two;

        if (ToolboxPanel.currentPanel) {
            ToolboxPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            ToolboxPanel.viewType,
            'WPF Toolbox',
            column,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri]
            }
        );

        ToolboxPanel.currentPanel = new ToolboxPanel(panel, extensionUri);
    }

    public static async insertControl(controlType: string) {
        const control = ToolboxPanel.controls.find(c => c.name === controlType);
        if (control) {
            await ToolboxPanel._insertControlXaml(control.xaml);
        }
    }

    public static dispose() {
        if (ToolboxPanel.currentPanel) {
            ToolboxPanel.currentPanel.dispose();
        }
    }

    public dispose() {
        ToolboxPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update() {
        const categories = Array.from(new Set(ToolboxPanel.controls.map(c => c.category)));
        
        let controlsHtml = '';
        for (const category of categories) {
            const categoryControls = ToolboxPanel.controls.filter(c => c.category === category);
            controlsHtml += `<div class="category">
                <h3>${category}</h3>
                <div class="controls-list">`;
            
            for (const control of categoryControls) {
                controlsHtml += `
                    <div class="control-item" data-control="${control.name}">
                        <span class="control-icon">${control.icon}</span>
                        <span class="control-name">${control.name}</span>
                    </div>
                `;
            }
            
            controlsHtml += `</div></div>`;
        }

        this._panel.webview.html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WPF Toolbox</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 10px;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .category {
            margin-bottom: 20px;
        }
        .category h3 {
            font-size: 12px;
            text-transform: uppercase;
            color: var(--vscode-descriptionForeground);
            margin: 10px 0 5px 0;
            padding: 5px 0;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .controls-list {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        .control-item {
            display: flex;
            align-items: center;
            padding: 8px;
            cursor: pointer;
            border-radius: 4px;
            transition: background 0.2s;
        }
        .control-item:hover {
            background: var(--vscode-list-hoverBackground);
        }
        .control-icon {
            margin-right: 8px;
            font-size: 16px;
        }
        .control-name {
            font-size: 13px;
        }
    </style>
</head>
<body>
    <h2>WPF Toolbox</h2>
    <p style="font-size: 11px; color: var(--vscode-descriptionForeground);">
        Click a control to insert it into your XAML file
    </p>
    ${controlsHtml}
    <script>
        const vscode = acquireVsCodeApi();
        
        document.querySelectorAll('.control-item').forEach(item => {
            item.addEventListener('click', () => {
                const controlName = item.getAttribute('data-control');
                vscode.postMessage({
                    command: 'insertControl',
                    controlName: controlName
                });
            });
        });
    </script>
</body>
</html>`;
    }

    private async _insertControl(controlName: string) {
        const control = ToolboxPanel.controls.find(c => c.name === controlName);
        if (control) {
            await ToolboxPanel._insertControlXaml(control.xaml);
        }
    }

    private static async _insertControlXaml(xaml: string) {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document.fileName.endsWith('.xaml')) {
            vscode.window.showWarningMessage('Please open a XAML file first.');
            return;
        }

        const position = editor.selection.active;
        const line = editor.document.lineAt(position.line);
        const indent = line.text.match(/^(\s*)/)?.[1] || '';

        // Format XAML with proper indentation
        const lines = xaml.split('\n');
        const formattedXaml = lines
            .map((line, index) => {
                if (index === 0) {
                    return line;
                }
                return indent + line;
            })
            .join('\n');

        await editor.edit((editBuilder: vscode.TextEditorEdit) => {
            editBuilder.insert(position, formattedXaml);
        });

        vscode.window.showInformationMessage(`Inserted ${xaml.split('\n')[0].match(/<(\w+)/)?.[1] || 'control'}`);
    }
}
