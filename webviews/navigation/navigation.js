(function() {
    const vscode = acquireVsCodeApi();

    let nodes = [];
    let edges = [];
    let selectedNode = null;

    function init() {
        setupEventListeners();
    }

    function setupEventListeners() {
        document.getElementById('refreshBtn').addEventListener('click', () => {
            vscode.postMessage({
                command: 'refreshGraph'
            });
        });
    }

    function renderGraph() {
        const container = document.getElementById('graphContainer');
        container.innerHTML = '';

        if (nodes.length === 0) {
            container.innerHTML = '<p style="color: rgba(0, 255, 255, 0.5); padding: 20px;">No navigation data available</p>';
            return;
        }

        // Simple layout algorithm (force-directed would be better)
        const positions = layoutNodes(nodes);
        
        // Render edges first (behind nodes)
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.position = 'absolute';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.zIndex = '1';
        container.appendChild(svg);

        edges.forEach(edge => {
            const fromNode = nodes.find(n => n.id === edge.from);
            const toNode = nodes.find(n => n.id === edge.to);
            if (fromNode && toNode) {
                const fromPos = positions[fromNode.id];
                const toPos = positions[toNode.id];
                
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', fromPos.x + 60);
                line.setAttribute('y1', fromPos.y + 40);
                line.setAttribute('x2', toPos.x + 60);
                line.setAttribute('y2', toPos.y + 40);
                line.setAttribute('stroke', '#00ffff');
                line.setAttribute('stroke-width', '2');
                line.setAttribute('opacity', '0.6');
                svg.appendChild(line);

                // Arrow head
                const angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x);
                const arrowSize = 10;
                const arrowX = toPos.x + 60 - Math.cos(angle) * 60;
                const arrowY = toPos.y + 40 - Math.sin(angle) * 40;
                
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const pathData = `M ${arrowX} ${arrowY} L ${arrowX - arrowSize * Math.cos(angle - Math.PI / 6)} ${arrowY - arrowSize * Math.sin(angle - Math.PI / 6)} L ${arrowX - arrowSize * Math.cos(angle + Math.PI / 6)} ${arrowY - arrowSize * Math.sin(angle + Math.PI / 6)} Z`;
                path.setAttribute('d', pathData);
                path.setAttribute('fill', '#00ffff');
                svg.appendChild(path);
            }
        });

        // Render nodes
        nodes.forEach(node => {
            const pos = positions[node.id];
            const nodeElement = document.createElement('div');
            nodeElement.className = `node ${node.type.toLowerCase()}`;
            nodeElement.style.left = pos.x + 'px';
            nodeElement.style.top = pos.y + 'px';
            nodeElement.style.zIndex = '10';
            
            nodeElement.innerHTML = `
                <div class="node-title">${escapeHtml(node.label)}</div>
                <div class="node-type">${escapeHtml(node.type)}</div>
            `;

            nodeElement.addEventListener('click', () => {
                vscode.postMessage({
                    command: 'openFile',
                    path: node.filePath
                });
            });

            container.appendChild(nodeElement);
        });
    }

    function layoutNodes(nodes) {
        const positions = {};
        const cols = Math.ceil(Math.sqrt(nodes.length));
        const spacing = 200;
        const startX = 100;
        const startY = 100;

        nodes.forEach((node, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            positions[node.id] = {
                x: startX + col * spacing,
                y: startY + row * spacing
            };
        });

        return positions;
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
            case 'updateGraph':
                nodes = message.nodes || [];
                edges = message.edges || [];
                renderGraph();
                break;
        }
    });

    init();
})();

