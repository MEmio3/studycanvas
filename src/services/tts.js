export class TTSEngine {
  constructor() {
    this.synth = window.speechSynthesis;
    this.currentUtterance = null;
    this.isPlaying = false;
  }

  play(text, onEnd) {
    if (this.isPlaying) this.stop();
    if (!text || !text.trim()) return;
    
    this.currentUtterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance.rate = parseFloat(localStorage.getItem('studycanvas_settings_tts_speed')) || 1.0;
    
    this.currentUtterance.onend = () => {
      this.isPlaying = false;
      if (onEnd) onEnd();
    };

    this.synth.speak(this.currentUtterance);
    this.isPlaying = true;
  }

  pause() {
    if (this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
      this.isPlaying = false;
    }
  }

  resume() {
    if (this.synth.paused) {
      this.synth.resume();
      this.isPlaying = true;
    }
  }

  stop() {
    if (this.synth.speaking) {
      this.synth.cancel();
    }
    this.isPlaying = false;
  }
}

export const tts = new TTSEngine();
