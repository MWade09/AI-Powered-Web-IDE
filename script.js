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

/**
 * Validate the API key format (basic check)
 * @param {Event} event - The input event
 * @returns {boolean} - True if the key format looks valid, false otherwise
 */
function validateApiKey(event) {
    const key = event.target.value.trim();
    const isValid = key === '' || key.startsWith('sk-'); // Allow empty or starting with sk-
    if (!isValid && key !== '') {
        logToDebug('Invalid API key format. Keys typically start with "sk-"', 'error');
        event.target.style.borderColor = 'var(--error-red)';
    } else {
        event.target.style.borderColor = ''; // Reset border color
    }
    return isValid;
}

// ======================================
// API Key Handling
// ======================================

/**
 * Hides the API key modal.
 */
function hideApiKeyModal() {
    logToDebug('Attempting to hide API Key modal...', 'info'); // Added log
    if (apiKeyModal) { // Check if modal element exists
        apiKeyModal.classList.add('hidden');
        apiKeyModal.style.display = 'none'; // Ensure display is set to none
        logToDebug('API Key modal hidden successfully.', 'info'); // Added log
    } else {
        logToDebug('API Key modal element not found in DOM.', 'error'); // Added error log
    }
}

/**
 * Loads the API key from local storage on startup.
 */
function loadApiKey() {
    logToDebug('loadApiKey function called.', 'info'); // Added log
    const storedKey = localStorage.getItem('openrouter_api_key');
    if (storedKey) {
        apiKey = storedKey;
        apiKeyStatus.textContent = 'API Key Set';
        apiKeyStatus.classList.add('set');
        apiKeyStatus.classList.remove('not-set');
        apiKeyDebugStatus.textContent = 'Set';
        logToDebug(`API Key loaded from storage: ${storedKey.substring(0, 5)}...`, 'info'); // Added log
        enableAiFeatures();
        hideApiKeyModal(); // Hide modal if key is already loaded
    } else {
        apiKeyStatus.textContent = 'No API Key Set';
        apiKeyStatus.classList.remove('set');
        apiKeyStatus.classList.add('not-set');
        apiKeyDebugStatus.textContent = 'Not Set';
        logToDebug('No API Key found in storage. Showing modal.', 'info'); // Added log
        disableAiFeatures();
        // Don't hide modal automatically if no key is found
        if (apiKeyModal) { // Check if modal element exists
             apiKeyModal.classList.remove('hidden');
             apiKeyModal.style.display = 'flex';
             logToDebug('API Key modal displayed.', 'info'); // Added log
        } else {
             logToDebug('API Key modal element not found when trying to show.', 'error'); // Added error log
        }
    }
    updateDebugStats();
}

/**
 * Handles saving the API key from the initial modal.
 */
function saveModalApiKey() {
    logToDebug('saveModalApiKey function called.', 'info'); // Added log
    if (!modalApiKeyInput) {
        logToDebug('Modal API key input element not found.', 'error');
        return;
    }
    const keyFromModal = modalApiKeyInput.value.trim();
    if (keyFromModal && !keyFromModal.startsWith('sk-')) {
         alert('Invalid API Key format. Key must start with "sk-".');
         logToDebug('Invalid API key format entered in modal.', 'warn');
         return; // Prevent closing modal if key is invalid format
    }
    saveApiKey(keyFromModal); // Use the common save function
    // Check if the key is now valid (either newly saved or was already valid) OR if the input was cleared
    if ((apiKey && apiKey.startsWith('sk-')) || keyFromModal === '') { 
       logToDebug('Key is valid or empty, hiding modal.', 'info'); // Added log
       hideApiKeyModal();
    } else {
       logToDebug('Key is invalid, modal remains open.', 'warn'); // Added log
    }
}

/**
 * Handles continuing without providing an API key from the modal.
 */
function continueWithoutKey() {
    logToDebug('continueWithoutKey function called.', 'info'); // Added log
    apiKey = ''; // Ensure apiKey is empty
    localStorage.removeItem('openrouter_api_key'); // Clear any stored key
    apiKeyStatus.textContent = 'No API Key Set';
    apiKeyStatus.classList.remove('set');
    apiKeyStatus.classList.add('not-set');
    apiKeyDebugStatus.textContent = 'Not Set';
    disableAiFeatures();
    hideApiKeyModal(); // Hide the modal
}

