import * as vscode from 'vscode';

/**
 * Theme Manager Panel - Edit global theme colors, brushes, font sizes
 */
export class ThemeManagerPanel {
    private static currentPanel: ThemeManagerPanel | undefined;
    private static readonly viewType = 'themeManager';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        const column = vscode.window.activeTextEditor
            ? vscode.ViewColumn.Beside
            : vscode.ViewColumn.One;

        if (ThemeManagerPanel.currentPanel) {
            ThemeManagerPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            ThemeManagerPanel.viewType,
            'Theme Manager',
            column,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'out'),
                    vscode.Uri.joinPath(extensionUri, 'webviews')
                ]
            }
        );

        ThemeManagerPanel.currentPanel = new ThemeManagerPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getWebviewContent(webview);
    }

    private _getWebviewContent(webview: vscode.Webview): string {
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'webviews', 'themeManager', 'themeManager.css')
        );
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'webviews', 'themeManager', 'themeManager.js')
        );

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="${styleUri}" rel="stylesheet">
    <title>Theme Manager</title>
</head>
<body>
    <div class="theme-manager-container">
        <div class="toolbar">
            <h1>Theme Manager</h1>
            <button id="saveBtn" class="lama-btn">Save Theme</button>
        </div>
        <div class="content">
            <div class="theme-section">
                <h2>Colors</h2>
                <div id="colorsContainer"></div>
            </div>
            <div class="theme-section">
                <h2>Brushes</h2>
                <div id="brushesContainer"></div>
            </div>
            <div class="theme-section">
                <h2>Typography</h2>
                <div id="fontsContainer"></div>
            </div>
        </div>
    </div>
    <script src="${scriptUri}"></script>
</body>
</html>`;
    }

    public dispose() {
        ThemeManagerPanel.currentPanel = undefined;
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    public static dispose() {
        if (ThemeManagerPanel.currentPanel) {
            ThemeManagerPanel.currentPanel.dispose();
        }
    }
}

