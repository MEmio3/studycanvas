export const selectors = {
  gemini: {
    host: "gemini.google.com",
    // IMPORTANT: Gemini DOM structure changes frequently.
    // Use the DevTools Inspector on gemini.google.com to update these classes if the button fails to appear.
    // As of recent versions, responses are often in custom elements like 'message-content'.
    responseContainer: "message-content", 
    textElement: ".model-response-text",
    actionRow: ".message-actions"
  }
};
