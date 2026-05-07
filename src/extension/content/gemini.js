import { selectors } from '../config/selectors.js';

function injectButtons() {
  const cfg = selectors.gemini;
  
  // Try to find the response containers
  const containers = document.querySelectorAll(cfg.responseContainer);
  
  containers.forEach(container => {
    // Check if we already injected the button
    if (container.querySelector('.studycanvas-save-btn')) return;

    const actionRow = container.querySelector(cfg.actionRow) || container; // Fallback to container itself if action row not found
    
    const btn = document.createElement('button');
    btn.className = 'studycanvas-save-btn';
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z"/><path d="M4 8h16"/><path d="M8 4v4"/></svg> Save to Deck`;
    btn.style.cssText = `
      display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px;
      background: #1D9E75; color: white; border: none; border-radius: 6px;
      font-size: 13px; font-weight: 500; cursor: pointer; font-family: sans-serif; 
      margin-top: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const textEl = container.querySelector(cfg.textElement);
      // Fallback: Just grab the text from the whole container if textElement is wrong
      const text = textEl ? textEl.innerText : container.innerText;

      // Highlight temporarily to show user feedback
      const oldBg = container.style.backgroundColor;
      container.style.transition = 'background-color 0.3s';
      container.style.backgroundColor = 'rgba(29, 158, 117, 0.1)';
      
      btn.innerText = 'Capturing...';
      btn.disabled = true;
      
      chrome.runtime.sendMessage({
        action: 'capture_page',
        payload: {
          text: text,
          source: window.location.href,
          topic: 'Gemini Extract'
        }
      }, (response) => {
        container.style.backgroundColor = oldBg;
        btn.innerHTML = 'Saved ✓';
        setTimeout(() => {
           btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z"/><path d="M4 8h16"/><path d="M8 4v4"/></svg> Save to Deck`;
           btn.disabled = false;
        }, 2000);
      });
    });

    actionRow.appendChild(btn);
  });
}

// Run periodically to catch new messages as they stream in
setInterval(injectButtons, 2000);
