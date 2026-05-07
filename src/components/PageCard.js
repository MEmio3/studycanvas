export function renderPageCard(page, isActive) {
  return `
    <div class="page-card" data-id="${page.pageId}" style="
      padding: var(--space-8); 
      margin-bottom: var(--space-8);
      background: var(--bg-base);
      border-radius: var(--radius-md);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: var(--space-12);
      ${isActive ? 'border-left: 3px solid var(--accent-primary); background: var(--bg-hover);' : 'border-left: 3px solid transparent;'}
    ">
      <div class="thumbnail" style="width: 60px; height: 45px; background: var(--bg-surface); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; position: relative;">
        <span style="position: absolute; top: 2px; left: 2px; background: rgba(0,0,0,0.6); font-size: 10px; border-radius: 50%; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center;">${page.order + 1}</span>
        <i class="ti ti-photo" style="color: var(--text-tertiary); font-size: 20px;"></i>
      </div>
      <div class="details" style="flex-grow: 1; min-width: 0;">
        <div style="font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${page.title || "Untitled Page"}</div>
        ${page.topic ? `<div class="pill" style="margin-top: 4px;">${page.topic}</div>` : ''}
      </div>
    </div>
  `;
}
