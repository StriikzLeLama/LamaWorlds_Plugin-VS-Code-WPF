(function() {
    const vscode = acquireVsCodeApi();
    
    const emptyState = document.getElementById('emptyState');
    const propertiesContent = document.getElementById('propertiesContent');
    const elementTag = document.getElementById('elementTag');
    
    // Property inputs
    const inputs = {
        'Name': document.getElementById('prop-Name'),
        'Type': document.getElementById('prop-Type'),
        'Width': document.getElementById('prop-Width'),
        'Height': document.getElementById('prop-Height'),
        'Margin': document.getElementById('prop-Margin'),
        'HorizontalAlignment': document.getElementById('prop-HorizontalAlignment'),
        'VerticalAlignment': document.getElementById('prop-VerticalAlignment'),
        'Visibility': document.getElementById('prop-Visibility'),
        'Opacity': document.getElementById('prop-Opacity')
    };

    let selectedElementId = null;

    // Handle messages from extension
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'elementSelected':
                showProperties(message.element, message.properties);
                break;
            case 'clearSelection':
                hideProperties();
                break;
        }
    });

    function showProperties(element, properties) {
        selectedElementId = element.id;
        emptyState.style.display = 'none';
        propertiesContent.style.display = 'block';
        elementTag.textContent = `<${element.type}>`;

        // Fill inputs
        for (const [key, input] of Object.entries(inputs)) {
            if (input && properties[key.charAt(0).toLowerCase() + key.slice(1)] !== undefined) {
                const val = properties[key.charAt(0).toLowerCase() + key.slice(1)];
                input.value = val === null ? '' : val;
            } else if (input && properties[key] !== undefined) {
                input.value = properties[key] === null ? '' : properties[key];
            }
        }
    }

    function hideProperties() {
        selectedElementId = null;
        emptyState.style.display = 'flex';
        propertiesContent.style.display = 'none';
        elementTag.textContent = 'No Selection';
    }

    // Add event listeners to inputs
    for (const [key, input] of Object.entries(inputs)) {
        if (!input) continue;

        const eventType = input.type === 'range' ? 'input' : 'change';
        
        input.addEventListener(eventType, () => {
            if (!selectedElementId) return;

            vscode.postMessage({
                command: 'updateProperty',
                elementId: selectedElementId,
                property: key,
                value: input.value
            });
        });
    }
})();
