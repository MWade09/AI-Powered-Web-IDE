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
    if (apiKeyModal) {
        apiKeyModal.classList.add('hidden');
        apiKeyModal.style.display = 'none';
    }
    
    // Make Agent Mode panel visible by default (remove hidden class)
    if (agentSection) {
        agentSection.classList.remove('hidden');
    }
    
    // Set editor as fully functional without AI features
    updateApiKeyStatus(false);
    
    // Set up event listeners for API key
    if (apiKeyInput) apiKeyInput.addEventListener('input', validateApiKey);
    if (saveApiKeyBtn) saveApiKeyBtn.addEventListener('click', saveApiKey);
    if (modalApiKeyInput) modalApiKeyInput.addEventListener('input', validateApiKey);
    if (saveModalApiKeyBtn) saveModalApiKeyBtn.addEventListener('click', saveModalApiKey);
    if (continueWithoutKeyBtn) continueWithoutKeyBtn.addEventListener('click', continueWithoutKey);
    
    // Add info button functionality
    const infoBtn = document.getElementById('show-api-info');
    if (infoBtn) infoBtn.addEventListener('click', showApiKeyInfo);
    
    // Show welcome modal on first load
    showApiKeyModal();
    
    // Set up event listeners for mode switching
    if (chatModeBtn) chatModeBtn.addEventListener('click', () => switchMode('chat'));
    if (agentModeBtn) agentModeBtn.addEventListener('click', () => switchMode('agent'));
    
    // Set up event listeners for editor
    if (htmlEditor) htmlEditor.addEventListener('input', debounce(updatePreview, 300));
    if (cssEditor) cssEditor.addEventListener('input', debounce(updatePreview, 300));
    if (jsEditor) jsEditor.addEventListener('input', debounce(updatePreview, 300));
    if (refreshPreviewBtn) refreshPreviewBtn.addEventListener('click', updatePreview);
    
    // Set up event listeners for tabs
    if (htmlTab) htmlTab.addEventListener('click', () => switchTab('html'));
    if (cssTab) cssTab.addEventListener('click', () => switchTab('css'));
    if (jsTab) jsTab.addEventListener('click', () => switchTab('js'));
    
    // Set up file click events manually (more reliable than querySelectorAll)
    const htmlFile = document.querySelector('.html-file');
    const cssFile = document.querySelector('.css-file');
    const jsFile = document.querySelector('.js-file');
    
    if (htmlFile) htmlFile.addEventListener('click', () => switchTab('html'));
    if (cssFile) cssFile.addEventListener('click', () => switchTab('css'));
    if (jsFile) jsFile.addEventListener('click', () => switchTab('js'));
    
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
            modal.classList.add('hidden');
        });
    });
    
    // Set up keyboard shortcuts
    setupKeyboardShortcuts();

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

    // Set up file explorer functionality
    setupFileExplorer();
}

/**
 * Save the API key from the modal
 */
function saveModalApiKey() {
    const key = modalApiKeyInput ? modalApiKeyInput.value.trim() : '';
    if (key) {
        // Use the modal's API key input
        apiKey = key;
        
        // Update the main input as well
        if (apiKeyInput) {
            apiKeyInput.value = key;
        }
        
        // Update API key status
        updateApiKeyStatus(true);
        
        // Close the modal
        if (apiKeyModal) {
            apiKeyModal.classList.add('hidden');
            apiKeyModal.style.display = 'none';
        }
        
        logToDebug('API key saved successfully from welcome modal', 'success');
    } else {
        logToDebug('No API key provided in modal', 'warning');
        // Show error message or shake effect
        if (modalApiKeyInput) {
            modalApiKeyInput.classList.add('error');
            setTimeout(() => modalApiKeyInput.classList.remove('error'), 1000);
        }
    }
}

/**
 * Continue without an API key
 */
function continueWithoutKey() {
    // Close the modal
    if (apiKeyModal) {
        apiKeyModal.classList.add('hidden');
        apiKeyModal.style.display = 'none';
    }
    
    // Set status to indicate no API key
    apiKey = '';
    updateApiKeyStatus(false);
    
    logToDebug('Continuing without API key. AI features will be disabled.', 'warning');
}

/**
 * Show the API key modal on first load
 */
function showApiKeyModal() {
    if (apiKeyModal) {
        apiKeyModal.classList.remove('hidden');
        apiKeyModal.style.display = 'flex';
        
        // Focus the input field for better UX
        if (modalApiKeyInput) {
            setTimeout(() => modalApiKeyInput.focus(), 300);
        }
        
        logToDebug('API key modal displayed', 'info');
    } else {
        logToDebug('API key modal element not found', 'error');
    }
}

/**
 * Switch between Chat and Agent modes
 * @param {string} mode - Mode to switch to ('chat' or 'agent')
 */
