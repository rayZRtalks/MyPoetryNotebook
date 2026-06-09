import React, { useState, useEffect } from 'react';
import { Poem, Category } from '../types';
import { X, Copy, Check, Edit3, Calendar, Tag, BookOpen, Play, Pause, Square, Volume2 } from 'lucide-react';

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

  useEffect(() => {
    // Automatically stop speech when reader is closed / unmounted
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
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
                <option value="0.7">0.8x</option>
                  <option value="0.8">1.0x</option>
              
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
