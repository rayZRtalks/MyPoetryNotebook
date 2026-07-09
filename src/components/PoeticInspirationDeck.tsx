import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, HelpCircle, RotateCcw, X, Feather, Quote, ExternalLink, BookOpen, PenTool } from 'lucide-react';
import { Poem } from '../types';

interface PoeticInspirationDeckProps {
  poems: Poem[];
  appTheme: 'dark' | 'light' | 'sankofa' | 'momoamo' | 'madrid';
  onReadPoem: (poem: Poem) => void;
  isAuthorMode?: boolean;
}

interface InspirationCard {
  id: string;
  excerpt: string;
  sourcePoem: Poem | null;
  creativePrompt: string;
  themeColor: string;
  cardDesign: string;
}

const STATIC_FALLBACKS = [
  { text: "We are all writing in the margins of a story already begun.", prompt: "Write about something hidden in plain sight." },
  { text: "The moon is a typewriter, clicking stars onto the velvet page.", prompt: "Describe the quietest hour of your last night." },
  { text: "Ink runs thicker than blood when the soul begins to bleed.", prompt: "Capture a conversation you never had but wish you did." },
  { text: "Rhythms are just heartbeats slowing down to find their name.", prompt: "Focus on a sound that repeats, and write its rhythm." },
  { text: "Unspoken words turn into dust motes dancing in the morning light.", prompt: "Begin your next poem with: 'If the dust could whisper...'" },
  { text: "Every breath is a silent syllable of a larger, unread verse.", prompt: "Write a poem without using any color words." }
];

const CARD_STYLES = [
  { bg: 'from-amber-500/20 via-amber-700/10 to-amber-950/40', text: 'text-amber-300', border: 'border-amber-500/30' },
  { bg: 'from-cyan-500/20 via-indigo-600/10 to-indigo-950/40', text: 'text-cyan-300', border: 'border-cyan-500/30' },
  { bg: 'from-rose-500/20 via-purple-600/10 to-purple-950/40', text: 'text-rose-300', border: 'border-rose-500/30' },
  { bg: 'from-emerald-500/20 via-teal-600/10 to-teal-950/40', text: 'text-emerald-300', border: 'border-emerald-500/30' }
];

