# LamaWorlds WPF Studio - Architecture

## Folder Structure

```
extension/
├── src/
│   ├── extension.ts                    ✅ Created
│   ├── commands/
│   │   └── CommandRegistry.ts         ✅ Created
│   ├── toolbox/
│   │   ├── ToolboxPanel.ts            ⏳ To create
│   │   └── ComponentMarketplacePanel.ts ⏳ To create
│   ├── preview/
│   │   └── XamlPreviewPanel.ts        ⏳ To create
│   ├── ai/
│   │   └── AIFeatures.ts              ⏳ To create
│   ├── refactor/
│   │   └── XamlRefactoring.ts         ⏳ To create
│   ├── mvvm/
│   │   ├── ProjectCreator.ts          ✅ Created
│   │   └── MvvmTools.ts               ✅ Created
│   ├── inspector/
│   │   ├── ResourceExplorerPanel.ts   ⏳ To create
│   │   └── DebugInspectorPanel.ts     ⏳ To create
│   ├── animator/
│   │   └── AnimationEditorPanel.ts   ⏳ To create
│   ├── responsive/
│   │   └── ResponsiveDesignPanel.ts   ⏳ To create
│   └── utils/
│       ├── PathHelper.ts              ✅ Created
│       ├── XamlParser.ts              ✅ Created
│       ├── HotReloadEngine.ts          ⏳ To create
│       ├── RunPanel.ts                ⏳ To create
│       └── XamlNavigation.ts           ⏳ To create
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
- ✅ src/extension.ts
- ✅ src/commands/CommandRegistry.ts
- ✅ src/utils/PathHelper.ts
- ✅ src/utils/XamlParser.ts
- ✅ src/utils/Cache.ts
- ✅ src/utils/Debouncer.ts

#### Services
- ✅ src/services/XamlRefactoring.ts
- ✅ src/services/XamlNavigation.ts
- ✅ src/services/HotReloadEngine.ts
- ✅ src/services/DebugConsole.ts
- ✅ src/services/PerformanceMonitor.ts
- ✅ src/services/AIService.ts

#### Panels
- ✅ src/panels/XamlPreviewPanel.ts
- ✅ src/panels/ToolboxPanel.ts
- ✅ src/panels/ResourceExplorerPanel.ts
- ✅ src/panels/DebugInspectorPanel.ts
- ✅ src/panels/RunPanel.ts
- ✅ src/panels/AnimationEditorPanel.ts
- ✅ src/panels/ResponsiveDesignPanel.ts
- ✅ src/panels/ComponentMarketplacePanel.ts
- ✅ src/panels/CommandPalettePanel.ts

#### TreeDataProviders
- ✅ src/panels/CommandTreeProvider.ts
- ✅ src/panels/ToolboxTreeProvider.ts
- ✅ src/panels/ResourceExplorerTreeProvider.ts
- ✅ src/panels/DebugInspectorTreeProvider.ts
- ✅ src/panels/AnimationEditorTreeProvider.ts
- ✅ src/panels/ResponsiveDesignTreeProvider.ts
- ✅ src/panels/MarketplaceTreeProvider.ts

#### Preview Engine
- ✅ src/preview/previewEngine.ts
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

### ⚠️ Problèmes Connus

- ⚠️ **Preview Engine Timeout** : Le renderer peut ne pas répondre (voir PREVIEW_ENGINE_TROUBLESHOOTING.md)

Total files created: ~50+
