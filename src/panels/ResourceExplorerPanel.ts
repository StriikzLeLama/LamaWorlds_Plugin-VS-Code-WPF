import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface Resource {
    key: string;
    type: 'Color' | 'Brush' | 'Style' | 'Image' | 'Other';
    value: string;
    file: string;
}

export class ResourceExplorerPanel {
    public static currentPanel: ResourceExplorerPanel | undefined;
    private static readonly viewType = 'resourceExplorer';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _resources: Resource[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'openResource':
                        await this._openResource(message.resourceKey, message.file);
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

        if (ResourceExplorerPanel.currentPanel) {
            ResourceExplorerPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            ResourceExplorerPanel.viewType,
            'Resource Explorer',
            column,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri]
            }
        );

        ResourceExplorerPanel.currentPanel = new ResourceExplorerPanel(panel, extensionUri);
    }

    public static dispose() {
        if (ResourceExplorerPanel.currentPanel) {
            ResourceExplorerPanel.currentPanel.dispose();
        }
    }

    public dispose() {
        ResourceExplorerPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private async _update() {
        await this._scanResources();
        this._render();
    }

    private async _scanResources() {
        this._resources = [];
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return;
        }

        for (const folder of workspaceFolders) {
            await this._scanDirectory(folder.uri.fsPath);
        }
    }

    private async _scanDirectory(dir: string) {
        try {
            const files = fs.readdirSync(dir, { recursive: true });
            for (const file of files) {
                const fileName = typeof file === 'string' ? file : file.toString();
                const fullPath = path.join(dir, fileName);
                if (fileName.endsWith('.xaml') || fileName.endsWith('.resx')) {
                    await this._parseResourceFile(fullPath);
                }
            }
        } catch (error) {
            // Ignore errors
        }
    }

    private async _parseResourceFile(filePath: string) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            
            if (filePath.endsWith('.xaml')) {
                await this._parseXamlResources(filePath, content);
            }
        } catch (error) {
            // Ignore parse errors
        }
    }

    private async _parseXamlResources(filePath: string, content: string) {
        // Simple regex-based parsing (in production, use proper XML parser)
        const resourceDictRegex = /<ResourceDictionary[^>]*>([\s\S]*?)<\/ResourceDictionary>/gi;
        const matches = content.match(resourceDictRegex);
        
        if (!matches) {
            return;
        }

        for (const match of matches) {
            // Extract Color resources
            const colorRegex = /<Color\s+x:Key="([^"]+)"[^>]*>([^<]+)<\/Color>/gi;
            let colorMatch;
            while ((colorMatch = colorRegex.exec(match)) !== null) {
                this._resources.push({
                    key: colorMatch[1],
                    type: 'Color',
                    value: colorMatch[2].trim(),
                    file: path.basename(filePath)
                });
            }

            // Extract SolidColorBrush resources
            const brushRegex = /<SolidColorBrush\s+x:Key="([^"]+)"[^>]*Color="([^"]+)"[^>]*\/>/gi;
            let brushMatch;
            while ((brushMatch = brushRegex.exec(match)) !== null) {
                this._resources.push({
                    key: brushMatch[1],
                    type: 'Brush',
                    value: brushMatch[2],
                    file: path.basename(filePath)
                });
            }

            // Extract Style resources
            const styleRegex = /<Style\s+x:Key="([^"]+)"[^>]*TargetType="([^"]+)"[^>]*>/gi;
            let styleMatch;
            while ((styleMatch = styleRegex.exec(match)) !== null) {
                this._resources.push({
                    key: styleMatch[1],
                    type: 'Style',
                    value: styleMatch[2],
                    file: path.basename(filePath)
                });
            }
        }
    }

    private _render() {
        const resourcesByType = this._groupByType(this._resources);
        
        let html = '<h2>Resource Explorer</h2>';
        html += `<p style="font-size: 11px; color: var(--vscode-descriptionForeground);">
            Found ${this._resources.length} resources
        </p>`;

        for (const [type, resources] of Object.entries(resourcesByType)) {
            html += `<div class="resource-category">
                <h3>${type} (${resources.length})</h3>
                <div class="resource-list">`;
            
            for (const resource of resources) {
                const preview = this._getResourcePreview(resource);
                html += `
                    <div class="resource-item" data-key="${resource.key}" data-file="${resource.file}">
                        <div class="resource-preview">${preview}</div>
                        <div class="resource-info">
                            <div class="resource-key">${resource.key}</div>
                            <div class="resource-file">${resource.file}</div>
                        </div>
                    </div>
                `;
            }
            
            html += `</div></div>`;
        }

        this._panel.webview.html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resource Explorer</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 10px;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .resource-category {
            margin-bottom: 20px;
        }
        .resource-category h3 {
            font-size: 12px;
            text-transform: uppercase;
            color: var(--vscode-descriptionForeground);
            margin: 10px 0 5px 0;
            padding: 5px 0;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .resource-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 10px;
        }
        .resource-item {
            display: flex;
            flex-direction: column;
            padding: 10px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.2s;
        }
        .resource-item:hover {
            background: var(--vscode-list-hoverBackground);
        }
        .resource-preview {
            width: 100%;
            height: 40px;
            margin-bottom: 8px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .resource-info {
            font-size: 11px;
        }
        .resource-key {
            font-weight: bold;
            margin-bottom: 2px;
        }
        .resource-file {
            color: var(--vscode-descriptionForeground);
            font-size: 10px;
        }
    </style>
</head>
<body>
    ${html}
    <script>
        const vscode = acquireVsCodeApi();
        
        document.querySelectorAll('.resource-item').forEach(item => {
            item.addEventListener('click', () => {
                const key = item.getAttribute('data-key');
                const file = item.getAttribute('data-file');
                vscode.postMessage({
                    command: 'openResource',
                    resourceKey: key,
                    file: file
                });
            });
        });
    </script>
</body>
</html>`;
    }

    private _groupByType(resources: Resource[]): Record<string, Resource[]> {
        const grouped: Record<string, Resource[]> = {};
        for (const resource of resources) {
            if (!grouped[resource.type]) {
                grouped[resource.type] = [];
            }
            grouped[resource.type].push(resource);
        }
        return grouped;
    }

    private _getResourcePreview(resource: Resource): string {
        switch (resource.type) {
            case 'Color':
            case 'Brush':
                const color = this._parseColor(resource.value);
                return `<div style="background: ${color}; width: 100%; height: 100%; border-radius: 4px;"></div>`;
            case 'Style':
                return `<div style="background: var(--vscode-button-background); width: 100%; height: 100%; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: var(--vscode-button-foreground); font-size: 10px;">Style</div>`;
            default:
                return `<div style="background: var(--vscode-panel-border); width: 100%; height: 100%; border-radius: 4px;"></div>`;
        }
    }

    private _parseColor(colorValue: string): string {
        // Try to parse color value (could be hex, named color, etc.)
        if (colorValue.startsWith('#')) {
            return colorValue;
        }
        // Map common color names
        const colorMap: Record<string, string> = {
            'Red': '#FF0000',
            'Blue': '#0000FF',
            'Green': '#00FF00',
            'White': '#FFFFFF',
            'Black': '#000000'
        };
        return colorMap[colorValue] || '#CCCCCC';
    }

    private async _openResource(resourceKey: string, fileName: string) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return;
        }

        for (const folder of workspaceFolders) {
            const filePath = await this._findResourceFile(folder.uri.fsPath, fileName);
            if (filePath) {
                const document = await vscode.workspace.openTextDocument(filePath);
                const editor = await vscode.window.showTextDocument(document);
                
                // Try to find and highlight the resource
                const text = document.getText();
                const regex = new RegExp(`x:Key="${resourceKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`);
                const match = text.match(regex);
                if (match && match.index !== undefined) {
                    const position = document.positionAt(match.index);
                    editor.selection = new vscode.Selection(position, position);
                    editor.revealRange(new vscode.Range(position, position));
                }
                break;
            }
        }
    }

    private async _findResourceFile(root: string, fileName: string): Promise<string | null> {
        try {
            const files = fs.readdirSync(root, { recursive: true });
            for (const file of files) {
                const fileStr = typeof file === 'string' ? file : file.toString();
                if (fileStr === fileName || fileStr.endsWith(fileName)) {
                    return path.join(root, fileStr);
                }
            }
        } catch (error) {
            // Ignore
        }
        return null;
    }
}
