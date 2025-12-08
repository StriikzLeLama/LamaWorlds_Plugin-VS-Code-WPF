import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Style Editor Panel - Visual editor for WPF Styles and Templates
 */
export class StyleEditorPanel {
    private static currentPanel: StyleEditorPanel | undefined;
    private static readonly viewType = 'styleEditor';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        const column = vscode.window.activeTextEditor
            ? vscode.ViewColumn.Beside
            : vscode.ViewColumn.One;

        if (StyleEditorPanel.currentPanel) {
            StyleEditorPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            StyleEditorPanel.viewType,
            'Style Editor',
            column,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'out'),
                    vscode.Uri.joinPath(extensionUri, 'webviews')
                ]
            }
        );

        StyleEditorPanel.currentPanel = new StyleEditorPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'refresh':
                        this._update();
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getWebviewContent(webview);
    }

    private _getWebviewContent(webview: vscode.Webview): string {
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'webviews', 'styleEditor', 'styleEditor.css')
        );
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'webviews', 'styleEditor', 'styleEditor.js')
        );

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="${styleUri}" rel="stylesheet">
    <title>Style Editor</title>
</head>
<body>
    <div class="style-editor-container">
        <div class="toolbar">
            <h1>Style Editor</h1>
            <button id="refreshBtn" class="lama-btn">Refresh</button>
        </div>
        <div class="content">
            <div class="styles-list">
                <h2>Styles</h2>
                <div id="stylesContainer"></div>
            </div>
            <div class="style-editor">
                <h2>Edit Style</h2>
                <div id="styleEditorContainer"></div>
            </div>
        </div>
    </div>
    <script src="${scriptUri}"></script>
</body>
</html>`;
    }

    public dispose() {
        StyleEditorPanel.currentPanel = undefined;
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    public static dispose() {
        if (StyleEditorPanel.currentPanel) {
            StyleEditorPanel.currentPanel.dispose();
        }
    }
}

