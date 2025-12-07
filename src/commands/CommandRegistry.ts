import * as vscode from 'vscode';
import { ProjectCreator } from '../mvvm/ProjectCreator';
import { MvvmTools } from '../mvvm/MvvmTools';
import { XamlRefactoring } from '../refactor/XamlRefactoring';
import { AIFeatures } from '../ai/AIFeatures';
import { HotReloadEngine } from '../services/HotReloadEngine';

/**
 * Central command registry
 */
export class CommandRegistry {
    private static projectCreator: ProjectCreator;
    private static mvvmTools: MvvmTools;
    private static xamlRefactoring: XamlRefactoring;
    private static aiFeatures: AIFeatures;
    private static hotReloadEngine: HotReloadEngine;

    /**
     * Initialize all services
     */
    static initialize(context: vscode.ExtensionContext) {
        this.projectCreator = new ProjectCreator(context);
        this.mvvmTools = new MvvmTools(context);
        this.xamlRefactoring = new XamlRefactoring(context);
        this.aiFeatures = new AIFeatures(context);
        this.hotReloadEngine = new HotReloadEngine(context);
    }

    /**
     * Register all commands
     */
    static registerCommands(context: vscode.ExtensionContext): vscode.Disposable[] {
        const disposables: vscode.Disposable[] = [];

        // Project commands
        disposables.push(
            vscode.commands.registerCommand('lamaworlds.createWpfProject', async () => {
                await this.projectCreator.createProject();
            })
        );

        // MVVM commands
        disposables.push(
            vscode.commands.registerCommand('lamaworlds.newWindow', async () => {
                await this.mvvmTools.createWindow();
            }),
            vscode.commands.registerCommand('lamaworlds.newUserControl', async () => {
                await this.mvvmTools.createUserControl();
            }),
            vscode.commands.registerCommand('lamaworlds.newViewModel', async () => {
                await this.mvvmTools.createViewModel();
            }),
            vscode.commands.registerCommand('lamaworlds.addRelayCommand', async () => {
                await this.mvvmTools.addRelayCommand();
            }),
            vscode.commands.registerCommand('lamaworlds.generateDataTemplate', async () => {
                await this.mvvmTools.generateDataTemplate();
            })
        );

        // Refactoring commands
        disposables.push(
            vscode.commands.registerCommand('lamaworlds.extractToUserControl', async () => {
                await this.xamlRefactoring.extractToUserControl();
            }),
            vscode.commands.registerCommand('lamaworlds.wrapWithGrid', async () => {
                await this.xamlRefactoring.wrapWith('Grid');
            }),
            vscode.commands.registerCommand('lamaworlds.wrapWithBorder', async () => {
                await this.xamlRefactoring.wrapWith('Border');
            }),
            vscode.commands.registerCommand('lamaworlds.wrapWithStackPanel', async () => {
                await this.xamlRefactoring.wrapWith('StackPanel');
            }),
            vscode.commands.registerCommand('lamaworlds.convertGridToStackPanel', async () => {
                await this.xamlRefactoring.convertGridToStackPanel();
            }),
            vscode.commands.registerCommand('lamaworlds.renameBinding', async () => {
                await this.xamlRefactoring.renameBinding();
            }),
            vscode.commands.registerCommand('lamaworlds.generateStyle', async () => {
                await this.xamlRefactoring.generateStyle();
            })
        );

        // AI commands
        disposables.push(
            vscode.commands.registerCommand('lamaworlds.aiGenerateUI', async () => {
                const description = await vscode.window.showInputBox({
                    prompt: 'Describe the UI you want to generate',
                    placeHolder: 'e.g., A login form with username, password, and submit button'
                });
                if (description) {
                    const result = await this.aiFeatures.generateUIFromDescription(description);
                    const editor = vscode.window.activeTextEditor;
                    if (editor && editor.document.fileName.endsWith('.xaml')) {
                        await editor.edit(editBuilder => {
                            editBuilder.insert(new vscode.Position(0, 0), result.xaml);
                        });
                    }
                }
            }),
            vscode.commands.registerCommand('lamaworlds.aiOptimizeLayout', async () => {
                const editor = vscode.window.activeTextEditor;
                if (editor && editor.document.fileName.endsWith('.xaml')) {
                    const xamlContent = editor.document.getText();
                    const result = await this.aiFeatures.optimizeLayout(xamlContent);
                    if (result.suggestions.length > 0) {
                        const apply = await vscode.window.showInformationMessage(
                            `Found ${result.suggestions.length} optimization suggestions. Apply them?`,
                            'Apply', 'Cancel'
                        );
                        if (apply === 'Apply') {
                            await editor.edit(editBuilder => {
                                const fullRange = new vscode.Range(
                                    editor.document.positionAt(0),
                                    editor.document.positionAt(editor.document.getText().length)
                                );
                                editBuilder.replace(fullRange, result.optimized);
                            });
                        }
                    }
                }
            }),
            vscode.commands.registerCommand('lamaworlds.aiAutoFix', async () => {
                const editor = vscode.window.activeTextEditor;
                if (editor && editor.document.fileName.endsWith('.xaml')) {
                    const xamlContent = editor.document.getText();
                    const result = await this.aiFeatures.autoFixXaml(xamlContent);
                    if (result.fixes.length > 0) {
                        const apply = await vscode.window.showInformationMessage(
                            `Found ${result.fixes.length} fixes. Apply them?`,
                            'Apply', 'Cancel'
                        );
                        if (apply === 'Apply') {
                            await editor.edit(editBuilder => {
                                const fullRange = new vscode.Range(
                                    editor.document.positionAt(0),
                                    editor.document.positionAt(editor.document.getText().length)
                                );
                                editBuilder.replace(fullRange, result.fixed);
                            });
                        }
                    }
                }
            }),
            vscode.commands.registerCommand('lamaworlds.aiGenerateViewModel', async () => {
                const description = await vscode.window.showInputBox({
                    prompt: 'Describe the ViewModel properties and commands needed',
                    placeHolder: 'e.g., Properties: Name, Age. Commands: SaveCommand, DeleteCommand'
                });
                if (description) {
                    const result = await this.aiFeatures.generateViewModelFromDescription(description);
                    // Create new ViewModel file
                    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                    if (workspaceFolder) {
                        const filePath = vscode.Uri.joinPath(workspaceFolder.uri, 'ViewModels', 'GeneratedViewModel.cs');
                        await vscode.workspace.fs.writeFile(filePath, Buffer.from(result, 'utf8'));
                        vscode.window.showInformationMessage('ViewModel generated successfully!');
                    }
                }
            })
        );

        // Hot reload
        disposables.push(
            vscode.commands.registerCommand('lamaworlds.toggleHotReload', async () => {
                await this.hotReloadEngine.toggle();
            })
        );

        return disposables;
    }

    /**
     * Get services
     */
    static getProjectCreator(): ProjectCreator { return this.projectCreator; }
    static getMvvmTools(): MvvmTools { return this.mvvmTools; }
    static getXamlRefactoring(): XamlRefactoring { return this.xamlRefactoring; }
    static getAIFeatures(): AIFeatures { return this.aiFeatures; }
    static getHotReloadEngine(): HotReloadEngine { return this.hotReloadEngine; }
}
