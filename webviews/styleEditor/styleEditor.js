(function() {
    const vscode = acquireVsCodeApi();

    let currentStyles = [];
    let selectedStyle = null;

    function init() {
        setupEventListeners();
        requestStyles();
    }

    function setupEventListeners() {
        document.getElementById('refreshBtn').addEventListener('click', () => {
            requestStyles();
        });
    }

    function requestStyles() {
        vscode.postMessage({
            command: 'requestStyles'
        });
    }

    function renderStyles() {
        const container = document.getElementById('stylesContainer');
        container.innerHTML = '';

        if (currentStyles.length === 0) {
            container.innerHTML = '<p style="color: rgba(0, 255, 255, 0.5);">No styles found</p>';
            return;
        }

        currentStyles.forEach(style => {
            const item = document.createElement('div');
            item.className = 'style-item';
            if (selectedStyle && selectedStyle.id === style.id) {
                item.classList.add('selected');
            }
            
            item.innerHTML = `
                <div class="style-name">${style.name || 'Unnamed Style'}</div>
                <div class="style-target">Target: ${style.targetType || 'Any'}</div>
            `;

            item.addEventListener('click', () => {
                selectStyle(style);
            });

            container.appendChild(item);
        });
    }

    function selectStyle(style) {
        selectedStyle = style;
        renderStyles();
        renderStyleEditor(style);
    }

    function renderStyleEditor(style) {
        const container = document.getElementById('styleEditorContainer');
        
        if (!style) {
            container.innerHTML = '<p style="color: rgba(0, 255, 255, 0.5);">Select a style to edit</p>';
            return;
        }

        let settersHtml = '';
        if (style.setters && style.setters.length > 0) {
            style.setters.forEach((setter, index) => {
                settersHtml += `
                    <div class="property-editor">
                        <label class="property-label">Property: ${setter.property}</label>
                        <input type="text" class="property-input" 
                            value="${escapeHtml(setter.value)}" 
                            data-index="${index}"
                            data-property="${escapeHtml(setter.property)}">
                    </div>
                `;
            });
        }

        container.innerHTML = `
            <div class="property-editor">
                <label class="property-label">Style Name</label>
                <input type="text" class="property-input" value="${escapeHtml(style.name || '')}" id="styleName">
            </div>
            <div class="property-editor">
                <label class="property-label">Target Type</label>
                <input type="text" class="property-input" value="${escapeHtml(style.targetType || '')}" id="targetType">
            </div>
            ${settersHtml}
            <div class="preview-box" id="stylePreview">
                <p style="color: rgba(0, 255, 255, 0.5);">Preview</p>
            </div>
            <button class="lama-btn" style="margin-top: 20px;" onclick="saveStyle()">Save Changes</button>
        `;

        // Add event listeners to inputs
        container.querySelectorAll('.property-input').forEach(input => {
            input.addEventListener('input', () => {
                updateStylePreview();
            });
        });
    }

    function updateStylePreview() {
        // Update preview based on current style values
        const preview = document.getElementById('stylePreview');
        // TODO: Apply style to preview element
    }

    function saveStyle() {
        if (!selectedStyle) return;

        const styleName = document.getElementById('styleName')?.value;
        const targetType = document.getElementById('targetType')?.value;
        const setters = [];

        document.querySelectorAll('.property-editor input[data-property]').forEach(input => {
            setters.push({
                property: input.dataset.property,
                value: input.value
            });
        });

        vscode.postMessage({
            command: 'saveStyle',
            style: {
                id: selectedStyle.id,
                name: styleName,
                targetType: targetType,
                setters: setters
            }
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Make saveStyle global
    window.saveStyle = saveStyle;

    // Handle messages from extension
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'updateStyles':
                currentStyles = message.styles || [];
                renderStyles();
                break;
        }
    });

    init();
})();

