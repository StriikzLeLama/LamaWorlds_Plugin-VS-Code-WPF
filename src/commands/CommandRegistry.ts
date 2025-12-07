import * as vscode from 'vscode';
import { ProjectCreator } from '../mvvm/ProjectCreator';
import { MvvmTools } from '../mvvm/MvvmTools';
import { XamlRefactoring } from '../refactor/XamlRefactoring';
import { AIFeatures } from '../ai/AIFeatures';
import { HotReloadEngine } from '../utils/HotReloadEngine';

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
                await this.aiFeatures.generateUI();
            }),
            vscode.commands.registerCommand('lamaworlds.aiOptimizeLayout', async () => {
                await this.aiFeatures.optimizeLayout();
            }),
            vscode.commands.registerCommand('lamaworlds.aiAutoFix', async () => {
                await this.aiFeatures.autoFix();
            }),
            vscode.commands.registerCommand('lamaworlds.aiGenerateViewModel', async () => {
                await this.aiFeatures.generateViewModel();
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
