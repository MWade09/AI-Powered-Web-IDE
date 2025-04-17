/**
 * Advanced Web IDE with OpenRouter AI Integration
 * 
 * This script provides functionality for a web code editor with
 * real-time preview, OpenRouter API integration, and dual-mode AI assistance.
 */

// Global variables
let models = [
    { id: 'openrouter/qwen/qwen-2-7b-instruct:free', name: 'Qwen 2 7B (Free)' },
    { id: 'mistralai/mixtral-8x7b-instruct', name: 'Mixtral 8x7B' },
    { id: 'anthropic/claude-3-opus:beta', name: 'Claude 3 Opus' },
    { id: 'anthropic/claude-3-sonnet:beta', name: 'Claude 3 Sonnet' }
];
let apiStats = {
    requestCount: 0,
    lastModel: 'None',
    lastResponseTime: 0
};
let isStreaming = false;
let currentTab = 'html';
let currentMode = 'chat';
let apiKey = '';

// DOM Elements - Main UI
const htmlEditor = document.getElementById('html-code');
const cssEditor = document.getElementById('css-code');
const jsEditor = document.getElementById('js-code');
const previewFrame = document.getElementById('preview-frame');
const htmlTab = document.getElementById('html-tab');
const cssTab = document.getElementById('css-tab');
const jsTab = document.getElementById('js-tab');
const refreshPreviewBtn = document.getElementById('refresh-preview');

// DOM Elements - API Key
const apiKeyInput = document.getElementById('api-key-input');
const saveApiKeyBtn = document.getElementById('save-api-key');
const apiKeyStatus = document.getElementById('api-key-status');
const apiKeyModal = document.getElementById('api-key-modal');
const modalApiKeyInput = document.getElementById('modal-api-key');
const saveModalApiKeyBtn = document.getElementById('save-modal-api-key');
const continueWithoutKeyBtn = document.getElementById('continue-without-key');
const apiKeyDebugStatus = document.getElementById('api-key-debug-status');

// DOM Elements - Mode Selection
const chatModeBtn = document.getElementById('chat-mode-btn');
const agentModeBtn = document.getElementById('agent-mode-btn');
const chatSection = document.getElementById('chat-section');
const agentSection = document.getElementById('agent-section');
const ideSection = document.getElementById('ide-section');

// DOM Elements - Chat Mode
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendChatBtn = document.getElementById('send-chat');

// DOM Elements - Agent Mode
const agentInput = document.getElementById('agent-input');
const agentTarget = document.getElementById('agent-target');
const executeAgentBtn = document.getElementById('execute-agent');

// DOM Elements - Model Selection
const modelSelector = document.getElementById('model-selector');
const addModelBtn = document.getElementById('add-model-btn');
const addModelModal = document.getElementById('add-model-modal');
const newModelId = document.getElementById('new-model-id');
const newModelName = document.getElementById('new-model-name');
const cancelAddModel = document.getElementById('cancel-add-model');
const confirmAddModel = document.getElementById('confirm-add-model');
const currentModel = document.getElementById('current-model');

// DOM Elements - File Explorer
const downloadFileBtn = document.getElementById('download-file');
const downloadProjectBtn = document.getElementById('download-project');
const fileList = document.querySelectorAll('.file');

// DOM Elements - Debug Panel
const enhanceBtn = document.getElementById('enhance-btn');
const debugToggle = document.getElementById('debug-toggle');
const closeDebugBtn = document.getElementById('close-debug');
const debugPanel = document.getElementById('debug-panel');
const debugLogs = document.getElementById('debug-logs');
const debugStats = document.getElementById('debug-stats');
const debugNetwork = document.getElementById('debug-network');
const clearLogsBtn = document.getElementById('clear-logs');
const requestCountEl = document.getElementById('request-count');
const lastResponseTimeEl = document.getElementById('last-response-time');
const debugTabs = document.querySelectorAll('.debug-tab');

// DOM Elements - Export
const exportBtn = document.getElementById('export-btn');
const exportHtml = document.getElementById('export-html');
const exportCss = document.getElementById('export-css');
const exportJs = document.getElementById('export-js');
const exportZip = document.getElementById('export-zip');

/**
 * Initialize the application
 */
