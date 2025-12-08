import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Navigation Node
 */
export interface NavigationNode {
    id: string;
    label: string;
    type: 'Window' | 'UserControl' | 'Page' | 'Dialog';
    filePath: string;
}

/**
 * Navigation Edge
 */
export interface NavigationEdge {
    from: string;
    to: string;
    type: 'Navigate' | 'ShowDialog' | 'Show';
}

/**
 * Navigation Graph Builder - Builds navigation graph from project files
 */
export class GraphBuilder {
    /**
     * Build navigation graph from workspace
     */
    public static async buildGraph(workspaceFolder: vscode.WorkspaceFolder): Promise<{
        nodes: NavigationNode[];
        edges: NavigationEdge[];
    }> {
        const nodes: NavigationNode[] = [];
        const edges: NavigationEdge[] = [];

        if (!workspaceFolder) {
            return { nodes, edges };
        }

        // Find all XAML files
        const xamlFiles = await vscode.workspace.findFiles(
            new vscode.RelativePattern(workspaceFolder, '**/*.xaml'),
            null,
            100
        );

        // Parse each XAML file to find navigation targets
        for (const file of xamlFiles) {
            const document = await vscode.workspace.openTextDocument(file);
            const text = document.getText();

            // Determine file type
            let type: 'Window' | 'UserControl' | 'Page' | 'Dialog' = 'UserControl';
            if (text.includes('<Window')) {
                type = 'Window';
            } else if (text.includes('<Page')) {
                type = 'Page';
            } else if (text.includes('Dialog')) {
                type = 'Dialog';
            } else if (text.includes('<UserControl')) {
                type = 'UserControl';
            }

            // Create node
            const fileName = path.basename(file.fsPath);
            const node: NavigationNode = {
                id: file.fsPath,
                label: fileName.replace('.xaml', ''),
                type,
                filePath: file.fsPath
            };
            nodes.push(node);

            // Find navigation calls in code-behind or ViewModels
            const codeBehindPath = file.fsPath.replace('.xaml', '.xaml.cs');
            if (fs.existsSync(codeBehindPath)) {
                try {
                    const codeBehind = fs.readFileSync(codeBehindPath, 'utf-8');
                    const navigationCalls = this._extractNavigationCalls(codeBehind);
                    
                    for (const navCall of navigationCalls) {
                        // Try to resolve target
                        const targetNode = nodes.find(n => n.label === navCall.target || n.filePath.includes(navCall.target));
                        if (targetNode) {
                            edges.push({
                                from: node.id,
                                to: targetNode.id,
                                type: navCall.type
                            });
                        }
                    }
                } catch (error) {
                    // Skip if code-behind can't be read
                }
            }
        }

        return { nodes, edges };
    }

    /**
     * Extract navigation calls from C# code
     */
    private static _extractNavigationCalls(code: string): Array<{ target: string; type: 'Navigate' | 'ShowDialog' | 'Show' }> {
        const calls: Array<{ target: string; type: 'Navigate' | 'ShowDialog' | 'Show' }> = [];

        // Pattern: new WindowName().Show() or new WindowName().ShowDialog()
        const showPattern = /new\s+(\w+)\s*\(\s*\)\s*\.\s*Show(?:Dialog)?\s*\(\s*\)/g;
        let match;
        while ((match = showPattern.exec(code)) !== null) {
            calls.push({
                target: match[1],
                type: match[0].includes('ShowDialog') ? 'ShowDialog' : 'Show'
            });
        }

        // Pattern: NavigationService.Navigate(new Uri(...))
        const navPattern = /NavigationService\.Navigate\s*\(\s*new\s+Uri\s*\(\s*["']([^"']+)["']/g;
        while ((match = navPattern.exec(code)) !== null) {
            calls.push({
                target: match[1],
                type: 'Navigate'
            });
        }

        return calls;
    }
}

