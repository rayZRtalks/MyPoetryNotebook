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
      <div className="flex items-center justify-between border-b pb-4 border-amber-100">
        <h3 id="form-heading" className="text-xl font-serif font-bold text-amber-950">
          {poem ? 'Amending Poem' : 'Inscribing New Poem'}
        </h3>
        <button
          id="btn-close-form"
          type="button"
          onClick={onCancel}
          className="text-stone-400 hover:text-stone-700 rounded-full p-1.5 hover:bg-amber-50 transition-colors cursor-pointer"
          title="Cancel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title input */}
        <div className="space-y-1">
          <label id="lbl-title" className="block text-xs font-semibold text-stone-500 uppercase tracking-wider font-sans">
            Poem Title *
          </label>
          <input
            id="input-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Ozymandias"
            className="w-full px-3 py-2.5 bg-white border border-amber-200 rounded-lg text-stone-900 font-serif focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all placeholder:text-stone-405"
          />
        </div>

        {/* Author input */}
        <div className="space-y-1">
          <label id="lbl-author" className="block text-xs font-semibold text-stone-500 uppercase tracking-wider font-sans">
            Poet / Author
          </label>
          <input
            id="input-author"
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="e.g. Percy Bysshe Shelley"
            className="w-full px-3 py-2.5 bg-white border border-amber-200 rounded-lg text-stone-900 font-sans focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all placeholder:text-stone-450"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-none">
        {/* Category select with inline addition */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label id="lbl-category" className="block text-xs font-semibold text-stone-500 uppercase tracking-wider font-sans">
              Category *
            </label>
            {!showNewCatInput && (
              <button
                id="btn-trigger-new-cat"
                type="button"
                onClick={() => setShowNewCatInput(true)}
                className="text-xs text-amber-700 hover:text-amber-800 hover:underline flex items-center gap-1 font-semibold cursor-pointer font-sans"
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
                className="flex-1 px-3 py-2 bg-white border border-amber-200 rounded-lg text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/10 transition-all font-sans"
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
                className="bg-amber-600 text-white p-2.5 rounded-lg hover:bg-amber-700 transition-colors font-bold cursor-pointer"
              >
                <Check className="w-4 h-4 font-bold" />
              </button>
              <button
                id="btn-cancel-new-cat"
                type="button"
                onClick={() => setShowNewCatInput(false)}
                className="border border-amber-200 p-2.5 text-stone-450 rounded-lg hover:bg-amber-50 bg-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <select
              id="select-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-amber-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all cursor-pointer font-sans"
            >
              <option className="bg-[#FAF7F0] text-stone-400" value="" disabled>Select category</option>
              {categories.map((cat) => (
                <option className="bg-[#FAF7F0] text-stone-900 font-semibold" key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Mood select */}
        <div className="space-y-1">
          <label id="lbl-mood" className="block text-xs font-semibold text-stone-500 uppercase tracking-wider font-sans">
            Atmosphere & Mood
          </label>
          <select
            id="select-mood"
            value={mood}
            onChange={(e) => setMood(e.target.value as PoemMood)}
            className="w-full px-3 py-2.5 bg-white border border-amber-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all cursor-pointer font-sans"
          >
            {MOODS.map((m) => (
              <option className="bg-[#FAF7F0] text-stone-900 font-semibold" key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Body / Writing area */}
      <div className="space-y-1">
        <label id="lbl-body" className="block text-xs font-semibold text-stone-500 uppercase tracking-wider font-sans">
          Verses & Stanzas *
        </label>
        <div className="relative border border-amber-200 rounded-lg focus-within:ring-2 focus-within:ring-amber-500/10 focus-within:border-amber-500 transition-all bg-[#FCFAF2] shadow-inner">
          <textarea
            id="input-body"
            required
            rows={12}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type your poem here... Use Shift+Enter or Enter to break lines."
            className="w-full px-4 py-4 bg-transparent outline-none text-stone-900 font-serif text-base leading-relaxed resize-y placeholder:text-stone-400"
            style={{
              backgroundImage: 'linear-gradient(rgba(139,92,26,0.03) 1px, transparent 1px)',
              backgroundSize: '100% 1.75rem',
              lineHeight: '1.75rem',
            }}
          />
        </div>
        <p className="text-[11px] text-stone-500 italic font-sans">
          Tip: Styled as structured paper lines. Feel free to format with spacing or indentation.
        </p>
      </div>

      {/* Media Attachments Section */}
      <div className="space-y-3 border-t pt-5 border-amber-100">
        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider font-sans">
          Direct Poem Media (Images and Videos viewable on tiles)
        </label>
        
        {errorMsg && (
          <div id="attachments-alert" className="flex items-center gap-2 p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs leading-relaxed animate-none">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
 
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* File selector card */}
          <div
            id="form-attachment-dropzone"
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-amber-250 hover:border-amber-400/80 bg-stone-50 hover:bg-amber-50/40 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[140px] group"
          >
            <Paperclip className="w-6 h-6 text-stone-400 group-hover:text-amber-700 mb-2 transition-colors" />
            <span className="text-xs font-bold text-stone-700 group-hover:text-amber-950 transition-colors font-sans">Direct Upload Media</span>
            <span className="text-[10px] text-stone-500 mt-1 max-w-[150px] font-sans">JPEG, PNG, MP4 (Recommended under 3MB)</span>
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
              className="relative border border-amber-200 rounded-xl overflow-hidden bg-[#FAF8F5] h-[140px] flex flex-col group shadow-sm"
            >
              <div className="relative w-full flex-1 overflow-hidden bg-amber-50/10">
                {attach.type === 'image' ? (
                  <img
                    src={attach.url}
                    alt={attach.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full relative">
                    <video
                      src={attach.url}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 bg-stone-900/10 flex items-center justify-center pointer-events-none">
                      <Video className="w-6 h-6 text-white drop-shadow-sm" />
                    </div>
                  </div>
                )}
                {/* Visual marker of media type */}
                <div className="absolute left-2.5 top-2.5 p-1 bg-[#FAF8F5] border border-amber-250 rounded text-[9px] text-amber-900 font-bold uppercase tracking-wider flex items-center gap-1 font-sans shadow-xs">
                  {attach.type === 'image' ? <ImageIcon className="w-3 h-3 text-amber-700" /> : <Video className="w-3 h-3 text-amber-600 animate-pulse" />}
                  <span>{attach.type}</span>
                </div>

                {/* Delete trigger */}
                <button
                  id={`btn-remove-pvw-${attach.id}`}
                  type="button"
                  onClick={() => handleRemoveAttachment(attach.id)}
                  className="absolute right-2.5 top-2.5 p-1.5 bg-rose-550 hover:bg-rose-600 text-white rounded-lg shadow-sm transition-colors cursor-pointer border border-rose-200/50"
                  title="Delete media"
                >
                  <X className="w-3.5 h-3.5 font-bold" />
                </button>
              </div>

              {/* Media Info Footer */}
              <div className="p-2 border-t border-amber-100 bg-white flex items-center justify-between text-xs font-medium">
                <span className="text-[10px] font-mono text-stone-700 truncate max-w-[70%] font-semibold" title={attach.name}>
                  {attach.name}
                </span>
                <span className="text-[9px] text-stone-500 font-semibold whitespace-nowrap font-sans">
                  {attach.size ? (attach.size / 1024 / 1024).toFixed(2) + ' MB' : 'Local'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tags Input */}
      <div className="space-y-1.5">
        <label id="lbl-tags" className="block text-xs font-semibold text-stone-500 uppercase tracking-wider font-sans">
          Tags & Key Motifs
        </label>
        <div className="flex flex-wrap gap-2 p-2 bg-white border border-amber-200 rounded-lg focus-within:border-amber-500">
          {tags.map((tag, idx) => (
            <span
              id={`tag-pill-${idx}`}
              key={idx}
              className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200/50 text-amber-950 text-xs px-2.5 py-1 rounded-full font-bold font-sans"
            >
              <Tag className="w-3 h-3 text-amber-700" />
              {tag}
              <button
                id={`btn-remove-tag-${idx}`}
                type="button"
                onClick={() => handleRemoveTag(idx)}
                className="hover:text-amber-800 cursor-pointer ml-1"
              >
                <X className="w-3.5 h-3.5 text-stone-450 hover:text-stone-700" />
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
            className="flex-1 min-w-[120px] bg-transparent outline-none text-xs text-stone-800 p-1 placeholder:text-stone-400 font-sans"
          />
        </div>
      </div>

      {/* Submit / Cancel Buttons */}
      <div className="flex items-center justify-between border-t pt-4 border-amber-100">
        <button
          id="btn-cancel-form"
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-amber-200 bg-white hover:bg-amber-50/55 text-stone-605 hover:text-stone-900 rounded-lg text-sm font-semibold transition-all cursor-pointer font-sans"
        >
          Nevermind
        </button>
        <button
          id="btn-submit-form"
          type="submit"
          className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer font-sans"
        >
          <Check className="w-4 h-4 font-bold" />
          {poem ? 'Update Poem' : 'Save Poem'}
        </button>
      </div>
    </form>
  );
}
