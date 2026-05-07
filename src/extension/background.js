// Open side panel when the extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {
    console.log("Side panel could not be opened.");
  });
});

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
         console.log("Side panel might not be open to receive the message.");
      });
      
      // Try to open side panel automatically
      if (sender.tab) {
        chrome.sidePanel.open({ windowId: sender.tab.windowId }).catch(() => {});
      }

      sendResponse({ success: true });
    });
    return true; // Keep message channel open for async captureVisibleTab
  }
});
