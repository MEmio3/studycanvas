let toastContainer = null;

function ensureContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      display: flex; flex-direction: column-reverse; gap: 8px;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function showToast(message, type = 'info', durationMs = 3000, actionLabel = null, onAction = null) {
  const container = ensureContainer();

  const toast = document.createElement('div');
  toast.style.cssText = `
    padding: 10px 16px; border-radius: var(--radius-md);
    font-size: 13px; font-family: var(--font-body);
    display: flex; align-items: center; gap: 10px;
    pointer-events: all; cursor: default;
    animation: toast-in 0.3s ease forwards;
    max-width: 400px; box-shadow: var(--shadow-elevated);
  `;

  const colors = {
    success: { bg: 'rgba(29,158,117,0.15)', border: 'rgba(29,158,117,0.3)', text: '#1D9E75' },
    error: { bg: 'rgba(224,82,82,0.15)', border: 'rgba(224,82,82,0.3)', text: '#E05252' },
    warning: { bg: 'rgba(212,160,23,0.15)', border: 'rgba(212,160,23,0.3)', text: '#D4A017' },
    info: { bg: 'rgba(55,138,221,0.15)', border: 'rgba(55,138,221,0.3)', text: '#378ADD' },
  };

  const c = colors[type] || colors.info;
  toast.style.background = c.bg;
  toast.style.border = `1px solid ${c.border}`;
  toast.style.color = c.text;

  let html = `<span>${message}</span>`;
  if (actionLabel) {
    html += `<button class="toast-action" style="
      background: transparent; border: 1px solid ${c.border};
      color: ${c.text}; padding: 2px 10px; border-radius: 4px;
      cursor: pointer; font-size: 12px; font-weight: 500; white-space: nowrap;
    ">${actionLabel}</button>`;
  }

  toast.innerHTML = html;
  container.appendChild(toast);

  if (actionLabel && onAction) {
    toast.querySelector('.toast-action').addEventListener('click', (e) => {
      e.stopPropagation();
      onAction();
      toast.remove();
    });
  }

  // Auto dismiss
  if (durationMs > 0) {
    setTimeout(() => {
      toast.style.animation = 'toast-out 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, durationMs);
  }

  return toast;
}

// Inject CSS for toast animations
const style = document.createElement('style');
style.textContent = `
  @keyframes toast-in {
    from { opacity: 0; transform: translateY(20px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes toast-out {
    from { opacity: 1; transform: translateY(0) scale(1); }
    to { opacity: 0; transform: translateY(20px) scale(0.95); }
  }
`;
document.head.appendChild(style);
