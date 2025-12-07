import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Tree Data Provider for Resource Explorer View
 */
export class ResourceExplorerTreeProvider implements vscode.TreeDataProvider<ResourceItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ResourceItem | undefined | null | void> = new vscode.EventEmitter<ResourceItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ResourceItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private context: vscode.ExtensionContext) {
        // Watch for file changes
        const watcher = vscode.workspace.createFileSystemWatcher('**/*.{xaml,resx,resw}');
        watcher.onDidChange(() => this.refresh());
        watcher.onDidCreate(() => this.refresh());
        watcher.onDidDelete(() => this.refresh());
        context.subscriptions.push(watcher);
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ResourceItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ResourceItem): Thenable<ResourceItem[]> {
        if (!element) {
            // Root level - scan workspace for resources
            return Promise.resolve(this.scanWorkspace());
        } else if (element.type === 'file') {
            // File level - parse and show resources
            return Promise.resolve(this.parseResourceFile(element.resourcePath!));
        } else {
            return Promise.resolve([]);
        }
    }

    private scanWorkspace(): ResourceItem[] {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return [new ResourceItem('No workspace folder', 'empty', '📁')];
        }

        const items: ResourceItem[] = [];
        
        workspaceFolders.forEach(folder => {
            const xamlFiles = this.findFiles(folder.uri.fsPath, '**/*.xaml');
            const resxFiles = this.findFiles(folder.uri.fsPath, '**/*.resx');
            const reswFiles = this.findFiles(folder.uri.fsPath, '**/*.resw');

            if (xamlFiles.length > 0 || resxFiles.length > 0 || reswFiles.length > 0) {
                items.push(new ResourceItem(
                    path.basename(folder.uri.fsPath),
                    'folder',
                    '📁',
                    folder.uri.fsPath
                ));
            }
        });

        return items.length > 0 ? items : [new ResourceItem('No resource files found', 'empty', '📁')];
    }

    private findFiles(rootPath: string, pattern: string): string[] {
        const files: string[] = [];
        try {
            const fullPattern = path.join(rootPath, pattern);
            // Simple implementation - in production, use glob
            this.findFilesRecursive(rootPath, files);
        } catch (error) {
            console.error('Error finding files:', error);
        }
        return files;
    }

    private findFilesRecursive(dir: string, files: string[]): void {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'bin' && entry.name !== 'obj') {
                    this.findFilesRecursive(fullPath, files);
                } else if (entry.isFile() && (entry.name.endsWith('.xaml') || entry.name.endsWith('.resx') || entry.name.endsWith('.resw'))) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // Ignore errors
        }
    }

    private parseResourceFile(filePath: string): ResourceItem[] {
        // Simplified - in production, parse XAML/ResX files
        return [
            new ResourceItem('Resources', 'resource', '🎨'),
            new ResourceItem('Styles', 'resource', '💅'),
            new ResourceItem('Templates', 'resource', '📄')
        ];
    }
}

class ResourceItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly type: 'folder' | 'file' | 'resource' | 'empty',
        public readonly icon: string,
        public readonly resourcePath?: string
    ) {
        super(`${icon} ${label}`, type === 'folder' || type === 'file' ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);

        this.tooltip = resourcePath || label;
        this.description = resourcePath ? path.basename(resourcePath) : '';
        this.resourcePath = resourcePath;

        if (type === 'file' && resourcePath) {
            this.command = {
                command: 'vscode.open',
                title: 'Open Resource',
                arguments: [vscode.Uri.file(resourcePath)]
            };
        }
    }
}

