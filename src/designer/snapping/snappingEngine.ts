import { LayoutElement } from '../../preview/previewEngine';

/**
 * Snapping Guide - Represents a visual guide line
 */
export interface SnappingGuide {
    type: 'vertical' | 'horizontal' | 'center-vertical' | 'center-horizontal';
    position: number;
    distance?: number; // Distance indicator (px)
    elementIds?: string[]; // Elements this guide snaps to
}

/**
 * Snapping Result - Contains snapping information
 */
export interface SnappingResult {
    snapped: boolean;
    guides: SnappingGuide[];
    snappedX?: number;
    snappedY?: number;
    snappedWidth?: number;
    snappedHeight?: number;
}

/**
 * Snapping Engine - Handles Figma-like smart snapping
 * Supports snapping to edges, center lines, baselines, and spacing indicators
 */
export class SnappingEngine {
    private static readonly SNAP_THRESHOLD = 5; // pixels
    private static readonly SPACING_THRESHOLD = 3; // pixels for spacing detection

    /**
     * Calculate snapping guides and positions for an element being dragged
     */
    public static calculateSnappingForDrag(
        draggedElement: LayoutElement,
        allElements: LayoutElement[],
        currentX: number,
        currentY: number
    ): SnappingResult {
        const guides: SnappingGuide[] = [];
        let snappedX = currentX;
        let snappedY = currentY;
        let hasSnap = false;

        // Calculate element bounds at current position
        const newBounds = {
            x: currentX,
            y: currentY,
            width: draggedElement.bounds.width,
            height: draggedElement.bounds.height,
            centerX: currentX + draggedElement.bounds.width / 2,
            centerY: currentY + draggedElement.bounds.height / 2
        };

        // Get all other elements (excluding the dragged one)
        const otherElements = allElements.filter(e => e.id !== draggedElement.id);

        // Check snapping to edges and centers
        for (const element of otherElements) {
            const bounds = element.bounds;
            const elementCenterX = bounds.x + bounds.width / 2;
            const elementCenterY = bounds.y + bounds.height / 2;

            // Vertical snap points (left edge, center, right edge)
            const verticalSnapPoints = [
                { pos: bounds.x, label: 'left' },
                { pos: elementCenterX, label: 'center' },
                { pos: bounds.x + bounds.width, label: 'right' }
            ];

            // Horizontal snap points (top edge, center, bottom edge)
            const horizontalSnapPoints = [
                { pos: bounds.y, label: 'top' },
                { pos: elementCenterY, label: 'center' },
                { pos: bounds.y + bounds.height, label: 'bottom' }
            ];

            // Check vertical snapping (element's left/right/center to other element's left/right/center)
            for (const snapPoint of verticalSnapPoints) {
                // Snap left edge
                const distToLeft = Math.abs(newBounds.x - snapPoint.pos);
                if (distToLeft < this.SNAP_THRESHOLD) {
                    snappedX = snapPoint.pos;
                    hasSnap = true;
                    guides.push({
                        type: 'vertical',
                        position: snapPoint.pos,
                        elementIds: [element.id]
                    });
                }

                // Snap right edge
                const distToRight = Math.abs(newBounds.x + newBounds.width - snapPoint.pos);
                if (distToRight < this.SNAP_THRESHOLD) {
                    snappedX = snapPoint.pos - newBounds.width;
                    hasSnap = true;
                    guides.push({
                        type: 'vertical',
                        position: snapPoint.pos,
                        elementIds: [element.id]
                    });
                }

                // Snap center
                const distToCenter = Math.abs(newBounds.centerX - snapPoint.pos);
                if (distToCenter < this.SNAP_THRESHOLD) {
                    snappedX = snapPoint.pos - newBounds.width / 2;
                    hasSnap = true;
                    guides.push({
                        type: 'center-vertical',
                        position: snapPoint.pos,
                        elementIds: [element.id]
                    });
                }
            }

            // Check horizontal snapping
            for (const snapPoint of horizontalSnapPoints) {
                // Snap top edge
                const distToTop = Math.abs(newBounds.y - snapPoint.pos);
                if (distToTop < this.SNAP_THRESHOLD) {
                    snappedY = snapPoint.pos;
                    hasSnap = true;
                    guides.push({
                        type: 'horizontal',
                        position: snapPoint.pos,
                        elementIds: [element.id]
                    });
                }

                // Snap bottom edge
                const distToBottom = Math.abs(newBounds.y + newBounds.height - snapPoint.pos);
                if (distToBottom < this.SNAP_THRESHOLD) {
                    snappedY = snapPoint.pos - newBounds.height;
                    hasSnap = true;
                    guides.push({
                        type: 'horizontal',
                        position: snapPoint.pos,
                        elementIds: [element.id]
                    });
                }

                // Snap center
                const distToCenter = Math.abs(newBounds.centerY - snapPoint.pos);
                if (distToCenter < this.SNAP_THRESHOLD) {
                    snappedY = snapPoint.pos - newBounds.height / 2;
                    hasSnap = true;
                    guides.push({
                        type: 'center-horizontal',
                        position: snapPoint.pos,
                        elementIds: [element.id]
                    });
                }
            }
        }

        // Calculate spacing indicators
        const spacingGuides = this.calculateSpacingGuides(draggedElement, otherElements, snappedX, snappedY);
        guides.push(...spacingGuides);

        return {
            snapped: hasSnap,
            guides,
            snappedX,
            snappedY
        };
    }

