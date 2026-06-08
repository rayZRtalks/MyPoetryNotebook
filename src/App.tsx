/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Feather, Plus, Search, Download, Upload, Trash2, 
  Sparkles, FolderPlus, ArrowUpDown, Clock, HelpCircle, 
  Layers, ChevronDown, Check, X, RotateCcw, Quote, BookOpen, AlertCircle
} from 'lucide-react';
import { Poem, Category, PoemMood } from './types';
import { INITIAL_CATEGORIES, INITIAL_POEMS } from './initialData';
import PoemForm from './components/PoemForm';
import PoemCard from './components/PoemCard';
import PoemReader from './components/PoemReader';

export default function App() {
  // --- Persistent States ---
  const [poems, setPoems] = useState<Poem[]>(() => {
    const saved = localStorage.getItem('poetry_notebook_poems');
    return saved ? JSON.parse(saved) : INITIAL_POEMS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('poetry_notebook_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  // --- Filtering & Sorting States ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');

  // --- Modal States ---
  const [activePoemForReading, setActivePoemForReading] = useState<Poem | null>(null);
  const [activePoemForEditing, setActivePoemForEditing] = useState<Poem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // --- Check URL parameters for secret admin trigger ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('author') === 'true' || params.get('edit') === 'true' || params.get('write') === 'true') {
      setIsPasscodeModalOpen(true);
    }
  }, []);

  // --- Toast/Notification State ---
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  // --- HTML Reference for fine-grained interactions ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newCatNameInput, setNewCatNameInput] = useState('');

  // --- Author Mode & Passcode Verification States ---
  const [isAuthorMode, setIsAuthorMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('poetry_notebook_is_author_authenticated');
    return saved === 'true';
  });
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  const [enteredPasscode, setEnteredPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);

  // --- Toast helper ---
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // --- Save to LocalStorage ---
  useEffect(() => {
    localStorage.setItem('poetry_notebook_poems', JSON.stringify(poems));
  }, [poems]);

  useEffect(() => {
    localStorage.setItem('poetry_notebook_categories', JSON.stringify(categories));
  }, [categories]);

  // --- Poem Operations ---
  const handleSavePoem = (poemData: Omit<Poem, 'id' | 'createdAt'> & { id?: string }) => {
    if (poemData.id) {
      // Editing
      setPoems((prev) =>
        prev.map((p) =>
          p.id === poemData.id
            ? {
                ...p,
                ...poemData,
                updatedAt: new Date().toISOString(),
              }
            : p
        )
      );
      showToast('Poem updated and saved properly.', 'success');
    } else {
      // Creating
      const newPoem: Poem = {
        ...poemData,
        id: `poem-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setPoems((prev) => [newPoem, ...prev]);
      showToast('New poem added to your journal.', 'success');
    }
    setIsFormOpen(false);
    setActivePoemForEditing(null);
  };

  const handleDeletePoem = (id: string) => {
    setPoems((prev) => prev.filter((p) => p.id !== id));
    showToast('Poem deleted from storage.', 'warning');
    if (activePoemForReading?.id === id) {
      setActivePoemForReading(null);
    }
  };

  // --- Category Operations ---
  const handleAddCategory = (name: string): Category => {
    const trimmed = name.trim();
    const existing = categories.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      showToast(`Category "${trimmed}" already exists.`, 'info');
      return existing;
    }

    const pastelColors = [
      'bg-indigo-50 text-indigo-700 border-indigo-100',
      'bg-emerald-50 text-emerald-700 border-emerald-100',
      'bg-rose-50 text-rose-700 border-rose-100',
      'bg-amber-50 text-amber-700 border-amber-100',
      'bg-sky-50 text-sky-700 border-sky-100',
      'bg-teal-50 text-teal-700 border-teal-100',
      'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100',
    ];
    const newColor = pastelColors[categories.length % pastelColors.length];

    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: trimmed,
      color: newColor,
    };

    setCategories((prev) => [...prev, newCat]);
    showToast(`Category "${trimmed}" added successfully.`, 'success');
    return newCat;
  };

  const handleDeleteCategory = (catId: string) => {
    // We forbid deleting the sole category
    if (categories.length <= 1) {
      showToast('You must keep at least one category.', 'error');
      return;
    }

    // Delete category
    setCategories((prev) => prev.filter((c) => c.id !== catId));

    // Re-assign poems in this category to the first remaining category
    const remainingCats = categories.filter((c) => c.id !== catId);
    const backupCatId = remainingCats[0]?.id || '';

    setPoems((prev) =>
      prev.map((poem) =>
        poem.categoryId === catId ? { ...poem, categoryId: backupCatId } : poem
      )
    );

    if (selectedCatId === catId) {
      setSelectedCatId('all');
    }

    showToast('Category deleted. Affected poems re-routed.', 'info');
  };

  // --- Backup Handlers (Local Files Integration) ---
  const handleExportBackup = () => {
    try {
      const dataStr = JSON.stringify({ poems, categories }, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

      const exportFileDefaultName = `poetry_backup_${new Date().toISOString().slice(0, 10)}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      showToast('Notebook exported successfully.', 'success');
    } catch {
      showToast('Could not initiate export.', 'error');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.poems) && Array.isArray(parsed.categories)) {
          setPoems(parsed.poems);
          setCategories(parsed.categories);
          showToast('Import completed. Your poems are loaded!', 'success');
        } else {
          showToast('Failed structure signature test.', 'error');
        }
      } catch {
        showToast('Invalid file structure format.', 'error');
      }
    };
    fileReader.readAsText(file);
    // Refresh element state
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // --- Reset/Factory Revert ---
  const handleRevertToDemo = () => {
    setPoems(INITIAL_POEMS);
    setCategories(INITIAL_CATEGORIES);
    setSelectedCatId('all');
    setSelectedMood('all');
    setSortBy('newest');
    setIsResetConfirmOpen(false);
    showToast('Reverted notebook to demo poems.', 'info');
  };

  // --- Author Mode Handlers ---
  const handleVerifyPasscode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const correctPasscode = import.meta.env.VITE_AUTHOR_PASSCODE || 'nature';
    if (enteredPasscode === correctPasscode) {
      setIsAuthorMode(true);
      localStorage.setItem('poetry_notebook_is_author_authenticated', 'true');
      setIsPasscodeModalOpen(false);
      setEnteredPasscode('');
      setPasscodeError(false);
      showToast('Welcome, Author. Your inkwell is prepared.', 'success');
    } else {
      setPasscodeError(true);
      showToast('Passcode incorrect. The quill remains locked.', 'error');
    }
  };

  const handleLockAuthorMode = () => {
    setIsAuthorMode(false);
    localStorage.setItem('poetry_notebook_is_author_authenticated', 'false');
    showToast('Securely returned to viewer-only mode.', 'info');
  };

  // --- Pure Search & Filter logic computation ---
  const filteredPoems = poems.filter((poem) => {
    const searchString = searchQuery.toLowerCase().trim();
    const matchQuery = 
      !searchString ||
      poem.title.toLowerCase().includes(searchString) ||
      poem.body.toLowerCase().includes(searchString) ||
      poem.tags.some((tag) => tag.toLowerCase().includes(searchString)) ||
      (poem.author && poem.author.toLowerCase().includes(searchString));

    const matchCategory = selectedCatId === 'all' || poem.categoryId === selectedCatId;
    const matchMood = selectedMood === 'all' || poem.mood === selectedMood;

    return matchQuery && matchCategory && matchMood;
  });

  const sortedPoems = [...filteredPoems].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    // Alphabetical
    return a.title.localeCompare(b.title);
  });

  // Extract all unique tags for supplementary tags filters if wished
  const allUniqueTags = Array.from(new Set(poems.flatMap((p) => p.tags || []))).slice(0, 15);

  return (
    <div id="app-root" className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col font-sans selection:bg-[#0071e3]/10 selection:text-[#0071e3] relative overflow-x-hidden">
      {/* Clean layout - no celestial yellow glows */}

      {/* Interactive Toast Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            id="global-toast"
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4.5 py-3 h-12 bg-[#1d1d1f] text-white rounded-full shadow-lg border border-white/10 text-sm font-semibold font-sans"
          >
            <div className={`w-2 h-2 rounded-full ${
              toast.type === 'success' ? 'bg-emerald-400' :
              toast.type === 'error' ? 'bg-rose-400' :
              toast.type === 'warning' ? 'bg-yellow-400' : 'bg-sky-400'
            }`} />
            <span>{toast.message}</span>
            <button
              id="toast-dismiss"
              onClick={() => setToast(null)}
              className="ml-3 text-[#86868b] hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary elegant header layout */}
      <header id="primary-header" className="bg-white/90 border-b border-[#e8e8ed] py-5 px-4 md:px-8 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Logo & Counter metrics */}
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div id="logo-icon-container" className="p-2.5 bg-[#f5f5f7] border border-[#e8e8ed] text-[#1d1d1f] rounded-xl shadow-xs">
                <Feather className="w-5 h-5 rotate-45 transform text-[#0071e3]" />
              </div>
              <div>
                <h1 id="app-heading" className="text-xl md:text-2xl font-bold tracking-tight text-[#1d1d1f] font-sans">
                  Poetry Notebook
                </h1>
                <p id="app-subheading" className="text-xs text-[#86868b] font-medium font-sans">
                  {poems.length} verses stored across {categories.length} categories
                </p>
              </div>
            </div>
          </div>

          {/* Right Action buttons group */}
          <div className="flex flex-wrap items-center gap-2">
            {isAuthorMode && (
              <>
                {/* Session lock */}
                <button
                  id="btn-lock-author"
                  onClick={handleLockAuthorMode}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-[#f5f5f7] border border-[#e8e8ed] text-[#1d1d1f] font-semibold hover:bg-[#e8e8ed] rounded-full transition-colors cursor-pointer font-sans"
                  title="Lock Author Mode and return to read-only"
                >
                  <span>Writer Session</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0071e3] animate-pulse" />
                </button>

                {/* Backup Export */}
                <button
                  id="btn-export"
                  onClick={handleExportBackup}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-white border border-[#e8e8ed] hover:bg-[#f5f5f7] rounded-full text-[#1d1d1f] font-semibold transition-colors cursor-pointer font-sans"
                  title="Export writing ledger JSON"
                >
                  <Download className="w-3.5 h-3.5 text-[#86868b]" />
                  <span>Export Ledger</span>
                </button>

                {/* Backup Import */}
                <label
                  id="lbl-import"
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-white border border-[#e8e8ed] hover:bg-[#f5f5f7] rounded-full text-[#1d1d1f] font-semibold cursor-pointer transition-colors font-sans"
                  title="Import backup file JSON"
                >
                  <Upload className="w-3.5 h-3.5 text-[#86868b]" />
                  <span>Import Ledger</span>
                  <input
                    id="file-import"
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>

                {/* Manage categories button */}
                <button
                  id="btn-manage-cats"
                  onClick={() => setIsCategoryManagerOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-white border border-[#e8e8ed] hover:bg-[#f5f5f7] rounded-full text-[#1d1d1f] font-semibold transition-colors cursor-pointer font-sans"
                >
                  <Layers className="w-3.5 h-3.5 text-[#86868b]" />
                  <span>Categories</span>
                </button>

                {/* Revert to demo */}
                <button
                  id="btn-trigger-reset"
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="p-2 text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-full border border-transparent hover:border-[#e8e8ed] transition-all cursor-pointer"
                  title="Reset notebook state back to demo poems"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Write New Poem main trigger */}
                <button
                  id="btn-trigger-new-poem"
                  onClick={() => {
                    setActivePoemForEditing(null);
                    setIsFormOpen(true);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#0071e3] hover:bg-[#0071e3]/90 text-white rounded-full text-xs font-bold transition-all ml-2 cursor-pointer shadow-xs font-sans"
                >
                  <Plus className="w-4 h-4 font-bold" />
                  <span>Inscribe Poem</span>
                </button>
              </>
            )}
          </div>

        </div>
      </header>

      {/* Main Single-Screen workspace */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-8">
        
        {/* Advanced elegant filter bar row */}
        <section id="filters-panel" className="bg-white border border-[#e8e8ed] p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md font-sans">
              <Search className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search poetry verses, titles, tags or poets..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl text-sm text-[#1d1d1f] placeholder:text-[#86868b]/70 focus:outline-none focus:ring-4 focus:ring-[#0071e3]/10 focus:border-[#0071e3] focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  id="btn-clear-search"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Right details: Sort & Mood Dropdown */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Mood Selector label */}
              <div className="flex items-center gap-1.5 font-sans">
                <span className="text-xs font-bold text-[#86868b] uppercase tracking-widest">Atmosphere:</span>
                <select
                  id="mood-filter-select"
                  value={selectedMood}
                  onChange={(e) => setSelectedMood(e.target.value)}
                  className="bg-[#f5f5f7] border border-[#e8e8ed] text-xs text-[#1d1d1f] px-3 py-1.5 rounded-lg focus:outline-none focus:ring-4 focus:ring-[#0071e3]/10 focus:border-[#0071e3] font-semibold cursor-pointer transition-all hover:bg-[#e8e8ed]"
                >
                  <option className="bg-white text-[#1d1d1f]" value="all">All Atmosphere</option>
                  <option className="bg-white text-[#1d1d1f]" value="Reflective">Reflective</option>
                  <option className="bg-white text-[#1d1d1f]" value="Melancholy">Melancholy</option>
                  <option className="bg-white text-[#1d1d1f]" value="Romantic">Romantic</option>
                  <option className="bg-white text-[#1d1d1f]" value="Hopeful">Hopeful</option>
                  <option className="bg-white text-[#1d1d1f]" value="Whimsical">Whimsical</option>
                  <option className="bg-white text-[#1d1d1f]" value="Mystical">Mystical</option>
                  <option className="bg-white text-[#1d1d1f]" value="Free">Free</option>
                </select>
              </div>

              {/* Sort selector label */}
              <div className="flex items-center gap-1.5 font-sans">
                <span className="text-xs font-bold text-[#86868b] uppercase tracking-widest">Sequence:</span>
                <button
                  id="btn-sort-chronology"
                  onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : sortBy === 'oldest' ? 'alphabetical' : 'newest')}
                  className="flex items-center gap-1 px-3.5 py-1.5 bg-[#f5f5f7] hover:bg-[#e8e8ed] border border-[#e8e8ed] text-xs text-[#1d1d1f] rounded-lg font-semibold transition-all cursor-pointer"
                >
                  {sortBy === 'newest' && <Clock className="w-3.5 h-3.5 text-[#0071e3]" />}
                  {sortBy === 'oldest' && <Clock className="w-3.5 h-3.5 rotate-180 transform text-[#0071e3]" />}
                  {sortBy === 'alphabetical' && <ArrowUpDown className="w-3.5 h-3.5 text-[#0071e3]" />}
                  <span>{sortBy === 'newest' ? 'Newest First' : sortBy === 'oldest' ? 'Oldest First' : 'A to Z'}</span>
                </button>
              </div>
            </div>

          </div>

          <div className="border-t border-[#e8e8ed] pt-4 flex flex-col md:flex-row md:items-start gap-3">
            <span className="text-xs font-bold text-[#86868b] uppercase tracking-widest font-sans mt-2">Category:</span>
            {/* Horizontal Categories Row */}
            <div id="category-scroller" className="flex flex-wrap items-center gap-2">
              <button
                id="cat-pill-all"
                onClick={() => setSelectedCatId('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-all duration-200 ${
                  selectedCatId === 'all'
                    ? 'bg-[#1d1d1f] border-[#1d1d1f] text-white font-bold shadow-xs'
                    : 'bg-[#f5f5f7] hover:bg-[#e8e8ed] border-[#e8e8ed] text-[#1d1d1f]'
                }`}
              >
                All Verses ({poems.length})
              </button>
              {categories.map((cat) => {
                const count = poems.filter((poem) => poem.categoryId === cat.id).length;
                const isSelected = selectedCatId === cat.id;
                return (
                  <button
                    id={`cat-pill-${cat.id}`}
                    key={cat.id}
                    onClick={() => setSelectedCatId(cat.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-all duration-200 ${
                      isSelected
                        ? 'bg-[#0071e3] border-[#0071e3] text-white font-bold shadow-xs'
                        : 'bg-[#f5f5f7] hover:bg-[#e8e8ed] border-[#e8e8ed] text-[#1d1d1f]'
                    }`}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Content Section - Grid representing layout */}
        <section id="poetry-room-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="room-header" className="text-xs font-bold text-[#86868b] uppercase tracking-widest font-sans">
              {filteredPoems.length === poems.length 
                ? '✦ Notebook Records Archive' 
                : `✦ ${filteredPoems.length} of ${poems.length} verses revealed`}
            </h2>
            {filteredPoems.length > 0 && (
              <span id="filtered-indicator" className="text-xs font-sans text-[#86868b] font-medium">
                Double click card to preview details
              </span>
            )}
          </div>

          <AnimatePresence mode="popLayout">
            {sortedPoems.length === 0 ? (
              <motion.div
                id="empty-state-card"
                key="empty-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white border border-[#e8e8ed] rounded-3xl p-12 text-center max-w-xl mx-auto shadow-xs flex flex-col items-center justify-center space-y-4"
              >
                <div className="w-16 h-16 bg-[#f5f5f7] border border-[#e8e8ed] rounded-full flex items-center justify-center text-[#86868b]">
                  <Feather className="w-8 h-8 rotate-12 transform text-[#0071e3]" />
                </div>
                <h3 className="text-xl font-sans font-bold text-[#1d1d1f] tracking-tight">
                  No Poetry Entries Found
                </h3>
                <p className="text-[#86868b] text-sm max-w-sm font-sans font-medium leading-relaxed">
                  {isAuthorMode
                    ? "No classical verses aligned with your current search. Grab the quill and save a new entry!"
                    : "No classical verses aligned with your current search. Feel free to clear the search criteria or switch categories."}
                </p>
                {isAuthorMode ? (
                  <button
                    id="btn-empty-inscribe"
                    onClick={() => {
                      setActivePoemForEditing(null);
                      setIsFormOpen(true);
                    }}
                    className="px-5 py-2.5 bg-[#0071e3] hover:bg-[#0071e3]/90 text-white text-xs font-bold rounded-full shadow-xs transition-all cursor-pointer font-sans"
                  >
                    Begin Writing
                  </button>
                ) : (
                  <p className="text-[10px] text-[#86868b] font-bold tracking-wider uppercase font-sans">
                    ✦ Secure Reader Ledger ✦
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div
                id="poems-grid"
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                tabIndex={0}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {sortedPoems.map((poem, index) => (
                  <motion.div
                    id={`poem-grid-item-${poem.id}`}
                    key={poem.id}
                    layoutId={`poem-${poem.id}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.05, 0.4) }}
                  >
                    <PoemCard
                      poem={poem}
                      categories={categories}
                      onSelect={(p) => setActivePoemForReading(p)}
                      onEdit={(p) => {
                        setActivePoemForEditing(p);
                        setIsFormOpen(true);
                      }}
                      onDelete={handleDeletePoem}
                      isEditable={isAuthorMode}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

      </main>

      {/* Minimal Footer */}
      <footer id="primary-footer" className="bg-[#05060f] border-t border-slate-900 py-6 px-4 md:px-8 mt-auto relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium font-sans">
          <p>© {new Date().getFullYear()} Poetry Notebook. Custom Midnight Celestial Theme.</p>
          <div className="flex items-center gap-4">
            {isAuthorMode ? (
              <div className="flex items-center gap-4">
                <span className="text-amber-500/30">✦ Celestial Ledger Secured</span>
                <span className="text-slate-600">|</span>
                <button 
                  id="footer-lock"
                  onClick={handleLockAuthorMode}
                  className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer select-none transition-colors"
                  title="Lock author mode"
                >
                  Logout from Scribal Session 🔓
                </button>
              </div>
            ) : (
              <span 
                id="footer-secret-unlock"
                onClick={() => setIsPasscodeModalOpen(true)}
                className="text-amber-500/15 hover:text-amber-500/40 cursor-pointer select-none transition-colors font-medium text-[11px]"
                title="Scribal Portal"
              >
                ✦ Celestial Ledger Secured
              </span>
            )}
          </div>
        </div>
      </footer>

      {/* --- Overlay Modals (Using motion animate) --- */}

      {/* 1. Poem Creation & Edit Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div id="modal-container-form" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop cover */}
            <motion.div
              id="backdrop-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsFormOpen(false);
                setActivePoemForEditing(null);
              }}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs"
            />
            {/* Modal Sheet panel */}
            <motion.div
              id="sheet-form"
              initial={{ scale: 0.95, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 12, opacity: 0 }}
              className="bg-[#FCFBF7] border border-amber-200/60 rounded-2xl p-6 sm:p-8 shadow-[0_10px_40px_rgba(139,92,26,0.12)] relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto text-stone-900"
            >
              <PoemForm
                poem={activePoemForEditing}
                categories={categories}
                onSave={handleSavePoem}
                onCancel={() => {
                  setIsFormOpen(false);
                  setActivePoemForEditing(null);
                }}
                onAddCategory={handleAddCategory}
              />
            </motion.div>
          </div>
        )}
       </AnimatePresence>

       {/* 2. Poem Reader Focus Modal */}
       <AnimatePresence>
        {activePoemForReading && (
          <div id="modal-container-reader" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              id="backdrop-reader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePoemForReading(null)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs"
            />
            {/* Content box */}
            <motion.div
              id="sheet-reader"
              initial={{ scale: 0.95, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 12, opacity: 0 }}
              className="bg-[#FCFBF7] border border-amber-200/60 rounded-2xl p-6 sm:p-8 shadow-[0_10px_40px_rgba(139,92,26,0.12)] relative z-10 w-full max-w-2xl text-stone-900"
            >
              <PoemReader
                poem={activePoemForReading}
                categories={categories}
                onClose={() => setActivePoemForReading(null)}
                onEdit={(p) => {
                  setActivePoemForEditing(p);
                  setIsFormOpen(true);
                }}
                isEditable={isAuthorMode}
              />
            </motion.div>
          </div>
        )}
       </AnimatePresence>

       {/* 3. Category Manager Modal */}
       <AnimatePresence>
        {isCategoryManagerOpen && (
          <div id="modal-container-cat-mgr" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              id="backdrop-cat-mgr"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCategoryManagerOpen(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs"
            />
            <motion.div
              id="sheet-cat-mgr"
              initial={{ scale: 0.95, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 12, opacity: 0 }}
              className="bg-white border border-[#e8e8ed] rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 w-full max-w-md space-y-6 text-[#1d1d1f]"
            >
              <div className="flex items-center justify-between border-b pb-4 border-[#e8e8ed]">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#0071e3]" />
                  <h3 id="cat-mgr-title" className="text-lg font-sans font-bold text-[#1d1d1f] tracking-tight">
                    Category Manager
                  </h3>
                </div>
                <button
                  id="btn-close-cat-mgr"
                  onClick={() => setIsCategoryManagerOpen(false)}
                  className="text-[#86868b] hover:text-[#1d1d1f] rounded-full p-1.5 hover:bg-[#f5f5f7] transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Add category box */}
              <div className="space-y-2 font-sans">
                <label className="text-xs font-bold text-[#86868b] uppercase tracking-wider block">
                  Add New Category
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="input-mgr-add-cat"
                    type="text"
                    value={newCatNameInput}
                    onChange={(e) => setNewCatNameInput(e.target.value)}
                    placeholder="e.g., Space Travel"
                    className="flex-1 px-3.5 py-2.5 bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl text-sm text-[#1d1d1f] outline-none focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const name = newCatNameInput.trim();
                        if (name) {
                          handleAddCategory(name);
                          setNewCatNameInput('');
                        }
                      }
                    }}
                  />
                  <button
                    id="btn-mgr-add-cat"
                    type="button"
                    onClick={() => {
                      const name = newCatNameInput.trim();
                      if (name) {
                        handleAddCategory(name);
                        setNewCatNameInput('');
                      }
                    }}
                    className="bg-[#0071e3] hover:bg-[#0071e3]/90 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 font-bold" />
                    Add
                  </button>
                </div>
              </div>

              {/* List of categories */}
              <div className="space-y-3 pt-2 font-sans">
                <label className="text-xs font-bold text-[#86868b] uppercase tracking-wider block">
                  Current Categories & Count
                </label>
                <div id="mgr-cat-list" className="max-h-56 overflow-y-auto divide-y divide-[#e8e8ed] border border-[#e8e8ed] rounded-2xl px-3 bg-white">
                  {categories.map((cat) => {
                    const count = poems.filter((p) => p.categoryId === cat.id).length;
                    return (
                      <div
                        id={`mgr-cat-item-${cat.id}`}
                        key={cat.id}
                        className="flex items-center justify-between py-2.5"
                      >
                        <div className="flex items-center gap-2 font-sans">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#0071e3]" />
                          <span className="text-sm text-[#1d1d1f] font-semibold">{cat.name}</span>
                          <span className="text-[11px] text-[#86868b] font-semibold">({count} {count === 1 ? 'poem' : 'poems'})</span>
                        </div>
                        <button
                          id={`btn-mgr-delete-cat-${cat.id}`}
                          onClick={() => handleDeleteCategory(cat.id)}
                          disabled={categories.length <= 1}
                          className="text-[#86868b] hover:text-red-650 disabled:opacity-30 disabled:hover:text-[#86868b] p-1.5 rounded-full hover:bg-neutral-50 transition-colors cursor-pointer"
                          title="Delete category (affected poems will be rerouted)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] text-[#86868b] leading-relaxed font-medium">
                  Note: Deleting a category will safelist the affected poems to the first remaining category.
                </p>
              </div>

              <div className="border-t border-[#e8e8ed] pt-4 flex items-center justify-end">
                <button
                  id="btn-close-cat-mgr-footer"
                  onClick={() => setIsCategoryManagerOpen(false)}
                  className="px-4.5 py-2 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] border border-[#e8e8ed] text-xs font-bold rounded-full transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Factory Reset Confirmation Modal */}
      <AnimatePresence>
        {isResetConfirmOpen && (
          <div id="modal-container-reset-confirm" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              id="backdrop-reset-confirm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsResetConfirmOpen(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs"
            />
            <motion.div
              id="sheet-reset-confirm"
              initial={{ scale: 0.95, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 12, opacity: 0 }}
              className="bg-white border border-[#e8e8ed] rounded-3xl p-6 shadow-2xl relative z-10 w-full max-w-sm space-y-4 text-[#1d1d1f]"
            >
              <div className="flex items-center gap-3 text-red-650">
                <AlertCircle className="w-6 h-6 shrink-0 text-red-500" />
                <h3 id="reset-confirm-heading" className="text-lg font-sans font-bold text-[#1d1d1f] tracking-tight">
                  Revert to Demo?
                </h3>
              </div>
              <p className="text-[#86868b] text-sm leading-relaxed font-sans font-medium">
                This will overwrite current storage entries with the Frost, Burns, and Dickinson classical demo verses.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  id="btn-cancel-reset"
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="px-4.5 py-2 border border-[#e8e8ed] text-[#86868b] hover:bg-[#f5f5f7] text-xs font-bold rounded-full transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-reset"
                  onClick={handleRevertToDemo}
                  className="px-4.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-full shadow-xs transition-colors cursor-pointer"
                >
                  Revert Notebook
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Author Portal Passcode Entry Modal */}
      <AnimatePresence>
        {isPasscodeModalOpen && (
          <div id="modal-container-passcode" className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
            <motion.div
              id="backdrop-passcode"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsPasscodeModalOpen(false);
                setEnteredPasscode('');
                setPasscodeError(false);
              }}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs"
            />
            <motion.div
              id="sheet-passcode"
              initial={{ scale: 0.95, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 12, opacity: 0 }}
              className="bg-white border border-[#e8e8ed] rounded-3xl p-6 shadow-2xl relative z-10 w-full max-w-sm space-y-5 text-[#1d1d1f]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl text-[#0071e3]">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 id="passcode-heading" className="text-lg font-sans font-bold text-[#1d1d1f] tracking-tight leading-tight">
                    Author Verification
                  </h3>
                  <p className="text-[10px] text-[#86868b] font-sans tracking-wide font-extrabold uppercase">
                    Enter Verification Key
                  </p>
                </div>
              </div>

              <p className="text-[#86868b] text-xs leading-relaxed font-sans font-medium">
                To enable writer mode, please authorize using the notebook validation password.
              </p>

              <form onSubmit={handleVerifyPasscode} className="space-y-4">
                <div className="space-y-1.5 font-sans">
                  <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider block">
                    Verification Passcode
                  </label>
                  <input
                    id="input-author-passcode"
                    type="password"
                    required
                    value={enteredPasscode}
                    onChange={(e) => {
                      setEnteredPasscode(e.target.value);
                      if (passcodeError) setPasscodeError(false);
                    }}
                    placeholder="Enter journal key..."
                    className={`w-full px-3.5 py-2.5 bg-[#f5f5f7] border ${
                      passcodeError ? 'border-red-400 focus:ring-4 focus:ring-red-100' : 'border-[#e8e8ed] focus:ring-4 focus:ring-[#0071e3]/10 focus:border-[#0071e3]'
                    } rounded-xl text-sm text-[#1d1d1f] outline-none transition-all font-mono`}
                    autoFocus
                  />
                  {passcodeError && (
                    <p className="text-[11px] text-red-600 font-bold flex items-center gap-1 mt-1">
                      ⚠️ Incorrect access token. Please verify and retry.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[10px] text-[#86868b] font-sans font-semibold">
                    Default key is: <span className="font-mono text-[#1d1d1f] not-italic font-bold">nature</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      id="btn-cancel-passcode"
                      type="button"
                      onClick={() => {
                        setIsPasscodeModalOpen(false);
                        setEnteredPasscode('');
                        setPasscodeError(false);
                      }}
                      className="px-4 py-1.5 border border-[#e8e8ed] text-[#86868b] hover:bg-[#f5f5f7] text-xs font-bold rounded-full transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      id="btn-confirm-passcode"
                      type="submit"
                      className="px-4 py-1.5 bg-[#0071e3] hover:bg-[#0071e3]/90 text-white font-bold text-xs rounded-full shadow-xs transition-colors cursor-pointer"
                    >
                      Authorize
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
