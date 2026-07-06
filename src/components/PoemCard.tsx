import React, { useState } from 'react';
import { Poem, Category } from '../types';
import { Edit3, Trash2, Calendar, BookOpen, Quote, Tag, Paperclip, Maximize2, Play, Eye, Lock } from 'lucide-react';

interface PoemCardProps {
  poem: Poem;
  categories: Category[];
  onSelect: (poem: Poem) => void;
  onEdit: (poem: Poem) => void;
  onDelete: (id: string) => void;
  isEditable?: boolean;
  onSelectMedia?: (poem: Poem) => void; // Triggered when the media thumbnail is clicked for lightbox
  appTheme?: 'dark' | 'light' | 'sankofa' | 'momoamo' | 'madrid';
  gridOverlayEnabled?: boolean;
  isWide?: boolean;
}

const getMoodColor = (mood?: string, appTheme: 'dark' | 'light' | 'sankofa' | 'momoamo' | 'madrid' = 'dark') => {
  if (appTheme === 'light') {
    const glowColor = 'hover:border-[#C97F65] hover:shadow-[0_8px_24px_rgba(201,127,101,0.08)] hover:bg-[#FAF6F0] focus-within:ring-[#C97F65]/10';
    switch (mood) {
      case 'Reflective':
        return {
          badge: 'bg-cyan-50 text-cyan-700 border-cyan-200 font-mono text-[10px] uppercase font-bold shadow-xs',
          glow: glowColor,
          accentText: 'text-cyan-600',
          accentBg: 'bg-cyan-100/45'
        };
      case 'Melancholy':
        return {
          badge: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-mono text-[10px] uppercase font-bold shadow-xs',
          glow: glowColor,
          accentText: 'text-indigo-600',
          accentBg: 'bg-indigo-100/45'
        };
      case 'Romantic':
        return {
          badge: 'bg-rose-50 text-rose-700 border-rose-200 font-mono text-[10px] uppercase font-bold shadow-xs',
          glow: glowColor,
          accentText: 'text-rose-600',
          accentBg: 'bg-rose-100/45'
        };
      case 'Hopeful':
        return {
          badge: 'bg-teal-50 text-teal-700 border-teal-200 font-mono text-[10px] uppercase font-bold shadow-xs',
          glow: glowColor,
          accentText: 'text-teal-600',
          accentBg: 'bg-teal-100/45'
        };
      case 'Whimsical':
        return {
          badge: 'bg-amber-50 text-amber-800 border-amber-200 font-mono text-[10px] uppercase font-bold shadow-xs',
          glow: glowColor,
          accentText: 'text-amber-700',
          accentBg: 'bg-amber-100/45'
        };
      case 'Mystical':
        return {
          badge: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 font-mono text-[10px] uppercase font-bold shadow-xs',
          glow: glowColor,
          accentText: 'text-fuchsia-600',
          accentBg: 'bg-fuchsia-100/45'
        };
      case 'Free':
        return {
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-mono text-[10px] uppercase font-bold shadow-xs',
          glow: glowColor,
          accentText: 'text-emerald-600',
          accentBg: 'bg-emerald-100/45'
        };
      default:
        return {
          badge: 'bg-[#E2D9CF] text-[#2E2A27] border-[#C97F65]/35 font-mono text-[10px] uppercase font-bold shadow-xs',
          glow: glowColor,
          accentText: 'text-[#C97F65]',
          accentBg: 'bg-[#C97F65]/10'
        };
    }
  }

  if (appTheme === 'sankofa') {
    return {
      badge: 'bg-[#331c17] text-[#ebd6bc] border-[#bf3f27]/30 font-semibold shadow-xs',
      glow: 'hover:border-[#bf3f27]/50 hover:shadow-[0_8px_30px_rgba(191,63,39,0.18)] hover:bg-[#251815] focus-within:ring-[#bf3f27]/10',
      accentText: 'text-[#ebd6bc]',
      accentBg: 'bg-[#b33925]/20'
    };
  }

  if (appTheme === 'momoamo') {
    const glowColor = 'hover:border-[#E1FE35] hover:shadow-[0_8px_24px_rgba(225,254,53,0.12)] hover:bg-[#142217] focus-within:ring-[#E1FE35]/15';
    switch (mood) {
      case 'Reflective':
        return {
          badge: 'bg-cyan-950/45 text-cyan-400 border-cyan-800/40 font-mono text-[10px] uppercase font-bold shadow-xs',
          glow: glowColor,
          accentText: 'text-cyan-400',
          accentBg: 'bg-cyan-500/10'
        };
      case 'Melancholy':
        return {
          badge: 'bg-indigo-950/45 text-indigo-400 border-indigo-800/40 font-mono text-[10px] uppercase font-bold shadow-xs',
          glow: glowColor,
          accentText: 'text-indigo-400',
          accentBg: 'bg-indigo-500/10'
        };
      case 'Romantic':
        return {
          badge: 'bg-rose-950/45 text-rose-400 border-rose-800/40 font-mono text-[10px] uppercase font-bold shadow-xs',
          glow: glowColor,
          accentText: 'text-rose-400',
          accentBg: 'bg-rose-500/10'
        };
      case 'Hopeful':
        return {
          badge: 'bg-emerald-950/45 text-emerald-400 border-emerald-800/40 font-mono text-[10px] uppercase font-bold shadow-xs',
          glow: glowColor,
          accentText: 'text-emerald-400',
          accentBg: 'bg-emerald-500/10'
        };
      case 'Whimsical':
        return {
          badge: 'bg-amber-950/45 text-amber-400 border-amber-800/40 font-mono text-[10px] uppercase font-bold shadow-xs',
          glow: glowColor,
          accentText: 'text-amber-400',
          accentBg: 'bg-amber-500/10'
        };
      case 'Mystical':
        return {
          badge: 'bg-fuchsia-950/45 text-fuchsia-400 border-fuchsia-800/40 font-mono text-[10px] uppercase font-bold shadow-xs',
          glow: glowColor,
          accentText: 'text-fuchsia-400',
          accentBg: 'bg-fuchsia-500/10'
        };
      case 'Free':
        return {
          badge: 'bg-lime-950/45 text-lime-400 border-lime-800/40 font-mono text-[10px] uppercase font-bold shadow-xs',
          glow: glowColor,
          accentText: 'text-lime-400',
          accentBg: 'bg-lime-500/10'
        };
      default:
        return {
          badge: 'bg-[#1C291E] text-[#E1FE35] border-[#E1FE35]/30 font-mono text-[10px] uppercase font-bold shadow-xs',
          glow: glowColor,
          accentText: 'text-[#E1FE35]',
          accentBg: 'bg-[#E1FE35]/10'
        };
    }
  }



  if (appTheme === 'madrid') {
    const glowColor = 'hover:border-[#E1FE35] hover:shadow-[0_0_24px_rgba(225,254,53,0.12)] hover:bg-[#0e0e15] focus-within:ring-[#E1FE35]/10';
    switch (mood) {
      case 'Reflective':
        return {
          badge: 'bg-[#0E0E15] text-cyan-400 border-cyan-500/35 font-unbounded text-[9px] uppercase tracking-wide font-black shadow-xs',
          glow: glowColor,
          accentText: 'text-cyan-400',
          accentBg: 'bg-cyan-500/10'
        };
      case 'Melancholy':
        return {
          badge: 'bg-[#0E0E15] text-indigo-400 border-indigo-500/35 font-unbounded text-[9px] uppercase tracking-wide font-black shadow-xs',
          glow: glowColor,
          accentText: 'text-indigo-400',
          accentBg: 'bg-indigo-500/10'
        };
      case 'Romantic':
        return {
          badge: 'bg-[#0E0E15] text-rose-400 border-rose-500/35 font-unbounded text-[9px] uppercase tracking-wide font-black shadow-xs',
          glow: glowColor,
          accentText: 'text-rose-400',
          accentBg: 'bg-rose-500/10'
        };
      case 'Hopeful':
        return {
          badge: 'bg-[#0E0E15] text-teal-400 border-teal-500/35 font-unbounded text-[9px] uppercase tracking-wide font-black shadow-xs',
          glow: glowColor,
          accentText: 'text-teal-400',
          accentBg: 'bg-teal-500/10'
        };
      case 'Whimsical':
        return {
          badge: 'bg-[#0E0E15] text-amber-400 border-amber-500/35 font-unbounded text-[9px] uppercase tracking-wide font-black shadow-xs',
          glow: glowColor,
          accentText: 'text-amber-400',
          accentBg: 'bg-amber-500/10'
        };
      case 'Mystical':
        return {
          badge: 'bg-[#0E0E15] text-fuchsia-400 border-fuchsia-500/35 font-unbounded text-[9px] uppercase tracking-wide font-black shadow-xs',
          glow: glowColor,
          accentText: 'text-fuchsia-400',
          accentBg: 'bg-fuchsia-500/10'
        };
      case 'Free':
        return {
          badge: 'bg-[#0E0E15] text-lime-400 border-lime-500/35 font-unbounded text-[9px] uppercase tracking-wide font-black shadow-xs',
          glow: glowColor,
          accentText: 'text-lime-400',
          accentBg: 'bg-lime-500/10'
        };
      default:
        return {
          badge: 'bg-[#0E0E15] text-[#E1FE35] border-[#E1FE35]/30 font-unbounded text-[9px] uppercase tracking-wide font-black shadow-xs',
          glow: glowColor,
          accentText: 'text-[#E1FE35]',
          accentBg: 'bg-[#E1FE35]/10'
        };
    }
  }

  switch (mood) {
    case 'Reflective':
      return {
        badge: 'bg-cyan-950/40 text-cyan-400 border-cyan-800/50',
        glow: 'hover:border-cyan-500/60 hover:shadow-[0_0_25px_rgba(6,182,212,0.18)] hover:bg-cyan-950/20',
        accentText: 'text-cyan-400',
        accentBg: 'bg-cyan-500/10'
      };
    case 'Melancholy':
      return {
        badge: 'bg-indigo-950/40 text-indigo-400 border-indigo-800/50',
        glow: 'hover:border-indigo-500/60 hover:shadow-[0_0_25px_rgba(99,102,241,0.18)] hover:bg-indigo-950/20',
        accentText: 'text-indigo-400',
        accentBg: 'bg-indigo-500/10'
      };
    case 'Romantic':
      return {
        badge: 'bg-rose-950/40 text-rose-400 border-rose-800/50',
        glow: 'hover:border-rose-500/60 hover:shadow-[0_0_25px_rgba(244,63,94,0.18)] hover:bg-rose-950/20',
        accentText: 'text-rose-400',
        accentBg: 'bg-rose-500/10'
      };
    case 'Hopeful':
      return {
        badge: 'bg-teal-950/40 text-teal-400 border-teal-800/50',
        glow: 'hover:border-teal-500/60 hover:shadow-[0_0_25px_rgba(20,184,166,0.18)] hover:bg-teal-950/20',
        accentText: 'text-teal-400',
        accentBg: 'bg-teal-500/10'
      };
    case 'Whimsical':
      return {
        badge: 'bg-amber-950/40 text-amber-400 border-amber-800/50',
        glow: 'hover:border-amber-500/60 hover:shadow-[0_0_25px_rgba(245,158,11,0.18)] hover:bg-amber-950/20',
        accentText: 'text-amber-400',
        accentBg: 'bg-amber-500/10'
      };
    case 'Mystical':
      return {
        badge: 'bg-fuchsia-950/40 text-fuchsia-400 border-fuchsia-800/50',
        glow: 'hover:border-fuchsia-500/60 hover:shadow-[0_0_25px_rgba(217,70,239,0.18)] hover:bg-fuchsia-950/20',
        accentText: 'text-fuchsia-400',
        accentBg: 'bg-fuchsia-500/10'
      };
    case 'Free':
      return {
        badge: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50',
        glow: 'hover:border-emerald-500/60 hover:shadow-[0_0_25px_rgba(16,185,129,0.18)] hover:bg-emerald-950/20',
        accentText: 'text-emerald-400',
        accentBg: 'bg-emerald-500/10'
      };
    default:
      return {
        badge: 'bg-neutral-900/40 text-neutral-400 border-neutral-800/50',
        glow: 'hover:border-neutral-700/60 hover:shadow-[0_0_25px_rgba(163,163,163,0.15)] hover:bg-neutral-900/10',
        accentText: 'text-neutral-300',
        accentBg: 'bg-neutral-500/10'
      };
  }
};

