import { validateApiKey } from '../../services/youtubeApi.js';

export class ApiKeySetupScreen {
  constructor(container, onComplete, onSkip) {
    this.container = container;
    this.onComplete = onComplete;
    this.onSkip = onSkip;
  }

  render() {
    this.container.innerHTML = `
      <div class="yt-modal-overlay">
        <div class="yt-modal-content">
          <div style="text-align: center; margin-bottom: var(--space-24);">
            <i class="ti ti-brand-youtube" style="font-size: 48px; color: var(--watch-complete-color);"></i>
            <h2 style="margin-top: var(--space-16); font-size: 20px;">Set up YouTube Study Mode</h2>
          </div>
          
          <p style="color: var(--text-secondary); margin-bottom: var(--space-16); font-size: 14px; line-height: 1.5;">
            A free YouTube Data API key is needed to load playlist contents. Your key is stored only on this device and is never shared.
          </p>
          
          <div style="background: var(--bg-base); padding: var(--space-16); border-radius: var(--radius-md); margin-bottom: var(--space-24); font-size: 13px;">
            <p style="margin-bottom: var(--space-8); font-weight: 500;">How to get a free key:</p>
            <ol style="margin-left: var(--space-16); color: var(--text-secondary); line-height: 1.6;">
              <li>Go to console.cloud.google.com</li>
              <li>Create a project &rarr; Enable YouTube Data API v3</li>
              <li>Go to Credentials &rarr; Create API Key &rarr; Copy it</li>
            </ol>
            <a href="https://console.cloud.google.com" target="_blank" style="display: block; margin-top: var(--space-12); color: var(--watch-complete-color); text-decoration: none;">
              Open Google Cloud Console <i class="ti ti-external-link"></i>
            </a>
          </div>

          <label style="display: block; margin-bottom: var(--space-8); font-size: 14px; font-weight: 500;">Your API Key:</label>
          <div style="position: relative; margin-bottom: var(--space-8);">
            <input type="password" id="yt-api-key-input" style="width: 100%; padding: var(--space-12); padding-right: 40px; background: var(--bg-base); border: 1px solid var(--border-default); border-radius: var(--radius-sm); color: var(--text-primary);" placeholder="AIzaSy...">
            <button id="yt-toggle-visibility" class="ghost icon-only" style="position: absolute; right: 4px; top: 50%; transform: translateY(-50%);">
              <i class="ti ti-eye"></i>
            </button>
          </div>
          <div id="yt-api-error" style="color: var(--danger); font-size: 13px; min-height: 20px; margin-bottom: var(--space-16);"></div>

          <div style="display: flex; justify-content: flex-end; gap: var(--space-12);">
            <button id="yt-btn-skip" class="ghost">Skip for now</button>
            <button id="yt-btn-save" class="primary">Save & Continue</button>
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const input = this.container.querySelector('#yt-api-key-input');
    const toggleBtn = this.container.querySelector('#yt-toggle-visibility');
    const skipBtn = this.container.querySelector('#yt-btn-skip');
    const saveBtn = this.container.querySelector('#yt-btn-save');
    const errorDiv = this.container.querySelector('#yt-api-error');

    toggleBtn.addEventListener('click', () => {
      if (input.type === 'password') {
        input.type = 'text';
        toggleBtn.innerHTML = '<i class="ti ti-eye-off"></i>';
      } else {
        input.type = 'password';
        toggleBtn.innerHTML = '<i class="ti ti-eye"></i>';
      }
    });

    skipBtn.addEventListener('click', () => {
      if (this.onSkip) this.onSkip();
    });

    saveBtn.addEventListener('click', async () => {
      const key = input.value.trim();
      if (!key) {
        errorDiv.textContent = 'Please enter an API key.';
        return;
      }

      saveBtn.disabled = true;
      saveBtn.textContent = 'Validating...';
      errorDiv.textContent = '';

      const isValid = await validateApiKey(key);
      
      if (isValid) {
        localStorage.setItem('studycanvas_yt_apikey', key);
        if (this.onComplete) this.onComplete();
      } else {
        errorDiv.textContent = 'Invalid API key. Please check and try again.';
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save & Continue';
      }
    });
  }
}
