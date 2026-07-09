/**
 * Pure Web Audio API Synthesizer for Portfolio Soundscapes & Typewriter Focus Mode
 * Implements completely procedural audio requiring no external audio assets.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private currentDrone: {
    oscL: OscillatorNode;
    oscR: OscillatorNode;
    gain: GainNode;
    lfo: OscillatorNode;
    filter: BiquadFilterNode;
  } | null = null;

  private currentRain: {
    noise: AudioBufferSourceNode;
    gain: GainNode;
    lfo: OscillatorNode;
    filter: BiquadFilterNode;
  } | null = null;

  private currentChimes: {
    intervalId: any;
    gain: GainNode;
  } | null = null;

  private mainVolumeNode: GainNode | null = null;

  constructor() {}

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.mainVolumeNode = this.ctx.createGain();
        this.mainVolumeNode.gain.setValueAtTime(0.7, this.ctx.currentTime);
        this.mainVolumeNode.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public getContext(): AudioContext | null {
    this.initContext();
    return this.ctx;
  }

  public setGlobalVolume(volume: number) {
    this.initContext();
    if (this.mainVolumeNode && this.ctx) {
      this.mainVolumeNode.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.1);
    }
  }

  /**
   * Generates a 2-second pink noise buffer
   */
  private createPinkNoiseBuffer(): AudioBuffer {
    const ctx = this.initContext();
    if (!ctx) throw new Error('AudioContext not available');
    
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11; // scaling factor
      b6 = white * 0.115926;
    }
    
    return noiseBuffer;
  }

  /**
   * Soundscape 1: Cosmic Binaural Drone
   * Soft low-frequency chord with cosmic sweeps
   */
  public startBinauralDrone() {
    const ctx = this.initContext();
    if (!ctx) return;
    this.stopBinauralDrone();

    const oscL = ctx.createOscillator();
    const oscR = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();

    // Low relaxing frequencies with minor stereo detuning (5Hz)
    oscL.type = 'sawtooth';
    oscL.frequency.setValueAtTime(110, ctx.currentTime); // A2

    oscR.type = 'sawtooth';
    oscR.frequency.setValueAtTime(110.5, ctx.currentTime); // detuned

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, ctx.currentTime);
    filter.Q.setValueAtTime(3, ctx.currentTime);

    // LFO to slowly sweep the lowpass filter cutoff frequency for that atmospheric "billow"
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.08, ctx.currentTime); // ultra slow (12.5 seconds per cycle)
    lfoGain.gain.setValueAtTime(80, ctx.currentTime);

    // Connections
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    oscL.connect(filter);
    oscR.connect(filter);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    // Smooth fade in
    gainNode.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 3.0);

    filter.connect(gainNode);
    if (this.mainVolumeNode) {
      gainNode.connect(this.mainVolumeNode);
    }

    oscL.start();
    oscR.start();
    lfo.start();

    this.currentDrone = { oscL, oscR, gain: gainNode, lfo, filter };
  }

  public stopBinauralDrone() {
    if (this.currentDrone && this.ctx) {
      const drone = this.currentDrone;
      const now = this.ctx.currentTime;
      try {
        drone.gain.gain.setValueAtTime(drone.gain.gain.value, now);
        drone.gain.gain.linearRampToValueAtTime(0, now + 1.5);
        setTimeout(() => {
          try {
            drone.oscL.stop();
            drone.oscR.stop();
            drone.lfo.stop();
          } catch {}
        }, 1600);
      } catch (e) {
        console.warn(e);
      }
      this.currentDrone = null;
    }
  }

  /**
   * Soundscape 2: Summer Rainfall Focus Loop
   * Simulated rain on leaves with low frequency filter fluctuations
   */
  public startSummerRain() {
    const ctx = this.initContext();
    if (!ctx) return;
    this.stopSummerRain();

    try {
      const noiseBuffer = this.createPinkNoiseBuffer();
      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, ctx.currentTime);
      filter.Q.setValueAtTime(0.8, ctx.currentTime);

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // rain swells

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(250, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 2.0);

      source.connect(filter);
      filter.connect(gainNode);
      if (this.mainVolumeNode) {
        gainNode.connect(this.mainVolumeNode);
      }

      source.start();
      lfo.start();

      this.currentRain = { noise: source, gain: gainNode, lfo, filter };
    } catch (err) {
      console.error('[AudioEngine] Rain startup failed:', err);
    }
  }

  public stopSummerRain() {
    if (this.currentRain && this.ctx) {
      const rain = this.currentRain;
      const now = this.ctx.currentTime;
      try {
        rain.gain.gain.setValueAtTime(rain.gain.gain.value, now);
        rain.gain.gain.linearRampToValueAtTime(0, now + 1.2);
        setTimeout(() => {
          try {
            rain.noise.stop();
            rain.lfo.stop();
          } catch {}
        }, 1300);
      } catch (e) {
        console.warn(e);
      }
      this.currentRain = null;
    }
  }

  /**
   * Soundscape 3: Wind Chimes and Canopy Breeze
   */
  public startForestChimes() {
    const ctx = this.initContext();
    if (!ctx) return;
    this.stopForestChimes();

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
    if (this.mainVolumeNode) {
      gainNode.connect(this.mainVolumeNode);
    }

    const playRandomChime = () => {
      if (!this.ctx || !this.currentChimes) return;
      const frequencies = [880, 987.77, 1174.66, 1318.51, 1567.98, 1760]; // beautiful pentatonic notes
      const pitch = frequencies[Math.floor(Math.random() * frequencies.length)];
      
      const osc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      const biquad = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);

      biquad.type = 'bandpass';
      biquad.frequency.setValueAtTime(pitch, this.ctx.currentTime);
      biquad.Q.setValueAtTime(10, this.ctx.currentTime);

      chimeGain.gain.setValueAtTime(0, this.ctx.currentTime);
      chimeGain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.02);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.5);

      osc.connect(biquad);
      biquad.connect(chimeGain);
      chimeGain.connect(gainNode);

      osc.start();
      osc.stop(this.ctx.currentTime + 2.8);
    };

    // Schedule random chimes every 4 to 8 seconds
    const chimeTimerLoop = () => {
      playRandomChime();
      const nextDelay = 3500 + Math.random() * 5000;
      if (this.currentChimes) {
        this.currentChimes.intervalId = setTimeout(chimeTimerLoop, nextDelay);
      }
    };

    this.currentChimes = { intervalId: null, gain: gainNode };
    chimeTimerLoop();
  }

  public stopForestChimes() {
    if (this.currentChimes) {
      clearTimeout(this.currentChimes.intervalId);
      this.currentChimes = null;
    }
  }

  public stopAllSoundscapes() {
    this.stopBinauralDrone();
    this.stopSummerRain();
    this.stopForestChimes();
  }

  /**
   * --- Typewriter Focus Mode Sound Synthesizer ---
   */
  public playTypewriterClick(isSpace: boolean = false) {
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      const noiseNode = ctx.createBufferSource();
      const bandpass = ctx.createBiquadFilter();

      // Synthesize noise buffer for key impact
      const bufferSize = 0.05 * ctx.sampleRate; // very short click
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      noiseNode.buffer = buffer;

      // Bandpass filtered noise for distinct wood/metal clack
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(isSpace ? 750 : 1200, now);
      bandpass.Q.setValueAtTime(8, now);

      // Envelope for click impact
      clickGain.gain.setValueAtTime(0, now);
      clickGain.gain.linearRampToValueAtTime(isSpace ? 0.06 : 0.09, now + 0.002);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, now + (isSpace ? 0.035 : 0.025));

      // Oscillatory support for metallic resonance
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isSpace ? 180 : 350, now);
      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(isSpace ? 0.03 : 0.04, now);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

      // Connections
      noiseNode.connect(bandpass);
      bandpass.connect(clickGain);
      osc.connect(oscGain);

      if (this.mainVolumeNode) {
        clickGain.connect(this.mainVolumeNode);
        oscGain.connect(this.mainVolumeNode);
      }

      noiseNode.start(now);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {
      console.warn('Typewriter synthesis click failed:', e);
    }
  }

  /**
   * Synthesizes a beautiful typewriter bell chime
   */
  public playTypewriterBell() {
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const carrier = ctx.createOscillator();
      const modulator = ctx.createOscillator();
      const modGain = ctx.createGain();
      const bellGain = ctx.createGain();
      const bandpass = ctx.createBiquadFilter();

      // FM Synthesis for a stunning realistic brass typewriter margin bell chime!
      carrier.type = 'sine';
      carrier.frequency.setValueAtTime(1760, now); // high metallic A6

      modulator.type = 'sine';
      modulator.frequency.setValueAtTime(2640, now); // beautiful perfect fifth harmonic
      modGain.gain.setValueAtTime(300, now);

      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1760, now);
      bandpass.Q.setValueAtTime(12, now);

      // Lovely ring-down envelope
      bellGain.gain.setValueAtTime(0, now);
      bellGain.gain.linearRampToValueAtTime(0.12, now + 0.01);
      bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

      modulator.connect(modGain);
      modGain.connect(carrier.frequency);
      carrier.connect(bandpass);
      bandpass.connect(bellGain);

      if (this.mainVolumeNode) {
        bellGain.connect(this.mainVolumeNode);
      }

      carrier.start(now);
      modulator.start(now);

      carrier.stop(now + 1.0);
      modulator.stop(now + 1.0);
    } catch (e) {
      console.warn('Typewriter bell synthesis failed:', e);
    }
  }
}

export const audioEngine = new AudioEngine();
