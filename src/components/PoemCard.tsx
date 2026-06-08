import React, { useState } from 'react';
import { Poem, Category } from '../types';
import { Edit3, Trash2, Calendar, BookOpen, Quote, Tag, Paperclip } from 'lucide-react';

interface PoemCardProps {
  poem: Poem;
  categories: Category[];
  onSelect: (poem: Poem) => void;
  onEdit: (poem: Poem) => void;
  onDelete: (id: string) => void;
  isEditable?: boolean;
}

const getMoodColor = (mood?: string) => {
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
  const mColors = getMoodColor(poem.mood);

  return (
    <div
      id={`poem-card-${poem.id}`}
      className={`group relative flex flex-col justify-between min-h-[340px] h-full bg-[#111218]/90 border border-neutral-800/80 rounded-2xl p-6 shadow-2xl transition-all duration-300 backdrop-blur-md focus-within:ring-2 focus-within:ring-cyan-500/30 ${mColors.glow}`}
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
                className="text-[10px] font-bold text-cyan-400 bg-cyan-950/30 px-2.5 py-1 rounded-full border border-cyan-850/40 flex items-center gap-0.5 font-sans"
                title={`${poem.attachments.length} media items`}
              >
                <Paperclip className="w-3 h-3 text-cyan-400" />
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

        {/* Media Block (Directly viewable on the tile) */}
        {poem.attachments && poem.attachments.length > 0 && (
          <div 
            id={`card-media-pvw-${poem.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(poem);
            }}
            className="relative w-full h-36 rounded-xl overflow-hidden border border-neutral-800/85 bg-neutral-950 shrink-0 cursor-pointer shadow-md group-hover:border-neutral-700/80 transition-all duration-300"
          >
            {poem.attachments[0].type === 'image' ? (
              <img
                src={poem.attachments[0].url}
                alt={poem.attachments[0].name}
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 ease-out"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full relative">
                <video
                  src={poem.attachments[0].url}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 ease-out"
                  muted
                  loop
                  autoPlay
                  playsInline
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <span className="p-1 px-2.5 rounded-full text-[9px] bg-neutral-900/95 text-white border border-neutral-800 flex items-center gap-1 backdrop-blur-xs font-mono font-bold tracking-wider uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    Video Reading
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

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
            className="p-1.5 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-cyan-400 transition-colors cursor-pointer"
            title="Read Full Details"
          >
            <BookOpen className="w-4 h-4" />
          </button>
          
          {isEditable && (
            <>
              <button
                id={`btn-edit-poem-${poem.id}`}
                onClick={() => onEdit(poem)}
                className="p-1.5 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-cyan-400 transition-colors cursor-pointer"
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
