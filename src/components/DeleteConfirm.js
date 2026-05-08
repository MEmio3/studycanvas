export function showDeleteConfirm(anchorEl, title, subtitle, onConfirm, onCancel) {
  const popup = document.createElement('div');
  popup.setAttribute('role', 'alertdialog');
  popup.style.cssText = `
    position: fixed; z-index: 300;
    background: var(--bg-elevated); border: 1px solid var(--border-default);
    border-radius: var(--radius-md); box-shadow: var(--shadow-elevated);
    padding: 16px; min-width: 280px; max-width: 360px;
    animation: delete-popup-in 0.15s ease forwards;
    font-family: var(--font-body);
  `;

  const rect = anchorEl.getBoundingClientRect();
  popup.style.top = (rect.bottom + 4) + 'px';
  popup.style.left = Math.max(8, rect.left - 100) + 'px';

  popup.innerHTML = `
    <div style="font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">Delete "${title}"?</div>
    <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">${subtitle}</div>
    <div style="display: flex; gap: 8px; justify-content: flex-end;">
      <button class="dc-cancel ghost" style="padding: 6px 16px; font-size: 13px;">Cancel</button>
      <button class="dc-confirm" style="
        padding: 6px 16px; font-size: 13px; border-radius: var(--radius-sm);
        background: var(--delete-btn-bg); color: var(--delete-btn-color);
        border: 1px solid var(--delete-btn-border); cursor: pointer;
      ">Delete Page</button>
    </div>
  `;

  document.body.appendChild(popup);

  const cancel = () => { popup.remove(); if (onCancel) onCancel(); };
  const confirm = () => { popup.remove(); if (onConfirm) onConfirm(); };

  popup.querySelector('.dc-cancel').addEventListener('click', cancel);
  popup.querySelector('.dc-confirm').addEventListener('click', confirm);
  popup.querySelector('.dc-confirm').focus();

  // Escape/outside click
  const handler = (e) => {
    if (e.key === 'Escape') { cancel(); document.removeEventListener('keydown', handler); }
  };
  document.addEventListener('keydown', handler);

  setTimeout(() => {
    const outside = (e) => {
      if (!popup.contains(e.target)) { cancel(); document.removeEventListener('click', outside); }
    };
    document.addEventListener('click', outside);
  }, 10);

  return popup;
}

export function showDeleteWithOptionsConfirm(anchorEl, title, subtitle, options, onConfirm, onCancel) {
  const popup = document.createElement('div');
  popup.setAttribute('role', 'alertdialog');
  popup.style.cssText = `
    position: fixed; z-index: 300;
    background: var(--bg-elevated); border: 1px solid var(--border-default);
    border-radius: var(--radius-md); box-shadow: var(--shadow-elevated);
    padding: 16px; min-width: 320px; max-width: 420px;
    animation: delete-popup-in 0.15s ease forwards;
    font-family: var(--font-body);
  `;

  const rect = anchorEl.getBoundingClientRect();
  popup.style.top = (rect.bottom + 4) + 'px';
  popup.style.left = Math.max(8, rect.left - 100) + 'px';

  let optionsHtml = options.map((opt, i) => `
    <label style="display: flex; align-items: flex-start; gap: 8px; cursor: pointer; padding: 4px 0; font-size: 13px; color: var(--text-primary);">
      <input type="radio" name="delete-option" value="${i}" ${i === 0 ? 'checked' : ''} style="margin-top: 2px;">
      <span>${opt.label}${opt.description ? `<br><span style="font-size: 11px; color: var(--text-secondary);">${opt.description}</span>` : ''}</span>
    </label>
  `).join('');

  popup.innerHTML = `
    <div style="font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">Delete "${title}"?</div>
    <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">${subtitle}</div>
    <div style="margin-bottom: 16px;">${optionsHtml}</div>
    <div style="display: flex; gap: 8px; justify-content: flex-end;">
      <button class="dc-cancel ghost" style="padding: 6px 16px; font-size: 13px;">Cancel</button>
      <button class="dc-confirm" style="
        padding: 6px 16px; font-size: 13px; border-radius: var(--radius-sm);
        background: var(--delete-btn-bg); color: var(--delete-btn-color);
        border: 1px solid var(--delete-btn-border); cursor: pointer;
      ">Confirm</button>
    </div>
  `;

  document.body.appendChild(popup);

  // Make confirm button red when dangerous option selected
  const radios = popup.querySelectorAll('input[name="delete-option"]');
  const confirmBtn = popup.querySelector('.dc-confirm');
  radios.forEach(r => {
    r.addEventListener('change', () => {
      const idx = parseInt(r.value);
      if (options[idx]?.isDangerous) {
        confirmBtn.style.background = 'var(--delete-btn-bg-hover)';
      } else {
        confirmBtn.style.background = 'var(--delete-btn-bg)';
      }
    });
  });

  const cancel = () => { popup.remove(); if (onCancel) onCancel(); };
  const confirm = () => {
    const selected = popup.querySelector('input[name="delete-option"]:checked');
    const idx = selected ? parseInt(selected.value) : 0;
    popup.remove();
    if (onConfirm) onConfirm(idx);
  };

  popup.querySelector('.dc-cancel').addEventListener('click', cancel);
  confirmBtn.addEventListener('click', confirm);

  const handler = (e) => {
    if (e.key === 'Escape') { cancel(); document.removeEventListener('keydown', handler); }
  };
  document.addEventListener('keydown', handler);

  setTimeout(() => {
    const outside = (e) => {
      if (!popup.contains(e.target)) { cancel(); document.removeEventListener('click', outside); }
    };
    document.addEventListener('click', outside);
  }, 10);

  return popup;
}

// CSS for popup animation
const style = document.createElement('style');
style.textContent = `
  @keyframes delete-popup-in {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
`;
document.head.appendChild(style);
