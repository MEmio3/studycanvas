/**
 * TTSEngine — Kokoro.js (neural, offline) with Web Speech API fallback.
 * 
 * First use downloads ~86 MB ONNX model (cached permanently in browser storage).
 * All subsequent uses are instant and fully offline.
 */

const KOKORO_VOICES = [
  { id: 'af_heart',  label: 'Heart (Female, American)',  lang: 'en-US' },
  { id: 'af_alloy',  label: 'Alloy (Female, American)',  lang: 'en-US' },
  { id: 'af_aoede',  label: 'Aoede (Female, American)',  lang: 'en-US' },
  { id: 'af_bella',  label: 'Bella (Female, American)',  lang: 'en-US' },
  { id: 'af_jessica', label: 'Jessica (Female, American)', lang: 'en-US' },
  { id: 'af_nicole', label: 'Nicole (Female, American)', lang: 'en-US' },
  { id: 'af_nova',   label: 'Nova (Female, American)',   lang: 'en-US' },
  { id: 'af_river',  label: 'River (Female, American)',  lang: 'en-US' },
  { id: 'af_sarah',  label: 'Sarah (Female, American)',  lang: 'en-US' },
  { id: 'af_sky',    label: 'Sky (Female, American)',    lang: 'en-US' },
  { id: 'am_adam',   label: 'Adam (Male, American)',     lang: 'en-US' },
  { id: 'am_echo',   label: 'Echo (Male, American)',     lang: 'en-US' },
  { id: 'am_eric',   label: 'Eric (Male, American)',     lang: 'en-US' },
  { id: 'am_liam',   label: 'Liam (Male, American)',     lang: 'en-US' },
  { id: 'am_michael', label: 'Michael (Male, American)', lang: 'en-US' },
  { id: 'am_onyx',   label: 'Onyx (Male, American)',    lang: 'en-US' },
  { id: 'bf_emma',   label: 'Emma (Female, British)',    lang: 'en-GB' },
  { id: 'bf_isabella', label: 'Isabella (Female, British)', lang: 'en-GB' },
  { id: 'bm_daniel', label: 'Daniel (Male, British)',    lang: 'en-GB' },
  { id: 'bm_fable',  label: 'Fable (Male, British)',    lang: 'en-GB' },
  { id: 'bm_george', label: 'George (Male, British)',   lang: 'en-GB' },
  { id: 'bm_lewis',  label: 'Lewis (Male, British)',    lang: 'en-GB' },
];

export class TTSEngine {
  constructor() {
    this.synth = window.speechSynthesis;
    this.currentUtterance = null;
    this.isPlaying = false;
    this.kokoroInstance = null;
    this.kokoroReady = false;
    this.kokoroLoading = false;
    this.audioContext = null;
    this.currentSource = null;
    this.useKokoro = true;
    this._startTime = 0;
    this._totalDuration = 0;
    this._currentText = '';
    this._animFrameId = null;
  }

  /**
   * Returns list of Kokoro voices for the Settings panel.
   */
  static getKokoroVoices() {
    return KOKORO_VOICES;
  }

  /**
   * Lazy-load the Kokoro model. Fires events for UI progress.
   */
  async _initKokoro() {
    if (this.kokoroReady) return true;
    if (this.kokoroLoading) {
      // Wait for the ongoing load to finish
      return new Promise((resolve) => {
        const check = setInterval(() => {
          if (!this.kokoroLoading) {
            clearInterval(check);
            resolve(this.kokoroReady);
          }
        }, 200);
      });
    }

    this.kokoroLoading = true;
    document.dispatchEvent(new CustomEvent('tts-model-loading', { detail: { status: 'downloading' } }));

    try {
      const { KokoroTTS } = await import('kokoro-js');
      this.kokoroInstance = await KokoroTTS.from_pretrained(
        'onnx-community/Kokoro-82M-v1.0-ONNX',
        { dtype: 'q8', device: 'wasm' }
      );
      this.kokoroReady = true;
      this.kokoroLoading = false;
      document.dispatchEvent(new CustomEvent('tts-model-loading', { detail: { status: 'ready' } }));
      console.log('[TTS] Kokoro model loaded successfully.');
      return true;
    } catch (err) {
      console.error('[TTS] Kokoro failed to load, falling back to Web Speech:', err);
      this.kokoroLoading = false;
      this.useKokoro = false;
      document.dispatchEvent(new CustomEvent('tts-model-loading', { detail: { status: 'fallback' } }));
      return false;
    }
  }

  /**
   * Read user settings from localStorage.
   */
  _getSettings() {
    const defaults = { ttsSpeed: 1.0, ttsVoice: 'af_heart', ttsEngine: 'kokoro' };
    const raw = localStorage.getItem('studycanvas_settings');
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  }

