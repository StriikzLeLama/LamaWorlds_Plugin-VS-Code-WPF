(function() {
    const vscode = acquireVsCodeApi();

    let currentMetrics = {
        fps: 0,
        layoutTime: 0,
        renderTime: 0,
        elements: [],
        bindings: []
    };

    function init() {
        updateMetrics();
    }

    function updateMetrics() {
        document.getElementById('fpsValue').textContent = currentMetrics.fps || 0;
        document.getElementById('layoutTimeValue').textContent = (currentMetrics.layoutTime || 0) + 'ms';
        document.getElementById('renderTimeValue').textContent = (currentMetrics.renderTime || 0) + 'ms';

        // Update FPS color based on value
        const fpsElement = document.getElementById('fpsValue');
        fpsElement.className = 'metric-value';
        if (currentMetrics.fps < 30) {
            fpsElement.classList.add('error');
        } else if (currentMetrics.fps < 60) {
            fpsElement.classList.add('warning');
        }

        // Render elements
        renderElements();
        
        // Render bindings
        renderBindings();
    }

    function renderElements() {
        const container = document.getElementById('elementsContainer');
        container.innerHTML = '';

        if (!currentMetrics.elements || currentMetrics.elements.length === 0) {
            container.innerHTML = '<p style="color: rgba(0, 255, 255, 0.5);">No element data available</p>';
            return;
        }

        // Sort by render time (most expensive first)
        const sorted = [...currentMetrics.elements].sort((a, b) => (b.renderTime || 0) - (a.renderTime || 0));

        sorted.forEach(element => {
            const item = document.createElement('div');
            item.className = 'element-item';
            
            item.innerHTML = `
                <div class="element-info">
                    <div class="element-name">${escapeHtml(element.name || element.type || 'Unknown')}</div>
                    <div class="element-type">${escapeHtml(element.type || 'Unknown')}</div>
                </div>
                <div class="element-metrics">
                    <div class="metric-label">Layout</div>
                    <div class="metric-number">${(element.layoutTime || 0).toFixed(2)}ms</div>
                    <div class="metric-label" style="margin-top: 5px;">Render</div>
                    <div class="metric-number">${(element.renderTime || 0).toFixed(2)}ms</div>
                </div>
            `;

            container.appendChild(item);
        });
    }

    function renderBindings() {
        const container = document.getElementById('bindingContainer');
        container.innerHTML = '';

        if (!currentMetrics.bindings || currentMetrics.bindings.length === 0) {
            container.innerHTML = '<p style="color: rgba(0, 255, 255, 0.5);">No binding data available</p>';
            return;
        }

        // Sort by overhead (most expensive first)
        const sorted = [...currentMetrics.bindings].sort((a, b) => (b.overhead || 0) - (a.overhead || 0));

        sorted.forEach(binding => {
            const item = document.createElement('div');
            item.className = 'binding-item';
            
            item.innerHTML = `
                <div class="binding-path">${escapeHtml(binding.path || 'Unknown')}</div>
                <div class="binding-overhead">Overhead: ${(binding.overhead || 0).toFixed(2)}ms</div>
            `;

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
            case 'updateMetrics':
                currentMetrics = message.metrics || currentMetrics;
                updateMetrics();
                break;
        }
    });

    init();
})();

