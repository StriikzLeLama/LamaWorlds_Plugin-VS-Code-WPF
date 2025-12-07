import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { NuGetLogChannel } from './logChannel';

export interface PackageReference {
    Include: string;
    Version?: string;
}

export interface CsprojInfo {
    path: string;
    packages: PackageReference[];
}

/**
 * Project Scanner - Detects and parses .csproj files
 */
export class ProjectScanner {
    private static _logChannel = NuGetLogChannel.getInstance();

    /**
     * Find the nearest .csproj file from the current active file or workspace
     */
    public static async findNearestCsproj(): Promise<string | null> {
        try {
            const activeEditor = vscode.window.activeTextEditor;
            let searchPath: string | undefined;

            if (activeEditor) {
                const filePath = activeEditor.document.uri.fsPath;
                searchPath = path.dirname(filePath);
            } else if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
                searchPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
            }

            if (!searchPath) {
                this._logChannel.warn('No active file or workspace folder found');
                return null;
            }

            // Search up the directory tree
            let currentPath = searchPath;
            const rootPath = path.parse(currentPath).root;

            while (currentPath !== rootPath) {
                const files = fs.readdirSync(currentPath);
                const csprojFile = files.find(f => f.endsWith('.csproj'));

                if (csprojFile) {
                    const fullPath = path.join(currentPath, csprojFile);
                    this._logChannel.debug(`Found .csproj: ${fullPath}`);
                    return fullPath;
                }

                currentPath = path.dirname(currentPath);
            }

            this._logChannel.warn(`No .csproj file found starting from: ${searchPath}`);
            return null;
        } catch (error: any) {
            this._logChannel.error(`Error finding .csproj: ${error?.message || error}`);
            return null;
        }
    }

    /**
     * Parse PackageReference elements from a .csproj file
     */
    public static async parsePackageReferences(csprojPath: string): Promise<PackageReference[]> {
        try {
            if (!fs.existsSync(csprojPath)) {
                this._logChannel.error(`.csproj file not found: ${csprojPath}`);
                return [];
            }

            const xmlContent = fs.readFileSync(csprojPath, 'utf-8');
            const packages: PackageReference[] = [];

            // Use regex to find PackageReference elements
            // Matches: <PackageReference Include="PackageName" Version="1.0.0" />
            // or: <PackageReference Include="PackageName" />
            const packageRefRegex = /<PackageReference\s+Include\s*=\s*["']([^"']+)["'](?:\s+Version\s*=\s*["']([^"']+)["'])?\s*\/?>/gi;
            let match;

            while ((match = packageRefRegex.exec(xmlContent)) !== null) {
                const packageId = match[1];
                const version = match[2];
                packages.push({
                    Include: packageId,
                    Version: version
                });
            }

            this._logChannel.debug(`Parsed ${packages.length} package references from ${csprojPath}`);
            return packages;
        } catch (error: any) {
            this._logChannel.error(`Error parsing .csproj: ${error?.message || error}`);
            return [];
        }
    }

    /**
     * Get full project info including path and packages
     */
    public static async getProjectInfo(csprojPath?: string): Promise<CsprojInfo | null> {
        try {
            const projectPath = csprojPath || await this.findNearestCsproj();
            if (!projectPath) {
                return null;
            }

            const packages = await this.parsePackageReferences(projectPath);
            return {
                path: projectPath,
                packages
            };
        } catch (error: any) {
            this._logChannel.error(`Error getting project info: ${error?.message || error}`);
            return null;
        }
    }

    /**
     * Update .csproj with package changes (add/remove/update)
     */
    public static async updateCsprojWithPackage(
        csprojPath: string,
        operation: 'add' | 'remove' | 'update',
        packageId: string,
        version?: string
    ): Promise<boolean> {
        try {
            if (!fs.existsSync(csprojPath)) {
                this._logChannel.error(`.csproj file not found: ${csprojPath}`);
                return false;
            }

            let xmlContent = fs.readFileSync(csprojPath, 'utf-8');
            const packageRefRegex = /<PackageReference\s+Include\s*=\s*["']([^"']+)["'](?:\s+Version\s*=\s*["']([^"']+)["'])?\s*\/?>/gi;

            if (operation === 'add' || operation === 'update') {
                // Remove existing package reference if updating
                if (operation === 'update') {
                    xmlContent = xmlContent.replace(
                        new RegExp(`<PackageReference\\s+Include\\s*=\\s*["']${packageId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*\\/?>`, 'gi'),
                        ''
                    );
                }

                // Check if package already exists (shouldn't for add, but check anyway)
                const existingMatch = new RegExp(`<PackageReference\\s+Include\\s*=\\s*["']${packageId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i').test(xmlContent);
                if (existingMatch && operation === 'add') {
                    this._logChannel.warn(`Package already exists: ${packageId}`);
                    return false;
                }

                // Find ItemGroup with PackageReference or create one
                const itemGroupWithPackageRegex = /(<ItemGroup[^>]*>[\s\S]*?)(<\/ItemGroup>)/;
                const hasItemGroup = itemGroupWithPackageRegex.test(xmlContent);

                let newPackageRef: string;
                if (version) {
                    newPackageRef = `    <PackageReference Include="${packageId}" Version="${version}" />\n`;
                } else {
                    newPackageRef = `    <PackageReference Include="${packageId}" />\n`;
                }

                if (hasItemGroup) {
                    // Insert into existing ItemGroup
                    xmlContent = xmlContent.replace(
                        itemGroupWithPackageRegex,
                        (match, start, end) => {
                            // Check if this ItemGroup already has PackageReference
                            if (match.includes('PackageReference')) {
                                return start + newPackageRef + '  ' + end;
                            }
                            return match;
                        }
                    );
                } else {
                    // Create new ItemGroup before </Project>
                    const projectEndRegex = /(\s*<\/Project>)/;
                    xmlContent = xmlContent.replace(
                        projectEndRegex,
                        `  <ItemGroup>\n${newPackageRef}  </ItemGroup>\n$1`
                    );
                }

                this._logChannel.info(`${operation === 'add' ? 'Added' : 'Updated'} package: ${packageId}${version ? ` (${version})` : ''}`);
            } else if (operation === 'remove') {
                // Remove package reference
                const removeRegex = new RegExp(`<PackageReference\\s+Include\\s*=\\s*["']${packageId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*\\/?>\\s*`, 'gi');
                
                if (!removeRegex.test(xmlContent)) {
                    this._logChannel.warn(`Package not found: ${packageId}`);
                    return false;
                }

                xmlContent = xmlContent.replace(removeRegex, '');
                this._logChannel.info(`Removed package: ${packageId}`);
            }

            // Write back to file
            fs.writeFileSync(csprojPath, xmlContent, 'utf-8');
            this._logChannel.debug(`Updated .csproj file: ${csprojPath}`);
            return true;
        } catch (error: any) {
            this._logChannel.error(`Error updating .csproj: ${error?.message || error}`);
            return false;
        }
    }
}