function init() {
    // Start with API key modal hidden - no API key required to use the editor
    apiKeyModal.classList.add('hidden');
    apiKeyModal.style.display = 'none';
    
    // Make Agent Mode panel visible by default (remove hidden class)
    agentSection.classList.remove('hidden');
    
    // Set editor as fully functional without AI features
    updateApiKeyStatus(false);
    
    // Set up event listeners for API key
    apiKeyInput.addEventListener('input', validateApiKey);
    saveApiKeyBtn.addEventListener('click', saveApiKey);
    modalApiKeyInput.addEventListener('input', validateApiKey);
    saveModalApiKeyBtn.addEventListener('click', saveModalApiKey);
    continueWithoutKeyBtn.addEventListener('click', continueWithoutKey);
    
    // Add info button functionality
    document.getElementById('show-api-info').addEventListener('click', showApiKeyInfo);
    
    // Set up event listeners for mode switching
    chatModeBtn.addEventListener('click', () => switchMode('chat'));
    agentModeBtn.addEventListener('click', () => switchMode('agent'));
    
    // Set up event listeners for editor
    htmlEditor.addEventListener('input', debounce(updatePreview, 300));
    cssEditor.addEventListener('input', debounce(updatePreview, 300));
    jsEditor.addEventListener('input', debounce(updatePreview, 300));
    refreshPreviewBtn.addEventListener('click', updatePreview);
    
    // Set up event listeners for tabs
    htmlTab.addEventListener('click', () => switchTab('html'));
    cssTab.addEventListener('click', () => switchTab('css'));
    jsTab.addEventListener('click', () => switchTab('js'));
    
    // Set up event listeners for chat
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });
    sendChatBtn.addEventListener('click', sendChatMessage);
    
    // Set up event listeners for agent
    agentInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            executeAgentAction();
        }
    });
    executeAgentBtn.addEventListener('click', executeAgentAction);
    
    // Set up event listeners for model selection
    addModelBtn.addEventListener('click', showAddModelModal);
    cancelAddModel.addEventListener('click', hideAddModelModal);
    confirmAddModel.addEventListener('click', addCustomModel);
    
    // Set up event listeners for file explorer
    downloadFileBtn.addEventListener('click', downloadCurrentFile);
    downloadProjectBtn.addEventListener('click', downloadProject);
    fileList.forEach(file => {
        file.addEventListener('click', () => {
            const fileType = file.classList.contains('html-file') ? 'html' : 
                            file.classList.contains('css-file') ? 'css' : 'js';
            switchTab(fileType);
        });
    });
    
    // Set up event listeners for debug panel
    debugToggle.addEventListener('click', toggleDebugPanel);
    closeDebugBtn.addEventListener('click', toggleDebugPanel);
    clearLogsBtn.addEventListener('click', clearLogs);
    
    // Set up event listeners for export
    exportHtml.addEventListener('click', () => exportContent('html'));
    exportCss.addEventListener('click', () => exportContent('css'));
    exportJs.addEventListener('click', () => exportContent('js'));
    exportZip.addEventListener('click', () => exportContent('zip'));
    
    // Set up debug tabs
    debugTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            setActiveDebugTab(tabName);
        });
    });
    
    // Set up close buttons for modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            modal.classList.add('hidden');
        });
    });

    // Add sample code if editors are empty
    if (htmlEditor.value.trim() === '') {
        htmlEditor.value = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Web Page</title>
    <style>
        /* CSS will be injected here */
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to the Advanced Web IDE</h1>
        <p>This is a <strong>live preview</strong> editor with AI assistance.</p>
        <div class="card">
            <h2>Features:</h2>
            <ul>
                <li>HTML, CSS, and JavaScript editing</li>
                <li>Real-time preview</li>
                <li>Chat Mode for planning and discussion</li>
                <li>Agent Mode for direct code modification</li>
                <li>OpenRouter AI enhancement</li>
                <li>File download options</li>
            </ul>
        </div>
        <button id="demo-button">Click Me!</button>
    </div>
    
    <script>
        /* JavaScript will be injected here */
    </script>
</body>
</html>`;
    }
    
    if (cssEditor.value.trim() === '') {
        cssEditor.value = `/* Sample CSS */
body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f5f5f5;
    margin: 0;
    padding: 20px;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h1 {
    color: #2c3e50;
    border-bottom: 2px solid #3498db;
    padding-bottom: 10px;
}

.card {
    background-color: #f8f9fa;
    border-left: 4px solid #3498db;
    padding: 15px;
    margin: 20px 0;
}

button {
    background-color: #3498db;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
}

button:hover {
    background-color: #2980b9;
}`;
    }
    
    if (jsEditor.value.trim() === '') {
        jsEditor.value = `// Sample JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Get the button element
    const button = document.getElementById('demo-button');
    
    // Add click event listener
    button.addEventListener('click', function() {
        alert('Button clicked! This is the JavaScript in action.');
    });
    
    // Log a message to the console
    console.log('JavaScript initialized successfully!');
});`;
    }
    
    // Initial preview update
    updatePreview();
    
    // Log initialization
    logToDebug('Editor initialized successfully', 'info');
    
    // Expose API for external use
    exposeEditorAPI();
    
    // Add animation effects
    addAnimationEffects();
}

/**
 * Show the API key modal on first load
 */
function showApiKeyModal() {
    apiKeyModal.classList.remove('hidden');
    modalApiKeyInput.focus();
}

/**
 * Continue without an API key
 */
function continueWithoutKey() {
    apiKeyModal.classList.add('hidden');
    logToDebug('Continuing without API key. AI features will be disabled.', 'warning');
    updateApiKeyStatus(false);
    
    // Make sure the modal is completely hidden
    setTimeout(() => {
        apiKeyModal.style.display = 'none';
    }, 100);
}

/**
 * Validate the API key format
 * @param {Event} event - Input event
 */
function validateApiKey(event) {
    const input = event.target;
    const key = input.value.trim();
    
    // Basic validation - OpenRouter keys typically start with 'sk-'
    if (key && key.startsWith('sk-') && key.length > 10) {
        input.style.borderColor = 'var(--success-green)';
        return true;
    } else if (key) {
        input.style.borderColor = 'var(--error-red)';
        return false;
    } else {
        input.style.borderColor = '';
        return false;
    }
}

/**
 * Save the API key from the main input
 */
function saveApiKey() {
    const key = apiKeyInput.value.trim();
    if (key) {
        if (validateApiKey({ target: apiKeyInput })) {
            apiKey = key;
            updateApiKeyStatus(true);
            logToDebug('API key saved successfully', 'success');
        } else {
            logToDebug('Invalid API key format. Keys typically start with "sk-"', 'error');
        }
    } else {
        apiKey = '';
        updateApiKeyStatus(false);
        logToDebug('API key removed', 'warning');
    }
}

/**
 * Save the API key from the modal
 */
function saveModalApiKey() {
    const key = modalApiKeyInput.value.trim();
    if (key) {
        if (validateApiKey({ target: modalApiKeyInput })) {
            apiKey = key;
            apiKeyInput.value = key;
            updateApiKeyStatus(true);
            apiKeyModal.classList.add('hidden');
            logToDebug('API key saved successfully', 'success');
        } else {
            logToDebug('Invalid API key format. Keys typically start with "sk-"', 'error');
        }
    } else {
        continueWithoutKey();
    }
}

/**
 * Update the API key status indicators and enable/disable AI features
 * @param {boolean} isValid - Whether the API key is valid
 */
function updateApiKeyStatus(isValid) {
    if (isValid) {
        apiKeyStatus.textContent = 'API Key Set';
        apiKeyStatus.className = 'status-indicator success';
        apiKeyDebugStatus.textContent = 'Valid';
        apiKeyDebugStatus.className = 'success';
        
        // Enable AI features
        modelSelector.disabled = false;
        addModelBtn.disabled = false;
        enhanceBtn.disabled = false;
        sendChatBtn.disabled = false;
        executeAgentBtn.disabled = false;
    } else {
        apiKeyStatus.textContent = 'No API Key Set';
        apiKeyStatus.className = 'status-indicator';
        apiKeyDebugStatus.textContent = 'Not Set';
        apiKeyDebugStatus.className = '';
        
        // Disable AI features but ensure UI is still functional
        modelSelector.disabled = true;
        addModelBtn.disabled = true;
        enhanceBtn.disabled = true;
        sendChatBtn.disabled = true;
        executeAgentBtn.disabled = true;
        
        // Make sure the modal is completely gone
        apiKeyModal.classList.add('hidden');
        apiKeyModal.style.display = 'none';
    }
    
    // Ensure editor functionality works regardless of API key status
    updatePreview();
}

/**
 * Switch between Chat and Agent modes
 * @param {string} mode - Mode to switch to ('chat' or 'agent')
 */
function switchMode(mode) {
    currentMode = mode;
    
    // Update mode buttons
    chatModeBtn.classList.toggle('active', mode === 'chat');
    agentModeBtn.classList.toggle('active', mode === 'agent');
    
    // Update section visibility
    chatSection.classList.toggle('hidden', mode !== 'chat');
    agentSection.classList.toggle('hidden', mode !== 'agent');
    
    // Focus the appropriate input field
    if (mode === 'chat') {
        chatInput.focus();
    } else {
        agentInput.focus();
    }
    
    logToDebug(`Switched to ${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`, 'info');
}

/**
 * Switch between HTML, CSS, and JS tabs
 * @param {string} tab - Tab to switch to ('html', 'css', or 'js')
 */
function switchTab(tab) {
    currentTab = tab;
    
    // Update tab buttons
    htmlTab.classList.toggle('active', tab === 'html');
    cssTab.classList.toggle('active', tab === 'css');
    jsTab.classList.toggle('active', tab === 'js');
    
    // Update editor visibility
    document.getElementById('html-editor').classList.toggle('active', tab === 'html');
    document.getElementById('css-editor').classList.toggle('active', tab === 'css');
    document.getElementById('js-editor').classList.toggle('active', tab === 'js');
    
    // Update file list selection
    document.querySelector('.html-file').classList.toggle('active', tab === 'html');
    document.querySelector('.css-file').classList.toggle('active', tab === 'css');
    document.querySelector('.js-file').classList.toggle('active', tab === 'js');
    
    logToDebug(`Switched to ${tab.toUpperCase()} tab`, 'info');
}

/**
 * Update the preview iframe with the current code
 */
function updatePreview() {
    try {
        // Get the HTML, CSS, and JS code
        const htmlCode = htmlEditor.value;
        const cssCode = cssEditor.value;
        const jsCode = jsEditor.value;
        
        // Create a complete HTML document
        let previewContent = htmlCode;
        
        // If the HTML doesn't include style tags, inject the CSS
        if (!previewContent.includes('</style>')) {
            previewContent = previewContent.replace('</head>', `<style>${cssCode}</style></head>`);
        } else {
            // Replace the content between style tags
            previewContent = previewContent.replace(/<style>([\s\S]*?)<\/style>/, `<style>${cssCode}</style>`);
        }
        
        // If the HTML doesn't include script tags, inject the JS
        if (!previewContent.includes('</script>')) {
            previewContent = previewContent.replace('</body>', `<script>${jsCode}</script></body>`);
        } else {
            // Replace the content between script tags
            previewContent = previewContent.replace(/<script>([\s\S]*?)<\/script>/, `<script>${jsCode}</script>`);
        }
        
        // Update the iframe content
        const iframe = previewFrame;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        
        iframeDoc.open();
        iframeDoc.write(previewContent);
        iframeDoc.close();
        
        logToDebug('Preview updated', 'info');
    } catch (error) {
        logToDebug(`Error updating preview: ${error.message}`, 'error');
    }
}

/**
 * Send a chat message to the AI
 */
async function sendChatMessage() {
    if (!apiKey) {
        logToDebug('API key is required to use chat', 'error');
        return;
    }
    
    const message = chatInput.value.trim();
    if (!message) {
        return;
    }
    
    // Add user message to chat
    addMessageToChat('user', message);
    
    // Clear input
    chatInput.value = '';
    
    // Get current code context
    const codeContext = {
        html: htmlEditor.value,
        css: cssEditor.value,
        js: jsEditor.value
    };
    
    // Disable send button
    sendChatBtn.disabled = true;
    
    try {
        // Show typing indicator
        addTypingIndicator();
        
        const selectedModel = modelSelector.value;
        const modelName = modelSelector.options[modelSelector.selectedIndex].text;
        
        logToDebug(`Sending chat message to ${modelName}`, 'info');
        
        const startTime = Date.now();
        
        // Prepare the API request
        const response = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': window.location.href,
                'X-Title': 'Advanced Web IDE'
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: [
                    {
                        role: 'system',
                        content: `You are a helpful web development assistant in a code editor environment. The user is working on a web project with HTML, CSS, and JavaScript. 
                        
Current code context:
HTML: ${codeContext.html.length > 500 ? codeContext.html.substring(0, 500) + '...' : codeContext.html}
CSS: ${codeContext.css.length > 500 ? codeContext.css.substring(0, 500) + '...' : codeContext.css}
JS: ${codeContext.js.length > 500 ? codeContext.js.substring(0, 500) + '...' : codeContext.js}

Provide helpful advice, answer questions, and suggest improvements. You can provide code snippets when relevant. This is Chat Mode, so you should not directly modify the user's code - instead, explain concepts and provide examples that the user can implement themselves.`
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ]
            })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        // Remove typing indicator
        removeTypingIndicator();
        
        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        // Add AI response to chat
        addMessageToChat('ai', aiResponse);
        
        // Update stats
        const responseTime = Date.now() - startTime;
        updateApiStats(selectedModel, modelName, responseTime);
        
        logToDebug(`Received chat response in ${responseTime}ms`, 'success');
    } catch (error) {
        // Remove typing indicator
        removeTypingIndicator();
        
        logToDebug(`Error in chat: ${error.message}`, 'error');
        addMessageToChat('system', `Error: ${error.message}`);
    } finally {
        // Re-enable send button
        sendChatBtn.disabled = apiKey ? false : true;
    }
}

