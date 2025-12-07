/**
 * Simple XAML parser utilities
 */
export class XamlParser {
    /**
     * Extract bindings from XAML
     */
    static extractBindings(xaml: string): string[] {
        const bindings: string[] = [];
        const regex = /\{Binding\s+(\w+)\}/g;
        let match;
        while ((match = regex.exec(xaml)) !== null) {
            bindings.push(match[1]);
        }
        return [...new Set(bindings)];
    }

    /**
     * Extract commands from XAML
     */
    static extractCommands(xaml: string): string[] {
        const commands: string[] = [];
        const regex = /Command="\{Binding\s+(\w+)\}"/g;
        let match;
        while ((match = regex.exec(xaml)) !== null) {
            commands.push(match[1]);
        }
        return [...new Set(commands)];
    }

    /**
     * Extract StaticResource references
     */
    static extractStaticResources(xaml: string): string[] {
        const resources: string[] = [];
        const regex = /\{StaticResource\s+(\w+)\}/g;
        let match;
        while ((match = regex.exec(xaml)) !== null) {
            resources.push(match[1]);
        }
        return [...new Set(resources)];
    }

    /**
     * Extract element types
     */
    static extractElementTypes(xaml: string): string[] {
        const types: string[] = [];
        const regex = /<(\w+)(?:\s|>)/g;
        let match;
        while ((match = regex.exec(xaml)) !== null) {
            const type = match[1];
            if (!type.startsWith('xmlns') && type !== 'ResourceDictionary') {
                types.push(type);
            }
        }
        return [...new Set(types)];
    }

    /**
     * Check nesting level
     */
    static getNestingLevel(xaml: string): number {
        let maxDepth = 0;
        let currentDepth = 0;
        const lines = xaml.split('\n');
        
        for (const line of lines) {
            if (line.match(/<\w+[^>]*>/)) {
                currentDepth++;
                maxDepth = Math.max(maxDepth, currentDepth);
            }
            if (line.match(/<\/\w+>/)) {
                currentDepth--;
            }
        }
        
        return maxDepth;
    }
}