const getThemeStyles = (appTheme: 'dark' | 'light' | 'sankofa' | 'momoamo' | 'madrid' = 'dark') => {
  switch (appTheme) {
    case 'light':
      return {
        cardBg: 'bg-[#FAF6F0] border-[#E2D9CF] text-[#2E2A27] shadow-[0_4px_24px_rgba(201,127,101,0.04)] focus-within:ring-[#C97F65]/20',
        cardBorder: 'border-[#E2D9CF]',
        textTitle: 'text-[#2E2A27]',
        textAuthor: 'text-[#738A7C]',
        textBody: 'border-[#C97F65]/30 text-[#2E2A27]/80',
        stzBadge: 'bg-[#FAF6F0] border-[#E2D9CF] text-[#2E2A27]/60',
        enlargeBadge: 'text-[#C97F65] bg-[#FAF6F0] border-[#E2D9CF] group-hover/thumb:bg-[#C97F65] group-hover/thumb:text-white group-hover/thumb:border-[#C97F65]',
        catPill: 'bg-[#FAF6F0] text-[#2E2A27] border-[#E2D9CF]',
        pvtBadge: 'text-[#C97F65] bg-[#FAF6F0] border-[#E2D9CF]',
        attachBadge: 'text-[#738A7C] bg-[#FAF6F0] border-[#E2D9CF]',
        deleteBtn: 'text-red-700 hover:bg-red-50',
        dateBtn: 'text-[#738A7C] hover:bg-[#E2D9CF]/30',
        metaBorder: 'border-[#E2D9CF]',
        liveBadge: 'border-[#E2D9CF] text-[#738A7C]',
        liveIndicator: 'bg-[#C97F65]',
        specimenText: 'text-[#738A7C]/15 group-hover/thumb:text-[#C97F65]/20',
        specimenTileBg: 'bg-[#FAF6F0] border-[#E2D9CF] text-[#2E2A27]/50',
        actionBtn: 'text-[#738A7C] hover:text-[#C97F65] hover:bg-[#E2D9CF]/30',
        deleteConfirmBg: 'bg-[#FAF6F0] border-[#E2D9CF] text-red-700'
      };
    case 'sankofa':
      return {
        cardBg: 'bg-[#1c1412] border-[#3a221d] text-[#f6eedf] shadow-[0_4px_24px_rgba(0,0,0,0.2)] focus-within:ring-[#bf3f27]/20',
        cardBorder: 'border-[#3a221d]',
        textTitle: 'text-[#ebd6bc]',
        textAuthor: 'text-[#f6eedf]',
        textBody: 'border-[#bf3f27] text-[#ebd6bc]/80',
        stzBadge: 'bg-[#251815] border-[#3a221d] text-[#ebd6bc]/70',
        enlargeBadge: 'text-[#ebd6bc] bg-[#251815] border-[#bf3f27]/30 group-hover/thumb:bg-[#bf3f27] group-hover/thumb:text-[#f6eedf] group-hover/thumb:border-[#bf3f27]',
        catPill: 'bg-[#331c17] text-[#ebd6bc] border-[#bf3f27]/30',
        pvtBadge: 'text-[#bf3f27] bg-[#2a130f] border-[#421f19]',
        attachBadge: 'text-[#ebd6bc] bg-[#331c17] border-[#bf3f27]/30',
        deleteBtn: 'text-[#bf3f27] hover:bg-[#3d1a14]',
        dateBtn: 'text-[#ebd6bc] hover:bg-[#331c17]',
        metaBorder: 'border-[#3a221d]',
        liveBadge: 'border-[#bf3f27]/30 text-[#dca626]',
        liveIndicator: 'bg-[#bf3f27]',
        specimenText: 'text-[#bf3f27]/10 group-hover/thumb:text-[#bf3f27]/20',
        specimenTileBg: 'bg-[#0d0706] border-[#3a221d] text-neutral-400',
        actionBtn: 'text-[#ebd6bc]/70 hover:text-[#dca626] hover:bg-[#331c17]',
        deleteConfirmBg: 'bg-[#2a130f] border-[#bf3f27]/30 text-red-500'
      };
    case 'momoamo':
      return {
        cardBg: 'bg-[#18231C] border-[#FAF6F0]/15 text-[#FAF6F0] shadow-[0_8px_30px_rgba(0,0,0,0.5)] focus-within:ring-[#E1FE35]/20',
        cardBorder: 'border-[#FAF6F0]/15',
        textTitle: 'text-[#FAF6F0]',
        textAuthor: 'text-[#E1FE35]',
        textBody: 'border-[#E1FE35]/20 text-[#FAF6F0]/85',
        stzBadge: 'bg-[#141C16] border-[#FAF6F0]/10 text-[#E1FE35]/70',
        enlargeBadge: 'text-[#E1FE35] bg-[#141C16] border-[#FAF6F0]/15 group-hover/thumb:bg-[#E1FE35] group-hover/thumb:text-black group-hover/thumb:border-[#E1FE35]',
        catPill: 'bg-[#141C16] text-[#E1FE35] border-[#E1FE35]/15',
        pvtBadge: 'text-[#E1FE35] bg-[#141C16] border-[#FAF6F0]/15',
        attachBadge: 'text-[#E1FE35] bg-[#141C16] border-[#FAF6F0]/15',
        deleteBtn: 'text-red-500 hover:bg-red-950/20',
        dateBtn: 'text-[#E1FE35]/70 hover:bg-[#1C291E]',
        metaBorder: 'border-[#FAF6F0]/15',
        liveBadge: 'border-[#FAF6F0]/20 text-[#E1FE35]',
        liveIndicator: 'bg-[#E1FE35]',
        specimenText: 'text-[#E1FE35]/15 group-hover/thumb:text-[#E1FE35]/25',
        specimenTileBg: 'bg-[#141C16] border-[#FAF6F0]/15 text-neutral-400',
        actionBtn: 'text-[#E1FE35]/70 hover:text-[#E1FE35] hover:bg-[#1C291E]',
        deleteConfirmBg: 'bg-[#141C16] border-[#FAF6F0]/25 text-red-500'
      };

    case 'madrid':
      return {
        cardBg: 'bg-white/90 backdrop-blur-md border-black/10 text-[#0E0E15] shadow-[0_8px_30px_rgba(0,0,0,0.06)] focus-within:ring-[#FF5E00]/20',
        cardBorder: 'border-black/10',
        textTitle: 'text-[#0E0E15]',
        textAuthor: 'text-[#FF5E00]',
        textBody: 'border-[#FF5E00]/30 text-[#0E0E15]/80',
        stzBadge: 'bg-neutral-100/80 border-black/10 text-neutral-600',
        enlargeBadge: 'text-[#FF5E00] bg-white/80 border-black/10 group-hover/thumb:bg-[#FF5E00] group-hover/thumb:text-white group-hover/thumb:border-[#FF5E00]',
        catPill: 'bg-neutral-100/80 text-[#FF5E00] border-black/10',
        pvtBadge: 'text-[#0E0E15] bg-white/80 border-black/10',
        attachBadge: 'text-[#FF5E00] bg-white/80 border-black/10',
        deleteBtn: 'text-red-600 hover:bg-red-50',
        dateBtn: 'text-[#FF5E00] hover:bg-neutral-100',
        metaBorder: 'border-black/10',
        liveBadge: 'border-black/10 text-[#FF5E00]',
        liveIndicator: 'bg-[#FF5E00]',
        specimenText: 'text-[#FF5E00]/10 group-hover/thumb:text-red-500/20',
        specimenTileBg: 'bg-white/90 border-black/10 text-[#FF5E00]/50',
        actionBtn: 'text-[#FF5E00]/70 hover:text-[#FF5E00] hover:bg-neutral-100',
        deleteConfirmBg: 'bg-white border-black/10 text-red-600'
      };
    default: // dark mode
      return {
        cardBg: 'bg-[#111218]/95 border-neutral-800/80 text-[#e4e4e7] shadow-2xl backdrop-blur-md focus-within:ring-cyan-500/30',
        cardBorder: 'border-neutral-800/80',
        textTitle: 'text-neutral-100',
        textAuthor: 'text-neutral-200',
        textBody: 'border-neutral-800/80 text-neutral-350',
        stzBadge: 'bg-neutral-955/80 border-neutral-900 text-neutral-400',
        enlargeBadge: 'text-cyan-400 bg-cyan-950/60 border-cyan-900/60 group-hover/thumb:bg-cyan-500 group-hover/thumb:text-neutral-950 group-hover/thumb:border-cyan-400',
        catPill: 'bg-[#181920] text-zinc-300 border-[#272832]',
        pvtBadge: 'text-amber-400 bg-amber-950/30 border-amber-900/40',
        attachBadge: 'text-cyan-400 bg-cyan-950/30 border-cyan-850/40',
        deleteBtn: 'text-red-400 hover:bg-red-900/40',
        dateBtn: 'text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100/10',
        metaBorder: 'border-neutral-800/80',
        liveBadge: 'border-neutral-800 text-cyan-400',
        liveIndicator: 'bg-cyan-400',
        specimenText: 'group-hover/thumb:text-cyan-500/10',
        specimenTileBg: 'bg-neutral-955/80 border-neutral-900 text-neutral-400',
        actionBtn: 'text-neutral-400 hover:text-cyan-400 hover:bg-neutral-800',
        deleteConfirmBg: 'bg-red-950/40 border-red-900/50 text-red-400'
      };
  }
};

