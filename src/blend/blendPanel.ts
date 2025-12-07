import * as vscode from 'vscode';

/**
 * WPF Blend Clone - Visual States and Triggers Editor
 */
export class BlendPanel {
    public static currentPanel: BlendPanel | undefined;
    private static readonly viewType = 'blendEditor';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _visualStates: any[] = [];
    private _triggers: any[] = [];

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
        const column = vscode.ViewColumn.Two;

        if (BlendPanel.currentPanel) {
            BlendPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            BlendPanel.viewType,
            'Visual States Editor',
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

        BlendPanel.currentPanel = new BlendPanel(panel, extensionUri);
    }

    public static dispose() {
        if (BlendPanel.currentPanel) {
            BlendPanel.currentPanel.dispose();
        }
    }

    public dispose() {
        BlendPanel.currentPanel = undefined;
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
            case 'addVisualState':
                await this._addVisualState(message.data);
                break;
            case 'addTrigger':
                await this._addTrigger(message.data);
                break;
            case 'generateXaml':
                await this._generateXaml();
                break;
        }
    }

    private async _addVisualState(data: any) {
        this._visualStates.push(data);
        this._update();
    }

    private async _addTrigger(data: any) {
        this._triggers.push(data);
        this._update();
    }

    private async _generateXaml() {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document.fileName.endsWith('.xaml')) {
            vscode.window.showWarningMessage('Please open a XAML file first.');
            return;
        }

        let xaml = '<VisualStateManager.VisualStateGroups>\n';
        xaml += '    <VisualStateGroup>\n';
        
        for (const state of this._visualStates) {
            xaml += `        <VisualState x:Name="${state.name}">\n`;
            xaml += `            <Storyboard>\n`;
            // Add storyboard animations
            xaml += `            </Storyboard>\n`;
            xaml += `        </VisualState>\n`;
        }
        
        xaml += '    </VisualStateGroup>\n';
        xaml += '</VisualStateManager.VisualStateGroups>\n';

        const position = editor.selection.active;
        await editor.edit(editBuilder => {
            editBuilder.insert(position, xaml);
        });

        vscode.window.showInformationMessage('Visual States generated!');
    }

    private _update() {
        this._panel.webview.html = this._getWebviewContent();
    }

    private _getWebviewContent(): string {
        const htmlUri = vscode.Uri.joinPath(this._extensionUri, 'webviews', 'blend', 'blend.html');
        const cssUri = vscode.Uri.joinPath(this._extensionUri, 'webviews', 'blend', 'blend.css');
        const jsUri = vscode.Uri.joinPath(this._extensionUri, 'webviews', 'blend', 'blend.js');

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
    <div class="blend-container">
        <div class="toolbar">
            <button class="btn btn-primary" id="addStateBtn">+ Visual State</button>
            <button class="btn" id="addTriggerBtn">+ Trigger</button>
            <button class="btn" id="generateBtn">Generate XAML</button>
        </div>
        <div class="content">
            <div class="states-panel">
                <div class="panel-header">Visual States</div>
                <div class="states-list" id="statesList"></div>
            </div>
            <div class="triggers-panel">
                <div class="panel-header">Triggers</div>
                <div class="triggers-list" id="triggersList"></div>
            </div>
        </div>
    </div>
    <script src="${jsPath}"></script>
</body>
</html>`;
    }
}

