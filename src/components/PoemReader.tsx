import React, { useState } from 'react';
import { Poem, Category } from '../types';
import { X, Copy, Check, Edit3, Calendar, Tag, BookOpen } from 'lucide-react';

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
    <div id="poem-reader-modal" className="space-y-6 text-neutral-200">
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
        className="bg-[#14151f] border border-neutral-800 shadow-inner p-8 sm:p-12 rounded-2xl max-h-[60vh] overflow-y-auto"
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
                      />
                    ) : (
                      <video
                        src={attach.url}
                        className="max-h-[300px] rounded-xl border border-neutral-850 w-full bg-neutral-900 transition-transform duration-300 group-hover/media:scale-102"
                        muted
                        loop
                        autoPlay
                        playsInline
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
