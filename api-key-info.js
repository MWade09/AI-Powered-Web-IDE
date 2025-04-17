/**
 * Show API key information modal
 */
function showApiKeyInfo() {
    // Create modal if it doesn't exist
    let infoModal = document.getElementById('api-info-modal');
    if (!infoModal) {
        infoModal = document.createElement('div');
        infoModal.id = 'api-info-modal';
        infoModal.className = 'modal';
        
        infoModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>About OpenRouter API Key</h3>
                    <button class="close-modal icon-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p>An OpenRouter API key is <strong>optional</strong> and only required for AI-powered features:</p>
                    <ul class="feature-list">
                        <li>Chat Mode for discussing code concepts</li>
                        <li>Agent Mode for direct code modification</li>
                        <li>Code enhancement with AI</li>
                    </ul>
                    <p>All other editor features work without an API key.</p>
                    <div class="api-key-instructions">
                        <h4>How to get an API key:</h4>
                        <ol>
                            <li>Sign up at <a href="https://openrouter.ai" target="_blank">OpenRouter.ai</a></li>
                            <li>Create a new API key in your account settings</li>
                            <li>Copy the key and paste it in the API key field</li>
                            <li>Click "Save API Key" to enable AI features</li>
                        </ol>
                    </div>
                </div>
                <div class="modal-buttons">
                    <button id="close-api-info" class="btn">Got it!</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(infoModal);
        
        // Add event listeners
        infoModal.querySelector('.close-modal').addEventListener('click', () => {
            infoModal.classList.add('hidden');
        });
        
        infoModal.querySelector('#close-api-info').addEventListener('click', () => {
            infoModal.classList.add('hidden');
        });
    }
    
    // Show the modal
    infoModal.classList.remove('hidden');
}
