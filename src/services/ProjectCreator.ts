import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class ProjectCreator {
    constructor(private context: vscode.ExtensionContext) {}

    async createWpfProject(parentPath: string, projectName: string) {
        const projectPath = path.join(parentPath, projectName);

        if (fs.existsSync(projectPath)) {
            throw new Error(`Directory ${projectPath} already exists.`);
        }

        fs.mkdirSync(projectPath, { recursive: true });

        // Create project structure
        const viewsPath = path.join(projectPath, 'Views');
        const viewModelsPath = path.join(projectPath, 'ViewModels');
        const modelsPath = path.join(projectPath, 'Models');
        const resourcesPath = path.join(projectPath, 'Resources');
        const commandsPath = path.join(projectPath, 'Commands');

        fs.mkdirSync(viewsPath, { recursive: true });
        fs.mkdirSync(viewModelsPath, { recursive: true });
        fs.mkdirSync(modelsPath, { recursive: true });
        fs.mkdirSync(resourcesPath, { recursive: true });
        fs.mkdirSync(commandsPath, { recursive: true });

        // Create .csproj file
        const csprojContent = `<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>net8.0-windows</TargetFramework>
    <Nullable>enable</Nullable>
    <UseWPF>true</UseWPF>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

</Project>`;

        fs.writeFileSync(path.join(projectPath, `${projectName}.csproj`), csprojContent);

        // Create App.xaml
        const appXaml = `<Application x:Class="${projectName}.App"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             StartupUri="MainWindow.xaml">
    <Application.Resources>
        <ResourceDictionary>
            <ResourceDictionary.MergedDictionaries>
                <ResourceDictionary Source="Resources/Theme.xaml"/>
            </ResourceDictionary.MergedDictionaries>
        </ResourceDictionary>
    </Application.Resources>
</Application>`;

        fs.writeFileSync(path.join(projectPath, 'App.xaml'), appXaml);

        // Create App.xaml.cs
        const appCs = `namespace ${projectName};

public partial class App : Application
{
}`;

        fs.writeFileSync(path.join(projectPath, 'App.xaml.cs'), appCs);

        // Create MainWindow.xaml
        const mainWindowXaml = `<Window x:Class="${projectName}.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:d="http://schemas.microsoft.com/expression/blend/2008"
        xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
        xmlns:local="clr-namespace:${projectName}"
        mc:Ignorable="d"
        Title="MainWindow" Height="450" Width="800">
    <Grid>
        <TextBlock Text="Welcome to Lama Worlds WPF Studio!" 
                   HorizontalAlignment="Center" 
                   VerticalAlignment="Center"
                   FontSize="24"
                   Foreground="{StaticResource PrimaryBrush}"/>
    </Grid>
</Window>`;

        fs.writeFileSync(path.join(projectPath, 'MainWindow.xaml'), mainWindowXaml);

        // Create MainWindow.xaml.cs
        const mainWindowCs = `using System.Windows;

namespace ${projectName};

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
    }
}`;

        fs.writeFileSync(path.join(projectPath, 'MainWindow.xaml.cs'), mainWindowCs);

        // Create MainViewModel
        const mainViewModel = `using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace ${projectName}.ViewModels;

public class MainViewModel : INotifyPropertyChanged
{
    public event PropertyChangedEventHandler? PropertyChanged;

    protected virtual void OnPropertyChanged([CallerMemberName] string? propertyName = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }
}`;

        fs.writeFileSync(path.join(viewModelsPath, 'MainViewModel.cs'), mainViewModel);

        // Create RelayCommand
        const relayCommand = `using System.Windows.Input;

namespace ${projectName}.Commands;

public class RelayCommand : ICommand
{
    private readonly Action<object?> _execute;
    private readonly Func<object?, bool>? _canExecute;

    public RelayCommand(Action<object?> execute, Func<object?, bool>? canExecute = null)
    {
        _execute = execute ?? throw new ArgumentNullException(nameof(execute));
        _canExecute = canExecute;
    }

    public event EventHandler? CanExecuteChanged
    {
        add { CommandManager.RequerySuggested += value; }
        remove { CommandManager.RequerySuggested -= value; }
    }

    public bool CanExecute(object? parameter)
    {
        return _canExecute?.Invoke(parameter) ?? true;
    }

    public void Execute(object? parameter)
    {
        _execute(parameter);
    }
}`;

        fs.writeFileSync(path.join(commandsPath, 'RelayCommand.cs'), relayCommand);

        // Create Theme.xaml with Lama Worlds neon/glass theme
        const themeXaml = `<ResourceDictionary xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
                    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">
    
    <!-- Colors -->
    <Color x:Key="PrimaryColor">#667eea</Color>
    <Color x:Key="SecondaryColor">#764ba2</Color>
    <Color x:Key="AccentColor">#f093fb</Color>
    <Color x:Key="GlassBackgroundColor">#1AFFFFFF</Color>
    <Color x:Key="TextPrimaryColor">#FFFFFF</Color>
    <Color x:Key="TextSecondaryColor">#CCCCCC</Color>
    
    <!-- Brushes -->
    <SolidColorBrush x:Key="PrimaryBrush" Color="{StaticResource PrimaryColor}"/>
    <SolidColorBrush x:Key="SecondaryBrush" Color="{StaticResource SecondaryColor}"/>
    <SolidColorBrush x:Key="AccentBrush" Color="{StaticResource AccentColor}"/>
    <SolidColorBrush x:Key="GlassBackgroundBrush" Color="{StaticResource GlassBackgroundColor}"/>
    <SolidColorBrush x:Key="TextPrimaryBrush" Color="{StaticResource TextPrimaryColor}"/>
    <SolidColorBrush x:Key="TextSecondaryBrush" Color="{StaticResource TextSecondaryColor}"/>
    
    <!-- Gradient Brushes -->
    <LinearGradientBrush x:Key="NeonGradientBrush" StartPoint="0,0" EndPoint="1,1">
        <GradientStop Color="{StaticResource PrimaryColor}" Offset="0"/>
        <GradientStop Color="{StaticResource SecondaryColor}" Offset="1"/>
    </LinearGradientBrush>
    
    <!-- Styles -->
    <Style x:Key="NeonButton" TargetType="Button">
        <Setter Property="Background" Value="{StaticResource NeonGradientBrush}"/>
        <Setter Property="Foreground" Value="White"/>
        <Setter Property="BorderThickness" Value="0"/>
        <Setter Property="Padding" Value="15,8"/>
        <Setter Property="FontSize" Value="14"/>
        <Setter Property="FontWeight" Value="SemiBold"/>
        <Setter Property="Cursor" Value="Hand"/>
        <Setter Property="Template">
            <Setter.Value>
                <ControlTemplate TargetType="Button">
                    <Border Background="{TemplateBinding Background}"
                            CornerRadius="5"
                            Padding="{TemplateBinding Padding}">
                        <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
                    </Border>
                </ControlTemplate>
            </Setter.Value>
        </Setter>
        <Style.Triggers>
            <Trigger Property="IsMouseOver" Value="True">
                <Setter Property="Opacity" Value="0.9"/>
            </Trigger>
        </Style.Triggers>
    </Style>
    
    <Style x:Key="GlassCard" TargetType="Border">
        <Setter Property="Background" Value="{StaticResource GlassBackgroundBrush}"/>
        <Setter Property="BorderBrush" Value="#33FFFFFF"/>
        <Setter Property="BorderThickness" Value="1"/>
        <Setter Property="CornerRadius" Value="10"/>
        <Setter Property="Padding" Value="15"/>
    </Style>
    
    <Style x:Key="Header1" TargetType="TextBlock">
        <Setter Property="FontSize" Value="24"/>
        <Setter Property="FontWeight" Value="Bold"/>
        <Setter Property="Foreground" Value="{StaticResource TextPrimaryBrush}"/>
    </Style>
    
</ResourceDictionary>`;

        fs.writeFileSync(path.join(resourcesPath, 'Theme.xaml'), themeXaml);

        // Try to restore packages
        try {
            await execAsync(`dotnet restore "${path.join(projectPath, `${projectName}.csproj`)}"`);
        } catch (error) {
            // Ignore restore errors, user can restore manually
        }
    }
}
