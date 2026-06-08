import React, { useState } from 'react';
import { Poem, Category } from '../types';
import { Edit3, Trash2, Calendar, BookOpen, Quote, Tag, Paperclip, Maximize2, Play, Eye } from 'lucide-react';

interface PoemCardProps {
  poem: Poem;
  categories: Category[];
  onSelect: (poem: Poem) => void;
  onEdit: (poem: Poem) => void;
  onDelete: (id: string) => void;
  isEditable?: boolean;
  onSelectMedia?: (poem: Poem) => void; // Triggered when the media thumbnail is clicked for lightbox
  appTheme?: 'multicolor' | 'amber-eclipse';
}

const getMoodColor = (mood?: string, appTheme: 'multicolor' | 'amber-eclipse' = 'multicolor') => {
  if (appTheme === 'amber-eclipse') {
    return {
      badge: 'bg-amber-950/40 text-amber-400 border-amber-800/50 shadow-[0_0_10px_rgba(245,158,11,0.05)]',
      glow: 'hover:border-amber-500/70 hover:shadow-[0_0_25px_rgba(245,158,11,0.22)] hover:bg-amber-950/20 focus-within:ring-amber-500/30',
      accentText: 'text-amber-400',
      accentBg: 'bg-amber-500/10'
    };
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

export default function PoemCard({
  poem,
  categories,
  onSelect,
  onEdit,
  onDelete,
  isEditable = true,
  onSelectMedia,
  appTheme = 'multicolor',
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

  // Extract letter specimens for foundry asset representation
  const leadInitials = poem.title.split(' ').map(w => w ? w[0] : '').join('').slice(0, 2).toUpperCase() || poem.title.slice(0, 2).toUpperCase();

  return (
    <div
      id={`poem-card-${poem.id}`}
      className={`group relative flex flex-col justify-between min-h-[340px] h-full bg-[#111218]/95 border border-neutral-800/80 rounded-2xl p-6 shadow-2xl transition-all duration-300 backdrop-blur-md focus-within:ring-2 focus-within:ring-cyan-500/30 ${mColors.glow}`}
    >
      <div className="space-y-4">
        {/* Category & Mood Headings */}
        <div className="flex items-center justify-between gap-1 overflow-hidden">
          <span
            id={`card-cat-pill-${poem.id}`}
            className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#181920] text-zinc-300 border border-[#272832] truncate flex-1 text-center font-display uppercase tracking-widest"
          >
            {category?.name || 'Uncategorized'}
          </span>
          
          <div className="flex items-center gap-1 shrink-0">
            {poem.attachments && poem.attachments.length > 0 && (
              <span
                id={`card-attach-badge-${poem.id}`}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-0.5 font-sans ${
                  appTheme === 'amber-eclipse'
                    ? 'text-amber-400 bg-amber-950/30 border-amber-850/40'
                    : 'text-cyan-400 bg-cyan-950/30 border-cyan-850/40'
                }`}
                title={`${poem.attachments.length} media items`}
              >
                <Paperclip className={`w-3 h-3 ${appTheme === 'amber-eclipse' ? 'text-amber-400' : 'text-cyan-400'}`} />
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
          className="relative w-full h-44 rounded-xl overflow-hidden border border-neutral-800/80 bg-neutral-950 shrink-0 cursor-pointer shadow-md group/thumb transition-all duration-300"
        >
          {/* Background Grid & Scanlines (Absolute Specimen Overlay) */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px] opacity-65 z-1 pointer-events-none" />
          
          {/* Subtle Ambient Radial Highlight */}
          <div className={`absolute inset-0 transition-all duration-500 z-1 pointer-events-none ${
            appTheme === 'amber-eclipse'
              ? 'bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.02)_0%,transparent_70%)] group-hover/thumb:bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08)_0%,transparent_60%)]'
              : 'bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.02)_0%,transparent_70%)] group-hover/thumb:bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.08)_0%,transparent_60%)]'
          }`} />

          {/* Large Typographic Background Initial */}
          <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none z-1 overflow-hidden">
            <span className={`font-sans font-black text-[6.5rem] leading-none text-neutral-900/50 tracking-tighter uppercase transition-all duration-750 ease-out group-hover/thumb:scale-110 ${
              appTheme === 'amber-eclipse' ? 'group-hover/thumb:text-amber-500/10' : 'group-hover/thumb:text-cyan-500/10'
            }`}>
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
                  className="w-full h-full object-cover grayscale opacity-55 contrast-[1.05] brightness-[1.02] group-hover/thumb:opacity-90 group-hover/thumb:grayscale-0 group-hover/thumb:scale-105 transition-all duration-750 ease-out"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full relative">
                  <video
                    src={poem.attachments[0].url}
                    className="w-full h-full object-cover grayscale opacity-55 group-hover/thumb:opacity-90 group-hover/thumb:grayscale-0 group-hover/thumb:scale-105 transition-all duration-750 ease-out"
                    muted
                    loop
                    autoPlay
                    playsInline
                  />
                  <div className={`absolute top-2.5 left-2.5 z-10 flex items-center gap-1 bg-neutral-950/80 px-2 py-0.5 rounded-md border border-neutral-800 text-[8px] uppercase tracking-wider font-mono ${
                    appTheme === 'amber-eclipse' ? 'text-amber-400' : 'text-cyan-400'
                  }`}>
                    <span className={`w-1 h-1 rounded-full animate-pulse ${appTheme === 'amber-eclipse' ? 'bg-amber-400' : 'bg-cyan-400'}`} />
                    Live Motion
                  </div>
                </div>
              )}
              {/* Vignette Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/95 via-neutral-950/10 to-neutral-950/40 opacity-70 group-hover/thumb:opacity-40 transition-all duration-500" />
            </div>
          ) : (
            // Exquisite fallback CSS typography specimen grid item
            <div className={`absolute inset-0 w-full h-full z-2 bg-[#0c0d14]/70 object-cover transition-all duration-500 ${
              appTheme === 'amber-eclipse' ? 'group-hover/thumb:bg-amber-950/10' : 'group-hover/thumb:bg-cyan-950/10'
            }`}>
              {/* Render dynamic background glyph grids typical of font spec sheets */}
              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between select-none pointer-events-none text-[8px] uppercase font-mono text-neutral-800/50 tracking-widest leading-loose">
                <div>a b c d e f g h i j k l m</div>
                <div>n o p q r s t u v w x y z</div>
              </div>
            </div>
          )}

          {/* Front-Facing Fine-Line Metadata Blueprint Overlays */}
          <div className="absolute inset-0 z-3 p-3 flex flex-col justify-between pointer-events-none select-none">
            {/* Top Row: System identifiers & Media types */}
            <div className="flex items-start justify-between font-mono text-[8.5px] leading-none tracking-widest">
              <div className="flex items-center gap-1.5 bg-neutral-950/80 border border-neutral-900 px-2 py-1 rounded text-neutral-400 font-semibold uppercase">
                <span className={appTheme === 'amber-eclipse' ? 'text-amber-400' : 'text-cyan-400'}>⊕</span>
                <span>SYS_{poem.id.toUpperCase().slice(-5)}</span>
              </div>
              <div className="bg-neutral-950/80 border border-neutral-900 px-2 py-1 rounded text-neutral-400 uppercase font-semibold">
                {poem.attachments && poem.attachments.length > 0 
                  ? `[SPEC // ${poem.attachments[0].type.toUpperCase()}]` 
                  : '[SPEC // TYPO]'}
              </div>
            </div>

            {/* Middle Focal Target Crosshair Box (only on hover) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-all duration-500 scale-95 group-hover/thumb:scale-100 pointer-events-none">
              <div className={`w-12 h-12 border flex items-center justify-center relative bg-neutral-950/40 backdrop-blur-xs rounded-lg ${
                appTheme === 'amber-eclipse' ? 'border-amber-500/30' : 'border-cyan-500/30'
              }`}>
                <div className={`absolute top-0 left-0 w-2 h-[1px] ${appTheme === 'amber-eclipse' ? 'bg-amber-400' : 'bg-cyan-400'}`} />
                <div className={`absolute top-0 left-0 w-[1px] h-2 ${appTheme === 'amber-eclipse' ? 'bg-amber-400' : 'bg-cyan-400'}`} />
                <div className={`absolute top-0 right-0 w-2 h-[1px] ${appTheme === 'amber-eclipse' ? 'bg-amber-400' : 'bg-cyan-400'}`} />
                <div className={`absolute top-0 right-0 w-[1px] h-2 ${appTheme === 'amber-eclipse' ? 'bg-amber-400' : 'bg-cyan-400'}`} />
                <div className={`absolute bottom-0 left-0 w-2 h-[1px] ${appTheme === 'amber-eclipse' ? 'bg-amber-400' : 'bg-cyan-400'}`} />
                <div className={`absolute bottom-0 left-0 w-[1px] h-2 ${appTheme === 'amber-eclipse' ? 'bg-amber-400' : 'bg-cyan-400'}`} />
                <div className={`absolute bottom-0 right-0 w-2 h-[1px] ${appTheme === 'amber-eclipse' ? 'bg-amber-400' : 'bg-cyan-400'}`} />
                <div className={`absolute bottom-0 right-0 w-[1px] h-2 ${appTheme === 'amber-eclipse' ? 'bg-amber-400' : 'bg-cyan-400'}`} />
                {appTheme === 'amber-eclipse' ? (
                  <Maximize2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                )}
              </div>
            </div>

            {/* Bottom Row: Specs indicators */}
            <div className="flex items-end justify-between font-mono text-[8.5px] leading-none tracking-widest text-neutral-500">
              <div className="flex items-center gap-1.5 bg-neutral-950/80 border border-neutral-900 px-2 py-1 rounded text-neutral-400 font-semibold">
                <span>STZ // 0{previewLines.length}</span>
                <span className="text-neutral-800">|</span>
                <span>CHR // {poem.body.length}</span>
              </div>
              <div className={`flex items-center gap-1 font-bold border px-2 py-1 rounded backdrop-blur-xs transition-all duration-300 ${
                appTheme === 'amber-eclipse'
                  ? 'text-amber-400 bg-amber-950/60 border-amber-900/60 group-hover/thumb:bg-amber-500 group-hover/thumb:text-neutral-950 group-hover/thumb:border-amber-400'
                  : 'text-cyan-400 bg-cyan-950/60 border-cyan-900/60 group-hover/thumb:bg-cyan-500 group-hover/thumb:text-neutral-950 group-hover/thumb:border-cyan-400'
              }`}>
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
            className={`text-base font-bold text-neutral-100 tracking-tight group-hover:${mColors.accentText} cursor-pointer transition-colors leading-snug line-clamp-1`}
          >
            {poem.title}
          </h4>
          <span id={`card-author-${poem.id}`} className="text-xs text-neutral-400 font-mono tracking-tight block">
            by <span className="text-neutral-200 font-medium">{poem.author || 'Anonymous'}</span>
          </span>
        </div>

        {/* Poem Excerpt Preview */}
        {previewLines.length > 0 && (
          <div 
            id={`card-excerpt-${poem.id}`}
            onClick={() => onSelect(poem)}
            className={`relative text-[13px] font-sans text-neutral-350 leading-relaxed cursor-pointer focus:outline-none pl-3 border-l-2 border-neutral-800/80 hover:border-l-current ${mColors.accentText} transition-all duration-300`}
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
      <div className="border-t border-neutral-800/80 pt-4 flex items-center justify-between mt-6">
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
            className={`p-1.5 hover:bg-neutral-800 rounded-full text-neutral-400 ${
              appTheme === 'amber-eclipse' ? 'hover:text-amber-400' : 'hover:text-cyan-400'
            } transition-colors cursor-pointer`}
            title="Read Full Details"
          >
            <BookOpen className="w-4 h-4" />
          </button>
          
          {isEditable && (
            <>
              <button
                id={`btn-edit-poem-${poem.id}`}
                onClick={() => onEdit(poem)}
                className={`p-1.5 hover:bg-neutral-800 rounded-full text-neutral-400 ${
                  appTheme === 'amber-eclipse' ? 'hover:text-amber-400' : 'hover:text-cyan-400'
                } transition-colors cursor-pointer`}
                title="Edit Entry"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              {confirmDelete ? (
                <div className="flex items-center gap-1 bg-red-950/40 border border-red-900/50 rounded-lg p-1 animate-pulse">
                  <button
                    id={`btn-confirm-delete-${poem.id}`}
                    onClick={() => {
                      onDelete(poem.id);
                      setConfirmDelete(false);
                    }}
                    className="text-[9px] font-extrabold text-red-400 px-2 py-0.5 hover:bg-red-900/40 rounded-md cursor-pointer uppercase font-mono tracking-widest"
                  >
                    Confirm
                  </button>
                  <button
                    id={`btn-cancel-delete-${poem.id}`}
                    onClick={() => setConfirmDelete(false)}
                    className="text-[9px] font-extrabold text-neutral-400 px-2 py-0.5 hover:bg-neutral-800 rounded-md cursor-pointer uppercase font-mono tracking-widest"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  id={`btn-trigger-delete-${poem.id}`}
                  onClick={() => setConfirmDelete(true)}
                  className="p-1.5 hover:bg-red-950/40 rounded-full text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
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
