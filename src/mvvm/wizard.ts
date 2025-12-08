import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * MVVM Wizard - Converts code-behind Window to MVVM pattern
 */
export class MvvmWizard {
    /**
     * Convert code-behind Window to MVVM
     */
    public static async convertToMvvm(document: vscode.TextDocument): Promise<void> {
        const xaml = document.getText();
        const codeBehind = await this._findCodeBehind(document);
        
        if (!codeBehind) {
            vscode.window.showErrorMessage('Could not find code-behind file');
            return;
        }

        // Analyze XAML for bindings and events
        const analysis = this._analyzeXaml(xaml);
        
        // Generate ViewModel
        const viewModelCode = this._generateViewModel(analysis);
        
        // Generate RelayCommand classes
        const relayCommandCode = this._generateRelayCommands(analysis);
        
        // Update XAML to use bindings instead of events
        const updatedXaml = this._convertXamlToBindings(xaml, analysis);
        
        // Show preview and apply
        const action = await vscode.window.showInformationMessage(
            'MVVM conversion ready. Create ViewModel and update files?',
            'Yes',
            'Preview',
            'Cancel'
        );

        if (action === 'Yes') {
            await this._applyConversion(document, viewModelCode, relayCommandCode, updatedXaml);
        } else if (action === 'Preview') {
            await this._showPreview(viewModelCode, relayCommandCode, updatedXaml);
        }
    }

    /**
     * Find code-behind file for XAML
     */
    private static async _findCodeBehind(document: vscode.TextDocument): Promise<vscode.TextDocument | null> {
        const xamlPath = document.fileName;
        const codeBehindPath = xamlPath.replace('.xaml', '.xaml.cs');
        
        if (fs.existsSync(codeBehindPath)) {
            return await vscode.workspace.openTextDocument(codeBehindPath);
        }
        
        return null;
    }

    /**
     * Analyze XAML for events, properties, and bindings
     */
    private static _analyzeXaml(xaml: string): {
        events: Array<{ element: string; event: string; handler: string }>;
        properties: Array<{ name: string; type: string }>;
        bindings: Array<{ element: string; property: string; path: string }>;
    } {
        const events: Array<{ element: string; event: string; handler: string }> = [];
        const properties: Array<{ name: string; type: string }> = [];
        const bindings: Array<{ element: string; property: string; path: string }> = [];

        // Extract event handlers (e.g., Click="Button_Click")
        const eventPattern = /(\w+)="(\w+_?\w+)"?/g;
        let match;
        
        while ((match = eventPattern.exec(xaml)) !== null) {
            const eventName = match[1];
            const handler = match[2];
            
            // Common events
            if (['Click', 'Loaded', 'KeyDown', 'KeyUp', 'MouseDown', 'MouseUp'].includes(eventName)) {
                events.push({
                    element: 'Unknown',
                    event: eventName,
                    handler
                });
            }
        }

        // Extract bindings
        const bindingPattern = /(\w+)\s*=\s*"\{Binding\s+([^}]+)\}"/g;
        while ((match = bindingPattern.exec(xaml)) !== null) {
            const property = match[1];
            const path = match[2].replace(/Path=/, '').trim();
            bindings.push({
                element: 'Unknown',
                property,
                path
            });
        }

        return { events, properties, bindings };
    }

    /**
     * Generate ViewModel code
     */
    private static _generateViewModel(analysis: {
        events: Array<{ element: string; event: string; handler: string }>;
        properties: Array<{ name: string; type: string }>;
        bindings: Array<{ element: string; property: string; path: string }>;
    }): string {
        const className = 'MainViewModel';
        const properties = analysis.bindings.map(b => b.path.split('.')[0]).filter((v, i, a) => a.indexOf(v) === i);
        
        let code = `using System.ComponentModel;
using System.Runtime.CompilerServices;

public class ${className} : INotifyPropertyChanged
{
    public event PropertyChangedEventHandler PropertyChanged;

    protected virtual void OnPropertyChanged([CallerMemberName] string propertyName = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }

    // Properties
`;

        // Generate properties with backing fields
        for (const prop of properties) {
            code += `    private string _${prop};
    public string ${prop}
    {
        get => _${prop};
        set
        {
            if (_${prop} != value)
            {
                _${prop} = value;
                OnPropertyChanged();
            }
        }
    }

`;
        }

        // Generate RelayCommands for events
        for (const eventHandler of analysis.events) {
            const commandName = eventHandler.handler.replace('_', '') + 'Command';
            code += `    private RelayCommand _${commandName.toLowerCase()};
    public RelayCommand ${commandName}
    {
        get
        {
            return _${commandName.toLowerCase()} ?? (_${commandName.toLowerCase()} = new RelayCommand(() => ${eventHandler.handler}()));
        }
    }

    private void ${eventHandler.handler}()
    {
        // TODO: Implement command logic
    }

`;
        }

        code += '}\n';
        return code;
    }

