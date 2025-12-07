import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class AIFeatures {
    constructor(private context: vscode.ExtensionContext) {}

    /**
     * AI UI Auto-generator: Generate XAML, ViewModel, and bindings from description
     */
    async generateUIFromDescription(description: string): Promise<{ xaml: string; viewModel: string; styles?: string }> {
        // Parse description and generate UI components
        const components = this._parseDescription(description);
        
        let xaml = '<Grid>\n';
        let viewModel = '';
        const properties: string[] = [];
        const commands: string[] = [];

        // Generate based on keywords
        if (description.toLowerCase().includes('button')) {
            const buttonCount = (description.match(/button/gi) || []).length;
            for (let i = 0; i < Math.min(buttonCount, 5); i++) {
                xaml += `    <Button Content="Button ${i + 1}" Style="{StaticResource NeonButton}" Command="{{Binding Button${i + 1}Command}}" Margin="10" />\n`;
                commands.push(`Button${i + 1}Command`);
            }
        }

        if (description.toLowerCase().includes('text') || description.toLowerCase().includes('input')) {
            xaml += `    <TextBox Text="{{Binding InputText}}" Margin="10" />\n`;
            properties.push('InputText');
        }

        if (description.toLowerCase().includes('list') || description.toLowerCase().includes('items')) {
            xaml += `    <ListView ItemsSource="{{Binding Items}}" Margin="10">\n`;
            xaml += `        <ListView.ItemTemplate>\n`;
            xaml += `            <DataTemplate>\n`;
            xaml += `                <TextBlock Text="{{Binding Name}}" />\n`;
            xaml += `            </DataTemplate>\n`;
            xaml += `        </ListView.ItemTemplate>\n`;
            xaml += `    </ListView>\n`;
            properties.push('Items');
        }

        if (description.toLowerCase().includes('section') || description.toLowerCase().includes('panel')) {
            const sectionCount = (description.match(/section/gi) || []).length || 2;
            for (let i = 0; i < sectionCount; i++) {
                xaml += `    <Border Style="{{StaticResource GlassCard}}" Margin="10">\n`;
                xaml += `        <StackPanel>\n`;
                xaml += `            <TextBlock Text="Section ${i + 1}" Style="{{StaticResource Header1}}" />\n`;
                xaml += `            <TextBlock Text="Content for section ${i + 1}" />\n`;
                xaml += `        </StackPanel>\n`;
                xaml += `    </Border>\n`;
            }
        }

        xaml += '</Grid>';

        // Generate ViewModel
        viewModel = this._generateViewModel(properties, commands);

        return { xaml, viewModel };
    }

    /**
     * Layout Optimizer: Analyze XAML and propose optimizations
     */
    async optimizeLayout(xamlContent: string): Promise<{ optimized: string; suggestions: string[] }> {
        const suggestions: string[] = [];
        let optimized = xamlContent;

        // Check for excessive nesting
        const nestingLevel = this._checkNesting(xamlContent);
        if (nestingLevel > 5) {
            suggestions.push(`High nesting level (${nestingLevel}). Consider extracting to UserControls.`);
        }

        // Check for empty containers
        const emptyContainers = this._findEmptyContainers(xamlContent);
        if (emptyContainers.length > 0) {
            suggestions.push(`Found ${emptyContainers.length} empty containers. Consider removing them.`);
            for (const container of emptyContainers) {
                optimized = optimized.replace(new RegExp(`<${container}[^>]*>\\s*</${container}>`, 'gi'), '');
            }
        }

        // Check for duplicate properties
        const duplicates = this._findDuplicateProperties(xamlContent);
        if (duplicates.length > 0) {
            suggestions.push(`Found ${duplicates.length} elements with duplicate properties. Consider using Styles.`);
        }

        // Simplify Grid definitions
        optimized = this._simplifyGrids(optimized);

        return { optimized, suggestions };
    }

    /**
     * Auto-fix XAML Errors: Suggest fixes for common issues
     */
    async autoFixXaml(xamlContent: string): Promise<{ fixed: string; fixes: string[] }> {
        const fixes: string[] = [];
        let fixed = xamlContent;

        // Fix missing namespaces
        if (!fixed.includes('xmlns=')) {
            fixed = fixed.replace(/<(\w+)/, '<$1 xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"');
            fixes.push('Added default xmlns namespace');
        }

        if (!fixed.includes('xmlns:x=') && fixed.includes('x:Class')) {
            fixed = fixed.replace(/xmlns="[^"]*"/, '$& xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"');
            fixes.push('Added x: namespace');
        }

        // Fix invalid bindings
        const invalidBindings = fixed.match(/\{Binding\s+[^}]+\}/g);
        if (invalidBindings) {
            for (const binding of invalidBindings) {
                if (!binding.match(/\{Binding\s+\w+\}/)) {
                    const fixedBinding = binding.replace(/\{Binding\s+([^}]+)\}/, '{Binding $1}');
                    fixed = fixed.replace(binding, fixedBinding);
                    fixes.push(`Fixed binding: ${binding}`);
                }
            }
        }

        // Fix missing StaticResource keys
        const staticResources = fixed.match(/\{StaticResource\s+(\w+)\}/g);
        if (staticResources) {
            for (const resource of staticResources) {
                const key = resource.match(/\{StaticResource\s+(\w+)\}/)?.[1];
                // Check if resource exists (simplified check)
                if (key && !fixed.includes(`x:Key="${key}"`)) {
                    fixes.push(`Warning: StaticResource '${key}' may not be defined`);
                }
            }
        }

        return { fixed, fixes };
    }

    /**
     * ViewModel Generator: Infer properties and commands from XAML
     */
    async generateViewModelFromXaml(xamlContent: string): Promise<string> {
        const bindings = this._extractBindings(xamlContent);
        const commands = this._extractCommands(xamlContent);
        const properties = this._extractProperties(bindings);

        return this._generateViewModel(properties, commands);
    }

    private _parseDescription(description: string): any {
        // Simple keyword-based parsing
        return {
            hasButtons: /button/i.test(description),
            hasInputs: /input|text|field/i.test(description),
            hasLists: /list|items|collection/i.test(description),
            hasSections: /section|panel|group/i.test(description),
            isNeon: /neon|glow|cyber/i.test(description),
            isGlass: /glass|transparent|blur/i.test(description)
        };
    }

    private _checkNesting(xaml: string): number {
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

    private _findEmptyContainers(xaml: string): string[] {
        const empty: string[] = [];
        const containerRegex = /<(Grid|StackPanel|Border|Panel)([^>]*)>\s*<\/(Grid|StackPanel|Border|Panel)>/gi;
        let match;
        while ((match = containerRegex.exec(xaml)) !== null) {
            empty.push(match[1]);
        }
        return empty;
    }

    private _findDuplicateProperties(xaml: string): string[] {
        // Simplified: find elements with same properties
        const elements: Map<string, string[]> = new Map();
        const elementRegex = /<(\w+)([^>]+)>/g;
        let match;
        
        while ((match = elementRegex.exec(xaml)) !== null) {
            const tag = match[1];
            const attrs = match[2];
            if (!elements.has(tag)) {
                elements.set(tag, []);
            }
            elements.get(tag)!.push(attrs);
        }
        
        return [];
    }

    private _simplifyGrids(xaml: string): string {
        // Remove unnecessary Grid definitions
        return xaml.replace(/<Grid>\s*<Grid>\s*/g, '<Grid>\n');
    }

    private _extractBindings(xaml: string): string[] {
        const bindings: string[] = [];
        const bindingRegex = /\{Binding\s+(\w+)\}/g;
        let match;
        while ((match = bindingRegex.exec(xaml)) !== null) {
            bindings.push(match[1]);
        }
        return [...new Set(bindings)];
    }

    private _extractCommands(xaml: string): string[] {
        const commands: string[] = [];
        const commandRegex = /Command="\{Binding\s+(\w+)\}"/g;
        let match;
        while ((match = commandRegex.exec(xaml)) !== null) {
            commands.push(match[1]);
        }
        return [...new Set(commands)];
    }

    private _extractProperties(bindings: string[]): string[] {
        // Filter out commands, return properties
        return bindings.filter(b => !b.endsWith('Command') && !b.endsWith('Command'));
    }

    private _generateViewModel(properties: string[], commands: string[]): string {
        let vm = `using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows.Input;
using System.Collections.ObjectModel;

namespace LamaWorldsApp.ViewModels;

public class GeneratedViewModel : INotifyPropertyChanged
{
    public event PropertyChangedEventHandler? PropertyChanged;

    protected virtual void OnPropertyChanged([CallerMemberName] string? propertyName = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }

`;

        // Add properties
        for (const prop of properties) {
            vm += `    private string _${prop.toLowerCase()} = string.Empty;
    public string ${prop}
    {
        get => _${prop.toLowerCase()};
        set
        {
            if (_${prop.toLowerCase()} != value)
            {
                _${prop.toLowerCase()} = value;
                OnPropertyChanged();
            }
        }
    }

`;
        }

        // Add commands
        for (const cmd of commands) {
            vm += `    public ICommand ${cmd} { get; }
    private void Execute${cmd}(object? parameter)
    {
        // TODO: Implement command logic
    }

`;
        }

        vm += `    public GeneratedViewModel()
    {
`;
        for (const cmd of commands) {
            vm += `        ${cmd} = new RelayCommand(Execute${cmd});
`;
        }
        vm += `    }
}`;

        return vm;
    }
}
