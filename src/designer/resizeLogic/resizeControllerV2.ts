import { LayoutElement } from '../../preview/previewEngine';
import { SnappingEngine } from '../snapping/snappingEngine';
import { RulersManager } from '../rulers/rulersManager';

/**
 * Resize Options
 */
export interface ResizeOptions {
    maintainAspectRatio?: boolean;
    precise?: boolean; // Alt key - snap to pixels
    snapToGuides?: boolean;
    snapToElements?: boolean;
}

/**
 * Enhanced Resize Controller V2
 * Supports aspect ratio maintenance, precise resizing, and snapping
 */
export class ResizeControllerV2 {
    private _isResizing: boolean = false;
    private _resizeHandle: number = 0;
    private _selectedElement: LayoutElement | null = null;
    private _startWidth: number = 0;
    private _startHeight: number = 0;
    private _startX: number = 0;
    private _startY: number = 0;
    private _startAspectRatio: number = 1;
    private _allElements: LayoutElement[] = [];
    private _rulersManager: RulersManager;
    private _options: ResizeOptions = {};

    constructor(rulersManager: RulersManager) {
        this._rulersManager = rulersManager;
    }

    /**
     * Start resize operation
     */
    public startResize(
        element: LayoutElement,
        handle: number,
        startX: number,
        startY: number,
        allElements: LayoutElement[],
        options: ResizeOptions = {}
    ): void {
        this._isResizing = true;
        this._selectedElement = element;
        this._resizeHandle = handle;
        this._startX = startX;
        this._startY = startY;
        this._startWidth = element.bounds.width;
        this._startHeight = element.bounds.height;
        this._startAspectRatio = element.bounds.width / element.bounds.height;
        this._allElements = allElements;
        this._options = options;
    }

    /**
     * Update resize based on mouse position
     */
    public updateResize(
        currentX: number,
        currentY: number,
        shiftKey: boolean = false,
        altKey: boolean = false
    ): { x: number; y: number; width: number; height: number; guides: any[] } {
        if (!this._isResizing || !this._selectedElement) {
            return { x: 0, y: 0, width: 0, height: 0, guides: [] };
        }

        // Update options based on modifier keys
        const options = {
            ...this._options,
            maintainAspectRatio: shiftKey || this._options.maintainAspectRatio,
            precise: altKey || this._options.precise,
            snapToGuides: this._options.snapToGuides !== false,
            snapToElements: this._options.snapToElements !== false
        };

        const deltaX = currentX - this._startX;
        const deltaY = currentY - this._startY;

        let newWidth = this._startWidth;
        let newHeight = this._startHeight;
        let newX = this._selectedElement.bounds.x;
        let newY = this._selectedElement.bounds.y;

        // Calculate new dimensions based on handle
        if (this._resizeHandle & 4) { // Left
            newWidth = Math.max(10, this._startWidth - deltaX);
            newX = this._selectedElement.bounds.x + (this._startWidth - newWidth);
        } else if (this._resizeHandle & 8) { // Right
            newWidth = Math.max(10, this._startWidth + deltaX);
        }

        if (this._resizeHandle & 1) { // Top
            newHeight = Math.max(10, this._startHeight - deltaY);
            newY = this._selectedElement.bounds.y + (this._startHeight - newHeight);
        } else if (this._resizeHandle & 2) { // Bottom
            newHeight = Math.max(10, this._startHeight + deltaY);
        }

        // Maintain aspect ratio if Shift is pressed
        if (options.maintainAspectRatio) {
            if (this._resizeHandle & 4 || this._resizeHandle & 8) {
                // Horizontal resize - adjust height
                newHeight = newWidth / this._startAspectRatio;
                if (this._resizeHandle & 1) {
                    newY = this._selectedElement.bounds.y + (this._startHeight - newHeight);
                }
            } else if (this._resizeHandle & 1 || this._resizeHandle & 2) {
                // Vertical resize - adjust width
                newWidth = newHeight * this._startAspectRatio;
                if (this._resizeHandle & 4) {
                    newX = this._selectedElement.bounds.x + (this._startWidth - newWidth);
                }
            }
        }

        // Precise resizing (snap to pixels) if Alt is pressed
        if (options.precise) {
            newWidth = Math.round(newWidth);
            newHeight = Math.round(newHeight);
            newX = Math.round(newX);
            newY = Math.round(newY);
        }

        // Apply snapping
        let guides: any[] = [];
        if (options.snapToElements) {
            const snapResult = SnappingEngine.calculateSnappingForResize(
                this._selectedElement,
                this._allElements,
                this._resizeHandle,
                newWidth,
                newHeight,
                newX,
                newY
            );

            if (snapResult.snapped) {
                if (snapResult.snappedWidth !== undefined) {
                    newWidth = snapResult.snappedWidth;
                }
                if (snapResult.snappedHeight !== undefined) {
                    newHeight = snapResult.snappedHeight;
                }
                if (snapResult.snappedX !== undefined) {
                    newX = snapResult.snappedX;
                }
                if (snapResult.snappedY !== undefined) {
                    newY = snapResult.snappedY;
                }
                guides = snapResult.guides;
            }
        }

        // Snap to guides
        if (options.snapToGuides && this._rulersManager.isSnapToGuidesEnabled()) {
            // Snap X position (for left handle)
            if (this._resizeHandle & 4) {
                const snappedX = this._rulersManager.snapToGuides(newX, 'vertical', 5);
                if (snappedX !== null) {
                    newWidth = this._selectedElement.bounds.x + this._startWidth - snappedX;
                    newX = snappedX;
                }
            }

            // Snap width (for right handle)
            if (this._resizeHandle & 8) {
                const snappedRight = this._rulersManager.snapToGuides(newX + newWidth, 'vertical', 5);
                if (snappedRight !== null) {
                    newWidth = snappedRight - newX;
                }
            }

            // Snap Y position (for top handle)
            if (this._resizeHandle & 1) {
                const snappedY = this._rulersManager.snapToGuides(newY, 'horizontal', 5);
                if (snappedY !== null) {
                    newHeight = this._selectedElement.bounds.y + this._startHeight - snappedY;
                    newY = snappedY;
                }
            }

            // Snap height (for bottom handle)
            if (this._resizeHandle & 2) {
                const snappedBottom = this._rulersManager.snapToGuides(newY + newHeight, 'horizontal', 5);
                if (snappedBottom !== null) {
                    newHeight = snappedBottom - newY;
                }
            }
        }

        return {
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
            guides
        };
    }

    /**
     * End resize operation
     */
    public endResize(): void {
        if (this._isResizing) {
            this._isResizing = false;
            this._selectedElement = null;
            this._resizeHandle = 0;
            this._allElements = [];
        }
    }

    /**
     * Check if currently resizing
     */
    public isResizing(): boolean {
        return this._isResizing;
    }
}

