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
  const lines = poem.body.split('\n').filter(line => line.trim() !== '');
  const previewLines = lines.slice(0, 3);
  const hasMoreLines = lines.length > 3;

  return (
    <div
      id={`poem-card-${poem.id}`}
      className="group relative flex flex-col justify-between min-h-[365px] h-full bg-white border border-amber-250/40 rounded-xl p-5 shadow-[0_2px_12px_rgba(139,92,26,0.03)] hover:shadow-[0_8px_30px_rgba(139,92,26,0.08)] hover:border-amber-400/80 hover:-translate-y-1 transition-all duration-300 backdrop-blur-md focus-within:ring-2 focus-within:ring-amber-500/10"
    >
      {/* Decorative vertical colored pill line corresponding to the category */}
      <div 
        id={`card-dec-${poem.id}`}
        className="absolute top-6 left-0 w-1 h-12 rounded-r-full opacity-60 group-hover:opacity-100 transition-opacity"
        style={{
          backgroundColor: category?.color?.includes('emerald') ? '#10b981' : 
                          category?.color?.includes('rose') ? '#f43f5e' : 
                          category?.color?.includes('violet') ? '#c084fc' : 
                          category?.color?.includes('amber') ? '#f59e0b' : 
                          category?.color?.includes('sky') ? '#38bdf8' : '#8b5cf6'
        }}
      />

      <div className="space-y-4">
        {/* Category & Mood Headings */}
        <div className="flex items-center justify-between gap-1 overflow-hidden">
          <span
            id={`card-cat-pill-${poem.id}`}
            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${category?.color || 'bg-amber-50 text-amber-800 border-amber-200/50'} truncate flex-1 text-center`}
          >
            {category?.name || 'Uncategorized'}
          </span>
          
          <div className="flex items-center gap-1 shrink-0">
            {poem.attachments && poem.attachments.length > 0 && (
              <span
                id={`card-attach-badge-${poem.id}`}
                className="text-[10px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50 flex items-center gap-0.5 font-sans"
                title={`${poem.attachments.length} media items`}
              >
                <Paperclip className="w-3 h-3 text-amber-700" />
                <span>{poem.attachments.length}</span>
              </span>
            )}

            {poem.mood && (
              <span
                id={`card-mood-pill-${poem.id}`}
                className="text-[10px] font-medium text-amber-950 capitalize bg-amber-50/70 px-2 py-0.5 rounded-md border border-amber-200/50 font-sans"
              >
                🌿 {poem.mood}
              </span>
            )}
          </div>
        </div>

        {/* Media Block (Directly viewable on the tile) */}
        {poem.attachments && poem.attachments.length > 0 && (
          <div 
            id={`card-media-pvw-${poem.id}`}
            onClick={(e) => {
              // Let parent handle clicking if they want to read
              // Just trigger onSelect
              e.stopPropagation();
              onSelect(poem);
            }}
            className="relative w-full h-36 rounded-lg overflow-hidden border border-amber-200/60 bg-amber-50/50 shrink-0 cursor-pointer shadow-inner group-hover:border-amber-300 transition-colors"
          >
            {poem.attachments[0].type === 'image' ? (
              <img
                src={poem.attachments[0].url}
                alt={poem.attachments[0].name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full relative">
                <video
                  src={poem.attachments[0].url}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  muted
                  loop
                  autoPlay
                  playsInline
                />
                <div className="absolute inset-0 bg-stone-900/10 flex items-center justify-center">
                  <span className="p-1 px-2.5 rounded-full text-[9px] bg-amber-950 text-amber-50 flex items-center gap-1 backdrop-blur-xs font-sans font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Video Verse
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Title & Poet */}
        <div className="space-y-1">
          <h4
            id={`card-title-${poem.id}`}
            onClick={() => onSelect(poem)}
            className="text-lg font-serif font-bold text-stone-900 group-hover:text-amber-800 group-hover:underline cursor-pointer transition-colors leading-tight line-clamp-1"
          >
            {poem.title}
          </h4>
          <span id={`card-author-${poem.id}`} className="text-xs text-amber-900/70 block italic font-serif">
            by {poem.author || 'Anonymous Poet'}
          </span>
        </div>

        {/* Poem Excerpt Preview */}
        <div 
          id={`card-excerpt-${poem.id}`}
          onClick={() => onSelect(poem)}
          className="relative text-[13px] font-serif text-stone-700 whitespace-pre-line leading-relaxed italic cursor-pointer focus:outline-none"
        >
          <Quote className="w-8 h-8 absolute -left-1.5 -top-3 text-amber-200/20 -z-[1] pointer-events-none" />
          <div className="pl-2">
            {previewLines.map((line, idx) => (
              <p key={idx} className="truncate">{line}</p>
            ))}
            {hasMoreLines && (
              <p className="text-[11px] text-amber-700 font-semibold tracking-wide font-sans mt-1.5 not-italic">
                ✦ {lines.length - 3} more verses...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer Details & Quick Action buttons */}
      <div className="border-t border-amber-100 pt-4 flex items-center justify-between mt-auto">
        {/* Creation Date indicator */}
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-semibold text-stone-500 font-sans">
          <Calendar className="w-3.5 h-3.5 text-amber-700/60" />
          <span>{formattedDate}</span>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-1">
          <button
            id={`btn-select-poem-${poem.id}`}
            onClick={() => onSelect(poem)}
            className="p-1.5 hover:bg-amber-50 rounded-md text-stone-400 hover:text-amber-700 transition-colors cursor-pointer"
            title="Read Full Poem"
          >
            <BookOpen className="w-4 h-4" />
          </button>
          
          {isEditable && (
            <>
              <button
                id={`btn-edit-poem-${poem.id}`}
                onClick={() => onEdit(poem)}
                className="p-1.5 hover:bg-amber-50 rounded-md text-stone-400 hover:text-amber-700 transition-colors cursor-pointer"
                title="Edit Poem"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              {confirmDelete ? (
                <div className="flex items-center gap-1 bg-rose-50 border border-rose-100 rounded-md p-0.5">
                  <button
                    id={`btn-confirm-delete-${poem.id}`}
                    onClick={() => {
                      onDelete(poem.id);
                      setConfirmDelete(false);
                    }}
                    className="text-[10px] font-bold text-rose-600 px-1.5 py-0.5 hover:bg-rose-100 rounded cursor-pointer"
                  >
                    Delete?
                  </button>
                  <button
                    id={`btn-cancel-delete-${poem.id}`}
                    onClick={() => setConfirmDelete(false)}
                    className="text-[10px] font-medium text-stone-500 px-1.5 py-0.5 hover:bg-amber-50 rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  id={`btn-trigger-delete-${poem.id}`}
                  onClick={() => setConfirmDelete(true)}
                  className="p-1.5 hover:bg-rose-50 rounded-md text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Delete Poem"
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
