# Advanced Web IDE with OpenRouter AI Integration

A professional web-based IDE with real-time preview, dual-mode AI assistance, and comprehensive development tools. This application features a futuristic dark theme with neon accents, split-pane interface, and seamless OpenRouter API integration.

## Features

- **Split-Pane Interface**: Code editor on the left, live preview on the right
- **Multi-Language Support**: Edit HTML, CSS, and JavaScript with dedicated tabs
- **Real-Time Preview**: See your changes instantly as you type
- **Dual-Mode AI Assistance**:
  - **Chat Mode**: Discuss your code and get suggestions without direct modifications
  - **Agent Mode**: Let the AI directly modify your code based on your instructions
- **OpenRouter API Integration**: Connect with various AI models for code enhancement
- **API Key Management**: Securely enter and manage your OpenRouter API key
- **Custom Model Support**: Add and use your preferred AI models
- **File Management**: Download individual files or the entire project
- **Export Options**: Save your work in various formats
- **Debug Panel**: Monitor API requests, errors, and performance
- **Responsive Design**: Works on desktop and mobile devices
- **Futuristic UI**: Dark theme with neon accents and animations
- **Syntax Highlighting**: Powered by Prism.js for better code readability

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- OpenRouter API key (optional, only needed for AI features)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/advanced-web-ide.git
   cd advanced-web-ide
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

