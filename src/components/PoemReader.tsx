import React, { useState, useEffect, useRef } from 'react';
import { Poem, Category } from '../types';
import { X, Copy, Check, Edit3, Calendar, Tag, BookOpen, Play, Pause, Square, Volume2, Sparkles, Type, Sliders, Music, VolumeX, Eye } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

function ZenParticles({ mood }: { mood: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.offsetWidth || canvas.offsetWidth || 800);
    let height = (canvas.height = canvas.parentElement?.offsetHeight || canvas.offsetHeight || 600);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.offsetWidth || canvas.offsetWidth || 800;
      height = canvas.height = canvas.parentElement?.offsetHeight || canvas.offsetHeight || 600;
    };
    window.addEventListener('resize', handleResize);

    const particles: Array<{ x: number; y: number; size: number; speedY: number; speedX: number; alpha: number }> = [];
    const particleCount = mood === 'Romantic' || mood === 'Mystical' ? 60 : 40;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.2 + 0.4,
        speedY: -(Math.random() * 0.35 + 0.08),
        speedX: (Math.random() * 0.2 - 0.1),
        alpha: Math.random() * 0.65 + 0.1
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      const grad = ctx.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, Math.max(width, height) * 0.8);
      if (mood === 'Romantic') {
        grad.addColorStop(0, 'rgba(157, 23, 77, 0.12)'); 
      } else if (mood === 'Mystical') {
        grad.addColorStop(0, 'rgba(88, 28, 135, 0.14)'); 
      } else if (mood === 'Hopeful') {
        grad.addColorStop(0, 'rgba(16, 185, 129, 0.08)'); 
      } else if (mood === 'Melancholy') {
        grad.addColorStop(0, 'rgba(30, 58, 138, 0.12)'); 
      } else {
        grad.addColorStop(0, 'rgba(6, 182, 212, 0.08)'); 
      }
      grad.addColorStop(1, 'rgba(7, 8, 13, 0.85)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = mood === 'Romantic' ? `rgba(244, 63, 94, ${p.alpha})` : mood === 'Mystical' ? `rgba(192, 132, 252, ${p.alpha})` : `rgba(165, 243, 252, ${p.alpha})`;
        ctx.fill();

        p.y += p.speedY;
        p.x += p.speedX;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10 || p.x > width + 10) {
          p.x = Math.random() * width;
        }
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mood]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-70" />;
}

interface PoemReaderProps {
  poem: Poem;
  categories: Category[];
  onClose: () => void;
  onEdit: (poem: Poem) => void;
  isEditable?: boolean;
  onSelectMedia?: (poem: Poem) => void;
}

