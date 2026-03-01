import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Project Dashboard Panel
 * Provides statistics and an overview of the WPF project
 */
export class DashboardPanel {
    public static currentPanel: DashboardPanel | undefined;
    private static readonly viewType = 'xamlDashboard';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async (message: any) => {
                await this._handleMessage(message);
            },
            null,
            this._disposables
        );
    }

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.ViewColumn.One;

        if (DashboardPanel.currentPanel) {
            DashboardPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            DashboardPanel.viewType,
            'LamaWorlds Dashboard',
            column,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'webviews'),
                    vscode.Uri.joinPath(extensionUri, 'out')
                ],
                retainContextWhenHidden: true
            }
        );

        DashboardPanel.currentPanel = new DashboardPanel(panel, extensionUri);
    }

    public static dispose() {
        if (DashboardPanel.currentPanel) {
            DashboardPanel.currentPanel.dispose();
        }
    }

    public dispose() {
        DashboardPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private async _handleMessage(message: any) {
        switch (message.command) {
            case 'requestStats':
                await this._sendStats();
                break;
            case 'openFile':
                const uri = vscode.Uri.file(message.path);
                await vscode.commands.executeCommand('vscode.open', uri);
                break;
        }
    }

    private async _sendStats() {
        const xamlFiles = await vscode.workspace.findFiles('**/*.xaml', '**/obj/**');
        const csFiles = await vscode.workspace.findFiles('**/*.cs', '**/obj/**');

        const recentFiles = xamlFiles
            .slice(0, 5)
            .map(f => ({
                name: path.basename(f.fsPath),
                path: vscode.workspace.asRelativePath(f),
                fullPath: f.fsPath
            }));

        this._panel.webview.postMessage({
            command: 'updateStats',
            xamlCount: xamlFiles.length,
            csCount: csFiles.length,
            recentFiles: recentFiles
        });
    }

    private _update() {
        this._panel.webview.html = this._getWebviewContent();
    }

    private _getWebviewContent(): string {
        const htmlUri = vscode.Uri.joinPath(this._extensionUri, 'webviews', 'dashboard', 'dashboard.html');
        const cssUri = vscode.Uri.joinPath(this._extensionUri, 'webviews', 'dashboard', 'dashboard.css');
        const jsUri = vscode.Uri.joinPath(this._extensionUri, 'webviews', 'dashboard', 'dashboard.js');

        const htmlPath = this._panel.webview.asWebviewUri(htmlUri);
        const cssPath = this._panel.webview.asWebviewUri(cssUri);
        const jsPath = this._panel.webview.asWebviewUri(jsUri);

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="${cssPath}">
</head>
<body>
    <div id="root"></div>
    <script>
        fetch("${htmlPath}")
            .then(response => response.text())
            .then(html => {
                document.getElementById('root').innerHTML = html;
                const script = document.createElement('script');
                script.src = "${jsPath}";
                document.body.appendChild(script);
            });
    </script>
</body>
</html>`;
    }
}
