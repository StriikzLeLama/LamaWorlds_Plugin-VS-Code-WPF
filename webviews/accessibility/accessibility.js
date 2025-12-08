(function() {
    const vscode = acquireVsCodeApi();

    let currentIssues = [];

    function init() {
        setupEventListeners();
    }

    function setupEventListeners() {
        document.getElementById('checkBtn').addEventListener('click', () => {
            vscode.postMessage({
                command: 'checkAccessibility'
            });
        });
    }

    function renderIssues() {
        const container = document.getElementById('issuesContainer');
        container.innerHTML = '';

        if (currentIssues.length === 0) {
            container.innerHTML = '<p style="color: rgba(0, 255, 255, 0.5);">No accessibility issues found</p>';
            return;
        }

        currentIssues.forEach(issue => {
            const item = document.createElement('div');
            item.className = `issue-item ${issue.type}`;
            
            item.innerHTML = `
                <div class="issue-header">
                    <div class="issue-element">${escapeHtml(issue.element)} (${escapeHtml(issue.elementType)})</div>
                    <div class="issue-type ${issue.type}">${escapeHtml(issue.type)}</div>
                </div>
                <div class="issue-message">${escapeHtml(issue.message)}</div>
                <div class="issue-suggestion">💡 ${escapeHtml(issue.suggestion)}</div>
            `;

            item.addEventListener('click', () => {
                vscode.postMessage({
                    command: 'navigateToIssue',
                    location: issue.location
                });
            });

            container.appendChild(item);
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Handle messages from extension
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'updateIssues':
                currentIssues = message.issues || [];
                renderIssues();
                break;
        }
    });

    init();
})();

