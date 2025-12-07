(function() {
    const vscode = acquireVsCodeApi();
    let treeData = null;
    let selectedNodeId = null;

    // Initialize
    function init() {
        setupEventListeners();
        loadTreeData();
    }

    function setupEventListeners() {
        document.getElementById('refreshBtn').addEventListener('click', () => {
            vscode.postMessage({ command: 'refresh' });
        });

        document.getElementById('expandAllBtn').addEventListener('click', () => {
            expandAll();
        });

        document.getElementById('collapseAllBtn').addEventListener('click', () => {
            collapseAll();
        });
    }

    function loadTreeData() {
        // Tree data will be injected by the panel
        if (typeof treeData !== 'undefined' && treeData) {
            renderTree(treeData);
        }
    }

    function renderTree(data) {
        treeData = data;
        const treeView = document.getElementById('treeView');
        
        if (!data) {
            treeView.innerHTML = '<div class="empty-state">No visual tree available. Open XAML preview to load tree.</div>';
            return;
        }

        treeView.innerHTML = renderTreeNode(data, 0);
    }

    function renderTreeNode(node, depth) {
        const indent = depth * 20;
        const hasChildren = node.children && node.children.length > 0;
        const displayName = node.name || node.type || 'Element';
        const icon = getIconForType(node.type);
        
        let html = `
            <div class="tree-node" data-element-id="${node.id}" onclick="selectNode('${node.id}')">
                <span class="tree-toggle ${hasChildren ? '' : 'hidden'}" onclick="event.stopPropagation(); toggleNode(this)">▶</span>
                <span class="tree-icon">${icon}</span>
                <span class="tree-label">${escapeHtml(displayName)}</span>
                <span class="tree-type">${node.type}</span>
            </div>`;

        if (hasChildren) {
            html += `<div class="tree-children" style="display: none;">`;
            for (const child of node.children) {
                html += renderTreeNode(child, depth + 1);
            }
            html += `</div>`;
        }

        return html;
    }

    function getIconForType(type) {
        const icons = {
            'Grid': '⊞',
            'StackPanel': '▦',
            'Button': '🔘',
            'TextBlock': '📝',
            'TextBox': '📄',
            'Border': '▦',
            'Canvas': '🖼️',
            'Image': '🖼️',
            'ListView': '📋',
            'ComboBox': '▼'
        };
        return icons[type] || '▢';
    }

    function toggleNode(toggleElement) {
        const node = toggleElement.parentElement;
        const children = node.nextElementSibling;
        
        if (children && children.classList.contains('tree-children')) {
            const isExpanded = toggleElement.classList.contains('expanded');
            
            if (isExpanded) {
                toggleElement.classList.remove('expanded');
                children.style.display = 'none';
            } else {
                toggleElement.classList.add('expanded');
                children.style.display = 'block';
            }
        }
    }

    function selectNode(elementId) {
        selectedNodeId = elementId;
        
        // Update UI
        document.querySelectorAll('.tree-node').forEach(node => {
            node.classList.remove('selected');
        });
        
        const selectedNode = document.querySelector(`[data-element-id="${elementId}"]`);
        if (selectedNode) {
            selectedNode.classList.add('selected');
        }

        // Request element details
        vscode.postMessage({
            command: 'selectNode',
            elementId: elementId
        });
    }

    function expandAll() {
        document.querySelectorAll('.tree-children').forEach(children => {
            children.style.display = 'block';
        });
        document.querySelectorAll('.tree-toggle').forEach(toggle => {
            toggle.classList.add('expanded');
        });
    }

    function collapseAll() {
        document.querySelectorAll('.tree-children').forEach(children => {
            children.style.display = 'none';
        });
        document.querySelectorAll('.tree-toggle').forEach(toggle => {
            toggle.classList.remove('expanded');
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function renderProperties(element) {
        const propertiesContent = document.getElementById('propertiesContent');
        
        if (!element) {
            propertiesContent.innerHTML = '<div class="empty-state">Select an element to view properties</div>';
            return;
        }

        const bounds = element.bounds;
        const html = `
            <div class="property-group">
                <div class="property-group-title">Element Information</div>
                <div class="property-item">
                    <span class="property-label">Type</span>
                    <span class="property-value type">${escapeHtml(element.type)}</span>
                </div>
                <div class="property-item">
                    <span class="property-label">Name</span>
                    <span class="property-value">${escapeHtml(element.name || '(unnamed)')}</span>
                </div>
                <div class="property-item">
                    <span class="property-label">ID</span>
                    <span class="property-value">${escapeHtml(element.id)}</span>
                </div>
            </div>
            
            <div class="property-group">
                <div class="property-group-title">Layout</div>
                <div class="property-item">
                    <span class="property-label">X</span>
                    <span class="property-value bounds">${bounds.x}px</span>
                </div>
                <div class="property-item">
                    <span class="property-label">Y</span>
                    <span class="property-value bounds">${bounds.y}px</span>
                </div>
                <div class="property-item">
                    <span class="property-label">Width</span>
                    <span class="property-value bounds">${bounds.width}px</span>
                </div>
                <div class="property-item">
                    <span class="property-label">Height</span>
                    <span class="property-value bounds">${bounds.height}px</span>
                </div>
                ${element.margin ? `
                <div class="property-item">
                    <span class="property-label">Margin</span>
                    <span class="property-value">${escapeHtml(element.margin)}</span>
                </div>
                ` : ''}
                ${element.width !== undefined ? `
                <div class="property-item">
                    <span class="property-label">Width (set)</span>
                    <span class="property-value">${element.width}</span>
                </div>
                ` : ''}
                ${element.height !== undefined ? `
                <div class="property-item">
                    <span class="property-label">Height (set)</span>
                    <span class="property-value">${element.height}</span>
                </div>
                ` : ''}
            </div>
            
            ${element.gridRow !== undefined || element.gridColumn !== undefined ? `
            <div class="property-group">
                <div class="property-group-title">Grid Position</div>
                ${element.gridRow !== undefined ? `
                <div class="property-item">
                    <span class="property-label">Row</span>
                    <span class="property-value">${element.gridRow}</span>
                </div>
                ` : ''}
                ${element.gridColumn !== undefined ? `
                <div class="property-item">
                    <span class="property-label">Column</span>
                    <span class="property-value">${element.gridColumn}</span>
                </div>
                ` : ''}
            </div>
            ` : ''}
            
            ${element.canvasLeft !== undefined || element.canvasTop !== undefined ? `
            <div class="property-group">
                <div class="property-group-title">Canvas Position</div>
                ${element.canvasLeft !== undefined ? `
                <div class="property-item">
                    <span class="property-label">Left</span>
                    <span class="property-value">${element.canvasLeft}</span>
                </div>
                ` : ''}
                ${element.canvasTop !== undefined ? `
                <div class="property-item">
                    <span class="property-label">Top</span>
                    <span class="property-value">${element.canvasTop}</span>
                </div>
                ` : ''}
            </div>
            ` : ''}
            
            <div class="property-group">
                <div class="property-group-title">Actions</div>
                <button class="btn" style="width: 100%; margin-top: 8px;" onclick="jumpToXaml('${element.id}')">
                    📍 Jump to XAML
                </button>
            </div>
        `;

        propertiesContent.innerHTML = html;
    }

    function jumpToXaml(elementId) {
        vscode.postMessage({
            command: 'jumpToXaml',
            elementId: elementId
        });
    }

    // Expose functions globally
    window.toggleNode = toggleNode;
    window.selectNode = selectNode;
    window.jumpToXaml = jumpToXaml;

    // Listen for messages from extension
    window.addEventListener('message', event => {
        const message = event.data;

        switch (message.command) {
            case 'treeUpdated':
                renderTree(message.tree);
                break;
            case 'elementSelected':
                renderProperties(message.element);
                if (message.element) {
                    selectNode(message.element.id);
                }
                break;
        }
    });

    // Initialize
    init();
})();

