import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { PathHelper } from '../utils/PathHelper';

/**
 * MVVM automation tools
 */
export class MvvmTools {
    constructor(private context: vscode.ExtensionContext) {}

    async createWindow() {
        const name = await vscode.window.showInputBox({
            prompt: 'Enter Window name',
            placeHolder: 'MyWindow',
            validateInput: (value) => {
                if (!value || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
                    return 'Invalid name';
                }
                return null;
            }
        });

        if (!name) return;

        const workspaceRoot = PathHelper.getWorkspaceRoot();
        if (!workspaceRoot) {
            vscode.window.showErrorMessage('No workspace folder found.');
            return;
        }

        const viewsPath = path.join(workspaceRoot, 'Views');
        PathHelper.ensureDirectory(viewsPath);

        const namespace = PathHelper.getNamespace(
            PathHelper.findCsproj() || path.join(workspaceRoot, 'App.csproj'),
            viewsPath
        );

        const windowXaml = this._readTemplate('templates/window/Window.xaml', namespace, name);
        const windowCs = this._readTemplate('templates/window/Window.xaml.cs', namespace, name);

        fs.writeFileSync(path.join(viewsPath, `${name}.xaml`), windowXaml);
        fs.writeFileSync(path.join(viewsPath, `${name}.xaml.cs`), windowCs);

        // Create ViewModel
        const viewModelName = `${name}ViewModel`;
        const viewModelPath = path.join(workspaceRoot, 'ViewModels');
        PathHelper.ensureDirectory(viewModelPath);
        const viewModel = this._readTemplate('templates/viewmodel/ViewModel.cs', namespace, viewModelName);
        fs.writeFileSync(path.join(viewModelPath, `${viewModelName}.cs`), viewModel);

        const uri = vscode.Uri.file(path.join(viewsPath, `${name}.xaml`));
        await vscode.window.showTextDocument(uri);
        vscode.window.showInformationMessage(`Window '${name}' with ViewModel created!`);
    }

    async createUserControl() {
        const name = await vscode.window.showInputBox({
            prompt: 'Enter UserControl name',
            placeHolder: 'MyUserControl',
            validateInput: (value) => {
                if (!value || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
                    return 'Invalid name';
                }
                return null;
            }
        });

        if (!name) return;

        const workspaceRoot = PathHelper.getWorkspaceRoot();
        if (!workspaceRoot) {
            vscode.window.showErrorMessage('No workspace folder found.');
            return;
        }

        const viewsPath = path.join(workspaceRoot, 'Views');
        PathHelper.ensureDirectory(viewsPath);

        const namespace = PathHelper.getNamespace(
            PathHelper.findCsproj() || path.join(workspaceRoot, 'App.csproj'),
            viewsPath
        );

        const xaml = this._readTemplate('templates/usercontrol/UserControl.xaml', namespace, name);
        const cs = this._readTemplate('templates/usercontrol/UserControl.xaml.cs', namespace, name);

        fs.writeFileSync(path.join(viewsPath, `${name}.xaml`), xaml);
        fs.writeFileSync(path.join(viewsPath, `${name}.xaml.cs`), cs);

        const uri = vscode.Uri.file(path.join(viewsPath, `${name}.xaml`));
        await vscode.window.showTextDocument(uri);
        vscode.window.showInformationMessage(`UserControl '${name}' created!`);
    }

    async createViewModel() {
        const name = await vscode.window.showInputBox({
            prompt: 'Enter ViewModel name',
            placeHolder: 'MyViewModel',
            validateInput: (value) => {
                if (!value || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
                    return 'Invalid name';
                }
                return null;
            }
        });

        if (!name) return;

        const workspaceRoot = PathHelper.getWorkspaceRoot();
        if (!workspaceRoot) {
            vscode.window.showErrorMessage('No workspace folder found.');
            return;
        }

        const viewModelsPath = path.join(workspaceRoot, 'ViewModels');
        PathHelper.ensureDirectory(viewModelsPath);

        const namespace = PathHelper.getNamespace(
            PathHelper.findCsproj() || path.join(workspaceRoot, 'App.csproj'),
            viewModelsPath
        );

        const viewModel = this._readTemplate('templates/viewmodel/ViewModel.cs', namespace, name);
        fs.writeFileSync(path.join(viewModelsPath, `${name}.cs`), viewModel);

        const uri = vscode.Uri.file(path.join(viewModelsPath, `${name}.cs`));
        await vscode.window.showTextDocument(uri);
        vscode.window.showInformationMessage(`ViewModel '${name}' created!`);
    }

