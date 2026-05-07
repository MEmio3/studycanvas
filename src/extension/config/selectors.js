export const selectors = {
  gemini: {
    host: "gemini.google.com",
    // IMPORTANT: Gemini DOM structure changes frequently.
    // Use the DevTools Inspector on gemini.google.com to update these classes if the button fails to appear.
    // As of recent versions, responses are often in custom elements like 'message-content'.
    // Added multiple fallbacks for robustness since Gemini changes often
    responseContainer: "message-content, model-response, .message-content, .model-response, div[data-test-id='model-message']", 
    textElement: ".model-response-text, .message-text, .markdown, .content",
    actionRow: ".message-actions, .bottom-actions, .response-actions-container"
  }
};
