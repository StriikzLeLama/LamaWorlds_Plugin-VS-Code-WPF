import * as vscode from 'vscode';
import * as path from 'path';

export class AnimationEditorPanel {
    public static currentPanel: AnimationEditorPanel | undefined;
    private static readonly viewType = 'animationEditor';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _animations: any[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async (message: any) => {
                switch (message.command) {
                    case 'addKeyframe':
                        this._addKeyframe(message.data);
                        return;
                    case 'updateKeyframe':
                        this._updateKeyframe(message.data);
                        return;
                    case 'deleteKeyframe':
                        this._deleteKeyframe(message.data);
                        return;
                    case 'generateStoryboard':
                        await this._generateStoryboard(message.data);
                        return;
                    case 'previewAnimation':
                        this._previewAnimation(message.data);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.ViewColumn.Two;

        if (AnimationEditorPanel.currentPanel) {
            AnimationEditorPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            AnimationEditorPanel.viewType,
            'Animation Editor',
            column,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri],
                retainContextWhenHidden: true
            }
        );

        AnimationEditorPanel.currentPanel = new AnimationEditorPanel(panel, extensionUri);
    }

    public static dispose() {
        if (AnimationEditorPanel.currentPanel) {
            AnimationEditorPanel.currentPanel.dispose();
        }
    }

