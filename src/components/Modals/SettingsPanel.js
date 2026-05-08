export class SettingsPanel {
  constructor(container) {
    this.container = container;
    this.settings = this.loadSettings();
    this.voices = [];
  }

  loadSettings() {
    const defaults = {
      theme: 'dark',
      ttsSpeed: 1.2,
      ttsVoice: 'Google UK English Male',
      autoAdvance: true,
      autoAdvanceDelay: 2000,
      transition: 'slide',
      playbackOrder: 'sidebar',
      annotationColor: '#1D9E75'
    };
    const saved = localStorage.getItem('studycanvas_settings');
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  }

  saveSettings() {
    localStorage.setItem('studycanvas_settings', JSON.stringify(this.settings));
    document.dispatchEvent(new CustomEvent('settings-changed', { detail: this.settings }));
  }

  render() {
    this.container.innerHTML = `
      <div class="settings-backdrop" style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: none;">
        <div class="settings-drawer" style="position: absolute; right: 0; top: 0; bottom: 0; width: 400px; background: var(--bg-elevated); box-shadow: -4px 0 24px rgba(0,0,0,0.5); padding: var(--space-24); overflow-y: auto; transform: translateX(100%); transition: transform 0.3s ease;">
          <div class="flex-between" style="margin-bottom: var(--space-24);">
            <h2 style="font-size: 20px; font-weight: 600;">Settings</h2>
            <button class="ghost icon-only" id="btn-close-settings"><i class="ti ti-x"></i></button>
          </div>
          
          <div class="settings-section" style="margin-bottom: var(--space-24);">
            <h3 style="font-size: 14px; color: var(--text-secondary); margin-bottom: var(--space-12); text-transform: uppercase; letter-spacing: 1px;">Text-to-Speech</h3>
            
            <div style="margin-bottom: var(--space-16);">
              <label style="display: block; font-size: 14px; margin-bottom: var(--space-4);">TTS Speed (${this.settings.ttsSpeed}x)</label>
              <input type="range" id="setting-tts-speed" min="0.5" max="2.0" step="0.1" value="${this.settings.ttsSpeed}" style="width: 100%;">
            </div>

            <div id="browser-voice-section" style="margin-bottom: var(--space-16);">
              <label style="display: block; font-size: 14px; margin-bottom: var(--space-4);">Browser Voice</label>
              <select id="setting-tts-voice" style="width: 100%; padding: var(--space-8); background: var(--bg-base); border: 1px solid var(--border-default); color: var(--text-primary); border-radius: var(--radius-sm);">
                <option value="">Default Browser Voice</option>
              </select>
            </div>
          </div>

          <div class="settings-section" style="margin-bottom: var(--space-24);">
            <h3 style="font-size: 14px; color: var(--text-secondary); margin-bottom: var(--space-12); text-transform: uppercase; letter-spacing: 1px;">Presentation Defaults</h3>
            
            <div style="margin-bottom: var(--space-16); display: flex; align-items: center; justify-content: space-between;">
              <label style="font-size: 14px;">Auto-advance slides</label>
              <input type="checkbox" id="setting-auto-advance" ${this.settings.autoAdvance ? 'checked' : ''}>
            </div>

            <div style="margin-bottom: var(--space-16);">
              <label style="display: block; font-size: 14px; margin-bottom: var(--space-4);">Auto-advance delay (ms)</label>
              <select id="setting-auto-advance-delay" style="width: 100%; padding: var(--space-8); background: var(--bg-base); border: 1px solid var(--border-default); color: var(--text-primary); border-radius: var(--radius-sm);">
                <option value="1000" ${this.settings.autoAdvanceDelay === 1000 ? 'selected' : ''}>1s</option>
                <option value="2000" ${this.settings.autoAdvanceDelay === 2000 ? 'selected' : ''}>2s</option>
                <option value="3000" ${this.settings.autoAdvanceDelay === 3000 ? 'selected' : ''}>3s</option>
                <option value="5000" ${this.settings.autoAdvanceDelay === 5000 ? 'selected' : ''}>5s</option>
              </select>
            </div>
          </div>

          <div class="settings-section" style="margin-bottom: var(--space-24);">
            <h3 style="font-size: 14px; color: var(--text-secondary); margin-bottom: var(--space-12); text-transform: uppercase; letter-spacing: 1px;">UI Preferences</h3>
            
            <div style="margin-bottom: var(--space-16);">
              <label style="display: block; font-size: 14px; margin-bottom: var(--space-4);">Slide Transition</label>
              <select id="setting-transition" style="width: 100%; padding: var(--space-8); background: var(--bg-base); border: 1px solid var(--border-default); color: var(--text-primary); border-radius: var(--radius-sm);">
                <option value="slide" ${this.settings.transition === 'slide' ? 'selected' : ''}>Slide</option>
                <option value="fade" ${this.settings.transition === 'fade' ? 'selected' : ''}>Fade</option>
                <option value="none" ${this.settings.transition === 'none' ? 'selected' : ''}>None</option>
              </select>
            </div>
            
            <div style="margin-bottom: var(--space-16);">
              <label style="display: block; font-size: 14px; margin-bottom: var(--space-4);">Default Annotation Color</label>
              <input type="color" id="setting-annotation-color" value="${this.settings.annotationColor}" style="width: 100%; height: 40px; padding: 0; border: none; background: transparent;">
            </div>
          </div>
          
        </div>
      </div>
    `;

    this.attachEvents();
    this.populateVoices();
  }

  async populateVoices() {
    const synth = window.speechSynthesis;
    let voices = synth.getVoices();
    if (voices.length === 0) {
      await new Promise(r => {
        synth.onvoiceschanged = () => {
          voices = synth.getVoices();
          r();
        };
      });
    }
    
    const select = this.container.querySelector('#setting-tts-voice');
    if (!select) return;
    
    voices.forEach(voice => {
      const option = document.createElement('option');
      option.value = voice.voiceURI;
      option.textContent = `${voice.name} (${voice.lang})`;
      if (voice.voiceURI === this.settings.ttsVoice || voice.name === this.settings.ttsVoice) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  }

  attachEvents() {
    const backdrop = this.container.querySelector('.settings-backdrop');
    const drawer = this.container.querySelector('.settings-drawer');
    const closeBtn = this.container.querySelector('#btn-close-settings');

    const closeSettings = () => {
      drawer.style.transform = 'translateX(100%)';
      setTimeout(() => backdrop.style.display = 'none', 300);
      this.saveSettings();
    };

    closeBtn.addEventListener('click', closeSettings);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeSettings();
    });

    document.addEventListener('open-settings', () => {
      backdrop.style.display = 'block';
      setTimeout(() => drawer.style.transform = 'translateX(0)', 10);
    });

    this.container.querySelector('#setting-tts-speed').addEventListener('input', (e) => {
      this.settings.ttsSpeed = parseFloat(e.target.value);
      e.target.previousElementSibling.textContent = `TTS Speed (${this.settings.ttsSpeed}x)`;
    });

    this.container.querySelector('#setting-tts-voice').addEventListener('change', (e) => {
      this.settings.ttsVoice = e.target.value;
    });

    this.container.querySelector('#setting-auto-advance').addEventListener('change', (e) => {
      this.settings.autoAdvance = e.target.checked;
    });
    this.container.querySelector('#setting-auto-advance-delay').addEventListener('change', (e) => {
      this.settings.autoAdvanceDelay = parseInt(e.target.value);
    });
    this.container.querySelector('#setting-transition').addEventListener('change', (e) => {
      this.settings.transition = e.target.value;
    });
    this.container.querySelector('#setting-annotation-color').addEventListener('change', (e) => {
      this.settings.annotationColor = e.target.value;
    });
  }
}
