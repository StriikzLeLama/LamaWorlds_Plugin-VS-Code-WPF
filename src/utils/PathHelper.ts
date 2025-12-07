import * as path from 'path';
import * as vscode from 'vscode';

/**
 * Utility class for path operations
 */
export class PathHelper {
    /**
     * Get workspace root path
     */
    static getWorkspaceRoot(): string | undefined {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        return workspaceFolders && workspaceFolders.length > 0 
            ? workspaceFolders[0].uri.fsPath 
            : undefined;
    }

    /**
     * Find .csproj file in workspace
     */
    static findCsproj(startPath?: string): string | null {
        const fs = require('fs');
        const root = startPath || this.getWorkspaceRoot();
        if (!root) return null;

        let current = root;
        while (true) {
            try {
                const files = fs.readdirSync(current);
                const csproj = files.find((f: string) => f.endsWith('.csproj'));
                if (csproj) {
                    return path.join(current, csproj);
                }
            } catch (error) {
                // Ignore
            }

            const parent = path.dirname(current);
            if (parent === current) break;
            current = parent;
        }

        return null;
    }

    /**
     * Get namespace from project path
     */
    static getNamespace(projectPath: string, filePath: string): string {
        const fs = require('fs');
        const projectDir = path.dirname(projectPath);
        const projectName = path.basename(projectPath, '.csproj');
        
        const relPath = path.relative(projectDir, filePath);
        if (relPath && !relPath.startsWith('..')) {
            const segments = relPath.split(path.sep).filter(s => s !== '.' && s !== '..');
            return [projectName, ...segments].join('.');
        }
        
        return projectName;
    }

    /**
     * Ensure directory exists
     */
    static ensureDirectory(dir: string): void {
        const fs = require('fs');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
}