/**
 * Add a message to the chat
 * @param {string} role - Role of the message sender ('user', 'ai', or 'system')
 * @param {string} content - Content of the message
 */
function addMessageToChat(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;
    
    // Format code blocks in the content
    content = formatCodeBlocks(content);
    
    if (role === 'system') {
        messageDiv.innerHTML = `
            <div class="message-content">${content}</div>
        `;
    } else {
        const avatar = role === 'user' ? 
            '<div class="message-avatar"><i class="fas fa-user"></i></div>' : 
            '<div class="message-avatar"><i class="fas fa-robot"></i></div>';
        
        messageDiv.innerHTML = `
            ${avatar}
            <div class="message-content">${content}</div>
        `;
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Apply syntax highlighting to code blocks
    if (window.Prism) {
        Prism.highlightAllUnder(messageDiv);
    }
}

/**
 * Format code blocks in message content
 * @param {string} content - Message content
 * @returns {string} Formatted content with HTML code blocks
 */
function formatCodeBlocks(content) {
    // Replace ```language\ncode``` with <pre><code class="language-*">code</code></pre>
    content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
        const lang = language || 'plaintext';
        return `<pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>`;
    });
    
    // Replace inline `code` with <code>code</code>
    content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    return content;
}

/**
 * Escape HTML special characters
 * @param {string} html - HTML string to escape
 * @returns {string} Escaped HTML string
 */
