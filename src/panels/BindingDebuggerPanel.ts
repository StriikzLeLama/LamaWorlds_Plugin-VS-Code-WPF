import * as vscode from 'vscode';

/**
 * Binding Debugger Panel - Debug WPF bindings
 */
export class BindingDebuggerPanel {
    public static currentPanel: BindingDebuggerPanel | undefined;
    private static readonly viewType = 'bindingDebugger';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _bindings: any[] = [];

    public static createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        const column = vscode.window.activeTextEditor
            ? vscode.ViewColumn.Beside
            : vscode.ViewColumn.One;

        if (BindingDebuggerPanel.currentPanel) {
            BindingDebuggerPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            BindingDebuggerPanel.viewType,
            'Binding Debugger',
            column,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'out'),
                    vscode.Uri.joinPath(extensionUri, 'webviews')
                ]
            }
        );

        BindingDebuggerPanel.currentPanel = new BindingDebuggerPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public updateBindings(bindings: any[]) {
        this._bindings = bindings;
        this._panel.webview.postMessage({
            command: 'updateBindings',
            bindings: this._bindings
        });
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getWebviewContent(webview);
    }

    private _getWebviewContent(webview: vscode.Webview): string {
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'webviews', 'bindings', 'bindings.css')
        );
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'webviews', 'bindings', 'bindings.js')
        );

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="${styleUri}" rel="stylesheet">
    <title>Binding Debugger</title>
</head>
<body>
    <div class="binding-debugger-container">
        <div class="toolbar">
            <h1>Binding Debugger</h1>
            <button id="refreshBtn" class="lama-btn">Refresh</button>
        </div>
        <div class="bindings-list">
            <h2>All Bindings</h2>
            <div id="bindingsContainer"></div>
        </div>
        <div class="binding-details">
            <h2>Binding Details</h2>
            <div id="detailsContainer"></div>
        </div>
    </div>
    <script src="${scriptUri}"></script>
</body>
</html>`;
    }

    public dispose() {
        BindingDebuggerPanel.currentPanel = undefined;
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    public static dispose() {
        if (BindingDebuggerPanel.currentPanel) {
            BindingDebuggerPanel.currentPanel.dispose();
        }
    }
}

