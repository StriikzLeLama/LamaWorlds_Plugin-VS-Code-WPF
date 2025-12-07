import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { PreviewEngine } from '../preview/previewEngine';
import { TreeParser } from '../inspector/treeParser';
import { DragController } from '../interactive/dragController';
import { ResizeController } from '../interactive/resizeController';
import { HighlightManager } from '../inspector/highlightManager';

/**
 * Interactive XAML Preview Panel with WPF renderer integration
 */
export class XamlPreviewPanel {
    public static currentPanel: XamlPreviewPanel | undefined;
    private static readonly viewType = 'xamlPreview';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _xamlContent: string = '';
    private _xamlDocument: vscode.TextDocument | null = null;
    
    // Preview engine and components
    private _previewEngine: PreviewEngine;
    private _treeParser: TreeParser;
    private _dragController: DragController;
    private _resizeController: ResizeController;
    private _highlightManager: HighlightManager;

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Initialize components
        this._previewEngine = PreviewEngine.getInstance();
        this._treeParser = new TreeParser();
        this._highlightManager = new HighlightManager();
        this._dragController = new DragController(this._treeParser);
        this._resizeController = new ResizeController(this._treeParser);

        // Initialize preview engine
        this._previewEngine.initialize(context).then(() => {
            this._update();
        }).catch((error) => {
            this._panel.webview.html = this._getErrorHtml(`Failed to initialize preview engine: ${error.message}`);
        });

        // Set the webview's initial html content
        this._panel.webview.html = this._getLoadingHtml();