function escapeHtml(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

/**
 * Add typing indicator to chat
 */
function addTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai-message typing-indicator';
    typingDiv.innerHTML = `
        <div class="message-avatar"><i class="fas fa-robot"></i></div>
        <div class="message-content">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    typingDiv.id = 'typing-indicator';
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Remove typing indicator from chat
 */
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

/**
 * Execute agent action to modify code
 */
async function executeAgentAction() {
    if (!apiKey) {
        logToDebug('API key is required to use agent mode', 'error');
        return;
    }
    
    const instruction = agentInput.value.trim();
    if (!instruction) {
        return;
    }
    
    // Get target files
    const target = agentTarget.value;
    
    // Get current code
    const codeContext = {
        html: htmlEditor.value,
        css: cssEditor.value,
        js: jsEditor.value
    };
    
    // Disable execute button
    executeAgentBtn.disabled = true;
    agentInput.disabled = true;
    
    try {
        // Show loading state
        agentInput.classList.add('loading');
        
        const selectedModel = modelSelector.value;
        const modelName = modelSelector.options[modelSelector.selectedIndex].text;
        
        logToDebug(`Executing agent action with ${modelName}`, 'info');
        
        const startTime = Date.now();
        
        // Prepare the API request
        const response = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': window.location.href,
                'X-Title': 'Advanced Web IDE'
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: [
                    {
                        role: 'system',
                        content: `You are an AI agent that directly modifies code in a web development environment. The user will provide instructions, and you should return the modified code files based on those instructions.

Current code:
${target === 'all' || target === 'html' ? `HTML:\n${codeContext.html}\n\n` : ''}
${target === 'all' || target === 'css' ? `CSS:\n${codeContext.css}\n\n` : ''}
${target === 'all' || target === 'js' ? `JavaScript:\n${codeContext.js}\n\n` : ''}

Instructions:
1. Analyze the user's request and the current code
2. Make the requested changes to the code
3. Return ONLY the complete modified code files with no explanations
4. Use the following format for your response:

\`\`\`html
[Complete HTML code here]
\`\`\`

\`\`\`css
[Complete CSS code here]
\`\`\`

\`\`\`javascript
[Complete JavaScript code here]
\`\`\`

Only include the code blocks for files that you've modified. If you haven't changed a file, don't include it in your response.`
                    },
                    {
                        role: 'user',
                        content: instruction
                    }
                ]
            })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const agentResponse = data.choices[0].message.content;
        
        // Extract code from response
        const htmlMatch = agentResponse.match(/```html\n([\s\S]*?)```/);
        const cssMatch = agentResponse.match(/```css\n([\s\S]*?)```/);
        const jsMatch = agentResponse.match(/```javascript\n([\s\S]*?)```/) || agentResponse.match(/```js\n([\s\S]*?)```/);
        
        // Update code editors with extracted code
        if (htmlMatch && (target === 'all' || target === 'html')) {
            htmlEditor.value = htmlMatch[1];
            logToDebug('HTML code updated by agent', 'success');
        }
        
        if (cssMatch && (target === 'all' || target === 'css')) {
            cssEditor.value = cssMatch[1];
            logToDebug('CSS code updated by agent', 'success');
        }
        
        if (jsMatch && (target === 'all' || target === 'js')) {
            jsEditor.value = jsMatch[1];
            logToDebug('JavaScript code updated by agent', 'success');
        }
        
        // Update preview
        updatePreview();
        
        // Update stats
        const responseTime = Date.now() - startTime;
        updateApiStats(selectedModel, modelName, responseTime);
        
        logToDebug(`Agent action completed in ${responseTime}ms`, 'success');
        
        // Clear agent input
        agentInput.value = '';
    } catch (error) {
        logToDebug(`Error in agent action: ${error.message}`, 'error');
    } finally {
        // Re-enable execute button
        executeAgentBtn.disabled = apiKey ? false : true;
        agentInput.disabled = false;
        agentInput.classList.remove('loading');
    }
}