export default function PoemReader({
  poem,
  categories,
  onClose,
  onEdit,
  isEditable = true,
  onSelectMedia,
}: PoemReaderProps) {
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voiceRate, setVoiceRate] = useState(0.8);
  const category = categories.find((c) => c.id === poem.categoryId);

  // Reader Zen Mode state variables (WOW factors)
  const [isZenMode, setIsZenMode] = useState(false);
  const [zenFontSize, setZenFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('lg');
  const [zenFontFamily, setZenFontFamily] = useState<'serif' | 'sans' | 'mono'>('serif');
  const [activeSoundscape, setActiveSoundscape] = useState<'off' | 'drone' | 'rain' | 'chimes'>('off');

  const handleToggleSoundscape = (type: 'off' | 'drone' | 'rain' | 'chimes') => {
    setActiveSoundscape(type);
    try {
      audioEngine.stopAllSoundscapes();
      if (type === 'drone') {
        audioEngine.startBinauralDrone();
      } else if (type === 'rain') {
        audioEngine.startSummerRain();
      } else if (type === 'chimes') {
        audioEngine.startForestChimes();
      }
    } catch (err) {
      console.warn('Failed soundscape switch:', err);
    }
  };

  const fontSizes = {
    sm: 'text-sm md:text-md leading-relaxed',
    md: 'text-md md:text-lg leading-loose',
    lg: 'text-lg md:text-xl leading-10',
    xl: 'text-xl md:text-2xl leading-11',
  };

  const fontFamilies = {
    serif: 'font-serif',
    sans: 'font-sans',
    mono: 'font-mono tracking-tight',
  };

  useEffect(() => {
    // Automatically stop speech and ambient soundscapes when reader is closed / unmounted
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      try {
        audioEngine.stopAllSoundscapes();
      } catch (err) {
        console.warn('Failed stopping soundscapes:', err);
      }
    };
  }, []);

  const handleCopy = async () => {
    const textToCopy = `${poem.title}\nby ${poem.author || 'Anonymous'}\n\n${poem.body}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy poem: ', err);
    }
  };

  const handleSpeakToggle = () => {
    if (!('speechSynthesis' in window)) {
      alert("Speech synthesis is not supported on this browser.");
      return;
    }

    if (isPlaying) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    } else {
      window.speechSynthesis.cancel(); // Clear any pre-existing text in queue

      // Structure text to read slowly and elegantly
      const readText = `Reciting entry. Title: ${poem.title}. By ${poem.author || 'Anonymous'}. \n\n ${poem.body}`;
      const utterance = new SpeechSynthesisUtterance(readText);
      utterance.rate = voiceRate;

      // Try to load any warm, consistent Indian English male voices
      const voices = window.speechSynthesis.getVoices();
      
      // Filter voices that are en-IN (English India)
      const indianVoices = voices.filter(v => 
        v.lang.toLowerCase().replace('_', '-').includes('en-in')
      );

      // Match any en-IN that features 'male', 'rishi', 'ravi', or 'mohan'
      let selectedVoice = indianVoices.find(v => 
        v.name.toLowerCase().includes('male') || 
        v.name.toLowerCase().includes('rishi') || 
        v.name.toLowerCase().includes('ravi') || 
        v.name.toLowerCase().includes('mohan')
      );

      // If we don't have an explicit male Indian voice, grab the standard Indian English voice (such as Google English (India))
      if (!selectedVoice && indianVoices.length > 0) {
        selectedVoice = indianVoices.find(v => v.name.toLowerCase().includes('google')) || indianVoices[0];
      }

      // If no en-IN voices exist on the system (e.g. some mobile browsers), fallback to a high-quality warm English male/natural voice
      if (!selectedVoice) {
        selectedVoice = voices.find(v => 
          v.lang.toLowerCase().replace('_', '-').startsWith('en-') && 
          (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('natural'))
        ) || voices.find(v => v.lang.toLowerCase().startsWith('en'));
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };

      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
      setIsPaused(false);
    }
  };

  const handleStopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  const formattedDate = new Date(poem.createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Render Zen Reader full screen mode override if activated
  if (isZenMode) {
    return (
      <div className="fixed inset-0 bg-[#07080d] z-50 flex flex-col justify-between overflow-hidden text-neutral-100 select-none animate-fade-in">
        {/* Particle Canvas background rendering */}
        <ZenParticles mood={poem.mood || 'Reflective'} />

        {/* Floating Controls Bar */}
        <div className="relative z-10 px-6 py-4 md:px-12 border-b border-white/5 bg-black/45 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            <div>
              <span className="text-[10px] font-bold font-mono text-amber-500 uppercase tracking-widest block">
                IMMERSIVE READER FLOW
              </span>
              <h2 className="text-sm font-sans font-black tracking-wide uppercase text-white">
                {poem.title}
              </h2>
            </div>
          </div>

          {/* Controls Hub */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {/* Font Selector */}
            <div className="flex items-center bg-black/50 rounded-full border border-white/10 p-1 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setZenFontFamily('serif')}
                className={`px-2 py-1 rounded-full cursor-pointer transition-all ${zenFontFamily === 'serif' ? 'bg-amber-500 text-neutral-950 font-extrabold' : 'text-neutral-400'}`}
              >
                Serif
              </button>
              <button
                type="button"
                onClick={() => setZenFontFamily('sans')}
                className={`px-2 py-1 rounded-full cursor-pointer transition-all ${zenFontFamily === 'sans' ? 'bg-amber-500 text-neutral-950 font-extrabold' : 'text-neutral-400'}`}
              >
                Sans
              </button>
              <button
                type="button"
                onClick={() => setZenFontFamily('mono')}
                className={`px-2 py-1 rounded-full cursor-pointer transition-all ${zenFontFamily === 'mono' ? 'bg-amber-500 text-neutral-950 font-extrabold' : 'text-neutral-400'}`}
              >
                Mono
              </button>
            </div>

            {/* Font Size Selector */}
            <div className="flex items-center bg-black/50 rounded-full border border-white/10 p-1 text-[10px] font-mono">
              {(['sm', 'md', 'lg', 'xl'] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setZenFontSize(sz)}
                  className={`w-6 h-6 rounded-full cursor-pointer flex items-center justify-center transition-all uppercase ${zenFontSize === sz ? 'bg-amber-500 text-neutral-950 font-extrabold' : 'text-neutral-400 hover:text-white'}`}
                >
                  {sz}
                </button>
              ))}
            </div>

            {/* Ambient Soundscapes Selector */}
            <div className="flex items-center bg-black/50 rounded-full border border-white/10 p-1 text-[10px] font-mono gap-1.5">
              <span className="text-neutral-500 pl-2 text-[9px] font-bold uppercase">SOUNDS:</span>
              <button
                type="button"
                onClick={() => handleToggleSoundscape('off')}
                className={`px-2 py-1 rounded-full cursor-pointer flex items-center gap-1 transition-all ${activeSoundscape === 'off' ? 'bg-amber-500 text-neutral-950 font-extrabold' : 'text-neutral-400 hover:text-white'}`}
                title="Silence / Off"
              >
                <VolumeX className="w-3 h-3" />
                <span>OFF</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleSoundscape('drone')}
                className={`px-2 py-1 rounded-full cursor-pointer flex items-center gap-1 transition-all ${activeSoundscape === 'drone' ? 'bg-amber-500 text-neutral-950 font-extrabold' : 'text-neutral-400 hover:text-white'}`}
                title="Cosmic Binaural Drone"
              >
                <Music className="w-3 h-3" />
                <span>COSMIC</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleSoundscape('rain')}
                className={`px-2 py-1 rounded-full cursor-pointer flex items-center gap-1 transition-all ${activeSoundscape === 'rain' ? 'bg-amber-500 text-neutral-950 font-extrabold' : 'text-neutral-400 hover:text-white'}`}
                title="Summer Rainfall and pink noise"
              >
                <Music className="w-3 h-3" />
                <span>RAIN</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleSoundscape('chimes')}
                className={`px-2 py-1 rounded-full cursor-pointer flex items-center gap-1 transition-all ${activeSoundscape === 'chimes' ? 'bg-amber-500 text-neutral-950 font-extrabold' : 'text-neutral-400 hover:text-white'}`}
                title="Sankofa Canopy and Chimes"
              >
                <Music className="w-3 h-3" />
                <span>CHIMES</span>
              </button>
            </div>

            {/* Return / Back Button */}
            <button
              type="button"
              onClick={() => {
                setIsZenMode(false);
                handleToggleSoundscape('off');
              }}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-full font-mono text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-md transition-transform active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
              <span>Exit Zen</span>
            </button>
          </div>
        </div>

        {/* Central Display Gaze block */}
        <div className="flex-1 relative z-10 overflow-y-auto px-6 py-12 md:px-24 flex flex-col items-center justify-start text-center">
          <div className="max-w-3xl w-full space-y-12 py-10">
            {/* Header typography detail */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono font-bold tracking-widest text-amber-500/80 uppercase">
                ✦ {category?.name || 'GENRE UNSPECIFIED'} ✦
              </span>
              <h1 className="text-3xl md:text-5xl font-serif text-white tracking-tight leading-tight font-extrabold">
                {poem.title}
              </h1>
              <p className="text-xs md:text-sm font-sans font-semibold text-neutral-400 tracking-wider">
                — inscribed by {poem.author || 'Anonymous'} —
              </p>
            </div>

            <div className="w-16 h-[2px] bg-amber-500/30 mx-auto" />

            {/* Big readable text body */}
            <div className={`text-center flex justify-center py-6`}>
              <div
                className={`${fontFamilies[zenFontFamily]} ${fontSizes[zenFontSize]} text-neutral-100 whitespace-pre-wrap max-w-full text-center tracking-normal leading-loose italic`}
              >
                {poem.body}
              </div>
            </div>

            <div className="w-16 h-[2px] bg-amber-500/30 mx-auto" />

            {/* Recital controller block in Zen Gaze */}
            <div className="p-5 bg-black/45 border border-white/5 rounded-3xl max-w-md mx-auto space-y-3 shadow-lg">
              <p className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest font-bold">
                ✨ Oral Recital Engine
              </p>
              <div className="flex items-center justify-center gap-3">
                {isPlaying ? (
                  <button
                    type="button"
                    onClick={handleSpeakToggle}
                    className="w-9 h-9 rounded-full bg-cyan-500 hover:bg-cyan-400 text-neutral-950 flex items-center justify-center cursor-pointer shadow-md transition-all active:scale-95"
                    title={isPaused ? "Resume Reading Recital" : "Pause Recital"}
                  >
                    {isPaused ? <Play className="w-4 h-4 fill-neutral-950" /> : <Pause className="w-4 h-4 fill-neutral-950" />}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSpeakToggle}
                    className="w-9 h-9 rounded-full bg-amber-500 hover:bg-amber-400 text-neutral-950 flex items-center justify-center cursor-pointer shadow-md transition-all active:scale-95"
                    title="Begin Recital Speech Synthesis"
                  >
                    <Play className="w-4 h-4 fill-neutral-950" />
                  </button>
                )}
                {isPlaying && (
                  <button
                    type="button"
                    onClick={handleStopSpeech}
                    className="w-9 h-9 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center cursor-pointer shadow-md transition-all active:scale-95"
                    title="Stop Speech recital"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer info bar */}
        <div className="relative z-10 px-6 py-4 border-t border-white/5 bg-black/25 text-[10px] font-mono text-neutral-500 flex justify-between items-center">
          <span>ATMOSPHERE: {poem.mood || 'Standard'}</span>
          <span>WRITING INSCRIPTION FOR THE SPIRIT</span>
          <span>DATE: {formattedDate}</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      id="poem-reader-modal" 
      className={`space-y-6 text-neutral-200 ${!isEditable ? 'select-none' : ''}`}
      onCopy={(e) => {
        if (!isEditable) {
          e.preventDefault();
        }
      }}
    >
      {/* Header and top buttons */}
      <div className="flex items-center justify-between border-b pb-4 border-neutral-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <span id="reader-heading" className="text-xs uppercase font-extrabold text-neutral-400 tracking-widest font-mono">
            Reading Vault
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Zen Reader Button */}
          <button
            id="btn-zen-reader-toggle"
            onClick={() => {
              setIsZenMode(true);
              // Warm up Web Audio context
              audioEngine.getContext();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs text-amber-300 hover:bg-amber-950/40 hover:text-amber-200 bg-neutral-900 rounded-full border border-amber-900/40 transition-all font-bold cursor-pointer font-sans"
            title="Switch to Immersive Zen Mode with particle effects and sounds"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Immersive Zen</span>
          </button>

          {/* Copy Button */}
          {isEditable && (
            <button
              id="btn-copy-poem"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs text-neutral-200 hover:bg-neutral-800 hover:text-white bg-neutral-900 rounded-full border border-neutral-800 transition-all font-semibold cursor-pointer font-sans"
              title="Copy entry details to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Copy Text</span>
                </>
              )}
            </button>
          )}

          {/* Edit Button */}
          {isEditable && (
            <button
              id="btn-edit-from-reader"
              onClick={() => {
                onEdit(poem);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs text-neutral-200 hover:bg-neutral-800 hover:text-white bg-neutral-900 rounded-full border border-neutral-800 transition-all font-semibold cursor-pointer font-sans"
            >
              <Edit3 className="w-3.5 h-3.5 text-neutral-400" />
              <span>Edit</span>
            </button>
          )}

          {/* Close Modal button */}
          <button
            id="btn-close-reader"
            onClick={onClose}
            className="text-neutral-400 hover:text-white rounded-full p-1.5 hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Styled Poem Parchment */}
      <div 
        id="poem-parchment"
        className={`bg-[#14151f] border border-neutral-800 shadow-inner p-8 sm:p-12 rounded-2xl max-h-[60vh] overflow-y-auto ${!isEditable ? 'select-none' : ''}`}
        onContextMenu={(e) => {
          if (!isEditable) e.preventDefault();
        }}
      >
        <div className="text-center space-y-4 max-w-xl mx-auto">
          {/* Category Pill centered */}
          <div>
            <span
              id="reader-cat"
              className="inline-block px-3 py-1 rounded-full text-[10px] font-bold border tracking-wider uppercase bg-cyan-950/40 text-cyan-400 border-cyan-800/40 font-mono"
            >
              {category?.name || 'Uncategorized'}
            </span>
          </div>

          {/* Title */}
          <h2 id="reader-title" className="text-2xl sm:text-3xl font-display font-black tracking-tight leading-snug text-white">
            {poem.title}
          </h2>

          {/* Author/Poet line */}
          <p id="reader-author" className="text-xs font-mono text-neutral-400 tracking-tight uppercase">
            composed by <span className="font-semibold text-neutral-200 underline decoration-cyan-500/40 decoration-2 underline-offset-4">{poem.author || 'Anonymous'}</span>
          </p>

          {/* Vocal Recital Controller widget */}
          {poem.body && poem.body.trim() && (
            <div id="vocal-recital-panel" className="max-w-xs mx-auto mt-4 px-4 py-2.5 bg-[#0e0f18] border border-neutral-800/80 rounded-xl flex items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-2">
                <button
                  id="vocal-play-btn"
                  onClick={handleSpeakToggle}
                  className="p-2 bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-neutral-950 rounded-full transition-all cursor-pointer flex items-center justify-center shadow-lg shadow-cyan-500/20"
                  title={isPlaying ? (isPaused ? "Resume Recital" : "Pause Recital") : "Start Recital Voice Over"}
                >
                  {isPlaying && !isPaused ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </button>
                {isPlaying && (
                  <button
                    id="vocal-stop-btn"
                    onClick={handleStopSpeech}
                    className="p-2 bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-red-400 rounded-full border border-neutral-800 transition-all cursor-pointer flex items-center justify-center"
                    title="Stop Voice Over"
                  >
                    <Square className="w-3.5 h-3.5 fill-neutral-400" />
                  </button>
                )}
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold font-mono tracking-wider text-neutral-500 uppercase">
                    Vocal Recital
                  </span>
                  <span className="text-[10px] font-sans font-semibold text-neutral-350">
                    {isPlaying ? (isPaused ? "Paused" : "Speaking...") : "Listen to entry"}
                  </span>
                </div>
              </div>

              {/* Equalizer & voice velocity panel */}
              <div className="flex items-center gap-2">
                {isPlaying && !isPaused && (
                  <div className="flex items-end gap-[2.5px] h-3.5 px-1">
                    <span className="w-[3px] h-3 bg-cyan-400 rounded-full animate-bounce [animation-duration:0.6s]" />
                    <span className="w-[3px] h-4 bg-indigo-400 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.1s]" />
                    <span className="w-[3px] h-2 bg-fuchsia-400 rounded-full animate-bounce [animation-duration:0.7s] [animation-delay:0.2s]" />
                  </div>
                )}
                
                {/* Rate Selector Button */}
                <select
                  id="vocal-rate-select"
                  value={voiceRate}
                  onChange={(e) => {
                    const rate = parseFloat(e.target.value);
                    setVoiceRate(rate);
                    // If speaking, restart with new rate
                    if (isPlaying) {
                      window.speechSynthesis.cancel();
                      setIsPlaying(false);
                      setIsPaused(false);
                      setTimeout(() => {
                        handleSpeakToggle();
                      }, 100);
                    }
                  }}
                  className="bg-neutral-950 border border-neutral-800 text-[10px] font-mono font-bold text-neutral-450 p-1.5 rounded-md cursor-pointer outline-none focus:border-cyan-500/40"
                  title="Recital pacing speed"
                >
                <option value="0.5">0.6x</option>
                <option value="0.6">0.8x</option>
                <option value="0.7">1.0x</option>
                
              
                </select>
              </div>
            </div>
          )}

          {poem.body && poem.body.trim() && (
            <>
              <div className="w-12 h-[1px] bg-neutral-800 mx-auto my-6" />

              {/* Body Block */}
              <div 
                id="reader-body"
                className="font-serif text-[15.5px] sm:text-lg text-neutral-100 leading-9 whitespace-pre-wrap text-left inline-block pl-4 sm:pl-8 border-l-2 border-cyan-500/50 max-w-full"
              >
                {poem.body}
              </div>
            </>
          )}

          {/* Direct Media Presentation (Directly integrated on parchment) */}
          {poem.attachments && poem.attachments.length > 0 && (
            <div id="reader-media-gallery" className="mt-10 text-left space-y-6 max-w-xl mx-auto border-t border-neutral-800 pt-8">
              {poem.attachments.map((attach) => (
                <div
                  id={`reader-attach-card-${attach.id}`}
                  key={attach.id}
                  className="border border-neutral-800 rounded-2xl overflow-hidden bg-neutral-950/80 shadow-md relative group/media flex flex-col"
                >
                  <div 
                    onClick={() => {
                      if (onSelectMedia) {
                        onSelectMedia(poem);
                      }
                    }}
                    className="p-3 flex justify-center items-center cursor-pointer transition-all duration-300 hover:bg-neutral-900/40"
                    title="Click to view full screen"
                  >
                    {attach.type === 'image' ? (
                      <img
                        src={attach.url}
                        alt={attach.name}
                        className="max-h-[300px] object-contain rounded-xl border border-neutral-850 bg-[#14151f] w-full transition-transform duration-300 group-hover/media:scale-102"
                        referrerPolicy="no-referrer"
                        onContextMenu={(e) => {
                          if (!isEditable) e.preventDefault();
                        }}
                        onDragStart={(e) => {
                          if (!isEditable) e.preventDefault();
                        }}
                      />
                    ) : (
                      <video
                        src={attach.url}
                        className="max-h-[300px] rounded-xl border border-neutral-850 w-full bg-neutral-900 transition-transform duration-300 group-hover/media:scale-102"
                        muted
                        loop
                        autoPlay
                        playsInline
                        controlsList={!isEditable ? "nodownload nofullscreen noremoteplayback" : undefined}
                        onContextMenu={(e) => {
                          if (!isEditable) e.preventDefault();
                        }}
                      />
                    )}
                  </div>
                  {/* Subtle info tag inside the reader container */}
                  <div className="absolute left-4 bottom-4 px-2.5 py-1 bg-black/90 text-neutral-400 border border-neutral-800 rounded-full text-[9px] font-bold uppercase tracking-widest font-mono shadow-md">
                    {attach.type === 'image' ? '✦ Verse Illustration' : '✦ Video Reading'}
                  </div>
                  <div className="absolute right-4 bottom-4 px-2.5 py-1 bg-black/90 text-cyan-400 border border-cyan-900/50 rounded-full text-[9px] font-extrabold uppercase tracking-widest font-mono shadow-md opacity-0 group-hover/media:opacity-100 transition-opacity duration-300 flex items-center gap-1 pointer-events-none">
                    <span>⛶ ENLARGE</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Details & tags bottom */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t pt-4 border-neutral-850 mt-4">
        {/* Date line */}
        <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
          <Calendar className="w-4 h-4 text-neutral-500" />
          <span>Catalogued on {formattedDate}</span>
        </div>

        {/* Tags */}
        {poem.tags && poem.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1 mr-1 font-mono">
              <Tag className="w-3 h-3 text-neutral-500" /> Motifs:
            </span>
            {poem.tags.map((tag, idx) => (
              <span
                id={`reader-tag-pill-${idx}`}
                key={idx}
                className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-cyan-300 font-mono font-medium text-[11px] px-3 py-1 rounded-full transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