// ======================================
// Main Application Logic
// ======================================

/**
 * Initialize the application
 */
function init() {
    // Wrap core logic in DOMContentLoaded to be extra sure elements exist
    document.addEventListener('DOMContentLoaded', () => {
        logToDebug('DOM fully loaded. Initializing application...', 'info'); 
        try {
            // Load API key first - this determines if modal should show
            loadApiKey();

            // Make Agent Mode panel visible by default (remove hidden class)
            if (agentSection) agentSection.classList.add('hidden'); // Start in Chat mode view
            if (chatSection) chatSection.classList.remove('hidden');

            // Set up event listeners for API key
            if (apiKeyInput) apiKeyInput.addEventListener('input', validateApiKey);
            if (saveApiKeyBtn) saveApiKeyBtn.addEventListener('click', handleSaveApiKeyFromHeader);
            if (modalApiKeyInput) modalApiKeyInput.addEventListener('input', validateApiKey);
            if (saveModalApiKeyBtn) saveModalApiKeyBtn.addEventListener('click', saveModalApiKey);
            if (continueWithoutKeyBtn) continueWithoutKeyBtn.addEventListener('click', continueWithoutKey);

            // Add info button functionality
            const showApiInfoBtn = document.getElementById('show-api-info');
            if (showApiInfoBtn && typeof showApiKeyInfo === 'function') {
                 showApiInfoBtn.addEventListener('click', showApiKeyInfo);
            } else {
                 logToDebug('Show API info button or function not found.', 'warn');
            }


            // Set up event listeners for mode switching
            if (chatModeBtn) chatModeBtn.addEventListener('click', () => switchMode('chat'));
            if (agentModeBtn) agentModeBtn.addEventListener('click', () => switchMode('agent'));

            // Set up event listeners for editor
            if (refreshPreviewBtn) refreshPreviewBtn.addEventListener('click', updatePreview);

            // Set up event listeners for tabs
            if (htmlTab) htmlTab.addEventListener('click', () => switchTab('html'));
            if (cssTab) cssTab.addEventListener('click', () => switchTab('css'));
            if (jsTab) jsTab.addEventListener('click', () => switchTab('js'));

            // Set up event listeners for chat
            if (chatInput) {
                chatInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendChatMessage();
                    }
                });
            }
            if (sendChatBtn) sendChatBtn.addEventListener('click', sendChatMessage);

            // Set up event listeners for agent
            if (agentInput) {
                agentInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                        e.preventDefault();
                        executeAgentAction();
                    }
                });
            }
            if (executeAgentBtn) executeAgentBtn.addEventListener('click', executeAgentAction);

            // Set up event listeners for model selection
            if (addModelBtn) addModelBtn.addEventListener('click', showAddModelModal);
            if (cancelAddModel) cancelAddModel.addEventListener('click', hideAddModelModal);
            if (confirmAddModel) confirmAddModel.addEventListener('click', addCustomModel);

            // Set up event listeners for file explorer
            if (downloadFileBtn) downloadFileBtn.addEventListener('click', downloadCurrentFile);
            if (downloadProjectBtn) downloadProjectBtn.addEventListener('click', downloadProject);
            if (fileList) {
                fileList.forEach(file => {
                    file.addEventListener('click', () => {
                        const fileType = file.classList.contains('html-file') ? 'html' : 
                                        file.classList.contains('css-file') ? 'css' : 'js';
                        switchTab(fileType);
                    });
                });
            }

            // Set up event listeners for debug panel
            if (debugToggle) debugToggle.addEventListener('click', toggleDebugPanel);
            if (closeDebugBtn) closeDebugBtn.addEventListener('click', toggleDebugPanel);
            if (clearLogsBtn) clearLogsBtn.addEventListener('click', clearLogs);

            // Set up event listeners for export
            if (exportHtml) exportHtml.addEventListener('click', () => exportContent('html'));
            if (exportCss) exportCss.addEventListener('click', () => exportContent('css'));
            if (exportJs) exportJs.addEventListener('click', () => exportContent('js'));
            if (exportZip) exportZip.addEventListener('click', () => exportContent('zip'));

            // Set up debug tabs
            if (debugTabs) {
                debugTabs.forEach(tab => {
                    tab.addEventListener('click', () => {
                        const tabName = tab.dataset.tab;
                        setActiveDebugTab(tabName);
                    });
                });
            }

            // Set up close buttons for modals
            document.querySelectorAll('.close-modal').forEach(btn => {
                btn.addEventListener('click', () => {
                    const modal = btn.closest('.modal');
                    if (modal) modal.classList.add('hidden');
                });
            });

            // Initialize CodeMirror Editors
            logToDebug('Initializing CodeMirror...', 'info'); 
            try { // Add specific try-catch for CodeMirror
                if (typeof CodeMirror === 'undefined' || !CodeMirror.state || !CodeMirror.view) {
                    logToDebug('CodeMirror object or required modules (state, view) not found! Check script loading order and CDN links.', 'error');
                    alert('Error: CodeMirror failed to load. The editor will not function.');
                    return; // Stop init if CodeMirror isn't loaded correctly
                }
                const { EditorState } = CodeMirror.state;
                const { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, history, foldGutter, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine, highlightSelectionMatches } = CodeMirror.view;
                const { defaultKeymap, historyKeymap, foldKeymap, completionKeymap, lintKeymap } = CodeMirror.commands;
                // Language packages might be directly on CodeMirror or need specific access
                const { html } = CodeMirror.lang_html || CodeMirror; 
                const { css } = CodeMirror.lang_css || CodeMirror;
                const { javascript } = CodeMirror.lang_javascript || CodeMirror;
                const { oneDark } = CodeMirror.theme_one_dark || CodeMirror;

                if (!html || !css || !javascript || !oneDark) {
                     logToDebug('CodeMirror language packs or theme failed to load.', 'error');
                     // Continue initialization but log the error
                }

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

                // Sample Code 
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
                const htmlEditorParent = document.getElementById('html-editor-cm');
                if (htmlEditorParent) {
                    htmlEditorView = new EditorView({
                        state: EditorState.create({
                            doc: sampleHtml,
                            extensions: [ ...commonExtensions, html() ]
                        }),
                        parent: htmlEditorParent
                    });
                    logToDebug('HTML EditorView created.', 'info');
                } else {
                     logToDebug('HTML editor parent element not found!', 'error');
                }


                // CSS Editor
                const cssEditorParent = document.getElementById('css-editor-cm');
                 if (cssEditorParent) {
                    cssEditorView = new EditorView({
                        state: EditorState.create({
                            doc: sampleCss,
                            extensions: [ ...commonExtensions, css() ]
                        }),
                        parent: cssEditorParent
                    });
                    logToDebug('CSS EditorView created.', 'info');
                } else {
                     logToDebug('CSS editor parent element not found!', 'error');
                }

                // JavaScript Editor
                 const jsEditorParent = document.getElementById('js-editor-cm');
                 if (jsEditorParent) {
                    jsEditorView = new EditorView({
                        state: EditorState.create({
                            doc: sampleJs,
                            extensions: [ ...commonExtensions, javascript() ]
                        }),
                        parent: jsEditorParent
                    });
                    logToDebug('JS EditorView created.', 'info');
                } else {
                     logToDebug('JS editor parent element not found!', 'error');
                }

                // Initial preview update
                updatePreview();

                logToDebug('CodeMirror initialization finished.', 'info');

            } catch (cmError) {
                 logToDebug(`Error during CodeMirror initialization: ${cmError.message}`, 'error');
                 console.error("CodeMirror Initialization Error:", cmError);
                 alert(`CodeMirror Error: ${cmError.message}. Editor might not work.`);
            }
            
            // Expose API for external use
            exposeEditorAPI();
            
            // Add animation effects
            addAnimationEffects();

            logToDebug('Application initialization complete.', 'success'); 

        } catch (error) {
            logToDebug(`Error during initialization: ${error.message}`, 'error');
            console.error("Initialization Error:", error);
            alert(`Initialization failed: ${error.message}`);
        }
    }); // End DOMContentLoaded listener
}

