import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class XamlNavigation {
    constructor(private context: vscode.ExtensionContext) {}

    async provideDefinition(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.Location[] | undefined> {
        const line = document.lineAt(position);
        const text = line.text;
        const offset = position.character;

        // Check for {Binding PropertyName}
        const bindingMatch = text.match(/\{Binding\s+(\w+)\}/);
        if (bindingMatch) {
            const bindingStart = text.indexOf('{Binding');
            const bindingEnd = text.indexOf('}', bindingStart);
            if (offset >= bindingStart && offset <= bindingEnd) {
                const propertyName = bindingMatch[1];
                return await this._findViewModelProperty(propertyName, document);
            }
        }

        // Check for StaticResource ResourceKey
        const staticResourceMatch = text.match(/\{StaticResource\s+(\w+)\}/);
        if (staticResourceMatch) {
            const resourceStart = text.indexOf('{StaticResource');
            const resourceEnd = text.indexOf('}', resourceStart);
            if (offset >= resourceStart && offset <= resourceEnd) {
                const resourceKey = staticResourceMatch[1];
                return await this._findResource(resourceKey, document);
            }
        }

        // Check for event handlers (Click="MethodName")
        const eventMatch = text.match(/(\w+)="(\w+)"/);
        if (eventMatch && this._isEventAttribute(eventMatch[1])) {
            const eventStart = text.indexOf(eventMatch[1]);
            const eventEnd = text.indexOf('"', eventStart + eventMatch[1].length + 2);
            if (offset >= eventStart && offset <= eventEnd) {
                const methodName = eventMatch[2];
                return await this._findCodeBehindMethod(methodName, document);
            }
        }

        return undefined;
    }

    private async _findViewModelProperty(propertyName: string, xamlDocument: vscode.TextDocument): Promise<vscode.Location[] | undefined> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return undefined;
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
                const content = document.getText();

                // Look for property
                const propertyRegex = new RegExp(`(public|private)\\s+\\w+\\s+${propertyName}\\s*\\{`, 'g');
                let match;
                while ((match = propertyRegex.exec(content)) !== null) {
                    const position = document.positionAt(match.index);
                    return [new vscode.Location(file, position)];
                }

                // Look for field
                const fieldRegex = new RegExp(`(private|public)\\s+\\w+\\s+_?${propertyName}\\s*;`, 'g');
                while ((match = fieldRegex.exec(content)) !== null) {
                    const position = document.positionAt(match.index);
                    return [new vscode.Location(file, position)];
                }
            }
        }

        return undefined;
    }

    private async _findResource(resourceKey: string, xamlDocument: vscode.TextDocument): Promise<vscode.Location[] | undefined> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return undefined;
        }

        // Search in ResourceDictionary files
        for (const folder of workspaceFolders) {
            const resourceFiles = await vscode.workspace.findFiles(
                new vscode.RelativePattern(folder, '**/*.xaml'),
                null,
                50
            );

            for (const file of resourceFiles) {
                const document = await vscode.workspace.openTextDocument(file);
                const content = document.getText();

                // Look for x:Key="ResourceKey"
                const keyRegex = new RegExp(`x:Key="${resourceKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g');
                let match;
                while ((match = keyRegex.exec(content)) !== null) {
                    const position = document.positionAt(match.index);
                    return [new vscode.Location(file, position)];
                }
            }
        }

        return undefined;
    }

    private async _findCodeBehindMethod(methodName: string, xamlDocument: vscode.TextDocument): Promise<vscode.Location[] | undefined> {
        // Find code-behind file
        const xamlPath = xamlDocument.uri.fsPath;
        const codeBehindPath = xamlPath + '.cs';

        if (!fs.existsSync(codeBehindPath)) {
            return undefined;
        }

        const document = await vscode.workspace.openTextDocument(codeBehindPath);
        const content = document.getText();

        // Look for method
        const methodRegex = new RegExp(`(private|public|protected|internal)\\s+\\w+\\s+${methodName}\\s*\\(`, 'g');
        let match;
        while ((match = methodRegex.exec(content)) !== null) {
            const position = document.positionAt(match.index);
            return [new vscode.Location(vscode.Uri.file(codeBehindPath), position)];
        }

        return undefined;
    }

    private _isEventAttribute(attributeName: string): boolean {
        const commonEvents = [
            'Click', 'Loaded', 'Unloaded', 'MouseEnter', 'MouseLeave',
            'MouseDown', 'MouseUp', 'KeyDown', 'KeyUp', 'TextChanged',
            'SelectionChanged', 'Checked', 'Unchecked'
        ];
        return commonEvents.includes(attributeName);
    }
}