    public dispose() {
        AnimationEditorPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update() {
        this._panel.webview.html = this._getHtml();
    }

    private _getHtml(): string {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Animation Editor</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #0b1d2a;
            color: #ffffff;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .header {
            background: #0e2435;
            padding: 15px;
            border-bottom: 1px solid #56b0ff;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .header h2 {
            color: #56b0ff;
            font-size: 18px;
        }
        .toolbar {
            display: flex;
            gap: 10px;
        }
        .btn {
            padding: 8px 16px;
            background: linear-gradient(135deg, #56b0ff 0%, #00ffff 100%);
            border: none;
            border-radius: 5px;
            color: #0b1d2a;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(86, 176, 255, 0.4);
        }
        .content {
            flex: 1;
            display: flex;
            overflow: hidden;
        }
        .timeline-panel {
            flex: 1;
            background: #0e2435;
            border-right: 1px solid #56b0ff;
            display: flex;
            flex-direction: column;
        }
        .properties-panel {
            width: 300px;
            background: #0e2435;
            border-left: 1px solid #56b0ff;
            padding: 15px;
            overflow-y: auto;
        }
        .timeline {
            flex: 1;
            padding: 20px;
            overflow-x: auto;
            overflow-y: auto;
        }
        .timeline-ruler {
            height: 30px;
            background: #0b1d2a;
            border-bottom: 2px solid #56b0ff;
            position: relative;
            margin-bottom: 10px;
        }
        .ruler-mark {
            position: absolute;
            height: 100%;
            width: 1px;
            background: #56b0ff;
            opacity: 0.5;
        }
        .ruler-label {
            position: absolute;
            top: 5px;
            font-size: 10px;
            color: #56b0ff;
            transform: translateX(-50%);
        }
        .track {
            margin-bottom: 20px;
            background: rgba(86, 176, 255, 0.1);
            border: 1px solid #56b0ff;
            border-radius: 5px;
            padding: 10px;
            min-height: 60px;
        }
        .track-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            color: #56b0ff;
            font-weight: bold;
        }
        .keyframes {
            position: relative;
            height: 40px;
            background: rgba(0, 255, 255, 0.1);
            border-radius: 3px;
        }
        .keyframe {
            position: absolute;
            width: 12px;
            height: 12px;
            background: #00ffff;
            border: 2px solid #56b0ff;
            border-radius: 50%;
            cursor: pointer;
            transform: translate(-50%, -50%);
            top: 50%;
        }
        .keyframe:hover {
            transform: translate(-50%, -50%) scale(1.3);
            box-shadow: 0 0 10px #00ffff;
        }
        .keyframe.selected {
            background: #56b0ff;
            box-shadow: 0 0 15px #56b0ff;
        }
        .property-group {
            margin-bottom: 20px;
            padding: 15px;
            background: rgba(86, 176, 255, 0.05);
            border-radius: 5px;
            border: 1px solid rgba(86, 176, 255, 0.2);
        }
        .property-group h3 {
            color: #56b0ff;
            margin-bottom: 10px;
            font-size: 14px;
        }
        .property-item {
            margin-bottom: 10px;
        }
        .property-item label {
            display: block;
            color: #ffffff;
            margin-bottom: 5px;
            font-size: 12px;
        }
        .property-item input,
        .property-item select {
            width: 100%;
            padding: 8px;
            background: #0b1d2a;
            border: 1px solid #56b0ff;
            border-radius: 3px;
            color: #ffffff;
            font-size: 12px;
        }
        .property-item input:focus,
        .property-item select:focus {
            outline: none;
            border-color: #00ffff;
            box-shadow: 0 0 5px rgba(86, 176, 255, 0.3);
        }
        .preview-area {
            height: 200px;
            background: rgba(86, 176, 255, 0.1);
            border: 1px dashed #56b0ff;
            border-radius: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 15px;
        }
        .preview-box {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #56b0ff 0%, #00ffff 100%);
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>🎬 Animation Editor</h2>
        <div class="toolbar">
            <button class="btn" onclick="addAnimation()">+ Add Animation</button>
            <button class="btn" onclick="generateStoryboard()">Generate Storyboard</button>
            <button class="btn" onclick="previewAnimation()">▶ Preview</button>
        </div>
    </div>
    <div class="content">
        <div class="timeline-panel">
            <div class="timeline">
                <div class="timeline-ruler" id="ruler"></div>
                <div class="track">
                    <div class="track-header">
                        <span>Opacity</span>
                        <button class="btn" style="padding: 4px 8px; font-size: 11px;" onclick="addKeyframe('opacity', 0)">+ Keyframe</button>
                    </div>
                    <div class="keyframes" id="opacity-track">
                        <!-- Keyframes will be added here -->
                    </div>
                </div>
                <div class="track">
                    <div class="track-header">
                        <span>Transform (X)</span>
                        <button class="btn" style="padding: 4px 8px; font-size: 11px;" onclick="addKeyframe('transformX', 0)">+ Keyframe</button>
                    </div>
                    <div class="keyframes" id="transformX-track">
                        <!-- Keyframes will be added here -->
                    </div>
                </div>
                <div class="track">
                    <div class="track-header">
                        <span>Transform (Y)</span>
                        <button class="btn" style="padding: 4px 8px; font-size: 11px;" onclick="addKeyframe('transformY', 0)">+ Keyframe</button>
                    </div>
                    <div class="keyframes" id="transformY-track">
                        <!-- Keyframes will be added here -->
                    </div>
                </div>
            </div>
        </div>
        <div class="properties-panel">
            <div class="property-group">
                <h3>Animation Properties</h3>
                <div class="property-item">
                    <label>Duration (seconds)</label>
                    <input type="number" id="duration" value="1" min="0.1" step="0.1" onchange="updateDuration()">
                </div>
                <div class="property-item">
                    <label>Easing Function</label>
                    <select id="easing" onchange="updateEasing()">
                        <option value="Linear">Linear</option>
                        <option value="EaseIn">Ease In</option>
                        <option value="EaseOut">Ease Out</option>
                        <option value="EaseInOut">Ease In Out</option>
                        <option value="Bounce">Bounce</option>
                        <option value="Elastic">Elastic</option>
                    </select>
                </div>
                <div class="property-item">
                    <label>Repeat Behavior</label>
                    <select id="repeat" onchange="updateRepeat()">
                        <option value="Once">Once</option>
                        <option value="Forever">Forever</option>
                    </select>
                </div>
            </div>
            <div class="property-group">
                <h3>Selected Keyframe</h3>
                <div class="property-item">
                    <label>Time (seconds)</label>
                    <input type="number" id="keyframe-time" value="0" min="0" step="0.1" onchange="updateKeyframeTime()">
                </div>
                <div class="property-item">
                    <label>Value</label>
                    <input type="number" id="keyframe-value" value="0" step="0.1" onchange="updateKeyframeValue()">
                </div>
            </div>
            <div class="property-group">
                <h3>Preview</h3>
                <div class="preview-area">
                    <div class="preview-box" id="preview-box"></div>
                </div>
            </div>
        </div>
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        let animations = [];
        let selectedKeyframe = null;
        const duration = 2; // seconds
        const pixelsPerSecond = 100;

        function initRuler() {
            const ruler = document.getElementById('ruler');
            ruler.innerHTML = '';
            for (let i = 0; i <= duration; i += 0.5) {
                const mark = document.createElement('div');
                mark.className = 'ruler-mark';
                mark.style.left = (i * pixelsPerSecond) + 'px';
                const label = document.createElement('div');
                label.className = 'ruler-label';
                label.textContent = i + 's';
                label.style.left = (i * pixelsPerSecond) + 'px';
                ruler.appendChild(mark);
                ruler.appendChild(label);
            }
        }

        function addKeyframe(property, value) {
            const time = prompt('Enter time (seconds):', '0');
            if (time === null) return;
            const t = parseFloat(time);
            if (isNaN(t) || t < 0 || t > duration) {
                alert('Invalid time');
                return;
            }
            vscode.postMessage({
                command: 'addKeyframe',
                data: { property, time: t, value }
            });
        }

        function generateStoryboard() {
            vscode.postMessage({
                command: 'generateStoryboard',
                data: { animations }
            });
        }

        function previewAnimation() {
            vscode.postMessage({
                command: 'previewAnimation',
                data: { animations }
            });
            // Animate preview box
            const box = document.getElementById('preview-box');
            box.style.animation = 'none';
            setTimeout(() => {
                box.style.animation = 'fadeIn 1s ease-in-out';
            }, 10);
        }

        function updateDuration() {
            const dur = parseFloat(document.getElementById('duration').value);
            initRuler();
        }

        function updateEasing() {
            // Update easing
        }

        function updateRepeat() {
            // Update repeat
        }

        function updateKeyframeTime() {
            if (selectedKeyframe) {
                const time = parseFloat(document.getElementById('keyframe-time').value);
                vscode.postMessage({
                    command: 'updateKeyframe',
                    data: { ...selectedKeyframe, time }
                });
            }
        }

        function updateKeyframeValue() {
            if (selectedKeyframe) {
                const value = parseFloat(document.getElementById('keyframe-value').value);
                vscode.postMessage({
                    command: 'updateKeyframe',
                    data: { ...selectedKeyframe, value }
                });
            }
        }

        function addAnimation() {
            animations.push({
                property: 'Opacity',
                duration: 1,
                easing: 'EaseInOut',
                keyframes: []
            });
        }

        initRuler();

        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'keyframeAdded':
                    // Add keyframe to timeline
                    break;
            }
        });
    </script>
    <style>
        @keyframes fadeIn {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
        }
    </style>
