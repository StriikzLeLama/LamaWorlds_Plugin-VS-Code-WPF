import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { PreviewEngine } from '../preview/previewEngine';
import { TreeParser } from '../inspector/treeParser';
import { DragController } from '../interactive/dragController';
import { ResizeController } from '../interactive/resizeController';
import { HighlightManager } from '../inspector/highlightManager';
import { DebugConsole } from '../services/DebugConsole';

/**
 * Interactive XAML Preview Panel with WPF renderer integration
 */
export class XamlPreviewPanel {
    public static currentPanel: XamlPreviewPanel | undefined;
    private static _userClosed: boolean = false; // Tracks if user explicitly closed the panel
    private static _lastAutoOpen: number = 0;
    private static readonly viewType = 'xamlPreview';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _xamlContent: string = '';
    private _xamlDocument: vscode.TextDocument | null = null;
    private _isDisposed: boolean = false; // Flag to track if panel is disposed
    
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

        // Set the webview's initial html content
        this._panel.webview.html = this._getLoadingHtml();

        // Initialize preview engine asynchronously (non-blocking)
        this._initializePreviewEngine(context);

        // Listen for when the panel is disposed (user closes it)
        this._panel.onDidDispose(() => {
            // Mark as disposed immediately
            this._isDisposed = true;
            XamlPreviewPanel._userClosed = true;
            
            // Clear static reference so it doesn't auto-reopen
            if (XamlPreviewPanel.currentPanel === this) {
                XamlPreviewPanel.currentPanel = undefined;
            }
            this.dispose();
        }, null, this._disposables);
        
