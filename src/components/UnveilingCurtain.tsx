import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, RefreshCw, X, Stars } from 'lucide-react';
import confetti from 'canvas-confetti';

interface UnveilingCurtainProps {
  onClose: () => void;
  appTheme: 'dark' | 'light' | 'sankofa' | 'momoamo' | 'madrid';
}

export default function UnveilingCurtain({ onClose, appTheme }: UnveilingCurtainProps) {
  const [isDrawn, setIsDrawn] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  // Trigger continuous festive confetti bursts and synchronized firework sounds when drawn open
  const triggerConfettiCelebration = () => {
    const duration = 5 * 1000; // 5-second continuous celebration
    const end = Date.now() + duration;

    // Trigger initial burst
    playFireworkSound(0);

    // Outer edge confetti cannons
    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ['#FDA172', '#E1FE35', '#bf3f27', '#06b6d4', '#ec4899', '#f59e0b']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: ['#FDA172', '#E1FE35', '#bf3f27', '#06b6d4', '#ec4899', '#f59e0b']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // Center splash burst
    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FDA172', '#E1FE35', '#bf3f27', '#22c55e', '#3b82f6', '#d946ef']
      });
    }, 400);

    // Final blast
    setTimeout(() => {
      confetti({
        particleCount: 120,
        spread: 100,
        decay: 0.91,
        scalar: 1.2,
        origin: { y: 0.5 }
      });
    }, 1200);

    // Continuous firework sounds playing through the duration of confetti!
    const soundInterval = setInterval(() => {
      if (Date.now() >= end) {
        clearInterval(soundInterval);
        return;
      }
      playFireworkSound(0);
    }, 600);
  };

  // Helper to trigger standard cymbal crash
  const triggerCymbalCrash = (ctx: AudioContext, time: number, volume: number, filterFreq = 8000) => {
    try {
      const crashBufferSize = ctx.sampleRate * 3.5;
      const crashBuffer = ctx.createBuffer(1, crashBufferSize, ctx.sampleRate);
      const crashData = crashBuffer.getChannelData(0);
      for (let i = 0; i < crashBufferSize; i++) {
        crashData[i] = Math.random() * 2 - 1;
      }

      const crashNoise = ctx.createBufferSource();
      crashNoise.buffer = crashBuffer;

      const crashHighpass = ctx.createBiquadFilter();
      crashHighpass.type = 'highpass';
      crashHighpass.frequency.setValueAtTime(filterFreq, time);

      const crashGain = ctx.createGain();
      crashGain.gain.setValueAtTime(0.001, ctx.currentTime);
      crashGain.gain.setValueAtTime(0.001, time);
      crashGain.gain.linearRampToValueAtTime(volume, time + 0.02);
      crashGain.gain.exponentialRampToValueAtTime(0.001, time + 3.0);

      crashNoise.connect(crashHighpass);
      crashHighpass.connect(crashGain);
      crashGain.connect(ctx.destination);

      const chime = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(987.77, time);
      chimeGain.gain.setValueAtTime(0.001, ctx.currentTime);
      chimeGain.gain.setValueAtTime(0.001, time);
      chimeGain.gain.linearRampToValueAtTime(volume * 0.4, time + 0.02);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, time + 1.8);

      chime.connect(chimeGain);
      chimeGain.connect(ctx.destination);

      crashNoise.start(time);
      chime.start(time);

      crashNoise.stop(time + 3.6);
      chime.stop(time + 3.6);
    } catch {}
  };

  // Helper for orchestral gong & booming bass crash
  const triggerOrchestralCrash = (ctx: AudioContext, time: number) => {
    try {
      // Gong metallic crash
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const osc3 = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc1.type = 'triangle'; osc1.frequency.setValueAtTime(110, time);
      osc2.type = 'sawtooth'; osc2.frequency.setValueAtTime(174.61, time); // F3
      osc3.type = 'sine'; osc3.frequency.setValueAtTime(261.63, time); // C4

      oscGain.gain.setValueAtTime(0.001, ctx.currentTime);
      oscGain.gain.setValueAtTime(0.001, time);
      oscGain.gain.linearRampToValueAtTime(0.3, time + 0.03);
      oscGain.gain.exponentialRampToValueAtTime(0.001, time + 2.5);

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(350, time);
      bandpass.Q.setValueAtTime(1.2, time);

      osc1.connect(bandpass);
      osc2.connect(bandpass);
      osc3.connect(bandpass);
      bandpass.connect(oscGain);
      oscGain.connect(ctx.destination);

      // Deep booming low sub explosion
      const boom = ctx.createOscillator();
      const boomGain = ctx.createGain();
      boom.type = 'sine';
      boom.frequency.setValueAtTime(45, time);
      boom.frequency.linearRampToValueAtTime(25, time + 1.5);

      boomGain.gain.setValueAtTime(0.001, ctx.currentTime);
      boomGain.gain.setValueAtTime(0.001, time);
      boomGain.gain.linearRampToValueAtTime(0.5, time + 0.02);
      boomGain.gain.exponentialRampToValueAtTime(0.001, time + 2.8);

      boom.connect(boomGain);
      boomGain.connect(ctx.destination);

      osc1.start(time); osc2.start(time); osc3.start(time); boom.start(time);
      osc1.stop(time + 2.6); osc2.stop(time + 2.6); osc3.stop(time + 2.6); boom.stop(time + 3.0);
    } catch {}
  };

  // Play short firework sound burst (crackle + boom)
  const playFireworkSound = (delay: number) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime + delay;

      // 1. Thud / Deep Boom
      const boomOsc = ctx.createOscillator();
      const boomGain = ctx.createGain();
      boomOsc.type = 'sine';
      boomOsc.frequency.setValueAtTime(140, now);
      boomOsc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
      boomGain.gain.setValueAtTime(0.4, now);
      boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      boomOsc.connect(boomGain);
      boomGain.connect(ctx.destination);
      boomOsc.start(now);
      boomOsc.stop(now + 0.25);

      // 2. High frequency crackles (Sparkles)
      const numCrackles = 16;
      for (let i = 0; i < numCrackles; i++) {
        const popTime = now + 0.05 + Math.random() * 0.8;
        const popDuration = 0.01 + Math.random() * 0.02;
        const popVel = Math.random() * 0.22 + 0.05;

        // Create short noise source
        const bufferSize = ctx.sampleRate * popDuration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let j = 0; j < bufferSize; j++) {
          data[j] = Math.random() * 2 - 1;
        }

        const popNoise = ctx.createBufferSource();
        popNoise.buffer = buffer;

        const popFilter = ctx.createBiquadFilter();
        popFilter.type = 'bandpass';
        popFilter.frequency.setValueAtTime(3500 + Math.random() * 4500, popTime);
        popFilter.Q.setValueAtTime(2.5, popTime);

        const popGain = ctx.createGain();
        popGain.gain.setValueAtTime(popVel, popTime);
        popGain.gain.exponentialRampToValueAtTime(0.001, popTime + popDuration - 0.002);

        popNoise.connect(popFilter);
        popFilter.connect(popGain);
        popGain.connect(ctx.destination);

        popNoise.start(popTime);
        popNoise.stop(popTime + popDuration);
      }
    } catch (e) {
      console.warn('[WebAudio] Firework sound synthesis failed:', e);
    }
  };

  // Synthesize a grand cinematic trumpet fanfare (MGM/Hollywood intro style)
  const playTrumpetFanfare = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;
      const fanfareDuration = 4.3; // matches the curtain-raiser delay before the cymbal crash

      // Helper function to play a single synth brass voice
      const playBrassNote = (freq: number, start: number, duration: number, vol: number, detuneAmount = 10) => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(freq, start);
        osc1.detune.setValueAtTime(-detuneAmount, start);

        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(freq, start);
        osc2.detune.setValueAtTime(detuneAmount, start);

        // Warm analog filter sweep
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(100, start);
        filter.frequency.exponentialRampToValueAtTime(3500, start + 0.08); // dynamic swell
        filter.frequency.exponentialRampToValueAtTime(1800, start + duration - 0.05); // warm sustain
        filter.frequency.exponentialRampToValueAtTime(100, start + duration + 0.15); // soft release

        // Brass volume envelope
        gainNode.gain.setValueAtTime(0.001, start);
        gainNode.gain.linearRampToValueAtTime(vol, start + 0.05); // punchy attack
        gainNode.gain.setValueAtTime(vol, start + duration - 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration + 0.1);

        // Natural LFO for organic vibrato
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(6.5, start); // 6.5 Hz vibrato
        lfoGain.gain.setValueAtTime(6, start); // Depth in cents

        lfo.connect(lfoGain);
        lfoGain.connect(osc1.detune);
        lfoGain.connect(osc2.detune);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        lfo.start(start);
        osc1.start(start);
        osc2.start(start);

        lfo.stop(start + duration + 0.2);
        osc1.stop(start + duration + 0.2);
        osc2.stop(start + duration + 0.2);
      };

      // Programmed heroic fanfare melody & harmony:
      // Note 1: G4 starting at 0s, lasting 0.5s
      playBrassNote(392.00, now, 0.5, 0.20);
      
      // Note 2: C5 starting at 0.5s, lasting 0.5s
      playBrassNote(523.25, now + 0.5, 0.5, 0.20);

      // Note 3: D5 starting at 1.0s, lasting 0.5s
      playBrassNote(587.33, now + 1.0, 0.5, 0.20);

      // Note 4: E5 starting at 1.5s, lasting 0.8s
      playBrassNote(659.25, now + 1.5, 0.8, 0.24);

      // Harmonic backing on Note 4's sustain (at 1.8s)
      playBrassNote(392.00, now + 1.8, 0.5, 0.14);
      playBrassNote(261.63, now + 1.8, 0.5, 0.14);

      // Step up to G5 at 2.3s
      playBrassNote(783.99, now + 2.3, 0.8, 0.24);
      playBrassNote(523.25, now + 2.3, 0.8, 0.16);

      // Grand Climax MGM-style Swell Chord (from 3.1s to 4.3s)
      const chordStart = now + 3.1;
      const chordDur = 1.2;
      playBrassNote(130.81, chordStart, chordDur, 0.22, 5);  // C3 (low root)
      playBrassNote(196.00, chordStart, chordDur, 0.20, 5);  // G3 (low fifth)
      playBrassNote(261.63, chordStart, chordDur, 0.18, 8);  // C4
      playBrassNote(329.63, chordStart, chordDur, 0.18, 8);  // E4
      playBrassNote(392.00, chordStart, chordDur, 0.18, 12); // G4
      playBrassNote(523.25, chordStart, chordDur, 0.20, 12); // C5
      playBrassNote(659.25, chordStart, chordDur, 0.20, 15); // E5
      playBrassNote(783.99, chordStart, chordDur, 0.24, 15); // G5 (triumphant climax)

      // Cymbal crash right at 4.3s climax
      triggerCymbalCrash(ctx, now + fanfareDuration, 0.60);

      // Orchestral deep boom & gong to accentuate majesty
      triggerOrchestralCrash(ctx, now + fanfareDuration);

    } catch (error) {
      console.warn('[WebAudio] Trumpet fanfare synthesis failed:', error);
    }
  };

  const handleUnveil = () => {
    setIsDrawn(true);
    // Play dramatic synthesized cinematic trumpet fanfare leading into a crash
    playTrumpetFanfare();

    // Wait for the slower, realistic curtain drawing transition (4.8s total)
    setTimeout(() => {
      setShowThankYou(true);
      triggerConfettiCelebration();
    }, 4500);
  };

  // Prevent background scrolling while curtain is active
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div id="unveiling-root-overlay" className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Background container underneath the curtains */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />

      {/* CURTAIN PANELS */}
      <div className="absolute inset-0 flex pointer-events-none">
        {/* Left Curtain */}
        <motion.div
          id="left-curtain-panel"
          initial={{ scaleX: 1, x: 0, skewY: 0 }}
          animate={isDrawn ? { 
            scaleX: 0.08, 
            x: '-4%', 
            skewY: [0, -5, 3, -2, 1, -0.5, 0.2, 0] 
          } : { 
            scaleX: 1, 
            x: 0, 
            skewY: 0 
          }}
          transition={{ duration: 4.8, ease: [0.77, 0, 0.175, 1] }}
          className="w-1/2 h-full relative pointer-events-auto shadow-[20px_0_40px_rgba(0,0,0,0.8)] flex items-center justify-end"
          style={{
            originX: 0,
            background: 'linear-gradient(to bottom, #4a0d15 0%, #200407 80%, #0d0102 100%)',
          }}
        >
          {/* Deep Velvet Fold Highlights Overlay */}
          <div className="absolute inset-0 opacity-40 pointer-events-none mix-blend-overlay" style={{
            background: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 3%, rgba(255,255,255,0.08) 6%, rgba(0,0,0,0.35) 9%, rgba(0,0,0,0.7) 12%)'
          }} />

          {/* Vertical gold fold texture simulation */}
          <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-r from-amber-400/30 to-yellow-600/60 shadow-[0_0_10px_rgba(245,158,11,0.5)] z-10" />
          <div className="absolute inset-y-0 left-[15%] w-px bg-black/40" />
          <div className="absolute inset-y-0 left-[30%] w-px bg-black/45" />
          <div className="absolute inset-y-0 left-[45%] w-px bg-black/40" />
          <div className="absolute inset-y-0 left-[60%] w-px bg-black/45" />
          <div className="absolute inset-y-0 left-[75%] w-px bg-black/40" />
          <div className="absolute inset-y-0 left-[90%] w-px bg-black/50" />
          
          {/* Gold fringe at the bottom */}
          <div className="absolute bottom-0 inset-x-0 h-4 bg-gradient-to-t from-amber-500/20 to-transparent border-t border-amber-400/30 flex justify-around items-end pb-1 z-10">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400/50" />
            ))}
          </div>
        </motion.div>

        {/* Right Curtain */}
        <motion.div
          id="right-curtain-panel"
          initial={{ scaleX: 1, x: 0, skewY: 0 }}
          animate={isDrawn ? { 
            scaleX: 0.08, 
            x: '4%', 
            skewY: [0, 5, -3, 2, -1, 0.5, -0.2, 0] 
          } : { 
            scaleX: 1, 
            x: 0, 
            skewY: 0 
          }}
          transition={{ duration: 4.8, ease: [0.77, 0, 0.175, 1] }}
          className="w-1/2 h-full relative pointer-events-auto shadow-[-20px_0_40px_rgba(0,0,0,0.8)] flex items-center justify-start"
          style={{
            originX: 1,
            background: 'linear-gradient(to bottom, #4a0d15 0%, #200407 80%, #0d0102 100%)',
          }}
        >
          {/* Deep Velvet Fold Highlights Overlay */}
          <div className="absolute inset-0 opacity-40 pointer-events-none mix-blend-overlay" style={{
            background: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 3%, rgba(255,255,255,0.08) 6%, rgba(0,0,0,0.35) 9%, rgba(0,0,0,0.7) 12%)'
          }} />

          {/* Vertical gold fold texture simulation */}
          <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-l from-amber-400/30 to-yellow-600/60 shadow-[0_0_10px_rgba(245,158,11,0.5)] z-10" />
          <div className="absolute inset-y-0 right-[15%] w-px bg-black/40" />
          <div className="absolute inset-y-0 right-[30%] w-px bg-black/45" />
          <div className="absolute inset-y-0 right-[45%] w-px bg-black/40" />
          <div className="absolute inset-y-0 right-[60%] w-px bg-black/45" />
          <div className="absolute inset-y-0 right-[75%] w-px bg-black/40" />
          <div className="absolute inset-y-0 right-[90%] w-px bg-black/50" />
          
          {/* Gold fringe at the bottom */}
          <div className="absolute bottom-0 inset-x-0 h-4 bg-gradient-to-t from-amber-500/20 to-transparent border-t border-amber-400/30 flex justify-around items-end pb-1 z-10">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400/50" />
            ))}
          </div>
        </motion.div>
      </div>

      {/* INTRODUCTORY PLAY CARD - Centered over curtains */}
      <AnimatePresence>
        {!isDrawn && (
          <motion.div
            id="curtain-cta-card-container"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 120 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-[#160305]/95 border-2 border-amber-400/30 text-[#fffdf9] p-8 rounded-3xl text-center shadow-[0_25px_60px_rgba(0,0,0,0.8)] z-10 backdrop-blur-sm"
          >
            {/* Ambient decorative glowing spot */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-400/10 blur-[40px] rounded-full pointer-events-none" />

            <div className="relative flex flex-col items-center">
              {/* Decorative theater element */}
              <div className="flex items-center gap-2 text-amber-400 mb-5">
                <Stars className="w-5 h-5 animate-pulse" />
                <span className="font-mono text-xs uppercase tracking-widest font-black text-amber-400/80">rayZRtalks</span>
                <Stars className="w-5 h-5 animate-pulse" />
              </div>

              <h2 className="font-unbounded font-black text-3xl tracking-tight leading-tight mb-2 text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-amber-300 to-yellow-500">
                THE UNVEILING
              </h2>
              <div className="w-12 h-0.5 bg-amber-400/40 rounded-full mb-6" />

              <p className="text-sm font-sans text-amber-100/70 leading-relaxed mb-8 max-w-xs">
                Welcome to the official launch of my writing ledger. Step inside to discover thought rhythms, captured daily snapshots, and verses of life.
              </p>

              {/* Draw Curtain CTA Button */}
              <button
                id="unveil-ceremony-cta-btn"
                onClick={handleUnveil}
                className="group relative px-8 py-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black font-extrabold font-mono text-xs uppercase tracking-widest rounded-full shadow-[0_4px_20px_rgba(245,158,11,0.35)] hover:shadow-[0_8px_32px_rgba(245,158,11,0.6)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                {/* Shining reflection animation */}
                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                <span className="flex items-center gap-2 justify-center">
                  <Sparkles className="w-4 h-4 fill-black text-black" />
                  Draw Curtains
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* THANK YOU CONGRATS CARD - Appears after curtains open */}
      <AnimatePresence>
        {showThankYou && (
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              id="thank-you-popup-card"
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 150 }}
              className={`w-full max-w-lg p-8 md:p-10 rounded-3xl text-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] border relative overflow-hidden ${
                appTheme === 'light'
                  ? 'bg-white border-black/10 text-[#0E0E15]'
                  : appTheme === 'sankofa'
                  ? 'bg-[#1C1412] border-[#bf3f27]/30 text-[#ebd6bc]'
                  : appTheme === 'momoamo'
                  ? 'bg-[#141C16] border-[#E1FE35]/20 text-[#FAF6F0]'
                  : appTheme === 'madrid'
                  ? 'bg-white border-black/10 text-neutral-900 shadow-[0_20px_50px_rgba(253,161,114,0.15)]'
                  : 'bg-[#0c0d14]/95 border-cyan-500/30 text-white'
              }`}
            >
              {/* Highlight background elements */}
              <div className="absolute -top-16 -left-16 w-36 h-36 bg-amber-400/5 blur-[50px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-purple-500/5 blur-[50px] rounded-full pointer-events-none" />

              <div className="relative">
                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest font-black mb-6 bg-amber-400/10 text-amber-500 border border-amber-400/20">
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>Website Unveiled</span>
                </div>

                <h3 className="font-syne font-extrabold text-2xl md:text-3xl tracking-tight leading-tight mb-4">
                  Welcome to my Notebook!
                </h3>
                
                <div className={`w-12 h-1 mx-auto rounded-full mb-6 ${
                  appTheme === 'light' ? 'bg-[#C97F65]' : appTheme === 'sankofa' ? 'bg-[#bf3f27]' : appTheme === 'momoamo' ? 'bg-[#E1FE35]' : appTheme === 'madrid' ? 'bg-[#FF5E00]' : 'bg-cyan-400'
                }`} />

                <div className="space-y-4 text-sm md:text-base leading-relaxed text-left max-w-md mx-auto mb-8 text-neutral-400">
                  <p className={`${
                    appTheme === 'light' ? 'text-neutral-700' : appTheme === 'sankofa' ? 'text-[#ebd6bc]/90' : appTheme === 'momoamo' ? 'text-[#FAF6F0]/90' : appTheme === 'madrid' ? 'text-neutral-700' : 'text-neutral-300'
                  }`}>
                    Thank you so much for visiting my website and being part of this milestone journey. Your presence on this special unveiling day means the absolute world to me.
                  </p>
                  <p className={`${
                    appTheme === 'light' ? 'text-neutral-700' : appTheme === 'sankofa' ? 'text-[#ebd6bc]/90' : appTheme === 'momoamo' ? 'text-[#FAF6F0]/90' : appTheme === 'madrid' ? 'text-neutral-700' : 'text-neutral-300'
                  }`}>
                    This space represents my thoughts, feelings, rhythms, and captures of our passing days. I hope you find connection, inspiration, or a moment of reflection in these pages.
                  </p>
                  <p className={`font-serif italic font-bold text-right mt-3 text-lg ${
                    appTheme === 'light' ? 'text-[#C97F65]' : appTheme === 'sankofa' ? 'text-[#bf3f27]' : appTheme === 'momoamo' ? 'text-[#E1FE35]' : appTheme === 'madrid' ? 'text-[#FF5E00]' : 'text-cyan-400'
                  }`}>
                    — Ray
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    id="unveil-dismiss-btn"
                    onClick={onClose}
                    className={`w-full sm:w-auto px-8 py-3 rounded-full font-bold text-xs uppercase tracking-wider font-mono cursor-pointer transition-all duration-300 ${
                      appTheme === 'light'
                        ? 'bg-[#2E2A27] text-[#fffdf9] hover:bg-neutral-800 hover:scale-105'
                        : appTheme === 'sankofa'
                        ? 'bg-[#bf3f27] text-white hover:bg-[#a6301a] hover:scale-105'
                        : appTheme === 'momoamo'
                        ? 'bg-[#E1FE35] text-black hover:bg-[#d6f222] hover:scale-105'
                        : appTheme === 'madrid'
                        ? 'bg-[#FF5E00] text-white hover:bg-[#e05300] hover:scale-105'
                        : 'bg-cyan-500 text-black hover:bg-cyan-400 hover:scale-105'
                    }`}
                  >
                    Begin Exploring
                  </button>

                  <button
                    id="unveil-re-confetti-btn"
                    onClick={() => {
                      triggerConfettiCelebration();
                      playFireworkSound(0);
                    }}
                    className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-full text-xs font-semibold hover:bg-neutral-100/10 hover:text-amber-400 cursor-pointer transition-all border border-transparent hover:border-neutral-500/20"
                    title="Fire more confetti!"
                  >
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500 shrink-0" />
                    <span>Celebrate More</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
