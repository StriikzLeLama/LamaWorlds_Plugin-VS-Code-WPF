import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class MvvmTools {
    constructor(private context: vscode.ExtensionContext) {}

    async createNewWindow(uri?: vscode.Uri) {
        const targetPath = uri ? uri.fsPath : this._getRootPath();
        if (!targetPath) {
            vscode.window.showErrorMessage('No workspace folder found.');
            return;
        }

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

        if (!name) {
            return;
        }

        const namespace = this._getNamespace(targetPath);
        const viewsPath = path.join(this._getProjectRoot(targetPath) || targetPath, 'Views');
        
        if (!fs.existsSync(viewsPath)) {
            fs.mkdirSync(viewsPath, { recursive: true });
        }

        // Create Window XAML
        const windowXaml = `<?xml version="1.0" encoding="utf-8"?>
<Window x:Class="${namespace}.Views.${name}"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:d="http://schemas.microsoft.com/expression/blend/2008"
        xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
        xmlns:local="clr-namespace:${namespace}.Views"
        mc:Ignorable="d"
        Title="${name}" Height="450" Width="800">
    <Grid>
        $0
    </Grid>
</Window>`;

        // Create code-behind
        const windowCs = `using System.Windows;

namespace ${namespace}.Views;

public partial class ${name} : Window
{
    public ${name}()
    {
        InitializeComponent();
    }
}`;

        // Create ViewModel
        const viewModelName = `${name}ViewModel`;
        const viewModelCs = `using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace ${namespace}.ViewModels;

public class ${viewModelName} : INotifyPropertyChanged
{
    public event PropertyChangedEventHandler? PropertyChanged;

    protected virtual void OnPropertyChanged([CallerMemberName] string? propertyName = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }
}`;

        fs.writeFileSync(path.join(viewsPath, `${name}.xaml`), windowXaml);
        fs.writeFileSync(path.join(viewsPath, `${name}.xaml.cs`), windowCs);

        const viewModelsPath = path.join(this._getProjectRoot(targetPath) || targetPath, 'ViewModels');
        if (!fs.existsSync(viewModelsPath)) {
            fs.mkdirSync(viewModelsPath, { recursive: true });
        }
        fs.writeFileSync(path.join(viewModelsPath, `${viewModelName}.cs`), viewModelCs);

        // Open the XAML file
        const xamlUri = vscode.Uri.file(path.join(viewsPath, `${name}.xaml`));
        await vscode.window.showTextDocument(xamlUri);

        vscode.window.showInformationMessage(`Window '${name}' with ViewModel created!`);
    }

    async createNewUserControl(uri?: vscode.Uri) {
        const targetPath = uri ? uri.fsPath : this._getRootPath();
        if (!targetPath) {
            vscode.window.showErrorMessage('No workspace folder found.');
            return;
        }

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

        if (!name) {
            return;
        }

        const namespace = this._getNamespace(targetPath);
        const viewsPath = path.join(this._getProjectRoot(targetPath) || targetPath, 'Views');
        
        if (!fs.existsSync(viewsPath)) {
            fs.mkdirSync(viewsPath, { recursive: true });
        }

        const xaml = `<?xml version="1.0" encoding="utf-8"?>
<UserControl x:Class="${namespace}.Views.${name}"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:d="http://schemas.microsoft.com/expression/blend/2008"
             xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
             xmlns:local="clr-namespace:${namespace}.Views"
             mc:Ignorable="d">
    <Grid>
        $0
    </Grid>
</UserControl>`;

        const cs = `using System.Windows.Controls;

namespace ${namespace}.Views;

public partial class ${name} : UserControl
{
    public ${name}()
    {
        InitializeComponent();
    }
}`;

        fs.writeFileSync(path.join(viewsPath, `${name}.xaml`), xaml);
        fs.writeFileSync(path.join(viewsPath, `${name}.xaml.cs`), cs);

        const xamlUri = vscode.Uri.file(path.join(viewsPath, `${name}.xaml`));
        await vscode.window.showTextDocument(xamlUri);

        vscode.window.showInformationMessage(`UserControl '${name}' created!`);
    }

    async createNewViewModel(uri?: vscode.Uri) {
        const targetPath = uri ? uri.fsPath : this._getRootPath();
        if (!targetPath) {
            vscode.window.showErrorMessage('No workspace folder found.');
            return;
        }

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

        if (!name) {
            return;
        }

        const namespace = this._getNamespace(targetPath);
        const viewModelsPath = path.join(this._getProjectRoot(targetPath) || targetPath, 'ViewModels');
        
        if (!fs.existsSync(viewModelsPath)) {
            fs.mkdirSync(viewModelsPath, { recursive: true });
        }

        const cs = `using System.ComponentModel;
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

        fs.writeFileSync(path.join(viewModelsPath, `${name}.cs`), cs);

        const csUri = vscode.Uri.file(path.join(viewModelsPath, `${name}.cs`));
        await vscode.window.showTextDocument(csUri);

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

        if (!commandName) {
            return;
        }

        const position = editor.selection.active;
        const document = editor.document;
        const line = document.lineAt(position.line);

        // Insert command property and method
        const commandCode = `
    public ICommand ${commandName} { get; }

    private void Execute${commandName}(object? parameter)
    {
        $0
    }`;

        // Find constructor or end of class
        let insertLine = position.line;
        const content = document.getText();
        const constructorMatch = content.match(/public\s+\w+\s*\([^)]*\)\s*\{/);
        
        if (constructorMatch) {
            // Find constructor end
            const constructorStart = content.indexOf(constructorMatch[0]);
            const constructorEnd = content.indexOf('}', constructorStart);
            const constructorText = content.substring(constructorStart, constructorEnd);
            const lastBrace = constructorText.lastIndexOf('}');
            if (lastBrace !== -1) {
                const absolutePos = constructorStart + lastBrace;
                insertLine = document.positionAt(absolutePos).line;
            }
        }

        const insertPosition = new vscode.Position(insertLine, 0);
        
        await editor.edit(editBuilder => {
            editBuilder.insert(insertPosition, commandCode);
        });

        // Add to constructor
        const constructorInit = `        ${commandName} = new RelayCommand(Execute${commandName});\n`;
        if (constructorMatch) {
            const constructorStart = content.indexOf(constructorMatch[0]);
            const constructorBodyStart = content.indexOf('{', constructorStart) + 1;
            const constructorInitPos = document.positionAt(constructorBodyStart);
            await editor.edit(editBuilder => {
                editBuilder.insert(constructorInitPos, constructorInit);
            });
        }

        vscode.window.showInformationMessage(`RelayCommand '${commandName}' added!`);
    }

    async generateDataTemplate() {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document.fileName.endsWith('.cs')) {
            vscode.window.showWarningMessage('Please open a ViewModel file.');
            return;
        }

        // Extract ViewModel name
        const content = editor.document.getText();
        const classMatch = content.match(/public\s+class\s+(\w+)/);
        if (!classMatch) {
            vscode.window.showWarningMessage('Could not find ViewModel class.');
            return;
        }

        const viewModelName = classMatch[1];
        const dataTemplateName = `${viewModelName}Template`;

        // Find ResourceDictionary or create new one
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
        if (!workspaceFolder) {
            return;
        }

        const resourcesPath = path.join(workspaceFolder.uri.fsPath, 'Resources', 'DataTemplates.xaml');
        
        let dataTemplateXaml = `    <DataTemplate DataType="{x:Type local:${viewModelName}}">
        <Grid>
            <!-- Add your template content here -->
            <TextBlock Text="{Binding DisplayName}" />
        </Grid>
    </DataTemplate>`;

        if (fs.existsSync(resourcesPath)) {
            // Add to existing file
            const existingContent = fs.readFileSync(resourcesPath, 'utf8');
            if (existingContent.includes('<ResourceDictionary')) {
                const insertPos = existingContent.indexOf('</ResourceDictionary>');
                if (insertPos !== -1) {
                    const newContent = existingContent.substring(0, insertPos) + 
                                     '\n' + dataTemplateXaml + '\n    ' + 
                                     existingContent.substring(insertPos);
                    fs.writeFileSync(resourcesPath, newContent);
                }
            }
        } else {
            // Create new file
            const namespace = this._getNamespace(workspaceFolder.uri.fsPath);
            const fullXaml = `<?xml version="1.0" encoding="utf-8"?>
<ResourceDictionary xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
                    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
                    xmlns:local="clr-namespace:${namespace}.ViewModels">
${dataTemplateXaml}
</ResourceDictionary>`;
            
            const resourcesDir = path.dirname(resourcesPath);
            if (!fs.existsSync(resourcesDir)) {
                fs.mkdirSync(resourcesDir, { recursive: true });
            }
            fs.writeFileSync(resourcesPath, fullXaml);
        }

        const uri = vscode.Uri.file(resourcesPath);
        await vscode.window.showTextDocument(uri);

        vscode.window.showInformationMessage(`DataTemplate for '${viewModelName}' generated!`);
    }

    private _getRootPath(): string | undefined {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        return workspaceFolders && workspaceFolders.length > 0 ? workspaceFolders[0].uri.fsPath : undefined;
    }

    private _getProjectRoot(filePath: string): string | null {
        let currentDir = fs.statSync(filePath).isDirectory() ? filePath : path.dirname(filePath);
        
        while (currentDir !== path.dirname(currentDir)) {
            const files = fs.readdirSync(currentDir);
            const csproj = files.find(f => f.endsWith('.csproj'));
            if (csproj) {
                return currentDir;
            }
            currentDir = path.dirname(currentDir);
        }
        
        return null;
    }

    private _getNamespace(filePath: string): string {
        const projectRoot = this._getProjectRoot(filePath);
        if (projectRoot) {
            const csprojFiles = fs.readdirSync(projectRoot).filter(f => f.endsWith('.csproj'));
            if (csprojFiles.length > 0) {
                return path.basename(csprojFiles[0], '.csproj');
            }
        }
        return 'LamaWorldsApp';
    }
}
