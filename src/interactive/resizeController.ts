import * as vscode from 'vscode';
import { LayoutElement } from '../preview/previewEngine';
import { TreeParser } from '../inspector/treeParser';

/**
 * Resize Handle Position
 */
export enum ResizeHandle {
    None = 0,
    Top = 1,
    Bottom = 2,
    Left = 4,
    Right = 8,
    TopLeft = Top | Left,
    TopRight = Top | Right,
    BottomLeft = Bottom | Left,
    BottomRight = Bottom | Right
}

/**
 * Resize Controller - Handles element resizing via drag handles
 * Updates Width and Height attributes in XAML
 */
export class ResizeController {
    private _isResizing: boolean = false;
    private _resizeHandle: ResizeHandle = ResizeHandle.None;
    private _selectedElement: LayoutElement | null = null;
    private _startWidth: number = 0;
    private _startHeight: number = 0;
    private _startX: number = 0;
    private _startY: number = 0;
    private _treeParser: TreeParser;
    private _xamlDocument: vscode.TextDocument | null = null;

    constructor(treeParser: TreeParser) {
        this._treeParser = treeParser;
    }

    /**
     * Start resize operation
     */
    public startResize(
        element: LayoutElement,
        handle: ResizeHandle,
        startX: number,
        startY: number
    ): void {
        this._isResizing = true;
        this._selectedElement = element;
        this._resizeHandle = handle;
        this._startX = startX;
        this._startY = startY;
        this._startWidth = element.bounds.width;
        this._startHeight = element.bounds.height;
    }

    /**
     * Update resize based on mouse position
     */
    public updateResize(currentX: number, currentY: number): void {
        if (!this._isResizing || !this._selectedElement) {
            return;
        }

        const deltaX = currentX - this._startX;
        const deltaY = currentY - this._startY;

        let newWidth = this._startWidth;
        let newHeight = this._startHeight;

        // Calculate new dimensions based on handle
        if (this._resizeHandle & ResizeHandle.Left) {
            newWidth = Math.max(10, this._startWidth - deltaX);
        } else if (this._resizeHandle & ResizeHandle.Right) {
            newWidth = Math.max(10, this._startWidth + deltaX);
        }

        if (this._resizeHandle & ResizeHandle.Top) {
            newHeight = Math.max(10, this._startHeight - deltaY);
        } else if (this._resizeHandle & ResizeHandle.Bottom) {
            newHeight = Math.max(10, this._startHeight + deltaY);
        }

        // Update element size in XAML
        this._updateElementSize(this._selectedElement, newWidth, newHeight);
    }

    /**
     * End resize operation
     */
    public endResize(): void {
        if (this._isResizing) {
            this._isResizing = false;
            this._selectedElement = null;
            this._resizeHandle = ResizeHandle.None;
        }
    }

    /**
     * Check if currently resizing
     */
    public isResizing(): boolean {
        return this._isResizing;
    }

    /**
     * Detect which resize handle was clicked
     */
    public detectHandle(
        element: LayoutElement,
        clickX: number,
        clickY: number,
        handleSize: number = 8
    ): ResizeHandle {
        const bounds = element.bounds;
        const handleHalfSize = handleSize / 2;

        // Check corners first (they take precedence)
        if (this._isPointInHandle(clickX, clickY, bounds.x, bounds.y, handleHalfSize)) {
            return ResizeHandle.TopLeft;
        }
        if (this._isPointInHandle(clickX, clickY, bounds.x + bounds.width, bounds.y, handleHalfSize)) {
            return ResizeHandle.TopRight;
        }
        if (this._isPointInHandle(clickX, clickY, bounds.x, bounds.y + bounds.height, handleHalfSize)) {
            return ResizeHandle.BottomLeft;
        }
        if (this._isPointInHandle(clickX, clickY, bounds.x + bounds.width, bounds.y + bounds.height, handleHalfSize)) {
            return ResizeHandle.BottomRight;
        }

        // Check edges
        if (Math.abs(clickX - bounds.x) < handleHalfSize && 
            clickY >= bounds.y && clickY <= bounds.y + bounds.height) {
            return ResizeHandle.Left;
        }
        if (Math.abs(clickX - (bounds.x + bounds.width)) < handleHalfSize && 
            clickY >= bounds.y && clickY <= bounds.y + bounds.height) {
            return ResizeHandle.Right;
        }
        if (Math.abs(clickY - bounds.y) < handleHalfSize && 
            clickX >= bounds.x && clickX <= bounds.x + bounds.width) {
            return ResizeHandle.Top;
        }
        if (Math.abs(clickY - (bounds.y + bounds.height)) < handleHalfSize && 
            clickX >= bounds.x && clickX <= bounds.x + bounds.width) {
            return ResizeHandle.Bottom;
        }

        return ResizeHandle.None;
    }

