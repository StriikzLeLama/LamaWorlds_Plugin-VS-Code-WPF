import * as vscode from 'vscode';

/**
 * WPF to Avalonia Converter
 */
export class WpfToAvaloniaConverter {
    /**
     * Convert WPF XAML to Avalonia XAML
     */
    public static async convert(document: vscode.TextDocument): Promise<string> {
        let xaml = document.getText();

        // Namespace conversions
        xaml = xaml.replace(/xmlns="http:\/\/schemas\.microsoft\.com\/winfx\/2006\/xaml\/presentation"/g,
            'xmlns="https://github.com/avaloniaui"');
        xaml = xaml.replace(/xmlns:x="http:\/\/schemas\.microsoft\.com\/winfx\/2006\/xaml"/g,
            'xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"');

        // Control name conversions
        const controlMap: { [key: string]: string } = {
            'Window': 'Window',
            'UserControl': 'UserControl',
            'Button': 'Button',
            'TextBox': 'TextBox',
            'Grid': 'Grid',
            'StackPanel': 'StackPanel',
            'Canvas': 'Canvas',
            'Border': 'Border',
            'TextBlock': 'TextBlock',
            'Label': 'Label'
        };

        for (const [wpf, avalonia] of Object.entries(controlMap)) {
            const regex = new RegExp(`<${wpf}([\\s>])`, 'g');
            xaml = xaml.replace(regex, `<${avalonia}$1`);
            const closeRegex = new RegExp(`</${wpf}>`, 'g');
            xaml = xaml.replace(closeRegex, `</${avalonia}>`);
        }

        // Property conversions
        xaml = xaml.replace(/VerticalAlignment/g, 'VerticalAlignment');
        xaml = xaml.replace(/HorizontalAlignment/g, 'HorizontalAlignment');
        
        // Margin stays the same
        // Width/Height stay the same

        return xaml;
    }
}

