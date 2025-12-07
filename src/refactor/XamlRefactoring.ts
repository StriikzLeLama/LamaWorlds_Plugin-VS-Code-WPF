import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { PathHelper } from '../utils/PathHelper';

/**
 * XAML refactoring engine
 */
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

        if (!controlName) return;

        const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
        if (!workspaceFolder) return;

        const viewsPath = path.join(workspaceFolder.uri.fsPath, 'Views');
        PathHelper.ensureDirectory(viewsPath);

        const namespace = PathHelper.getNamespace(
            PathHelper.findCsproj() || path.join(workspaceFolder.uri.fsPath, 'App.csproj'),
            viewsPath
        );

        const xamlContent = `<?xml version="1.0" encoding="utf-8"?>
<UserControl x:Class="${namespace}.Views.${controlName}"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">
    ${selectedText}
</UserControl>`;

        const csContent = `using System.Windows.Controls;

namespace ${namespace}.Views
{
    public partial class ${controlName} : UserControl
    {
        public ${controlName}()
        {
            InitializeComponent();
        }
    }
}`;

        fs.writeFileSync(path.join(viewsPath, `${controlName}.xaml`), xamlContent);
        fs.writeFileSync(path.join(viewsPath, `${controlName}.xaml.cs`), csContent);

        await editor.edit(editBuilder => {
            editBuilder.replace(selection, `<${controlName} />`);
        });

        vscode.window.showInformationMessage(`UserControl '${controlName}' created!`);
    }

    async wrapWith(elementType: string) {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document.fileName.endsWith('.xaml')) return;

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
        if (!editor || !editor.document.fileName.endsWith('.xaml')) return;

        let text = editor.document.getText();
        text = text.replace(/<Grid([^>]*)>/gi, '<StackPanel$1>');
        text = text.replace(/<\/Grid>/gi, '</StackPanel>');
        text = text.replace(/\s+Grid\.Row="[^"]*"/gi, '');
        text = text.replace(/\s+Grid\.Column="[^"]*"/gi, '');

        const edit = new vscode.WorkspaceEdit();
        edit.replace(editor.document.uri, new vscode.Range(0, 0, editor.document.lineCount, 0), text);
        await vscode.workspace.applyEdit(edit);

        vscode.window.showInformationMessage('Converted Grid to StackPanel');
    }

    async renameBinding() {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document.fileName.endsWith('.xaml')) return;

        const position = editor.selection.active;
        const line = editor.document.lineAt(position.line);
        const bindingMatch = line.text.match(/\{Binding\s+(\w+)\}/);
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

        if (!newName || newName === oldName) return;

        let content = editor.document.getText();
        content = content.replace(new RegExp(`\\{Binding\\s+${oldName}\\}`, 'g'), `{Binding ${newName}}`);

        const edit = new vscode.WorkspaceEdit();
        edit.replace(editor.document.uri, new vscode.Range(0, 0, editor.document.lineCount, 0), content);
        await vscode.workspace.applyEdit(edit);

        vscode.window.showInformationMessage(`Renamed binding '${oldName}' to '${newName}'`);
    }

    async generateStyle() {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document.fileName.endsWith('.xaml')) return;

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

        if (!styleName) return;

        const elementMatch = selectedText.match(/<(\w+)([^>]*)>/);
        if (!elementMatch) {
            vscode.window.showWarningMessage('Could not parse element.');
            return;
        }

        const elementType = elementMatch[1];
        const attributes = elementMatch[2];
        const styleXaml = `<Style x:Key="${styleName}" TargetType="${elementType}">
    ${attributes.trim()}
</Style>`;

        const content = editor.document.getText();
        if (content.includes('<ResourceDictionary')) {
            const resourceDictMatch = content.match(/(<ResourceDictionary[^>]*>)/);
            if (resourceDictMatch && resourceDictMatch.index !== undefined) {
                const insertPosition = resourceDictMatch.index + resourceDictMatch[0].length;
                const position = editor.document.positionAt(insertPosition);
                await editor.edit(editBuilder => {
                    editBuilder.insert(position, `\n    ${styleXaml.replace(/\n/g, '\n    ')}\n`);
                });
            }
        } else {
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

    private _getIndent(document: vscode.TextDocument, line: number): string {
        const lineText = document.lineAt(line).text;
        const match = lineText.match(/^(\s*)/);
        return match ? match[1] : '';
    }
}