    /**
     * Calculate snapping guides for resizing
     */
    public static calculateSnappingForResize(
        resizedElement: LayoutElement,
        allElements: LayoutElement[],
        handle: number,
        currentWidth: number,
        currentHeight: number,
        currentX: number,
        currentY: number
    ): SnappingResult {
        const guides: SnappingGuide[] = [];
        let snappedWidth = currentWidth;
        let snappedHeight = currentHeight;
        let snappedX = currentX;
        let snappedY = currentY;
        let hasSnap = false;

        const otherElements = allElements.filter(e => e.id !== resizedElement.id);

        // Calculate new bounds
        const newBounds = {
            x: currentX,
            y: currentY,
            width: currentWidth,
            height: currentHeight,
            right: currentX + currentWidth,
            bottom: currentY + currentHeight
        };

        // Check snapping based on resize handle
        for (const element of otherElements) {
            const bounds = element.bounds;

            // Horizontal resizing (left/right handles)
            if (handle & 4 || handle & 8) { // Left or Right
                // Snap to left edge
                if (handle & 4) { // Left handle
                    const distToLeft = Math.abs(newBounds.x - bounds.x);
                    if (distToLeft < this.SNAP_THRESHOLD) {
                        snappedX = bounds.x;
                        snappedWidth = newBounds.right - bounds.x;
                        hasSnap = true;
                        guides.push({
                            type: 'vertical',
                            position: bounds.x,
                            elementIds: [element.id]
                        });
                    }
                }

                // Snap to right edge
                if (handle & 8) { // Right handle
                    const distToRight = Math.abs(newBounds.right - (bounds.x + bounds.width));
                    if (distToRight < this.SNAP_THRESHOLD) {
                        snappedWidth = bounds.x + bounds.width - newBounds.x;
                        hasSnap = true;
                        guides.push({
                            type: 'vertical',
                            position: bounds.x + bounds.width,
                            elementIds: [element.id]
                        });
                    }
                }
            }

            // Vertical resizing (top/bottom handles)
            if (handle & 1 || handle & 2) { // Top or Bottom
                // Snap to top edge
                if (handle & 1) { // Top handle
                    const distToTop = Math.abs(newBounds.y - bounds.y);
                    if (distToTop < this.SNAP_THRESHOLD) {
                        snappedY = bounds.y;
                        snappedHeight = newBounds.bottom - bounds.y;
                        hasSnap = true;
                        guides.push({
                            type: 'horizontal',
                            position: bounds.y,
                            elementIds: [element.id]
                        });
                    }
                }

                // Snap to bottom edge
                if (handle & 2) { // Bottom handle
                    const distToBottom = Math.abs(newBounds.bottom - (bounds.y + bounds.height));
                    if (distToBottom < this.SNAP_THRESHOLD) {
                        snappedHeight = bounds.y + bounds.height - newBounds.y;
                        hasSnap = true;
                        guides.push({
                            type: 'horizontal',
                            position: bounds.y + bounds.height,
                            elementIds: [element.id]
                        });
                    }
                }
            }
        }

        return {
            snapped: hasSnap,
            guides,
            snappedX,
            snappedY,
            snappedWidth,
            snappedHeight
        };
    }

