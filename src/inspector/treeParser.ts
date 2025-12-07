import { LayoutElement, Bounds } from '../preview/previewEngine';

/**
 * Visual Tree Parser - Parses XAML and builds element hierarchy with IDs
 * Maps element bounds to IDs for hit testing
 */
export class TreeParser {
    private _elementMap: Map<string, LayoutElement> = new Map();
    private _coordinateMap: Map<string, string> = new Map(); // "x,y" -> elementId
    private _rootElement: LayoutElement | null = null;

    /**
     * Parse layout map from renderer and build coordinate lookup
     */
    public parseLayoutMap(layoutMap: LayoutElement): void {
        this._elementMap.clear();
        this._coordinateMap.clear();
        this._rootElement = layoutMap;

        this._buildElementMap(layoutMap);
        this._buildCoordinateMap(layoutMap);
    }

    /**
     * Recursively build element map
     */
    private _buildElementMap(element: LayoutElement): void {
        this._elementMap.set(element.id, element);

        if (element.children) {
            for (const child of element.children) {
                this._buildElementMap(child);
            }
        }
    }

    /**
     * Build coordinate-to-element mapping for hit testing
     */
    private _buildCoordinateMap(element: LayoutElement): void {
        const bounds = element.bounds;
        
        // Map all pixels within bounds to this element
        // Use a grid approach for efficiency (sample every 5 pixels)
        const step = 5;
        for (let y = bounds.y; y < bounds.y + bounds.height; y += step) {
            for (let x = bounds.x; x < bounds.x + bounds.width; x += step) {
                const key = `${x},${y}`;
                
                // Only set if not already set (child elements take precedence)
                if (!this._coordinateMap.has(key)) {
                    this._coordinateMap.set(key, element.id);
                }
            }
        }

        // Process children (they will overwrite parent coordinates)
        if (element.children) {
            for (const child of element.children) {
                this._buildCoordinateMap(child);
            }
        }
    }

    /**
     * Find element at given coordinates
     */
    public findElementAt(x: number, y: number): LayoutElement | null {
        // Try exact match first
        const key = `${Math.floor(x)},${Math.floor(y)}`;
        let elementId = this._coordinateMap.get(key);

        // If not found, try nearby coordinates
        if (!elementId) {
            const searchRadius = 10;
            for (let dy = -searchRadius; dy <= searchRadius && !elementId; dy++) {
                for (let dx = -searchRadius; dx <= searchRadius && !elementId; dx++) {
                    const testKey = `${Math.floor(x + dx)},${Math.floor(y + dy)}`;
                    elementId = this._coordinateMap.get(testKey);
                }
            }
        }

        // Fallback: check all elements for bounds containment
        if (!elementId) {
            for (const [id, element] of this._elementMap) {
                const bounds = element.bounds;
                if (x >= bounds.x && x < bounds.x + bounds.width &&
                    y >= bounds.y && y < bounds.y + bounds.height) {
                    elementId = id;
                    break;
                }
            }
        }

        return elementId ? this._elementMap.get(elementId) || null : null;
    }

    /**
     * Get element by ID
     */
    public getElementById(id: string): LayoutElement | null {
        return this._elementMap.get(id) || null;
    }

    /**
     * Get root element
     */
    public getRootElement(): LayoutElement | null {
        return this._rootElement;
    }

    /**
     * Get all elements
     */
    public getAllElements(): LayoutElement[] {
        return Array.from(this._elementMap.values());
    }

    /**
     * Get element hierarchy as tree structure
     */
    public getTreeStructure(): TreeElement | null {
        if (!this._rootElement) {
            return null;
        }

        return this._buildTreeStructure(this._rootElement);
    }

    /**
     * Build tree structure from layout element
     */
    private _buildTreeStructure(element: LayoutElement): TreeElement {
        const treeElement: TreeElement = {
            id: element.id,
            type: element.type,
            name: element.name || '',
            bounds: element.bounds,
            children: []
        };

        if (element.children) {
            for (const child of element.children) {
                treeElement.children.push(this._buildTreeStructure(child));
            }
        }

        return treeElement;
    }

    /**
     * Find parent element
     */
    public findParent(elementId: string): LayoutElement | null {
        const element = this._elementMap.get(elementId);
        if (!element || !element.parentId) {
            return null;
        }

        return this._elementMap.get(element.parentId) || null;
    }

    /**
     * Find all children of an element
     */
    public findChildren(elementId: string): LayoutElement[] {
        const element = this._elementMap.get(elementId);
        if (!element || !element.children) {
            return [];
        }

        return element.children;
    }

    /**
     * Clear all parsed data
     */
    public clear(): void {
        this._elementMap.clear();
        this._coordinateMap.clear();
        this._rootElement = null;
    }
}

/**
 * Tree element structure for UI display
 */
export interface TreeElement {
    id: string;
    type: string;
    name: string;
    bounds: Bounds;
    children: TreeElement[];
}

