import * as vscode from 'vscode';
import * as fs from 'fs';
import { XamlParser } from '../utils/XamlParser';

/**
 * Binding Information
 */
export interface BindingInfo {
    elementId: string;
    elementType: string;
    property: string;
    bindingPath: string;
    bindingMode?: string;
    converter?: string;
    currentValue?: any;
    status: 'ok' | 'error' | 'warning';
    errorMessage?: string;
    sourceLocation: vscode.Location;
}

/**
 * Binding Inspector - Analyzes WPF bindings
 */
export class BindingInspector {
    /**
     * Extract all bindings from XAML document
     */
    public static async extractBindings(document: vscode.TextDocument): Promise<BindingInfo[]> {
        const bindings: BindingInfo[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        // Regex patterns for binding detection
        const bindingPattern = /({Binding\s+[^}]+})/gi;
        const multiBindingPattern = /({MultiBinding[^}]+})/gi;
        const elementNamePattern = /x:Name="([^"]+)"/;
        const namePattern = /Name="([^"]+)"/;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            let match;

            // Find element name
            const elementNameMatch = elementNamePattern.exec(line) || namePattern.exec(line);
            const elementName = elementNameMatch ? elementNameMatch[1] : undefined;

            // Find element type
            const elementTypeMatch = line.match(/<(\w+)[\s>]/);
            const elementType = elementTypeMatch ? elementTypeMatch[1] : 'Unknown';

            // Check for Binding markup
            while ((match = bindingPattern.exec(line)) !== null) {
                const bindingText = match[1];
                const bindingInfo = this._parseBinding(
                    bindingText,
                    elementName || `line-${i}`,
                    elementType,
                    i,
                    document.uri
                );

                // Extract property name (preceding the binding)
                const propertyMatch = line.match(/(\w+)\s*=\s*"\{Binding/);
                if (propertyMatch) {
                    bindingInfo.property = propertyMatch[1];
                }

                bindings.push(bindingInfo);
            }

            // Check for MultiBinding
            while ((match = multiBindingPattern.exec(line)) !== null) {
                const bindingInfo: BindingInfo = {
                    elementId: elementName || `line-${i}`,
                    elementType,
                    property: 'Unknown',
                    bindingPath: match[1],
                    status: 'ok',
                    sourceLocation: new vscode.Location(
                        document.uri,
                        new vscode.Position(i, match.index)
                    )
                };
                bindings.push(bindingInfo);
            }
        }

        return bindings;
    }

    /**
     * Parse binding expression
     */
    private static _parseBinding(
        bindingText: string,
        elementId: string,
        elementType: string,
        line: number,
        uri: vscode.Uri
    ): BindingInfo {
        // Extract Path
        const pathMatch = bindingText.match(/Path=([^,}\s]+)/);
        const path = pathMatch ? pathMatch[1].replace(/['"]/g, '') : '';

        // Extract Mode
        const modeMatch = bindingText.match(/Mode=(\w+)/);
        const mode = modeMatch ? modeMatch[1] : undefined;

        // Extract Converter
        const converterMatch = bindingText.match(/Converter=\{StaticResource\s+(\w+)\}/);
        const converter = converterMatch ? converterMatch[1] : undefined;

        // Validate binding
        let status: 'ok' | 'error' | 'warning' = 'ok';
        let errorMessage: string | undefined;

        if (!path) {
            status = 'warning';
            errorMessage = 'Binding path is missing';
        }

        return {
            elementId,
            elementType,
            property: 'Unknown',
            bindingPath: path,
            bindingMode: mode,
            converter,
            status,
            errorMessage,
            sourceLocation: new vscode.Location(uri, new vscode.Position(line, 0))
        };
    }

    /**
     * Validate bindings against DataContext
     */
    public static async validateBindings(
        bindings: BindingInfo[],
        dataContextType?: string
    ): Promise<BindingInfo[]> {
        // TODO: Implement validation against DataContext type
        // This would require parsing C# code to get property names
        
        return bindings.map(binding => {
            // Basic validation
            if (!binding.bindingPath) {
                binding.status = 'error';
                binding.errorMessage = 'Binding path is empty';
            } else if (binding.bindingPath.includes('.')) {
                // Check nested path
                const parts = binding.bindingPath.split('.');
                // Could validate each part if we had type information
            }

            return binding;
        });
    }

    /**
     * Suggest fixes for binding errors
     */
    public static suggestFixes(binding: BindingInfo): string[] {
        const suggestions: string[] = [];

        if (!binding.bindingPath) {
            suggestions.push('Add a Path property to the Binding');
        }

        if (binding.status === 'error') {
            suggestions.push('Check if the DataContext is set correctly');
            suggestions.push('Verify the property exists in the ViewModel');
            suggestions.push('Ensure property names match exactly (case-sensitive)');
        }

        return suggestions;
    }
}