// ======================================
// Mode Switching
// ======================================
function switchMode(mode) {
    if (mode === currentMode) return;

    logToDebug(`Switching to ${mode} mode.`, 'info');
    currentMode = mode;

    // Update button styles
    chatModeBtn.classList.toggle('active', mode === 'chat');
    agentModeBtn.classList.toggle('active', mode === 'agent');

    // Toggle pane visibility with animation (optional)
    if (mode === 'chat') {
        gsap.to(agentSection, { duration: 0.3, opacity: 0, onComplete: () => agentSection.classList.add('hidden') });
        chatSection.classList.remove('hidden');
        gsap.fromTo(chatSection, { opacity: 0 }, { duration: 0.3, opacity: 1 });
    } else { // Agent mode
        gsap.to(chatSection, { duration: 0.3, opacity: 0, onComplete: () => chatSection.classList.add('hidden') });
        agentSection.classList.remove('hidden');
        gsap.fromTo(agentSection, { opacity: 0 }, { duration: 0.3, opacity: 1 });
    }
}

// ======================================
// Editor and Preview Logic
// ======================================

/**
 * Switch between HTML, CSS, and JS editor tabs
 */
function switchTab(tabType) {
    if (tabType === currentTab) return;
    logToDebug(`Switching to ${tabType} tab.`, 'info');

    currentTab = tabType;

    // Update tab buttons
    document.querySelectorAll('.editor-tab').forEach(tab => {
        tab.classList.toggle('active', tab.id === `${tabType}-tab`);
    });

    // Update editor panes
    document.querySelectorAll('.code-editor').forEach(editor => {
        editor.classList.toggle('active', editor.id === `${tabType}-editor`);
    });

    // Update file explorer highlight
    document.querySelectorAll('.file-list .file').forEach(file => {
        file.classList.toggle('active', file.classList.contains(`${tabType}-file`));
    });

    // Focus the corresponding editor (optional, might need adjustment)
    // try {
    //     if (tabType === 'html' && htmlEditorView) htmlEditorView.focus();
    //     else if (tabType === 'css' && cssEditorView) cssEditorView.focus();
    //     else if (tabType === 'js' && jsEditorView) jsEditorView.focus();
    // } catch (focusError) {
    //     logToDebug(`Error focusing editor view: ${focusError.message}`, 'warn');
    // }
}

