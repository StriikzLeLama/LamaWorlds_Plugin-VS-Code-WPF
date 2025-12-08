import * as vscode from 'vscode';
import { LayoutElement } from '../../preview/previewEngine';
import { TreeParser } from '../../inspector/treeParser';

/**
 * Grid Layout Suggestion
 */
export interface GridSuggestion {
    rows: number;
    columns: number;
    rowDefinitions: string[]; // e.g., ["Auto", "1*", "Auto"]
    columnDefinitions: string[]; // e.g., ["Auto", "1*", "Auto"]
    placements: Array<{
        elementId: string;
        row: number;
        column: number;
        rowSpan?: number;
        columnSpan?: number;
    }>;
}

/**
 * Auto-Grid Generator - Suggests and generates Grid layouts for selected elements
 */
export class GridGenerator {
    private _treeParser: TreeParser;

    constructor(treeParser: TreeParser) {
        this._treeParser = treeParser;
    }

    /**
     * Analyze selected elements and suggest a Grid layout
     */
    public suggestGridLayout(elements: LayoutElement[]): GridSuggestion | null {
        if (elements.length === 0) {
            return null;
        }

        // Analyze element positions to determine grid structure
        const analysis = this._analyzeElementPositions(elements);
        
        if (!analysis) {
            return null;
        }

        // Generate row and column definitions
        const rowDefinitions = this._generateRowDefinitions(analysis.rows);
        const columnDefinitions = this._generateColumnDefinitions(analysis.columns);

        // Assign elements to grid cells
        const placements = this._assignElementsToCells(elements, analysis);

        return {
            rows: analysis.rows.length,
            columns: analysis.columns.length,
            rowDefinitions,
            columnDefinitions,
            placements
        };
    }

