import React, { useState } from 'react';
import { Poem, Category } from '../types';
import { X, Copy, Check, Edit3, Calendar, Tag, BookOpen } from 'lucide-react';

interface PoemReaderProps {
  poem: Poem;
  categories: Category[];
  onClose: () => void;
  onEdit: (poem: Poem) => void;
}

export default function PoemReader({
  poem,
  categories,
  onClose,
  onEdit,
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
      <div className="flex items-center justify-between border-b pb-4 border-slate-850">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" />
          <span id="reader-heading" className="text-xs uppercase font-bold text-slate-400 tracking-widest font-sans">
            Reading Vault
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Copy Button */}
          <button
            id="btn-copy-poem"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-900 bg-slate-950 rounded-lg border border-slate-800 transition-all font-medium cursor-pointer"
            title="Copy entire poem to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-450" />
                <span>Copy Text</span>
              </>
            )}
          </button>

          {/* Edit Button */}
          <button
            id="btn-edit-from-reader"
            onClick={() => {
              onEdit(poem);
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-900 bg-slate-950 rounded-lg border border-slate-800 transition-all font-medium cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-450" />
            <span>Edit</span>
          </button>

          {/* Close Modal button */}
          <button
            id="btn-close-reader"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 rounded-full p-1.5 hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Styled Poem Parchment */}
      <div 
        id="poem-parchment"
        className="bg-slate-950/80 border border-slate-900 p-8 sm:p-12 rounded-2xl shadow-inner max-h-[60vh] overflow-y-auto"
        style={{
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.1)',
        }}
      >
        <div className="text-center space-y-4 max-w-xl mx-auto">
          {/* Category Pill centered */}
          <div>
            <span
              id="reader-cat"
              className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold border tracking-wider uppercase ${category?.color || 'bg-slate-900 text-slate-300 border-slate-800'}`}
            >
              {category?.name || 'Uncategorized'}
            </span>
          </div>

          {/* Title */}
          <h2 id="reader-title" className="text-2xl sm:text-3xl font-serif font-semibold tracking-tight leading-snug text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-amber-100 to-amber-200">
            {poem.title}
          </h2>

          {/* Author/Poet line */}
          <p id="reader-author" className="text-sm font-serif italic text-slate-400">
            composed by {poem.author || 'Anonymous'}
          </p>

          <div className="w-12 h-[1px] bg-amber-500/30 mx-auto my-6" />

          {/* Body Block */}
          <div 
            id="reader-body"
            className="font-serif text-[15px] sm:text-base text-slate-200 leading-8 whitespace-pre-wrap text-left inline-block pl-4 sm:pl-8 border-l-2 border-amber-500/20 max-w-full font-light"
          >
            {poem.body}
          </div>

          {/* Media Attachments Gallery */}
          {poem.attachments && poem.attachments.length > 0 && (
            <div id="reader-media-gallery" className="mt-12 text-left space-y-4">
              <div className="flex items-center gap-1.5 border-b pb-2 border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest font-sans">
                  ⚜ Attached Media Records ({poem.attachments.length})
                </span>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {poem.attachments.map((attach) => (
                  <div
                    id={`reader-attach-card-${attach.id}`}
                    key={attach.id}
                    className="border border-slate-900 rounded-xl overflow-hidden bg-slate-950/60 shadow-md"
                  >
                    <div className="p-3 border-b border-slate-900 bg-slate-900/80 flex items-center justify-between text-xs font-mono text-slate-450">
                      <span className="truncate max-w-[80%] font-medium">{attach.name}</span>
                      <span className="uppercase text-[10px] bg-slate-950 border border-slate-800 text-amber-300 px-2 py-0.5 rounded">
                        {attach.type}
                      </span>
                    </div>
                    <div className="p-4 flex items-center justify-center bg-slate-950/40 border-t border-slate-900/30">
                      {attach.type === 'image' ? (
                        <img
                          src={attach.url}
                          alt={attach.name}
                          className="max-h-96 w-auto object-contain rounded-lg border border-slate-900 shadow-md"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <video
                          src={attach.url}
                          controls
                          className="max-h-96 w-full rounded-lg border border-slate-900 bg-slate-950 shadow-md"
                          playsInline
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Details & tags bottom */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t pt-4 border-slate-850 mt-4">
        {/* Date line */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="w-4 h-4 text-slate-600" />
          <span>Catalogued on {formattedDate}</span>
        </div>

        {/* Tags */}
        {poem.tags && poem.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-1">
              <Tag className="w-3 h-3 text-slate-600" /> Motifs:
            </span>
            {poem.tags.map((tag, idx) => (
              <span
                id={`reader-tag-pill-${idx}`}
                key={idx}
                className="bg-slate-950 hover:bg-slate-900 border border-slate-800/85 text-amber-200/85 text-[11px] px-2.5 py-0.5 rounded-full transition-colors hover:border-slate-700"
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