        // Listen for when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                await this._handleMessage(message);
            },
            null,
            this._disposables
        );

        // Watch for XAML changes
        const watcher = vscode.workspace.createFileSystemWatcher('**/*.xaml');
        watcher.onDidChange(async (uri) => {
            if (this._panel.visible && this._xamlDocument?.uri.toString() === uri.toString()) {
                await this._refreshPreview();
            }
        });
        this._disposables.push(watcher);

        // Watch for active editor changes
        vscode.window.onDidChangeActiveTextEditor(async (editor) => {
            if (editor && editor.document.fileName.endsWith('.xaml')) {
                this._xamlDocument = editor.document;
                this._dragController.setXamlDocument(editor.document);
                this._resizeController.setXamlDocument(editor.document);
                await this._refreshPreview();
            }
        });
    }

    public static createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
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
            'WPF Interactive Preview',
            column || vscode.ViewColumn.Two,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'webviews'),
                    vscode.Uri.joinPath(extensionUri, 'out')
                ],
                retainContextWhenHidden: true
            }
        );

        XamlPreviewPanel.currentPanel = new XamlPreviewPanel(panel, extensionUri, context);
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
        this._previewEngine.dispose();
        this._treeParser.clear();
        this._highlightManager.clearHighlights();

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

        this._xamlDocument = editor.document;
        this._xamlContent = editor.document.getText();
        this._dragController.setXamlDocument(editor.document);
        this._resizeController.setXamlDocument(editor.document);

        await this._refreshPreview();
    }

    private async _refreshPreview() {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document.fileName.endsWith('.xaml')) {
            return;
        }

        this._xamlContent = editor.document.getText();

        try {
            // Render using preview engine
            const result = await this._previewEngine.renderFastLive(this._xamlContent);
            
            // Get layout map
            const layoutMap = await this._previewEngine.getLayoutMap();
            
            // Parse layout map
            if (layoutMap) {
                this._treeParser.parseLayoutMap(layoutMap);
            }

            // Send preview update to webview
            this._panel.webview.postMessage({
                command: 'previewUpdate',
                imageBase64: result.imageBase64,
                width: result.width,
                height: result.height,
                layoutMap: layoutMap
            });
        } catch (error: any) {
            this._panel.webview.postMessage({
                command: 'previewError',
                error: error.message || 'Preview error occurred'
            });
        }
    }

    private async _handleMessage(message: any) {
        switch (message.command) {
            case 'requestPreview':
                await this._refreshPreview();
                break;

            case 'elementSelected':
                await this._handleElementSelected(message.elementId, message.element);
                break;

            case 'startDrag':
                if (message.elementId) {
                    const element = this._treeParser.getElementById(message.elementId);
                    if (element) {
                        this._dragController.startDrag(element, message.x, message.y);
                    }
                }
                break;

            case 'updateDrag':
                if (message.elementId) {
                    this._dragController.updateDrag(message.x, message.y);
                }
                break;

            case 'endDrag':
                this._dragController.endDrag();
                await this._refreshPreview();
                break;

            case 'startResize':
                if (message.elementId) {
                    const element = this._treeParser.getElementById(message.elementId);
                    if (element) {
                        this._resizeController.startResize(element, message.handle, message.x, message.y);
                    }
                }
                break;

            case 'updateResize':
                if (message.elementId) {
                    this._resizeController.updateResize(message.x, message.y);
                }
                break;

            case 'endResize':
                this._resizeController.endResize();
                await this._refreshPreview();
                break;
        }
    }

    private async _handleElementSelected(elementId: string, element: any) {
        const layoutElement = this._treeParser.getElementById(elementId);
        if (layoutElement) {
            this._highlightManager.selectElement(layoutElement);
            
            // Scroll to element in XAML editor
            await this._scrollToElement(layoutElement);
            
            // Send highlight update to webview
            this._panel.webview.postMessage({
                command: 'elementHighlighted',
                element: layoutElement
            });
        }
    }

    private async _scrollToElement(element: any) {
        if (!this._xamlDocument) {
            return;
        }

        const editor = await vscode.window.showTextDocument(this._xamlDocument);
        const xaml = this._xamlDocument.getText();
        
        // Try to find element by name or type
        let searchPattern: RegExp | null = null;
        if (element.name) {
            searchPattern = new RegExp(`x:Name="${element.name}"|Name="${element.name}"`);
        } else {
            searchPattern = new RegExp(`<${element.type}[^>]*>`, 'i');
        }

        if (searchPattern) {
            const lines = xaml.split('\n');
            for (let i = 0; i < lines.length; i++) {
                if (searchPattern.test(lines[i])) {
                    const position = new vscode.Position(i, 0);
                    editor.revealRange(new vscode.Range(position, position));
                    editor.selection = new vscode.Selection(position, position);
                    break;
                }
            }
        }
    }

    private _getWebviewContent(): string {
        const htmlUri = vscode.Uri.joinPath(this._extensionUri, 'webviews', 'preview', 'preview.html');
        const cssUri = vscode.Uri.joinPath(this._extensionUri, 'webviews', 'preview', 'preview.css');
        const jsUri = vscode.Uri.joinPath(this._extensionUri, 'webviews', 'preview', 'preview.js');

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
    <div class="preview-container">
        <div class="preview-toolbar">
            <div class="toolbar-left">
                <button id="refreshBtn" class="toolbar-btn" title="Refresh Preview">
                    <span class="icon">🔄</span>
                </button>
                <button id="modeBtn" class="toolbar-btn" title="Toggle Mode">
                    <span class="icon">⚡</span>
                    <span id="modeLabel">FastLive</span>
                </button>
            </div>
            <div class="toolbar-right">
                <div class="zoom-controls">
                    <button id="zoomOutBtn" class="toolbar-btn" title="Zoom Out">−</button>
                    <span id="zoomLabel">100%</span>
                    <button id="zoomInBtn" class="toolbar-btn" title="Zoom In">+</button>
                </div>
            </div>
        </div>
        
        <div class="preview-content" id="previewContent">
            <div class="preview-image-container" id="imageContainer">
                <img id="previewImage" alt="XAML Preview" />
                <canvas id="overlayCanvas"></canvas>
            </div>
            <div class="preview-loading" id="loadingIndicator">
                <div class="spinner"></div>
                <p>Rendering preview...</p>
            </div>
            <div class="preview-error" id="errorIndicator" style="display: none;">
                <p id="errorMessage"></p>
            </div>
        </div>
    </div>
    
    <script src="${jsPath}"></script>
</body>
</html>`;
    }

    private _getLoadingHtml(): string {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #1e1e1e;
            color: #d4d4d4;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
        }
        .spinner {
            border: 3px solid #3e3e42;
            border-top: 3px solid #007acc;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div>
        <div class="spinner"></div>
        <p>Initializing preview engine...</p>
    </div>
</body>
</html>`;
    }

    private _getErrorHtml(message: string): string {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #1e1e1e;
            color: #f48771;
            padding: 20px;
            margin: 0;
        }
        h3 {
            color: #f48771;
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