function switchMode(mode) {
    currentMode = mode;
    
    // Update mode buttons - safely check if elements exist
    if (chatModeBtn) chatModeBtn.classList.toggle('active', mode === 'chat');
    if (agentModeBtn) agentModeBtn.classList.toggle('active', mode === 'agent');
    
    // In our new design, we don't need to hide sections as they're always visible
    // But we do want to highlight the active section
    if (chatSection) chatSection.classList.toggle('active-section', mode === 'chat');
    if (agentSection) agentSection.classList.toggle('active-section', mode === 'agent');
    
    // Focus the appropriate input field if it exists
    if (mode === 'chat' && chatInput) {
        chatInput.focus();
    } else if (mode === 'agent' && agentInput) {
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
    
    // Update tab buttons - safely check if elements exist
    if (htmlTab) htmlTab.classList.toggle('active', tab === 'html');
    if (cssTab) cssTab.classList.toggle('active', tab === 'css');
    if (jsTab) jsTab.classList.toggle('active', tab === 'js');
    
    // Update editor visibility
    const htmlEditorDiv = document.getElementById('html-editor');
    const cssEditorDiv = document.getElementById('css-editor');
    const jsEditorDiv = document.getElementById('js-editor');
    
    if (htmlEditorDiv) htmlEditorDiv.classList.toggle('active', tab === 'html');
    if (cssEditorDiv) cssEditorDiv.classList.toggle('active', tab === 'css');
    if (jsEditorDiv) jsEditorDiv.classList.toggle('active', tab === 'js');
    
    // Update file list selection
    const htmlFile = document.querySelector('.html-file');
    const cssFile = document.querySelector('.css-file');
    const jsFile = document.querySelector('.js-file');
    
    if (htmlFile) htmlFile.classList.toggle('active', tab === 'html');
    if (cssFile) cssFile.classList.toggle('active', tab === 'css'); 
    if (jsFile) jsFile.classList.toggle('active', tab === 'js');
    
    // Focus the appropriate editor
    try {
        if (tab === 'html' && htmlEditor) htmlEditor.focus();
        if (tab === 'css' && cssEditor) cssEditor.focus();
        if (tab === 'js' && jsEditor) jsEditor.focus();
    } catch (e) {
        // Ignore focus errors
        console.log("Could not focus editor:", e);
    }
    
    logToDebug(`Switched to ${tab.toUpperCase()} tab`, 'info');
}

/**
 * Set up file explorer functionality
 */
function setupFileExplorer() {
    const fileListContainer = document.querySelector('.file-list');
    const contextMenu = document.getElementById('file-context-menu');
    const newFileBtn = document.getElementById('new-file-btn');
    
    if (!fileListContainer || !contextMenu) {
        console.warn('File explorer elements not found');
        return;
    }
    
    // Get individual file items
    const files = document.querySelectorAll('.file');
    
    // Individual file click event
    files.forEach(file => {
        if (file) {
            // File selection for tab switching
            file.addEventListener('click', () => {
                const fileType = file.dataset.type || 
                                (file.classList.contains('html-file') ? 'html' : 
                                 file.classList.contains('css-file') ? 'css' : 'js');
                
                switchTab(fileType);
            });
            
            // Multiple selection with Ctrl/Cmd key
            file.addEventListener('click', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    // Toggle selection for Ctrl+click
                    file.classList.toggle('selected');
                } else {
                    // Clear other selections if not using Ctrl/Cmd
                    document.querySelectorAll('.file.selected').forEach(f => {
                        if (f !== file) f.classList.remove('selected');
                    });
                }
            });
            
            // Context menu
            file.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                
                // Position the context menu
                contextMenu.style.top = `${e.clientY}px`;
                contextMenu.style.left = `${e.clientX}px`;
                
                // Store the target file for the menu actions
                const fileName = file.dataset.file || 
                                (file.classList.contains('html-file') ? 'index.html' : 
                                 file.classList.contains('css-file') ? 'styles.css' : 'script.js');
                
                const fileType = file.dataset.type || 
                                (file.classList.contains('html-file') ? 'html' : 
                                 file.classList.contains('css-file') ? 'css' : 'js');
                
                contextMenu.dataset.targetFile = fileName;
                contextMenu.dataset.targetType = fileType;
                
                // Show the menu
                contextMenu.classList.remove('hidden');
                
                // Make sure the target file is selected
                if (!e.ctrlKey && !e.metaKey) {
                    document.querySelectorAll('.file.selected').forEach(f => 
                        f.classList.remove('selected'));
                }
                file.classList.add('selected');
            });
        }
    });
    
    // Close context menu when clicking elsewhere
    document.addEventListener('click', () => {
        if (contextMenu) contextMenu.classList.add('hidden');
    });
    
    // Context menu actions
    if (contextMenu) {
        contextMenu.addEventListener('click', (e) => {
            const actionEl = e.target.closest('.context-menu-item');
            if (!actionEl) return;
            
            const action = actionEl.dataset.action;
            const targetFile = contextMenu.dataset.targetFile;
            const targetType = contextMenu.dataset.targetType;
            
            if (action && targetFile && targetType) {
                switch (action) {
                    case 'rename':
                        renameFile(targetFile, targetType);
                        break;
                    case 'duplicate':
                        duplicateFile(targetFile, targetType);
                        break;
                    case 'download':
                        downloadFileByName(targetFile, targetType);
                        break;
                    case 'delete':
                        deleteFile(targetFile, targetType);
                        break;
                }
            }
            
            // Hide the menu after action
            contextMenu.classList.add('hidden');
        });
    }
    
    // New file button
    if (newFileBtn) {
        newFileBtn.addEventListener('click', createNewFile);
    }
    
    // Log setup completion
    logToDebug('File explorer functionality initialized', 'info');
}
