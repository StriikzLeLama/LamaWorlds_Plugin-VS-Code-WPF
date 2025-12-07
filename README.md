# 🚀 LamaWorlds WPF Studio PRO

**The Ultimate Visual Studio-Level WPF Development Extension for VS Code**

An extremely advanced VS Code extension that brings **Visual Studio-level WPF development features** into VS Code, plus many premium AI-powered tools, animation editor, responsive design helpers, and a component marketplace.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![VS Code](https://img.shields.io/badge/VS%20Code-1.80.0+-green)
![.NET](https://img.shields.io/badge/.NET-8.0-purple)

---

## ✨ Features Overview

### 🎯 Core WPF Development

- **WPF Project Generator** - Create .NET 8 WPF projects with MVVM structure
- **XAML Live Preview** - Real-time preview with auto-refresh
- **WPF Toolbox** - Drag & drop controls into XAML
- **Smart Navigation** - Ctrl+Click to navigate bindings, resources, events
- **XAML Refactoring** - Extract, wrap, convert, rename, generate styles
- **MVVM Power Tools** - Auto-generate ViewModels, Commands, DataTemplates
- **Resource Explorer** - Browse and preview all resources
- **Visual Tree Inspector** - Debug UI with layout metrics
- **Hot Reload** - Live reload on file changes
- **Build & Run Panel** - Integrated build, run, and packaging

### 🤖 AI-Powered Features

- **AI UI Generator** - Describe UI in natural language, get XAML + ViewModel
- **Layout Optimizer** - Analyze and optimize XAML structure
- **Auto-Fix XAML** - Automatically fix common XAML errors
- **ViewModel Generator** - Infer ViewModel from XAML bindings

### 🎬 Advanced Tools

- **Animation Editor** - Timeline-based animation editor with keyframes
- **Responsive Design Engine** - Generate responsive layouts and converters
- **Component Marketplace** - Install ready-to-use components (GlassCard, NeonButton, etc.)

---

## 📦 Installation

### Option 1: Development Mode

```bash
# Clone the repository
git clone <repository-url>
cd lamaworlds-wpf-studio-pro

# Install dependencies
npm install

# Compile
npm run compile

# Press F5 in VS Code to launch Extension Development Host
```

### Option 2: Install from VSIX

```bash
# Package the extension
npm run package

# Install in VS Code
# Extensions → ... → Install from VSIX → Select .vsix file
```

---

## 🚀 Quick Start

### 1. Create a WPF Project

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type `Lama Worlds: Create WPF Project`
3. Select project location
4. Enter project name
5. Project created with full MVVM structure!

### 2. Open XAML Preview

1. Open any `.xaml` file
2. Press `Ctrl+Shift+P` → `Lama Worlds: Open XAML Preview`
3. See live preview on the right side

### 3. Use the Toolbox

1. Press `Ctrl+Shift+P` → `Lama Worlds: Open Toolbox`
2. Click any control to insert into XAML
3. Custom Lama Worlds components available!

---

## 🎨 Feature Details

### 1️⃣ WPF Project Generator

**Command**: `Lama Worlds: Create WPF Project`

Generates complete .NET 8 WPF project with:
- MVVM folder structure (Models, ViewModels, Views)
- App.xaml with merged resource dictionaries
- MainWindow.xaml + code-behind
- Base ViewModel with INotifyPropertyChanged
- Resources/Theme.xaml with Lama Worlds neon/glass theme
- RelayCommand implementation
- Ready-to-use project structure

### 2️⃣ XAML Live Preview

**Command**: `Lama Worlds: Open XAML Preview`

- **Real-time rendering** - See changes as you type
- **Auto-refresh** - Updates on file save
- **Split view** - XAML editor (left) + Preview (right)
- **Interactive mode** - Clicks forwarded to running app
- **Screenshot fallback** - Works even when app isn't running

### 3️⃣ WPF Toolbox

**Command**: `Lama Worlds: Open Toolbox`

**Standard Controls:**
- Button, TextBox, TextBlock
- Grid, StackPanel, Border
- Image, ListView, etc.

**Lama Worlds Components:**
- **NeonButton** - Button with neon glow effect
- **GlassCard** - Glassmorphism card component
- **HoloPanel** - Holographic panel with gradient
- **Sidebar** - Navigation sidebar
- **Dashboard** - Complete dashboard layout
- **LoginPanel** - Modern login form
- **SettingsPage** - Settings page template

### 4️⃣ Smart Navigation (Ctrl+Click)

Navigate seamlessly between XAML and C#:

- **`{Binding PropertyName}`** → Opens ViewModel property
- **`{StaticResource Key}`** → Opens resource definition
- **`Click="MethodName"`** → Opens code-behind method
- **`Style="{StaticResource StyleName}"`** → Opens style resource

### 5️⃣ XAML Refactoring

**Available Commands:**
- **Extract to UserControl** - Convert selected XAML to reusable control
- **Wrap with Grid/Border/StackPanel** - Wrap selection with container
- **Convert Grid to StackPanel** - Automatic conversion
- **Rename Binding** - Updates XAML + ViewModel simultaneously
- **Generate Style** - Extract element properties into Style
- **Remove unused namespaces** - Clean up XAML

### 6️⃣ MVVM Power Tools

**Commands:**
- **New Window (MVVM)** - Creates Window + ViewModel pair
- **New UserControl** - Generates UserControl with code-behind
- **New ViewModel** - Creates ViewModel with INotifyPropertyChanged
- **Add RelayCommand** - Auto-generates RelayCommand
- **Generate DataTemplate** - Creates DataTemplate for ViewModel
- **Auto-bind ViewModel** - Links ViewModel to View

### 7️⃣ Resource Explorer

**Command**: `Lama Worlds: Open Resource Explorer`

- Browse all resources (colors, brushes, styles, images)
- Preview colors with tooltips
- Copy hex values
- Find where resources are used
- Open resource files with one click

### 8️⃣ Visual Tree Inspector

**Command**: `Lama Worlds: Open Debug Inspector`

- **Visual tree view** - See complete element hierarchy
- **Layout metrics** - Actual size, margin, padding
- **DataContext viewer** - See bound data
- **Highlight in preview** - Visual selection
- **Edit properties** - Real-time property editing

### 9️⃣ Animation Editor

**Command**: `Lama Worlds: Open Animation Editor`

- **Timeline interface** - Visual keyframe editor
- **Multiple properties** - Opacity, Transform X/Y, etc.
- **Easing functions** - Linear, EaseIn, EaseOut, Bounce, Elastic
- **Duration control** - Set animation duration
- **Preview** - See animation in real-time
- **Generate Storyboard** - Auto-generate XAML Storyboard

### 🔟 Responsive Design Engine

**Command**: `Lama Worlds: Open Responsive Design`

- **Breakpoints** - Mobile (0-600px), Tablet (601-1024px), Desktop (1025px+)
- **Responsive Grid Generator** - Generate grids for different screen sizes
- **Value Converters** - Generate responsive converters
- **Multi-size Preview** - Preview in Mobile/Tablet/Desktop sizes

### 1️⃣1️⃣ AI Features

#### AI UI Generator
**Command**: `Lama Worlds: AI Generate UI`

Describe your UI in natural language:
```
"Create a settings page with neon buttons and two sections"
```

Generates:
- Complete XAML structure
- ViewModel with properties and commands
- Bindings
- Styles

#### Layout Optimizer
**Command**: `Lama Worlds: AI Optimize Layout`

Analyzes XAML and suggests:
- Reduce nesting levels
- Remove empty containers
- Simplify layouts
- Optimize bindings

#### Auto-Fix XAML
**Command**: `Lama Worlds: AI Auto-Fix XAML`

Automatically fixes:
- Missing namespaces
- Invalid bindings
- Broken resource keys
- Common syntax errors

#### ViewModel Generator
**Command**: `Lama Worlds: AI Generate ViewModel from XAML`

Infers from XAML:
- Required properties
- Commands
- INotifyPropertyChanged implementation

### 1️⃣2️⃣ Component Marketplace

**Command**: `Lama Worlds: Open Component Marketplace`

**Available Components:**
- **GlassCard** - Glassmorphism card
- **NeonButton** - Neon glow button
- **HoloPanel** - Holographic panel
- **Sidebar** - Navigation sidebar
- **Dashboard** - Dashboard layout
- **LoginPanel** - Login form
- **SettingsPage** - Settings page

**Features:**
- One-click installation
- Preview before install
- Auto-generates ViewModel if needed

### 1️⃣3️⃣ Build & Run Panel

**Command**: `Lama Worlds: Open Run & Build Panel`

**Features:**
- **Build** - Compile WPF project
- **Run** - Run application
- **Clean** - Clean build artifacts
- **Package (EXE)** - Create single-file executable
- **Package (MSI)** - Create MSI installer
- **Publish** - Publish for distribution
- **Integrated logs** - See build output in real-time

### 1️⃣4️⃣ Snippets

**XAML Snippets:**
- `window` - WPF Window template
- `usercontrol` - UserControl template
- `page` - Page template
- `grid` - Grid layout
- `gridrc` - Grid with rows/columns
- `stackpanel` - StackPanel
- `neonbtn` - Neon Button
- `glasscard` - Glass Card
- `holopanel` - Holographic Panel
- `datatemplate` - DataTemplate
- `style` - Style definition

**C# Snippets:**
- `viewmodel` - ViewModel class
- `propvm` - ViewModel property
- `cmd` - RelayCommand
- `cmdcan` - RelayCommand with CanExecute
- `service` - Service class
- `inpc` - INotifyPropertyChanged

---

## 🎨 Lama Worlds Theme

The extension includes a beautiful neon/glass theme:

- **Background**: `#0b1d2a` / `#0e2435`
- **Glow Colors**: Cyan (`#56b0ff`, `#00ffff`)
- **Borders**: Translucent with glow
- **Glass Panels**: Blur effect with transparency
- **Neon Effects**: Hover animations with glow

All components use this theme by default!

---

## ⚙️ Configuration

Add to your `settings.json`:

```json
{
    "lamaworlds.wpf.previewAutoRefresh": true,
    "lamaworlds.wpf.hotReloadEnabled": true,
    "lamaworlds.wpf.previewPort": 8080
}
```

---

## 📁 Project Structure

```
lamaworlds-wpf-studio-pro/
├── src/
│   ├── extension.ts              # Main entry point
│   ├── panels/                   # WebView panels
│   │   ├── XamlPreviewPanel.ts
│   │   ├── ToolboxPanel.ts
│   │   ├── ResourceExplorerPanel.ts
│   │   ├── DebugInspectorPanel.ts
│   │   ├── RunPanel.ts
│   │   ├── AnimationEditorPanel.ts
│   │   ├── ResponsiveDesignPanel.ts
│   │   └── ComponentMarketplacePanel.ts
│   ├── services/                 # Core services
│   │   ├── XamlRefactoring.ts
│   │   ├── XamlNavigation.ts
│   │   ├── HotReloadEngine.ts
│   │   ├── ProjectCreator.ts
│   │   └── MvvmTools.ts
│   └── ai/                       # AI features
│       └── AIFeatures.ts
├── snippets/                     # Code snippets
│   ├── xaml.json
│   └── csharp.json
├── templates/                    # Project templates
│   ├── wpf-project/
│   ├── window/
│   ├── usercontrol/
│   └── viewmodel/
├── package.json
└── README.md
```

---

## 🎯 Usage Examples

### Generate UI with AI

1. Open a XAML file
2. Press `Ctrl+Shift+P` → `Lama Worlds: AI Generate UI`
3. Describe: "Create a login form with username, password, and submit button"
4. XAML and ViewModel are generated automatically!

### Create Animation

1. Press `Ctrl+Shift+P` → `Lama Worlds: Open Animation Editor`
2. Add keyframes on timeline
3. Set easing function
4. Click "Generate Storyboard"
5. Storyboard XAML is inserted!

### Install Component

1. Press `Ctrl+Shift+P` → `Lama Worlds: Open Component Marketplace`
2. Browse components
3. Click "Preview" to see it
4. Click "Install" to add to your XAML

### Optimize Layout

1. Open XAML file
2. Right-click → `Lama Worlds: AI Optimize Layout`
3. Review suggestions
4. Apply fixes automatically

---

## 🐛 Troubleshooting

### Preview Not Showing

- Ensure a `.xaml` file is open
- Check that file is valid XAML
- Try manually opening: `Lama Worlds: Open XAML Preview`

### Hot Reload Not Working

- Ensure .NET SDK is installed: `dotnet --version`
- Check that you're in a WPF project folder
- Verify `.csproj` file exists

### AI Features Not Working

- AI features use local analysis (no external API required)
- Ensure XAML file is valid
- Check output panel for errors

### Build Errors

- Ensure .NET 8 SDK is installed
- Run `dotnet restore` in project folder
- Check project file for errors

---

## 📝 Requirements

- **VS Code** 1.80.0 or higher
- **.NET 8 SDK** (for WPF development)
- **Windows** (WPF is Windows-only)
- **Node.js** (for building extension)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

MIT License

---

## 👨‍💻 Author

**Lama Worlds** - Advanced WPF Development Tools

---

## 🌟 Features Comparison

| Feature | Visual Studio | Lama Worlds WPF Studio PRO |
|---------|--------------|---------------------------|
| XAML Designer | ✅ | ✅ (Live Preview) |
| Toolbox | ✅ | ✅ (Enhanced) |
| MVVM Tools | ✅ | ✅ (AI-Powered) |
| Resource Explorer | ✅ | ✅ (Enhanced) |
| Debug Inspector | ✅ | ✅ (Visual Tree) |
| Animation Editor | ❌ | ✅ (Timeline) |
| Responsive Design | ❌ | ✅ (Engine) |
| AI UI Generator | ❌ | ✅ |
| Component Marketplace | ❌ | ✅ |
| Hot Reload | ✅ | ✅ (Enhanced) |

---

**Made with ❤️ for the WPF development community**

*Bringing Visual Studio-level WPF development to VS Code, plus much more!*