  /**
   * Primary play method — tries Kokoro first, falls back to Web Speech.
   */
  async play(text, onEnd) {
    if (this.isPlaying) this.stop();
    if (!text || !text.trim()) return;

    const settings = this._getSettings();
    this._currentText = text;

    if (settings.ttsEngine === 'browser' || !this.useKokoro) {
      this._playWebSpeech(text, settings, onEnd);
      return;
    }

    // Kokoro path
    const ready = await this._initKokoro();
    if (!ready) {
      this._playWebSpeech(text, settings, onEnd);
      return;
    }

    try {
      const voiceId = settings.ttsVoice || 'af_heart';
      console.log(`[TTS] Generating with Kokoro voice: ${voiceId}`);
      const result = await this.kokoroInstance.generate(text, { voice: voiceId });

      // result.data = Float32Array, result.sampling_rate = number
      const audioData = result.data;
      const sampleRate = result.sampling_rate || 24000;

      // Create AudioContext and play
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      // Resume context if it was suspended (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const buffer = this.audioContext.createBuffer(1, audioData.length, sampleRate);
      buffer.copyToChannel(audioData, 0);

      // Apply speed via playbackRate
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = settings.ttsSpeed || 1.0;
      source.connect(this.audioContext.destination);

      this.currentSource = source;
      this._totalDuration = buffer.duration / (settings.ttsSpeed || 1.0);
      this._startTime = this.audioContext.currentTime;

      source.onended = () => {
        this.isPlaying = false;
        this.currentSource = null;
        this._stopWordTracking();
        if (onEnd) onEnd();
      };

      source.start();
      this.isPlaying = true;
      this._startWordTracking(text);
      console.log(`[TTS] Kokoro playback started (${buffer.duration.toFixed(1)}s @ ${settings.ttsSpeed}x)`);

    } catch (err) {
      console.error('[TTS] Kokoro playback failed, falling back to Web Speech:', err);
      this._playWebSpeech(text, settings, onEnd);
    }
  }

  /**
   * Track word position via requestAnimationFrame for subtitle sync.
   */
  _startWordTracking(text) {
    const words = text.split(/\s+/);
    const totalWords = words.length;
    if (totalWords === 0) return;

    const tick = () => {
      if (!this.isPlaying || !this.audioContext) return;
      const elapsed = this.audioContext.currentTime - this._startTime;
      const progress = Math.min(elapsed / this._totalDuration, 1.0);
      const wordIndex = Math.min(Math.floor(progress * totalWords), totalWords - 1);

      document.dispatchEvent(new CustomEvent('tts-boundary', {
        detail: { wordIndex }
      }));

      if (progress < 1.0) {
        this._animFrameId = requestAnimationFrame(tick);
      }
    };
    this._animFrameId = requestAnimationFrame(tick);
  }

  _stopWordTracking() {
    if (this._animFrameId) {
      cancelAnimationFrame(this._animFrameId);
      this._animFrameId = null;
    }
  }

  /**
   * Fallback: Web Speech API (browser-native).
   */
  _playWebSpeech(text, settings, onEnd) {
    console.log('[TTS] Using Web Speech API fallback.');
    this.currentUtterance = new SpeechSynthesisUtterance(text);

    if (settings.ttsSpeed) this.currentUtterance.rate = settings.ttsSpeed;
    if (settings.ttsVoice && settings.ttsEngine === 'browser') {
      const voices = window.speechSynthesis.getVoices();
      const selected = voices.find(v => v.voiceURI === settings.ttsVoice);
      if (selected) this.currentUtterance.voice = selected;
    }

    this.currentUtterance.onboundary = (event) => {
      if (event.name === 'word') {
        const charIndex = event.charIndex;
        const textUpToChar = text.substring(0, charIndex);
        const wordIndex = (textUpToChar.match(/\s+/g) || []).length;
        document.dispatchEvent(new CustomEvent('tts-boundary', {
          detail: { wordIndex }
        }));
      }
    };

    this.currentUtterance.onend = () => {
      this.isPlaying = false;
      if (onEnd) onEnd();
    };

    this.synth.speak(this.currentUtterance);
    this.isPlaying = true;
  }

  pause() {
    // Kokoro path — AudioContext doesn't natively pause a source, so we suspend the context
    if (this.currentSource && this.audioContext) {
      this.audioContext.suspend();
      this.isPlaying = false;
      this._stopWordTracking();
      return;
    }
    // Web Speech path
    if (this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
      this.isPlaying = false;
    }
  }

  resume() {
    // Kokoro path
    if (this.audioContext && this.audioContext.state === 'suspended' && this.currentSource) {
      this.audioContext.resume();
      this.isPlaying = true;
      this._startWordTracking(this._currentText);
      return;
    }
    // Web Speech path
    if (this.synth.paused) {
      this.synth.resume();
      this.isPlaying = true;
    }
  }

  stop() {
    this._stopWordTracking();
    // Kokoro path
    if (this.currentSource) {
      try { this.currentSource.stop(); } catch (e) { /* already stopped */ }
      this.currentSource = null;
    }
    // Web Speech path
    if (this.synth.speaking) {
      this.synth.cancel();
    }
    this.isPlaying = false;
  }
}

export const tts = new TTSEngine();