/**
 * Enhance code using OpenRouter API
 */
async function enhanceCode() {
    if (!apiKey) {
        logToDebug('API key is required to enhance code', 'error');
        return;
    }
    
    if (isStreaming) {
        logToDebug('Already processing a request. Please wait.', 'warning');
        return;
    }
    
    // Determine which code to enhance based on current tab
    let codeToEnhance = '';
    let editorToUpdate = null;
    let codeType = '';
    
    switch (currentTab) {
        case 'html':
            codeToEnhance = htmlEditor.value.trim();
            editorToUpdate = htmlEditor;
            codeType = 'HTML';
            break;
        case 'css':
            codeToEnhance = cssEditor.value.trim();
            editorToUpdate = cssEditor;
            codeType = 'CSS';
            break;
        case 'js':
            codeToEnhance = jsEditor.value.trim();
            editorToUpdate = jsEditor;
            codeType = 'JavaScript';
            break;
    }
    
    if (!codeToEnhance) {
        logToDebug(`Please enter some ${codeType} code to enhance.`, 'warning');
        return;
    }
    
    const selectedModel = modelSelector.value;
    const modelName = modelSelector.options[modelSelector.selectedIndex].text;
    
    try {
        isStreaming = true;
        enhanceBtn.disabled = true;
        enhanceBtn.classList.add('loading');
        
        logToDebug(`Enhancing ${codeType} code with model: ${modelName}`, 'info');
        
        const startTime = Date.now();
        
        // Prepare the API request
        const response = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': window.location.href,
                'X-Title': 'Advanced Web IDE'
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: [
                    {
                        role: 'system',
                        content: `You are a helpful web development assistant. Enhance the user's ${codeType} code by improving readability, performance, and best practices. Maintain the original functionality and structure. Return only the enhanced code without explanations or additional comments.`
                    },
                    {
                        role: 'user',
                        content: codeToEnhance
                    }
                ],
                stream: true
            })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        // Handle streaming response
        const reader = response.body.getReader();
        let enhancedCode = '';
        
        // Clear the editor for streaming effect
        editorToUpdate.value = '';
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            // Process the chunk
            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    try {
                        const data = JSON.parse(line.substring(6));
                        if (data.choices && data.choices[0].delta.content) {
                            const content = data.choices[0].delta.content;
                            enhancedCode += content;
                            editorToUpdate.value += content;
                        }
                    } catch (e) {
                        // Skip invalid JSON
                    }
                }
            }
        }
        
        // Update preview after enhancement
        updatePreview();
        
        // Update stats
        const responseTime = Date.now() - startTime;
        updateApiStats(selectedModel, modelName, responseTime);
        
        logToDebug(`${codeType} enhancement completed in ${responseTime}ms`, 'success');
    } catch (error) {
        logToDebug(`Error enhancing ${codeType} code: ${error.message}`, 'error');
        
        // Show error in editor if it's empty (API failed before streaming)
        if (editorToUpdate.value === '') {
            editorToUpdate.value = codeToEnhance;
        }
    } finally {
        isStreaming = false;
        enhanceBtn.disabled = apiKey ? false : true;
        enhanceBtn.classList.remove('loading');
    }
}

