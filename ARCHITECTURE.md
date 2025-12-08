# LamaWorlds WPF Studio - Architecture

## Folder Structure

```
extension/
├── src/
│   ├── extension.ts                    ✅ Main entry point
│   ├── commands/
│   │   └── CommandRegistry.ts         ✅ Command registry
│   ├── panels/                         ✅ All webview panels
│   │   ├── XamlPreviewPanel.ts
│   │   ├── ToolboxPanel.ts
│   │   ├── ResourceExplorerPanel.ts
│   │   ├── DebugInspectorPanel.ts
│   │   ├── RunPanel.ts
│   │   ├── AnimationEditorPanel.ts
│   │   ├── ResponsiveDesignPanel.ts
│   │   ├── ComponentMarketplacePanel.ts
│   │   ├── CommandPalettePanel.ts
│   │   ├── StyleEditorPanel.ts        ✅ NEW
│   │   ├── PerformanceProfilerPanel.ts ✅ NEW
│   │   ├── BindingDebuggerPanel.ts    ✅ NEW
│   │   ├── AccessibilityCheckerPanel.ts ✅ NEW
│   │   ├── NavigationGraphPanel.ts    ✅ NEW
│   │   └── ThemeManagerPanel.ts       ✅ NEW
│   ├── designer/                       ✅ NEW - Advanced Designer
│   │   ├── snapping/
│   │   │   └── snappingEngine.ts
│   │   ├── gridGenerator/
│   │   │   └── gridGenerator.ts
│   │   ├── rulers/
│   │   │   └── rulersManager.ts
│   │   └── resizeLogic/
│   │       └── resizeControllerV2.ts
│   ├── styles/                         ✅ NEW - Style Management
│   ├── templates/                      ✅ NEW - Template Designer
│   ├── resources/                      ✅ NEW - Resource Explorer
│   ├── animation/                      ✅ NEW - Animation V2
│   │   ├── curves/
│   │   └── recorder/
│   ├── states/                         ✅ NEW - Visual States
│   │   └── stateManager.ts
│   ├── performance/                    ✅ NEW - Performance
│   │   └── profiler.ts
│   ├── bindings/                       ✅ NEW - Binding Debug
│   │   └── bindingInspector.ts
│   ├── accessibility/                  ✅ NEW - Accessibility
│   │   └── checker.ts
│   ├── navigation/                     ✅ NEW - Navigation Graph
│   │   └── graphBuilder.ts
│   ├── converters/                     ✅ NEW - Framework Converters
│   │   ├── wpfToAvalonia.ts
│   │   ├── wpfToMaui.ts
│   │   └── wpfToWinUI.ts
│   ├── hotreload/                      ✅ NEW - Hot Reload V3
│   │   └── reloader.ts
│   ├── csharp/                         ✅ NEW - Live C# Injection
│   │   └── liveRunner.ts
│   ├── themes/                         ✅ NEW - Theme Manager
│   │   └── themeManager.ts
│   ├── ai/                             ✅ AI Features
│   │   ├── AIFeatures.ts
│   │   ├── autoLayout.ts
│   │   ├── autoLayoutPanel.ts
│   │   └── xamlRefactor.ts            ✅ NEW
│   ├── mvvm/
│   │   ├── ProjectCreator.ts
│   │   ├── MvvmTools.ts
│   │   └── wizard.ts                  ✅ NEW
│   ├── preview/
│   │   └── previewEngine.ts
│   ├── inspector/
│   │   ├── inspectorPanel.ts
│   │   ├── treeParser.ts
│   │   └── highlightManager.ts
│   ├── interactive/
│   │   ├── dragController.ts
│   │   └── resizeController.ts
│   ├── nuget/                          ✅ NuGet Management
│   │   ├── logChannel.ts
│   │   ├── projectScanner.ts
│   │   ├── restore.ts
│   │   ├── manager.ts
│   │   └── autoRestore.ts
│   ├── services/
│   │   ├── XamlRefactoring.ts
│   │   ├── XamlNavigation.ts
│   │   ├── HotReloadEngine.ts
│   │   ├── DebugConsole.ts            ✅ Enhanced
│   │   ├── PerformanceMonitor.ts
│   │   └── AIService.ts
│   └── utils/
│       ├── PathHelper.ts
│       ├── XamlParser.ts
│       ├── Cache.ts
│       ├── Debouncer.ts
│       └── logger.ts                  ✅ NEW
├── webviews/
│   ├── preview/
│   │   └── preview.html               ⏳ To create
│   ├── toolbox/
│   │   └── toolbox.html               ⏳ To create
│   ├── inspector/
│   │   ├── resource-explorer.html     ⏳ To create
│   │   └── debug-inspector.html       ⏳ To create
│   ├── animator/
│   │   └── animation-editor.html      ⏳ To create
│   └── responsive/
│       └── responsive-design.html    ⏳ To create
├── templates/
│   ├── project/
│   │   ├── App.xaml                   ⏳ To create
│   │   ├── App.xaml.cs                 ⏳ To create
│   │   ├── MainWindow.xaml            ⏳ To create
│   │   ├── MainWindow.xaml.cs         ⏳ To create
│   │   └── RelayCommand.cs            ⏳ To create
│   ├── window/
│   │   ├── Window.xaml                ⏳ To create
│   │   └── Window.xaml.cs             ⏳ To create
│   ├── usercontrol/
│   │   ├── UserControl.xaml           ⏳ To create
│   │   └── UserControl.xaml.cs        ⏳ To create
│   ├── viewmodel/
│   │   └── ViewModel.cs               ⏳ To create
│   ├── resources/
│   │   └── Theme.xaml                 ⏳ To create
│   ├── components/
│   │   ├── NeonButton.xaml            ⏳ To create
│   │   ├── GlassCard.xaml             ⏳ To create
│   │   └── HoloPanel.xaml             ⏳ To create
│   └── styles/
│       └── Styles.xaml                ⏳ To create
├── snippets/
│   ├── xaml.json                      ✅ Exists
│   └── csharp.json                    ✅ Exists
├── media/
│   ├── icons/
│   └── css/
│       └── lama-worlds-theme.css      ⏳ To create
├── package.json                       ✅ Exists (needs update)
└── README.md                          ✅ Exists (needs update)
```

