import * as vscode from 'vscode';
import * as path from 'path';

export class DebugInspectorPanel {
    public static currentPanel: DebugInspectorPanel | undefined;
    private static readonly viewType = 'debugInspector';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _visualTree: any = null;

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'selectElement':
                        await this._selectElement(message.elementId);
                        return;
                    case 'refresh':
                        await this._update();
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.ViewColumn.Two;

        if (DebugInspectorPanel.currentPanel) {
            DebugInspectorPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            DebugInspectorPanel.viewType,
            'Debug Inspector',
            column,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri]
            }
        );

        DebugInspectorPanel.currentPanel = new DebugInspectorPanel(panel, extensionUri);
    }

    public static dispose() {
        if (DebugInspectorPanel.currentPanel) {
            DebugInspectorPanel.currentPanel.dispose();
        }
    }

    public dispose() {
        DebugInspectorPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private async _update() {
        // Build visual tree from current XAML
        await this._buildVisualTree();
        this._render();
    }

    private async _buildVisualTree() {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document.fileName.endsWith('.xaml')) {
            this._visualTree = null;
            return;
        }

        const xaml = editor.document.getText();
        this._visualTree = this._parseXamlToTree(xaml);
    }

    private _parseXamlToTree(xaml: string): any {
        // Simplified XAML parser for visual tree
        const tree: any = { type: 'Root', children: [], id: 'root' };
        const stack: any[] = [tree];
        
        const elementRegex = /<(\w+)([^>]*?)(\/>|>)/g;
        let match;
        let elementId = 0;

        while ((match = elementRegex.exec(xaml)) !== null) {
            const tagName = match[1];
            const attributes = match[2];
            const isSelfClosing = match[3] === '/>';

            if (tagName.startsWith('xmlns') || tagName === 'ResourceDictionary') {
                continue;
            }

            const element: any = {
                type: tagName,
                id: `element-${elementId++}`,
                attributes: this._parseAttributes(attributes),
                children: []
            };

            const current = stack[stack.length - 1];
            current.children.push(element);

            if (!isSelfClosing && !tagName.includes('/')) {
                stack.push(element);
            }
        }

        // Close elements
        const closeTagRegex = /<\/(\w+)>/g;
        while ((match = closeTagRegex.exec(xaml)) !== null) {
            if (stack.length > 1) {
                stack.pop();
            }
        }

        return tree;
    }

    private _parseAttributes(attrString: string): Record<string, string> {
        const attrs: Record<string, string> = {};
        const attrRegex = /(\w+(?::\w+)?)="([^"]*)"/g;
        let match;
        while ((match = attrRegex.exec(attrString)) !== null) {
            attrs[match[1]] = match[2];
        }
        return attrs;
    }

    private _render() {
        if (!this._visualTree) {
            this._panel.webview.html = `<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 20px;
            color: var(--vscode-editor-foreground);
        }
    </style>
</head>
<body>
    <h3>No XAML file open</h3>
    <p>Open a XAML file to see the visual tree.</p>
</body>
</html>`;
            return;
        }

        const treeHtml = this._renderTree(this._visualTree);

        this._panel.webview.html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Debug Inspector</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 10px;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .tree-node {
            margin-left: 20px;
            padding: 5px 0;
        }
        .tree-node-header {
            display: flex;
            align-items: center;
            cursor: pointer;
            padding: 3px 5px;
            border-radius: 3px;
        }
        .tree-node-header:hover {
            background: var(--vscode-list-hoverBackground);
        }
        .tree-node-header.selected {
            background: var(--vscode-list-activeSelectionBackground);
            color: var(--vscode-list-activeSelectionForeground);
        }
        .tree-node-icon {
            margin-right: 5px;
            font-size: 12px;
        }
        .tree-node-type {
            font-weight: bold;
            color: var(--vscode-symbolIcon-classForeground);
        }
        .tree-node-children {
            display: none;
        }
        .tree-node-children.expanded {
            display: block;
        }
        .properties-panel {
            margin-top: 20px;
            padding: 10px;
            border-top: 1px solid var(--vscode-panel-border);
        }
        .property-item {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            font-size: 12px;
        }
        .property-name {
            font-weight: bold;
        }
        .property-value {
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <h2>Visual Tree Explorer</h2>
    <div id="tree-container">${treeHtml}</div>
    <div id="properties-panel" class="properties-panel" style="display: none;">
        <h3>Properties</h3>
        <div id="properties-content"></div>
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        
        document.querySelectorAll('.tree-node-header').forEach(header => {
            header.addEventListener('click', (e) => {
                e.stopPropagation();
                const node = header.closest('.tree-node');
                const children = node.querySelector('.tree-node-children');
                if (children) {
                    children.classList.toggle('expanded');
                }
                
                // Select element
                document.querySelectorAll('.tree-node-header').forEach(h => h.classList.remove('selected'));
                header.classList.add('selected');
                
                const elementId = header.getAttribute('data-id');
                const properties = JSON.parse(header.getAttribute('data-properties') || '{}');
                
                // Show properties
                const propsPanel = document.getElementById('properties-panel');
                const propsContent = document.getElementById('properties-content');
                propsPanel.style.display = 'block';
                
                let propsHtml = '';
                for (const [key, value] of Object.entries(properties)) {
                    propsHtml += \`
                        <div class="property-item">
                            <span class="property-name">\${key}:</span>
                            <span class="property-value">\${value}</span>
                        </div>
                    \`;
                }
                propsContent.innerHTML = propsHtml;
                
                vscode.postMessage({
                    command: 'selectElement',
                    elementId: elementId
                });
            });
        });
    </script>
</body>
</html>`;
    }

    private _renderTree(node: any, level: number = 0): string {
        const hasChildren = node.children && node.children.length > 0;
        const properties = {
            ...node.attributes,
            'ActualWidth': 'Auto',
            'ActualHeight': 'Auto',
            'Margin': node.attributes.Margin || '0',
            'Padding': node.attributes.Padding || '0',
            'DataContext': node.attributes['DataContext'] || 'None'
        };

        let html = `<div class="tree-node">
            <div class="tree-node-header" data-id="${node.id}" data-properties='${JSON.stringify(properties)}'>
                <span class="tree-node-icon">${hasChildren ? '▼' : '•'}</span>
                <span class="tree-node-type">${node.type}</span>
            </div>`;

        if (hasChildren) {
            html += `<div class="tree-node-children ${level < 2 ? 'expanded' : ''}">`;
            for (const child of node.children) {
                html += this._renderTree(child, level + 1);
            }
            html += `</div>`;
        }

        html += `</div>`;
        return html;
    }

    private async _selectElement(elementId: string) {
        // Highlight element in preview (if available)
        // This would communicate with the preview panel
        console.log('Selected element:', elementId);
    }
}
