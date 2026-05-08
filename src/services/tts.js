/**
 * TTSEngine — Web Speech API Native
 */

export class TTSEngine {
  constructor() {
    this.synth = window.speechSynthesis;
    this.currentUtterance = null;
    this.isPlaying = false;
    this._startTime = 0;
    this._totalDuration = 0;
    this._currentText = '';
    this._animFrameId = null;
    this.voices = [];
    
    // Load voices ASAP
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => {
        this.voices = this.synth.getVoices();
      };
    }
  }

  /**
   * Read user settings from localStorage.
   */
  _getSettings() {
    const defaults = { 
      ttsSpeed: 1.2, 
      ttsVoice: 'Google UK English Male', 
      ttsEngine: 'browser' 
    };
    const raw = localStorage.getItem('studycanvas_settings');
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  }

  /**
   * Primary play method using Web Speech API.
   */
  async play(text, onEnd) {
    if (this.isPlaying) this.stop();
    if (!text || !text.trim()) return;

    const settings = this._getSettings();
    this._currentText = text;

    console.log(`[TTS] Generating with Web Speech API...`);
    
    // Break into chunks if necessary (Web Speech sometimes truncates long texts)
    const chunks = text.match(/[^.!?]+[.!?]*/g) || [text];
    let currentChunkIndex = 0;

    const playNextChunk = () => {
      if (currentChunkIndex >= chunks.length) {
        this.isPlaying = false;
        this._stopWordTracking();
        if (onEnd) onEnd();
        return;
      }

      const chunk = chunks[currentChunkIndex];
      const utterance = new SpeechSynthesisUtterance(chunk);
      
      utterance.rate = settings.ttsSpeed || 1.2;
      
      if (this.voices.length === 0) {
        this.voices = this.synth.getVoices();
      }
      
      const preferredVoice = this.voices.find(v => v.voiceURI === settings.ttsVoice || v.name === settings.ttsVoice);
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        currentChunkIndex++;
        playNextChunk();
      };

      utterance.onerror = (e) => {
        console.error('[TTS] Web Speech playback error:', e);
        this.isPlaying = false;
        this._stopWordTracking();
        if (onEnd) onEnd();
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
      
      if (currentChunkIndex === 0) {
        this.isPlaying = true;
        // Approximation for duration based on reading speed (~150 words per min)
        const wordCount = text.split(/\s+/).length;
        this._totalDuration = (wordCount / 150) * 60 / utterance.rate;
        this._startTime = performance.now() / 1000;
        this._startWordTracking(text);
      }
    };

    playNextChunk();
  }

  /**
   * Track word position via requestAnimationFrame for subtitle sync.
   */
  _startWordTracking(text) {
    const words = text.split(/\s+/);
    const totalWords = words.length;
    if (totalWords === 0) return;

    const tick = () => {
      if (!this.isPlaying) return;
      const elapsed = (performance.now() / 1000) - this._startTime;
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
    document.dispatchEvent(new CustomEvent('tts-boundary', {
      detail: { wordIndex: -1 }
    }));
  }

  stop() {
    this.isPlaying = false;
    this.synth.cancel();
    this.currentUtterance = null;
    this._stopWordTracking();
    console.log('[TTS] Stopped playback.');
  }
}

// Export a singleton instance
export const tts = new TTSEngine();
