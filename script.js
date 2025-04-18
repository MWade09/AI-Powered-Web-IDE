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

// CodeMirror Editor Instances
let htmlEditorView, cssEditorView, jsEditorView;

// DOM Elements - Main UI
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

// ======================================
// Helper Functions (Define before use)
// ======================================

/**
 * Debounce function to limit the rate at which a function can fire.
 */
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

/**
 * Log messages to the debug panel
 */
function logToDebug(message, level = 'info') {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${level}`;
    logEntry.textContent = `[${level.toUpperCase()}] ${message}`;
    debugLogs.appendChild(logEntry);
    debugLogs.scrollTop = debugLogs.scrollHeight;
}

/**
 * Add a message to the chat interface
 * @param {string} sender - 'user', 'ai', or 'system'
 * @param {string} message - The message content (can include markdown)
 */
function addMessageToChat(sender, message) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    
    let avatar = '';
    if (sender === 'user') {
        avatar = '<i class="fas fa-user"></i>';
    } else if (sender === 'ai') {
        avatar = '<i class="fas fa-robot"></i>';
    } else { // system
        avatar = '<i class="fas fa-info-circle"></i>';
    }
    
    let formattedMessage = message
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');

    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">${formattedMessage}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Add a typing indicator to the chat
 */
function addTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('message', 'ai-message', 'typing-indicator');
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
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Remove the typing indicator from the chat
 */
function removeTypingIndicator() {
    const indicator = chatMessages.querySelector('.typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// ======================================
// Main Application Logic
// ======================================

/**
 * Initialize the application
 */
function init() {
    logToDebug('Initializing application...', 'info'); // Add log
    try {
        // Show the API key modal initially
        apiKeyModal.classList.remove('hidden'); // Ensure it's not hidden by class
        apiKeyModal.style.display = 'flex'; // Use flex as defined in CSS for modals

        // Make Agent Mode panel visible by default (remove hidden class)
        agentSection.classList.remove('hidden');
        
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

        // Initialize CodeMirror Editors
        logToDebug('Initializing CodeMirror...', 'info'); // Add log
        if (typeof CodeMirror === 'undefined') {
            logToDebug('CodeMirror object not found! Check script loading order.', 'error');
            return; // Stop init if CodeMirror isn't loaded
        }
        const { EditorState } = CodeMirror.state;
        const { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, history, foldGutter, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine, highlightSelectionMatches } = CodeMirror.view;
        const { defaultKeymap, historyKeymap, foldKeymap, completionKeymap, lintKeymap } = CodeMirror.commands;
        const { language } = CodeMirror.language;
        const { html } = CodeMirror.lang_html;
        const { css } = CodeMirror.lang_css;
        const { javascript } = CodeMirror.lang_javascript;
        const { oneDark } = CodeMirror.theme_one_dark;

        const commonExtensions = [
            lineNumbers(),
            highlightActiveLineGutter(),
            highlightSpecialChars(),
            history(),
            foldGutter(),
            drawSelection(),
            dropCursor(),
            EditorState.allowMultipleSelections.of(true),
            rectangularSelection(),
            crosshairCursor(),
            highlightActiveLine(),
            highlightSelectionMatches(),
            keymap.of([
                ...defaultKeymap,
                ...historyKeymap,
                ...foldKeymap,
                ...completionKeymap,
                ...lintKeymap
            ]),
            oneDark, // Apply the dark theme
            EditorView.updateListener.of((update) => {
                if (update.docChanged) {
                    debouncedUpdatePreview();
                }
            })
        ];

        // Debounced preview function
        const debouncedUpdatePreview = debounce(updatePreview, 300);

        // Sample Code (moved here for easier access during initialization)
        const sampleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Web Page</title>
    <link rel="stylesheet" href="styles.css">
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
    
    <script src="script.js"></script>
</body>
</html>`;

        const sampleCss = `/* Sample CSS */
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

        const sampleJs = `// Sample JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Get the button element
    const button = document.getElementById('demo-button');
    
    // Add click event listener
    if (button) { // Check if button exists
        button.addEventListener('click', function() {
            alert('Button clicked! This is the JavaScript in action.');
        });
    }
    
    // Log a message to the console
    console.log('JavaScript initialized successfully!');
});`;

        // HTML Editor
        htmlEditorView = new EditorView({
            state: EditorState.create({
                doc: sampleHtml,
                extensions: [
                    ...commonExtensions,
                    html()
                ]
            }),
            parent: document.getElementById('html-editor-cm')
        });

        // CSS Editor
        cssEditorView = new EditorView({
            state: EditorState.create({
                doc: sampleCss,
                extensions: [
                    ...commonExtensions,
                    css()
                ]
            }),
            parent: document.getElementById('css-editor-cm')
        });

        // JavaScript Editor
        jsEditorView = new EditorView({
            state: EditorState.create({
                doc: sampleJs,
                extensions: [
                    ...commonExtensions,
                    javascript()
                ]
            }),
            parent: document.getElementById('js-editor-cm')
        });

        // Initial preview update
        updatePreview();

        // Log initialization
        logToDebug('Editor initialized successfully', 'info');
        
        // Expose API for external use
        exposeEditorAPI();
        
        // Add animation effects
        addAnimationEffects();

        logToDebug('Application initialization complete.', 'success'); // Add log

    } catch (error) {
        logToDebug(`Error during initialization: ${error.message}`, 'error');
        console.error("Initialization Error:", error);
    }
}

// ======================================
// Initialization Trigger
// ======================================

// Use window.onload to ensure all resources (including CodeMirror scripts) are loaded
window.onload = init;

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
