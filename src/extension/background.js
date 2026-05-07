chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionIconClick: true })
  .catch((error) => console.error(error));

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'capture_page') {
    chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 80 }, (dataUrl) => {
      
      // Broadcast to the side panel
      chrome.runtime.sendMessage({
        action: 'save_new_page',
        payload: {
          ...request.payload,
          screenshotDataUrl: dataUrl
        }
      }).catch(() => {
         // It's possible the side panel is not open, so sendMessage fails.
         console.log("Side panel might not be open to receive the message.");
      });
      
      try {
        // Try to open side panel automatically
        chrome.sidePanel.open({ windowId: sender.tab.windowId });
      } catch(e) {
        console.log("Could not open side panel programmatically:", e);
      }

      sendResponse({ success: true });
    });
    return true; // Keep message channel open for async captureVisibleTab
  }
});
