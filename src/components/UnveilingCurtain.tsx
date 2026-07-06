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

  // Trigger spectacular fireworks bursts when drawn open
  const triggerConfettiCelebration = () => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;

    // Helper to generate a random range
    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    // Fire continuous random short fireworks bursts
    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      // Calculate particle count relative to time remaining
      const particleCount = Math.floor(65 * (timeLeft / duration)) + 15;

      // Select a random horizontal origin (between 0.15 and 0.85)
      // and a nice random height for fireworks (between 0.2 and 0.5)
      const xOrigin = randomInRange(0.15, 0.85);
      const yOrigin = randomInRange(0.2, 0.55);

      // Choose a unique palette for this firework
      const palettes = [
        ['#FF5E00', '#FFBB00', '#FF0055', '#FFFFFF'], // Fire gold & red
        ['#E1FE35', '#00FF66', '#00FFFF', '#FFFFFF'], // Momoamo neon green & cyan
        ['#bf3f27', '#ebd6bc', '#ffcda3', '#FCE7F3'], // Sankofa heritage earth tones
        ['#06b6d4', '#6366f1', '#ec4899', '#f43f5e'], // Electric cyan/indigo/pink
        ['#f59e0b', '#ef4444', '#10b981', '#3b82f6'], // Multi-color sparkle
      ];
      const selectedPalette = palettes[Math.floor(Math.random() * palettes.length)];

      // Launch standard fireworks explosion (fully spherical, high velocity)
      confetti({
        particleCount,
        spread: 360,
        startVelocity: randomInRange(35, 55),
        ticks: 85,
        origin: { x: xOrigin, y: yOrigin },
        colors: selectedPalette,
        scalar: randomInRange(1.0, 1.3),
        gravity: 1.0,
        decay: 0.92,
      });

      // Spawn a small secondary echo burst (ring/crackle effect) slightly delayed
      setTimeout(() => {
        if (Math.random() > 0.4) {
          confetti({
            particleCount: Math.floor(particleCount * 0.35),
            spread: 360,
            startVelocity: randomInRange(15, 25),
            ticks: 50,
            origin: { x: xOrigin + randomInRange(-0.03, 0.03), y: yOrigin + randomInRange(-0.03, 0.03) },
            colors: ['#FFFFFF', '#FFDD00'],
            scalar: 0.7,
            gravity: 1.2,
            decay: 0.9,
          });
        }
      }, 150);

    }, 550); // Fire a beautiful burst every 550 milliseconds
  };

  const playDrumRollAndCymbal = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      // We want to schedule a series of rapid snare hits that swell in intensity
      const rollDuration = 4.3; // matches the cymbal crash delay
      const hitInterval = 0.055; // 55ms between hits (approx 18 hits per second)
      const totalHits = Math.floor(rollDuration / hitInterval);

      // Create a shared gain node for the roll to swell it globally as well
      const mainRollGain = ctx.createGain();
      mainRollGain.gain.setValueAtTime(0.01, ctx.currentTime);
      mainRollGain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + rollDuration - 0.2);
      mainRollGain.gain.setValueAtTime(0.4, ctx.currentTime + rollDuration);
      mainRollGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + rollDuration + 0.1);
      mainRollGain.connect(ctx.destination);

      // Function to synthesize a single snare hit at a specific time
      const playSnareHit = (time: number, velocity: number) => {
        // 1. Snare drum head tone (pitch decay sweep)
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, time);
        osc.frequency.exponentialRampToValueAtTime(100, time + 0.08);

        oscGain.gain.setValueAtTime(velocity * 0.15, time);
        oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

        osc.connect(oscGain);
        oscGain.connect(mainRollGain);
        osc.start(time);
        osc.stop(time + 0.09);

        // 2. Snare wires (noise burst with bandpass/highpass filter)
        const bufferSize = ctx.sampleRate * 0.1; // 100ms noise burst
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = buffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(1000, time);
        noiseFilter.Q.setValueAtTime(1.5, time);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(velocity * 0.22, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

        noiseNode.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(mainRollGain);

        noiseNode.start(time);
        noiseNode.stop(time + 0.11);
      };

      // Schedule all individual hits with slight randomized velocity/timing jitter for realism
      for (let i = 0; i < totalHits; i++) {
        const targetTime = ctx.currentTime + i * hitInterval;
        // Increase speed slightly or introduce slight timing deviation
        const jitter = (Math.random() - 0.5) * 0.008;
        const scheduledTime = targetTime + jitter;

        // Exponential volume swell for each stroke
        const progress = i / totalHits;
        const baseVelocity = Math.pow(progress, 1.8) * 0.9 + 0.1;
        // Add accent patterns (every 2nd beat is slightly softer for natural hand alternates)
        const accent = (i % 2 === 0) ? 1.0 : 0.75;
        const velocity = baseVelocity * accent * (0.9 + Math.random() * 0.2);

        playSnareHit(scheduledTime, Math.min(1.0, velocity));
      }

      // 3. Add a deep rolling timpani/tom bass rumble underneath to give that heavy theater curtain feel
      const timpani = ctx.createOscillator();
      const timpaniGain = ctx.createGain();
      timpani.type = 'sine';
      timpani.frequency.setValueAtTime(55, ctx.currentTime);
      timpani.frequency.linearRampToValueAtTime(75, ctx.currentTime + rollDuration);

      timpaniGain.gain.setValueAtTime(0.01, ctx.currentTime);
      timpaniGain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + rollDuration - 0.2);
      timpaniGain.gain.setValueAtTime(0.35, ctx.currentTime + rollDuration);
      timpaniGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + rollDuration + 0.2);

      // Lowpass filter to keep it deep and rumbling
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(120, ctx.currentTime);

      timpani.connect(lowpass);
      lowpass.connect(timpaniGain);
      timpaniGain.connect(ctx.destination);

      timpani.start();
      timpani.stop(ctx.currentTime + rollDuration + 0.3);

      // 4. CYMBAL CRASH at climax
      const crashDelay = rollDuration;
      
      // Noise buffer for cymbal crash
      const crashBufferSize = ctx.sampleRate * 3.5; // 3.5 seconds decay
      const crashBuffer = ctx.createBuffer(1, crashBufferSize, ctx.sampleRate);
      const crashData = crashBuffer.getChannelData(0);
      for (let i = 0; i < crashBufferSize; i++) {
        crashData[i] = Math.random() * 2 - 1;
      }

      const crashNoise = ctx.createBufferSource();
      crashNoise.buffer = crashBuffer;

      const crashHighpass = ctx.createBiquadFilter();
      crashHighpass.type = 'highpass';
      crashHighpass.frequency.setValueAtTime(8000, ctx.currentTime + crashDelay);

      const crashGain = ctx.createGain();
      crashGain.gain.setValueAtTime(0.001, ctx.currentTime);
      crashGain.gain.setValueAtTime(0.001, ctx.currentTime + crashDelay);
      // Instant loud attack at 4.3s
      crashGain.gain.linearRampToValueAtTime(0.55, ctx.currentTime + crashDelay + 0.02);
      // Long elegant exponential decay
      crashGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + crashDelay + 3.2);

      crashNoise.connect(crashHighpass);
      crashHighpass.connect(crashGain);
      crashGain.connect(ctx.destination);

      // Add a bright chime/bell tone to complement the cymbal crash
      const chime = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(987.77, ctx.currentTime + crashDelay); // B5 note for brilliant resonance
      
      chimeGain.gain.setValueAtTime(0.001, ctx.currentTime);
      chimeGain.gain.setValueAtTime(0.001, ctx.currentTime + crashDelay);
      chimeGain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + crashDelay + 0.02);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + crashDelay + 2.0);

      chime.connect(chimeGain);
      chimeGain.connect(ctx.destination);

      crashNoise.start(ctx.currentTime + crashDelay);
      chime.start(ctx.currentTime + crashDelay);

      crashNoise.stop(ctx.currentTime + crashDelay + 3.6);
      chime.stop(ctx.currentTime + crashDelay + 3.6);

    } catch (error) {
      console.warn('[WebAudio] Proper drumroll synthesis failed:', error);
    }
  };

  const handleUnveil = () => {
    setIsDrawn(true);
    // Play dramatic synthesized drum roll leading into a crash
    playDrumRollAndCymbal();

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
                    onClick={triggerConfettiCelebration}
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
