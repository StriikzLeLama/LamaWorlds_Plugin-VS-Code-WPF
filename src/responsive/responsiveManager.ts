import * as vscode from 'vscode';
import { PreviewEngine } from '../preview/previewEngine';

/**
 * Responsive Manager - Handles multi-size preview rendering
 */
export class ResponsiveManager {
    private _previewEngine: PreviewEngine;
    private _breakpoints: { name: string; width: number; height: number }[] = [
        { name: 'Mobile', width: 375, height: 812 },
        { name: 'Tablet', width: 768, height: 1024 },
        { name: 'Desktop', width: 1366, height: 768 }
    ];

    constructor() {
        this._previewEngine = PreviewEngine.getInstance();
    }

    /**
     * Get available breakpoints
     */
    public getBreakpoints(): { name: string; width: number; height: number }[] {
        return this._breakpoints;
    }

    /**
     * Add custom breakpoint
     */
    public addBreakpoint(name: string, width: number, height: number): void {
        this._breakpoints.push({ name, width, height });
    }

    /**
     * Render XAML at specific size
     */
    public async renderAtSize(xaml: string, width: number, height: number): Promise<any> {
        // Wrap XAML in a container with specific size
        const wrappedXaml = this._wrapXamlForSize(xaml, width, height);
        return await this._previewEngine.renderFastLive(wrappedXaml);
    }

    /**
     * Render all breakpoints
     */
    public async renderAllBreakpoints(xaml: string): Promise<Map<string, any>> {
        const results = new Map<string, any>();

        for (const breakpoint of this._breakpoints) {
            const result = await this.renderAtSize(xaml, breakpoint.width, breakpoint.height);
            results.set(breakpoint.name, {
                ...result,
                breakpoint: breakpoint
            });
        }

        return results;
    }

    /**
     * Wrap XAML in a container with specific dimensions
     */
    private _wrapXamlForSize(xaml: string, width: number, height: number): string {
        // Extract root element
        const rootMatch = xaml.match(/<(\w+)[^>]*>/);
        if (!rootMatch) {
            return xaml;
        }

        // Wrap in a Border with specific size
        return `<Border Width="${width}" Height="${height}" xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation">
    ${xaml}
</Border>`;
    }
}

