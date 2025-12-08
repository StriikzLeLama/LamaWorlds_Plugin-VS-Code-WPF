(function() {
    const vscode = acquireVsCodeApi();

    let currentBindings = [];
    let selectedBinding = null;

    function init() {
        setupEventListeners();
        requestBindings();
    }

    function setupEventListeners() {
        document.getElementById('refreshBtn').addEventListener('click', () => {
            requestBindings();
        });
    }

    function requestBindings() {
        vscode.postMessage({
            command: 'requestBindings'
        });
    }

    function renderBindings() {
        const container = document.getElementById('bindingsContainer');
        container.innerHTML = '';

        if (currentBindings.length === 0) {
            container.innerHTML = '<p style="color: rgba(0, 255, 255, 0.5);">No bindings found</p>';
            return;
        }

        currentBindings.forEach(binding => {
            const item = document.createElement('div');
            item.className = `binding-item ${binding.status || 'ok'}`;
            if (selectedBinding && selectedBinding.elementId === binding.elementId && 
                selectedBinding.property === binding.property) {
                item.classList.add('selected');
            }
            
            item.innerHTML = `
                <div class="binding-header">
                    <div class="binding-path">${escapeHtml(binding.bindingPath || 'Unknown')}</div>
                    <div class="binding-status ${binding.status || 'ok'}">${binding.status || 'ok'}</div>
                </div>
                <div class="binding-info">Element: ${escapeHtml(binding.elementType || 'Unknown')}</div>
                <div class="binding-info">Property: ${escapeHtml(binding.property || 'Unknown')}</div>
                ${binding.currentValue !== undefined ? `<div class="binding-value">Value: ${escapeHtml(String(binding.currentValue))}</div>` : ''}
            `;

            item.addEventListener('click', () => {
                selectBinding(binding);
            });

            container.appendChild(item);
        });
    }

    function selectBinding(binding) {
        selectedBinding = binding;
        renderBindings();
        renderBindingDetails(binding);
    }

    function renderBindingDetails(binding) {
        const container = document.getElementById('detailsContainer');
        
        if (!binding) {
            container.innerHTML = '<p style="color: rgba(0, 255, 255, 0.5);">Select a binding to view details</p>';
            return;
        }

        let errorHtml = '';
        if (binding.status === 'error' && binding.errorMessage) {
            errorHtml = `
                <div class="error-message">
                    <strong>Error:</strong> ${escapeHtml(binding.errorMessage)}
                </div>
            `;
        }

        let suggestionsHtml = '';
        if (binding.status === 'error' || binding.status === 'warning') {
            suggestionsHtml = `
                <div class="suggestions">
                    <div class="detail-label">Suggested Fixes:</div>
                    <div class="suggestion-item">Check if the DataContext is set correctly</div>
                    <div class="suggestion-item">Verify the property exists in the ViewModel</div>
                    <div class="suggestion-item">Ensure property names match exactly (case-sensitive)</div>
                </div>
            `;
        }

        container.innerHTML = `
            ${errorHtml}
            <div class="detail-section">
                <label class="detail-label">Binding Path</label>
                <div class="detail-value">${escapeHtml(binding.bindingPath || 'N/A')}</div>
            </div>
            <div class="detail-section">
                <label class="detail-label">Element</label>
                <div class="detail-value">${escapeHtml(binding.elementType || 'Unknown')}</div>
            </div>
            <div class="detail-section">
                <label class="detail-label">Property</label>
                <div class="detail-value">${escapeHtml(binding.property || 'Unknown')}</div>
            </div>
            <div class="detail-section">
                <label class="detail-label">Current Value</label>
                <div class="detail-value">${binding.currentValue !== undefined ? escapeHtml(String(binding.currentValue)) : 'N/A'}</div>
            </div>
            ${binding.bindingMode ? `
                <div class="detail-section">
                    <label class="detail-label">Mode</label>
                    <div class="detail-value">${escapeHtml(binding.bindingMode)}</div>
                </div>
            ` : ''}
            ${binding.converter ? `
                <div class="detail-section">
                    <label class="detail-label">Converter</label>
                    <div class="detail-value">${escapeHtml(binding.converter)}</div>
                </div>
            ` : ''}
            <div class="detail-section">
                <label class="detail-label">Status</label>
                <div class="detail-value ${binding.status}">${binding.status || 'ok'}</div>
            </div>
            ${suggestionsHtml}
            <button class="lama-btn" style="margin-top: 20px;" onclick="navigateToBinding()">Navigate to Source</button>
        `;
    }

    function navigateToBinding() {
        if (!selectedBinding) return;
        
        vscode.postMessage({
            command: 'navigateToBinding',
            location: selectedBinding.sourceLocation
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Make functions global
    window.navigateToBinding = navigateToBinding;

    // Handle messages from extension
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'updateBindings':
                currentBindings = message.bindings || [];
                renderBindings();
                break;
        }
    });

    init();
})();