export default function PoeticInspirationDeck({
  poems,
  appTheme,
  onReadPoem,
  isAuthorMode = false,
}: PoeticInspirationDeckProps) {
  const [deckMode, setDeckMode] = useState<'reader' | 'writer'>('reader');
  const [activeCard, setActiveCard] = useState<InspirationCard | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [dealsCount, setDealsCount] = useState(0);

  // Generate a randomized inspiration card drawing from actual poems
  const drawCard = () => {
    setIsFlipped(false);
    
    // Choose excerpt from actual poems if possible
    let excerptText = "";
    let source: Poem | null = null;
    
    const textPoems = poems.filter(p => !p.isPhotoCapture && p.body && p.body.trim().length > 10);
    
    if (textPoems.length > 0 && Math.random() > 0.3) {
      // Pick random poem
      const randPoem = textPoems[Math.floor(Math.random() * textPoems.length)];
      source = randPoem;
      const stanzas = randPoem.body.split('\n').filter(s => s.trim().length > 15);
      if (stanzas.length > 0) {
        excerptText = stanzas[Math.floor(Math.random() * stanzas.length)].trim();
      } else {
        excerptText = randPoem.body.substring(0, 100).trim() + "...";
      }
    } else {
      // Use fallback
      const randomFallback = STATIC_FALLBACKS[Math.floor(Math.random() * STATIC_FALLBACKS.length)];
      excerptText = randomFallback.text;
    }

    // Clean any trailing symbols
    excerptText = excerptText.replace(/^[“"']|[”"']$/g, '');

    // Get a creative writing prompt
    const creativePrompt = STATIC_FALLBACKS[Math.floor(Math.random() * STATIC_FALLBACKS.length)].prompt;
    
    const designStyle = CARD_STYLES[dealsCount % CARD_STYLES.length];

    setTimeout(() => {
      setActiveCard({
        id: `card-${Date.now()}`,
        excerpt: excerptText,
        sourcePoem: source,
        creativePrompt,
        themeColor: designStyle.text,
        cardDesign: `${designStyle.bg} ${designStyle.border}`
      });
      setDealsCount(prev => prev + 1);
    }, 150);
  };

  const currentModalStyles = useMemo(() => {
    switch (appTheme) {
      case 'light':
        return {
          bg: 'bg-[#faf6f0] border-[#e2d9cf] text-[#2e2a27]',
          accentText: 'text-[#c97f65]',
          buttonBg: 'bg-[#2e2a27] text-white hover:bg-[#3d3834]',
          cardBack: 'bg-gradient-to-br from-[#c97f65]/5 to-[#738a7c]/10 border-[#e2d9cf] text-[#2e2a27]',
          cardFront: 'bg-white border-[#e2d9cf] shadow-xl text-[#2e2a27]'
        };
      case 'sankofa':
        return {
          bg: 'bg-[#fffdf9] border-[#bf3f27]/30 text-[#3a1a14]',
          accentText: 'text-[#bf3f27]',
          buttonBg: 'bg-[#bf3f27] text-white hover:bg-[#bf3f27]/90',
          cardBack: 'bg-gradient-to-br from-[#f3cc3c]/15 to-[#bf3f27]/10 border-[#bf3f27]/30 text-[#3a1a14]',
          cardFront: 'bg-white border-[#bf3f27]/35 shadow-xl text-[#3a1a14]'
        };
      case 'momoamo':
        return {
          bg: 'bg-[#142217] border-[#FAF6F0]/15 text-[#FAF6F0]',
          accentText: 'text-[#E1FE35]',
          buttonBg: 'bg-[#E1FE35] text-neutral-950 hover:bg-[#E1FE35]/90',
          cardBack: 'bg-gradient-to-br from-[#E1FE35]/10 to-[#FAF6F0]/5 border-[#E1FE35]/25 text-[#FAF6F0]',
          cardFront: 'bg-[#182a1d] border-[#FAF6F0]/20 shadow-xl text-[#FAF6F0]'
        };
      case 'madrid':
        return {
          bg: 'bg-[#0E0E15] border-white/10 text-white',
          accentText: 'text-[#FDA172]',
          buttonBg: 'bg-[#FDA172] text-black hover:bg-[#FDA172]/95',
          cardBack: 'bg-gradient-to-br from-[#FDA172]/15 to-[#0E0E15]/30 border-[#FDA172]/30 text-white',
          cardFront: 'bg-[#12121c] border-white/10 shadow-2xl text-white'
        };
      default:
        return {
          bg: 'bg-[#0c0d14] border-neutral-850 text-neutral-200',
          accentText: 'text-cyan-400',
          buttonBg: 'bg-cyan-500 text-neutral-950 hover:bg-cyan-400',
          cardBack: 'bg-gradient-to-br from-cyan-950/15 to-indigo-950/20 border-cyan-500/20 text-neutral-200',
          cardFront: 'bg-[#111218] border-neutral-800 shadow-2xl text-neutral-200'
        };
    }
  }, [appTheme]);

  return (
    <div className={`p-6 md:p-8 rounded-3xl border shadow-xl ${currentModalStyles.bg} flex flex-col md:flex-row gap-8 items-center`}>
      {/* Deck Sidebar Settings */}
      <div className="w-full md:w-2/5 space-y-4 text-center md:text-left">
        <div className="flex items-center gap-2 justify-center md:justify-start">
          <Sparkles className={`w-5 h-5 ${currentModalStyles.accentText} animate-pulse`} />
          <h3 className="text-lg font-sans font-extrabold uppercase tracking-wider font-display">
            Inspirations Deck
          </h3>
        </div>
        <p className="text-xs text-neutral-400 leading-relaxed font-sans max-w-sm mx-auto md:mx-0">
          Draw a card from the vault to unveil sparks of wisdom or unleash raw writer guidance. An interactive card tarot derived dynamically from your verses.
        </p>

        {/* Tab switcher: Reader vs Writer */}
        <div className="inline-flex p-1 bg-black/40 border border-white/5 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider select-none">
          <button
            onClick={() => { setDeckMode('reader'); setActiveCard(null); setIsFlipped(false); }}
            className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1 cursor-pointer ${
              deckMode === 'reader' ? 'bg-white/15 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3 h-3" />
            <span>Reader Spark</span>
          </button>
          <button
            onClick={() => { setDeckMode('writer'); setActiveCard(null); setIsFlipped(false); }}
            className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1 cursor-pointer ${
              deckMode === 'writer' ? 'bg-white/15 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <PenTool className="w-3 h-3" />
            <span>Writer Prompt</span>
          </button>
        </div>

        <div className="pt-2">
          <button
            onClick={drawCard}
            className={`w-full md:w-auto px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-widest font-mono shadow-md transition-all active:scale-95 cursor-pointer ${currentModalStyles.buttonBg}`}
          >
            {activeCard ? 'Draw Another Card' : 'Draw a Card'}
          </button>
        </div>
      </div>

      {/* Interactive Card Stage */}
      <div className="flex-1 w-full flex justify-center items-center min-h-[320px] relative overflow-hidden bg-black/10 rounded-2xl border border-white/5 p-4">
        <AnimatePresence mode="wait">
          {!activeCard ? (
            <motion.div
              key="deck-idle"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center text-center space-y-4"
            >
              {/* Stacked cards display */}
              <div className="relative w-36 h-52 flex justify-center items-center">
                <div className={`absolute w-36 h-52 rounded-2xl border rotate-6 translate-x-2 translate-y-1 shadow-md opacity-40 ${currentModalStyles.cardBack}`} />
                <div className={`absolute w-36 h-52 rounded-2xl border -rotate-3 -translate-x-1 -translate-y-1 shadow-lg opacity-60 ${currentModalStyles.cardBack}`} />
                <div className={`absolute w-36 h-52 rounded-2xl border shadow-xl flex flex-col justify-between p-4 cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 ${currentModalStyles.cardBack}`} onClick={drawCard}>
                  <div className="border border-white/10 rounded-lg p-1.5 w-max">
                    <Feather className="w-4 h-4 opacity-40" />
                  </div>
                  <div className="text-center">
                    <span className="text-[9px] uppercase font-mono tracking-widest opacity-35 font-bold">rayZRtalks</span>
                  </div>
                  <div className="flex justify-end">
                    <Sparkles className="w-4 h-4 opacity-40 animate-pulse" />
                  </div>
                </div>
              </div>
              <p className="text-[10px] font-bold font-mono tracking-wider text-neutral-500 uppercase">
                Click the deck to draw an inspiration card
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={activeCard.id}
              initial={{ opacity: 0, y: 50, rotateX: -15 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, y: -50, rotateX: 15 }}
              transition={{ type: 'spring', damping: 20 }}
              className="relative w-72 h-[280px] perspective"
            >
              {/* Card Container for 3D flip effect */}
              <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
                style={{ transformStyle: 'preserve-3d' }}
                className="w-full h-full relative cursor-pointer"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                {/* CARD BACK (Face Down) */}
                <div
                  style={{ backfaceVisibility: 'hidden' }}
                  className={`absolute inset-0 rounded-2xl border flex flex-col justify-between p-6 shadow-2xl ${activeCard.cardDesign} ${currentModalStyles.cardBack}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold font-mono tracking-widest opacity-60 uppercase">rayZRtalks</span>
                    <Feather className="w-4 h-4 opacity-55" />
                  </div>
                  
                  <div className="flex flex-col items-center justify-center text-center space-y-3 py-6">
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
                      <Sparkles className="w-5 h-5 text-amber-300" />
                    </div>
                    <p className="text-[11px] font-bold font-mono tracking-widest uppercase">
                      Tap Card to Reveal
                    </p>
                  </div>

                  <div className="flex justify-between items-center text-[8px] font-mono opacity-50">
                    <span>DEAL #{dealsCount}</span>
                    <span>CREATIVE INK</span>
                  </div>
                </div>

                {/* CARD FRONT (Face Up) */}
                <div
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                  className={`absolute inset-0 rounded-2xl border flex flex-col justify-between p-5 shadow-2xl ${currentModalStyles.cardFront}`}
                  onClick={(e) => {
                    // Prevent flipping card if they click the link/action buttons
                    const target = e.target as HTMLElement;
                    if (target.closest('.card-action-btn')) {
                      e.stopPropagation();
                    }
                  }}
                >
                  {/* Card Front Top */}
                  <div className="flex justify-between items-center">
                    <span className={`text-[9px] font-bold font-mono uppercase tracking-wider ${currentModalStyles.accentText}`}>
                      ✦ {deckMode === 'reader' ? 'Verse excerpt' : 'Creative catalyst'}
                    </span>
                    <Quote className="w-3.5 h-3.5 opacity-30" />
                  </div>

                  {/* Card Front Content */}
                  <div className="flex-1 flex flex-col justify-center py-2 overflow-y-auto pr-1">
                    {deckMode === 'reader' ? (
                      <div className="space-y-2 text-center">
                        <p className="font-serif italic text-sm md:text-md text-neutral-100 leading-relaxed font-semibold">
                          "{activeCard.excerpt}"
                        </p>
                        {activeCard.sourcePoem && (
                          <p className="text-[9px] font-mono text-neutral-400">
                            — from: <span className="underline decoration-indigo-400/30">{activeCard.sourcePoem.title}</span>
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3 text-center">
                        <span className="inline-block p-1 bg-amber-500/10 text-amber-400 rounded text-[9px] font-bold font-mono uppercase">
                          Creative Prompt
                        </span>
                        <p className="font-sans font-bold text-xs leading-relaxed text-neutral-100">
                          {activeCard.creativePrompt}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card Front Bottom Actions */}
                  <div className="flex justify-between items-center border-t border-white/5 pt-2 text-[10px]">
                    <button
                      type="button"
                      className="card-action-btn text-neutral-400 hover:text-white font-mono flex items-center gap-1 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsFlipped(false);
                      }}
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Flip</span>
                    </button>

                    {deckMode === 'reader' && activeCard.sourcePoem && (
                      <button
                        type="button"
                        className="card-action-btn px-2.5 py-1 rounded bg-indigo-500/15 hover:bg-indigo-500/35 border border-indigo-500/20 text-indigo-300 hover:text-white font-mono flex items-center gap-1 cursor-pointer font-bold transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (activeCard.sourcePoem) {
                            onReadPoem(activeCard.sourcePoem);
                          }
                        }}
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        <span>Read Entry</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