/**
 * Update API usage statistics
 * @param {string} modelId - ID of the model used
 * @param {string} modelName - Display name of the model
 * @param {number} responseTime - Response time in milliseconds
 */
function updateApiStats(modelId, modelName, responseTime) {
    apiStats.requestCount++;
    apiStats.lastModel = modelName;
    apiStats.lastResponseTime = responseTime;
    
    // Update UI
    requestCountEl.textContent = apiStats.requestCount;
    currentModel.textContent = apiStats.lastModel;
    lastResponseTimeEl.textContent = `${apiStats.lastResponseTime}ms`;
    
    // Add to network log
    const networkItem = document.createElement('div');
    networkItem.className = 'network-item';
    networkItem.innerHTML = `
        <div><strong>${modelName}</strong> - ${new Date().toLocaleTimeString()}</div>
        <div>${responseTime}ms</div>
    `;
    debugNetwork.insertBefore(networkItem, debugNetwork.firstChild);
}

/**
 * Show the add model modal
 */
function showAddModelModal() {
    addModelModal.classList.remove('hidden');
    newModelId.focus();
}

/**
 * Hide the add model modal
 */
function hideAddModelModal() {
    addModelModal.classList.add('hidden');
    newModelId.value = '';
    newModelName.value = '';
}

/**
 * Add a custom model to the dropdown
 */