    /**
     * Calculate spacing indicators between elements
     */
    private static calculateSpacingGuides(
        element: LayoutElement,
        otherElements: LayoutElement[],
        x: number,
        y: number
    ): SnappingGuide[] {
        const guides: SnappingGuide[] = [];
        const elementBounds = {
            x,
            y,
            width: element.bounds.width,
            height: element.bounds.height,
            right: x + element.bounds.width,
            bottom: y + element.bounds.height
        };

        for (const other of otherElements) {
            const bounds = other.bounds;
            const otherRight = bounds.x + bounds.width;
            const otherBottom = bounds.y + bounds.height;

            // Check horizontal spacing
            const spacingX = elementBounds.x - otherRight; // Space to the right of other element
            if (spacingX > 0 && spacingX < 100) {
                guides.push({
                    type: 'vertical',
                    position: otherRight + spacingX / 2,
                    distance: spacingX,
                    elementIds: [element.id, other.id]
                });
            }

            const spacingX2 = bounds.x - elementBounds.right; // Space to the left of other element
            if (spacingX2 > 0 && spacingX2 < 100) {
                guides.push({
                    type: 'vertical',
                    position: elementBounds.right + spacingX2 / 2,
                    distance: spacingX2,
                    elementIds: [element.id, other.id]
                });
            }

            // Check vertical spacing
            const spacingY = elementBounds.y - otherBottom;
            if (spacingY > 0 && spacingY < 100) {
                guides.push({
                    type: 'horizontal',
                    position: otherBottom + spacingY / 2,
                    distance: spacingY,
                    elementIds: [element.id, other.id]
                });
            }

            const spacingY2 = bounds.y - elementBounds.bottom;
            if (spacingY2 > 0 && spacingY2 < 100) {
                guides.push({
                    type: 'horizontal',
                    position: elementBounds.bottom + spacingY2 / 2,
                    distance: spacingY2,
                    elementIds: [element.id, other.id]
                });
            }
        }

        return guides;
    }

    /**
     * Distribute elements horizontally
     */
    public static distributeHorizontally(elements: LayoutElement[]): { [elementId: string]: number } {
        if (elements.length < 3) {
            return {};
        }

        const sorted = [...elements].sort((a, b) => a.bounds.x - b.bounds.x);
        const leftmost = sorted[0].bounds.x;
        const rightmost = sorted[sorted.length - 1].bounds.x + sorted[sorted.length - 1].bounds.width;
        const totalWidth = rightmost - leftmost;
        const elementWidths = sorted.map(e => e.bounds.width);
        const totalElementWidth = elementWidths.reduce((sum, w) => sum + w, 0);
        const spacing = (totalWidth - totalElementWidth) / (sorted.length - 1);

        const positions: { [elementId: string]: number } = {};
        let currentX = leftmost;

        for (let i = 0; i < sorted.length; i++) {
            positions[sorted[i].id] = currentX;
            currentX += elementWidths[i] + spacing;
        }

        return positions;
    }

    /**
     * Distribute elements vertically
     */
    public static distributeVertically(elements: LayoutElement[]): { [elementId: string]: number } {
        if (elements.length < 3) {
            return {};
        }

        const sorted = [...elements].sort((a, b) => a.bounds.y - b.bounds.y);
        const topmost = sorted[0].bounds.y;
        const bottommost = sorted[sorted.length - 1].bounds.y + sorted[sorted.length - 1].bounds.height;
        const totalHeight = bottommost - topmost;
        const elementHeights = sorted.map(e => e.bounds.height);
        const totalElementHeight = elementHeights.reduce((sum, h) => sum + h, 0);
        const spacing = (totalHeight - totalElementHeight) / (sorted.length - 1);

        const positions: { [elementId: string]: number } = {};
        let currentY = topmost;

        for (let i = 0; i < sorted.length; i++) {
            positions[sorted[i].id] = currentY;
            currentY += elementHeights[i] + spacing;
        }

        return positions;
    }
}

