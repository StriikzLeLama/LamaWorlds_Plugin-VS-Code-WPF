# Installation Guide

## Prerequisites

1. **VS Code** 1.80.0 or higher
2. **Node.js** (for building the extension)
3. **.NET 8 SDK** (for WPF development)
4. **TypeScript** (will be installed via npm)

## Quick Start

### Option 1: Development Mode

1. Clone or download this repository
2. Open the folder in VS Code
3. Open terminal and run:
   ```bash
   npm install
   ```
4. Press `F5` to launch the Extension Development Host
5. In the new VS Code window, test the extension

### Option 2: Package and Install

1. Install dependencies:
   ```bash
   npm install
   ```

2. Compile TypeScript:
   ```bash
   npm run compile
   ```

3. Package the extension:
   ```bash
   npm run package
   ```

4. Install the `.vsix` file:
   - Open VS Code
   - Go to Extensions view (`Ctrl+Shift+X`)
   - Click the `...` menu
   - Select "Install from VSIX..."
   - Choose the generated `.vsix` file

## First Use

1. Open VS Code
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type `Lama Worlds: Create WPF Project`
4. Follow the prompts to create your first WPF project

## Troubleshooting

### TypeScript Errors

If you see TypeScript errors about missing modules:
- Run `npm install` to ensure all dependencies are installed
- The `@types/vscode` package provides VS Code API types
- The `@types/node` package provides Node.js types

### Extension Not Loading

- Check VS Code version (requires 1.80.0+)
- Check the Output panel for errors
- Try reloading the window (`Ctrl+R` or `Cmd+R`)

### Hot Reload Not Working

- Ensure .NET SDK is installed: `dotnet --version`
- Check that you're in a WPF project folder
- Verify the `.csproj` file exists

### Preview Not Showing

- Ensure a `.xaml` file is open
- Check that the file is a valid XAML file
- Try manually opening the preview: `Lama Worlds: Open XAML Preview`

## Building from Source

```bash
# Install dependencies
npm install

# Watch mode (auto-compile on changes)
npm run watch

# One-time compile
npm run compile

# Package for distribution
npm run package
```

## Development

The extension structure:
- `src/extension.ts` - Main entry point
- `src/panels/` - WebView panels (Preview, Toolbox, etc.)
- `src/services/` - Core functionality (Refactoring, Navigation, etc.)
- `snippets/` - Code snippets for XAML and C#

## Next Steps

After installation:
1. Create a WPF project
2. Open a `.xaml` file
3. Try the XAML Preview
4. Explore the Toolbox
5. Test navigation (Ctrl+Click on bindings)
6. Try refactoring commands

Enjoy developing WPF applications in VS Code! 🚀
