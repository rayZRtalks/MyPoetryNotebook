import React, { useState } from 'react';
import { Poem, Category } from '../types';
import { Edit3, Trash2, Calendar, BookOpen, Quote, Tag, Paperclip } from 'lucide-react';

interface PoemCardProps {
  poem: Poem;
  categories: Category[];
  onSelect: (poem: Poem) => void;
  onEdit: (poem: Poem) => void;
  onDelete: (id: string) => void;
}

export default function PoemCard({
  poem,
  categories,
  onSelect,
  onEdit,
  onDelete,
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
      className="group relative flex flex-col justify-between h-80 bg-[#0c102a]/70 border border-slate-900 rounded-xl p-6 shadow-md hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] hover:border-amber-500/30 hover:-translate-y-0.5 transition-all duration-300 backdrop-blur-sm"
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
            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${category?.color || 'bg-slate-900 text-slate-300 border-slate-800'} truncate flex-1 text-center`}
          >
            {category?.name || 'Uncategorized'}
          </span>
          
          <div className="flex items-center gap-1 shrink-0">
            {poem.attachments && poem.attachments.length > 0 && (
              <span
                id={`card-attach-badge-${poem.id}`}
                className="text-[10px] font-bold text-slate-300 bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-800 flex items-center gap-0.5"
                title={`${poem.attachments.length} attachments`}
              >
                <Paperclip className="w-3 h-3 text-slate-500" />
                <span>{poem.attachments.length}</span>
              </span>
            )}

            {poem.mood && (
              <span
                id={`card-mood-pill-${poem.id}`}
                className="text-[10px] font-medium text-amber-200/90 capitalize bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-800"
              >
                🌿 {poem.mood}
              </span>
            )}
          </div>
        </div>

        {/* Title & Poet */}
        <div className="space-y-1">
          <h4
            id={`card-title-${poem.id}`}
            onClick={() => onSelect(poem)}
            className="text-lg font-serif font-semibold text-slate-200 group-hover:text-amber-400 group-hover:underline cursor-pointer transition-colors leading-tight line-clamp-1"
          >
            {poem.title}
          </h4>
          <span id={`card-author-${poem.id}`} className="text-xs text-slate-450 block italic font-serif">
            by {poem.author || 'Anonymous Poet'}
          </span>
        </div>

        {/* Poem Excerpt Preview */}
        <div 
          id={`card-excerpt-${poem.id}`}
          onClick={() => onSelect(poem)}
          className="relative text-[13px] font-serif text-slate-300 whitespace-pre-line leading-relaxed italic cursor-pointer focus:outline-none"
        >
          <Quote className="w-8 h-8 absolute -left-1.5 -top-3 text-slate-800/40 -z-[1] pointer-events-none" />
          <div className="pl-2">
            {previewLines.map((line, idx) => (
              <p key={idx} className="truncate">{line}</p>
            ))}
            {hasMoreLines && (
              <p className="text-[11px] text-amber-500/70 tracking-wide font-sans mt-1.5 not-italic">
                ✦ {lines.length - 3} more verses...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer Details & Quick Action buttons */}
      <div className="border-t border-slate-900 pt-4 flex items-center justify-between mt-auto">
        {/* Creation Date indicator */}
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-semibold text-slate-500">
          <Calendar className="w-3.5 h-3.5 text-slate-600" />
          <span>{formattedDate}</span>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-1">
          <button
            id={`btn-select-poem-${poem.id}`}
            onClick={() => onSelect(poem)}
            className="p-1.5 hover:bg-slate-900 rounded-md text-slate-400 hover:text-amber-400 transition-colors"
            title="Read Full Poem"
          >
            <BookOpen className="w-4 h-4" />
          </button>
          
          <button
            id={`btn-edit-poem-${poem.id}`}
            onClick={() => onEdit(poem)}
            className="p-1.5 hover:bg-slate-900 rounded-md text-slate-400 hover:text-amber-400 transition-colors"
            title="Edit Poem"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          {confirmDelete ? (
            <div className="flex items-center gap-1 bg-[#1a0f1d] border border-rose-950 rounded-md p-0.5">
              <button
                id={`btn-confirm-delete-${poem.id}`}
                onClick={() => {
                  onDelete(poem.id);
                  setConfirmDelete(false);
                }}
                className="text-[10px] font-bold text-rose-400 px-1.5 py-0.5 hover:bg-rose-900/40 rounded"
              >
                Delete?
              </button>
              <button
                id={`btn-cancel-delete-${poem.id}`}
                onClick={() => setConfirmDelete(false)}
                className="text-[10px] font-medium text-slate-400 px-1.5 py-0.5 hover:bg-slate-900 rounded"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              id={`btn-trigger-delete-${poem.id}`}
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 hover:bg-rose-950/40 rounded-md text-slate-500 hover:text-rose-400 transition-colors"
              title="Delete Poem"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