function addCustomModel() {
    const modelId = newModelId.value.trim();
    const modelName = newModelName.value.trim();
    
    if (!modelId || !modelName) {
        logToDebug('Please enter both model ID and display name', 'warning');
        return;
    }
    
    // Add to models array
    models.push({ id: modelId, name: modelName });
    
    // Add to dropdown
    const option = document.createElement('option');
    option.value = modelId;
    option.textContent = modelName;
    modelSelector.appendChild(option);
    
    // Select the new model
    modelSelector.value = modelId;
    
    logToDebug(`Added custom model: ${modelName} (${modelId})`, 'success');
    hideAddModelModal();
}

/**
 * Toggle the debug panel
 */
function toggleDebugPanel() {
    const isHidden = debugPanel.classList.toggle('hidden');
    
    // Update the button text to reflect current state
    if (isHidden) {
        debugToggle.innerHTML = '<i class="fas fa-bug"></i> Debug Panel';
        logToDebug('Debug panel closed', 'info');
    } else {
        debugToggle.innerHTML = '<i class="fas fa-times"></i> Close Debug';
        logToDebug('Debug panel opened', 'info');
        
        // Auto-refresh debug stats when opening
        requestCountEl.textContent = apiStats.requestCount;
        currentModel.textContent = apiStats.lastModel;
        lastResponseTimeEl.textContent = `${apiStats.lastResponseTime}ms`;
        apiKeyDebugStatus.textContent = apiKey ? 'Valid' : 'Not Set';
        apiKeyDebugStatus.className = apiKey ? 'success' : '';
    }
}

/**
 * Set active debug tab
 * @param {string} tabName - Name of the tab to activate
 */
