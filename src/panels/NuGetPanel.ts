import * as vscode from 'vscode';
import * as path from 'path';
import { ProjectScanner, PackageReference } from '../nuget/projectScanner';
import { NuGetManager } from '../nuget/manager';
import { NuGetRestore } from '../nuget/restore';
import { NuGetLogChannel } from '../nuget/logChannel';

/**
 * NuGet Package Manager Panel
 */
export class NuGetPanel {
    public static currentPanel: NuGetPanel | undefined;
    private static readonly viewType = 'lamaworldsNuGet';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private readonly _context: vscode.ExtensionContext;
    private _disposables: vscode.Disposable[] = [];
    private _currentProjectPath: string | null = null;

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._context = context;

        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                await this._handleMessage(message);
            },
            null,
            this._disposables
        );
    }

    public static createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        const column = vscode.ViewColumn.Two;

        if (NuGetPanel.currentPanel) {
            NuGetPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            NuGetPanel.viewType,
            'NuGet Package Manager',
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

        NuGetPanel.currentPanel = new NuGetPanel(panel, extensionUri, context);
    }

    public static dispose() {
        if (NuGetPanel.currentPanel) {
            NuGetPanel.currentPanel.dispose();
        }
    }

    public dispose() {
        NuGetPanel.currentPanel = undefined;

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private async _update() {
        // Detect current project
        const csprojPath = await ProjectScanner.findNearestCsproj();
        this._currentProjectPath = csprojPath || null;

        if (csprojPath) {
            const projectInfo = await ProjectScanner.getProjectInfo(csprojPath);
            this._panel.webview.html = this._getHtmlForWebview(projectInfo);
        } else {
            this._panel.webview.html = this._getHtmlForWebview(null);
        }
    }

    private async _handleMessage(message: any) {
        const logChannel = NuGetLogChannel.getInstance();

        try {
            switch (message.command) {
                case 'refresh':
                    await this._update();
                    break;

                case 'detectProject':
                    await this._update();
                    this._panel.webview.postMessage({
                        command: 'projectDetected',
                        projectPath: this._currentProjectPath
                    });
                    break;

                case 'searchPackages':
                    await this._handleSearchPackages(message.query);
                    break;

                case 'getInstalledPackages':
                    if (this._currentProjectPath) {
                        const packages = await ProjectScanner.parsePackageReferences(this._currentProjectPath);
                        this._panel.webview.postMessage({
                            command: 'installedPackages',
                            packages
                        });
                    }
                    break;

                case 'installPackage':
                    if (!this._currentProjectPath) {
                        vscode.window.showErrorMessage('No project detected. Please open a .csproj file.');
                        return;
                    }
                    await this._handleInstallPackage(message.packageId, message.version);
                    break;

                case 'updatePackage':
                    if (!this._currentProjectPath) {
                        vscode.window.showErrorMessage('No project detected. Please open a .csproj file.');
                        return;
                    }
                    await this._handleUpdatePackage(message.packageId, message.version);
                    break;

                case 'removePackage':
                    if (!this._currentProjectPath) {
                        vscode.window.showErrorMessage('No project detected. Please open a .csproj file.');
                        return;
                    }
                    await this._handleRemovePackage(message.packageId);
                    break;

                case 'restorePackages':
                    if (!this._currentProjectPath) {
                        vscode.window.showErrorMessage('No project detected. Please open a .csproj file.');
                        return;
                    }
                    await this._handleRestorePackages();
                    break;

                case 'getPackageVersions':
                    await this._handleGetPackageVersions(message.packageId);
                    break;
            }
        } catch (error: any) {
            logChannel.error(`Error handling message: ${error?.message || error}`);
            this._panel.webview.postMessage({
                command: 'error',
                message: error?.message || 'Unknown error'
            });
        }
    }

    private async _handleSearchPackages(query: string) {
        try {
            const response = await fetch(`https://api.nuget.org/v3-flatcontainer/${query.toLowerCase()}/index.json`);
            if (!response.ok) {
                // Try search API instead
                const searchResponse = await fetch(`https://azuresearch-usnc.nuget.org/query?q=${encodeURIComponent(query)}&take=20`);
                if (searchResponse.ok) {
                    const data = await searchResponse.json() as { data?: any[] };
                    this._panel.webview.postMessage({
                        command: 'searchResults',
                        packages: data.data || []
                    });
                } else {
                    this._panel.webview.postMessage({
                        command: 'searchResults',
                        packages: []
                    });
                }
            } else {
                const data = await response.json() as { versions?: string[] };
                this._panel.webview.postMessage({
                    command: 'packageInfo',
                    packageId: query,
                    versions: data.versions || []
                });
            }
        } catch (error: any) {
            NuGetLogChannel.getInstance().error(`Search error: ${error?.message || error}`);
            this._panel.webview.postMessage({
                command: 'error',
                message: `Search failed: ${error?.message || 'Unknown error'}`
            });
        }
    }

    private async _handleInstallPackage(packageId: string, version?: string) {
        if (!this._currentProjectPath) return;

        this._panel.webview.postMessage({
            command: 'operationStarted',
            operation: 'install',
            packageId
        });

        const success = await NuGetManager.installPackage(this._currentProjectPath, packageId, version);
        
        this._panel.webview.postMessage({
            command: 'operationCompleted',
            operation: 'install',
            packageId,
            success
        });

        if (success) {
            await this._update();
        }
    }

    private async _handleUpdatePackage(packageId: string, version?: string) {
        if (!this._currentProjectPath) return;

        this._panel.webview.postMessage({
            command: 'operationStarted',
            operation: 'update',
            packageId
        });

        const success = await NuGetManager.updatePackage(this._currentProjectPath, packageId, version);
        
        this._panel.webview.postMessage({
            command: 'operationCompleted',
            operation: 'update',
            packageId,
            success
        });

        if (success) {
            await this._update();
        }
    }

    private async _handleRemovePackage(packageId: string) {
        if (!this._currentProjectPath) return;

        this._panel.webview.postMessage({
            command: 'operationStarted',
            operation: 'remove',
            packageId
        });

        const success = await NuGetManager.removePackage(this._currentProjectPath, packageId);
        
        this._panel.webview.postMessage({
            command: 'operationCompleted',
            operation: 'remove',
            packageId,
            success
        });

        if (success) {
            await this._update();
        }
    }

    private async _handleRestorePackages() {
        if (!this._currentProjectPath) return;

        this._panel.webview.postMessage({
            command: 'operationStarted',
            operation: 'restore'
        });

        const result = await NuGetRestore.runRestore(this._currentProjectPath);
        
        this._panel.webview.postMessage({
            command: 'operationCompleted',
            operation: 'restore',
            success: result.success,
            output: result.output,
            error: result.error
        });
    }

    private async _handleGetPackageVersions(packageId: string) {
        try {
            const response = await fetch(`https://api.nuget.org/v3-flatcontainer/${packageId.toLowerCase()}/index.json`);
            if (response.ok) {
                const data = await response.json() as { versions?: string[] };
                this._panel.webview.postMessage({
                    command: 'packageVersions',
                    packageId,
                    versions: data.versions || []
                });
            } else {
                this._panel.webview.postMessage({
                    command: 'packageVersions',
                    packageId,
                    versions: []
                });
            }
        } catch (error: any) {
            NuGetLogChannel.getInstance().error(`Get versions error: ${error?.message || error}`);
            this._panel.webview.postMessage({
                command: 'packageVersions',
                packageId,
                versions: []
            });
        }
    }

    private _getHtmlForWebview(projectInfo: any) {
        const webview = this._panel.webview;
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webviews', 'nuget', 'nuget.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webviews', 'nuget', 'nuget.css'));

        const projectPath = projectInfo?.path || 'No project detected';
        const packages = projectInfo?.packages || [];

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="${styleUri}" rel="stylesheet">
    <title>NuGet Package Manager</title>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>NuGet Package Manager</h1>
            <div class="project-info">
                <span class="project-label">Project:</span>
                <span class="project-path">${this._escapeHtml(projectPath)}</span>
                <button class="btn-refresh" onclick="refreshProject()">Refresh</button>
            </div>
        </div>

        <div class="content">
            <div class="section">
                <h2>Search & Install</h2>
                <div class="search-container">
                    <input type="text" id="searchInput" placeholder="Search NuGet packages..." class="search-input">
                    <button class="btn-search" onclick="searchPackages()">Search</button>
                </div>
                <div id="searchResults" class="search-results"></div>
            </div>

            <div class="section">
                <h2>Installed Packages</h2>
                <div class="installed-packages">
                    ${packages.length === 0 
                        ? '<p class="no-packages">No packages installed</p>'
                        : packages.map((pkg: PackageReference) => `
                            <div class="package-item">
                                <div class="package-info">
                                    <span class="package-name">${this._escapeHtml(pkg.Include)}</span>
                                    ${pkg.Version ? `<span class="package-version">${this._escapeHtml(pkg.Version)}</span>` : ''}
                                </div>
                                <div class="package-actions">
                                    <button class="btn-update" onclick="updatePackage('${this._escapeHtml(pkg.Include)}')">Update</button>
                                    <button class="btn-remove" onclick="removePackage('${this._escapeHtml(pkg.Include)}')">Remove</button>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
                <div class="actions">
                    <button class="btn-restore" onclick="restorePackages()">Restore All Packages</button>
                </div>
            </div>

            <div class="section">
                <h2>Activity Log</h2>
                <div id="activityLog" class="activity-log"></div>
            </div>
        </div>
    </div>

    <script src="${scriptUri}"></script>
</body>
</html>`;
    }

    private _escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