/**
 * Update the preview iframe with current editor content
 */
function updatePreview() {
    logToDebug('Updating preview...', 'info');
    try {
        const htmlCode = htmlEditorView ? htmlEditorView.state.doc.toString() : '';
        const cssCode = cssEditorView ? cssEditorView.state.doc.toString() : '';
        const jsCode = jsEditorView ? jsEditorView.state.doc.toString() : '';

        const previewDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
        
        previewDoc.open();
        previewDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <style>${cssCode}</style>
            </head>
            <body>
                ${htmlCode}
                <script>${jsCode}<\/script> 
            </body>
            </html>
        `);
        previewDoc.close();
        logToDebug('Preview updated successfully.', 'info');
    } catch (error) {
        logToDebug(`Error updating preview: ${error.message}`, 'error');
        console.error("Preview Update Error:", error);
    }
}

// ======================================
// Model Handling
// ======================================
function populateModelSelector() {
    // ... existing code ...
}

function showAddModelModal() {
    // ... existing code ...
}

function hideAddModelModal() {
    // ... existing code ...
}

function addCustomModel() {
    // ... existing code ...
}

// ======================================
// Chat Functionality
// ======================================
function sendChatMessage() {
    // ... existing code ...
}

// ======================================
// Agent Functionality
// ======================================
function executeAgentAction() {
    // ... existing code ...
}

// ======================================
// OpenRouter API Call
// ======================================
async function callOpenRouterAPI(prompt, mode = 'chat') {
    // ... existing code ...
}

// ======================================
// Debug Panel Logic
// ======================================
function toggleDebugPanel() {
    // ... existing code ...
}

function setActiveDebugTab(tabName) {
    // ... existing code ...
}

function clearLogs() {
    // ... existing code ...
}

function updateDebugStats() {
    // ... existing code ...
}

// ======================================
// Export Functionality
// ======================================
function exportContent(type) {
    // ... existing code ...
}

function downloadFile(filename, content, mimeType) {
    // ... existing code ...
}

// ======================================
// File Explorer Logic
// ======================================
function downloadCurrentFile() {
    // ... existing code ...
}

function downloadProject() {
    // ... existing code ...
}

// ======================================
// Animation Effects
// ======================================
function addAnimationEffects() {
    // ... existing code ...
}

// ======================================
// Expose Editor API (Optional)
// ======================================
function exposeEditorAPI() {
    // ... existing code ...
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
