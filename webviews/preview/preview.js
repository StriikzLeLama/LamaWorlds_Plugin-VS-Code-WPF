(function() {
    const vscode = acquireVsCodeApi();

    // State
    let currentImage = null;
    let currentLayoutMap = null;
    let selectedElement = null;
    let zoomLevel = 1.0;
    let isDragging = false;
    let isResizing = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let currentMode = 'FastLive';

    // DOM elements
    const previewImage = document.getElementById('previewImage');
    const overlayCanvas = document.getElementById('overlayCanvas');
    const imageContainer = document.getElementById('imageContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorIndicator = document.getElementById('errorIndicator');
    const errorMessage = document.getElementById('errorMessage');
    const refreshBtn = document.getElementById('refreshBtn');
    const modeBtn = document.getElementById('modeBtn');
    const modeLabel = document.getElementById('modeLabel');
    const zoomLabel = document.getElementById('zoomLabel');
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');

    // Initialize
    function init() {
        setupEventListeners();
        requestPreview();
    }

    function setupEventListeners() {
        refreshBtn.addEventListener('click', () => {
            requestPreview();
        });

        modeBtn.addEventListener('click', () => {
            currentMode = currentMode === 'FastLive' ? 'FullBuild' : 'FastLive';
            modeLabel.textContent = currentMode;
            requestPreview();
        });

        zoomInBtn.addEventListener('click', () => {
            zoomLevel = Math.min(zoomLevel + 0.1, 3.0);
            updateZoom();
        });

        zoomOutBtn.addEventListener('click', () => {
            zoomLevel = Math.max(zoomLevel - 0.1, 0.1);
            updateZoom();
        });

        // Image container click handling
        imageContainer.addEventListener('mousedown', handleMouseDown);
        imageContainer.addEventListener('mousemove', handleMouseMove);
        imageContainer.addEventListener('mouseup', handleMouseUp);
        imageContainer.addEventListener('mouseleave', handleMouseUp);

        // Prevent context menu
        imageContainer.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    function updateZoom() {
        if (previewImage) {
            const scale = zoomLevel;
            previewImage.style.transform = `scale(${scale})`;
            previewImage.style.transformOrigin = 'top left';
            overlayCanvas.style.transform = `scale(${scale})`;
            overlayCanvas.style.transformOrigin = 'top left';
            zoomLabel.textContent = Math.round(zoomLevel * 100) + '%';
        }
    }

    function requestPreview() {
        showLoading();
        vscode.postMessage({
            command: 'requestPreview',
            mode: currentMode
        });
    }

    function showLoading() {
        loadingIndicator.style.display = 'block';
        errorIndicator.style.display = 'none';
        previewImage.style.display = 'none';
    }

    function showError(message) {
        loadingIndicator.style.display = 'none';
        errorIndicator.style.display = 'block';
        errorMessage.textContent = message;
        previewImage.style.display = 'none';
    }

    function showPreview(imageBase64, width, height, layoutMap) {
        loadingIndicator.style.display = 'none';
        errorIndicator.style.display = 'none';
        previewImage.style.display = 'block';

        // Set image
        previewImage.src = 'data:image/png;base64,' + imageBase64;
        previewImage.width = width;
        previewImage.height = height;

        // Set canvas size
        overlayCanvas.width = width;
        overlayCanvas.height = height;
        overlayCanvas.style.width = width + 'px';
        overlayCanvas.style.height = height + 'px';

        // Store layout map
        currentLayoutMap = layoutMap;

        // Update zoom
        updateZoom();
    }

    function handleMouseDown(e) {
        if (!currentLayoutMap) return;

        const rect = imageContainer.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoomLevel;
        const y = (e.clientY - rect.top) / zoomLevel;

        // Find element at click position
        const element = findElementAt(x, y);
        
        if (element) {
            selectedElement = element;
            drawSelection(element);
            
            // Check if clicking on resize handle
            const handle = detectResizeHandle(element, x, y);
            if (handle !== 0) {
                isResizing = true;
                vscode.postMessage({
                    command: 'startResize',
                    elementId: element.id,
                    handle: handle,
                    x: x,
                    y: y
                });
            } else {
                isDragging = true;
                dragStartX = x;
                dragStartY = y;
                vscode.postMessage({
                    command: 'elementSelected',
                    elementId: element.id,
                    element: element
                });
            }
        } else {
            selectedElement = null;
            clearSelection();
        }
    }

    function handleMouseMove(e) {
        if (!currentLayoutMap) return;

        const rect = imageContainer.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoomLevel;
        const y = (e.clientY - rect.top) / zoomLevel;

        if (isDragging && selectedElement) {
            const deltaX = x - dragStartX;
            const deltaY = y - dragStartY;
            
            vscode.postMessage({
                command: 'updateDrag',
                elementId: selectedElement.id,
                deltaX: deltaX,
                deltaY: deltaY,
                x: x,
                y: y
            });
        } else if (isResizing && selectedElement) {
            vscode.postMessage({
                command: 'updateResize',
                elementId: selectedElement.id,
                x: x,
                y: y
            });
        } else {
            // Hover effect
            const element = findElementAt(x, y);
            if (element) {
                drawHover(element);
            } else {
                clearHover();
            }
        }
    }

    function handleMouseUp(e) {
        if (isDragging) {
            isDragging = false;
            vscode.postMessage({
                command: 'endDrag',
                elementId: selectedElement?.id
            });
        }
        if (isResizing) {
            isResizing = false;
            vscode.postMessage({
                command: 'endResize',
                elementId: selectedElement?.id
            });
        }
    }

    function findElementAt(x, y) {
        if (!currentLayoutMap) return null;
        return findElementInTree(currentLayoutMap, x, y);
    }

    function findElementInTree(element, x, y) {
        const bounds = element.bounds;
        
        // Check if point is within bounds
        if (x >= bounds.x && x < bounds.x + bounds.width &&
            y >= bounds.y && y < bounds.y + bounds.height) {
            
            // Check children first (they take precedence)
            if (element.children) {
                for (const child of element.children) {
                    const found = findElementInTree(child, x, y);
                    if (found) return found;
                }
            }
            
            // Return this element if no child contains the point
            return element;
        }
        
        return null;
    }

    function detectResizeHandle(element, x, y) {
        const bounds = element.bounds;
        const handleSize = 8;
        const tolerance = handleSize / 2;

        // Check corners
        if (Math.abs(x - bounds.x) < tolerance && Math.abs(y - bounds.y) < tolerance) {
            return 9; // TopLeft
        }
        if (Math.abs(x - (bounds.x + bounds.width)) < tolerance && Math.abs(y - bounds.y) < tolerance) {
            return 10; // TopRight
        }
        if (Math.abs(x - bounds.x) < tolerance && Math.abs(y - (bounds.y + bounds.height)) < tolerance) {
            return 12; // BottomLeft
        }
        if (Math.abs(x - (bounds.x + bounds.width)) < tolerance && Math.abs(y - (bounds.y + bounds.height)) < tolerance) {
            return 13; // BottomRight
        }

        // Check edges
        if (Math.abs(x - bounds.x) < tolerance && y >= bounds.y && y <= bounds.y + bounds.height) {
            return 4; // Left
        }
        if (Math.abs(x - (bounds.x + bounds.width)) < tolerance && y >= bounds.y && y <= bounds.y + bounds.height) {
            return 8; // Right
        }
        if (Math.abs(y - bounds.y) < tolerance && x >= bounds.x && x <= bounds.x + bounds.width) {
            return 1; // Top
        }
        if (Math.abs(y - (bounds.y + bounds.height)) < tolerance && x >= bounds.x && x <= bounds.x + bounds.width) {
            return 2; // Bottom
        }

        return 0; // None
    }

    function drawSelection(element) {
        const ctx = overlayCanvas.getContext('2d');
        ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

        if (!element) return;

        const bounds = element.bounds;
        
        // Draw selection border
        ctx.strokeStyle = '#007acc';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

        // Draw selection fill
        ctx.fillStyle = 'rgba(0, 122, 204, 0.1)';
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);

        // Draw resize handles
        drawResizeHandles(bounds);
    }

    function drawResizeHandles(bounds) {
        const ctx = overlayCanvas.getContext('2d');
        const handleSize = 8;

        ctx.fillStyle = '#007acc';
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;

        // Corner handles
        drawHandle(ctx, bounds.x, bounds.y, handleSize);
        drawHandle(ctx, bounds.x + bounds.width, bounds.y, handleSize);
        drawHandle(ctx, bounds.x, bounds.y + bounds.height, handleSize);
        drawHandle(ctx, bounds.x + bounds.width, bounds.y + bounds.height, handleSize);

        // Edge handles
        drawHandle(ctx, bounds.x, bounds.y + bounds.height / 2, handleSize);
        drawHandle(ctx, bounds.x + bounds.width, bounds.y + bounds.height / 2, handleSize);
        drawHandle(ctx, bounds.x + bounds.width / 2, bounds.y, handleSize);
        drawHandle(ctx, bounds.x + bounds.width / 2, bounds.y + bounds.height, handleSize);
    }

    function drawHandle(ctx, x, y, size) {
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    function drawHover(element) {
        const ctx = overlayCanvas.getContext('2d');
        const bounds = element.bounds;
        
        ctx.strokeStyle = '#4ec9b0';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }

    function clearSelection() {
        const ctx = overlayCanvas.getContext('2d');
        ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    }

    function clearHover() {
        // Redraw selection if exists
        if (selectedElement) {
            drawSelection(selectedElement);
        } else {
            clearSelection();
        }
    }

    // Listen for messages from extension
    window.addEventListener('message', event => {
        const message = event.data;

        switch (message.command) {
            case 'previewUpdate':
                showPreview(message.imageBase64, message.width, message.height, message.layoutMap);
                break;
            case 'previewError':
                showError(message.error || 'Preview error occurred');
                break;
            case 'elementHighlighted':
                if (message.element) {
                    selectedElement = message.element;
                    drawSelection(selectedElement);
                }
                break;
            case 'clearSelection':
                selectedElement = null;
                clearSelection();
                break;
        }
    });

    // Initialize on load
    init();
})();

