import * as vscode from 'vscode';
import { XamlParser } from '../utils/XamlParser';
import * as autoLayout from './autoLayout';

/**
 * AI Auto-Layout Panel
 * Provides Figma Magic Layout style suggestions for XAML optimization
 */
export class AutoLayoutPanel {
    public static currentPanel: AutoLayoutPanel | undefined;
    private static readonly viewType = 'autoLayout';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _xamlContent: string = '';
    private _suggestions: any[] = [];

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

        if (AutoLayoutPanel.currentPanel) {
            AutoLayoutPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            AutoLayoutPanel.viewType,
            'AI Auto-Layout',
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

        AutoLayoutPanel.currentPanel = new AutoLayoutPanel(panel, extensionUri);
    }

    public static dispose() {
        if (AutoLayoutPanel.currentPanel) {
            AutoLayoutPanel.currentPanel.dispose();
        }
    }

    public dispose() {
        AutoLayoutPanel.currentPanel = undefined;
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
            case 'analyze':
                await this._analyzeXaml();
                break;
            case 'applySuggestion':
                await this._applySuggestion(message.suggestionId);
                break;
            case 'applyAll':
                await this._applyAllSuggestions();
                break;
            case 'previewDiff':
                await this._previewDiff(message.suggestionId);
                break;
        }
    }

    private async _analyzeXaml() {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document.fileName.endsWith('.xaml')) {
            vscode.window.showWarningMessage('Please open a XAML file first.');
            return;
        }

        this._xamlContent = editor.document.getText();
        
        // Analyze XAML structure
        const suggestions = await this._generateSuggestions(this._xamlContent);
        this._suggestions = suggestions;

        this._panel.webview.postMessage({
            command: 'suggestionsUpdated',
            suggestions: suggestions
        });
    }

    private async _generateSuggestions(xaml: string): Promise<any[]> {
        const suggestions: any[] = [];

        // 1. Check for excessive nesting
        const nestingLevel = XamlParser.getNestingLevel(xaml);
        if (nestingLevel > 5) {
            suggestions.push({
                id: 'reduce-nesting',
                type: 'reduceNesting',
                title: 'Reduce Nesting Levels',
                description: `Current nesting level is ${nestingLevel}. Consider flattening the structure.`,
                priority: 'high',
                impact: 'performance',
                before: this._extractNestedExample(xaml),
                after: this._suggestFlattenedStructure(xaml)
            });
        }

        // 2. Check for unnecessary panels
        const unnecessaryPanels = this._findUnnecessaryPanels(xaml);
        if (unnecessaryPanels.length > 0) {
            suggestions.push({
                id: 'remove-panels',
                type: 'removePanels',
                title: 'Remove Unnecessary Panels',
                description: `Found ${unnecessaryPanels.length} panels that can be removed.`,
                priority: 'medium',
                impact: 'simplicity',
                panels: unnecessaryPanels
            });
        }

        // 3. Check for inconsistent margins
        const marginIssues = this._analyzeMargins(xaml);
        if (marginIssues.length > 0) {
            suggestions.push({
                id: 'normalize-margins',
                type: 'normalizeMargins',
                title: 'Normalize Margins',
                description: `Found ${marginIssues.length} elements with inconsistent margins.`,
                priority: 'medium',
                impact: 'consistency',
                issues: marginIssues
            });
        }

        // 4. Check for Grid that could be StackPanel
        const gridToStackPanel = this._findGridToStackPanel(xaml);
        if (gridToStackPanel.length > 0) {
            suggestions.push({
                id: 'grid-to-stackpanel',
                type: 'gridToStackPanel',
                title: 'Convert Grid to StackPanel',
                description: `Found ${gridToStackPanel.length} Grid(s) that could be StackPanel.`,
                priority: 'low',
                impact: 'simplicity',
                grids: gridToStackPanel
            });
        }

        // 5. Check for alignment issues
        const alignmentIssues = this._findAlignmentIssues(xaml);
        if (alignmentIssues.length > 0) {
            suggestions.push({
                id: 'auto-align',
                type: 'autoAlign',
                title: 'Auto-Align Elements',
                description: `Found ${alignmentIssues.length} alignment opportunities.`,
                priority: 'low',
                impact: 'visual',
                issues: alignmentIssues
            });
        }

        return suggestions;
    }

    private _extractNestedExample(xaml: string): string {
        // Extract a nested example
        const lines = xaml.split('\n');
        let maxDepth = 0;
        let exampleStart = 0;
        let currentDepth = 0;

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].match(/<\w+[^>]*>/)) {
                currentDepth++;
                if (currentDepth > maxDepth) {
                    maxDepth = currentDepth;
                    exampleStart = i;
                }
            }
            if (lines[i].match(/<\/\w+>/)) {
                currentDepth--;
            }
        }

        return lines.slice(Math.max(0, exampleStart - 2), exampleStart + 10).join('\n');
    }

    private _suggestFlattenedStructure(xaml: string): string {
        // Simplified flattening suggestion
        return xaml.replace(/<Grid[^>]*>\s*<Grid[^>]*>/g, '<Grid>');
    }

    private _findUnnecessaryPanels(xaml: string): any[] {
        const panels: any[] = [];
        // Find panels with single child
        const singleChildRegex = /<(Grid|StackPanel|Border)[^>]*>\s*<(\w+)[^>]*>[\s\S]*?<\/\2>\s*<\/\1>/g;
        let match;
        while ((match = singleChildRegex.exec(xaml)) !== null) {
            panels.push({
                type: match[1],
                line: xaml.substring(0, match.index).split('\n').length
            });
        }
        return panels;
    }

    private _analyzeMargins(xaml: string): any[] {
        const issues: any[] = [];
        const marginRegex = /Margin="([^"]*)"/g;
        const margins = new Set<string>();
        let match;

        while ((match = marginRegex.exec(xaml)) !== null) {
            margins.add(match[1]);
        }

        if (margins.size > 5) {
            issues.push({
                description: `Found ${margins.size} different margin values. Consider standardizing.`,
                margins: Array.from(margins)
            });
        }

        return issues;
    }

    private _findGridToStackPanel(xaml: string): any[] {
        const grids: any[] = [];
        // Find Grids without row/column definitions
        const gridRegex = /<Grid[^>]*>(?![\s\S]*?<Grid\.(Row|Column)Definitions)/g;
        let match;
        while ((match = gridRegex.exec(xaml)) !== null) {
            grids.push({
                line: xaml.substring(0, match.index).split('\n').length
            });
        }
        return grids;
    }

    private _findAlignmentIssues(xaml: string): any[] {
        // Simplified alignment detection
        return [];
    }

    private async _applySuggestion(suggestionId: string) {
        const suggestion = this._suggestions.find(s => s.id === suggestionId);
        if (!suggestion) {
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        let updatedXaml = this._xamlContent;

        switch (suggestion.type) {
            case 'reduceNesting':
                updatedXaml = await autoLayout.suggestBetterLayout(updatedXaml);
                break;
            case 'normalizeMargins':
                updatedXaml = await this._normalizeMargins(updatedXaml);
                break;
            case 'removePanels':
                updatedXaml = await this._removeUnnecessaryPanels(updatedXaml);
                break;
            case 'gridToStackPanel':
                updatedXaml = await this._convertGridToStackPanel(updatedXaml);
                break;
        }

        // Apply changes
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(
            new vscode.Position(0, 0),
            editor.document.positionAt(editor.document.getText().length)
        );
        edit.replace(editor.document.uri, fullRange, updatedXaml);
        await vscode.workspace.applyEdit(edit);

        vscode.window.showInformationMessage('Suggestion applied!');
    }

    private async _applyAllSuggestions() {
        for (const suggestion of this._suggestions) {
            await this._applySuggestion(suggestion.id);
        }
    }

    private async _previewDiff(suggestionId: string) {
        const suggestion = this._suggestions.find(s => s.id === suggestionId);
        if (!suggestion) {
            return;
        }

        this._panel.webview.postMessage({
            command: 'diffPreview',
            before: suggestion.before || this._xamlContent,
            after: suggestion.after || ''
        });
    }

    private async _normalizeMargins(xaml: string): Promise<string> {
        // Normalize margins to a standard value
        return xaml.replace(/Margin="[^"]*"/g, 'Margin="10"');
    }

    private async _removeUnnecessaryPanels(xaml: string): Promise<string> {
        // Remove panels with single child
        return xaml.replace(/<(Grid|StackPanel|Border)[^>]*>\s*<(\w+)[^>]*>([\s\S]*?)<\/\2>\s*<\/\1>/g, '<$2>$3</$2>');
    }

    private async _convertGridToStackPanel(xaml: string): Promise<string> {
        // Convert simple Grids to StackPanel
        return xaml.replace(/<Grid([^>]*)>(?![\s\S]*?<Grid\.(Row|Column)Definitions)/g, '<StackPanel$1>')
                   .replace(/<\/Grid>/g, '</StackPanel>');
    }

    private _update() {
        this._panel.webview.html = this._getWebviewContent();
    }

    private _getWebviewContent(): string {
        const htmlUri = vscode.Uri.joinPath(this._extensionUri, 'webviews', 'aiLayout', 'aiLayout.html');
        const cssUri = vscode.Uri.joinPath(this._extensionUri, 'webviews', 'aiLayout', 'aiLayout.css');
        const jsUri = vscode.Uri.joinPath(this._extensionUri, 'webviews', 'aiLayout', 'aiLayout.js');

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
    <div class="autolayout-container">
        <div class="toolbar">
            <button class="btn btn-primary" id="analyzeBtn">🔍 Analyze XAML</button>
            <button class="btn" id="applyAllBtn" disabled>✅ Apply All</button>
        </div>
        <div class="content">
            <div class="suggestions-panel">
                <div class="panel-header">Suggestions</div>
                <div class="suggestions-list" id="suggestionsList">
                    <div class="empty-state">Click "Analyze XAML" to get suggestions</div>
                </div>
            </div>
            <div class="preview-panel">
                <div class="panel-header">Before / After</div>
                <div class="diff-view" id="diffView">
                    <div class="empty-state">Select a suggestion to preview changes</div>
                </div>
            </div>
        </div>
    </div>
    <script src="${jsPath}"></script>
</body>
</html>`;
    }
}

