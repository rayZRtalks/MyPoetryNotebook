import React, { useState } from 'react';
import { Poem, Category } from '../types';
import { X, Copy, Check, Edit3, Calendar, Tag, BookOpen } from 'lucide-react';

interface PoemReaderProps {
  poem: Poem;
  categories: Category[];
  onClose: () => void;
  onEdit: (poem: Poem) => void;
  isEditable?: boolean;
}

export default function PoemReader({
  poem,
  categories,
  onClose,
  onEdit,
  isEditable = true,
}: PoemReaderProps) {
  const [copied, setCopied] = useState(false);
  const category = categories.find((c) => c.id === poem.categoryId);

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

  const formattedDate = new Date(poem.createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div id="poem-reader-modal" className="space-y-6">
      {/* Header and top buttons */}
      <div className="flex items-center justify-between border-b pb-4 border-amber-100">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-600" />
          <span id="reader-heading" className="text-xs uppercase font-bold text-stone-500 tracking-widest font-sans">
            Reading Vault
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Copy Button */}
          <button
            id="btn-copy-poem"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-700 hover:text-amber-950 hover:bg-amber-50 bg-white rounded-lg border border-amber-200 transition-all font-medium cursor-pointer"
            title="Copy entire poem to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-stone-400" />
                <span>Copy Text</span>
              </>
            )}
          </button>

          {/* Edit Button */}
          {isEditable && (
            <button
              id="btn-edit-from-reader"
              onClick={() => {
                onEdit(poem);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-700 hover:text-amber-950 hover:bg-amber-50 bg-white rounded-lg border border-amber-200 transition-all font-medium cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-stone-500" />
              <span>Edit</span>
            </button>
          )}

          {/* Close Modal button */}
          <button
            id="btn-close-reader"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 rounded-full p-1.5 hover:bg-amber-50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Styled Poem Parchment */}
      <div 
        id="poem-parchment"
        className="bg-[#FCFAF2] border border-amber-200/50 p-8 sm:p-12 rounded-2xl shadow-inner max-h-[60vh] overflow-y-auto"
        style={{
          boxShadow: 'inset 0 2px 10px rgba(139,92,26,0.03), 0 1px 2px rgba(139,92,26,0.01)',
        }}
      >
        <div className="text-center space-y-4 max-w-xl mx-auto">
          {/* Category Pill centered */}
          <div>
            <span
              id="reader-cat"
              className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold border tracking-wider uppercase ${category?.color || 'bg-amber-50 text-amber-800 border-amber-200/50'}`}
            >
              {category?.name || 'Uncategorized'}
            </span>
          </div>

          {/* Title */}
          <h2 id="reader-title" className="text-2xl sm:text-3xl font-serif font-black tracking-tight leading-snug text-amber-950">
            {poem.title}
          </h2>

          {/* Author/Poet line */}
          <p id="reader-author" className="text-sm font-serif italic text-stone-500">
            composed by {poem.author || 'Anonymous'}
          </p>

          <div className="w-12 h-[1px] bg-amber-500/20 mx-auto my-6" />

          {/* Body Block */}
          <div 
            id="reader-body"
            className="font-serif text-[15px] sm:text-base text-stone-900 leading-8 whitespace-pre-wrap text-left inline-block pl-4 sm:pl-8 border-l-2 border-amber-500/30 max-w-full font-medium"
          >
            {poem.body}
          </div>

          {/* Direct Media Presentation (Directly integrated on parchment) */}
          {poem.attachments && poem.attachments.length > 0 && (
            <div id="reader-media-gallery" className="mt-10 text-left space-y-6 max-w-xl mx-auto border-t border-amber-150/40 pt-8">
              {poem.attachments.map((attach) => (
                <div
                  id={`reader-attach-card-${attach.id}`}
                  key={attach.id}
                  className="border border-amber-200 rounded-xl overflow-hidden bg-white shadow-sm relative group"
                >
                  <div className="p-3 bg-amber-50/20 flex justify-center items-center">
                    {attach.type === 'image' ? (
                      <img
                        src={attach.url}
                        alt={attach.name}
                        className="max-h-[300px] object-contain rounded-lg border border-amber-100 shadow-xs"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <video
                        src={attach.url}
                        controls
                        className="max-h-[300px] rounded-lg border border-amber-150 shadow-xs bg-amber-950"
                        playsInline
                      />
                    )}
                  </div>
                  {/* Subtle info tag inside the reader container */}
                  <div className="absolute right-3.5 bottom-3.5 px-2 py-1 bg-amber-950 text-amber-50 rounded text-[9px] font-semibold uppercase tracking-wider font-sans shadow-xs">
                    {attach.type === 'image' ? '✦ Verse Illustration' : '✦ Video Reading'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Details & tags bottom */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t pt-4 border-amber-100 mt-4">
        {/* Date line */}
        <div className="flex items-center gap-2 text-xs text-stone-550">
          <Calendar className="w-4 h-4 text-amber-700/60" />
          <span>Catalogued on {formattedDate}</span>
        </div>

        {/* Tags */}
        {poem.tags && poem.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1 mr-1">
              <Tag className="w-3 h-3 text-amber-700/60" /> Motifs:
            </span>
            {poem.tags.map((tag, idx) => (
              <span
                id={`reader-tag-pill-${idx}`}
                key={idx}
                className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-medium text-[11px] px-2.5 py-0.5 rounded-full transition-colors"
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
