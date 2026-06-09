import React, { useState } from 'react';
import { Poem } from '../types';
import { Camera, Calendar, Trash2, Maximize2, Edit3, BookOpen } from 'lucide-react';

interface DailySnapCardProps {
  poem: Poem;
  onSelectMedia: (poem: Poem) => void;
  onDelete: (id: string) => void;
  onEdit?: (poem: Poem) => void;
  isEditable?: boolean;
  appTheme?: 'dark' | 'light';
  gridOverlayEnabled?: boolean;
}

export default function DailySnapCard({
  poem,
  onSelectMedia,
  onDelete,
  onEdit,
  isEditable = false,
  appTheme = 'dark',
  gridOverlayEnabled = false,
}: DailySnapCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const formattedDate = new Date(poem.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const attachment = poem.attachments?.[0];

  return (
    <div
      id={`snap-card-${poem.id}`}
      className={`relative group flex flex-col justify-between min-h-[340px] h-full transition-all duration-500 border rounded-2xl p-6 shadow-lg select-none ${
        appTheme === 'light'
          ? 'bg-white border-[#e0d6be] text-neutral-800 hover:shadow-[0_12px_32px_rgba(28,28,30,0.06)]'
          : 'bg-[#111218]/95 border-neutral-800/80 text-zinc-300 hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.12)]'
      }`}
      onContextMenu={(e) => {
        if (!isEditable) e.preventDefault();
      }}
      onCopy={(e) => {
        if (!isEditable) e.preventDefault();
      }}
      onDragStart={(e) => {
        if (!isEditable) e.preventDefault();
      }}
    >
      <div className="space-y-4">
        {/* Card Header Tag */}
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold font-mono uppercase tracking-widest border ${
              appTheme === 'light'
                ? 'bg-[#f4efe1] border-[#dfd5be] text-neutral-700'
                : 'bg-cyan-950/20 border-cyan-500/20 text-cyan-400'
            }`}
          >
            <Camera className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>Daily Snapshot</span>
          </span>
          <span className="text-[8px] font-semibold font-mono text-neutral-500 uppercase">
            STB_0{poem.id.slice(-4).toUpperCase()}
          </span>
        </div>

        {/* Polaroid Inner Frame */}
        <div
          id={`snap-frame-${poem.id}`}
          onClick={() => onSelectMedia(poem)}
          className={`relative aspect-square w-full rounded-xl overflow-hidden cursor-pointer border shadow-md group/snap-img flex flex-col justify-center bg-neutral-950 ${
            appTheme === 'light' ? 'border-[#e3dac4]' : 'border-neutral-900'
          }`}
        >
          {/* Background matrix scanlines */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px] opacity-40 z-1 pointer-events-none" />

          {attachment ? (
            <img
              src={attachment.url}
              alt={poem.body}
              className="w-full h-full object-cover grayscale opacity-75 contrast-[1.03] group-hover/snap-img:opacity-100 group-hover/snap-img:grayscale-0 group-hover/snap-img:scale-103 transition-all duration-750 ease-out select-none pointer-events-none"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex items-center justify-center p-4">
              <span className="text-xs text-neutral-500 font-mono">Missing captured asset</span>
            </div>
          )}

          {/* Vignette edge */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-neutral-950/20 opacity-60 group-hover/snap-img:opacity-30 transition-all duration-300 pointer-events-none" />

          {/* Blueprint rules */}
          {gridOverlayEnabled && (
            <div className="absolute inset-0 z-2 pointer-events-none select-none">
              <div className="absolute top-0 bottom-0 left-[50%] border-l border-dashed border-red-500/15" />
              <div className="absolute left-0 right-0 top-[50%] border-t border-dashed border-cyan-500/15" />
            </div>
          )}

          {/* Hover overlay crosshair */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/snap-img:opacity-100 transition-all duration-500 scale-95 pointer-events-none z-10">
            <div className="w-10 h-10 border border-cyan-500/30 flex items-center justify-center relative bg-neutral-950/50 backdrop-blur-xs rounded-full">
              <Maximize2 className="w-4 h-4 text-cyan-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Written Day Note Caption */}
        <div className="pt-1.5 px-1">
          <p
            className={`font-serif text-[13.5px] leading-relaxed italic border-l border-cyan-500/30 pl-3 ${
              appTheme === 'light' ? 'text-neutral-700' : 'text-neutral-200'
            }`}
          >
            {poem.body}
          </p>
        </div>
      </div>

      {/* Footer Details & Quick Action buttons */}
      <div className={`border-t pt-4 flex items-center justify-between mt-6 transition-colors ${
        appTheme === 'light' ? 'border-[#e0d6be]' : 'border-neutral-800/80'
      }`}>
        {/* Creation Date indicator */}
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 font-mono tracking-wider uppercase">
          <Calendar className="w-3.5 h-3.5 text-neutral-500" />
          <span>{formattedDate}</span>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onSelectMedia(poem)}
            className={`p-1.5 rounded-full transition-colors cursor-pointer select-none ${
              appTheme === 'light'
                ? 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                : 'text-neutral-400 hover:text-cyan-400 hover:bg-neutral-800'
            }`}
            title="View Enlarged"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {isEditable && onEdit && (
            <button
              onClick={() => onEdit(poem)}
              className={`p-1.5 rounded-full transition-colors cursor-pointer select-none ${
                appTheme === 'light'
                  ? 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                  : 'text-neutral-400 hover:text-cyan-400 hover:bg-neutral-800'
              }`}
              title="Edit Caption Note"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}

          {isEditable && (
            confirmDelete ? (
              <div className={`flex items-center gap-1 rounded-lg p-1 animate-pulse border ${
                appTheme === 'light'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-red-950/40 border-red-900/50'
              }`}>
                <button
                  onClick={() => {
                    onDelete(poem.id);
                    setConfirmDelete(false);
                  }}
                  className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md cursor-pointer uppercase font-mono tracking-widest ${
                    appTheme === 'light'
                      ? 'text-red-700 hover:bg-red-100'
                      : 'text-red-400 hover:bg-red-900/40'
                  }`}
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md cursor-pointer uppercase font-mono tracking-widest ${
                    appTheme === 'light'
                      ? 'text-neutral-600 hover:bg-neutral-100'
                      : 'text-neutral-400 hover:text-neutral-800'
                  }`}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  appTheme === 'light'
                    ? 'text-neutral-500 hover:text-red-600 hover:bg-red-50'
                    : 'text-neutral-400 hover:text-red-400 hover:bg-red-950/40'
                }`}
                title="Delete Snapshot Entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
