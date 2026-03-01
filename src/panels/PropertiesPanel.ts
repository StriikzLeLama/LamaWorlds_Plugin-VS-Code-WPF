import * as vscode from 'vscode';
import { LayoutElement } from '../preview/previewEngine';

/**
 * Properties Panel
 * Provides visual property editing for the selected XAML element
 */
export class PropertiesPanel {
    public static currentPanel: PropertiesPanel | undefined;
    private static readonly viewType = 'xamlProperties';
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
        const column = vscode.ViewColumn.Three; // Open in the third column (right side)

        if (PropertiesPanel.currentPanel) {
            PropertiesPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            PropertiesPanel.viewType,
            'Properties',
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

        PropertiesPanel.currentPanel = new PropertiesPanel(panel, extensionUri);
    }

    public static dispose() {
        if (PropertiesPanel.currentPanel) {
            PropertiesPanel.currentPanel.dispose();
        }
    }

    public dispose() {
        PropertiesPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    /**
     * Update selection from other panels
     */
    public selectElement(element: LayoutElement) {
        this._panel.webview.postMessage({
            command: 'elementSelected',
            element: element,
            properties: this._extractProperties(element)
        });
    }

    private async _handleMessage(message: any) {
        switch (message.command) {
            case 'updateProperty':
                await this._handlePropertyUpdate(message.elementId, message.property, message.value);
                break;
        }
    }

    private async _handlePropertyUpdate(elementId: string, property: string, value: any) {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document.fileName.endsWith('.xaml')) {
            return;
        }

        // This is a simplified property update logic
        // In a real implementation, it would use XamlRefactor or a specialized XML parser/writer
        vscode.window.showInformationMessage(`Update ${property} to ${value} for element ${elementId}`);

        // Trigger a preview refresh after update
        vscode.commands.executeCommand('lamaworlds.openXamlPreview');
    }

    private _extractProperties(element: LayoutElement): any {
        return {
            id: element.id,
            type: element.type,
            name: element.name || '',
            width: element.width || '',
            height: element.height || '',
            margin: element.margin || '',
            horizontalAlignment: element.horizontalAlignment || 'Stretch',
            verticalAlignment: element.verticalAlignment || 'Stretch',
            visibility: element.visibility || 'Visible',
            opacity: element.opacity !== undefined ? element.opacity : 1
        };
    }

    private _update() {
        this._panel.webview.html = this._getWebviewContent();
    }

    private _getWebviewContent(): string {
        const htmlUri = vscode.Uri.joinPath(this._extensionUri, 'webviews', 'properties', 'properties.html');
        const cssUri = vscode.Uri.joinPath(this._extensionUri, 'webviews', 'properties', 'properties.css');
        const jsUri = vscode.Uri.joinPath(this._extensionUri, 'webviews', 'properties', 'properties.js');

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
        // Inject the HTML content from the file
        fetch("${htmlPath}")
            .then(response => response.text())
            .then(html => {
                document.getElementById('root').innerHTML = html;
                // Re-initialize scripts after HTML is injected
                const script = document.createElement('script');
                script.src = "${jsPath}";
                document.body.appendChild(script);
            });
    </script>
</body>
</html>`;
    }
}