5. The editor will load immediately and is fully functional without an API key
   - For AI features (Chat Mode, Agent Mode, and code enhancement), you can optionally add an OpenRouter API key
   - You can get an API key by signing up at [OpenRouter](https://openrouter.ai/)

## Usage Guide

### API Key Management

1. The application is fully functional without an API key for basic editing features
2. To use AI features, enter your OpenRouter API key in the field at the top of the interface
3. Click "Save API Key" to apply the changes
4. The status indicator will show whether a valid API key is set
5. Click the information icon next to the API key field for details about obtaining a key

### Basic Editing

1. Select the tab (HTML, CSS, or JavaScript) you want to edit
2. Write or paste your code in the editor pane
3. See the results instantly in the preview pane
4. Use the refresh button in the preview header if needed

### Using Chat Mode

1. Click the "Chat Mode" button (active by default)
2. Type your question or request in the chat input at the bottom
3. Press Enter or click "Send" to communicate with the AI
4. The AI will respond with suggestions, explanations, or code snippets
5. You can copy code from the chat and paste it into the editor manually

### Using Agent Mode

1. Click the "Agent Mode" button to switch from Chat Mode
2. Describe the changes you want the AI to make to your code
3. Select which files to modify (All Files, HTML Only, CSS Only, or JavaScript Only)
4. Click "Execute Changes" to let the AI modify your code directly
5. Review the changes in the editor and preview

### AI Code Enhancement

1. Make sure you have a valid API key set
2. Select the desired AI model from the dropdown
3. Navigate to the tab containing the code you want to enhance
4. Click the "Enhance with AI" button
5. Watch as the AI improves your code in real-time

### Adding Custom Models

1. Click the "Add Model" button
2. Enter the model ID (e.g., `openai/gpt-4`)
3. Enter a display name (e.g., `GPT-4`)
4. Click "Add" to add the model to your selection options

### File Management

1. Use the file explorer on the right side of the interface
2. Click on a file name to switch to that file's tab
3. Use the download buttons to:
   - Download the current file
   - Download the entire project as a ZIP

### Exporting Your Work

1. Click the "Export" button
2. Choose your desired format:
   - HTML: Exports only the HTML code
   - CSS: Exports only the CSS code
   - JS: Exports only the JavaScript code
   - All Files (ZIP): Exports all files in a ZIP archive

### Using the Debug Panel

1. Click the "Debug Panel" button to toggle visibility
2. Navigate between tabs:
   - Logs: View system messages and errors
   - API Stats: Monitor API usage statistics
   - Network: Track API requests and response times
3. Use the "Clear Logs" button to reset the log display

## OpenRouter API Integration

This IDE uses the OpenRouter API to provide AI assistance. The integration includes:

- **Multiple Model Support**: Choose from various AI models
- **Dual-Mode Interaction**: Chat for discussion, Agent for direct code changes
- **Streaming Responses**: See AI-generated improvements in real-time
- **Error Handling**: Comprehensive error management for API issues
- **Usage Tracking**: Monitor API requests and performance

### API Configuration

The OpenRouter API is configured in `script.js`. Key components:

```javascript
// API endpoint
const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

// Request headers
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'HTTP-Referer': window.location.href,
    'X-Title': 'Advanced Web IDE'
};

// Request body structure
const body = {
    model: selectedModel,
    messages: [
        {
            role: 'system',
            content: `System instructions...`
        },
        {
            role: 'user',
            content: userMessage
        }
    ],
    stream: true // For streaming responses
};
```

### Error Handling

The IDE implements robust error handling for various API scenarios:

- **401 Unauthorized**: Invalid API key or insufficient credits
- **429 Rate Limit**: Exceeded quota with automatic retry logic
- **Network Errors**: Graceful handling of connectivity issues
- **Parsing Errors**: Protection against malformed responses

## Deployment Guide

### Deploying to Vercel

1. Create a Vercel account at [vercel.com](https://vercel.com)
2. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```
3. Run the deployment command:
   ```bash
   vercel
   ```
4. Note: API keys are entered by users directly in the browser, not stored on the server

### Deploying to Netlify

1. Create a Netlify account at [netlify.com](https://netlify.com)
2. Install the Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```
3. Deploy to Netlify:
   ```bash
   netlify deploy
   ```
4. Note: API keys are entered by users directly in the browser, not stored on the server

### Deploying to GitHub Pages

1. Create a GitHub repository for your project
2. Push your code to the repository:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```
3. Enable GitHub Pages in the repository settings
4. Note: API keys are entered by users directly in the browser, not stored on the server

## Customization

### Adding New Syntax Highlighting Rules

To add new syntax highlighting rules, modify the Prism.js configuration in `index.html`:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-yourLanguage.min.js"></script>
```

### Changing Themes

To modify the theme, edit the CSS variables in `styles.css`:

```css
:root {
  --bg-dark-blue: #1e3a8a;
  --bg-deep-purple: #7e22ce;
  --accent-pink: #ec4899;
  --accent-blue: #60a5fa;
  /* Add more variables here */
}
```

## API Reference

The IDE exposes a JavaScript API for external integration:

```javascript
// Get editor content
const htmlCode = window.EditorAPI.getHTML();
const cssCode = window.EditorAPI.getCSS();
const jsCode = window.EditorAPI.getJS();

// Set editor content
window.EditorAPI.setHTML('<div>Hello World</div>');
window.EditorAPI.setCSS('body { color: red; }');
window.EditorAPI.setJS('console.log("Hello");');

// Switch tabs
window.EditorAPI.switchTab('html'); // Options: 'html', 'css', 'js'

// Switch modes
window.EditorAPI.switchMode('chat'); // Options: 'chat', 'agent'

// API key management
window.EditorAPI.setApiKey('your-api-key');

// Chat and agent functions
window.EditorAPI.sendChatMessage('How do I create a responsive layout?');
window.EditorAPI.executeAgentAction('Add a navigation menu to the HTML');

// Enhance code
window.EditorAPI.enhance();

// Export content
window.EditorAPI.export('zip'); // Options: 'html', 'css', 'js', 'zip'

// Add custom model
window.EditorAPI.addModel('openai/gpt-4', 'GPT-4');
```

## Troubleshooting

### API Key Issues

If you encounter 401 errors:
1. Verify your API key is correct in the input field
2. Check that you have sufficient credits in your OpenRouter account
3. Ensure the key has the necessary permissions

### Preview Not Updating

If the preview doesn't update:
1. Click the refresh button in the preview header
2. Check the browser console for errors
3. Verify that your HTML structure is valid

### AI Features Not Working

If AI features are not working:
1. Check that your API key is valid and properly saved
2. Verify that you've selected a model from the dropdown
3. Check the debug panel for specific error messages

### Rate Limiting

If you hit rate limits:
1. Switch to a model with higher quotas
2. Wait a few minutes before trying again
3. Consider upgrading your OpenRouter plan

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [OpenRouter](https://openrouter.ai/) for providing the AI API
- [Prism.js](https://prismjs.com/) for syntax highlighting
- [GSAP](https://greensock.com/gsap/) for animations
- [JSZip](https://stuk.github.io/jszip/) for ZIP file generation
- [Font Awesome](https://fontawesome.com/) for icons
