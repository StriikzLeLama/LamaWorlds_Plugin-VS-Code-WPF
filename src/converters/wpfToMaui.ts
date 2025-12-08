import * as vscode from 'vscode';

/**
 * WPF to MAUI Converter
 */
export class WpfToMauiConverter {
    /**
     * Convert WPF XAML to MAUI XAML
     */
    public static async convert(document: vscode.TextDocument): Promise<string> {
        let xaml = document.getText();

        // Namespace conversions
        xaml = xaml.replace(/xmlns="http:\/\/schemas\.microsoft\.com\/winfx\/2006\/xaml\/presentation"/g,
            'xmlns="http://schemas.microsoft.com/dotnet/2021/maui"');
        xaml = xaml.replace(/xmlns:x="http:\/\/schemas\.microsoft\.com\/winfx\/2006\/xaml"/g,
            'xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"');

        // Control conversions
        xaml = xaml.replace(/<Window/g, '<ContentPage');
        xaml = xaml.replace(/<\/Window>/g, '</ContentPage>');
        
        xaml = xaml.replace(/<Button/g, '<Button');
        xaml = xaml.replace(/<TextBox/g, '<Entry');
        xaml = xaml.replace(/<\/TextBox>/g, '</Entry>');
        xaml = xaml.replace(/<TextBlock/g, '<Label');
        xaml = xaml.replace(/<\/TextBlock>/g, '</Label>');
        
        // Grid stays the same in MAUI
        // StackPanel -> StackLayout
        xaml = xaml.replace(/<StackPanel/g, '<StackLayout');
        xaml = xaml.replace(/<\/StackPanel>/g, '</StackLayout>');

        // Property conversions
        // Margin stays similar
        // Width/Height stay the same

        return xaml;
    }
}

