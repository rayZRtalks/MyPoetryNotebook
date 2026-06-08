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
  const lines = (poem.body || '').split('\n').filter(line => line.trim() !== '');
  const previewLines = lines.slice(0, 3);
  const hasMoreLines = lines.length > 3;

  return (
    <div
      id={`poem-card-${poem.id}`}
      className="group relative flex flex-col justify-between min-h-[340px] h-full bg-white border border-[#e8e8ed] rounded-2xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.015)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.05)] hover:border-[#d2d2d7] transition-all duration-300 backdrop-blur-md focus-within:ring-2 focus-within:ring-[#0071e3]/20"
    >
      <div className="space-y-4">
        {/* Category & Mood Headings */}
        <div className="flex items-center justify-between gap-1 overflow-hidden">
          <span
            id={`card-cat-pill-${poem.id}`}
            className="inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#f5f5f7] text-[#1d1d1f] border border-[#e8e8ed] truncate flex-1 text-center font-sans uppercase tracking-wider"
          >
            {category?.name || 'Uncategorized'}
          </span>
          
          <div className="flex items-center gap-1 shrink-0">
            {poem.attachments && poem.attachments.length > 0 && (
              <span
                id={`card-attach-badge-${poem.id}`}
                className="text-[10px] font-semibold text-[#1d1d1f] bg-[#f5f5f7] px-2 py-1 rounded-full border border-[#e8e8ed] flex items-center gap-0.5 font-sans"
                title={`${poem.attachments.length} media items`}
              >
                <Paperclip className="w-3 h-3 text-[#86868b]" />
                <span>{poem.attachments.length}</span>
              </span>
            )}

            {poem.mood && (
              <span
                id={`card-mood-pill-${poem.id}`}
                className="text-[10px] font-semibold text-[#515154] capitalize bg-[#f5f5f7] px-2.5 py-1 rounded-full border border-[#e8e8ed] font-sans"
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
            className="relative w-full h-36 rounded-xl overflow-hidden border border-[#e8e8ed] bg-[#f5f5f7] shrink-0 cursor-pointer shadow-sm group-hover:border-[#d2d2d7] transition-all duration-300"
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
                <div className="absolute inset-0 bg-[#1d1d1f]/10 flex items-center justify-center">
                  <span className="p-1 px-2.5 rounded-full text-[9px] bg-[#1d1d1f]/95 text-[#f5f5f7] flex items-center gap-1 backdrop-blur-sm font-sans font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0071e3] animate-pulse" />
                    Video Reading
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Title & Poet */}
        <div className="space-y-0.5">
          <h4
            id={`card-title-${poem.id}`}
            onClick={() => onSelect(poem)}
            className="text-base font-sans font-bold text-[#1d1d1f] tracking-tight group-hover:text-[#0071e3] cursor-pointer transition-colors leading-snug line-clamp-1"
          >
            {poem.title}
          </h4>
          <span id={`card-author-${poem.id}`} className="text-xs text-[#86868b] block font-sans tracking-tight">
            by {poem.author || 'Anonymous'}
          </span>
        </div>

        {/* Poem Excerpt Preview */}
        {previewLines.length > 0 && (
          <div 
            id={`card-excerpt-${poem.id}`}
            onClick={() => onSelect(poem)}
            className="relative text-[13px] font-sans text-[#515154] leading-relaxed cursor-pointer focus:outline-none pl-3 border-l-2 border-[#e8e8ed] hover:border-[#0071e3]/45 transition-colors"
          >
            <div className="space-y-1">
              {previewLines.map((line, idx) => (
                <p key={idx} className="truncate tracking-tight font-medium">{line}</p>
              ))}
              {hasMoreLines && (
                <p className="text-[10px] text-[#0071e3] font-semibold tracking-tight font-sans mt-2">
                  → Read complete details ({lines.length - 3} more lines)
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Details & Quick Action buttons */}
      <div className="border-t border-[#e8e8ed] pt-4 flex items-center justify-between mt-6">
        {/* Creation Date indicator */}
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-[#86868b] font-sans tracking-tight">
          <Calendar className="w-3.5 h-3.5 text-[#86868b]/70" />
          <span>{formattedDate}</span>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-0.5">
          <button
            id={`btn-select-poem-${poem.id}`}
            onClick={() => onSelect(poem)}
            className="p-1.5 hover:bg-[#f5f5f7] rounded-full text-[#86868b] hover:text-[#0071e3] transition-colors cursor-pointer"
            title="Read Full Details"
          >
            <BookOpen className="w-4 h-4" />
          </button>
          
          {isEditable && (
            <>
              <button
                id={`btn-edit-poem-${poem.id}`}
                onClick={() => onEdit(poem)}
                className="p-1.5 hover:bg-[#f5f5f7] rounded-full text-[#86868b] hover:text-[#0071e3] transition-colors cursor-pointer"
                title="Edit Entry"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              {confirmDelete ? (
                <div className="flex items-center gap-1 bg-red-50 border border-red-100 rounded-lg p-0.5">
                  <button
                    id={`btn-confirm-delete-${poem.id}`}
                    onClick={() => {
                      onDelete(poem.id);
                      setConfirmDelete(false);
                    }}
                    className="text-[10px] font-bold text-red-600 px-2 py-0.5 hover:bg-red-100 rounded-md cursor-pointer"
                  >
                    Delete
                  </button>
                  <button
                    id={`btn-cancel-delete-${poem.id}`}
                    onClick={() => setConfirmDelete(false)}
                    className="text-[10px] font-medium text-[#86868b] px-2 py-0.5 hover:bg-[#f5f5f7] rounded-md cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  id={`btn-trigger-delete-${poem.id}`}
                  onClick={() => setConfirmDelete(true)}
                  className="p-1.5 hover:bg-red-50 rounded-full text-[#86868b] hover:text-red-600 transition-colors cursor-pointer"
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