    /**
     * Check if point is within handle bounds
     */
    private _isPointInHandle(
        pointX: number,
        pointY: number,
        handleX: number,
        handleY: number,
        handleSize: number
    ): boolean {
        return Math.abs(pointX - handleX) < handleSize && Math.abs(pointY - handleY) < handleSize;
    }

    /**
     * Get handle positions for rendering
     */
    public getHandlePositions(element: LayoutElement): Array<{ x: number; y: number; handle: ResizeHandle }> {
        const bounds = element.bounds;
        return [
            { x: bounds.x, y: bounds.y, handle: ResizeHandle.TopLeft },
            { x: bounds.x + bounds.width, y: bounds.y, handle: ResizeHandle.TopRight },
            { x: bounds.x, y: bounds.y + bounds.height, handle: ResizeHandle.BottomLeft },
            { x: bounds.x + bounds.width, y: bounds.y + bounds.height, handle: ResizeHandle.BottomRight },
            { x: bounds.x, y: bounds.y + bounds.height / 2, handle: ResizeHandle.Left },
            { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2, handle: ResizeHandle.Right },
            { x: bounds.x + bounds.width / 2, y: bounds.y, handle: ResizeHandle.Top },
            { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height, handle: ResizeHandle.Bottom }
        ];
    }

    /**
     * Update element size in XAML
     */
    private async _updateElementSize(
        element: LayoutElement,
        newWidth: number,
        newHeight: number
    ): Promise<void> {
        if (!this._xamlDocument) {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.fileName.endsWith('.xaml')) {
                this._xamlDocument = editor.document;
            } else {
                return;
            }
        }

        const editor = await vscode.window.showTextDocument(this._xamlDocument);
        const xaml = this._xamlDocument.getText();
        const elementRegex = this._buildElementRegex(element);

        if (!elementRegex) {
            return;
        }

        const lines = xaml.split('\n');
        let elementLineIndex = -1;

        for (let i = 0; i < lines.length; i++) {
            if (elementRegex.test(lines[i])) {
                elementLineIndex = i;
                break;
            }
        }

        if (elementLineIndex === -1) {
            return;
        }

        const line = lines[elementLineIndex];
        let updatedLine = line;

        // Update Width
        if (line.includes('Width=')) {
            updatedLine = updatedLine.replace(/Width="[^"]*"/, `Width="${newWidth}"`);
        } else {
            updatedLine = updatedLine.replace(/(\s*)(\/?>)/, `$1Width="${newWidth}" $2`);
        }

        // Update Height
        if (line.includes('Height=')) {
            updatedLine = updatedLine.replace(/Height="[^"]*"/, `Height="${newHeight}"`);
        } else {
            updatedLine = updatedLine.replace(/(\s*)(\/?>)/, `$1Height="${newHeight}" $2`);
        }

        const edit = new vscode.WorkspaceEdit();
        const range = new vscode.Range(
            new vscode.Position(elementLineIndex, 0),
            new vscode.Position(elementLineIndex, line.length)
        );
        edit.replace(this._xamlDocument.uri, range, updatedLine);
        await vscode.workspace.applyEdit(edit);
    }

    /**
     * Build regex to find element in XAML
     */
    private _buildElementRegex(element: LayoutElement): RegExp | null {
        if (element.name) {
            return new RegExp(`x:Name="${element.name}"|Name="${element.name}"`);
        }
        return new RegExp(`<${element.type}[^>]*>`, 'i');
    }

    /**
     * Set XAML document for editing
     */
    public setXamlDocument(document: vscode.TextDocument): void {
        this._xamlDocument = document;
    }
}

