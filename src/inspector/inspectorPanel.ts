import * as vscode from 'vscode';
import { TreeParser, TreeElement } from './treeParser';
import { LayoutElement } from '../preview/previewEngine';

/**
 * Visual Tree Inspector Panel
 * Provides deep XAML tree parsing, node selection, and property inspection
 */
export class InspectorPanel {
    public static currentPanel: InspectorPanel | undefined;
    private static readonly viewType = 'visualTreeInspector';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _treeParser: TreeParser | null = null;
    private _selectedElement: LayoutElement | null = null;

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

        if (InspectorPanel.currentPanel) {
            InspectorPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            InspectorPanel.viewType,
            'Visual Tree Inspector',
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

        InspectorPanel.currentPanel = new InspectorPanel(panel, extensionUri);
    }

    public static dispose() {
        if (InspectorPanel.currentPanel) {
            InspectorPanel.currentPanel.dispose();
        }
    }

    public dispose() {
        InspectorPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    /**
     * Update tree from layout map
     */
    public updateTree(layoutMap: LayoutElement | null) {
        if (layoutMap) {
            this._treeParser = new TreeParser();
            this._treeParser.parseLayoutMap(layoutMap);
            this._update();
        }
    }

    /**
     * Select element in inspector
     */
    public selectElement(elementId: string) {
        if (this._treeParser) {
            const element = this._treeParser.getElementById(elementId);
            if (element) {
                this._selectedElement = element;
                this._panel.webview.postMessage({
                    command: 'elementSelected',
                    element: element
                });
            }
        }
    }

    private async _handleMessage(message: any) {
        switch (message.command) {
            case 'selectNode':
                await this._handleNodeSelection(message.elementId);
                break;
            case 'jumpToXaml':
                await this._jumpToXaml(message.elementId);
                break;
            case 'refresh':
                await this._refresh();
                break;
        }
    }

    private async _handleNodeSelection(elementId: string) {
        if (this._treeParser) {
            const element = this._treeParser.getElementById(elementId);
            if (element) {
                this._selectedElement = element;
                
                // Notify preview panel to highlight (if available)
                // The preview panel will handle highlighting when it receives layout updates
                
                // Update inspector view
                this._panel.webview.postMessage({
                    command: 'elementSelected',
                    element: element,
                    properties: this._extractProperties(element)
                });
            }
        }
    }

    private async _jumpToXaml(elementId: string) {
        if (!this._treeParser) {
            return;
        }

        const element = this._treeParser.getElementById(elementId);
        if (!element) {
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document.fileName.endsWith('.xaml')) {
            vscode.window.showWarningMessage('Please open a XAML file first.');
            return;
        }

        const xaml = editor.document.getText();
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

    private async _refresh() {
        // Request fresh layout map from preview panel
        // This will be handled by the preview panel when it updates
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document.fileName.endsWith('.xaml')) {
            // Trigger preview refresh which will update the tree
            vscode.commands.executeCommand('lamaworlds.openXamlPreview');
        }
    }

    private _extractProperties(element: LayoutElement): any {
        return {
            id: element.id,
            type: element.type,
            name: element.name || '(unnamed)',
            bounds: element.bounds,
            margin: element.margin || '0',
            width: element.width || 'Auto',
            height: element.height || 'Auto',
            gridRow: element.gridRow !== undefined ? element.gridRow : null,
            gridColumn: element.gridColumn !== undefined ? element.gridColumn : null,
            canvasLeft: element.canvasLeft !== undefined ? element.canvasLeft : null,
            canvasTop: element.canvasTop !== undefined ? element.canvasTop : null,
            children: element.children ? element.children.length : 0
        };
    }

    private _update() {
        const treeStructure = this._treeParser?.getTreeStructure() || null;
        
        this._panel.webview.html = this._getWebviewContent(treeStructure);
    }

    private _getWebviewContent(treeStructure: TreeElement | null): string {
        const htmlUri = vscode.Uri.joinPath(this._extensionUri, 'webviews', 'inspector', 'inspector.html');
        const cssUri = vscode.Uri.joinPath(this._extensionUri, 'webviews', 'inspector', 'inspector.css');
        const jsUri = vscode.Uri.joinPath(this._extensionUri, 'webviews', 'inspector', 'inspector.js');

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
    <div class="inspector-container">
        <div class="toolbar">
            <button class="btn" id="refreshBtn">🔄 Refresh</button>
            <button class="btn" id="expandAllBtn">📂 Expand All</button>
            <button class="btn" id="collapseAllBtn">📁 Collapse All</button>
        </div>
        <div class="content">
            <div class="tree-panel">
                <div class="tree-header">Visual Tree</div>
                <div class="tree-view" id="treeView">
                    ${this._renderTree(treeStructure)}
                </div>
            </div>
            <div class="properties-panel">
                <div class="properties-header">Properties</div>
                <div class="properties-content" id="propertiesContent">
                    <div class="empty-state">Select an element to view properties</div>
                </div>
            </div>
        </div>
    </div>
    <script>
        const treeData = ${JSON.stringify(treeStructure)};
    </script>
    <script src="${jsPath}"></script>
</body>
</html>`;
    }

    private _renderTree(tree: TreeElement | null): string {
        if (!tree) {
            return '<div class="empty-state">No visual tree available. Open XAML preview to load tree.</div>';
        }

        return this._renderTreeNode(tree, 0);
    }

    private _renderTreeNode(node: TreeElement, depth: number): string {
        const indent = depth * 20;
        const hasChildren = node.children && node.children.length > 0;
        const displayName = node.name || node.type || 'Element';
        
        let html = `
            <div class="tree-node" style="padding-left: ${indent}px;" data-element-id="${node.id}">
                <span class="tree-toggle ${hasChildren ? '' : 'hidden'}" onclick="toggleNode(this)">▶</span>
                <span class="tree-icon">${this._getIconForType(node.type)}</span>
                <span class="tree-label" onclick="selectNode('${node.id}')">${displayName}</span>
                <span class="tree-type">${node.type}</span>
            </div>`;

        if (hasChildren) {
            html += `<div class="tree-children" style="display: none;">`;
            for (const child of node.children!) {
                html += this._renderTreeNode(child, depth + 1);
            }
            html += `</div>`;
        }

        return html;
    }

    private _getIconForType(type: string): string {
        const icons: { [key: string]: string } = {
            'Grid': '⊞',
            'StackPanel': '▦',
            'Button': '🔘',
            'TextBlock': '📝',
            'TextBox': '📄',
            'Border': '▦',
            'Canvas': '🖼️',
            'Image': '🖼️',
            'ListView': '📋',
            'ComboBox': '▼'
        };
        return icons[type] || '▢';
    }
}

