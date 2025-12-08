(function() {
    const vscode = acquireVsCodeApi();

    function init() {
        setupEventListeners();
        renderTheme();
    }

    function setupEventListeners() {
        document.getElementById('saveBtn').addEventListener('click', () => {
            saveTheme();
        });
    }

    function renderTheme() {
        // Render colors
        const colors = [
            { name: 'Primary', value: '#00ffff' },
            { name: 'Secondary', value: '#0080ff' },
            { name: 'Accent', value: '#8000ff' },
            { name: 'Background', value: '#0a0e27' },
            { name: 'Foreground', value: '#00ffff' }
        ];

        const colorsContainer = document.getElementById('colorsContainer');
        colorsContainer.innerHTML = colors.map(color => `
            <div class="color-item">
                <span class="item-label">${color.name}</span>
                <div style="display: flex; align-items: center;">
                    <input type="color" class="item-input" value="${color.value}" data-name="${color.name}">
                    <div class="color-preview" style="background: ${color.value};" data-preview="${color.name}"></div>
                </div>
            </div>
        `).join('');

        // Add color change listeners
        colorsContainer.querySelectorAll('input[type="color"]').forEach(input => {
            input.addEventListener('change', (e) => {
                const preview = document.querySelector(`[data-preview="${e.target.dataset.name}"]`);
                if (preview) {
                    preview.style.background = e.target.value;
                }
            });
        });

        // Render brushes
        const brushes = [
            { name: 'PrimaryBrush', value: 'SolidColorBrush #00ffff' },
            { name: 'BackgroundBrush', value: 'SolidColorBrush #0a0e27' }
        ];

        const brushesContainer = document.getElementById('brushesContainer');
        brushesContainer.innerHTML = brushes.map(brush => `
            <div class="brush-item">
                <span class="item-label">${brush.name}</span>
                <input type="text" class="item-input" value="${brush.value}" data-name="${brush.name}">
            </div>
        `).join('');

        // Render fonts
        const fonts = [
            { name: 'FontFamily', value: 'Segoe UI' },
            { name: 'FontSize', value: '14' },
            { name: 'FontWeight', value: 'Normal' }
        ];

        const fontsContainer = document.getElementById('fontsContainer');
        fontsContainer.innerHTML = fonts.map(font => `
            <div class="font-item">
                <span class="item-label">${font.name}</span>
                <input type="text" class="item-input" value="${font.value}" data-name="${font.name}">
            </div>
        `).join('');
    }

    function saveTheme() {
        const theme = {
            colors: {},
            brushes: {},
            fonts: {}
        };

        document.querySelectorAll('#colorsContainer input').forEach(input => {
            theme.colors[input.dataset.name] = input.value;
        });

        document.querySelectorAll('#brushesContainer input').forEach(input => {
            theme.brushes[input.dataset.name] = input.value;
        });

        document.querySelectorAll('#fontsContainer input').forEach(input => {
            theme.fonts[input.dataset.name] = input.value;
        });

        vscode.postMessage({
            command: 'saveTheme',
            theme
        });
    }

    // Handle messages from extension
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'updateTheme':
                // Update theme values
                break;
        }
    });

    init();
})();

