/**
 * BHOOMI-Net 2.0 - Audio Alerts & Voice Synthesis Engine
 * Provides realistic procedural sirens using Web Audio API
 * and tactical speech notifications using Web Speech API.
 * All synthesis is local and zero-dependency.
 */

class AudioAlertSystem {
  constructor() {
    this.audioCtx = null;
    this.sirenOsc = null;
    this.sirenGain = null;
    this.isSirenPlaying = false;
    this.sirenInterval = null;
    this.speechSynth = window.speechSynthesis || null;
  }

  /**
   * Initializes or resumes the AudioContext (requires user gesture)
   */
  initAudio() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Plays a procedural emergency siren tone using dual-frequency modulation
   * @param {number} durationMs - Duration before auto stop (default: 4000ms)
   */
  playSiren(durationMs = 4500) {
    this.initAudio();
    if (!this.audioCtx) {
      console.warn("Web Audio API not supported on this browser.");
      return;
    }

    if (this.isSirenPlaying) {
      this.stopSiren();
      return;
    }

    try {
      const now = this.audioCtx.currentTime;
      this.isSirenPlaying = true;

      // Master Gain
      this.sirenGain = this.audioCtx.createGain();
      this.sirenGain.gain.setValueAtTime(0.001, now);
      this.sirenGain.gain.exponentialRampToValueAtTime(0.25, now + 0.3);

      // Low Pass Filter to make siren sound warmer and less piercing
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);

      // Main Oscillator
      this.sirenOsc = this.audioCtx.createOscillator();
      this.sirenOsc.type = 'sawtooth';

      // Pitch sweep warble
      const cycleTime = 0.8; // seconds per cycle
      const cycles = Math.ceil(durationMs / 1000 / cycleTime) + 1;
      
      for (let i = 0; i < cycles; i++) {
        const startT = now + (i * cycleTime);
        const midT = startT + (cycleTime * 0.5);
        const endT = startT + cycleTime;
        this.sirenOsc.frequency.setValueAtTime(440, startT);
        this.sirenOsc.frequency.linearRampToValueAtTime(880, midT);
        this.sirenOsc.frequency.linearRampToValueAtTime(440, endT);
      }

      this.sirenOsc.connect(filter);
      filter.connect(this.sirenGain);
      this.sirenGain.connect(this.audioCtx.destination);

      this.sirenOsc.start(now);

      // Auto stop after durationMs
      this.sirenTimeout = setTimeout(() => {
        this.stopSiren();
      }, durationMs);

    } catch (err) {
      console.error("Failed to play siren:", err);
      this.isSirenPlaying = false;
    }
  }

  /**
   * Stops active siren smoothly
   */
  stopSiren() {
    if (this.sirenTimeout) {
      clearTimeout(this.sirenTimeout);
      this.sirenTimeout = null;
    }
    if (this.isSirenPlaying && this.sirenGain && this.audioCtx) {
      try {
        const now = this.audioCtx.currentTime;
        this.sirenGain.gain.setValueAtTime(this.sirenGain.gain.value, now);
        this.sirenGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
        setTimeout(() => {
          if (this.sirenOsc) {
            this.sirenOsc.stop();
            this.sirenOsc.disconnect();
            this.sirenOsc = null;
          }
          this.isSirenPlaying = false;
        }, 250);
      } catch (e) {
        this.isSirenPlaying = false;
      }
    } else {
      this.isSirenPlaying = false;
    }
  }

  /**
   * Speaks simulated early warning announcement using SpeechSynthesis API
   * @param {string} hazardName - e.g. "Flash Flood", "Wildfire", "Landslide"
   * @param {string} riskLevel - e.g. "HIGH", "CRITICAL"
   * @param {string} customMsg - optional message
   */
  speakVoiceAlert(hazardName = "Flash Flood", riskLevel = "HIGH", customMsg = null) {
    if (!this.speechSynth) {
      console.warn("Speech Synthesis not supported on this browser.");
      return;
    }

    // Cancel any previous utterance
    this.speechSynth.cancel();

    const textToSpeak = customMsg || 
      `Attention. Simulated early warning indicator. BHOOMI AI has registered elevated ${hazardName} risk level ${riskLevel}. Vulnerable ecological zone detected. Autonomous afforestation recommendation dispatched. Simulated lead time: 4 to 5 days.`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;

    // Pick crisp English voice if available
    const voices = this.speechSynth.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('David') || v.name.includes('Zira')));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    this.speechSynth.speak(utterance);
  }
}

// Global instance
window.bhoomiAudio = new AudioAlertSystem();
