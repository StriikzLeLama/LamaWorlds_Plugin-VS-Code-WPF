(function () {
    const vscode = acquireVsCodeApi();

    const xamlCount = document.getElementById('xamlCount');
    const csCount = document.getElementById('csCount');
    const recentFileList = document.getElementById('recentFileList');

    // Handle messages from extension
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'updateStats':
                xamlCount.textContent = message.xamlCount;
                csCount.textContent = message.csCount;
                updateRecentFiles(message.recentFiles);
                break;
        }
    });

    function updateRecentFiles(files) {
        if (!files || files.length === 0) return;

        recentFileList.innerHTML = '';
        files.forEach(file => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.innerHTML = `
                <div class="file-icon">X</div>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-path">${file.path}</div>
                </div>
            `;
            item.onclick = () => {
                vscode.postMessage({
                    command: 'openFile',
                    path: file.fullPath
                });
            };
            recentFileList.appendChild(item);
        });
    }

    // Request initial stats
    vscode.postMessage({ command: 'requestStats' });
})();
