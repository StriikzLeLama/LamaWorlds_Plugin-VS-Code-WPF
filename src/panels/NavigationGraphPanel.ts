import * as vscode from 'vscode';

/**
 * Navigation Graph Panel - Visualize application navigation
 */
export class NavigationGraphPanel {
    public static currentPanel: NavigationGraphPanel | undefined;
    private static readonly viewType = 'navigationGraph';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        const column = vscode.window.activeTextEditor
            ? vscode.ViewColumn.Beside
            : vscode.ViewColumn.One;

        if (NavigationGraphPanel.currentPanel) {
            NavigationGraphPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            NavigationGraphPanel.viewType,
            'Navigation Graph',
            column,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'out'),
                    vscode.Uri.joinPath(extensionUri, 'webviews')
                ]
            }
        );

        NavigationGraphPanel.currentPanel = new NavigationGraphPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'openFile':
                        vscode.workspace.openTextDocument(message.path).then(doc => {
                            vscode.window.showTextDocument(doc);
                        });
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    public updateGraph(nodes: any[], edges: any[]) {
        this._panel.webview.postMessage({
            command: 'updateGraph',
            nodes,
            edges
        });
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getWebviewContent(webview);
    }

    private _getWebviewContent(webview: vscode.Webview): string {
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'webviews', 'navigation', 'navigation.css')
        );
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'webviews', 'navigation', 'navigation.js')
        );

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="${styleUri}" rel="stylesheet">
    <title>Navigation Graph</title>
</head>
<body>
    <div class="navigation-container">
        <div class="toolbar">
            <h1>Navigation Graph</h1>
            <button id="refreshBtn" class="lama-btn">Refresh</button>
        </div>
        <div id="graphContainer"></div>
    </div>
    <script src="${scriptUri}"></script>
</body>
</html>`;
    }

    public dispose() {
        NavigationGraphPanel.currentPanel = undefined;
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    public static dispose() {
        if (NavigationGraphPanel.currentPanel) {
            NavigationGraphPanel.currentPanel.dispose();
        }
    }
}