</body>
</html>`;
    }

    private _addKeyframe(data: any) {
        this._animations.push(data);
        this._update();
    }

    private _updateKeyframe(data: any) {
        const index = this._animations.findIndex(a => a.id === data.id);
        if (index !== -1) {
            this._animations[index] = { ...this._animations[index], ...data };
            this._update();
        }
    }

    private _deleteKeyframe(data: any) {
        this._animations = this._animations.filter(a => a.id !== data.id);
        this._update();
    }

    private async _generateStoryboard(data: any) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('Please open a XAML file first.');
            return;
        }

        const storyboard = this._createStoryboardXaml(data.animations);
        const position = editor.selection.active;
        await editor.edit(editBuilder => {
            editBuilder.insert(position, storyboard);
        });

        vscode.window.showInformationMessage('Storyboard generated!');
    }

    private _createStoryboardXaml(animations: any[]): string {
        let xaml = `<Storyboard>\n`;
        for (const anim of animations) {
            xaml += `    <DoubleAnimation Storyboard.TargetProperty="Opacity"\n`;
            xaml += `                     From="0" To="1"\n`;
            xaml += `                     Duration="0:0:${anim.duration || 1}" />\n`;
        }
        xaml += `</Storyboard>`;
        return xaml;
    }

    private _previewAnimation(data: any) {
        // Preview animation in WebView
        this._panel.webview.postMessage({
            command: 'animate',
            data: data.animations
        });
    }
}