## Status

- ✅ = Created
- ⏳ = To create

**Dernière mise à jour** : 2025-12-07

### ✅ Fichiers Créés

#### Core
- ✅ src/extension.ts (60+ commands registered)
- ✅ src/commands/CommandRegistry.ts
- ✅ src/utils/PathHelper.ts
- ✅ src/utils/XamlParser.ts
- ✅ src/utils/Cache.ts
- ✅ src/utils/Debouncer.ts
- ✅ src/utils/logger.ts ✅ NEW

#### Services (Enhanced)
- ✅ src/services/XamlRefactoring.ts
- ✅ src/services/XamlNavigation.ts
- ✅ src/services/HotReloadEngine.ts
- ✅ src/services/DebugConsole.ts ✅ ENHANCED (structured logging, performance tracking, export)
- ✅ src/services/PerformanceMonitor.ts
- ✅ src/services/AIService.ts

#### Panels (Complete Set)
- ✅ src/panels/XamlPreviewPanel.ts
- ✅ src/panels/ToolboxPanel.ts
- ✅ src/panels/ResourceExplorerPanel.ts
- ✅ src/panels/DebugInspectorPanel.ts
- ✅ src/panels/RunPanel.ts
- ✅ src/panels/AnimationEditorPanel.ts
- ✅ src/panels/ResponsiveDesignPanel.ts
- ✅ src/panels/ComponentMarketplacePanel.ts
- ✅ src/panels/CommandPalettePanel.ts
- ✅ src/panels/StyleEditorPanel.ts ✅ NEW
- ✅ src/panels/PerformanceProfilerPanel.ts ✅ NEW
- ✅ src/panels/BindingDebuggerPanel.ts ✅ NEW
- ✅ src/panels/AccessibilityCheckerPanel.ts ✅ NEW
- ✅ src/panels/NavigationGraphPanel.ts ✅ NEW
- ✅ src/panels/ThemeManagerPanel.ts ✅ NEW
- ✅ src/panels/NuGetPanel.ts

