(function () {
    const vscode = acquireVsCodeApi();

    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');

    // Handle messages from extension
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'addMessage':
                addMessage(message.text, message.sender);
                break;
        }
    });

    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        // Use marked or similar if available, otherwise simple formatting
        messageDiv.innerHTML = formatText(text);

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function formatText(text) {
        // Simple bolding and line breaks
        return text
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/\n/g, '<br>');
    }

    function sendMessage() {
        const text = chatInput.value.trim();
        if (text) {
            addMessage(text, 'user');
            vscode.postMessage({
                command: 'askAI',
                text: text
            });
            chatInput.value = '';
            chatInput.style.height = 'auto';
        }
    }

    window.askAI = function (text) {
        chatInput.value = text;
        sendMessage();
    };

    sendBtn.addEventListener('click', sendMessage);

    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto-resize textarea
    chatInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
})();
