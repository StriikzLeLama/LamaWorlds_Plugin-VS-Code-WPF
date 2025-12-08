import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Performance Profiler Panel - WPF Performance Analyzer
 */
export class PerformanceProfilerPanel {
    private static currentPanel: PerformanceProfilerPanel | undefined;
    private static readonly viewType = 'performanceProfiler';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _metrics: any = {
        fps: 0,
        layoutTime: 0,
        renderTime: 0,
        elements: []
    };

    public static createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        const column = vscode.window.activeTextEditor
            ? vscode.ViewColumn.Beside
            : vscode.ViewColumn.One;

        if (PerformanceProfilerPanel.currentPanel) {
            PerformanceProfilerPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            PerformanceProfilerPanel.viewType,
            'Performance Profiler',
            column,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'out'),
                    vscode.Uri.joinPath(extensionUri, 'webviews')
                ]
            }
        );

        PerformanceProfilerPanel.currentPanel = new PerformanceProfilerPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public updateMetrics(metrics: any) {
        this._metrics = metrics;
        this._panel.webview.postMessage({
            command: 'updateMetrics',
            metrics: this._metrics
        });
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getWebviewContent(webview);
    }

    private _getWebviewContent(webview: vscode.Webview): string {
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'webviews', 'performance', 'performance.css')
        );
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'webviews', 'performance', 'performance.js')
        );

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="${styleUri}" rel="stylesheet">
    <title>Performance Profiler</title>
</head>
<body>
    <div class="profiler-container">
        <div class="toolbar">
            <h1>Performance Profiler</h1>
        </div>
        <div class="metrics">
            <div class="metric-card">
                <h3>FPS</h3>
                <div class="metric-value" id="fpsValue">0</div>
            </div>
            <div class="metric-card">
                <h3>Layout Time</h3>
                <div class="metric-value" id="layoutTimeValue">0ms</div>
            </div>
            <div class="metric-card">
                <h3>Render Time</h3>
                <div class="metric-value" id="renderTimeValue">0ms</div>
            </div>
        </div>
        <div class="elements-list">
            <h2>Heavy Elements</h2>
            <div id="elementsContainer"></div>
        </div>
        <div class="binding-report">
            <h2>Binding Overhead</h2>
            <div id="bindingContainer"></div>
        </div>
    </div>
    <script src="${scriptUri}"></script>
</body>
</html>`;
    }

    public dispose() {
        PerformanceProfilerPanel.currentPanel = undefined;
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    public static dispose() {
        if (PerformanceProfilerPanel.currentPanel) {
            PerformanceProfilerPanel.currentPanel.dispose();
        }
    }
}

