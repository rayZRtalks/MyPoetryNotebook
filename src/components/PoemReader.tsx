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
      <div className="flex items-center justify-between border-b pb-4 border-[#e8e8ed]">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#0071e3]" />
          <span id="reader-heading" className="text-xs uppercase font-bold text-[#86868b] tracking-widest font-sans">
            Reading Vault
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Copy Button */}
          <button
            id="btn-copy-poem"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs text-[#1d1d1f] hover:bg-[#e8e8ed] bg-[#f5f5f7] rounded-full border border-[#e8e8ed] transition-all font-semibold cursor-pointer font-sans"
            title="Copy entry details to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#86868b]" />
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs text-[#1d1d1f] hover:bg-[#e8e8ed] bg-[#f5f5f7] rounded-full border border-[#e8e8ed] transition-all font-semibold cursor-pointer font-sans"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#86868b]" />
              <span>Edit</span>
            </button>
          )}

          {/* Close Modal button */}
          <button
            id="btn-close-reader"
            onClick={onClose}
            className="text-[#86868b] hover:text-[#1d1d1f] rounded-full p-1.5 hover:bg-[#f5f5f7] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Styled Poem Parchment */}
      <div 
        id="poem-parchment"
        className="bg-white border border-[#e8e8ed] p-8 sm:p-12 rounded-2xl shadow-sm max-h-[60vh] overflow-y-auto"
      >
        <div className="text-center space-y-4 max-w-xl mx-auto">
          {/* Category Pill centered */}
          <div>
            <span
              id="reader-cat"
              className="inline-block px-3 py-1 rounded-full text-[10px] font-bold border tracking-wider uppercase bg-[#f5f5f7] text-[#1d1d1f] border-[#e8e8ed] font-sans"
            >
              {category?.name || 'Uncategorized'}
            </span>
          </div>

          {/* Title */}
          <h2 id="reader-title" className="text-2xl sm:text-3xl font-sans font-black tracking-tight leading-snug text-[#1d1d1f]">
            {poem.title}
          </h2>

          {/* Author/Poet line */}
          <p id="reader-author" className="text-sm font-sans text-[#86868b] tracking-tight">
            composed by <span className="font-semibold text-[#515154]">{poem.author || 'Anonymous'}</span>
          </p>

          {poem.body && poem.body.trim() && (
            <>
              <div className="w-12 h-[1px] bg-[#e8e8ed] mx-auto my-6" />

              {/* Body Block */}
              <div 
                id="reader-body"
                className="font-serif text-[15px] sm:text-base text-[#1d1d1f] leading-8 whitespace-pre-wrap text-left inline-block pl-4 sm:pl-8 border-l-2 border-[#0071e3]/30 max-w-full font-medium"
              >
                {poem.body}
              </div>
            </>
          )}

          {/* Direct Media Presentation (Directly integrated on parchment) */}
          {poem.attachments && poem.attachments.length > 0 && (
            <div id="reader-media-gallery" className="mt-10 text-left space-y-6 max-w-xl mx-auto border-t border-[#e8e8ed] pt-8">
              {poem.attachments.map((attach) => (
                <div
                  id={`reader-attach-card-${attach.id}`}
                  key={attach.id}
                  className="border border-[#e8e8ed] rounded-2xl overflow-hidden bg-[#f5f5f7] shadow-xs relative group"
                >
                  <div className="p-3 flex justify-center items-center">
                    {attach.type === 'image' ? (
                      <img
                        src={attach.url}
                        alt={attach.name}
                        className="max-h-[300px] object-contain rounded-xl border border-[#e8e8ed] bg-white w-full"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <video
                        src={attach.url}
                        controls
                        className="max-h-[300px] rounded-xl border border-[#e8e8ed] w-full bg-[#1d1d1f]"
                        playsInline
                      />
                    )}
                  </div>
                  {/* Subtle info tag inside the reader container */}
                  <div className="absolute right-4 bottom-4 px-2.5 py-1 bg-[#1d1d1f]/95 text-white rounded-full text-[9px] font-semibold uppercase tracking-wider font-sans shadow-md">
                    {attach.type === 'image' ? '✦ Verse Illustration' : '✦ Video Reading'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Details & tags bottom */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t pt-4 border-[#e8e8ed] mt-4">
        {/* Date line */}
        <div className="flex items-center gap-2 text-xs text-[#86868b] font-sans">
          <Calendar className="w-4 h-4 text-[#86868b]/70" />
          <span>Catalogued on {formattedDate}</span>
        </div>

        {/* Tags */}
        {poem.tags && poem.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider flex items-center gap-1 mr-1 font-sans">
              <Tag className="w-3 h-3 text-[#86868b]/70" /> Motifs:
            </span>
            {poem.tags.map((tag, idx) => (
              <span
                id={`reader-tag-pill-${idx}`}
                key={idx}
                className="bg-[#f5f5f7] hover:bg-[#e8e8ed] border border-[#e8e8ed] text-[#1d1d1f] font-semibold text-[11px] px-3 py-1 rounded-full transition-colors font-sans"
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
