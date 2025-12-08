import * as vscode from 'vscode';
import { XamlParser } from '../utils/XamlParser';

/**
 * XAML Refactoring Engine - AI-powered XAML improvements
 */
export class XamlRefactor {
    /**
     * Simplify XAML by removing unnecessary nesting
     */
    public static async simplifyXaml(document: vscode.TextDocument): Promise<string> {
        let xaml = document.getText();
        
        // Remove unnecessary Grid wrappers
        xaml = this._removeUnnecessaryGrids(xaml);
        
        // Reorder properties alphabetically
        xaml = this._reorderProperties(xaml);
        
        // Remove duplicate attributes
        xaml = this._removeDuplicateAttributes(xaml);
        
        return xaml;
    }

    /**
     * Remove unused resources from ResourceDictionary
     */
    public static async removeUnusedResources(document: vscode.TextDocument): Promise<string> {
        // TODO: Implement resource usage analysis
        return document.getText();
    }

    /**
     * Flatten unnecessary nesting
     */
    public static async flattenNesting(document: vscode.TextDocument): Promise<string> {
        let xaml = document.getText();
        
        // Remove single-child Grids
        xaml = xaml.replace(
            /<Grid[^>]*>\s*<(\w+)[^>]*>([^<]*)<\/\1>\s*<\/Grid>/g,
            '<$1$2</$1>'
        );
        
        return xaml;
    }

    /**
     * Remove unnecessary Grid wrappers
     */
    private static _removeUnnecessaryGrids(xaml: string): string {
        // Pattern: <Grid><SingleChild/></Grid>
        const pattern = /<Grid[^>]*>\s*<(\w+)[^>]*\/>\s*<\/Grid>/g;
        return xaml.replace(pattern, '<$1/>');
    }

    /**
     * Reorder properties alphabetically
     */
    private static _reorderProperties(xaml: string): string {
        const lines = xaml.split('\n');
        const result: string[] = [];

        for (const line of lines) {
            const tagMatch = line.match(/<(\w+)([^>]*)>/);
            if (tagMatch) {
                const tagName = tagMatch[1];
                const attributes = tagMatch[2];
                
                // Extract attributes
                const attrPattern = /(\w+(?:\.\w+)?="[^"]*")/g;
                const attrs: string[] = [];
                let match;
                
                while ((match = attrPattern.exec(attributes)) !== null) {
                    attrs.push(match[1]);
                }
                
                // Sort attributes
                attrs.sort();
                
                // Rebuild line
                const newLine = `<${tagName} ${attrs.join(' ')}>`;
                result.push(newLine);
            } else {
                result.push(line);
            }
        }

        return result.join('\n');
    }

    /**
     * Remove duplicate attributes
     */
    private static _removeDuplicateAttributes(xaml: string): string {
        const lines = xaml.split('\n');
        const result: string[] = [];

        for (const line of lines) {
            const tagMatch = line.match(/<(\w+)([^>]*)>/);
            if (tagMatch) {
                const tagName = tagMatch[1];
                const attributes = tagMatch[2];
                
                const attrMap = new Map<string, string>();
                const attrPattern = /(\w+(?:\.\w+)?)="([^"]*)"/g;
                let match;
                
                while ((match = attrPattern.exec(attributes)) !== null) {
                    const attrName = match[1];
                    const attrValue = match[2];
                    // Keep last occurrence
                    attrMap.set(attrName, attrValue);
                }
                
                // Rebuild attributes
                const attrs = Array.from(attrMap.entries())
                    .map(([name, value]) => `${name}="${value}"`)
                    .join(' ');
                
                const newLine = `<${tagName} ${attrs}>`;
                result.push(newLine);
            } else {
                result.push(line);
            }
        }

        return result.join('\n');
    }
}

