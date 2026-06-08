import React, { useState, useEffect, useRef } from 'react';
import { Poem, Category, PoemMood, PoemAttachment } from '../types';
import { X, Check, Plus, Tag, FolderPlus, Paperclip, Image as ImageIcon, Video, AlertCircle } from 'lucide-react';

interface PoemFormProps {
  poem?: Poem | null; // If editing
  categories: Category[];
  onSave: (poemData: Omit<Poem, 'id' | 'createdAt'> & { id?: string }) => void;
  onCancel: () => void;
  onAddCategory: (name: string) => Category;
}

const MOODS: PoemMood[] = ['Reflective', 'Melancholy', 'Romantic', 'Hopeful', 'Whimsical', 'Mystical', 'Free'];

export default function PoemForm({
  poem,
  categories,
  onSave,
  onCancel,
  onAddCategory,
}: PoemFormProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [body, setBody] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [mood, setMood] = useState<PoemMood>('Reflective');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<PoemAttachment[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Custom new category creation box state
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    if (poem) {
      setTitle(poem.title);
      setAuthor(poem.author || '');
      setBody(poem.body);
      setCategoryId(poem.categoryId);
      setMood(poem.mood || 'Reflective');
      setTags(poem.tags || []);
      setAttachments(poem.attachments || []);
    } else {
      setTitle('');
      setAuthor('');
      setBody('');
      setCategoryId(categories[0]?.id || '');
      setMood('Reflective');
      setTags([]);
      setAttachments([]);
    }
    setErrorMsg('');
  }, [poem, categories]);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const cleaned = tagInput.trim().toLowerCase().replace(/,/g, '');
      if (cleaned && !tags.includes(cleaned)) {
        setTags([...tags, cleaned]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setTags(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddNewCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCatName.trim();
    if (name) {
      const newCat = onAddCategory(name);
      setCategoryId(newCat.id);
      setNewCatName('');
      setShowNewCatInput(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((item) => {
      const file = item as File;
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        setErrorMsg('Only image or video files are accepted as poem attachments.');
        return;
      }

      // Check size. Warn about localStorage space limits (e.g. recommend files under 3MB)
      if (file.size > 3 * 1024 * 1024) {
        setErrorMsg('To save browser storage, we recommend uploading compressed media (under 3MB).');
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          const newAttachment: PoemAttachment = {
            id: `attach-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
            name: file.name,
            type: isImage ? 'image' : 'video',
            url: dataUrl,
            size: file.size,
          };
          setAttachments((prev) => [...prev, newAttachment]);
        }
      };
      reader.onerror = () => {
        setErrorMsg('Attempt to read this file failed.');
      };
      reader.readAsDataURL(file);
    });

    // Reset input elements
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || !categoryId) return;

    onSave({
      id: poem?.id,
      title: title.trim(),
      author: author.trim() || undefined,
      body: body.trim(),
      categoryId,
      mood,
      tags,
      attachments,
    });
  };

  return (
    <form id="poem-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4 border-slate-850">
        <h3 id="form-heading" className="text-xl font-serif font-semibold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-amber-200">
          {poem ? 'Amending Poem' : 'Inscribing New Poem'}
        </h3>
        <button
          id="btn-close-form"
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-200 rounded-full p-1.5 hover:bg-slate-900 transition-colors cursor-pointer"
          title="Cancel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title input */}
        <div className="space-y-1">
          <label id="lbl-title" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Poem Title *
          </label>
          <input
            id="input-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Ozymandias"
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-serif focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500/40 transition-all placeholder:text-slate-500"
          />
        </div>

        {/* Author input */}
        <div className="space-y-1">
          <label id="lbl-author" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Poet / Author
          </label>
          <input
            id="input-author"
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="e.g. Percy Bysshe Shelley"
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500/40 transition-all placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category select with inline addition */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label id="lbl-category" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Category *
            </label>
            {!showNewCatInput && (
              <button
                id="btn-trigger-new-cat"
                type="button"
                onClick={() => setShowNewCatInput(true)}
                className="text-xs text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                Add Category
              </button>
            )}
          </div>

          {showNewCatInput ? (
            <div className="flex items-center gap-2">
              <input
                id="input-new-cat"
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="New Category Name"
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/10 transition-all font-sans"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const name = newCatName.trim();
                    if (name) {
                      const newCat = onAddCategory(name);
                      setCategoryId(newCat.id);
                      setNewCatName('');
                      setShowNewCatInput(false);
                    }
                  }
                }}
              />
              <button
                id="btn-save-new-cat"
                type="button"
                onClick={(e) => {
                  const name = newCatName.trim();
                  if (name) {
                    const newCat = onAddCategory(name);
                    setCategoryId(newCat.id);
                    setNewCatName('');
                    setShowNewCatInput(false);
                  }
                }}
                className="bg-amber-500 text-slate-950 p-2.5 rounded-lg hover:bg-amber-400 transition-colors font-bold cursor-pointer"
              >
                <Check className="w-4 h-4 font-black" />
              </button>
              <button
                id="btn-cancel-new-cat"
                type="button"
                onClick={() => setShowNewCatInput(false)}
                className="border border-slate-800 p-2.5 text-slate-400 rounded-lg hover:bg-slate-900 bg-slate-950 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <select
              id="select-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500/45 transition-all cursor-pointer"
            >
              <option className="bg-[#0b0e22] text-slate-400" value="" disabled>Select category</option>
              {categories.map((cat) => (
                <option className="bg-[#0b0e22] text-slate-100" key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Mood select */}
        <div className="space-y-1">
          <label id="lbl-mood" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Atmosphere & Mood
          </label>
          <select
            id="select-mood"
            value={mood}
            onChange={(e) => setMood(e.target.value as PoemMood)}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500/45 transition-all cursor-pointer"
          >
            {MOODS.map((m) => (
              <option className="bg-[#0b0e22] text-slate-100" key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Body / Writing area */}
      <div className="space-y-1">
        <label id="lbl-body" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Verses & Stanzas *
        </label>
        <div className="relative border border-slate-805/80 rounded-lg focus-within:ring-2 focus-within:ring-amber-500/10 focus-within:border-amber-500/40 transition-all bg-[#070913]/90">
          <textarea
            id="input-body"
            required
            rows={12}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type your poem here... Use Shift+Enter or Enter to break lines."
            className="w-full px-4 py-4 bg-transparent outline-none text-slate-100 font-serif text-base leading-relaxed resize-y placeholder:text-slate-500"
            style={{
              backgroundImage: 'linear-gradient(rgba(245,158,11,0.03) 1px, transparent 1px)',
              backgroundSize: '100% 1.75rem',
              lineHeight: '1.75rem',
            }}
          />
        </div>
        <p className="text-[11px] text-slate-500 italic">
          Tip: Styled as structured paper lines. Feel free to format with spacing or indentation.
        </p>
      </div>

      {/* Media Attachments Section */}
      <div className="space-y-2 border-t pt-4 border-slate-850">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Media Ledger (Page scans, Recital recordings, or Spoken-word videos)
        </label>
        
        {errorMsg && (
          <div id="attachments-alert" className="flex items-center gap-2 p-3 bg-amber-950/20 text-amber-300 border border-amber-900/50 rounded-lg text-xs leading-relaxed animate-pulse">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* File selector card */}
          <div
            id="form-attachment-dropzone"
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-800 hover:border-amber-500/40 bg-slate-950/60 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-950 transition-all min-h-[100px] group"
          >
            <Paperclip className="w-5 h-5 text-slate-500 group-hover:text-amber-400 mb-1.5 transition-colors" />
            <span className="text-xs font-medium text-slate-300 group-hover:text-amber-400">Attach Image or Video</span>
            <span className="text-[10px] text-slate-500 mt-0.5">JPEG, PNG, MP4 (under 3MB)</span>
            <input
              id="file-attachment-input"
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Render previews */}
          {attachments.map((attach) => (
            <div
              id={`upload-preview-${attach.id}`}
              key={attach.id}
              className="relative border border-slate-900 rounded-xl overflow-hidden bg-slate-950/40 h-[100px] flex items-center group shadow-xs"
            >
              {/* Thumbnail representation */}
              <div className="w-16 h-full bg-slate-900 border-r border-slate-850 relative overflow-hidden flex items-center justify-center shrink-0">
                {attach.type === 'image' ? (
                  <img
                    src={attach.url}
                    alt={attach.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <video
                      src={attach.url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center">
                      <Video className="w-4 h-4 text-white drop-shadow-md" />
                    </div>
                  </div>
                )}
              </div>

              {/* Text metrics and info */}
              <div className="flex-1 p-2.5 overflow-hidden pr-8">
                <p className="text-xs font-semibold text-slate-250 truncate font-mono">
                  {attach.name}
                </p>
                <span className="text-[10px] font-medium text-slate-500 uppercase block mt-1">
                  {attach.type} • {(attach.size ? (attach.size / 1024 / 1024).toFixed(2) + ' MB' : 'Local file')}
                </span>
              </div>

              {/* Delete trigger */}
              <button
                id={`btn-remove-pvw-${attach.id}`}
                type="button"
                onClick={() => handleRemoveAttachment(attach.id)}
                className="absolute right-2 top-2 p-1 bg-slate-900 hover:bg-rose-950 border border-slate-800 hover:border-rose-900 text-slate-400 hover:text-rose-450 rounded-md shadow-sm transition-colors cursor-pointer"
                title="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tags Input */}
      <div className="space-y-1.5">
        <label id="lbl-tags" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Tags & Key Motifs
        </label>
        <div className="flex flex-wrap gap-2 p-2 bg-slate-950 border border-slate-800 rounded-lg focus-within:border-slate-750">
          {tags.map((tag, idx) => (
            <span
              id={`tag-pill-${idx}`}
              key={idx}
              className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 text-amber-200 text-xs px-2.5 py-1 rounded-full font-medium"
            >
              <Tag className="w-3 h-3 text-amber-550" />
              {tag}
              <button
                id={`btn-remove-tag-${idx}`}
                type="button"
                onClick={() => handleRemoveTag(idx)}
                className="hover:text-amber-400 cursor-pointer ml-1"
              >
                <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-100" />
              </button>
            </span>
          ))}
          <input
            id="input-tag"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="press enter/comma to add tag"
            className="flex-1 min-w-[120px] bg-transparent outline-none text-xs text-slate-100 p-1 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Submit / Cancel Buttons */}
      <div className="flex items-center justify-between border-t pt-4 border-slate-850">
        <button
          id="btn-cancel-form"
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-300 rounded-lg text-sm font-medium transition-all cursor-pointer"
        >
          Nevermind
        </button>
        <button
          id="btn-submit-form"
          type="submit"
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2 rounded-lg text-sm font-bold shadow-md shadow-amber-500/5 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          {poem ? 'Update Poem' : 'Save Poem'}
        </button>
      </div>
    </form>
  );
}