#### Designer (Phase 1) ✅ NEW
- ✅ src/designer/snapping/snappingEngine.ts
- ✅ src/designer/gridGenerator/gridGenerator.ts
- ✅ src/designer/rulers/rulersManager.ts
- ✅ src/designer/resizeLogic/resizeControllerV2.ts

#### Binding & Accessibility ✅ NEW
- ✅ src/bindings/bindingInspector.ts
- ✅ src/accessibility/checker.ts

#### Navigation & Converters ✅ NEW
- ✅ src/navigation/graphBuilder.ts
- ✅ src/converters/wpfToAvalonia.ts
- ✅ src/converters/wpfToMaui.ts
- ✅ src/converters/wpfToWinUI.ts

#### Hot Reload & MVVM ✅ NEW
- ✅ src/hotreload/reloader.ts
- ✅ src/mvvm/wizard.ts

#### AI Engine ✅ NEW
- ✅ src/ai/xamlRefactor.ts

#### NuGet Management
- ✅ src/nuget/logChannel.ts
- ✅ src/nuget/projectScanner.ts
- ✅ src/nuget/restore.ts
- ✅ src/nuget/manager.ts
- ✅ src/nuget/autoRestore.ts

#### TreeDataProviders
- ✅ src/panels/CommandTreeProvider.ts
- ✅ src/panels/ToolboxTreeProvider.ts (with search)
- ✅ src/panels/ResourceExplorerTreeProvider.ts
- ✅ src/panels/DebugInspectorTreeProvider.ts
- ✅ src/panels/AnimationEditorTreeProvider.ts
- ✅ src/panels/ResponsiveDesignTreeProvider.ts
- ✅ src/panels/MarketplaceTreeProvider.ts

#### Preview Engine
- ✅ src/preview/previewEngine.ts (enhanced with logging)
- ✅ preview-engine/renderer/ (projet .NET 8 WPF)

#### Inspector & Interactive
- ✅ src/inspector/inspectorPanel.ts
- ✅ src/inspector/treeParser.ts
- ✅ src/inspector/highlightManager.ts
- ✅ src/interactive/dragController.ts
- ✅ src/interactive/resizeController.ts

#### AI & Blend
- ✅ src/ai/AIFeatures.ts
- ✅ src/ai/autoLayout.ts
- ✅ src/ai/autoLayoutPanel.ts
- ✅ src/blend/blendPanel.ts

#### MVVM
- ✅ src/mvvm/ProjectCreator.ts
- ✅ src/mvvm/MvvmTools.ts

#### Webviews ✅ NEW
- ✅ webviews/styleEditor/ (HTML, CSS, JS)
- ✅ webviews/performance/ (HTML, CSS, JS)
- ✅ webviews/bindings/ (HTML, CSS, JS)
- ✅ webviews/accessibility/ (HTML, CSS, JS)
- ✅ webviews/navigation/ (HTML, CSS, JS)
- ✅ webviews/themeManager/ (HTML, CSS, JS)
- ✅ webviews/commandPalette/ (HTML, CSS, JS)
- ✅ webviews/nuget/ (HTML, CSS, JS)

### ⚠️ Problèmes Connus

- ⚠️ **Preview Engine Timeout** : Le renderer peut ne pas répondre (voir PREVIEW_ENGINE_TROUBLESHOOTING.md)
  - **Solution** : Debug Console amélioré avec logs détaillés pour diagnostic

Total files created: **100+** (including webviews, services, panels, and all 15 phases)