    /**
     * Apply Grid layout to XAML
     */
    public async applyGridLayout(
        document: vscode.TextDocument,
        suggestion: GridSuggestion,
        elements: LayoutElement[]
    ): Promise<void> {
        const editor = await vscode.window.showTextDocument(document);
        const xaml = document.getText();
        const edit = new vscode.WorkspaceEdit();

        // Find the parent container that contains all selected elements
        const parentContainer = this._findCommonParent(elements);
        if (!parentContainer) {
            vscode.window.showErrorMessage('Could not find common parent container');
            return;
        }

        // Parse XAML to find parent element
        const lines = xaml.split('\n');
        let parentStartLine = -1;
        let parentEndLine = -1;
        let indentLevel = 0;

        // Find parent element
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes(`<${parentContainer.type}`) && !line.includes('</')) {
                parentStartLine = i;
                indentLevel = this._getIndentLevel(line);
                break;
            }
        }

        if (parentStartLine === -1) {
            vscode.window.showErrorMessage('Could not find parent element in XAML');
            return;
        }

        // Find parent end
        let currentIndent = indentLevel;
        for (let i = parentStartLine + 1; i < lines.length; i++) {
            const line = lines[i];
            const lineIndent = this._getIndentLevel(line);
            
            if (lineIndent <= indentLevel && line.trim().startsWith('</')) {
                parentEndLine = i;
                break;
            }
        }

        if (parentEndLine === -1) {
            parentEndLine = lines.length;
        }

        // Build new Grid XAML
        const indent = ' '.repeat(indentLevel + 4);
        const gridLines: string[] = [
            `<Grid>`,
            `${indent}<Grid.RowDefinitions>`
        ];

        // Add row definitions
        for (const rowDef of suggestion.rowDefinitions) {
            gridLines.push(`${indent}    <RowDefinition Height="${rowDef}"/>`);
        }
        gridLines.push(`${indent}</Grid.RowDefinitions>`);
        gridLines.push(`${indent}<Grid.ColumnDefinitions>`);

        // Add column definitions
        for (const colDef of suggestion.columnDefinitions) {
            gridLines.push(`${indent}    <ColumnDefinition Width="${colDef}"/>`);
        }
        gridLines.push(`${indent}</Grid.ColumnDefinitions>`);

        // Add elements with Grid.Row and Grid.Column
        for (const placement of suggestion.placements) {
            const element = elements.find(e => e.id === placement.elementId);
            if (!element) continue;

            // Find element's current XAML
            const elementLine = this._findElementLine(lines, element);
            if (elementLine === -1) continue;

            let elementXaml = lines[elementLine];
            
            // Add Grid.Row
            if (elementXaml.includes('Grid.Row')) {
                elementXaml = elementXaml.replace(/Grid\.Row="[^"]*"/, `Grid.Row="${placement.row}"`);
            } else {
                elementXaml = elementXaml.replace(/(\s*)(\/?>)/, `$1Grid.Row="${placement.row}" $2`);
            }

            // Add Grid.Column
            if (elementXaml.includes('Grid.Column')) {
                elementXaml = elementXaml.replace(/Grid\.Column="[^"]*"/, `Grid.Column="${placement.column}"`);
            } else {
                elementXaml = elementXaml.replace(/(\s*)(\/?>)/, `$1Grid.Column="${placement.column}" $2`);
            }

            // Add spans if needed
            if (placement.rowSpan && placement.rowSpan > 1) {
                if (elementXaml.includes('Grid.RowSpan')) {
                    elementXaml = elementXaml.replace(/Grid\.RowSpan="[^"]*"/, `Grid.RowSpan="${placement.rowSpan}"`);
                } else {
                    elementXaml = elementXaml.replace(/(\s*)(\/?>)/, `$1Grid.RowSpan="${placement.rowSpan}" $2`);
                }
            }

            if (placement.columnSpan && placement.columnSpan > 1) {
                if (elementXaml.includes('Grid.ColumnSpan')) {
                    elementXaml = elementXaml.replace(/Grid\.ColumnSpan="[^"]*"/, `Grid.ColumnSpan="${placement.columnSpan}"`);
                } else {
                    elementXaml = elementXaml.replace(/(\s*)(\/?>)/, `$1Grid.ColumnSpan="${placement.columnSpan}" $2`);
                }
            }

            gridLines.push(elementXaml.trim());
        }

        gridLines.push(`</Grid>`);

        // Replace parent container with Grid
        const replacementText = gridLines.join('\n' + indent);
        
        // Replace parent element content
        const range = new vscode.Range(
            new vscode.Position(parentStartLine + 1, 0),
            new vscode.Position(parentEndLine, 0)
        );
        
        edit.replace(document.uri, range, replacementText + '\n');
        await vscode.workspace.applyEdit(edit);
    }

    /**
     * Analyze element positions to determine grid structure
     */
    private _analyzeElementPositions(elements: LayoutElement[]): {
        rows: number[];
        columns: number[];
        cellMap: Map<string, { row: number; col: number }>;
    } | null {
        if (elements.length === 0) {
            return null;
        }

        // Extract unique X and Y positions
        const xPositions = new Set<number>();
        const yPositions = new Set<number>();

        for (const element of elements) {
            xPositions.add(element.bounds.x);
            xPositions.add(element.bounds.x + element.bounds.width);
            yPositions.add(element.bounds.y);
            yPositions.add(element.bounds.y + element.bounds.height);
        }

        // Sort positions
        const sortedX = Array.from(xPositions).sort((a, b) => a - b);
        const sortedY = Array.from(yPositions).sort((a, b) => a - b);

        // Determine grid cells (merge very close positions)
        const columns = this._mergeClosePositions(sortedX, 5);
        const rows = this._mergeClosePositions(sortedY, 5);

        // Map elements to cells
        const cellMap = new Map<string, { row: number; col: number }>();

        for (const element of elements) {
            const centerX = element.bounds.x + element.bounds.width / 2;
            const centerY = element.bounds.y + element.bounds.height / 2;

            const col = this._findCellIndex(centerX, columns);
            const row = this._findCellIndex(centerY, rows);

            cellMap.set(element.id, { row, col });
        }

        return {
            rows,
            columns,
            cellMap
        };
    }

    /**
     * Merge positions that are very close together
     */
    private _mergeClosePositions(positions: number[], threshold: number): number[] {
        if (positions.length === 0) return [];
        
        const merged: number[] = [positions[0]];

        for (let i = 1; i < positions.length; i++) {
            const last = merged[merged.length - 1];
            if (positions[i] - last > threshold) {
                merged.push(positions[i]);
            }
        }

        return merged;
    }

    /**
     * Find which cell index a position belongs to
     */
    private _findCellIndex(position: number, cells: number[]): number {
        for (let i = 0; i < cells.length - 1; i++) {
            if (position >= cells[i] && position < cells[i + 1]) {
                return i;
            }
        }
        return Math.max(0, cells.length - 2);
    }

    /**
     * Generate row definitions based on row heights
     */
    private _generateRowDefinitions(rows: number[]): string[] {
        if (rows.length < 2) return ['*'];
        
        const definitions: string[] = [];
        for (let i = 0; i < rows.length - 1; i++) {
            const height = rows[i + 1] - rows[i];
            // Use Auto for small rows, * for flexible
            if (height < 50) {
                definitions.push('Auto');
            } else {
                definitions.push('*');
            }
        }
        
        return definitions.length > 0 ? definitions : ['*'];
    }

    /**
     * Generate column definitions based on column widths
     */
    private _generateColumnDefinitions(columns: number[]): string[] {
        if (columns.length < 2) return ['*'];
        
        const definitions: string[] = [];
        for (let i = 0; i < columns.length - 1; i++) {
            const width = columns[i + 1] - columns[i];
            if (width < 50) {
                definitions.push('Auto');
            } else {
                definitions.push('*');
            }
        }
        
        return definitions.length > 0 ? definitions : ['*'];
    }

    /**
     * Assign elements to grid cells
     */
    private _assignElementsToCells(
        elements: LayoutElement[],
        analysis: { rows: number[]; columns: number[]; cellMap: Map<string, { row: number; col: number }> }
    ): Array<{ elementId: string; row: number; column: number; rowSpan?: number; columnSpan?: number }> {
        const placements: Array<{ elementId: string; row: number; column: number; rowSpan?: number; columnSpan?: number }> = [];

        for (const element of elements) {
            const cell = analysis.cellMap.get(element.id);
            if (!cell) continue;

            // Calculate spans if element spans multiple cells
            const elementRight = element.bounds.x + element.bounds.width;
            const elementBottom = element.bounds.y + element.bounds.height;

            let columnSpan = 1;
            for (let col = cell.col + 1; col < analysis.columns.length - 1; col++) {
                if (elementRight > analysis.columns[col]) {
                    columnSpan++;
                } else {
                    break;
                }
            }

            let rowSpan = 1;
            for (let row = cell.row + 1; row < analysis.rows.length - 1; row++) {
                if (elementBottom > analysis.rows[row]) {
                    rowSpan++;
                } else {
                    break;
                }
            }

            placements.push({
                elementId: element.id,
                row: cell.row,
                column: cell.col,
                rowSpan: rowSpan > 1 ? rowSpan : undefined,
                columnSpan: columnSpan > 1 ? columnSpan : undefined
            });
        }

        return placements;
    }

    /**
     * Find common parent container of elements
     */
    private _findCommonParent(elements: LayoutElement[]): LayoutElement | null {
        if (elements.length === 0) return null;
        if (elements.length === 1) return this._treeParser.findParent(elements[0].id);

        // Find common ancestor
        let commonParent = this._treeParser.findParent(elements[0].id);
        for (let i = 1; i < elements.length && commonParent; i++) {
            const parent = this._treeParser.findParent(elements[i].id);
            // Simplified: assume first common parent found
            if (parent && parent.type !== commonParent?.type) {
                commonParent = parent;
            }
        }

        return commonParent;
    }

    /**
     * Get indent level of a line
     */
    private _getIndentLevel(line: string): number {
        let indent = 0;
        for (let i = 0; i < line.length; i++) {
            if (line[i] === ' ') {
                indent++;
            } else {
                break;
            }
        }
        return indent;
    }

    /**
     * Find line number of element in XAML
     */
    private _findElementLine(lines: string[], element: LayoutElement): number {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (element.name && (line.includes(`x:Name="${element.name}"`) || line.includes(`Name="${element.name}"`))) {
                return i;
            }
            if (line.includes(`<${element.type}`) && !line.includes('</')) {
                return i;
            }
        }
        return -1;
    }
}

