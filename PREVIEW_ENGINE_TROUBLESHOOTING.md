# 🔧 Preview Engine - Guide de Dépannage

## ⏱️ Temps d'Initialisation

### Scénario 1 : Renderer déjà compilé (cas normal)
- **Temps** : **2-5 secondes**
- Le renderer existe déjà, juste besoin de démarrer le processus

### Scénario 2 : Première utilisation (build nécessaire)
- **Temps** : **30-120 secondes (1-2 minutes)**
- Le renderer doit être compilé pour la première fois
- Dépend de la vitesse de votre machine et de .NET SDK

### Scénario 3 : Timeout de rendu
- **Symptôme** : "Render timeout, using fallback" après 10 secondes
- **Causes possibles** :
  1. Le renderer WPF ne démarre pas correctement
  2. Problème de communication stdin/stdout
  3. Le renderer attend un signal qui n'arrive pas

## 🔍 Diagnostic

### Vérifier les logs

1. **Ouvrir Debug Console** :
   - Commande : `Lama Worlds: Show Debug Console` ou `Ctrl+Shift+P` → "Show Debug Console"
   - Ou ouvrir Debug Inspector : `Lama Worlds: Open Debug Inspector` → Onglet "Debug Console"
   - Tous les logs sont maintenant avec contexte complet, catégories, et timestamps précis

2. **Vérifier Output Panel** :
   - Cherchez "Lama Worlds Debug" dans la liste déroulante
   - Vous verrez tous les logs détaillés avec :
     - Timestamps avec millisecondes
     - Catégories (PreviewEngine, XamlPreviewPanel, etc.)
     - Contexte (fichiers, paramètres, états)
     - Durées de performance pour chaque opération
   - Exportez les logs : `Lama Worlds: Export Logs` pour sauvegarder en JSON

### Logs importants à vérifier

```
[INFO] Starting preview engine initialization...
[INFO] Renderer found, skipping build
[INFO] Preview engine initialized in X seconds
[INFO] Renderer is ready!
[DEBUG] Sending render command (XXX chars XAML)
[INFO] Rendered XAML successfully: WxH
```

Si vous voyez :
- `[WARN] Render timeout, using fallback` → Le renderer ne répond pas
- `[ERROR] Renderer error: ...` → Erreur dans le renderer
- `[WARN] Renderer stderr: ...` → Erreur C# dans le renderer

## 🛠️ Solutions

### Solution 1 : Rebuild le renderer

1. Supprimez le dossier `preview-engine/renderer/bin/`
2. Rechargez l'extension (F5)
3. Le renderer sera rebuild automatiquement

### Solution 2 : Vérifier .NET SDK

```powershell
dotnet --version
```

Doit afficher `8.x.x` ou supérieur.

### Solution 3 : Tester le renderer manuellement

```powershell
cd preview-engine/renderer
dotnet run
```

Le renderer devrait démarrer et attendre des commandes sur stdin.

### Solution 4 : Vérifier les permissions

Assurez-vous que :
- Le dossier `preview-engine` n'est pas en lecture seule
- Vous avez les droits d'exécution
- Aucun antivirus ne bloque l'exécution

## 📊 Améliorations Récentes

### ✅ Ajouté
- Signal "ready" du renderer pour synchronisation
- Logs détaillés à chaque étape
- Fallback automatique après 3 secondes si pas de ready
- Timeout de rendu réduit à 10 secondes
- Fenêtre WPF invisible (headless mode)

### 🔄 Prochaines améliorations prévues
- Mode de rendu alternatif (sans WPF window)
- Cache des rendus pour éviter les re-renders
- Retry automatique en cas d'échec
- Mode debug avec fenêtre visible optionnelle

## 💡 Astuces

1. **Première utilisation** : Attendez 1-2 minutes pour le build initial
2. **Utilisations suivantes** : Devrait être instantané (2-5 secondes)
3. **Si ça timeout** : Vérifiez les logs dans Debug Inspector
4. **Si le build échoue** : Vérifiez que .NET 8 SDK est installé

## 🐛 Problèmes Connus

1. **WPF nécessite un message pump** : Le renderer doit avoir une fenêtre (même invisible) pour fonctionner
2. **stdin/stdout buffering** : Parfois le flush ne se fait pas immédiatement
3. **Premier build lent** : Normal, peut prendre 1-2 minutes

## 📝 Logs de Debug (Enhanced)

Le système de logging a été considérablement amélioré :

### Niveaux de Log
- `debugConsole.trace()` - Logs très détaillés (verbose)
- `debugConsole.debug()` - Logs détaillés
- `debugConsole.info()` - Informations importantes
- `debugConsole.warn()` - Avertissements
- `debugConsole.error()` - Erreurs avec stack traces

### Fonctionnalités
- **Performance Tracking** : `debugConsole.time()` pour mesurer la durée des opérations
- **Contexte Rich** : Chaque log inclut des informations contextuelles (fichiers, paramètres, états)
- **Catégories** : Logs organisés par catégorie (PreviewEngine, XamlPreviewPanel, etc.)
- **Export** : Possibilité d'exporter tous les logs en JSON

### Utilisation dans le code
```typescript
// Mesure de performance
const endTimer = debugConsole.time('Renderer Build', 'PreviewEngine');
// ... code ...
const duration = endTimer(); // Affiche la durée automatiquement

// Log avec contexte
debugConsole.info('Rendering XAML', 'PreviewEngine', {
    xamlLength: xaml.length,
    renderMode: this.currentMode
});

// Log d'erreur avec stack trace
debugConsole.error('Failed to render', error, 'PreviewEngine', {
    xamlPath: document.uri.fsPath
});
```

Tous ces logs sont visibles dans :
- Debug Console (`Lama Worlds: Show Debug Console`)
- Debug Inspector (`Lama Worlds: Open Debug Inspector` → Onglet "Debug Console")
- Output Panel (channel "Lama Worlds Debug")

