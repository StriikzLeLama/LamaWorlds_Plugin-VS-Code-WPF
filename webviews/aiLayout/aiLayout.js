(function() {
    const vscode = acquireVsCodeApi();
    let suggestions = [];
    let selectedSuggestion = null;

    function init() {
        setupEventListeners();
    }

    function setupEventListeners() {
        document.getElementById('analyzeBtn').addEventListener('click', () => {
            vscode.postMessage({ command: 'analyze' });
        });

        document.getElementById('applyAllBtn').addEventListener('click', () => {
            vscode.postMessage({ command: 'applyAll' });
        });
    }

    function renderSuggestions(suggestionsList) {
        suggestions = suggestionsList;
        const container = document.getElementById('suggestionsList');
        
        if (!suggestionsList || suggestionsList.length === 0) {
            container.innerHTML = '<div class="empty-state">No suggestions found. Your XAML looks good!</div>';
            return;
        }

        const applyAllBtn = document.getElementById('applyAllBtn');
        applyAllBtn.disabled = false;

        container.innerHTML = suggestionsList.map((suggestion, index) => `
            <div class="suggestion-item" data-suggestion-id="${suggestion.id}" onclick="selectSuggestion('${suggestion.id}')">
                <div class="suggestion-header">
                    <span class="suggestion-title">${escapeHtml(suggestion.title)}</span>
                    <span class="suggestion-priority ${suggestion.priority}">${suggestion.priority}</span>
                </div>
                <div class="suggestion-description">${escapeHtml(suggestion.description)}</div>
                <div class="suggestion-actions">
                    <button class="btn suggestion-btn" onclick="event.stopPropagation(); previewDiff('${suggestion.id}')">👁️ Preview</button>
                    <button class="btn suggestion-btn btn-primary" onclick="event.stopPropagation(); applySuggestion('${suggestion.id}')">✅ Apply</button>
                </div>
            </div>
        `).join('');
    }

    function selectSuggestion(suggestionId) {
        selectedSuggestion = suggestions.find(s => s.id === suggestionId);
        
        document.querySelectorAll('.suggestion-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        const selectedItem = document.querySelector(`[data-suggestion-id="${suggestionId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }

        previewDiff(suggestionId);
    }

    function previewDiff(suggestionId) {
        const suggestion = suggestions.find(s => s.id === suggestionId);
        if (!suggestion) {
            return;
        }

        vscode.postMessage({
            command: 'previewDiff',
            suggestionId: suggestionId
        });
    }

    function applySuggestion(suggestionId) {
        vscode.postMessage({
            command: 'applySuggestion',
            suggestionId: suggestionId
        });
    }

    function renderDiff(before, after) {
        const diffView = document.getElementById('diffView');
        
        diffView.innerHTML = `
            <div class="diff-side">
                <div class="diff-header">Before</div>
                <div class="diff-content before">${escapeHtml(before)}</div>
            </div>
            <div class="diff-side">
                <div class="diff-header">After</div>
                <div class="diff-content after">${escapeHtml(after)}</div>
            </div>
        `;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    window.selectSuggestion = selectSuggestion;
    window.previewDiff = previewDiff;
    window.applySuggestion = applySuggestion;

    window.addEventListener('message', event => {
        const message = event.data;

        switch (message.command) {
            case 'suggestionsUpdated':
                renderSuggestions(message.suggestions);
                break;
            case 'diffPreview':
                renderDiff(message.before, message.after);
                break;
        }
    });

    init();
})();

