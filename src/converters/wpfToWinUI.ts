import * as vscode from 'vscode';

/**
 * WPF to WinUI 3 Converter
 */
export class WpfToWinUI3Converter {
    /**
     * Convert WPF XAML to WinUI 3 XAML
     */
    public static async convert(document: vscode.TextDocument): Promise<string> {
        let xaml = document.getText();

        // Namespace conversions
        xaml = xaml.replace(/xmlns="http:\/\/schemas\.microsoft\.com\/winfx\/2006\/xaml\/presentation"/g,
            'xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"');
        xaml = xaml.replace(/xmlns:x="http:\/\/schemas\.microsoft\.com\/winfx\/2006\/xaml"/g,
            'xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"');

        // Control conversions
        xaml = xaml.replace(/<Window/g, '<Window');
        xaml = xaml.replace(/<Button/g, '<Button');
        
        // TextBlock stays the same
        // Grid stays the same
        // StackPanel stays the same

        // Property conversions
        // Most properties stay the same in WinUI 3

        return xaml;
    }
}