        // Listen for visibility changes to prevent auto-refresh when hidden
        this._panel.onDidChangeViewState((e) => {
            // Check if panel is still active
            if (this._isDisposed) return;
            
            try {
                // If panel becomes visible and we have XAML content, refresh
                if (e.webviewPanel.visible && this._xamlContent && this._panel.webview) {
                    this._refreshPreview();
                }
            } catch (error) {
                // Panel was disposed, ignore
            }
        }, null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                await this._handleMessage(message);
            },
            null,
            this._disposables
        );

        // Watch for XAML changes (only if panel is visible and not disposed)
        const watcher = vscode.workspace.createFileSystemWatcher('**/*.xaml');
        watcher.onDidChange(async (uri) => {
            // Check if panel is still active before accessing properties
            if (this._isDisposed) return;
            
            try {
                if (this._panel && 
                    this._panel.webview && 
                    this._panel.visible && 
                    this._xamlDocument?.uri.toString() === uri.toString()) {
                    await this._refreshPreview();
                }
            } catch (error) {
                // Panel was disposed during check, ignore
            }
        });
        this._disposables.push(watcher);

        // Watch for active editor changes (only if panel is visible and not disposed)
        vscode.window.onDidChangeActiveTextEditor(async (editor) => {
            // Check if panel is still active before accessing properties
            if (this._isDisposed) return;
            
            try {
                if (this._panel && 
                    this._panel.webview && 
                    this._panel.visible && 
                    editor && 
                    editor.document.fileName.endsWith('.xaml')) {
                    this._xamlDocument = editor.document;
                    this._dragController.setXamlDocument(editor.document);
                    this._resizeController.setXamlDocument(editor.document);
                    await this._refreshPreview();
                }
            } catch (error) {
                // Panel was disposed during check, ignore
            }
        });
    }

    public static createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext, options?: { auto?: boolean }) {
        const auto = options?.auto ?? false;
        // If user previously closed the panel, do not auto-reopen
        if (auto && XamlPreviewPanel._userClosed) {
            return;
        }

        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it (but don't force focus)
        if (XamlPreviewPanel.currentPanel) {
            // Only reveal if panel is not visible, otherwise just return
            if (!XamlPreviewPanel.currentPanel._panel.visible) {
                XamlPreviewPanel.currentPanel._panel.reveal(column, false); // false = don't take focus
            }
            return;
        }

        // If this is a user-triggered open, reset the userClosed flag
        if (!auto) {
            XamlPreviewPanel._userClosed = false;
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
                retainContextWhenHidden: true // Keep context when hidden to allow navigation
            }
        );

        XamlPreviewPanel.currentPanel = new XamlPreviewPanel(panel, extensionUri, context);
    }

    public static refreshPreview(uri: vscode.Uri) {
        if (XamlPreviewPanel.currentPanel && !XamlPreviewPanel.currentPanel._isDisposed) {
            XamlPreviewPanel.currentPanel._refreshPreview();
        }
    }

    public static dispose() {
        if (XamlPreviewPanel.currentPanel) {
            XamlPreviewPanel.currentPanel.dispose();
        }
    }

    public dispose() {
        // Mark as disposed immediately to prevent any further operations
        this._isDisposed = true;
        XamlPreviewPanel._userClosed = true;
        
        // Clear static reference first
        if (XamlPreviewPanel.currentPanel === this) {
            XamlPreviewPanel.currentPanel = undefined;
        }
        
        // Clean up components
        try {
            this._previewEngine.stopRenderer();
            this._previewEngine.dispose();
            this._treeParser.clear();
            this._highlightManager.clearHighlights();
        } catch (error) {
            // Ignore errors during cleanup
        }

        // Clean up our resources
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                try {
                    x.dispose();
                } catch (error) {
                    // Ignore errors during cleanup
                }
            }
        }
        
        // Dispose panel last
        try {
            this._panel.dispose();
        } catch (error) {
            // Panel may already be disposed, ignore
        }
    }

    /**
     * Initialize preview engine asynchronously with timeout and fallback
     */
    private async _initializePreviewEngine(context: vscode.ExtensionContext): Promise<void> {
        const startTime = Date.now();
        let progressStep = 0;
        
        // Update progress every 2 seconds
        const progressInterval = setInterval(() => {
            progressStep++;
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            let status = 'Initializing preview engine...';
            let estimatedTime = '';
            
            if (elapsed < 5) {
                status = 'Checking renderer...';
                estimatedTime = '~2-5 seconds';
            } else if (elapsed < 30) {
                status = 'Building renderer (first time only)...';
                estimatedTime = '~30-60 seconds';
            } else if (elapsed < 90) {
                status = 'Building renderer (this may take up to 2 minutes)...';
                estimatedTime = '~60-120 seconds';
            } else {
                status = 'Still building renderer...';
                estimatedTime = 'Please wait...';
            }
            
            if (this._panel && this._panel.webview) {
                this._panel.webview.html = this._getLoadingHtml(status, elapsed, estimatedTime);
            }
        }, 2000);

        const initTimeout = setTimeout(() => {
            clearInterval(progressInterval);
            if (!this._isDisposed && this._panel && this._panel.webview) {
                try {
                    this._panel.webview.html = this._getErrorHtml(
                        'Preview engine initialization is taking longer than expected. ' +
                        'The renderer may need to be built. Please check the Output panel for details.'
                    );
                } catch (error) {
                    // Panel was disposed, ignore
                }
            }
        }, 120000); // 2 minutes timeout

        try {
            await Promise.race([
                this._previewEngine.initialize(context),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Initialization timeout after 2 minutes')), 120000)
                )
            ]);
            
            clearInterval(progressInterval);
            clearTimeout(initTimeout);
            
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            DebugConsole.getInstance().info(`Preview engine initialized in ${elapsed} seconds`, 'XamlPreviewPanel', {
                initializationTime: elapsed
            });
            
            // Update preview after successful initialization
            await this._update();
        } catch (error: any) {
            clearInterval(progressInterval);
            clearTimeout(initTimeout);
            DebugConsole.getInstance().error('Preview engine initialization error', error, 'XamlPreviewPanel');
            
            // Show helpful error message
            const errorMessage = error.message || 'Unknown error';
            const isTimeout = errorMessage.includes('timeout');
            const isBuildError = errorMessage.includes('build') || errorMessage.includes('dotnet');
            
            let userMessage = 'Failed to initialize preview engine.';
            if (isTimeout) {
                userMessage += ' The renderer build is taking too long. Please ensure .NET 8 SDK is installed.';
            } else if (isBuildError) {
                userMessage += ' Failed to build renderer. Please check that .NET 8 SDK is installed and try again.';
            } else {
                userMessage += ` ${errorMessage}`;
            }
            
            if (!this._isDisposed && this._panel && this._panel.webview) {
                try {
                    this._panel.webview.html = this._getErrorHtml(userMessage);
                } catch (error) {
                    // Panel was disposed, ignore
                }
            }
            
            // Show notification to user
            vscode.window.showWarningMessage(
                'WPF Preview: Renderer initialization failed. Preview will work in fallback mode.',
                'Retry', 'Open Output'
            ).then(selection => {
                if (selection === 'Retry') {
                    this._initializePreviewEngine(context);
                } else if (selection === 'Open Output') {
                    vscode.commands.executeCommand('workbench.action.output.toggleOutput');
                }
            });
        }
    }

    private async _update() {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document.fileName.endsWith('.xaml')) {
            if (!this._isDisposed && this._panel && this._panel.webview) {
                try {
                    this._panel.webview.html = this._getErrorHtml('No XAML file is currently open.');
                } catch (error) {
                    // Panel was disposed, ignore
                }
            }
            return;
        }

        this._xamlDocument = editor.document;
        this._xamlContent = editor.document.getText();
        this._dragController.setXamlDocument(editor.document);
        this._resizeController.setXamlDocument(editor.document);

        await this._refreshPreview();
    }

    private async _refreshPreview() {
        // Check if panel is disposed or not available
        if (this._isDisposed || !this._panel || !this._panel.webview) {
            return; // Panel is disposed, skip refresh
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document.fileName.endsWith('.xaml')) {
            return;
        }

        this._xamlContent = editor.document.getText();

        try {
            // Render using preview engine
            const result = await this._previewEngine.renderFastLive(this._xamlContent);
            
            // Check again if panel is still active after async operation
            if (this._isDisposed || !this._panel || !this._panel.webview) {
                return; // Panel was disposed during rendering
            }
            
            // Get layout map
            const layoutMap = await this._previewEngine.getLayoutMap();
            
            // Parse layout map
            if (layoutMap) {
                this._treeParser.parseLayoutMap(layoutMap);
            }

            // Check again before sending message
            if (this._isDisposed || !this._panel || !this._panel.webview) {
                return;
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
            // Check again before sending error message
            if (this._isDisposed || !this._panel || !this._panel.webview) {
                return;
            }
            
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
        // Check if panel is still active
        if (this._isDisposed || !this._panel || !this._panel.webview) {
            return;
        }

        const layoutElement = this._treeParser.getElementById(elementId);
        if (layoutElement) {
            this._highlightManager.selectElement(layoutElement);
            
            // Scroll to element in XAML editor
            await this._scrollToElement(layoutElement);
            
            // Check again after async operation
            if (this._isDisposed || !this._panel || !this._panel.webview) {
                return;
            }
            
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

    private _getLoadingHtml(status: string = 'Initializing preview engine...', elapsed: number = 0, estimatedTime: string = ''): string {
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
            flex-direction: column;
        }
        .container {
            text-align: center;
            max-width: 400px;
        }
        .spinner {
            border: 3px solid #3e3e42;
            border-top: 3px solid #007acc;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .status {
            font-size: 16px;
            margin-bottom: 10px;
            color: #d4d4d4;
        }
        .time-info {
            font-size: 12px;
            color: #858585;
            margin-top: 10px;
        }
        .progress-bar {
            width: 300px;
            height: 4px;
            background: #3e3e42;
            border-radius: 2px;
            margin: 20px auto;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #007acc, #00a8ff);
            animation: progress 2s ease-in-out infinite;
            width: 60%;
        }
        @keyframes progress {
            0%, 100% { transform: translateX(-100%); }
            50% { transform: translateX(300%); }
        }
        .note {
            font-size: 11px;
            color: #858585;
            margin-top: 20px;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <div class="status">${status}</div>
        <div class="progress-bar">
            <div class="progress-fill"></div>
        </div>
        <div class="time-info">
            ${elapsed > 0 ? `Elapsed: ${elapsed}s` : ''}
            ${estimatedTime ? ` | Estimated: ${estimatedTime}` : ''}
        </div>
        <div class="note">
            ${elapsed > 30 ? 'First-time build can take 1-2 minutes. Please wait...' : 'This should only take a few seconds...'}
        </div>
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
