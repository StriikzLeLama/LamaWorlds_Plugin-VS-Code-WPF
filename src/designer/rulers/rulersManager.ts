/**
 * Guide Line - Represents a draggable guide
 */
export interface GuideLine {
    id: string;
    type: 'vertical' | 'horizontal';
    position: number;
    color?: string;
}

/**
 * Rulers Manager - Manages pixel rulers and draggable guides
 */
export class RulersManager {
    private _guides: GuideLine[] = [];
    private _snapToGuides: boolean = true;
    private _showRulers: boolean = true;

    /**
     * Get all guides
     */
    public getGuides(): GuideLine[] {
        return [...this._guides];
    }

    /**
     * Add a guide
     */
    public addGuide(type: 'vertical' | 'horizontal', position: number): string {
        const id = `guide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const guide: GuideLine = {
            id,
            type,
            position,
            color: '#00ffff' // Cyan
        };
        this._guides.push(guide);
        return id;
    }

    /**
     * Remove a guide
     */
    public removeGuide(id: string): boolean {
        const index = this._guides.findIndex(g => g.id === id);
        if (index !== -1) {
            this._guides.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Update guide position
     */
    public updateGuidePosition(id: string, position: number): boolean {
        const guide = this._guides.find(g => g.id === id);
        if (guide) {
            guide.position = position;
            return true;
        }
        return false;
    }

    /**
     * Clear all guides
     */
    public clearGuides(): void {
        this._guides = [];
    }

    /**
     * Toggle snap to guides
     */
    public setSnapToGuides(enabled: boolean): void {
        this._snapToGuides = enabled;
    }

    /**
     * Check if snap to guides is enabled
     */
    public isSnapToGuidesEnabled(): boolean {
        return this._snapToGuides;
    }

    /**
     * Toggle rulers visibility
     */
    public setRulersVisible(visible: boolean): void {
        this._showRulers = visible;
    }

    /**
     * Check if rulers are visible
     */
    public areRulersVisible(): boolean {
        return this._showRulers;
    }

    /**
     * Snap position to nearest guide
     */
    public snapToGuides(position: number, type: 'vertical' | 'horizontal', threshold: number = 5): number | null {
        if (!this._snapToGuides) {
            return null;
        }

        const relevantGuides = this._guides.filter(g => g.type === type);
        let nearestGuide: GuideLine | null = null;
        let minDistance = threshold;

        for (const guide of relevantGuides) {
            const distance = Math.abs(position - guide.position);
            if (distance < minDistance) {
                minDistance = distance;
                nearestGuide = guide;
            }
        }

        return nearestGuide ? nearestGuide.position : null;
    }

    /**
     * Get guides at a specific position (for deletion)
     */
    public getGuidesAtPosition(position: number, type: 'vertical' | 'horizontal', threshold: number = 5): GuideLine[] {
        return this._guides.filter(g => {
            if (g.type !== type) return false;
            return Math.abs(g.position - position) <= threshold;
        });
    }
}

