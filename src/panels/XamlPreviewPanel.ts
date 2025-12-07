import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class XamlPreviewPanel {
    public static currentPanel: XamlPreviewPanel | undefined;
    private static readonly viewType = 'xamlPreview';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _xamlContent: string = '';
    private _projectPath: string = '';
    private _buildProcess: any = null;

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'refresh':
                        await this._refreshPreview();
                        return;
                    case 'interact':
                        // Handle interaction events from preview
                        this._handleInteraction(message.data);
                        return;
                    case 'getXaml':
                        this._panel.webview.postMessage({
                            command: 'xamlContent',
                            content: this._xamlContent
                        });
                        return;
                }
            },
            null,
            this._disposables
        );

        // Watch for XAML changes
        const watcher = vscode.workspace.createFileSystemWatcher('**/*.xaml');
        watcher.onDidChange(async (uri) => {
            if (this._panel.visible) {
                await this._refreshPreview();
            }
        });
        this._disposables.push(watcher);
    }

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (XamlPreviewPanel.currentPanel) {
            XamlPreviewPanel.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            XamlPreviewPanel.viewType,
            'XAML Preview',
            column || vscode.ViewColumn.Two,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media'),
                    vscode.Uri.joinPath(extensionUri, 'out')
                ],
                retainContextWhenHidden: true
            }
        );

        XamlPreviewPanel.currentPanel = new XamlPreviewPanel(panel, extensionUri);
    }

    public static refreshPreview(uri: vscode.Uri) {
        if (XamlPreviewPanel.currentPanel) {
            XamlPreviewPanel.currentPanel._refreshPreview();
        }
    }

    public static dispose() {
        if (XamlPreviewPanel.currentPanel) {
            XamlPreviewPanel.currentPanel.dispose();
        }
    }

    public dispose() {
        XamlPreviewPanel.currentPanel = undefined;

        if (this._buildProcess) {
            this._buildProcess.kill();
        }

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private async _update() {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document.fileName.endsWith('.xaml')) {
            this._panel.webview.html = this._getErrorHtml('No XAML file is currently open.');
            return;
        }

        this._xamlContent = editor.document.getText();
        const document = editor.document;
        this._projectPath = path.dirname(document.fileName);

        // Find .csproj file
        let currentDir = this._projectPath;
        let csprojPath: string | null = null;
        while (currentDir !== path.dirname(currentDir)) {
            const files = fs.readdirSync(currentDir);
            const csproj = files.find(f => f.endsWith('.csproj'));
            if (csproj) {
                csprojPath = path.join(currentDir, csproj);
                this._projectPath = currentDir;
                break;
            }
            currentDir = path.dirname(currentDir);
        }

        if (!csprojPath) {
            this._panel.webview.html = this._getErrorHtml('No .csproj file found. Please open a WPF project.');
            return;
        }

        await this._refreshPreview();
    }

    private async _refreshPreview() {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document.fileName.endsWith('.xaml')) {
            return;
        }

        this._xamlContent = editor.document.getText();

        try {
            // Try to build and get preview
            const previewHtml = await this._generatePreview();
            this._panel.webview.html = previewHtml;
        } catch (error: any) {
            this._panel.webview.html = this._getErrorHtml(`Preview error: ${error.message}`);
        }
    }

    private async _generatePreview(): Promise<string> {
        // For now, create a simple HTML preview that renders XAML-like structure
        // In a production version, you would compile the XAML and run it in a WebView
        
        const xamlPreview = this._convertXamlToHtml(this._xamlContent);
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>XAML Preview</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .preview-container {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 800px;
            width: 100%;
        }
        .preview-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e0e0e0;
        }
        .preview-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
        }
        .refresh-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        }
        .refresh-btn:hover {
            background: #5568d3;
        }
        .preview-content {
            min-height: 400px;
        }
        ${this._extractStylesFromXaml(this._xamlContent)}
    </style>
</head>
<body>
    <div class="preview-container">
        <div class="preview-header">
            <div class="preview-title">XAML Live Preview</div>
            <button class="refresh-btn" onclick="refreshPreview()">Refresh</button>
        </div>
        <div class="preview-content">
            ${xamlPreview}
        </div>
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        
        function refreshPreview() {
            vscode.postMessage({ command: 'refresh' });
        }
        
        // Handle interactions
        document.addEventListener('click', (e) => {
            vscode.postMessage({
                command: 'interact',
                data: { type: 'click', target: e.target.tagName }
            });
        });
        
        // Listen for XAML updates
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'xamlContent') {
                location.reload();
            }
        });
    </script>
</body>
</html>`;
    }

    private _convertXamlToHtml(xaml: string): string {
        // Simplified XAML to HTML converter
        // In production, this would use a proper XAML parser
        
        let html = xaml;
        
        // Convert common XAML elements to HTML
        html = html.replace(/<Grid[^>]*>/gi, '<div class="grid">');
        html = html.replace(/<\/Grid>/gi, '</div>');
        html = html.replace(/<StackPanel[^>]*>/gi, '<div class="stack-panel">');
        html = html.replace(/<\/StackPanel>/gi, '</div>');
        html = html.replace(/<Button[^>]*Content="([^"]*)"[^>]*>/gi, '<button class="wpf-button">$1</button>');
        html = html.replace(/<TextBlock[^>]*Text="([^"]*)"[^>]*>/gi, '<div class="text-block">$1</div>');
        html = html.replace(/<TextBox[^>]*>/gi, '<input type="text" class="text-box" />');
        html = html.replace(/<Border[^>]*>/gi, '<div class="border">');
        html = html.replace(/<\/Border>/gi, '</div>');
        
        // Remove XAML namespaces and attributes for preview
        html = html.replace(/xmlns[^=]*="[^"]*"/gi, '');
        html = html.replace(/x:Class="[^"]*"/gi, '');
        html = html.replace(/\{[^}]*\}/g, ''); // Remove bindings for preview
        
        return html;
    }

    private _extractStylesFromXaml(xaml: string): string {
        // Extract and convert XAML styles to CSS
        return `
            .grid { display: grid; }
            .stack-panel { display: flex; flex-direction: column; }
            .wpf-button {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
                margin: 5px;
            }
            .wpf-button:hover {
                opacity: 0.9;
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            }
            .text-block {
                padding: 10px;
                color: #333;
            }
            .text-box {
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                margin: 5px;
            }
            .border {
                border: 1px solid #e0e0e0;
                border-radius: 5px;
                padding: 10px;
                margin: 5px;
            }
        `;
    }

    private _handleInteraction(data: any) {
        // Handle user interactions with the preview
        console.log('Preview interaction:', data);
    }

    private _getErrorHtml(message: string): string {
        return `<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 20px;
            color: #ff4444;
        }
    </style>
</head>
<body>
    <h3>Preview Unavailable</h3>
    <p>${message}</p>
</body>
</html>`;
    }
}
