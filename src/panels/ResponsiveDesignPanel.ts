import * as vscode from 'vscode';
import * as path from 'path';

export class ResponsiveDesignPanel {
    public static currentPanel: ResponsiveDesignPanel | undefined;
    private static readonly viewType = 'responsiveDesign';
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
                switch (message.command) {
                    case 'generateResponsiveGrid':
                        await this._generateResponsiveGrid(message.data);
                        return;
                    case 'generateConverter':
                        await this._generateConverter(message.data);
                        return;
                    case 'previewSize':
                        this._previewSize(message.data);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.ViewColumn.Two;

        if (ResponsiveDesignPanel.currentPanel) {
            ResponsiveDesignPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            ResponsiveDesignPanel.viewType,
            'Responsive Design',
            column,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri],
                retainContextWhenHidden: true
            }
        );

        ResponsiveDesignPanel.currentPanel = new ResponsiveDesignPanel(panel, extensionUri);
    }

    public static dispose() {
        if (ResponsiveDesignPanel.currentPanel) {
            ResponsiveDesignPanel.currentPanel.dispose();
        }
    }

    public dispose() {
        ResponsiveDesignPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update() {
        this._panel.webview.html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Responsive Design Engine</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #0b1d2a;
            color: #ffffff;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .header {
            background: #0e2435;
            padding: 15px;
            border-bottom: 1px solid #56b0ff;
        }
        .header h2 {
            color: #56b0ff;
            font-size: 18px;
            margin-bottom: 10px;
        }
        .content {
            flex: 1;
            display: flex;
            overflow: hidden;
        }
        .left-panel {
            width: 300px;
            background: #0e2435;
            border-right: 1px solid #56b0ff;
            padding: 15px;
            overflow-y: auto;
        }
        .right-panel {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: #0b1d2a;
        }
        .preview-container {
            flex: 1;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        .size-selector {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            padding: 15px;
            background: #0e2435;
            border-bottom: 1px solid #56b0ff;
        }
        .size-btn {
            padding: 8px 16px;
            background: rgba(86, 176, 255, 0.2);
            border: 1px solid #56b0ff;
            border-radius: 5px;
            color: #56b0ff;
            cursor: pointer;
            transition: all 0.3s;
        }
        .size-btn:hover, .size-btn.active {
            background: linear-gradient(135deg, #56b0ff 0%, #00ffff 100%);
            color: #0b1d2a;
        }
        .preview-frame {
            border: 2px solid #56b0ff;
            border-radius: 10px;
            background: #ffffff;
            box-shadow: 0 10px 40px rgba(86, 176, 255, 0.3);
            transition: all 0.3s;
        }
        .property-group {
            margin-bottom: 20px;
            padding: 15px;
            background: rgba(86, 176, 255, 0.05);
            border-radius: 5px;
            border: 1px solid rgba(86, 176, 255, 0.2);
        }
        .property-group h3 {
            color: #56b0ff;
            margin-bottom: 10px;
            font-size: 14px;
        }
        .property-item {
            margin-bottom: 10px;
        }
        .property-item label {
            display: block;
            color: #ffffff;
            margin-bottom: 5px;
            font-size: 12px;
        }
        .property-item input,
        .property-item select {
            width: 100%;
            padding: 8px;
            background: #0b1d2a;
            border: 1px solid #56b0ff;
            border-radius: 3px;
            color: #ffffff;
            font-size: 12px;
        }
        .btn {
            padding: 10px 20px;
            background: linear-gradient(135deg, #56b0ff 0%, #00ffff 100%);
            border: none;
            border-radius: 5px;
            color: #0b1d2a;
            cursor: pointer;
            font-weight: bold;
            width: 100%;
            margin-top: 10px;
            transition: all 0.3s;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(86, 176, 255, 0.4);
        }
        .breakpoint-list {
            margin-top: 15px;
        }
        .breakpoint-item {
            padding: 10px;
            background: rgba(86, 176, 255, 0.1);
            border: 1px solid #56b0ff;
            border-radius: 5px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .breakpoint-name {
            color: #56b0ff;
            font-weight: bold;
        }
        .breakpoint-size {
            color: #ffffff;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>📱 Responsive Design Engine</h2>
    </div>
    <div class="content">
        <div class="left-panel">
            <div class="property-group">
                <h3>Breakpoints</h3>
                <div class="breakpoint-list">
                    <div class="breakpoint-item">
                        <div>
                            <div class="breakpoint-name">Mobile</div>
                            <div class="breakpoint-size">0 - 600px</div>
                        </div>
                    </div>
                    <div class="breakpoint-item">
                        <div>
                            <div class="breakpoint-name">Tablet</div>
                            <div class="breakpoint-size">601 - 1024px</div>
                        </div>
                    </div>
                    <div class="breakpoint-item">
                        <div>
                            <div class="breakpoint-name">Desktop</div>
                            <div class="breakpoint-size">1025px+</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="property-group">
                <h3>Generate Responsive Grid</h3>
                <div class="property-item">
                    <label>Columns (Mobile)</label>
                    <input type="number" id="cols-mobile" value="1" min="1" max="12">
                </div>
                <div class="property-item">
                    <label>Columns (Tablet)</label>
                    <input type="number" id="cols-tablet" value="2" min="1" max="12">
                </div>
                <div class="property-item">
                    <label>Columns (Desktop)</label>
                    <input type="number" id="cols-desktop" value="3" min="1" max="12">
                </div>
                <button class="btn" onclick="generateGrid()">Generate Grid</button>
            </div>
            <div class="property-group">
                <h3>Value Converter</h3>
                <div class="property-item">
                    <label>Converter Name</label>
                    <input type="text" id="converter-name" placeholder="ResponsiveConverter">
                </div>
                <button class="btn" onclick="generateConverter()">Generate Converter</button>
            </div>
        </div>
        <div class="right-panel">
            <div class="size-selector">
                <button class="size-btn active" data-size="mobile" onclick="selectSize('mobile')">📱 Mobile (375x667)</button>
                <button class="size-btn" data-size="tablet" onclick="selectSize('tablet')">📱 Tablet (768x1024)</button>
                <button class="size-btn" data-size="desktop" onclick="selectSize('desktop')">🖥️ Desktop (1920x1080)</button>
            </div>
            <div class="preview-container">
                <div class="preview-frame" id="preview-frame" style="width: 375px; height: 667px;">
                    <div style="padding: 20px; color: #000;">
                        <h3>Preview</h3>
                        <p>Select a size to preview</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        let currentSize = 'mobile';

        const sizes = {
            mobile: { width: 375, height: 667 },
            tablet: { width: 768, height: 1024 },
            desktop: { width: 1920, height: 1080 }
        };

        function selectSize(size) {
            currentSize = size;
            document.querySelectorAll('.size-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(\`[data-size="\${size}"]\`).classList.add('active');
            
            const frame = document.getElementById('preview-frame');
            const sizeData = sizes[size];
            frame.style.width = sizeData.width + 'px';
            frame.style.height = sizeData.height + 'px';
            
            vscode.postMessage({
                command: 'previewSize',
                data: { size, ...sizeData }
            });
        }

        function generateGrid() {
            const colsMobile = parseInt(document.getElementById('cols-mobile').value);
            const colsTablet = parseInt(document.getElementById('cols-tablet').value);
            const colsDesktop = parseInt(document.getElementById('cols-desktop').value);
            
            vscode.postMessage({
                command: 'generateResponsiveGrid',
                data: { colsMobile, colsTablet, colsDesktop }
            });
        }

        function generateConverter() {
            const name = document.getElementById('converter-name').value || 'ResponsiveConverter';
            vscode.postMessage({
                command: 'generateConverter',
                data: { name }
            });
        }
    </script>
</body>
</html>`;
    }

    private async _generateResponsiveGrid(data: any) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('Please open a XAML file first.');
            return;
        }

        const xaml = `<Grid>
    <Grid.ColumnDefinitions>
        <ColumnDefinition Width="*"/>
        <ColumnDefinition Width="*"/>
        <ColumnDefinition Width="*"/>
    </Grid.ColumnDefinitions>
    <!-- Responsive columns: Mobile=${data.colsMobile}, Tablet=${data.colsTablet}, Desktop=${data.colsDesktop} -->
    $0
</Grid>`;

        const position = editor.selection.active;
        await editor.edit(editBuilder => {
            editBuilder.insert(position, xaml);
        });

        vscode.window.showInformationMessage('Responsive Grid generated!');
    }

    private async _generateConverter(data: any) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return;
        }

        const convertersPath = path.join(workspaceFolders[0].uri.fsPath, 'Converters');
        if (!require('fs').existsSync(convertersPath)) {
            require('fs').mkdirSync(convertersPath, { recursive: true });
        }

        const converterCode = `using System.Globalization;
using System.Windows.Data;

namespace ${this._getNamespace(workspaceFolders[0].uri.fsPath)}.Converters;

public class ${data.name} : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        // TODO: Implement responsive conversion logic
        return value;
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}`;

        const filePath = path.join(convertersPath, `${data.name}.cs`);
        require('fs').writeFileSync(filePath, converterCode);

        const uri = vscode.Uri.file(filePath);
        await vscode.window.showTextDocument(uri);

        vscode.window.showInformationMessage(`Converter '${data.name}' created!`);
    }

    private _previewSize(data: any) {
        // Update preview
        this._panel.webview.postMessage({
            command: 'sizeChanged',
            data: data
        });
    }

    private _getNamespace(workspacePath: string): string {
        const fs = require('fs');
        const files = fs.readdirSync(workspacePath);
        const csproj = files.find((f: string) => f.endsWith('.csproj'));
        if (csproj) {
            return path.basename(csproj, '.csproj');
        }
        return 'LamaWorldsApp';
    }
}
