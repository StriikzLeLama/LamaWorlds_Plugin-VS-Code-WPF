import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class XamlRefactoring {
    constructor(private context: vscode.ExtensionContext) {}

    async extractToUserControl() {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document.fileName.endsWith('.xaml')) {
            vscode.window.showWarningMessage('Please open a XAML file first.');
            return;
        }

        const selection = editor.selection;
        if (selection.isEmpty) {
            vscode.window.showWarningMessage('Please select XAML code to extract.');
            return;
        }

        const selectedText = editor.document.getText(selection);
        const controlName = await vscode.window.showInputBox({
            prompt: 'Enter UserControl name',
            placeHolder: 'MyUserControl',
            validateInput: (value) => {
                if (!value || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
                    return 'Invalid name';
                }
                return null;
            }
        });

        if (!controlName) {
            return;
        }

        // Create UserControl files
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
        if (!workspaceFolder) {
            return;
        }

        const viewsPath = path.join(workspaceFolder.uri.fsPath, 'Views');
        if (!fs.existsSync(viewsPath)) {
            fs.mkdirSync(viewsPath, { recursive: true });
        }

        const xamlPath = path.join(viewsPath, `${controlName}.xaml`);
        const csPath = path.join(viewsPath, `${controlName}.xaml.cs`);

        // Get namespace
        const namespace = this._getNamespace(workspaceFolder.uri.fsPath, viewsPath);

        // Create XAML file
        const xamlContent = `<?xml version="1.0" encoding="utf-8"?>
<UserControl x:Class="${namespace}.${controlName}"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">
    ${selectedText}
</UserControl>`;

        // Create code-behind
        const csContent = `using System.Windows.Controls;

namespace ${namespace}
{
    public partial class ${controlName} : UserControl
    {
        public ${controlName}()
        {
            InitializeComponent();
        }
    }
}`;

        fs.writeFileSync(xamlPath, xamlContent);
        fs.writeFileSync(csPath, csContent);

        // Replace selection with UserControl reference
        const userControlXaml = `<${controlName} />`;
        await editor.edit(editBuilder => {
            editBuilder.replace(selection, userControlXaml);
        });

        // Add namespace if needed
        await this._addNamespaceIfNeeded(editor.document, namespace);

        vscode.window.showInformationMessage(`UserControl '${controlName}' created!`);
    }

    async wrapWith(elementType: string) {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document.fileName.endsWith('.xaml')) {
            return;
        }

        const selection = editor.selection;
        if (selection.isEmpty) {
            vscode.window.showWarningMessage('Please select XAML code to wrap.');
            return;
        }

        const selectedText = editor.document.getText(selection);
        const indent = this._getIndent(editor.document, selection.start.line);

        let wrapperXaml = '';
        switch (elementType) {
            case 'Grid':
                wrapperXaml = `<Grid>\n${indent}    ${selectedText.replace(/\n/g, '\n' + indent + '    ')}\n${indent}</Grid>`;
                break;
            case 'Border':
                wrapperXaml = `<Border BorderBrush="#CCCCCC" BorderThickness="1" CornerRadius="5" Padding="10">\n${indent}    ${selectedText.replace(/\n/g, '\n' + indent + '    ')}\n${indent}</Border>`;
                break;
            case 'StackPanel':
                wrapperXaml = `<StackPanel>\n${indent}    ${selectedText.replace(/\n/g, '\n' + indent + '    ')}\n${indent}</StackPanel>`;
                break;
        }

        await editor.edit(editBuilder => {
            editBuilder.replace(selection, wrapperXaml);
        });

        vscode.window.showInformationMessage(`Wrapped with ${elementType}`);
    }

    async convertGridToStackPanel() {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document.fileName.endsWith('.xaml')) {
            return;
        }

        const document = editor.document;
        let text = document.getText();

        // Simple conversion: replace Grid with StackPanel
        text = text.replace(/<Grid([^>]*)>/gi, '<StackPanel$1>');
        text = text.replace(/<\/Grid>/gi, '</StackPanel>');

        // Remove Grid-specific attributes
        text = text.replace(/\s+Grid\.Row="[^"]*"/gi, '');
        text = text.replace(/\s+Grid\.Column="[^"]*"/gi, '');
        text = text.replace(/\s+Grid\.RowSpan="[^"]*"/gi, '');
        text = text.replace(/\s+Grid\.ColumnSpan="[^"]*"/gi, '');

        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), text);
        await vscode.workspace.applyEdit(edit);

        vscode.window.showInformationMessage('Converted Grid to StackPanel');
    }

    async renameBinding() {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document.fileName.endsWith('.xaml')) {
            return;
        }

        const position = editor.selection.active;
        const line = editor.document.lineAt(position.line);
        const text = line.text;

        // Find binding at cursor
        const bindingMatch = text.match(/\{Binding\s+(\w+)\}/);
        if (!bindingMatch) {
            vscode.window.showWarningMessage('No binding found at cursor position.');
            return;
        }

        const oldName = bindingMatch[1];
        const newName = await vscode.window.showInputBox({
            prompt: `Rename binding '${oldName}' to:`,
            value: oldName,
            validateInput: (value) => {
                if (!value || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
                    return 'Invalid property name';
                }
                return null;
            }
        });

        if (!newName || newName === oldName) {
            return;
        }

        // Replace in XAML
        const document = editor.document;
        let content = document.getText();
        const regex = new RegExp(`\\{Binding\\s+${oldName}\\}`, 'g');
        content = content.replace(regex, `{Binding ${newName}}`);

        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), content);
        await vscode.workspace.applyEdit(edit);

        // Try to update ViewModel
        await this._updateViewModelProperty(oldName, newName);

        vscode.window.showInformationMessage(`Renamed binding '${oldName}' to '${newName}'`);
    }

    async generateStyle() {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document.fileName.endsWith('.xaml')) {
            return;
        }

        const selection = editor.selection;
        if (selection.isEmpty) {
            vscode.window.showWarningMessage('Please select an element to generate style from.');
            return;
        }

        const selectedText = editor.document.getText(selection);
        const styleName = await vscode.window.showInputBox({
            prompt: 'Enter style name',
            placeHolder: 'MyStyle',
            validateInput: (value) => {
                if (!value || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
                    return 'Invalid style name';
                }
                return null;
            }
        });

        if (!styleName) {
            return;
        }

        // Extract element type and attributes
        const elementMatch = selectedText.match(/<(\w+)([^>]*)>/);
        if (!elementMatch) {
            vscode.window.showWarningMessage('Could not parse element.');
            return;
        }

        const elementType = elementMatch[1];
        const attributes = elementMatch[2];

        // Generate style
        const styleXaml = `<Style x:Key="${styleName}" TargetType="${elementType}">
    ${attributes.trim()}
</Style>`;

        // Find ResourceDictionary or create one
        const document = editor.document;
        const content = document.getText();
        
        if (content.includes('<ResourceDictionary')) {
            // Insert into existing ResourceDictionary
            const resourceDictMatch = content.match(/(<ResourceDictionary[^>]*>)/);
            if (resourceDictMatch && resourceDictMatch.index !== undefined) {
                const insertPosition = resourceDictMatch.index + resourceDictMatch[0].length;
                const position = document.positionAt(insertPosition);
                await editor.edit(editBuilder => {
                    editBuilder.insert(position, `\n    ${styleXaml.replace(/\n/g, '\n    ')}\n`);
                });
            }
        } else {
            // Show style in new document
            const doc = await vscode.workspace.openTextDocument({
                content: `<?xml version="1.0" encoding="utf-8"?>
<ResourceDictionary xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
                    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">
    ${styleXaml}
</ResourceDictionary>`,
                language: 'xml'
            });
            await vscode.window.showTextDocument(doc);
        }

        vscode.window.showInformationMessage(`Style '${styleName}' generated!`);
    }

    private _getNamespace(workspacePath: string, filePath: string): string {
        // Try to find .csproj to get namespace
        let currentDir = path.dirname(filePath);
        while (currentDir !== workspacePath && currentDir !== path.dirname(currentDir)) {
            const files = fs.readdirSync(currentDir);
            const csproj = files.find(f => f.endsWith('.csproj'));
            if (csproj) {
                const projectName = path.basename(csproj, '.csproj');
                const relPath = path.relative(path.dirname(csproj), filePath);
                if (relPath) {
                    const segments = relPath.split(path.sep).filter(s => s !== '.' && s !== '..');
                    return [projectName, ...segments].join('.');
                }
                return projectName;
            }
            currentDir = path.dirname(currentDir);
        }
        return 'LamaWorldsApp';
    }

    private _getIndent(document: vscode.TextDocument, line: number): string {
        const lineText = document.lineAt(line).text;
        const match = lineText.match(/^(\s*)/);
        return match ? match[1] : '';
    }

    private async _addNamespaceIfNeeded(document: vscode.TextDocument, namespace: string) {
        const content = document.getText();
        if (content.includes(`xmlns:local="clr-namespace:${namespace}"`)) {
            return;
        }

        // Add namespace
        const xmlnsMatch = content.match(/xmlns="[^"]*"/);
        if (xmlnsMatch && xmlnsMatch.index !== undefined) {
            const position = document.positionAt(xmlnsMatch.index + xmlnsMatch[0].length);
            await vscode.window.activeTextEditor?.edit(editBuilder => {
                editBuilder.insert(position, `\n             xmlns:local="clr-namespace:${namespace}"`);
            });
        }
    }

    private async _updateViewModelProperty(oldName: string, newName: string) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return;
        }

        // Find ViewModel files
        for (const folder of workspaceFolders) {
            const viewModelFiles = await vscode.workspace.findFiles(
                new vscode.RelativePattern(folder, '**/ViewModels/**/*.cs'),
                null,
                10
            );

            for (const file of viewModelFiles) {
                const document = await vscode.workspace.openTextDocument(file);
                let content = document.getText();

                // Replace property name
                const propertyRegex = new RegExp(`(private|public)\\s+\\w+\\s+_?${oldName}\\b`, 'g');
                if (propertyRegex.test(content)) {
                    content = content.replace(new RegExp(`\\b${oldName}\\b`, 'g'), newName);
                    const edit = new vscode.WorkspaceEdit();
                    edit.replace(file, new vscode.Range(0, 0, document.lineCount, 0), content);
                    await vscode.workspace.applyEdit(edit);
                }
            }
        }
    }
}
