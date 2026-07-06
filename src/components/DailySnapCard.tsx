import React, { useState } from 'react';
import { Poem } from '../types';
import { Camera, Calendar, Trash2, Maximize2, Edit3, BookOpen, Lock } from 'lucide-react';

interface DailySnapCardProps {
  poem: Poem;
  onSelectMedia: (poem: Poem) => void;
  onDelete: (id: string) => void;
  onEdit?: (poem: Poem) => void;
  isEditable?: boolean;
  appTheme?: 'dark' | 'light' | 'sankofa' | 'momoamo' | 'madrid';
  gridOverlayEnabled?: boolean;
  isWide?: boolean;
}

export default function DailySnapCard({
  poem,
  onSelectMedia,
  onDelete,
  onEdit,
  isEditable = false,
  appTheme = 'dark',
  gridOverlayEnabled = false,
  isWide = false,
}: DailySnapCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const formattedDate = new Date(poem.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const attachment = poem.attachments?.[0];

  if (isWide) {
    return (
      <div
        id={`snap-card-${poem.id}`}
        className={`relative group flex flex-col md:flex-row gap-6 md:items-stretch min-h-[380px] h-full transition-all duration-500 border rounded-2xl p-6 shadow-lg select-none ${
          appTheme === 'light'
            ? 'bg-white border-[#e0d6be] text-neutral-800 hover:shadow-[0_12px_32px_rgba(28,28,30,0.06)]'
            : appTheme === 'sankofa'
            ? 'bg-[#3d2925] border-[#5d3b33] text-[#f6eedf] hover:border-[#bf3f27]/40 hover:shadow-[0_0_30px_rgba(191,63,39,0.15)]'
            : appTheme === 'momoamo'
            ? 'bg-[#263a2c] border-[#FAF6F0]/25 text-[#FAF6F0] hover:border-[#E1FE35]/40 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]'
            : appTheme === 'madrid'
            ? 'bg-white border-black/10 text-[#0E0E15] hover:shadow-[0_12px_32px_rgba(28,28,30,0.06)] hover:border-[#FF5E00]/40'
            : 'bg-[#242736] border-neutral-700/65 text-zinc-300 hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(6,182,212,0.12)]'
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
        {/* Left Column: Polaroid Image Frame */}
        <div className="w-full md:w-[42%] shrink-0 flex flex-col justify-center relative">
          <div
            id={`snap-frame-${poem.id}`}
            onClick={() => onSelectMedia(poem)}
            className={`relative aspect-square w-full rounded-xl overflow-hidden cursor-pointer border shadow-md group/snap-img flex flex-col justify-center bg-[#0d0706] ${
              appTheme === 'light'
                ? 'border-[#e3dac4]'
                : appTheme === 'sankofa'
                ? 'border-[#2a1a17]'
                : appTheme === 'momoamo'
                ? 'border-[#FAF6F0]/15'
                : appTheme === 'madrid'
                ? 'border-black/30'
                : 'border-neutral-900'
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
              <div className="w-10 h-10 border border-current flex items-center justify-center relative bg-neutral-950/50 backdrop-blur-xs rounded-full">
                <Maximize2 className={`w-4 h-4 animate-pulse ${
                  appTheme === 'sankofa'
                    ? 'text-[#dca626]'
                    : appTheme === 'light'
                    ? 'text-amber-600'
                    : appTheme === 'momoamo'
                    ? 'text-[#E1FE35]'
                    : appTheme === 'madrid'
                    ? 'text-[#FDA172]'
                    : 'text-cyan-400'
                }`} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Title, Note & Controls */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div className="space-y-4">
            {/* Card Header Tag */}
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold font-mono uppercase tracking-widest border ${
                  appTheme === 'light'
                    ? 'bg-[#f4efe1] border-[#dfd5be] text-neutral-700'
                    : appTheme === 'sankofa'
                    ? 'bg-[#331c17] border-[#bf3f27]/30 text-[#dca626]'
                    : appTheme === 'momoamo'
                    ? 'bg-[#141C16] border-[#E1FE35]/20 text-[#E1FE35]'
                    : appTheme === 'madrid'
                    ? 'bg-neutral-100 border-black/10 text-[#FF5E00]'
                    : 'bg-cyan-950/20 border-cyan-500/20 text-cyan-400'
                }`}
              >
                <Camera className={`w-3 h-3 animate-pulse ${
                  appTheme === 'sankofa'
                    ? 'text-[#bf3f27]'
                    : appTheme === 'light'
                    ? 'text-amber-500'
                    : appTheme === 'momoamo'
                    ? 'text-[#E1FE35]'
                    : appTheme === 'madrid'
                    ? 'text-[#FF5E00]'
                    : 'text-cyan-400'
                }`} />
                <span>Daily Snapshot</span>
              </span>
              <div className="flex items-center gap-1.5 font-mono text-[8px] font-semibold text-neutral-500 uppercase">
                {poem.isPrivate && (
                  <span className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded border ${
                    appTheme === 'light'
                      ? 'text-amber-800 bg-amber-50 border-amber-200'
                      : appTheme === 'sankofa'
                      ? 'text-[#bf3f27] bg-[#2a130f] border-[#421f19]'
                      : appTheme === 'momoamo'
                      ? 'text-[#E1FE35] bg-[#141C16] border-[#E1FE35]/20'
                      : appTheme === 'madrid'
                      ? 'text-[#FF5E00] bg-neutral-100 border-black/10'
                      : 'text-amber-400 bg-amber-950/30 border-amber-900/40'
                  }`}>
                    <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                    <span>PVT</span>
                  </span>
                )}
                <span>STB_0{poem.id.slice(-4).toUpperCase()}</span>
              </div>
            </div>

            {/* Snapshot title if any */}
            {poem.title && (
              <div className="space-y-0.5">
                <h4 className={`text-base font-bold font-display tracking-tight truncate ${
                  appTheme === 'light'
                    ? 'text-neutral-900'
                    : appTheme === 'sankofa'
                    ? 'text-[#ebd6bc]'
                    : appTheme === 'momoamo'
                    ? 'text-[#FAF6F0]'
                    : 'text-white'
                }`}>
                  {poem.title}
                </h4>
                {poem.author && (
                  <span className="text-[10px] text-neutral-500 font-mono">
                    by {poem.author}
                  </span>
                )}
              </div>
            )}

            {/* Written Day Note Caption */}
            <div className="pt-2">
              <p
                className={`font-serif text-[14px] leading-relaxed italic border-l pl-3 ${
                  appTheme === 'light'
                    ? 'text-neutral-700 font-medium border-[#dfd5be]'
                    : appTheme === 'sankofa'
                    ? 'text-[#ebd6bc] border-[#bf3f27]'
                    : appTheme === 'momoamo'
                    ? 'text-[#FAF6F0]/85 border-[#E1FE35]/30'
                    : appTheme === 'madrid'
                    ? 'text-neutral-700 border-[#FF5E00]/30'
                    : 'text-neutral-200 border-cyan-500/30'
                }`}
              >
                {poem.body}
              </p>
            </div>
          </div>

          {/* Footer controls */}
          <div className={`border-t pt-4 flex items-center justify-between mt-6 transition-colors ${
            appTheme === 'light'
              ? 'border-[#e0d6be]'
              : appTheme === 'sankofa'
              ? 'border-[#3a221d]'
              : appTheme === 'momoamo'
              ? 'border-[#FAF6F0]/15'
              : appTheme === 'madrid'
              ? 'border-black/10'
              : 'border-neutral-800/80'
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
                    : appTheme === 'sankofa'
                    ? 'text-[#f6eedf]/70 hover:text-[#dca626] hover:bg-[#331c17]'
                    : appTheme === 'momoamo'
                    ? 'text-[#E1FE35]/70 hover:text-[#E1FE35] hover:bg-[#1C291E]'
                    : appTheme === 'madrid'
                    ? 'text-[#FF5E00]/70 hover:text-[#FF5E00] hover:bg-neutral-100'
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
                      : appTheme === 'sankofa'
                      ? 'text-[#f6eedf]/70 hover:text-[#dca626] hover:bg-[#331c17]'
                      : appTheme === 'momoamo'
                      ? 'text-[#E1FE35]/70 hover:text-[#E1FE35] hover:bg-[#1C291E]'
                      : appTheme === 'madrid'
                      ? 'text-[#FF5E00]/70 hover:text-[#FF5E00] hover:bg-neutral-100'
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
                      : appTheme === 'sankofa'
                      ? 'bg-[#2a130f] border-[#bf3f27]/30'
                      : appTheme === 'momoamo'
                      ? 'bg-[#141C16] border-[#FAF6F0]/25'
                      : appTheme === 'madrid'
                      ? 'bg-white border-black/10'
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
                          : appTheme === 'sankofa'
                          ? 'text-[#bf3f27] hover:bg-[#3d1a14]'
                          : appTheme === 'momoamo'
                          ? 'text-red-500 hover:bg-red-950/20'
                          : appTheme === 'madrid'
                          ? 'text-[#FF3E6C] hover:bg-[#FF3E6C]/15'
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
                          : appTheme === 'sankofa'
                          ? 'text-[#ebd6bc] hover:bg-[#331c17]'
                          : appTheme === 'momoamo'
                          ? 'text-[#FAF6F0]/70 hover:bg-[#1C291E]'
                          : appTheme === 'madrid'
                          ? 'text-[#FF5E00]/70 hover:bg-neutral-100'
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
                        : appTheme === 'sankofa'
                        ? 'text-[#ebd6bc]/70 hover:text-[#bf3f27] hover:bg-[#331c17]'
                        : appTheme === 'momoamo'
                        ? 'text-red-500 hover:bg-red-950/20'
                        : appTheme === 'madrid'
                        ? 'text-[#FF3E6C] hover:bg-[#FF3E6C]/15'
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
      </div>
    );
  }

  return (
    <div
      id={`snap-card-${poem.id}`}
      className={`relative group flex flex-col justify-between min-h-[340px] h-full transition-all duration-500 border rounded-2xl p-6 shadow-lg select-none ${
        appTheme === 'light'
          ? 'bg-white border-[#e0d6be] text-neutral-800 hover:shadow-[0_12px_32px_rgba(28,28,30,0.06)]'
          : appTheme === 'sankofa'
          ? 'bg-[#2a1d1a] border-[#4a2e28] text-[#f6eedf] hover:border-[#bf3f27]/40 hover:shadow-[0_0_30px_rgba(191,63,39,0.15)]'
          : appTheme === 'momoamo'
          ? 'bg-[#1e2e23] border-[#FAF6F0]/20 text-[#FAF6F0] hover:border-[#E1FE35]/40 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]'
          : appTheme === 'madrid'
          ? 'bg-white border-black/10 text-[#0E0E15] hover:shadow-[0_12px_32px_rgba(28,28,30,0.06)] hover:border-[#FF5E00]/40'
          : 'bg-[#1c1e27] border-neutral-800/90 text-zinc-300 hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(6,182,212,0.12)]'
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
                : appTheme === 'sankofa'
                ? 'bg-[#331c17] border-[#bf3f27]/30 text-[#dca626]'
                : appTheme === 'momoamo'
                ? 'bg-[#141C16] border-[#E1FE35]/20 text-[#E1FE35]'
                : appTheme === 'madrid'
                ? 'bg-neutral-100 border-black/10 text-[#FF5E00]'
                : 'bg-cyan-950/20 border-cyan-500/20 text-cyan-400'
            }`}
          >
            <Camera className={`w-3 h-3 animate-pulse ${
              appTheme === 'sankofa'
                ? 'text-[#bf3f27]'
                : appTheme === 'light'
                ? 'text-amber-500'
                : appTheme === 'momoamo'
                ? 'text-[#E1FE35]'
                : appTheme === 'madrid'
                ? 'text-[#FF5E00]'
                : 'text-cyan-400'
            }`} />
            <span>Daily Snapshot</span>
          </span>
          <div className="flex items-center gap-1.5 font-mono text-[8px] font-semibold text-neutral-500 uppercase">
            {poem.isPrivate && (
              <span className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded border ${
                appTheme === 'light'
                  ? 'text-amber-800 bg-amber-50 border-amber-200'
                  : appTheme === 'sankofa'
                  ? 'text-[#bf3f27] bg-[#2a130f] border-[#421f19]'
                  : appTheme === 'momoamo'
                  ? 'text-[#E1FE35] bg-[#141C16] border-[#E1FE35]/20'
                  : appTheme === 'madrid'
                  ? 'text-[#FF5E00] bg-neutral-100 border-black/10'
                  : 'text-amber-400 bg-amber-950/30 border-amber-900/40'
              }`}>
                <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                <span>PVT</span>
              </span>
            )}
            <span>STB_0{poem.id.slice(-4).toUpperCase()}</span>
          </div>
        </div>

        {/* Polaroid Inner Frame */}
        <div
          id={`snap-frame-${poem.id}`}
          onClick={() => onSelectMedia(poem)}
          className={`relative aspect-square w-full rounded-xl overflow-hidden cursor-pointer border shadow-md group/snap-img flex flex-col justify-center bg-[#0d0706] ${
            appTheme === 'light'
              ? 'border-[#e3dac4]'
              : appTheme === 'sankofa'
              ? 'border-[#2a1a17]'
              : appTheme === 'momoamo'
              ? 'border-[#FAF6F0]/15'
              : appTheme === 'madrid'
              ? 'border-black/30'
              : 'border-neutral-900'
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
            <div className="w-10 h-10 border border-current flex items-center justify-center relative bg-neutral-950/50 backdrop-blur-xs rounded-full">
              <Maximize2 className={`w-4 h-4 animate-pulse ${
                appTheme === 'sankofa'
                  ? 'text-[#dca626]'
                  : appTheme === 'light'
                  ? 'text-amber-600'
                  : appTheme === 'momoamo'
                  ? 'text-[#E1FE35]'
                  : appTheme === 'madrid'
                  ? 'text-[#FF5E00]'
                  : 'text-cyan-400'
              }`} />
            </div>
          </div>
        </div>

        {/* Written Day Note Caption */}
        <div className="pt-1.5 px-1">
          <p
            className={`font-serif text-[13.5px] leading-relaxed italic border-l pl-3 ${
              appTheme === 'light'
                ? 'text-neutral-700 border-[#dfd5be]'
                : appTheme === 'sankofa'
                ? 'text-[#ebd6bc] border-[#bf3f27]'
                : appTheme === 'momoamo'
                ? 'text-[#FAF6F0]/85 border-[#E1FE35]/30'
                : appTheme === 'madrid'
                ? 'text-neutral-700 border-[#FF5E00]/30'
                : 'text-neutral-200 border-cyan-500/30'
            }`}
          >
            {poem.body}
          </p>
        </div>
      </div>

      {/* Footer Details & Quick Action buttons */}
      <div className={`border-t pt-4 flex items-center justify-between mt-6 transition-colors ${
        appTheme === 'light'
          ? 'border-[#e0d6be]'
          : appTheme === 'sankofa'
          ? 'border-[#3a221d]'
          : appTheme === 'momoamo'
          ? 'border-[#FAF6F0]/15'
          : appTheme === 'madrid'
          ? 'border-black/10'
          : 'border-neutral-800/80'
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
                : appTheme === 'sankofa'
                ? 'text-[#f6eedf]/70 hover:text-[#dca626] hover:bg-[#331c17]'
                : appTheme === 'momoamo'
                ? 'text-[#E1FE35]/70 hover:text-[#E1FE35] hover:bg-[#1C291E]'
                : appTheme === 'madrid'
                ? 'text-[#FF5E00]/70 hover:text-[#FF5E00] hover:bg-neutral-100'
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
                  : appTheme === 'sankofa'
                  ? 'text-[#f6eedf]/70 hover:text-[#dca626] hover:bg-[#331c17]'
                  : appTheme === 'momoamo'
                  ? 'text-[#E1FE35]/70 hover:text-[#E1FE35] hover:bg-[#1C291E]'
                  : appTheme === 'madrid'
                  ? 'text-[#FF5E00]/70 hover:text-[#FF5E00] hover:bg-neutral-100'
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
                  : appTheme === 'sankofa'
                  ? 'bg-[#2a130f] border-[#bf3f27]/30'
                  : appTheme === 'momoamo'
                  ? 'bg-[#141C16] border-[#FAF6F0]/25'
                  : appTheme === 'madrid'
                  ? 'bg-white border-black/10'
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
                      : appTheme === 'sankofa'
                      ? 'text-[#bf3f27] hover:bg-[#3d1a14]'
                      : appTheme === 'momoamo'
                      ? 'text-red-500 hover:bg-red-950/20'
                      : appTheme === 'madrid'
                      ? 'text-[#FF3E6C] hover:bg-[#FF3E6C]/15'
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
                      : appTheme === 'sankofa'
                      ? 'text-[#ebd6bc] hover:bg-[#331c17]'
                      : appTheme === 'momoamo'
                      ? 'text-[#FAF6F0]/70 hover:bg-[#1C291E]'
                      : appTheme === 'madrid'
                      ? 'text-[#FF5E00]/70 hover:bg-neutral-100'
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
                    : appTheme === 'sankofa'
                    ? 'text-[#ebd6bc]/70 hover:text-[#bf3f27] hover:bg-[#331c17]'
                    : appTheme === 'momoamo'
                    ? 'text-red-500 hover:bg-red-950/20'
                    : appTheme === 'madrid'
                    ? 'text-[#FF3E6C] hover:bg-[#FF3E6C]/15'
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
