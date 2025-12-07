import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class RunPanel {
    public static currentPanel: RunPanel | undefined;
    private static readonly viewType = 'runPanel';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private readonly _outputChannel: vscode.OutputChannel;
    private _disposables: vscode.Disposable[] = [];
    private _buildProcess: any = null;
    private _runProcess: any = null;

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._outputChannel = vscode.window.createOutputChannel('Lama Worlds WPF');

        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'build':
                        await this._build();
                        return;
                    case 'run':
                        await this._run();
                        return;
                    case 'stop':
                        await this._stop();
                        return;
                    case 'clean':
                        await this._clean();
                        return;
                    case 'package':
                        await this._package(message.packageType);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.ViewColumn.Two;

        if (RunPanel.currentPanel) {
            RunPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            RunPanel.viewType,
            'Run & Build',
            column,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri]
            }
        );

        RunPanel.currentPanel = new RunPanel(panel, extensionUri);
    }

    public static async buildProject() {
        if (RunPanel.currentPanel) {
            await RunPanel.currentPanel._build();
        }
    }

    public static async runProject() {
        if (RunPanel.currentPanel) {
            await RunPanel.currentPanel._run();
        }
    }

    public static dispose() {
        if (RunPanel.currentPanel) {
            RunPanel.currentPanel.dispose();
        }
    }

    public dispose() {
        RunPanel.currentPanel = undefined;
        this._stop();
        this._panel.dispose();
        this._outputChannel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update() {
        const projectPath = this._findProjectPath();
        const status = this._getStatus();

        this._panel.webview.html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Run & Build</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 15px;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .button-group {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            transition: all 0.2s;
        }
        .btn-primary {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        .btn-primary:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .btn-secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        .btn-danger {
            background: #d32f2f;
            color: white;
        }
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .status-panel {
            padding: 15px;
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .status-item {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            font-size: 13px;
        }
        .status-label {
            color: var(--vscode-descriptionForeground);
        }
        .status-value {
            font-weight: bold;
        }
        .logs-panel {
            background: var(--vscode-textCodeBlock-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 5px;
            padding: 10px;
            max-height: 400px;
            overflow-y: auto;
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 12px;
        }
        .log-entry {
            margin: 2px 0;
            white-space: pre-wrap;
        }
        .log-error {
            color: #f44336;
        }
        .log-success {
            color: #4caf50;
        }
        .log-info {
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <h2>Run & Build Panel</h2>
    
    <div class="status-panel">
        <div class="status-item">
            <span class="status-label">Project:</span>
            <span class="status-value">${projectPath ? path.basename(projectPath) : 'Not found'}</span>
        </div>
        <div class="status-item">
            <span class="status-label">Status:</span>
            <span class="status-value">${status}</span>
        </div>
    </div>

    <div class="button-group">
        <button class="btn btn-primary" onclick="build()">Build</button>
        <button class="btn btn-primary" onclick="run()">Run</button>
        <button class="btn btn-secondary" onclick="clean()">Clean</button>
        <button class="btn btn-danger" onclick="stop()" ${this._runProcess ? '' : 'disabled'}>Stop</button>
    </div>
    <div class="button-group" style="margin-top: 10px;">
        <button class="btn btn-secondary" onclick="package('exe')">Package (EXE)</button>
        <button class="btn btn-secondary" onclick="package('msi')">Package (MSI)</button>
        <button class="btn btn-secondary" onclick="package('publish')">Publish</button>
    </div>

    <div class="logs-panel" id="logs">
        <div class="log-entry log-info">Ready. Click Build or Run to start.</div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        function build() {
            vscode.postMessage({ command: 'build' });
        }
        
        function run() {
            vscode.postMessage({ command: 'run' });
        }
        
        function clean() {
            vscode.postMessage({ command: 'clean' });
        }
        
        function stop() {
            vscode.postMessage({ command: 'stop' });
        }
        
        function package(type) {
            vscode.postMessage({ command: 'package', packageType: type });
        }
        
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'log') {
                const logs = document.getElementById('logs');
                const entry = document.createElement('div');
                entry.className = \`log-entry log-\${message.type}\`;
                entry.textContent = message.text;
                logs.appendChild(entry);
                logs.scrollTop = logs.scrollHeight;
            }
        });
    </script>
</body>
</html>`;
    }

    private _findProjectPath(): string | null {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return null;
        }

        for (const folder of workspaceFolders) {
            const files = fs.readdirSync(folder.uri.fsPath);
            const csproj = files.find(f => f.endsWith('.csproj'));
            if (csproj) {
                return path.join(folder.uri.fsPath, csproj);
            }
        }

        return null;
    }

    private _getStatus(): string {
        if (this._buildProcess) {
            return 'Building...';
        }
        if (this._runProcess) {
            return 'Running...';
        }
        return 'Idle';
    }

    private async _build() {
        const projectPath = this._findProjectPath();
        if (!projectPath) {
            this._log('error', 'No .csproj file found in workspace.');
            return;
        }

        const projectDir = path.dirname(projectPath);
        this._log('info', `Building project: ${path.basename(projectPath)}...`);

        try {
            this._buildProcess = exec(`dotnet build "${projectPath}"`, { cwd: projectDir });
            
            this._buildProcess.stdout?.on('data', (data: string) => {
                this._log('info', data);
                this._outputChannel.append(data);
            });

            this._buildProcess.stderr?.on('data', (data: string) => {
                this._log('error', data);
                this._outputChannel.append(data);
            });

            this._buildProcess.on('close', (code: number) => {
                this._buildProcess = null;
                if (code === 0) {
                    this._log('success', 'Build succeeded!');
                } else {
                    this._log('error', `Build failed with code ${code}`);
                }
                this._update();
            });

            this._update();
        } catch (error: any) {
            this._log('error', `Build error: ${error.message}`);
            this._buildProcess = null;
        }
    }

    private async _run() {
        const projectPath = this._findProjectPath();
        if (!projectPath) {
            this._log('error', 'No .csproj file found in workspace.');
            return;
        }

        const projectDir = path.dirname(projectPath);
        this._log('info', `Running project: ${path.basename(projectPath)}...`);

        try {
            this._runProcess = exec(`dotnet run --project "${projectPath}"`, { cwd: projectDir });
            
            this._runProcess.stdout?.on('data', (data: string) => {
                this._log('info', data);
                this._outputChannel.append(data);
            });

            this._runProcess.stderr?.on('data', (data: string) => {
                this._log('error', data);
                this._outputChannel.append(data);
            });

            this._runProcess.on('close', (code: number) => {
                this._runProcess = null;
                this._log('info', `Process exited with code ${code}`);
                this._update();
            });

            this._update();
        } catch (error: any) {
            this._log('error', `Run error: ${error.message}`);
            this._runProcess = null;
        }
    }

    private async _stop() {
        if (this._runProcess) {
            this._runProcess.kill();
            this._runProcess = null;
            this._log('info', 'Process stopped.');
            this._update();
        }
        if (this._buildProcess) {
            this._buildProcess.kill();
            this._buildProcess = null;
            this._log('info', 'Build stopped.');
            this._update();
        }
    }

    private async _clean() {
        const projectPath = this._findProjectPath();
        if (!projectPath) {
            this._log('error', 'No .csproj file found in workspace.');
            return;
        }

        const projectDir = path.dirname(projectPath);
        this._log('info', 'Cleaning project...');

        try {
            const { stdout, stderr } = await execAsync(`dotnet clean "${projectPath}"`, { cwd: projectDir });
            if (stdout) {
                this._log('info', stdout);
            }
            if (stderr) {
                this._log('error', stderr);
            }
            this._log('success', 'Clean completed!');
        } catch (error: any) {
            this._log('error', `Clean error: ${error.message}`);
        }
    }

    private async _package(packageType: string) {
        const projectPath = this._findProjectPath();
        if (!projectPath) {
            this._log('error', 'No .csproj file found in workspace.');
            return;
        }

        const projectDir = path.dirname(projectPath);
        this._log('info', `Packaging as ${packageType.toUpperCase()}...`);

        try {
            let command = '';
            switch (packageType) {
                case 'exe':
                    command = `dotnet publish "${projectPath}" -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true`;
                    break;
                case 'msi':
                    command = `dotnet publish "${projectPath}" -c Release -r win-x64 --self-contained true -p:WindowsPackageType=msi`;
                    break;
                case 'publish':
                    command = `dotnet publish "${projectPath}" -c Release`;
                    break;
            }

            const { stdout, stderr } = await execAsync(command, { cwd: projectDir });
            if (stdout) {
                this._log('info', stdout);
            }
            if (stderr) {
                this._log('error', stderr);
            }
            this._log('success', `Packaging completed! Output in bin/Release/`);
        } catch (error: any) {
            this._log('error', `Packaging error: ${error.message}`);
        }
    }

    private _log(type: string, text: string) {
        this._panel.webview.postMessage({
            command: 'log',
            type: type,
            text: text
        });
    }
}
