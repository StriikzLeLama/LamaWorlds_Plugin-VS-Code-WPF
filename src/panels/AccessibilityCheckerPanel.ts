import * as vscode from 'vscode';

/**
 * Accessibility Checker Panel - Check WPF Accessibility
 */
export class AccessibilityCheckerPanel {
    public static currentPanel: AccessibilityCheckerPanel | undefined;
    private static readonly viewType = 'accessibilityChecker';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        const column = vscode.window.activeTextEditor
            ? vscode.ViewColumn.Beside
            : vscode.ViewColumn.One;

        if (AccessibilityCheckerPanel.currentPanel) {
            AccessibilityCheckerPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            AccessibilityCheckerPanel.viewType,
            'Accessibility Checker',
            column,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'out'),
                    vscode.Uri.joinPath(extensionUri, 'webviews')
                ]
            }
        );

        AccessibilityCheckerPanel.currentPanel = new AccessibilityCheckerPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public updateIssues(issues: any[]) {
        this._panel.webview.postMessage({
            command: 'updateIssues',
            issues
        });
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getWebviewContent(webview);
    }

    private _getWebviewContent(webview: vscode.Webview): string {
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'webviews', 'accessibility', 'accessibility.css')
        );
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'webviews', 'accessibility', 'accessibility.js')
        );

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="${styleUri}" rel="stylesheet">
    <title>Accessibility Checker</title>
</head>
<body>
    <div class="accessibility-container">
        <div class="toolbar">
            <h1>Accessibility Checker</h1>
            <button id="checkBtn" class="lama-btn">Check Now</button>
        </div>
        <div class="issues-list">
            <h2>Issues Found</h2>
            <div id="issuesContainer"></div>
        </div>
    </div>
    <script src="${scriptUri}"></script>
</body>
</html>`;
    }

    public dispose() {
        AccessibilityCheckerPanel.currentPanel = undefined;
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    public static dispose() {
        if (AccessibilityCheckerPanel.currentPanel) {
            AccessibilityCheckerPanel.currentPanel.dispose();
        }
    }
}