export default function PoemCard({
  poem,
  categories,
  onSelect,
  onEdit,
  onDelete,
  isEditable = true,
  onSelectMedia,
  appTheme = 'dark',
  gridOverlayEnabled = false,
  isWide = false,
}: PoemCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Find the category
  const category = categories.find((c) => c.id === poem.categoryId);
  
  // Format the date beautifully
  const formattedDate = new Date(poem.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Extract a preview of the body (first 3 stanzas/lines)
  const lines = (poem.body || '').split('\n').filter(line => line.trim() !== '');
  const previewLines = lines.slice(0, 3);
  const hasMoreLines = lines.length > 3;

  // Active theme based colors
  const mColors = getMoodColor(poem.mood, appTheme);
  const themeStyles = getThemeStyles(appTheme);

  // Extract letter specimens for foundry asset representation
  const leadInitials = poem.title.split(' ').map(w => w ? w[0] : '').join('').slice(0, 2).toUpperCase() || poem.title.slice(0, 2).toUpperCase();

  if (isWide) {
    return (
      <div
        id={`poem-card-${poem.id}`}
        className={`group relative flex flex-col md:flex-row gap-6 md:items-stretch min-h-[380px] h-full transition-all duration-300 border rounded-2xl p-6 focus-within:ring-2 ${themeStyles.cardBg} ${mColors.glow} ${!isEditable ? 'select-none' : ''}`}
        onCopy={(e) => {
          if (!isEditable) e.preventDefault();
        }}
        onContextMenu={(e) => {
          if (!isEditable) e.preventDefault();
        }}
      >
        {/* Left Column: Specimen Thumbnail / Graphic */}
        <div className="w-full md:w-[42%] shrink-0 flex flex-col justify-stretch relative">
          <div 
            id={`card-specimen-tile-${poem.id}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectMedia) {
                onSelectMedia(poem);
              } else {
                onSelect(poem);
              }
            }}
            className={`relative w-full h-full min-h-[180px] rounded-xl overflow-hidden cursor-pointer shadow-md group/thumb transition-all duration-300 border ${
              appTheme === 'light'
                ? 'bg-[#2E2A27] border-[#E2D9CF]'
                : appTheme === 'sankofa'
                ? 'bg-[#0d0706] border-[#3a221d]'
                : appTheme === 'momoamo'
                ? 'bg-[#141C16] border-[#E1FE35]/20'
                : appTheme === 'madrid'
                ? 'bg-black border-[#E1FE35]/30'
                : 'bg-neutral-950 border-neutral-800/80'
            }`}
          >
            {/* Background Grid & Scanlines */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px] opacity-65 z-1 pointer-events-none" />
            
            {/* Subtle Ambient Radial Highlight */}
            <div className={`absolute inset-0 transition-all duration-500 z-1 pointer-events-none ${
              appTheme === 'light'
                ? 'bg-[radial-gradient(circle_at_center,rgba(201,127,101,0.05)_0%,transparent_70%)] group-hover/thumb:bg-[radial-gradient(circle_at_center,rgba(201,127,101,0.15)_0%,transparent_60%)]'
                : appTheme === 'sankofa'
                ? 'bg-[radial-gradient(circle_at_center,rgba(191,63,39,0.05)_0%,transparent_70%)] group-hover/thumb:bg-[radial-gradient(circle_at_center,rgba(191,63,39,0.15)_0%,transparent_60%)]'
                : appTheme === 'momoamo'
                ? 'bg-[radial-gradient(circle_at_center,rgba(225,254,53,0.05)_0%,transparent_70%)] group-hover/thumb:bg-[radial-gradient(circle_at_center,rgba(225,254,53,0.15)_0%,transparent_60%)]'
                : appTheme === 'madrid'
                ? 'bg-[radial-gradient(circle_at_center,rgba(225,254,53,0.05)_0%,transparent_70%)] group-hover/thumb:bg-[radial-gradient(circle_at_center,rgba(225,254,53,0.15)_0%,transparent_60%)]'
                : 'bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.02)_0%,transparent_70%)] group-hover/thumb:bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.08)_0%,transparent_60%)]'
            }`} />

            {/* Large Typographic Background Initial */}
            <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none z-1 overflow-hidden">
              <span className={`font-sans font-black text-[6.5rem] leading-none text-neutral-900/50 tracking-tighter uppercase transition-all duration-750 ease-out group-hover/thumb:scale-110 ${themeStyles.specimenText}`}>
                {leadInitials}
              </span>
            </div>

            {/* Actual Media Content if attached */}
            {poem.attachments && poem.attachments.length > 0 ? (
              <div className="absolute inset-0 w-full h-full z-2 overflow-hidden bg-neutral-950">
                {poem.attachments[0].type === 'image' ? (
                  <img
                    src={poem.attachments[0].url}
                    alt={poem.attachments[0].name}
                    className="w-full h-full object-cover grayscale opacity-55 contrast-[1.05] brightness-[1.02] group-hover/thumb:opacity-90 group-hover/thumb:grayscale-0 group-hover/thumb:scale-105 transition-all duration-750 ease-out select-none"
                    referrerPolicy="no-referrer"
                    onContextMenu={(e) => { if (!isEditable) e.preventDefault(); }}
                    onDragStart={(e) => { if (!isEditable) e.preventDefault(); }}
                  />
                ) : (
                  <div className="w-full h-full relative">
                    <video
                      src={poem.attachments[0].url}
                      className="w-full h-full object-cover grayscale opacity-55 group-hover/thumb:opacity-90 group-hover/thumb:grayscale-0 group-hover/thumb:scale-105 transition-all duration-750 ease-out select-none"
                      muted
                      loop
                      autoPlay
                      playsInline
                      controlsList={!isEditable ? "nodownload nofullscreen noremoteplayback" : undefined}
                      onContextMenu={(e) => { if (!isEditable) e.preventDefault(); }}
                    />
                    <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 bg-neutral-950/80 px-2 py-0.5 rounded-md border border-neutral-800 text-[8px] uppercase tracking-wider font-mono text-cyan-400">
                      <span className="w-1 h-1 rounded-full animate-pulse bg-cyan-400" />
                      Live Motion
                    </div>
                  </div>
                )}
                {/* Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/95 via-neutral-950/10 to-neutral-950/40 opacity-70 group-hover/thumb:opacity-40 transition-all duration-500" />
              </div>
            ) : (
              <div className={`absolute inset-0 w-full h-full z-2 object-cover transition-all duration-500 ${
                appTheme === 'light'
                  ? 'bg-[#12131a] group-hover/thumb:bg-[#161822]'
                  : 'bg-[#0c0d14]/70 group-hover/thumb:bg-cyan-950/10'
              }`}>
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between select-none pointer-events-none text-[8px] uppercase font-mono text-neutral-500/40 tracking-widest leading-loose">
                  <div>a b c d e f g h i j k l m</div>
                  <div>n o p q r s t u v w x y z</div>
                </div>
              </div>
            )}

            {/* Technical Specimen Grid Alignment lines */}
            {gridOverlayEnabled && (
              <div className="absolute inset-0 z-2 pointer-events-none select-none">
                <div className="absolute top-0 bottom-0 left-[25%] border-l border-dashed border-red-500/15" />
                <div className="absolute top-0 bottom-0 left-[75%] border-l border-dashed border-red-500/15" />
                <div className="absolute left-0 right-0 top-[38%] border-t border-dashed border-cyan-500/15" />
                <div className="absolute left-0 right-0 top-[68%] border-t border-dashed border-cyan-500/15" />
              </div>
            )}

            {/* Front-Facing Fine-Line Metadata Blueprint Overlays */}
            <div className="absolute inset-0 z-3 p-3 flex flex-col justify-between pointer-events-none select-none">
              <div className="flex items-start justify-between font-mono text-[8.5px] leading-none tracking-widest">
                <div className={`flex items-center gap-1.5 border px-2 py-1 rounded font-semibold uppercase ${themeStyles.stzBadge}`}>
                  <span className={appTheme === 'sankofa' ? 'text-[#bf3f27]' : appTheme === 'momoamo' ? 'text-[#E1FE35]' : appTheme === 'madrid' ? 'text-[#FDA172]' : 'text-cyan-400'}>⊕</span>
                  <span>SYS_{poem.id.toUpperCase().slice(-5)}</span>
                </div>
                <div className={`border px-2 py-1 rounded uppercase font-semibold ${themeStyles.stzBadge}`}>
                  {poem.attachments && poem.attachments.length > 0 
                    ? `[SPEC // ${poem.attachments[0].type.toUpperCase()}]` 
                    : '[SPEC // TYPO]'}
                </div>
              </div>

              {/* Middle Focal Target Crosshair Box */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-all duration-500 scale-95 group-hover/thumb:scale-100 pointer-events-none">
                <div className={`w-12 h-12 border flex items-center justify-center relative bg-neutral-950/40 backdrop-blur-xs rounded-lg ${
                  appTheme === 'light'
                    ? 'border-orange-400/40'
                    : appTheme === 'sankofa'
                    ? 'border-[#bf3f27]/40'
                    : appTheme === 'momoamo'
                    ? 'border-[#E1FE35]/40'
                    : appTheme === 'madrid'
                    ? 'border-[#FDA172]/40'
                    : 'border-cyan-500/30'
                }`}>
                  <Maximize2 className={`w-3.5 h-3.5 animate-pulse ${
                    appTheme === 'light'
                      ? 'text-orange-400'
                      : appTheme === 'sankofa'
                      ? 'text-[#bf3f27]'
                      : appTheme === 'momoamo'
                      ? 'text-[#E1FE35]'
                      : appTheme === 'madrid'
                      ? 'text-[#FDA172]'
                      : 'text-cyan-400'
                  }`} />
                </div>
              </div>

              {/* Bottom Row specs */}
              <div className="flex items-end justify-between font-mono text-[8.5px] leading-none tracking-widest text-neutral-500">
                <div className={`flex items-center gap-1.5 border px-2 py-1 rounded font-semibold ${themeStyles.stzBadge}`}>
                  <span>STZ // 0{previewLines.length}</span>
                </div>
                <div className={`flex items-center gap-1 font-bold border px-2 py-1 rounded backdrop-blur-xs transition-colors duration-300 ${themeStyles.enlargeBadge}`}>
                  <span>✦ ENLARGE</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Informational Text & Actions */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div className="space-y-4">
            {/* Category & Mood Headings */}
            <div className="flex items-center justify-between gap-1 overflow-hidden">
              <span
                id={`card-cat-pill-${poem.id}`}
                className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold truncate flex-1 text-center font-display uppercase tracking-widest border transition-colors ${themeStyles.catPill}`}
              >
                {category?.name || 'Uncategorized'}
              </span>
              
              <div className="flex items-center gap-1 shrink-0">
                {poem.isPrivate && (
                  <span
                    id={`card-private-badge-${poem.id}`}
                    className={`text-[9px] font-bold px-2 py-1 rounded-full border flex items-center gap-1 font-mono tracking-wider ${themeStyles.pvtBadge}`}
                  >
                    <Lock className="w-2.5 h-2.5 text-amber-500" />
                    <span>PVT</span>
                  </span>
                )}

                {poem.attachments && poem.attachments.length > 0 && (
                  <span
                    id={`card-attach-badge-${poem.id}`}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-0.5 font-sans ${themeStyles.attachBadge}`}
                  >
                    <Paperclip className="w-3 h-3" />
                    <span>{poem.attachments.length}</span>
                  </span>
                )}

                {poem.mood && (
                  <span
                    id={`card-mood-pill-${poem.id}`}
                    className={`text-[10px] font-extrabold capitalize px-2.5 py-1 rounded-full border font-mono tracking-wider ${mColors.badge}`}
                  >
                    {poem.mood}
                  </span>
                )}
              </div>
            </div>

            {/* Title & Poet */}
            <div className="space-y-1 font-display">
              <h4
                id={`card-title-${poem.id}`}
                onClick={() => onSelect(poem)}
                className={`text-lg font-extrabold tracking-tight group-hover:${mColors.accentText} cursor-pointer transition-colors leading-snug line-clamp-2 ${themeStyles.textTitle}`}
              >
                {poem.title}
              </h4>
              <span id={`card-author-${poem.id}`} className="text-xs text-neutral-400 font-mono tracking-tight block">
                by <span className={`font-medium ${themeStyles.textAuthor}`}>{poem.author || 'Anonymous'}</span>
              </span>
            </div>

            {/* Poem Excerpt Preview - Extended for wide display */}
            {previewLines.length > 0 && (
              <div 
                id={`card-excerpt-${poem.id}`}
                onClick={() => onSelect(poem)}
                className={`relative text-[13px] font-sans leading-relaxed cursor-pointer focus:outline-none pl-3 border-l-2 hover:border-l-current ${mColors.accentText} transition-all duration-300 ${themeStyles.textBody}`}
              >
                <div className="space-y-1.5">
                  {lines.slice(0, 4).map((line, idx) => (
                    <p key={idx} className="truncate tracking-tight font-sans italic">{line}</p>
                  ))}
                  {lines.length > 4 && (
                    <p className={`text-[10px] ${mColors.accentText} font-bold tracking-widest font-mono mt-2.5 uppercase`}>
                      → Read full verse ({lines.length - 4} lines more)
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer details & action buttons */}
          <div className={`border-t pt-4 flex items-center justify-between mt-6 transition-colors ${themeStyles.metaBorder}`}>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 font-mono tracking-wider uppercase">
              <Calendar className="w-3.5 h-3.5 text-neutral-500" />
              <span>{formattedDate}</span>
            </div>

            <div className="flex items-center gap-0.5">
              <button
                id={`btn-select-poem-${poem.id}`}
                onClick={() => onSelect(poem)}
                className={`p-1.5 rounded-full transition-colors cursor-pointer select-none ${themeStyles.actionBtn}`}
                title="Read Full Details"
              >
                <BookOpen className="w-4 h-4" />
              </button>
              
              {isEditable && (
                <>
                  <button
                    id={`btn-edit-poem-${poem.id}`}
                    onClick={() => onEdit(poem)}
                    className={`p-1.5 rounded-full transition-colors cursor-pointer select-none ${themeStyles.actionBtn}`}
                    title="Edit Entry"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {confirmDelete ? (
                    <div className={`flex items-center gap-1 rounded-lg p-1 animate-pulse border ${themeStyles.deleteConfirmBg}`}>
                      <button
                        id={`btn-confirm-delete-${poem.id}`}
                        onClick={() => {
                          onDelete(poem.id);
                          setConfirmDelete(false);
                        }}
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md cursor-pointer uppercase font-mono tracking-widest ${themeStyles.deleteBtn}`}
                      >
                        Confirm
                      </button>
                      <button
                        id={`btn-cancel-delete-${poem.id}`}
                        onClick={() => setConfirmDelete(false)}
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md cursor-pointer uppercase font-mono tracking-widest ${themeStyles.dateBtn}`}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      id={`btn-trigger-delete-${poem.id}`}
                      onClick={() => setConfirmDelete(true)}
                      className={`p-1.5 rounded-full transition-colors cursor-pointer ${themeStyles.deleteBtn}`}
                      title="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`poem-card-${poem.id}`}
      className={`group relative flex flex-col justify-between min-h-[340px] h-full transition-all duration-300 border rounded-2xl p-6 focus-within:ring-2 ${themeStyles.cardBg} ${mColors.glow} ${!isEditable ? 'select-none' : ''}`}
      onCopy={(e) => {
        if (!isEditable) {
          e.preventDefault();
        }
      }}
      onContextMenu={(e) => {
        if (!isEditable) {
          e.preventDefault();
        }
      }}
    >
      <div className="space-y-4">
        {/* Category & Mood Headings */}
        <div className="flex items-center justify-between gap-1 overflow-hidden">
          <span
            id={`card-cat-pill-${poem.id}`}
            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold truncate flex-1 text-center font-display uppercase tracking-widest border transition-colors ${themeStyles.catPill}`}
          >
            {category?.name || 'Uncategorized'}
          </span>
          
          <div className="flex items-center gap-1 shrink-0">
            {poem.isPrivate && (
              <span
                id={`card-private-badge-${poem.id}`}
                className={`text-[9px] font-bold px-2 py-1 rounded-full border flex items-center gap-1 font-mono tracking-wider ${themeStyles.pvtBadge}`}
                title="Private Settings (Visible in Author Mode)"
              >
                <Lock className="w-2.5 h-2.5 text-amber-500" />
                <span>PVT</span>
              </span>
            )}

            {poem.attachments && poem.attachments.length > 0 && (
              <span
                id={`card-attach-badge-${poem.id}`}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-0.5 font-sans ${themeStyles.attachBadge}`}
                title={`${poem.attachments.length} media items`}
              >
                <Paperclip className={`w-3 h-3 ${
                  appTheme === 'light' ? 'text-[#C97F65]' : appTheme === 'sankofa' ? 'text-[#ebd6bc]' : appTheme === 'momoamo' ? 'text-[#E1FE35]' : appTheme === 'madrid' ? 'text-[#FDA172]' : 'text-cyan-400'
                }`} />
                <span>{poem.attachments.length}</span>
              </span>
            )}

            {poem.mood && (
              <span
                id={`card-mood-pill-${poem.id}`}
                className={`text-[10px] font-extrabold capitalize px-2.5 py-1 rounded-full border font-mono tracking-wider ${mColors.badge}`}
              >
                {poem.mood}
              </span>
            )}
          </div>
        </div>

        {/* ARS Type Foundry Inspired Typography & Media Specimen Section */}
        <div 
          id={`card-specimen-tile-${poem.id}`}
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectMedia) {
              onSelectMedia(poem);
            } else {
              onSelect(poem);
            }
          }}
          className={`relative w-full h-44 rounded-xl overflow-hidden shrink-0 cursor-pointer shadow-md group/thumb transition-all duration-300 border ${themeStyles.specimenTileBg}`}
        >
          {/* Background Grid & Scanlines (Absolute Specimen Overlay) */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px] opacity-65 z-1 pointer-events-none" />
          
          {/* Subtle Ambient Radial Highlight */}
          <div className={`absolute inset-0 transition-all duration-500 z-1 pointer-events-none ${
            appTheme === 'light'
              ? 'bg-[radial-gradient(circle_at_center,rgba(201,127,101,0.05)_0%,transparent_70%)] group-hover/thumb:bg-[radial-gradient(circle_at_center,rgba(201,127,101,0.15)_0%,transparent_60%)]'
              : appTheme === 'sankofa'
              ? 'bg-[radial-gradient(circle_at_center,rgba(191,63,39,0.05)_0%,transparent_70%)] group-hover/thumb:bg-[radial-gradient(circle_at_center,rgba(191,63,39,0.15)_0%,transparent_60%)]'
              : appTheme === 'momoamo'
              ? 'bg-[radial-gradient(circle_at_center,rgba(225,254,53,0.05)_0%,transparent_70%)] group-hover/thumb:bg-[radial-gradient(circle_at_center,rgba(225,254,53,0.15)_0%,transparent_60%)]'
              : appTheme === 'madrid'
              ? 'bg-[radial-gradient(circle_at_center,rgba(253,161,114,0.05)_0%,transparent_70%)] group-hover/thumb:bg-[radial-gradient(circle_at_center,rgba(253,161,114,0.15)_0%,transparent_60%)]'
              : 'bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.02)_0%,transparent_70%)] group-hover/thumb:bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.08)_0%,transparent_60%)]'
          }`} />

          {/* Large Typographic Background Initial */}
          <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none z-1 overflow-hidden">
            <span className={`font-sans font-black text-[6.5rem] leading-none text-neutral-900/50 tracking-tighter uppercase transition-all duration-750 ease-out group-hover/thumb:scale-110 ${themeStyles.specimenText}`}>
              {leadInitials}
            </span>
          </div>

          {/* Actual Media Content if attached */}
          {poem.attachments && poem.attachments.length > 0 ? (
            <div className="absolute inset-0 w-full h-full z-2 overflow-hidden bg-neutral-950">
              {poem.attachments[0].type === 'image' ? (
                <img
                  src={poem.attachments[0].url}
                  alt={poem.attachments[0].name}
                  className="w-full h-full object-cover grayscale opacity-55 contrast-[1.05] brightness-[1.02] group-hover/thumb:opacity-90 group-hover/thumb:grayscale-0 group-hover/thumb:scale-105 transition-all duration-750 ease-out select-none"
                  referrerPolicy="no-referrer"
                  onContextMenu={(e) => { if (!isEditable) e.preventDefault(); }}
                  onDragStart={(e) => { if (!isEditable) e.preventDefault(); }}
                />
              ) : (
                <div className="w-full h-full relative">
                  <video
                    src={poem.attachments[0].url}
                    className="w-full h-full object-cover grayscale opacity-55 group-hover/thumb:opacity-90 group-hover/thumb:grayscale-0 group-hover/thumb:scale-105 transition-all duration-750 ease-out select-none"
                    muted
                    loop
                    autoPlay
                    playsInline
                    controlsList={!isEditable ? "nodownload nofullscreen noremoteplayback" : undefined}
                    onContextMenu={(e) => { if (!isEditable) e.preventDefault(); }}
                  />
                  <div className={`absolute top-2.5 left-2.5 z-10 flex items-center gap-1 bg-neutral-950/80 px-2 py-0.5 rounded-md border text-[8px] uppercase tracking-wider font-mono ${themeStyles.liveBadge}`}>
                    <span className={`w-1 h-1 rounded-full animate-pulse ${themeStyles.liveIndicator}`} />
                    Live Motion
                  </div>
                </div>
              )}
              {/* Vignette Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/95 via-neutral-950/10 to-neutral-950/40 opacity-70 group-hover/thumb:opacity-40 transition-all duration-500" />
            </div>
          ) : (
            // Exquisite fallback CSS typography specimen grid item
            <div className={`absolute inset-0 w-full h-full z-2 object-cover transition-all duration-500 ${
              appTheme === 'light'
                ? 'bg-[#FAF6F0] group-hover/thumb:bg-[#E2D9CF]/10'
              : appTheme === 'momoamo'
                ? 'bg-[#141C16] group-hover/thumb:bg-[#1C291E]'
              : appTheme === 'sankofa'
                ? 'bg-[#0d0706] group-hover/thumb:bg-[#251815]'
              : appTheme === 'madrid'
                ? 'bg-black group-hover/thumb:bg-[#0E0E15]'
                : 'bg-[#0c0d14]/70 group-hover/thumb:bg-cyan-950/10'
            }`}>
              {/* Render dynamic background glyph grids typical of font spec sheets */}
              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between select-none pointer-events-none text-[8px] uppercase font-mono text-neutral-500/40 tracking-widest leading-loose">
                <div>a b c d e f g h i j k l m</div>
                <div>n o p q r s t u v w x y z</div>
              </div>
            </div>
          )}

          {/* Technical Specimen Grid Alignment Overlay lines (Highly characteristic of ARS Type Foundry spec sheets) */}
          {gridOverlayEnabled && (
            <div className="absolute inset-0 z-2 pointer-events-none select-none">
              <div className="absolute top-0 bottom-0 left-[25%] border-l border-dashed border-red-500/15" />
              <div className="absolute top-0 bottom-0 left-[75%] border-l border-dashed border-red-500/15" />
              <div className="absolute left-0 right-0 top-[38%] border-t border-dashed border-cyan-500/15" />
              <div className="absolute left-0 right-0 top-[68%] border-t border-dashed border-cyan-500/15" />
              <div className={`absolute left-2.5 top-[32%] text-[6.5px] font-mono scale-90 uppercase ${appTheme === 'light' ? 'text-[#C97F65]/40' : appTheme === 'sankofa' ? 'text-[#bf3f27]/40' : appTheme === 'momoamo' ? 'text-[#E1FE35]/40' : appTheme === 'madrid' ? 'text-[#FDA172]/40' : 'text-cyan-400/40'}`}>H-Height</div>
              <div className={`absolute left-2.5 top-[62%] text-[6.5px] font-mono scale-90 uppercase ${appTheme === 'light' ? 'text-[#C97F65]/40' : appTheme === 'sankofa' ? 'text-[#bf3f27]/40' : appTheme === 'momoamo' ? 'text-[#E1FE35]/40' : appTheme === 'madrid' ? 'text-[#FDA172]/40' : 'text-cyan-400/40'}`}>Baseline</div>
              <div className="absolute right-2.5 top-[5%] text-[6.5px] text-rose-400/40 font-mono scale-90 uppercase">Grid_16px</div>
            </div>
          )}

          {/* Front-Facing Fine-Line Metadata Blueprint Overlays */}
          <div className="absolute inset-0 z-3 p-3 flex flex-col justify-between pointer-events-none select-none">
            {/* Top Row: System identifiers & Media types */}
            <div className="flex items-start justify-between font-mono text-[8.5px] leading-none tracking-widest">
              <div className={`flex items-center gap-1.5 border px-2 py-1 rounded font-semibold uppercase ${themeStyles.stzBadge}`}>
                <span className={appTheme === 'light' ? 'text-[#C97F65]' : appTheme === 'sankofa' ? 'text-[#bf3f27]' : appTheme === 'momoamo' ? 'text-[#E1FE35]' : appTheme === 'madrid' ? 'text-[#FDA172]' : 'text-cyan-400'}>⊕</span>
                <span>SYS_{poem.id.toUpperCase().slice(-5)}</span>
              </div>
              <div className={`border px-2 py-1 rounded uppercase font-semibold ${themeStyles.stzBadge}`}>
                {poem.attachments && poem.attachments.length > 0 
                  ? `[SPEC // ${poem.attachments[0].type.toUpperCase()}]` 
                  : '[SPEC // TYPO]'}
              </div>
            </div>

            {/* Middle Focal Target Crosshair Box (only on hover) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-all duration-500 scale-95 group-hover/thumb:scale-100 pointer-events-none">
              <div className={`w-12 h-12 border flex items-center justify-center relative bg-neutral-950/40 backdrop-blur-xs rounded-lg ${
                appTheme === 'light'
                  ? 'border-[#C97F65]/40'
                  : appTheme === 'sankofa'
                  ? 'border-[#bf3f27]/40'
                  : appTheme === 'momoamo'
                  ? 'border-[#E1FE35]/40'
                  : appTheme === 'madrid'
                  ? 'border-[#FDA172]/40'
                  : 'border-cyan-500/30'
              }`}>
                <div className={`absolute top-0 left-0 w-2 h-[1px] ${appTheme === 'light' ? 'bg-[#C97F65]' : appTheme === 'sankofa' ? 'bg-[#bf3f27]' : appTheme === 'momoamo' ? 'bg-[#E1FE35]' : appTheme === 'madrid' ? 'bg-[#FDA172]' : 'bg-cyan-400'}`} />
                <div className={`absolute top-0 left-0 w-[1px] h-2 ${appTheme === 'light' ? 'bg-[#C97F65]' : appTheme === 'sankofa' ? 'bg-[#bf3f27]' : appTheme === 'momoamo' ? 'bg-[#E1FE35]' : appTheme === 'madrid' ? 'bg-[#FDA172]' : 'bg-cyan-400'}`} />
                <div className={`absolute top-0 right-0 w-2 h-[1px] ${appTheme === 'light' ? 'bg-[#C97F65]' : appTheme === 'sankofa' ? 'bg-[#bf3f27]' : appTheme === 'momoamo' ? 'bg-[#E1FE35]' : appTheme === 'madrid' ? 'bg-[#FDA172]' : 'bg-cyan-400'}`} />
                <div className={`absolute top-0 right-0 w-[1px] h-2 ${appTheme === 'light' ? 'bg-[#C97F65]' : appTheme === 'sankofa' ? 'bg-[#bf3f27]' : appTheme === 'momoamo' ? 'bg-[#E1FE35]' : appTheme === 'madrid' ? 'bg-[#FDA172]' : 'bg-cyan-400'}`} />
                <div className={`absolute bottom-0 left-0 w-2 h-[1px] ${appTheme === 'light' ? 'bg-[#C97F65]' : appTheme === 'sankofa' ? 'bg-[#bf3f27]' : appTheme === 'momoamo' ? 'bg-[#E1FE35]' : appTheme === 'madrid' ? 'bg-[#FDA172]' : 'bg-cyan-400'}`} />
                <div className={`absolute bottom-0 left-0 w-[1px] h-2 ${appTheme === 'light' ? 'bg-[#C97F65]' : appTheme === 'sankofa' ? 'bg-[#bf3f27]' : appTheme === 'momoamo' ? 'bg-[#E1FE35]' : appTheme === 'madrid' ? 'bg-[#FDA172]' : 'bg-cyan-400'}`} />
                <div className={`absolute bottom-0 right-0 w-2 h-[1px] ${appTheme === 'light' ? 'bg-[#C97F65]' : appTheme === 'sankofa' ? 'bg-[#bf3f27]' : appTheme === 'momoamo' ? 'bg-[#E1FE35]' : appTheme === 'madrid' ? 'bg-[#FDA172]' : 'bg-cyan-400'}`} />
                <div className={`absolute bottom-0 right-0 w-[1px] h-2 ${appTheme === 'light' ? 'bg-[#C97F65]' : appTheme === 'sankofa' ? 'bg-[#bf3f27]' : appTheme === 'momoamo' ? 'bg-[#E1FE35]' : appTheme === 'madrid' ? 'bg-[#FDA172]' : 'bg-cyan-400'}`} />
                <Maximize2 className={`w-3.5 h-3.5 animate-pulse ${
                  appTheme === 'light' ? 'text-[#C97F65]' : appTheme === 'sankofa' ? 'text-[#bf3f27]' : appTheme === 'momoamo' ? 'text-[#E1FE35]' : appTheme === 'madrid' ? 'text-[#FDA172]' : 'text-cyan-400'
                }`} />
              </div>
            </div>

            {/* Bottom Row: Specs indicators */}
            <div className="flex items-end justify-between font-mono text-[8.5px] leading-none tracking-widest text-neutral-500">
              <div className={`flex items-center gap-1.5 border px-2 py-1 rounded font-semibold ${themeStyles.stzBadge}`}>
                <span>STZ // 0{previewLines.length}</span>
                <span className="text-neutral-800">|</span>
                <span>CHR // {poem.body.length}</span>
              </div>
              <div className={`flex items-center gap-1 font-bold border px-2 py-1 rounded backdrop-blur-xs transition-colors duration-300 ${themeStyles.enlargeBadge}`}>
                <span>✦</span>
                <span className="uppercase text-[7.5px] font-extrabold tracking-widest">Enlarge</span>
              </div>
            </div>
          </div>

          {/* Corner Crosshair Coordinates Marker Deco */}
          <div className="absolute top-0 left-0 w-1 h-[1px] bg-neutral-800 z-10" />
          <div className="absolute top-0 left-0 w-[1px] h-1 bg-neutral-800 z-10" />
          <div className="absolute top-0 right-0 w-1 h-[1px] bg-neutral-800 z-10" />
          <div className="absolute top-0 right-0 w-[1px] h-1 bg-neutral-800 z-10" />
          <div className="absolute bottom-0 left-0 w-1 h-[1px] bg-neutral-800 z-10" />
          <div className="absolute bottom-0 left-0 w-[1px] h-1 bg-neutral-800 z-10" />
          <div className="absolute bottom-0 right-0 w-1 h-[1px] bg-neutral-800 z-10" />
          <div className="absolute bottom-0 right-0 w-[1px] h-1 bg-neutral-800 z-10" />
        </div>

        {/* Title & Poet */}
        <div className="space-y-1 font-display">
          <h4
            id={`card-title-${poem.id}`}
            onClick={() => onSelect(poem)}
            className={`text-base font-bold tracking-tight group-hover:${mColors.accentText} cursor-pointer transition-colors leading-snug line-clamp-1 ${themeStyles.textTitle}`}
          >
            {poem.title}
          </h4>
          <span id={`card-author-${poem.id}`} className="text-xs text-neutral-400 font-mono tracking-tight block">
            by <span className={`font-medium ${themeStyles.textAuthor}`}>{poem.author || 'Anonymous'}</span>
          </span>
        </div>

        {/* Poem Excerpt Preview */}
        {previewLines.length > 0 && (
          <div 
            id={`card-excerpt-${poem.id}`}
            onClick={() => onSelect(poem)}
            className={`relative text-[13px] font-sans leading-relaxed cursor-pointer focus:outline-none pl-3 border-l-2 hover:border-l-current ${mColors.accentText} transition-all duration-300 ${themeStyles.textBody}`}
          >
            <div className="space-y-1">
              {previewLines.map((line, idx) => (
                <p key={idx} className="truncate tracking-tight font-sans italic">{line}</p>
              ))}
              {hasMoreLines && (
                <p className={`text-[10px] ${mColors.accentText} font-bold tracking-widest font-mono mt-2.5 uppercase`}>
                  → Review full verse ({lines.length - 3} lines more)
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Details & Quick Action buttons */}
      <div className={`border-t pt-4 flex items-center justify-between mt-6 transition-colors ${themeStyles.metaBorder}`}>
        {/* Creation Date indicator */}
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 font-mono tracking-wider uppercase">
          <Calendar className="w-3.5 h-3.5 text-neutral-500" />
          <span>{formattedDate}</span>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-0.5">
          <button
            id={`btn-select-poem-${poem.id}`}
            onClick={() => onSelect(poem)}
            className={`p-1.5 rounded-full transition-colors cursor-pointer select-none ${themeStyles.actionBtn}`}
            title="Read Full Details"
          >
            <BookOpen className="w-4 h-4" />
          </button>
          
          {isEditable && (
            <>
              <button
                id={`btn-edit-poem-${poem.id}`}
                onClick={() => onEdit(poem)}
                className={`p-1.5 rounded-full transition-colors cursor-pointer select-none ${themeStyles.actionBtn}`}
                title="Edit Entry"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              {confirmDelete ? (
                <div className={`flex items-center gap-1 rounded-lg p-1 animate-pulse border ${themeStyles.deleteConfirmBg}`}>
                  <button
                    id={`btn-confirm-delete-${poem.id}`}
                    onClick={() => {
                      onDelete(poem.id);
                      setConfirmDelete(false);
                    }}
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md cursor-pointer uppercase font-mono tracking-widest ${themeStyles.deleteBtn}`}
                  >
                    Confirm
                  </button>
                  <button
                    id={`btn-cancel-delete-${poem.id}`}
                    onClick={() => setConfirmDelete(false)}
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md cursor-pointer uppercase font-mono tracking-widest ${themeStyles.dateBtn}`}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  id={`btn-trigger-delete-${poem.id}`}
                  onClick={() => setConfirmDelete(true)}
                  className={`p-1.5 rounded-full transition-colors cursor-pointer ${themeStyles.deleteBtn}`}
                  title="Delete Entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
