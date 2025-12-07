import * as vscode from 'vscode';
import { LayoutElement } from '../preview/previewEngine';
import { TreeParser } from '../inspector/treeParser';
import { XamlParser } from '../utils/XamlParser';

/**
 * Drag Controller - Handles drag and drop repositioning of elements
 * Updates XAML attributes (Margin, Grid.Row/Column, Canvas.Left/Top)
 */
export class DragController {
    private _isDragging: boolean = false;
    private _dragStartX: number = 0;
    private _dragStartY: number = 0;
    private _selectedElement: LayoutElement | null = null;
    private _treeParser: TreeParser;
    private _xamlDocument: vscode.TextDocument | null = null;

    constructor(treeParser: TreeParser) {
        this._treeParser = treeParser;
    }

    /**
     * Start drag operation
     */
    public startDrag(element: LayoutElement, startX: number, startY: number): void {
        this._isDragging = true;
        this._selectedElement = element;
        this._dragStartX = startX;
        this._dragStartY = startY;
    }

    /**
     * Update drag position
     */
    public updateDrag(currentX: number, currentY: number): void {
        if (!this._isDragging || !this._selectedElement) {
            return;
        }

        const deltaX = currentX - this._dragStartX;
        const deltaY = currentY - this._dragStartY;

        // Calculate new position
        const newX = this._selectedElement.bounds.x + deltaX;
        const newY = this._selectedElement.bounds.y + deltaY;

        // Update element position in XAML
        this._updateElementPosition(this._selectedElement, newX, newY);
    }

    /**
     * End drag operation
     */
    public endDrag(): void {
        if (this._isDragging) {
            this._isDragging = false;
            this._selectedElement = null;
        }
    }

    /**
     * Check if currently dragging
     */
    public isDragging(): boolean {
        return this._isDragging;
    }

    /**
     * Update element position in XAML based on layout type
     */
    private async _updateElementPosition(element: LayoutElement, newX: number, newY: number): Promise<void> {
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

        // Determine layout container type
        const parent = this._treeParser.findParent(element.id);
        if (!parent) {
            return;
        }

        // Check if parent is Grid
        if (parent.type === 'Grid') {
            await this._updateGridPosition(editor, element, newX, newY, xaml);
        }
        // Check if parent is Canvas
        else if (parent.type === 'Canvas') {
            await this._updateCanvasPosition(editor, element, newX, newY, xaml);
        }
        // Otherwise, update Margin
        else {
            await this._updateMargin(editor, element, newX, newY, xaml);
        }
    }

    /**
     * Update position in Grid (snap to nearest cell)
     */
    private async _updateGridPosition(
        editor: vscode.TextEditor,
        element: LayoutElement,
        newX: number,
        newY: number,
        xaml: string
    ): Promise<void> {
        // Find element in XAML by name or type
        const elementRegex = this._buildElementRegex(element);
        if (!elementRegex) {
            return;
        }

        // Calculate grid cell based on position
        // This is a simplified version - in production, you'd parse Grid definitions
        const cellSize = 50; // Default cell size
        const gridRow = Math.floor(newY / cellSize);
        const gridColumn = Math.floor(newX / cellSize);

        // Find the element tag in XAML
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

        // Update Grid.Row and Grid.Column attributes
        const line = lines[elementLineIndex];
        let updatedLine = line;

        // Add or update Grid.Row
        if (line.includes('Grid.Row')) {
            updatedLine = updatedLine.replace(/Grid\.Row="[^"]*"/, `Grid.Row="${gridRow}"`);
        } else {
            // Insert before closing tag
            updatedLine = updatedLine.replace(/(\s*)(\/?>)/, `$1Grid.Row="${gridRow}" $2`);
        }

        // Add or update Grid.Column
        if (line.includes('Grid.Column')) {
            updatedLine = updatedLine.replace(/Grid\.Column="[^"]*"/, `Grid.Column="${gridColumn}"`);
        } else {
            updatedLine = updatedLine.replace(/(\s*)(\/?>)/, `$1Grid.Column="${gridColumn}" $2`);
        }

        // Apply edit
        const edit = new vscode.WorkspaceEdit();
        const range = new vscode.Range(
            new vscode.Position(elementLineIndex, 0),
            new vscode.Position(elementLineIndex, line.length)
        );
        edit.replace(this._xamlDocument!.uri, range, updatedLine);
        await vscode.workspace.applyEdit(edit);
    }

    /**
     * Update position in Canvas
     */
    private async _updateCanvasPosition(
        editor: vscode.TextEditor,
        element: LayoutElement,
        newX: number,
        newY: number,
        xaml: string
    ): Promise<void> {
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

        // Update Canvas.Left
        if (line.includes('Canvas.Left')) {
            updatedLine = updatedLine.replace(/Canvas\.Left="[^"]*"/, `Canvas.Left="${newX}"`);
        } else {
            updatedLine = updatedLine.replace(/(\s*)(\/?>)/, `$1Canvas.Left="${newX}" $2`);
        }

        // Update Canvas.Top
        if (line.includes('Canvas.Top')) {
            updatedLine = updatedLine.replace(/Canvas\.Top="[^"]*"/, `Canvas.Top="${newY}"`);
        } else {
            updatedLine = updatedLine.replace(/(\s*)(\/?>)/, `$1Canvas.Top="${newY}" $2`);
        }

        const edit = new vscode.WorkspaceEdit();
        const range = new vscode.Range(
            new vscode.Position(elementLineIndex, 0),
            new vscode.Position(elementLineIndex, line.length)
        );
        edit.replace(this._xamlDocument!.uri, range, updatedLine);
        await vscode.workspace.applyEdit(edit);
    }

    /**
     * Update Margin attribute
     */
    private async _updateMargin(
        editor: vscode.TextEditor,
        element: LayoutElement,
        newX: number,
        newY: number,
        xaml: string
    ): Promise<void> {
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
        const margin = `${newY},${newX},0,0`; // Top, Left, Bottom, Right

        let updatedLine = line;
        if (line.includes('Margin=')) {
            updatedLine = updatedLine.replace(/Margin="[^"]*"/, `Margin="${margin}"`);
        } else {
            updatedLine = updatedLine.replace(/(\s*)(\/?>)/, `$1Margin="${margin}" $2`);
        }

        const edit = new vscode.WorkspaceEdit();
        const range = new vscode.Range(
            new vscode.Position(elementLineIndex, 0),
            new vscode.Position(elementLineIndex, line.length)
        );
        edit.replace(this._xamlDocument!.uri, range, updatedLine);
        await vscode.workspace.applyEdit(edit);
    }

    /**
     * Build regex to find element in XAML
     */
    private _buildElementRegex(element: LayoutElement): RegExp | null {
        if (element.name) {
            return new RegExp(`x:Name="${element.name}"|Name="${element.name}"`);
        }
        // Fallback to type
        return new RegExp(`<${element.type}[^>]*>`, 'i');
    }

    /**
     * Set XAML document for editing
     */
    public setXamlDocument(document: vscode.TextDocument): void {
        this._xamlDocument = document;
    }
}