function setActiveDebugTab(tabName) {
    // Update tab buttons
    debugTabs.forEach(tab => {
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Update tab content
    document.querySelectorAll('.debug-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.getElementById(`debug-${tabName}`).classList.add('active');
}

/**
 * Log a message to the debug panel
 * @param {string} message - Message to log
 * @param {string} level - Log level ('info', 'warning', 'error', 'success')
 */
function logToDebug(message, level = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${level}`;
    logEntry.innerHTML = `<span class="log-time">[${timestamp}]</span> <span class="log-level">[${level.toUpperCase()}]</span> ${message}`;
    
    debugLogs.insertBefore(logEntry, debugLogs.firstChild);
    
    // Also log to console
    console.log(`[${level.toUpperCase()}] ${message}`);
}

/**
 * Clear debug logs
 */
function clearLogs() {
    debugLogs.innerHTML = '<div class="log-entry">Debug logs cleared...</div>';
    logToDebug('Logs cleared', 'info');
}

/**
 * Download the current file
 */
function downloadCurrentFile() {
    let filename = '';
    let content = '';
    let contentType = '';
    
    switch (currentTab) {
        case 'html':
            filename = 'index.html';
            content = htmlEditor.value;
            contentType = 'text/html';
            break;
        case 'css':
            filename = 'styles.css';
            content = cssEditor.value;
            contentType = 'text/css';
            break;
        case 'js':
            filename = 'script.js';
            content = jsEditor.value;
            contentType = 'text/javascript';
            break;
    }
    
    downloadFile(filename, content, contentType);
    logToDebug(`Downloaded ${filename}`, 'info');
}

/**
 * Download the entire project as a ZIP file
 */
function downloadProject() {
    try {
        // Create a new JSZip instance
        const zip = new JSZip();
        
        // Add files to the zip
        zip.file('index.html', htmlEditor.value);
        zip.file('styles.css', cssEditor.value);
        zip.file('script.js', jsEditor.value);
        
        // Generate the zip file
        zip.generateAsync({ type: 'blob' })
            .then(function(content) {
                // Download the zip file
                const url = URL.createObjectURL(content);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'web-project.zip';
                a.click();
                URL.revokeObjectURL(url);
                
                logToDebug('Project downloaded as ZIP', 'success');
            });
    } catch (error) {
        logToDebug(`Error downloading project: ${error.message}`, 'error');
    }
}

/**
 * Export content in various formats
 * @param {string} format - Export format ('html', 'css', 'js', or 'zip')
 */
function exportContent(format) {
    const htmlContent = htmlEditor.value;
    const cssContent = cssEditor.value;
    const jsContent = jsEditor.value;
    const filename = `web-project-${new Date().toISOString().slice(0, 10)}`;
    
    switch (format) {
        case 'html':
            downloadFile(`${filename}.html`, htmlContent, 'text/html');
            logToDebug('HTML code exported', 'info');
            break;
            
        case 'css':
            downloadFile(`${filename}.css`, cssContent, 'text/css');
            logToDebug('CSS code exported', 'info');
            break;
            
        case 'js':
            downloadFile(`${filename}.js`, jsContent, 'text/javascript');
            logToDebug('JavaScript code exported', 'info');
            break;
            
        case 'zip':
            downloadProject();
            break;
    }
}

/**
 * Download a file
 * @param {string} filename - Name of the file
 * @param {string} content - Content of the file
 * @param {string} contentType - MIME type of the file
 */
function downloadFile(filename, content, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Fetch with retry logic for transient errors
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} retries - Number of retries
 * @returns {Promise<Response>} Fetch response
 */
async function fetchWithRetry(url, options, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            
            if (response.ok) return response;
            
            if (response.status === 401) {
                logToDebug('API Key is invalid or missing. Please check your OpenRouter account.', 'error');
                throw new Error('Authentication failed (401)');
            } else if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After') || 1;
                logToDebug(`Rate limit exceeded. Retrying in ${retryAfter}s...`, 'warning');
                await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                continue;
            } else {
                const errorText = await response.text();
                throw new Error(`API error (${response.status}): ${errorText}`);
            }
        } catch (error) {
            if (i === retries - 1) throw error;
            logToDebug(`Fetch attempt ${i + 1} failed: ${error.message}. Retrying...`, 'warning');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    throw new Error('Max retries reached');
}

/**
 * Debounce function to limit the rate of function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

/**
 * Add animation effects using GSAP
 */
function addAnimationEffects() {
    if (window.gsap) {
        // Animate header
        gsap.from('header', { 
            y: -50, 
            opacity: 0, 
            duration: 1, 
            ease: 'power3.out' 
        });
        
        // Animate panes
        gsap.from('.pane', { 
            y: 50, 
            opacity: 0, 
            duration: 1, 
            stagger: 0.2, 
            ease: 'back.out(1.7)' 
        });
        
        // Animate buttons
        gsap.from('.neon-btn', { 
            scale: 0.8, 
            opacity: 0, 
            duration: 0.5, 
            stagger: 0.1, 
            ease: 'power2.out',
            delay: 0.5
        });
        
        // Add hover animations for buttons
        document.querySelectorAll('.neon-btn').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                gsap.to(btn, { 
                    scale: 1.05, 
                    duration: 0.2, 
                    ease: 'power1.out' 
                });
            });
            
            btn.addEventListener('mouseleave', () => {
                gsap.to(btn, { 
                    scale: 1, 
                    duration: 0.2, 
                    ease: 'power1.in' 
                });
            });
        });
    }
}

/**
 * Expose Editor API for external use
 */
function exposeEditorAPI() {
    window.EditorAPI = {
        // Get editor content
        getHTML: () => htmlEditor.value,
        getCSS: () => cssEditor.value,
        getJS: () => jsEditor.value,
        
        // Set editor content
        setHTML: (content) => {
            htmlEditor.value = content;
            updatePreview();
        },
        setCSS: (content) => {
            cssEditor.value = content;
            updatePreview();
        },
        setJS: (content) => {
            jsEditor.value = content;
            updatePreview();
        },
        
        // Switch tabs
        switchTab: switchTab,
        
        // Switch modes
        switchMode: switchMode,
        
        // API key management
        setApiKey: (key) => {
            apiKey = key;
            apiKeyInput.value = key;
            updateApiKeyStatus(true);
        },
        
        // Chat and agent functions
        sendChatMessage: (message) => {
            chatInput.value = message;
            sendChatMessage();
        },
        executeAgentAction: (instruction) => {
            agentInput.value = instruction;
            executeAgentAction();
        },
        
        // Enhance code
        enhance: enhanceCode,
        
        // Export content
        export: exportContent,
        
        // Add custom model
        addModel: (id, name) => {
            models.push({ id, name });
            const option = document.createElement('option');
            option.value = id;
            option.textContent = name;
            modelSelector.appendChild(option);
        }
    };
    
    logToDebug('Editor API exposed as window.EditorAPI', 'info');
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Add CSS for typing indicator
const style = document.createElement('style');
style.textContent = `
.typing-dots {
    display: flex;
    gap: 4px;
}

.typing-dots span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--accent-pink);
    animation: typing-dot 1.4s infinite ease-in-out both;
}

.typing-dots span:nth-child(1) {
    animation-delay: -0.32s;
}

.typing-dots span:nth-child(2) {
    animation-delay: -0.16s;
}

@keyframes typing-dot {
    0%, 80%, 100% { 
        transform: scale(0);
    } 
    40% { 
        transform: scale(1.0);
    }
}
`;
document.head.appendChild(style);
