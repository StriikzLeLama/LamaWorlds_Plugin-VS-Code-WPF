import * as vscode from 'vscode';

/**
 * AI Assistant Panel
 * Provides a context-aware chat interface for WPF development assistance
 */
export class AIAssistantPanel {
    public static currentPanel: AIAssistantPanel | undefined;
    private static readonly viewType = 'xamlAIAssistant';
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
        const column = vscode.ViewColumn.Beside;

        if (AIAssistantPanel.currentPanel) {
            AIAssistantPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            AIAssistantPanel.viewType,
            'LamaWorlds AI',
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

        AIAssistantPanel.currentPanel = new AIAssistantPanel(panel, extensionUri);
    }

    public static dispose() {
        if (AIAssistantPanel.currentPanel) {
            AIAssistantPanel.currentPanel.dispose();
        }
    }

    public dispose() {
        AIAssistantPanel.currentPanel = undefined;
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
            case 'askAI':
                await this._processAIRequest(message.text);
                break;
        }
    }

    private async _processAIRequest(text: string) {
        // Simulate AI processing
        // In a real implementation, this would call OpenAI/Gemini/Ollama
        setTimeout(() => {
            let response = "";
            if (text.toLowerCase().includes('explain')) {
                response = "I've analyzed your XAML. You're using a **Grid** with 3 rows. The first row contains a **GlassCard** with a shadow effect. The bindings look correctly mapped to your ViewModel.";
            } else if (text.toLowerCase().includes('neon') || text.toLowerCase().includes('glass')) {
                response = "Sure! I can apply a **Glassmorphism** style to your button. Use `Style=\"{StaticResource GlassButtonStyle}\"` and make sure you have the `LamaWorlds.Resources` dictionary in your App.xaml.";
            } else if (text.toLowerCase().includes('fix')) {
                response = "I found 2 potential issues in your bindings. \n1. **{Binding UserName}**: The property in your ViewModel is named `Username` (lowercase 'n').\n2. **{Binding Path=SaveCommand}**: You can simplify this to `{Binding SaveCommand}`.";
            } else {
                response = "That's a great question about WPF! As a LamaWorlds assistant, I recommend using **MVVM** for all your data logic. How else can I help with your UI today?";
            }

            this._panel.webview.postMessage({
                command: 'addMessage',
                text: response,
                sender: 'ai'
            });
        }, 1000);
    }

    private _update() {
        this._panel.webview.html = this._getWebviewContent();
    }

    private _getWebviewContent(): string {
        const htmlUri = vscode.Uri.joinPath(this._extensionUri, 'webviews', 'aiAssistant', 'aiAssistant.html');
        const cssUri = vscode.Uri.joinPath(this._extensionUri, 'webviews', 'aiAssistant', 'aiAssistant.css');
        const jsUri = vscode.Uri.joinPath(this._extensionUri, 'webviews', 'aiAssistant', 'aiAssistant.js');

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
