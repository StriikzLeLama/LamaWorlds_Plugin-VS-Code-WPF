import { LayoutElement } from '../preview/previewEngine';

/**
 * Highlight Manager - Manages visual highlighting of selected elements
 * Provides data for HTML overlay rendering
 */
export class HighlightManager {
    private _selectedElement: LayoutElement | null = null;
    private _highlightedElements: Set<string> = new Set();

    /**
     * Select an element for highlighting
     */
    public selectElement(element: LayoutElement | null): void {
        this._selectedElement = element;
        this._highlightedElements.clear();
        if (element) {
            this._highlightedElements.add(element.id);
        }
    }

    /**
     * Get currently selected element
     */
    public getSelectedElement(): LayoutElement | null {
        return this._selectedElement;
    }

    /**
     * Add element to highlight set
     */
    public addHighlight(elementId: string): void {
        this._highlightedElements.add(elementId);
    }

    /**
     * Remove element from highlight set
     */
    public removeHighlight(elementId: string): void {
        this._highlightedElements.delete(elementId);
    }

    /**
     * Clear all highlights
     */
    public clearHighlights(): void {
        this._highlightedElements.clear();
        this._selectedElement = null;
    }

    /**
     * Check if element is highlighted
     */
    public isHighlighted(elementId: string): boolean {
        return this._highlightedElements.has(elementId);
    }

    /**
     * Get highlight data for rendering
     */
    public getHighlightData(): HighlightData | null {
        if (!this._selectedElement) {
            return null;
        }

        return {
            elementId: this._selectedElement.id,
            bounds: this._selectedElement.bounds,
            type: this._selectedElement.type,
            name: this._selectedElement.name
        };
    }

    /**
     * Get all highlighted element IDs
     */
    public getHighlightedIds(): string[] {
        return Array.from(this._highlightedElements);
    }
}

/**
 * Highlight data for rendering
 */
export interface HighlightData {
    elementId: string;
    bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    type: string;
    name: string;
}