    async addRelayCommand() {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document.fileName.endsWith('.cs')) {
            vscode.window.showWarningMessage('Please open a C# file (ViewModel).');
            return;
        }

        const commandName = await vscode.window.showInputBox({
            prompt: 'Enter command name',
            placeHolder: 'MyCommand',
            validateInput: (value) => {
                if (!value || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
                    return 'Invalid command name';
                }
                return null;
            }
        });

        if (!commandName) return;

        const position = editor.selection.active;
        const commandCode = `
    public ICommand ${commandName} { get; }

    private void Execute${commandName}(object? parameter)
    {
        $0
    }`;

        await editor.edit(editBuilder => {
            editBuilder.insert(position, commandCode);
        });

        vscode.window.showInformationMessage(`RelayCommand '${commandName}' added!`);
    }

    async generateDataTemplate() {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document.fileName.endsWith('.cs')) {
            vscode.window.showWarningMessage('Please open a ViewModel file.');
            return;
        }

        const content = editor.document.getText();
        const classMatch = content.match(/public\s+class\s+(\w+)/);
        if (!classMatch) {
            vscode.window.showWarningMessage('Could not find ViewModel class.');
            return;
        }

        const viewModelName = classMatch[1];
        const workspaceRoot = PathHelper.getWorkspaceRoot();
        if (!workspaceRoot) return;

        const resourcesPath = path.join(workspaceRoot, 'Resources');
        PathHelper.ensureDirectory(resourcesPath);

        const dataTemplateXaml = `    <DataTemplate DataType="{x:Type local:${viewModelName}}">
        <Grid>
            <!-- Add your template content here -->
            <TextBlock Text="{Binding DisplayName}" />
        </Grid>
    </DataTemplate>`;

        const filePath = path.join(resourcesPath, 'DataTemplates.xaml');
        let content = '';
        if (fs.existsSync(filePath)) {
            content = fs.readFileSync(filePath, 'utf8');
            content = content.replace('</ResourceDictionary>', `${dataTemplateXaml}\n</ResourceDictionary>`);
        } else {
            const namespace = PathHelper.getNamespace(
                PathHelper.findCsproj() || path.join(workspaceRoot, 'App.csproj'),
                resourcesPath
            );
            content = `<?xml version="1.0" encoding="utf-8"?>
<ResourceDictionary xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
                    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
                    xmlns:local="clr-namespace:${namespace}.ViewModels">
${dataTemplateXaml}
</ResourceDictionary>`;
        }

        fs.writeFileSync(filePath, content);
        const uri = vscode.Uri.file(filePath);
        await vscode.window.showTextDocument(uri);
        vscode.window.showInformationMessage(`DataTemplate for '${viewModelName}' generated!`);
    }

    private _readTemplate(relativePath: string, namespace: string, name: string): string {
        const templatePath = path.join(this.context.extensionPath, relativePath);
        if (fs.existsSync(templatePath)) {
            let content = fs.readFileSync(templatePath, 'utf8');
            content = content.replace(/LamaWorldsApp/g, namespace);
            content = content.replace(/classname/g, name);
            return content;
        }
        return this._getFallbackTemplate(relativePath, namespace, name);
    }

    private _getFallbackTemplate(relativePath: string, namespace: string, name: string): string {
        if (relativePath.includes('Window.xaml')) {
            return `<?xml version="1.0" encoding="utf-8"?>
<Window x:Class="${namespace}.Views.${name}"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="${name}" Height="450" Width="800">
    <Grid>
        $0
    </Grid>
</Window>`;
        }
        if (relativePath.includes('UserControl.xaml')) {
            return `<?xml version="1.0" encoding="utf-8"?>
<UserControl x:Class="${namespace}.Views.${name}"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">
    <Grid>
        $0
    </Grid>
</UserControl>`;
        }
        if (relativePath.includes('ViewModel.cs')) {
            return `using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace ${namespace}.ViewModels;

public class ${name} : INotifyPropertyChanged
{
    public event PropertyChangedEventHandler? PropertyChanged;

    protected virtual void OnPropertyChanged([CallerMemberName] string? propertyName = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }
}`;
        }
        return '';
    }
}
