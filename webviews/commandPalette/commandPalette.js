// Lama Worlds Command Palette JavaScript

const vscode = acquireVsCodeApi();

let allCommands = [];
let filteredCommands = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Extract all commands from the DOM
    const commandButtons = document.querySelectorAll('.command-btn');
    allCommands = Array.from(commandButtons).map(btn => ({
        element: btn,
        label: btn.querySelector('.command-label').textContent.toLowerCase(),
        id: btn.getAttribute('data-command')
    }));
    filteredCommands = [...allCommands];
    
    // Focus search box
    const searchBox = document.getElementById('searchBox');
    if (searchBox) {
        searchBox.focus();
        
        // Add search functionality
        searchBox.addEventListener('input', handleSearch);
        
        // Handle Enter key to execute first result
        searchBox.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const firstVisible = document.querySelector('.command-btn:not(.hidden)');
                if (firstVisible) {
                    executeCommand(firstVisible.getAttribute('data-command'));
                }
            }
        });
        
        // Handle Escape to clear search
        searchBox.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchBox.value = '';
                handleSearch({ target: searchBox });
            }
        });
    }
    
    // Add keyboard shortcuts for navigation
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'L') {
            // Already handled by VS Code, but keep focus on search
            searchBox?.focus();
        }
    });
});

function executeCommand(commandId) {
    vscode.postMessage({
        command: 'executeCommand',
        commandId: commandId
    });
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    const commandCount = document.getElementById('commandCount');
    const categories = document.querySelectorAll('.category');
    
    let visibleCount = 0;
    
    allCommands.forEach(cmd => {
        const matches = searchTerm === '' || cmd.label.includes(searchTerm);
        cmd.element.classList.toggle('hidden', !matches);
        if (matches) {
            visibleCount++;
        }
    });
    
    // Update command count
    if (commandCount) {
        commandCount.textContent = `${visibleCount} command${visibleCount !== 1 ? 's' : ''} available`;
    }
    
    // Show/hide categories based on visible commands
    categories.forEach(category => {
        const visibleCommands = Array.from(category.querySelectorAll('.command-btn:not(.hidden)'));
        category.classList.toggle('hidden', visibleCommands.length === 0 && searchTerm !== '');
    });
    
    // Highlight search term in visible commands
    if (searchTerm) {
        allCommands.forEach(cmd => {
            if (!cmd.element.classList.contains('hidden')) {
                const labelElement = cmd.element.querySelector('.command-label');
                const originalText = labelElement.textContent;
                const regex = new RegExp(`(${searchTerm})`, 'gi');
                labelElement.innerHTML = originalText.replace(regex, '<mark style="background: rgba(86, 176, 255, 0.3); color: #56b0ff; padding: 2px 4px; border-radius: 3px;">$1</mark>');
            }
        });
    } else {
        // Reset highlights
        allCommands.forEach(cmd => {
            const labelElement = cmd.element.querySelector('.command-label');
            labelElement.innerHTML = labelElement.textContent;
        });
    }
}

// Make executeCommand available globally
window.executeCommand = executeCommand;

