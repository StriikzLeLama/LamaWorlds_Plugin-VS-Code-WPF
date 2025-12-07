import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PathHelper } from '../utils/PathHelper';

const execAsync = promisify(exec);

/**
 * Creates WPF projects with MVVM structure
 */
export class ProjectCreator {
    constructor(private context: vscode.ExtensionContext) {}

    async createProject() {
        const folderUri = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select Project Location'
        });

        if (!folderUri || !folderUri[0]) {
            return;
        }

        const projectName = await vscode.window.showInputBox({
            prompt: 'Enter Project Name',
            placeHolder: 'LamaWorldsApp',
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Project name cannot be empty';
                }
                if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
                    return 'Project name must be a valid identifier';
                }
                return null;
            }
        });

        if (!projectName) {
            return;
        }

        try {
            await this.createWpfProject(folderUri[0].fsPath, projectName);
            vscode.window.showInformationMessage(`WPF Project '${projectName}' created successfully!`);

            // Open the new project
            const uri = vscode.Uri.file(path.join(folderUri[0].fsPath, projectName));
            vscode.commands.executeCommand('vscode.openFolder', uri);
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to create project: ${error.message}`);
        }
    }

    private async createWpfProject(parentPath: string, projectName: string) {
        const projectPath = path.join(parentPath, projectName);

        if (fs.existsSync(projectPath)) {
            throw new Error(`Directory ${projectPath} already exists.`);
        }

        fs.mkdirSync(projectPath, { recursive: true });

        // Create project structure
        const viewsPath = path.join(projectPath, 'Views');
        const viewModelsPath = path.join(projectPath, 'ViewModels');
        const modelsPath = path.join(projectPath, 'Models');
        const resourcesPath = path.join(projectPath, 'Resources');
        const commandsPath = path.join(projectPath, 'Commands');

        PathHelper.ensureDirectory(viewsPath);
        PathHelper.ensureDirectory(viewModelsPath);
        PathHelper.ensureDirectory(modelsPath);
        PathHelper.ensureDirectory(resourcesPath);
        PathHelper.ensureDirectory(commandsPath);

        // Read templates
        const templatePath = path.join(this.context.extensionPath, 'templates', 'project');
        
        // Create .csproj
        const csprojContent = `<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>net8.0-windows</TargetFramework>
    <Nullable>enable</Nullable>
    <UseWPF>true</UseWPF>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

</Project>`;
        fs.writeFileSync(path.join(projectPath, `${projectName}.csproj`), csprojContent);

        // Create App.xaml
        const appXaml = this._readTemplate('templates/project/App.xaml', projectName);
        fs.writeFileSync(path.join(projectPath, 'App.xaml'), appXaml);

        // Create App.xaml.cs
        const appCs = this._readTemplate('templates/project/App.xaml.cs', projectName);
        fs.writeFileSync(path.join(projectPath, 'App.xaml.cs'), appCs);

        // Create MainWindow
        const mainWindowXaml = this._readTemplate('templates/project/MainWindow.xaml', projectName);
        fs.writeFileSync(path.join(projectPath, 'MainWindow.xaml'), mainWindowXaml);

        const mainWindowCs = this._readTemplate('templates/project/MainWindow.xaml.cs', projectName);
        fs.writeFileSync(path.join(projectPath, 'MainWindow.xaml.cs'), mainWindowCs);

        // Create ViewModel
        const mainViewModel = this._readTemplate('templates/viewmodel/ViewModel.cs', projectName);
        fs.writeFileSync(path.join(viewModelsPath, 'MainViewModel.cs'), mainViewModel.replace(/ViewModel/g, 'MainViewModel'));

        // Create RelayCommand
        const relayCommand = this._readTemplate('templates/project/RelayCommand.cs', projectName);
        fs.writeFileSync(path.join(commandsPath, 'RelayCommand.cs'), relayCommand);

        // Create Theme.xaml
        const themeXaml = this._readTemplate('templates/resources/Theme.xaml', projectName);
        fs.writeFileSync(path.join(resourcesPath, 'Theme.xaml'), themeXaml);

        // Try to restore packages
        try {
            await execAsync(`dotnet restore "${path.join(projectPath, `${projectName}.csproj`)}"`);
        } catch (error) {
            // Ignore restore errors
        }
    }

    private _readTemplate(relativePath: string, projectName: string): string {
        const templatePath = path.join(this.context.extensionPath, relativePath);
        if (fs.existsSync(templatePath)) {
            let content = fs.readFileSync(templatePath, 'utf8');
            content = content.replace(/LamaWorldsApp/g, projectName);
            content = content.replace(/namespace/g, projectName);
            return content;
        }
        // Fallback template
        return this._getFallbackTemplate(relativePath, projectName);
    }

    private _getFallbackTemplate(relativePath: string, projectName: string): string {
        if (relativePath.includes('App.xaml')) {
            return `<Application x:Class="${projectName}.App"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             StartupUri="MainWindow.xaml">
    <Application.Resources>
        <ResourceDictionary>
            <ResourceDictionary.MergedDictionaries>
                <ResourceDictionary Source="Resources/Theme.xaml"/>
            </ResourceDictionary.MergedDictionaries>
        </ResourceDictionary>
    </Application.Resources>
</Application>`;
        }
        return '';
    }
}
