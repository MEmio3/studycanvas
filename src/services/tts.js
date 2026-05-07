/**
 * TTSEngine — Kokoro.js (neural, offline) with Web Speech API fallback.
 * 
 * First use downloads ~82 MB ONNX model (cached permanently in browser storage).
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
    this.audioElement = null;
    this.useKokoro = true; // default to Kokoro
    this._wordTimestamps = [];
    this._timeUpdateBound = null;
  }

  /**
   * Returns list of Kokoro voices for the Settings panel.
   */
  static getKokoroVoices() {
    return KOKORO_VOICES;
  }

  /**
   * Lazy-load the Kokoro model. Shows a progress indicator via custom event.
   */
  async _initKokoro() {
    if (this.kokoroReady) return true;
    if (this.kokoroLoading) return false;

    this.kokoroLoading = true;
    document.dispatchEvent(new CustomEvent('tts-model-loading', { detail: { status: 'downloading' } }));

    try {
      const { KokoroTTS } = await import('kokoro-js');
      this.kokoroInstance = await KokoroTTS.from_pretrained(
        'onnx-community/Kokoro-82M-v1.0',
        { dtype: 'fp32' }
      );
      this.kokoroReady = true;
      this.kokoroLoading = false;
      document.dispatchEvent(new CustomEvent('tts-model-loading', { detail: { status: 'ready' } }));
      return true;
    } catch (err) {
      console.error('Kokoro TTS failed to load, falling back to Web Speech:', err);
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
      const audio = await this.kokoroInstance.generate(text, { voice: voiceId });

      // Create blob URL from the generated audio
      const blob = new Blob([audio.toWav()], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);

      if (!this.audioElement) {
        this.audioElement = new Audio();
      }
      this.audioElement.src = url;
      this.audioElement.playbackRate = settings.ttsSpeed || 1.0;

      // Estimate word timestamps for subtitle sync
      this._estimateWordTimestamps(text, audio.toWav());

      // Clean up previous listener
      if (this._timeUpdateBound) {
        this.audioElement.removeEventListener('timeupdate', this._timeUpdateBound);
      }

      this._timeUpdateBound = () => {
        const currentTime = this.audioElement.currentTime;
        const totalDuration = this.audioElement.duration;
        if (!totalDuration) return;

        // Estimate which word we are on based on time proportion
        const words = text.split(/\s+/);
        const progress = currentTime / totalDuration;
        const wordIndex = Math.min(Math.floor(progress * words.length), words.length - 1);

        document.dispatchEvent(new CustomEvent('tts-boundary', {
          detail: { wordIndex }
        }));
      };
      this.audioElement.addEventListener('timeupdate', this._timeUpdateBound);

      this.audioElement.onended = () => {
        this.isPlaying = false;
        URL.revokeObjectURL(url);
        if (onEnd) onEnd();
      };

      await this.audioElement.play();
      this.isPlaying = true;

    } catch (err) {
      console.error('Kokoro playback failed, falling back to Web Speech:', err);
      this._playWebSpeech(text, settings, onEnd);
    }
  }

  /**
   * Fallback: Web Speech API (browser-native).
   */
  _playWebSpeech(text, settings, onEnd) {
    this.currentUtterance = new SpeechSynthesisUtterance(text);

    if (settings.ttsSpeed) this.currentUtterance.rate = settings.ttsSpeed;
    if (settings.ttsVoice) {
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

  _estimateWordTimestamps(text) {
    // Simple linear estimation — Kokoro doesn't expose per-word timing
    const words = text.split(/\s+/);
    this._wordTimestamps = words.map((_, i) => i / words.length);
  }

  pause() {
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
      this.isPlaying = false;
      return;
    }
    if (this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
      this.isPlaying = false;
    }
  }

  resume() {
    if (this.audioElement && this.audioElement.paused && this.audioElement.src) {
      this.audioElement.play();
      this.isPlaying = true;
      return;
    }
    if (this.synth.paused) {
      this.synth.resume();
      this.isPlaying = true;
    }
  }

  stop() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    if (this.synth.speaking) {
      this.synth.cancel();
    }
    this.isPlaying = false;
  }
}

export const tts = new TTSEngine();
