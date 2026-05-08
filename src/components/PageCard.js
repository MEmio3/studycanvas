export function renderPageCard(page, isActive) {
  const saveStateDot = page.saveState === 'unsaved'
    ? `<span style="position: absolute; bottom: 2px; right: 2px; width: 6px; height: 6px; border-radius: 50%; background: var(--save-state-unsaved);"></span>`
    : page.saveState === 'error'
    ? `<span style="position: absolute; bottom: 2px; right: 2px; font-size: 9px; color: var(--save-state-error); font-weight: bold;">!</span>`
    : '';

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
      position: relative;
      ${isActive ? 'border-left: 3px solid var(--accent-primary); background: var(--bg-hover);' : 'border-left: 3px solid transparent;'}
    ">
      <div class="thumbnail" style="width: 50px; height: 38px; background: var(--bg-surface); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; position: relative; flex-shrink: 0;">
        <span style="position: absolute; top: 2px; left: 2px; background: rgba(0,0,0,0.6); font-size: 10px; border-radius: 50%; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center;">${page.order + 1}</span>
        <i class="ti ti-photo" style="color: var(--text-tertiary); font-size: 16px;"></i>
        ${saveStateDot}
      </div>
      <div class="details" style="flex-grow: 1; min-width: 0;">
        <div style="font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; justify-content: space-between;">
          <span style="overflow: hidden; text-overflow: ellipsis; padding-right: 20px;">${page.title || "Untitled Page"}</span>
          <div style="display: flex; align-items: center;">
            ${page.isFlagged ? '<i class="ti ti-star-filled" style="color: var(--amber); font-size: 12px; margin-right: 4px;"></i>' : ''}
            <i class="ti ti-dots page-ctx-btn" data-action="page-menu" data-page-id="${page.pageId}" style="font-size: 14px; color: var(--text-tertiary); opacity: 0; cursor: pointer; transition: opacity 0.2s; position: absolute; right: 8px; top: 10px;"></i>
          </div>
        </div>
        ${page.videoTimestamp ? `
          <div class="yt-timestamp-badge" style="margin-top: 4px; font-size: 11px; color: var(--text-secondary); display: flex; align-items: center; gap: 4px; cursor: pointer;" data-action="watch-jump" data-video-id="${page.videoTimestamp.videoId}" data-time="${page.videoTimestamp.seconds}">
            <i class="ti ti-brand-youtube" style="color: var(--watch-complete-color);"></i> ${page.videoTimestamp.formatted}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

