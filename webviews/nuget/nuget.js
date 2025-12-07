// NuGet Package Manager Webview Script

const vscode = acquireVsCodeApi();

let currentProjectPath = null;
let installedPackages = [];

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    addLogEntry('NuGet Package Manager initialized', 'info');
    detectProject();
    loadInstalledPackages();
});

// Message handler from extension
window.addEventListener('message', event => {
    const message = event.data;

    switch (message.command) {
        case 'projectDetected':
            currentProjectPath = message.projectPath;
            if (currentProjectPath) {
                addLogEntry(`Project detected: ${currentProjectPath}`, 'success');
            } else {
                addLogEntry('No project detected. Please open a .csproj file.', 'warn');
            }
            break;

        case 'installedPackages':
            installedPackages = message.packages || [];
            renderInstalledPackages();
            break;

        case 'searchResults':
            renderSearchResults(message.packages || []);
            break;

        case 'packageInfo':
            renderPackageInfo(message.packageId, message.versions || []);
            break;

        case 'packageVersions':
            showVersionSelector(message.packageId, message.versions || []);
            break;

        case 'operationStarted':
            addLogEntry(`${message.operation} ${message.packageId || 'packages'}...`, 'info');
            break;

        case 'operationCompleted':
            if (message.success) {
                addLogEntry(`${message.operation} ${message.packageId || 'packages'} completed successfully`, 'success');
                if (message.operation !== 'restore') {
                    loadInstalledPackages();
                }
            } else {
                addLogEntry(`${message.operation} ${message.packageId || 'packages'} failed`, 'error');
                if (message.error) {
                    addLogEntry(`Error: ${message.error}`, 'error');
                }
            }
            break;

        case 'error':
            addLogEntry(`Error: ${message.message}`, 'error');
            break;
    }
});

function detectProject() {
    vscode.postMessage({ command: 'detectProject' });
}

function refreshProject() {
    vscode.postMessage({ command: 'refresh' });
    addLogEntry('Refreshing project...', 'info');
}

function loadInstalledPackages() {
    vscode.postMessage({ command: 'getInstalledPackages' });
}

function searchPackages() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) {
        addLogEntry('Please enter a package name to search', 'warn');
        return;
    }

    addLogEntry(`Searching for: ${query}`, 'info');
    vscode.postMessage({ command: 'searchPackages', query });
}

function renderSearchResults(packages) {
    const container = document.getElementById('searchResults');
    
    if (packages.length === 0) {
        container.innerHTML = '<p class="no-packages">No packages found</p>';
        return;
    }

    container.innerHTML = packages.map(pkg => {
        const packageId = pkg.id || pkg;
        const version = pkg.version || (pkg.versions && pkg.versions[0]) || 'latest';
        const description = pkg.description || 'No description available';

        return `
            <div class="package-item">
                <div class="package-info">
                    <span class="package-name">${escapeHtml(packageId)}</span>
                    <span class="package-version">${escapeHtml(version)}</span>
                    <p style="color: #888; font-size: 12px; margin-top: 5px;">${escapeHtml(description)}</p>
                </div>
                <div class="package-actions">
                    <button class="btn-install" onclick="installPackage('${escapeHtml(packageId)}')">Install</button>
                </div>
            </div>
        `;
    }).join('');
}

function renderPackageInfo(packageId, versions) {
    const container = document.getElementById('searchResults');
    
    if (versions.length === 0) {
        container.innerHTML = `<p class="no-packages">No versions found for ${escapeHtml(packageId)}</p>`;
        return;
    }

    const latestVersion = versions[versions.length - 1];
    container.innerHTML = `
        <div class="package-item">
            <div class="package-info">
                <span class="package-name">${escapeHtml(packageId)}</span>
                <span class="package-version">Latest: ${escapeHtml(latestVersion)}</span>
            </div>
            <div class="package-actions">
                <select class="version-selector" id="version-${escapeHtml(packageId)}">
                    ${versions.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('')}
                </select>
                <button class="btn-install" onclick="installPackage('${escapeHtml(packageId)}', document.getElementById('version-${escapeHtml(packageId)}').value)">Install</button>
            </div>
        </div>
    `;
}

function renderInstalledPackages() {
    const container = document.querySelector('.installed-packages');
    
    if (installedPackages.length === 0) {
        container.innerHTML = '<p class="no-packages">No packages installed</p>';
        return;
    }

    container.innerHTML = installedPackages.map(pkg => {
        return `
            <div class="package-item">
                <div class="package-info">
                    <span class="package-name">${escapeHtml(pkg.Include)}</span>
                    ${pkg.Version ? `<span class="package-version">${escapeHtml(pkg.Version)}</span>` : ''}
                </div>
                <div class="package-actions">
                    <button class="btn-update" onclick="updatePackage('${escapeHtml(pkg.Include)}')">Update</button>
                    <button class="btn-remove" onclick="removePackage('${escapeHtml(pkg.Include)}')">Remove</button>
                </div>
            </div>
        `;
    }).join('');
}

function installPackage(packageId, version) {
    if (!currentProjectPath) {
        addLogEntry('No project detected. Please open a .csproj file.', 'error');
        return;
    }

    vscode.postMessage({ 
        command: 'installPackage', 
        packageId: packageId,
        version: version
    });
}

function updatePackage(packageId) {
    if (!currentProjectPath) {
        addLogEntry('No project detected. Please open a .csproj file.', 'error');
        return;
    }

    // Get versions first
    vscode.postMessage({ command: 'getPackageVersions', packageId });
    
    // Show version selector (simplified - in real implementation, show a modal)
    const version = prompt(`Enter version for ${packageId} (or leave empty for latest):`);
    if (version !== null) {
        vscode.postMessage({ 
            command: 'updatePackage', 
            packageId: packageId,
            version: version || undefined
        });
    }
}

function removePackage(packageId) {
    if (!currentProjectPath) {
        addLogEntry('No project detected. Please open a .csproj file.', 'error');
        return;
    }

    if (confirm(`Are you sure you want to remove ${packageId}?`)) {
        vscode.postMessage({ command: 'removePackage', packageId: packageId });
    }
}

function restorePackages() {
    if (!currentProjectPath) {
        addLogEntry('No project detected. Please open a .csproj file.', 'error');
        return;
    }

    vscode.postMessage({ command: 'restorePackages' });
}

function showVersionSelector(packageId, versions) {
    if (versions.length === 0) {
        updatePackage(packageId, undefined);
        return;
    }

    const version = prompt(`Select version for ${packageId}:\nAvailable: ${versions.slice(-10).join(', ')}\n\nEnter version (or leave empty for latest):`);
    if (version !== null) {
        vscode.postMessage({ 
            command: 'updatePackage', 
            packageId: packageId,
            version: version || undefined
        });
    }
}

function addLogEntry(message, level = 'info') {
    const logContainer = document.getElementById('activityLog');
    const time = new Date().toLocaleTimeString();
    const levelClass = `log-${level}`;
    
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-time">[${time}]</span><span class="${levelClass}">${escapeHtml(message)}</span>`;
    
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Handle Enter key in search input
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchPackages();
            }
        });
    }
});