    /**
     * Generate RelayCommand class
     */
    private static _generateRelayCommands(analysis: any): string {
        return `using System;
using System.Windows.Input;

public class RelayCommand : ICommand
{
    private readonly Action _execute;
    private readonly Func<bool> _canExecute;

    public RelayCommand(Action execute, Func<bool> canExecute = null)
    {
        _execute = execute ?? throw new ArgumentNullException(nameof(execute));
        _canExecute = canExecute;
    }

    public event EventHandler CanExecuteChanged
    {
        add { CommandManager.RequerySuggested += value; }
        remove { CommandManager.RequerySuggested -= value; }
    }

    public bool CanExecute(object parameter)
    {
        return _canExecute == null || _canExecute();
    }

    public void Execute(object parameter)
    {
        _execute();
    }
}
`;
    }

    /**
     * Convert XAML events to bindings
     */
    private static _convertXamlToBindings(
        xaml: string,
        analysis: {
            events: Array<{ element: string; event: string; handler: string }>;
            properties: Array<{ name: string; type: string }>;
            bindings: Array<{ element: string; property: string; path: string }>;
        }
    ): string {
        let updatedXaml = xaml;

        // Replace Click events with Command bindings
        for (const eventHandler of analysis.events) {
            if (eventHandler.event === 'Click') {
                const commandName = eventHandler.handler.replace('_', '') + 'Command';
                updatedXaml = updatedXaml.replace(
                    new RegExp(`Click="${eventHandler.handler}"`, 'g'),
                    `Command="{Binding ${commandName}}"`
                );
            }
        }

        // Add DataContext setting
        if (!updatedXaml.includes('DataContext=')) {
            updatedXaml = updatedXaml.replace(
                /<Window[^>]*>/,
                `$&\n    <Window.DataContext>\n        <local:MainViewModel />\n    </Window.DataContext>`
            );
        }

        return updatedXaml;
    }

    /**
     * Apply conversion to files
     */
    private static async _applyConversion(
        document: vscode.TextDocument,
        viewModelCode: string,
        relayCommandCode: string,
        updatedXaml: string
    ): Promise<void> {
        const folder = path.dirname(document.fileName);
        const viewModelPath = path.join(folder, 'MainViewModel.cs');
        const relayCommandPath = path.join(folder, 'RelayCommand.cs');

        // Write ViewModel
        fs.writeFileSync(viewModelPath, viewModelCode);
        
        // Write RelayCommand
        fs.writeFileSync(relayCommandPath, relayCommandCode);

        // Update XAML
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(document.getText().length)
        );
        edit.replace(document.uri, fullRange, updatedXaml);
        await vscode.workspace.applyEdit(edit);

        vscode.window.showInformationMessage('MVVM conversion completed!');
    }

    /**
     * Show preview of conversion
     */
    private static async _showPreview(
        viewModelCode: string,
        relayCommandCode: string,
        updatedXaml: string
    ): Promise<void> {
        // Create preview document
        const previewText = `// MainViewModel.cs\n\n${viewModelCode}\n\n// RelayCommand.cs\n\n${relayCommandCode}\n\n// Updated XAML\n\n${updatedXaml}`;
        
        const doc = await vscode.workspace.openTextDocument({
            content: previewText,
            language: 'csharp'
        });
        
        await vscode.window.showTextDocument(doc);
    }
}

