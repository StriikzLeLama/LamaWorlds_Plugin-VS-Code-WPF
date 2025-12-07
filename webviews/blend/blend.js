(function() {
    const vscode = acquireVsCodeApi();
    let states = [];
    let triggers = [];

    function init() {
        setupEventListeners();
    }

    function setupEventListeners() {
        document.getElementById('addStateBtn').addEventListener('click', () => {
            const name = prompt('Enter state name:', 'Normal');
            if (name) {
                vscode.postMessage({
                    command: 'addVisualState',
                    data: { name }
                });
            }
        });

        document.getElementById('addTriggerBtn').addEventListener('click', () => {
            const type = prompt('Trigger type (Event/Data/Property):', 'Event');
            if (type) {
                vscode.postMessage({
                    command: 'addTrigger',
                    data: { type }
                });
            }
        });

        document.getElementById('generateBtn').addEventListener('click', () => {
            vscode.postMessage({ command: 'generateXaml' });
        });
    }

    window.addEventListener('message', event => {
        const message = event.data;
        // Handle updates
    });

    init();
})();

