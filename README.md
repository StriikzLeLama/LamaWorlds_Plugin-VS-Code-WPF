# 🚀 LamaWorlds WPF Studio

**The Ultimate Visual Studio-Level WPF Development Extension for VS Code**

An extremely advanced VS Code extension that brings **Visual Studio-level WPF development features** into VS Code, plus many premium AI-powered tools, interactive designer, animation editor, responsive design helpers, and a component marketplace.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![VS Code](https://img.shields.io/badge/VS%20Code-1.80.0+-green)
![.NET](https://img.shields.io/badge/.NET-8.0-purple)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features Overview

### 🎯 Core WPF Development

- **WPF Project Generator** - Create .NET 8 WPF projects with MVVM structure
- **🆕 Interactive WPF Designer** - Full drag & drop designer with live preview, resize handles, and element selection
- **XAML Live Preview** - Real-time preview with WPF renderer engine
- **WPF Toolbox** - Drag & drop controls into XAML
- **Smart Navigation** - Ctrl+Click to navigate bindings, resources, events
- **XAML Refactoring** - Extract, wrap, convert, rename, generate styles
- **MVVM Power Tools** - Auto-generate ViewModels, Commands, DataTemplates
- **Resource Explorer** - Browse and preview all resources
- **🆕 Visual Tree Inspector** - Deep XAML tree parsing with node selection and property inspection
- **Hot Reload** - Live reload on file changes
- **Build & Run Panel** - Integrated build, run, and packaging

### 🤖 AI-Powered Features

- **AI UI Generator** - Describe UI in natural language, get XAML + ViewModel
- **🆕 AI Auto-Layout Engine** - Figma Magic Layout style suggestions (reduce nesting, normalize margins, Grid→StackPanel)
- **Layout Optimizer** - Analyze and optimize XAML structure
- **Auto-Fix XAML** - Automatically fix common XAML errors
- **ViewModel Generator** - Infer ViewModel from XAML bindings

### 🎬 Advanced Tools

- **Animation Editor** - Timeline-based animation editor with keyframes (After Effects-like)
- **🆕 Responsive Preview Panel** - Multi-size previews (Mobile 375x812, Tablet 768x1024, Desktop 1366x768)
- **Responsive Design Engine** - Generate responsive layouts and converters
- **🆕 WPF Blend Clone** - Visual States and Triggers editor
- **🆕 C# Execution Sandbox** - Real-time code-behind simulator for event handlers
- **Component Marketplace** - Install ready-to-use components (GlassCard, NeonButton, etc.)

---

## ⚠️ Note Importante - Preview Engine

Le preview engine utilise un renderer WPF .NET 8 qui communique via stdin/stdout. 

**Temps d'initialisation** :
- **Première utilisation** : 1-2 minutes (build du renderer)
- **Utilisations suivantes** : 2-5 secondes

**Si vous voyez "Render timeout"** :
- Vérifiez que .NET 8 SDK est installé
- Consultez le Debug Inspector pour les logs détaillés
- Le fallback affiche un placeholder si le renderer ne répond pas

Voir `PREVIEW_ENGINE_TROUBLESHOOTING.md` pour plus de détails.

---

## 📦 Installation

### Option 1: Development Mode

```bash
# Clone the repository
git clone <repository-url>
cd lamaworlds-wpf-studio

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

### 2. Open Interactive XAML Preview

1. Open any `.xaml` file
2. Press `Ctrl+Shift+P` → `Lama Worlds: Open XAML Preview`
3. See live preview with drag & drop, resize handles, and element selection!

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

### 2️⃣ 🆕 Interactive WPF Designer

**Command**: `Lama Worlds: Open XAML Preview`

**Revolutionary Features:**
- **Real-time WPF Rendering** - Uses .NET 8 WPF renderer engine for pixel-perfect preview
- **Drag & Drop Repositioning** - Click and drag elements to reposition them
- **Resize Handles** - 8 resize handles (corners + edges) around selected elements
- **Element Selection** - Click any element in preview to select and highlight
- **Live XAML Updates** - XAML automatically updates when dragging/resizing
- **Smart Grid Snapping** - Auto-detects Grid cells and snaps elements
- **Margin/Padding Guides** - Visual guides showing layout spacing
- **Two Rendering Modes**:
  - **FastLive** - Instant preview using XamlReader.Load
  - **FullBuild** - Complete project build and run

**How it works:**
- WPF renderer executable (`preview-engine/renderer/`) captures UI as PNG
- JSON message bridge between VS Code ↔ Renderer
- Visual tree parser maps coordinates to elements for hit testing
- Interactive controllers handle drag, resize, and selection

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

### 8️⃣ 🆕 Visual Tree Inspector

**Command**: `Lama Worlds: Open Visual Tree Inspector`

**Advanced Features:**
- **Deep XAML Tree Parsing** - Complete element hierarchy visualization
- **Node Selection** - Click any node to inspect properties
- **Preview Synchronization** - Selection in inspector highlights element in preview
- **Property Inspector** - View bounds, margin, padding, Grid position, Canvas position
- **Jump to XAML** - Instantly navigate to element in XAML editor
- **DataContext & Bindings** - Inspect bound data and bindings
- **Margin/Padding Visual Debugging** - Visual guides for layout debugging

### 9️⃣ Animation Editor (After Effects-like)

**Command**: `Lama Worlds: Open Animation Editor`

- **Timeline Interface** - Visual keyframe editor with ruler
- **Drag Keyframes** - Click and drag keyframes on timeline
- **Multiple Properties** - Animate Opacity, Transform X/Y, Colors, Margins
- **Easing Curves** - Linear, EaseIn, EaseOut, EaseInOut, Bounce, Elastic
- **Duration Control** - Set animation duration
- **Preview** - See animation in real-time in preview renderer
- **Generate Storyboard** - Auto-generate XAML Storyboard code

### 🔟 🆕 Responsive Preview Panel

**Command**: `Lama Worlds: Open Responsive Design`

**Multi-Size Previews:**
- **Mobile** - 375x812 (iPhone standard)
- **Tablet** - 768x1024 (iPad standard)
- **Desktop** - 1366x768 (Standard desktop)
- **Custom Sizes** - Input custom width/height

**Features:**
- **Real-time Rendering** - Each size renders independently
- **Breakpoint Management** - Define custom breakpoints
- **Responsive Grid Generator** - Generate grids for different screen sizes
- **Value Converters** - Generate responsive converters
- **Side-by-Side Comparison** - Compare layouts across sizes

### 1️⃣1️⃣ 🆕 AI Auto-Layout Engine (Figma Magic Layout Style)

**Command**: `Lama Worlds: Open AI Auto-Layout`

**Intelligent Suggestions:**
- **Reduce Nesting** - Detects excessive nesting levels and suggests flattening
- **Normalize Margins** - Finds inconsistent margins and suggests standardization
- **Remove Unnecessary Panels** - Identifies single-child panels that can be removed
- **Grid → StackPanel** - Suggests converting simple Grids to StackPanel
- **Auto-Alignment** - Detects alignment opportunities
- **Before/After Diff** - Visual comparison of changes

**How it works:**
- Analyzes XAML structure using AST-level parsing
- Applies best practices and design patterns
- One-click apply suggestions
- Batch apply all suggestions

### 1️⃣2️⃣ 🆕 WPF Blend Clone (Visual States Editor)

**Command**: `Lama Worlds: Open Visual States Editor`

**Full Visual States Management:**
- **Create Visual States** - Define Normal, MouseOver, Pressed, Disabled states
- **State Transitions** - Configure smooth transitions between states
- **Triggers** - EventTrigger, DataTrigger, PropertyTrigger
- **Interactions** - Define interaction behaviors
- **State Animations** - Animate properties during state changes
- **Generate XAML** - Auto-generate VisualStateManager XAML

### 1️⃣3️⃣ 🆕 C# Execution Sandbox

**Real-time Code-Behind Simulator:**
- **Secure Sandbox** - Isolated .NET 8 console sandbox for code execution
- **Event Handler Simulation** - Test event handlers without running full app
- **Binding Simulation** - Simulate bindings and data updates
- **Logs & Exceptions** - Real-time logs and exception handling
- **Return Results** - Get execution results back to VS Code

### 1️⃣4️⃣ AI Features

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

### 1️⃣5️⃣ Component Marketplace

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

### 1️⃣6️⃣ Build & Run Panel

**Command**: `Lama Worlds: Open Run & Build Panel`

**Features:**
- **Build** - Compile WPF project
- **Run** - Run application
- **Clean** - Clean build artifacts
- **Package (EXE)** - Create single-file executable
- **Package (MSI)** - Create MSI installer
- **Publish** - Publish for distribution
- **Integrated logs** - See build output in real-time

### 1️⃣7️⃣ Snippets

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
lamaworlds-wpf-studio/
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
│   ├── preview/                  # Preview engine
│   │   └── previewEngine.ts
│   ├── inspector/                # Visual tree inspector
│   │   ├── inspectorPanel.ts
│   │   ├── treeParser.ts
│   │   └── highlightManager.ts
│   ├── interactive/              # Interactive designer
│   │   ├── dragController.ts
│   │   └── resizeController.ts
│   ├── ai/                       # AI features
│   │   ├── AIFeatures.ts
│   │   ├── autoLayout.ts
│   │   └── autoLayoutPanel.ts
│   ├── blend/                    # Visual States editor
│   │   └── blendPanel.ts
│   ├── responsive/               # Responsive manager
│   │   └── responsiveManager.ts
│   ├── sandbox/                  # C# sandbox
│   │   └── sandboxManager.ts
│   ├── services/                 # Core services
│   │   ├── XamlRefactoring.ts
│   │   ├── XamlNavigation.ts
│   │   ├── HotReloadEngine.ts
│   │   ├── ProjectCreator.ts
│   │   └── MvvmTools.ts
│   └── utils/                    # Utilities
│       ├── PathHelper.ts
│       └── XamlParser.ts
├── preview-engine/               # WPF renderer
│   └── renderer/
│       ├── Renderer.csproj
│       ├── RendererWindow.xaml
│       └── RendererWindow.xaml.cs
├── sandbox-engine/               # C# sandbox
│   ├── Sandbox.csproj
│   └── Program.cs
├── webviews/                     # WebView UIs
│   ├── preview/
│   ├── inspector/
│   ├── aiLayout/
│   ├── blend/
│   └── responsive/
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

### Use Interactive Designer

1. Open a `.xaml` file
2. Press `Ctrl+Shift+P` → `Lama Worlds: Open XAML Preview`
3. Click any element in preview to select it
4. Drag to reposition or use resize handles to resize
5. XAML updates automatically!

### Generate UI with AI

1. Open a XAML file
2. Press `Ctrl+Shift+P` → `Lama Worlds: AI Generate UI`
3. Describe: "Create a login form with username, password, and submit button"
4. XAML and ViewModel are generated automatically!

### Use AI Auto-Layout

1. Open XAML file
2. Press `Ctrl+Shift+P` → `Lama Worlds: Open AI Auto-Layout`
3. Click "Analyze XAML"
4. Review suggestions and apply them one by one or all at once

### Create Animation

1. Press `Ctrl+Shift+P` → `Lama Worlds: Open Animation Editor`
2. Add keyframes on timeline
3. Set easing function
4. Click "Generate Storyboard"
5. Storyboard XAML is inserted!

### Inspect Visual Tree

1. Press `Ctrl+Shift+P` → `Lama Worlds: Open Visual Tree Inspector`
2. Browse element hierarchy
3. Click any element to see properties
4. Click "Jump to XAML" to navigate to element

### Preview Responsive Layouts

1. Press `Ctrl+Shift+P` → `Lama Worlds: Open Responsive Design`
2. Select Mobile/Tablet/Desktop size
3. See real-time preview for each size

---

## 🐛 Troubleshooting

### Preview Not Showing

- Ensure a `.xaml` file is open
- Check that file is valid XAML
- Try manually opening: `Lama Worlds: Open XAML Preview`
- Renderer will auto-build on first use

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

### Renderer Not Building

- Ensure .NET 8 SDK is installed
- Check that `preview-engine/renderer/` folder exists
- Extension will auto-build renderer on first use

---

## 📝 Requirements

- **VS Code** 1.80.0 or higher
- **.NET 8 SDK** (for WPF development and renderer)
- **Windows** (WPF is Windows-only)
- **Node.js** (for building extension)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 💝 Support the Project

This extension is **100% free and open-source**. If you find it useful, consider supporting the project:

- **[GitHub Sponsors](https://github.com/sponsors/lamaworlds)** - Support ongoing development
- **[Ko-fi](https://ko-fi.com/striikzlelama)** - Buy me a coffee ☕

Your support helps maintain and improve this extension! 🙏

---

## 📄 License

MIT License - Free and open-source forever

---

## 👨‍💻 Author

**Lama Worlds** - Advanced WPF Development Tools

---

## 🌟 Features Comparison

| Feature | Visual Studio | Lama Worlds WPF Studio |
|---------|--------------|---------------------------|
| XAML Designer | ✅ | ✅ (Interactive Designer) |
| Drag & Drop | ✅ | ✅ (Enhanced) |
| Resize Handles | ✅ | ✅ |
| Visual Tree Inspector | ✅ | ✅ (Enhanced) |
| Toolbox | ✅ | ✅ (Enhanced) |
| MVVM Tools | ✅ | ✅ (AI-Powered) |
| Resource Explorer | ✅ | ✅ (Enhanced) |
| Debug Inspector | ✅ | ✅ (Visual Tree) |
| Animation Editor | ❌ | ✅ (Timeline) |
| Responsive Design | ❌ | ✅ (Multi-Size Preview) |
| AI UI Generator | ❌ | ✅ |
| AI Auto-Layout | ❌ | ✅ (Figma Style) |
| Visual States Editor | ✅ | ✅ (Blend Clone) |
| C# Sandbox | ❌ | ✅ |
| Component Marketplace | ❌ | ✅ |
| Hot Reload | ✅ | ✅ (Enhanced) |

---

**Made with ❤️ for the WPF development community**

*Bringing Visual Studio-level WPF development to VS Code, plus much more!*
