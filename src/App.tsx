/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Pen, Plus, Search, Download, Upload, Trash2, 
  Sparkles, FolderPlus, ArrowUpDown, Clock, HelpCircle, 
  Layers, ChevronDown, Check, X, RotateCcw, Quote, BookOpen, AlertCircle,
  Grid3X3, Cloud
} from 'lucide-react';
import { Poem, Category, PoemMood } from './types';
import { INITIAL_CATEGORIES, INITIAL_POEMS } from './initialData';
import { getAttachmentBlob, deleteAttachmentBlob } from './utils/attachmentDb';
import PoemForm from './components/PoemForm';
import PoemCard from './components/PoemCard';
import PoemReader from './components/PoemReader';
import DailySnapCapture from './components/DailySnapCapture';
import DailySnapCard from './components/DailySnapCard';
import CloudinarySettingsModal from './components/CloudinarySettingsModal';

// Cloud Ledger & Local Media Setup
import { uploadToStorage } from './firebase';

export default function App() {
  // --- Persistent States ---
  const [isAuthorMode, setIsAuthorMode] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('author') === 'true' || params.get('edit') === 'true' || params.get('write') === 'true') {
        localStorage.setItem('poetry_notebook_is_author_authenticated', 'true');
        return true;
      }
      const saved = localStorage.getItem('poetry_notebook_is_author_authenticated');
      // Default to false for the public, so they don't see author tools.
      return saved === 'true';
    } catch {
      return false;
    }
  });
  const [poems, setPoems] = useState<Poem[]>(() => {
    try {
      const cached = localStorage.getItem('poetry_notebook_poems_cache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const cached = localStorage.getItem('poetry_notebook_categories_cache');
      return cached ? JSON.parse(cached) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });
  const [isDbLoading, setIsDbLoading] = useState(true);

  const [appTheme, setAppTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('poetry_notebook_theme');
      if (saved === 'multicolor' || saved === 'dark') return 'dark';
      if (saved === 'paper-specimen' || saved === 'light') return 'light';
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  const [gridOverlayEnabled, setGridOverlayEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('poetry_notebook_grid_overlay');
    return saved === 'true';
  });

  // --- Filtering & Sorting States ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');

  // --- Modal States ---
  const [activePoemForReading, setActivePoemForReading] = useState<Poem | null>(null);
  const [activePoemForEditing, setActivePoemForEditing] = useState<Poem | null>(null);
  const [activePoemForLightbox, setActivePoemForLightbox] = useState<Poem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSnapFormOpen, setIsSnapFormOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isCloudinarySettingsOpen, setIsCloudinarySettingsOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // --- Load and Sync Cloud Ledger / Database ---
  useEffect(() => {
    setIsDbLoading(true);

    const loadData = async () => {
      try {
        // Load Categories from backend
        const catsRes = await fetch('/api/categories');
        if (catsRes.ok) {
          const catsData = await catsRes.json();
          setCategories(catsData);
          localStorage.setItem('poetry_notebook_categories_cache', JSON.stringify(catsData));
        } else {
          throw new Error('Categories fetch not ok');
        }
      } catch (err) {
        console.warn('Backend categories fetch failed, falling back locally:', err);
        try {
          const savedCats = localStorage.getItem('poetry_notebook_categories_cache');
          if (savedCats) {
            setCategories(JSON.parse(savedCats));
          } else {
            setCategories(INITIAL_CATEGORIES);
          }
        } catch {
          setCategories(INITIAL_CATEGORIES);
        }
      }

      try {
        // Load Poems from backend
        const poemsRes = await fetch('/api/poems');
        if (poemsRes.ok) {
          const poemsData = await poemsRes.json();
          setPoems(poemsData);
          localStorage.setItem('poetry_notebook_poems_cache', JSON.stringify(poemsData));
        } else {
          throw new Error('Poems fetch not ok');
        }
      } catch (err) {
        console.warn('Backend poems fetch failed, falling back locally:', err);
        try {
          const savedPoems = localStorage.getItem('poetry_notebook_poems_cache');
          if (savedPoems) {
            setPoems(JSON.parse(savedPoems));
          } else {
            setPoems(INITIAL_POEMS);
          }
        } catch {
          setPoems(INITIAL_POEMS);
        }
      } finally {
        setIsDbLoading(false);
      }
    };

    loadData();

    // Direct url parameters triggers
    const params = new URLSearchParams(window.location.search);
    if (params.get('author') === 'true' || params.get('edit') === 'true' || params.get('write') === 'true') {
      setIsAuthorMode(true);
      localStorage.setItem('poetry_notebook_is_author_authenticated', 'true');
      setIsPasscodeModalOpen(false);
    }
  }, []);

  // --- Toast/Notification State ---
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  // --- HTML Reference for fine-grained interactions ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newCatNameInput, setNewCatNameInput] = useState('');

  // --- Author Mode & Passcode Verification States ---
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  const [enteredPasscode, setEnteredPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);

  // --- Lightbox Verse Editing States ---
  const [isEditingVerse, setIsEditingVerse] = useState(false);
  const [editedVerseText, setEditedVerseText] = useState('');

  // Auto-sync lightbox editable verse when selected poem changes
  useEffect(() => {
    if (activePoemForLightbox) {
      setEditedVerseText(activePoemForLightbox.body || '');
      setIsEditingVerse(false);
    } else {
      setIsEditingVerse(false);
    }
  }, [activePoemForLightbox?.id]);

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
    localStorage.setItem('poetry_notebook_grid_overlay', String(gridOverlayEnabled));
  }, [gridOverlayEnabled]);

  // --- Poem Operations ---
  const handleSavePoem = async (poemData: Omit<Poem, 'id' | 'createdAt'> & { id?: string }) => {
    const isEdit = !!poemData.id;
    const id = poemData.id || `poem-${Date.now()}`;

    // Prepare full poem payload
    const existingPoem = poems.find((p) => p.id === id);
    const createdAt = existingPoem?.createdAt || new Date().toISOString();
    const finalPoem: Poem = {
      ...poemData,
      isPrivate: poemData.isPrivate ?? false,
      id,
      createdAt,
      updatedAt: new Date().toISOString(),
    };

    // Optimistic Local State Update with Persistent Cache
    setPoems((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      let updatedList = [];
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = finalPoem;
        updatedList = copy;
      } else {
        updatedList = [finalPoem, ...prev];
      }
      try {
        localStorage.setItem('poetry_notebook_poems_cache', JSON.stringify(updatedList));
      } catch (e) {
        console.warn('LocalStorage save failed', e);
      }
      return updatedList;
    });

    try {
      const response = await fetch('/api/poems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPoem),
      });
      if (response.ok) {
        showToast(isEdit ? 'Poem updated and synchronized in the cloud ledger.' : 'New poem saved and synchronized in the cloud ledger.', 'success');
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      console.error('Error saving poem to backend:', error);
      showToast('Saved locally. Cloud sync failed.', 'warning');
    } finally {
      setIsFormOpen(false);
      setActivePoemForEditing(null);
    }
  };

  const handleDeletePoem = async (id: string) => {
    // Optimistic Local State Update with Persistent Cache
    setPoems((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem('poetry_notebook_poems_cache', JSON.stringify(filtered));
      } catch (e) {
        console.warn('LocalStorage save failed', e);
      }
      return filtered;
    });
    if (activePoemForReading?.id === id) {
      setActivePoemForReading(null);
    }

    try {
      const response = await fetch(`/api/poems/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        showToast('Poem permanently removed from your ledger.', 'warning');
      } else {
        throw new Error('Removal failed');
      }
    } catch (error) {
      console.error('Error deleting poem from backend:', error);
      showToast('Deleted locally. Cloud removal failed.', 'warning');
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
      'bg-indigo-950/50 text-indigo-300 border-indigo-800/40',
      'bg-emerald-950/50 text-emerald-300 border-emerald-800/40',
      'bg-rose-950/50 text-rose-300 border-rose-800/45',
      'bg-amber-950/50 text-amber-300 border-amber-800/45',
      'bg-sky-950/50 text-sky-300 border-sky-800/40',
      'bg-teal-950/50 text-teal-300 border-teal-800/40',
      'bg-fuchsia-950/50 text-fuchsia-300 border-fuchsia-800/40',
    ];
    const newColor = pastelColors[categories.length % pastelColors.length];

    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: trimmed,
      color: newColor,
    };

    // Update Local State with Persistent Cache
    setCategories((prev) => {
      const newList = [...prev, newCat];
      try {
        localStorage.setItem('poetry_notebook_categories_cache', JSON.stringify(newList));
      } catch (e) {
        console.warn('LocalStorage save failed', e);
      }
      return newList;
    });

    const addCatToBackend = async () => {
      try {
        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCat),
        });
        if (response.ok) {
          showToast(`Category "${trimmed}" successfully created.`, 'success');
        } else {
          throw new Error('Sync failed');
        }
      } catch (err) {
        console.error('Failed to save category to backend:', err);
        showToast(`Category "${trimmed}" created locally.`, 'success');
      }
    };
    addCatToBackend();

    return newCat;
  };

  const handleDeleteCategory = async (catId: string) => {
    if (categories.length <= 1) {
      showToast('You must keep at least one category.', 'error');
      return;
    }

    const remainingCats = categories.filter((c) => c.id !== catId);
    const backupCatId = remainingCats[0]?.id || '';

    // Update Local State with Persistent Cache
    setCategories((prev) => {
      const filtered = prev.filter((c) => c.id !== catId);
      try {
        localStorage.setItem('poetry_notebook_categories_cache', JSON.stringify(filtered));
      } catch (e) {
        console.warn('LocalStorage save failed', e);
      }
      return filtered;
    });
    if (selectedCatId === catId) {
      setSelectedCatId('all');
    }
    // Update local poems category IDs
    setPoems((prev) => {
      const updatedList = prev.map((p) => {
        if (p.categoryId === catId) {
          return { ...p, categoryId: backupCatId, updatedAt: new Date().toISOString() };
        }
        return p;
      });
      try {
        localStorage.setItem('poetry_notebook_poems_cache', JSON.stringify(updatedList));
      } catch (e) {
        console.warn('LocalStorage save failed', e);
      }
      return updatedList;
    });

    try {
      const response = await fetch(`/api/categories/${catId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        showToast('Category permanently deleted. Affected poems re-routed in cloud ledger.', 'info');
      } else {
        throw new Error('Removal failed');
      }
    } catch (err) {
      console.error('Failed to delete category from backend:', err);
      showToast('Deleted locally. Cloud sync failed.', 'warning');
    }
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
          
          // Sync imported data with cloud database
          const syncImport = async () => {
             try {
               await Promise.all([
                 ...parsed.categories.map((cat: Category) =>
                   fetch('/api/categories', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify(cat),
                   })
                 ),
                 ...parsed.poems.map((poem: Poem) =>
                   fetch('/api/poems', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify(poem),
                   })
                 )
               ]);
               showToast('Import completed. Your ledger is synchronized with the cloud ledger!', 'success');
             } catch (err) {
               console.error('Failed to sync imported backup to backend:', err);
               showToast('Import completed locally. Cloud synchronization failed.', 'warning');
             }
          };
          syncImport();
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
  const handleRevertToDemo = async () => {
    setPoems(INITIAL_POEMS);
    setCategories(INITIAL_CATEGORIES);
    setSelectedCatId('all');
    setSelectedMood('all');
    setSortBy('newest');
    setIsResetConfirmOpen(false);

    try {
      const response = await fetch('/api/reset', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || INITIAL_CATEGORIES);
        setPoems(data.poems || INITIAL_POEMS);
        showToast('Successfully reset and re-seeded default cloud categories with empty ledger.', 'info');
      } else {
        throw new Error('Reset request failed');
      }
    } catch (err) {
      console.error('Failed to sync cloud ledger factory reset:', err);
      showToast('Notebook reset locally, cloud sync failed.', 'warning');
    }
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
      showToast('Welcome back, Author. Your quill is unlocked!', 'success');
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

  const handleSaveLightboxVerseChange = async () => {
    if (!activePoemForLightbox) return;
    
    // Update local poems state and cache
    const updatedPoem = {
      ...activePoemForLightbox,
      body: editedVerseText,
      updatedAt: new Date().toISOString(),
    };

    const updatedList = poems.map((p) => p.id === activePoemForLightbox.id ? updatedPoem : p);
    setPoems(updatedList);
    try {
      localStorage.setItem('poetry_notebook_poems_cache', JSON.stringify(updatedList));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }

    // Update active poem inside lightbox too!
    setActivePoemForLightbox(updatedPoem);

    try {
      const response = await fetch('/api/poems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPoem),
      });
      if (response.ok) {
        setIsEditingVerse(false);
        showToast('Verse text updated and synchronized inside your cloud ledger.', 'success');
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      console.error('Failed to write verse update to backend server:', error);
      showToast('Saved locally. Cloud sync failed.', 'warning');
      setIsEditingVerse(false);
    }
  };

  // --- Pure Search & Filter logic computation ---
  const filteredPoems = poems.filter((poem) => {
    // Hide private poems or snaps when not in Author Mode
    if (poem.isPrivate && !isAuthorMode) {
      return false;
    }

    const searchString = searchQuery.toLowerCase().trim();
    const matchQuery = 
      !searchString ||
      poem.title.toLowerCase().includes(searchString) ||
      poem.body.toLowerCase().includes(searchString) ||
      poem.tags.some((tag) => tag.toLowerCase().includes(searchString)) ||
      (poem.author && poem.author.toLowerCase().includes(searchString));

    const matchCategory = selectedCatId === 'all' || poem.categoryId === selectedCatId;
    const matchMood = selectedMood === 'all' || poem.mood === selectedMood || poem.isPhotoCapture;

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

  // Lightbox navigation controls to browse items sequentially
  const handleNextLightbox = () => {
    if (!activePoemForLightbox) return;
    const currentIndex = sortedPoems.findIndex(p => p.id === activePoemForLightbox.id);
    if (currentIndex !== -1) {
      const nextIndex = (currentIndex + 1) % sortedPoems.length;
      setActivePoemForLightbox(sortedPoems[nextIndex]);
    }
  };

  const handlePrevLightbox = () => {
    if (!activePoemForLightbox) return;
    const currentIndex = sortedPoems.findIndex(p => p.id === activePoemForLightbox.id);
    if (currentIndex !== -1) {
      const prevIndex = (currentIndex - 1 + sortedPoems.length) % sortedPoems.length;
      setActivePoemForLightbox(sortedPoems[prevIndex]);
    }
  };

  // Extract all unique tags for supplementary tags filters if wished
  const allUniqueTags = Array.from(new Set(poems.flatMap((p) => p.tags || []))).slice(0, 15);

  const hasAttachmentForLightbox = !!(activePoemForLightbox?.attachments && activePoemForLightbox.attachments.length > 0);

  return (
    <div id="app-root" className={`min-h-screen flex flex-col font-sans relative overflow-x-hidden transition-colors duration-500 ${
      appTheme === 'light'
        ? 'bg-[#f5efe0] text-neutral-800 selection:bg-orange-100 selection:text-neutral-900'
        : 'bg-[#07080d] text-[#e4e4e7] selection:bg-cyan-500/20 selection:text-cyan-300'
    }`}>
      {/* Blueprint Alignment Grid Coordinate Matrix Overlay */}
      {gridOverlayEnabled && (
        <div id="grid-coordinate-matrix" className={`absolute inset-0 bg-[linear-gradient(rgba(120,120,120,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(120,120,120,0.04)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-10 mt-20 ${
          appTheme === 'light' ? 'opacity-100' : 'opacity-70'
        }`} />
      )}

      {/* Background Glowing Ambient Aura */}
      {appTheme !== 'light' ? (
        <div className="absolute top-0 left-0 w-full h-[600px] overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[150px] -left-[100px] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[130px]" />
          <div className="absolute -top-[100px] right-[5%] w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[140px]" />
          <div className="absolute top-[300px] left-[30%] w-[600px] h-[600px] rounded-full bg-purple-500/5 blur-[160px]" />
        </div>
      ) : (
        <div className="absolute top-0 left-0 w-full h-[600px] overflow-hidden pointer-events-none z-0 opacity-40">
          <div className="absolute -top-[150px] -left-[100px] w-[500px] h-[500px] rounded-full bg-amber-400/5 blur-[120px]" />
          <div className="absolute -top-[100px] right-[5%] w-[400px] h-[400px] rounded-full bg-orange-400/5 blur-[120px]" />
        </div>
      )}

      {/* Interactive Toast Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            id="global-toast"
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4.5 py-3 h-12 bg-[#0c0d14]/90 text-white rounded-full shadow-2xl border border-cyan-500/30 text-sm font-semibold font-sans backdrop-blur-md"
          >
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              toast.type === 'success' ? 'bg-emerald-400' :
              toast.type === 'error' ? 'bg-rose-400' :
              toast.type === 'warning' ? 'bg-amber-400' : 'bg-cyan-400'
            }`} />
            <span>{toast.message}</span>
            <button
              id="toast-dismiss"
              onClick={() => setToast(null)}
              className="ml-3 text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary elegant header layout */}
      <header id="primary-header" className={`py-5 px-4 md:px-8 sticky top-0 z-40 backdrop-blur-md transition-all duration-300 relative ${
        appTheme === 'light'
          ? 'bg-[#f5efe0]/90 border-b border-[#e5dcbf] shadow-sm'
          : 'bg-[#0c0d14]/80 border-b border-neutral-850 shadow-lg shadow-black/25'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Logo & Counter metrics */}
          <div className="space-y-1 z-10">
            <div className="flex items-center gap-3">
              <div 
                id="logo-icon-container" 
                className={`p-2.5 rounded-xl shadow-md transition-all border ${
                  appTheme === 'light'
                    ? 'bg-neutral-900 border-neutral-700 text-amber-500'
                    : 'bg-neutral-900 border-neutral-800 text-cyan-400'
                }`}
              >
                <Pen className={`w-5 h-5 transform transition-all ${
                  appTheme === 'light' ? 'text-amber-500' : 'text-cyan-400'
                }`} />
              </div>
              <div>
                <h1 id="app-heading" className={`text-xl md:text-2xl font-black font-display tracking-tight transition-all ${
                  appTheme === 'light'
                    ? 'text-neutral-900 font-extrabold'
                    : 'text-[#f4f4f5]'
                }`}>
                  rayZR Talks
                </h1>
                <p id="app-subheading" className={`text-xs md:text-sm font-medium tracking-wide mt-0.5 transition-all ${
                  appTheme === 'light'
                    ? 'text-neutral-500'
                    : 'inline-block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-fuchsia-400'
                }`}>
                  Where thoughts find rhythm and stories become poetry
                </p>
                {/* Dynamically tracking metrics ledger counters */}
                <div id="header-counters" className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] md:text-xs font-mono font-bold uppercase tracking-wider ${
                    appTheme === 'light' ? 'text-neutral-600' : 'text-neutral-400'
                  }`}>
                    ✍️ <span className={`font-black ${appTheme === 'light' ? 'text-neutral-900 bg-amber-100/60 px-1.5 py-0.5 rounded-md' : 'text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded-md border border-cyan-900/30'}`}>{poems.filter(p => !p.isPhotoCapture).length}</span> Verses
                  </span>
                  <span className={`w-1 h-1 rounded-full ${appTheme === 'light' ? 'bg-[#dfd5be]' : 'bg-neutral-800'}`} />
                  <span className={`inline-flex items-center gap-1.5 text-[10px] md:text-xs font-mono font-bold uppercase tracking-wider ${
                    appTheme === 'light' ? 'text-neutral-600' : 'text-neutral-400'
                  }`}>
                    📷 <span className={`font-black ${appTheme === 'light' ? 'text-neutral-900 bg-orange-100/60 px-1.5 py-0.5 rounded-md' : 'text-pink-400 bg-fuchsia-950/40 px-1.5 py-0.5 rounded-md border border-fuchsia-900/30'}`}>{poems.filter(p => p.isPhotoCapture).length}</span> Daily Snaps
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Action buttons group */}
          <div className="flex flex-wrap items-center gap-2.5 z-10 animate-fade-in">
            {/* Grid Overlay Toggle Tool (highly typical of ARS Type Foundry specimen previewers) */}
            <button
              id="grid-overlay-toggle"
              onClick={() => {
                setGridOverlayEnabled(!gridOverlayEnabled);
                showToast(
                  gridOverlayEnabled ? 'Specimen alignment guidelines disabled.' : 'Specimen alignment guidelines enabled.',
                  'info'
                );
              }}
              className={`p-2 rounded-full transition-all border cursor-pointer flex items-center justify-center shadow-sm ${
                gridOverlayEnabled
                  ? appTheme === 'light'
                    ? 'bg-neutral-900 text-amber-400 border-neutral-800 shadow-[0_0_12px_rgba(180,140,50,0.15)] bg-[#1a1c24]'
                    : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                  : appTheme === 'light'
                    ? 'bg-[#ede6d4] border-[#e0d6be] text-neutral-600 hover:text-neutral-900 hover:border-neutral-500'
                    : 'bg-neutral-900/95 border-neutral-850 text-neutral-400 hover:text-white hover:border-neutral-700'
              }`}
              title={gridOverlayEnabled ? "Hide alignment guidelines" : "Display alignment guidelines"}
            >
              <Grid3X3 className="w-4.5 h-4.5" />
            </button>

            {/* Theme Selector Segmented Control (Always Visible) */}
            <div id="theme-selector-group" className={`flex items-center gap-0.5 border p-1 rounded-full text-[9px] font-mono tracking-wider font-extrabold uppercase mr-1.5 shadow-sm select-none transition-all ${
              appTheme === 'light'
                ? 'bg-[#ede6d4] border-[#e0d6be]'
                : 'bg-neutral-900/90 border-neutral-850'
            }`}>
              <button
                id="theme-btn-dark"
                onClick={() => {
                  setAppTheme('dark');
                  localStorage.setItem('poetry_notebook_theme', 'dark');
                  showToast('Theme set to Dark Mode.', 'info');
                }}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap select-none ${
                  appTheme === 'dark'
                    ? 'bg-neutral-800 text-cyan-400 font-black shadow-[0_0_10px_rgba(6,182,212,0.12)]'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
                title="Switch to Dark Mode"
              >
                🌙 Dark Mode
              </button>
              <button
                id="theme-btn-light"
                onClick={() => {
                  setAppTheme('light');
                  localStorage.setItem('poetry_notebook_theme', 'light');
                  showToast('Theme set to Light Mode.', 'info');
                }}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap select-none ${
                  appTheme === 'light'
                    ? 'bg-neutral-900 text-amber-200 font-black shadow-md border border-neutral-800'
                    : 'text-neutral-500 hover:text-neutral-350'
                }`}
                title="Switch to Light Mode"
              >
                ☀️ Light Mode
              </button>
            </div>

            {!isAuthorMode && (
              <button
                id="btn-header-passcode-trigger"
                onClick={() => setIsPasscodeModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs bg-[#111218]/95 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-cyan-400 font-bold rounded-full transition-all cursor-pointer font-mono tracking-wider shadow-lg"
              >
                <span>Write Portal</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-700" />
              </button>
            )}

            {isAuthorMode && (
              <>
                {/* Session lock */}
                <button
                  id="btn-lock-author"
                  onClick={handleLockAuthorMode}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-200 font-semibold hover:text-white rounded-full transition-all cursor-pointer font-mono tracking-wider"
                  title="Lock Author Mode and return to read-only"
                >
                  <span>Writer Session</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                </button>

                {/* Cloudinary Integration Status badge */}
                <div id="cloudinary-sync-status" className="flex items-center">
                  {localStorage.getItem('poetry_notebook_cloudinary_enabled') === 'true' && 
                   localStorage.getItem('poetry_notebook_cloudinary_cloud_name') && 
                   localStorage.getItem('poetry_notebook_cloudinary_upload_preset') ? (
                    <button
                      onClick={() => setIsCloudinarySettingsOpen(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-emerald-950/40 border border-emerald-850/50 hover:border-emerald-600 text-emerald-400 font-semibold rounded-full font-mono tracking-wider cursor-pointer font-bold"
                      title="Cloudinary media server is linked and verified. Click to configure."
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Cloudinary Vault</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsCloudinarySettingsOpen(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-amber-950/40 border border-amber-850/50 hover:border-amber-600 hover:bg-amber-900/10 text-amber-500 font-bold rounded-full font-mono tracking-wider cursor-pointer transition-all"
                      title="No Cloudinary configured. Snaps are stored locally. Click here to configure Cloudinary."
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span>Local Media Route</span>
                    </button>
                  )}
                </div>

                {/* Backup Export */}
                <button
                  id="btn-export"
                  onClick={handleExportBackup}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-[#111218]/90 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800 rounded-full text-neutral-200 font-semibold transition-all cursor-pointer font-mono tracking-wider"
                  title="Export writing ledger JSON"
                >
                  <Download className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Export Ledg</span>
                </button>

                {/* Backup Import */}
                <label
                  id="lbl-import"
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-[#111218]/90 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800 rounded-full text-neutral-200 font-semibold cursor-pointer transition-all font-mono tracking-wider"
                  title="Import backup file JSON"
                >
                  <Upload className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Import Ledg</span>
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
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-[#111218]/90 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800 rounded-full text-neutral-200 font-semibold transition-all cursor-pointer font-mono tracking-wider"
                >
                  <Layers className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Categories</span>
                </button>

                {/* Cloudinary Settings Button */}
                <button
                  id="btn-cloudinary"
                  onClick={() => setIsCloudinarySettingsOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-[#111218]/90 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800 rounded-full text-cyan-400 font-semibold transition-all cursor-pointer font-mono tracking-wider"
                  title="Configure Cloudinary Unsigned Image Uploads"
                >
                  <Cloud className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Cloudinary</span>
                </button>

                {/* Revert to demo */}
                <button
                  id="btn-trigger-reset"
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full border border-transparent hover:border-neutral-850 transition-all cursor-pointer"
                  title="Reset notebook state back to demo poems"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Capture Day Snapshot trigger */}
                <button
                  id="btn-trigger-capture-snap"
                  onClick={() => setIsSnapFormOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#0f111a] border border-cyan-800/60 hover:border-cyan-500/80 hover:bg-neutral-900 text-cyan-400 font-display uppercase tracking-wider rounded-full text-xs font-bold transition-all ml-2 cursor-pointer shadow-lg hover:shadow-cyan-500/10"
                >
                  <span>Capture Snap 📷</span>
                </button>

                {/* Write New Poem main trigger */}
                <button
                  id="btn-trigger-new-poem"
                  onClick={() => {
                    setActivePoemForEditing(null);
                    setIsFormOpen(true);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 hover:from-cyan-400 hover:to-fuchsia-400 text-white font-display uppercase tracking-wider rounded-full text-xs font-bold transition-all ml-2 cursor-pointer shadow-lg hover:shadow-cyan-500/20"
                >
                  <Plus className="w-4 h-4 font-extrabold" />
                  <span>Inscribe Poem</span>
                </button>
              </>
            )}
          </div>

        </div>
      </header>

      {/* Main Single-Screen workspace */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-8 z-10 relative">
        
        {/* Advanced elegant filter bar row */}
        <section id="filters-panel" className={`p-6 rounded-2xl space-y-5 relative transition-all duration-300 border ${
          appTheme === 'light'
            ? 'bg-white border-[#e0d6be] text-[#1b1c20] shadow-[0_4px_24px_rgba(28,28,30,0.03)]'
            : 'bg-[#0f111a]/80 border-neutral-800/80 shadow-xl backdrop-blur-md text-[#e4e4e7]'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md font-sans">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search poetry verses, titles, tags or poets..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:bg-white transition-all font-sans ${
                  appTheme === 'light'
                    ? 'bg-[#fcfaf4] border-[#e0d6be] text-neutral-900 focus:ring-neutral-800/10 focus:border-neutral-800'
                    : 'bg-[#141622] border border-neutral-800 text-neutral-100 focus:ring-cyan-500/40 focus:border-cyan-500 focus:bg-[#181a28]'
                }`}
              />
              {searchQuery && (
                <button
                  id="btn-clear-search"
                  onClick={() => setSearchQuery('')}
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer ${
                    appTheme === 'light' ? 'text-neutral-450 hover:text-neutral-800' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Right details: Sort & Mood Dropdown */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Mood Selector label */}
              <div className="flex items-center gap-1.5 font-sans">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-mono">Atmosphere:</span>
                <select
                  id="mood-filter-select"
                  value={selectedMood}
                  onChange={(e) => setSelectedMood(e.target.value)}
                  className={`text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 font-mono font-bold uppercase tracking-wider cursor-pointer transition-all ${
                    appTheme === 'light'
                      ? 'bg-[#fcfaf4] border-[#e0d6be] text-neutral-800 focus:ring-neutral-800/10 focus:border-neutral-800 hover:bg-[#ede5d4]'
                      : 'bg-[#141622] border border-neutral-800 text-neutral-200 focus:ring-cyan-500/40 focus:border-cyan-500 hover:bg-neutral-800'
                  }`}
                >
                  <option className={appTheme === 'light' ? 'bg-white text-neutral-800' : 'bg-[#141622]'} value="all">🟢 All Atmosphere</option>
                  <option className={appTheme === 'light' ? 'bg-white text-neutral-800' : 'bg-[#141622]'} value="Reflective">Reflective</option>
                  <option className={appTheme === 'light' ? 'bg-white text-neutral-800' : 'bg-[#141622]'} value="Melancholy">Melancholy</option>
                  <option className={appTheme === 'light' ? 'bg-white text-neutral-800' : 'bg-[#141622]'} value="Romantic">Romantic</option>
                  <option className={appTheme === 'light' ? 'bg-white text-neutral-800' : 'bg-[#141622]'} value="Hopeful">Hopeful</option>
                  <option className={appTheme === 'light' ? 'bg-white text-neutral-800' : 'bg-[#141622]'} value="Whimsical">Whimsical</option>
                  <option className={appTheme === 'light' ? 'bg-white text-neutral-800' : 'bg-[#141622]'} value="Mystical">Mystical</option>
                  <option className={appTheme === 'light' ? 'bg-white text-neutral-800' : 'bg-[#141622]'} value="Free">Free</option>
                </select>
              </div>

              {/* Sort selector label */}
              <div className="flex items-center gap-1.5 font-sans">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-mono">Sequence:</span>
                <button
                  id="btn-sort-chronology"
                  onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : sortBy === 'oldest' ? 'alphabetical' : 'newest')}
                  className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                    appTheme === 'light'
                      ? 'bg-[#fcfaf4] hover:bg-[#ede5d4] border-[#e0d6be] text-neutral-805'
                      : 'bg-[#141622] hover:bg-neutral-800 border-neutral-800 text-neutral-250'
                  }`}
                >
                  {sortBy === 'newest' && <Clock className={`w-3.5 h-3.5 ${appTheme === 'light' ? 'text-amber-600' : 'text-cyan-400'}`} />}
                  {sortBy === 'oldest' && <Clock className={`w-3.5 h-3.5 rotate-180 transform ${appTheme === 'light' ? 'text-amber-600' : 'text-cyan-400'}`} />}
                  {sortBy === 'alphabetical' && <ArrowUpDown className={`w-3.5 h-3.5 ${appTheme === 'light' ? 'text-amber-600' : 'text-cyan-400'}`} />}
                  <span>{sortBy === 'newest' ? 'Newest' : sortBy === 'oldest' ? 'Oldest' : 'A to Z'}</span>
                </button>
              </div>
            </div>

          </div>

          <div className={`border-t pt-4 flex flex-col md:flex-row md:items-start gap-4 ${
            appTheme === 'light' ? 'border-[#e0d6be]' : 'border-neutral-850'
          }`}>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-mono mt-2">Category:</span>
            {/* Horizontal Categories Row */}
            <div id="category-scroller" className="flex flex-wrap items-center gap-2">
              <button
                id="cat-pill-all"
                onClick={() => setSelectedCatId('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold font-display cursor-pointer border transition-all duration-200 uppercase tracking-widest ${
                  selectedCatId === 'all'
                    ? appTheme === 'light'
                      ? 'bg-neutral-900 border-neutral-800 text-amber-200 shadow-md font-extrabold'
                      : 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white border-transparent shadow-[0_0_15px_rgba(6,182,212,0.25)] font-extrabold'
                    : appTheme === 'light'
                      ? 'bg-[#ede6d4]/50 hover:bg-[#ede6d3] border-[#e0d6be] text-neutral-700 font-semibold'
                      : 'bg-[#141622] hover:bg-neutral-800 border-neutral-800 text-neutral-300 font-semibold'
                }`}
              >
                All Entries ({poems.length})
              </button>

              <button
                id="cat-pill-snaps"
                onClick={() => setSelectedCatId('cat-snaps')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold font-display cursor-pointer border transition-all duration-200 uppercase tracking-widest ${
                  selectedCatId === 'cat-snaps'
                    ? appTheme === 'light'
                      ? 'bg-neutral-900 border-neutral-850 text-orange-200 shadow-md font-extrabold'
                      : 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white border-transparent shadow-[0_0_15px_rgba(6,182,212,0.25)] font-extrabold'
                    : appTheme === 'light'
                      ? 'bg-[#ede6d4]/50 hover:bg-[#ede6d3] border-[#e0d6be] text-neutral-700 font-semibold'
                      : 'bg-[#141622] hover:bg-neutral-800 border-neutral-800 text-cyan-400 border-cyan-950/40 font-semibold'
                }`}
              >
                Daily Snaps 📷 ({poems.filter(p => p.isPhotoCapture).length})
              </button>
              {categories.map((cat, index) => {
                const count = poems.filter((poem) => poem.categoryId === cat.id).length;
                const isSelected = selectedCatId === cat.id;
                
                // Beautiful vibrant gradients for active category selection
                const gradientColors = [
                  'from-violet-500 to-fuchsia-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]',
                  'from-emerald-400 to-teal-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
                  'from-pink-500 to-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]',
                  'from-amber-400 to-orange-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
                  'from-blue-500 to-cyan-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]',
                ];
                const activeGrad = gradientColors[index % gradientColors.length];

                return (
                  <button
                    id={`cat-pill-${cat.id}`}
                    key={cat.id}
                    onClick={() => setSelectedCatId(cat.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold font-display cursor-pointer border transition-all duration-200 uppercase tracking-widest ${
                      isSelected
                        ? appTheme === 'light'
                          ? 'bg-neutral-900 border-neutral-850 text-orange-200 shadow-md font-black'
                          : `bg-gradient-to-r ${activeGrad} border-transparent text-white`
                        : appTheme === 'light'
                          ? 'bg-[#ede6d4]/50 hover:bg-[#ede6d3] border-[#e0d6be] text-neutral-700 font-semibold'
                          : 'bg-[#141622] hover:bg-neutral-800 border-neutral-800 text-neutral-300'
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
            <h2 id="room-header" className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-mono">
              {filteredPoems.length === poems.length 
                ? '' 
                : `✦ ${filteredPoems.length} of ${poems.length} items revealed`}
            </h2>
            {filteredPoems.length > 0 && (
              <span 
                id="filtered-indicator" 
                className={`text-[10px] uppercase font-mono tracking-wider px-2.5 py-1 rounded-full animate-pulse border transition-colors ${
                  appTheme === 'light'
                    ? 'text-neutral-700 bg-neutral-100 border-neutral-300'
                    : 'text-cyan-400 bg-cyan-950/20 border-cyan-900/40'
                }`}
              >
                ✦ Click a verse card below to read details
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
                  <Pen className="w-8 h-8 transform text-[#0071e3]" />
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
                    {poem.isPhotoCapture ? (
                      <DailySnapCard
                        poem={poem}
                        onSelectMedia={(p) => setActivePoemForLightbox(p)}
                        onDelete={handleDeletePoem}
                        onEdit={(p) => {
                          setActivePoemForEditing(p);
                          setIsSnapFormOpen(true);
                        }}
                        isEditable={isAuthorMode}
                        appTheme={appTheme}
                        gridOverlayEnabled={gridOverlayEnabled}
                      />
                    ) : (
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
                        onSelectMedia={(p) => setActivePoemForLightbox(p)}
                        appTheme={appTheme}
                        gridOverlayEnabled={gridOverlayEnabled}
                      />
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

      </main>

      {/* Minimal Footer */}
      <footer id="primary-footer" className="bg-[#05060f] border-t border-neutral-900 py-6 px-4 md:px-8 mt-auto relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-neutral-500 font-semibold font-mono uppercase tracking-widest">
          <p>© {new Date().getFullYear()} Created by rayZRtalks | Powered by AI Studio. Styled with {
            appTheme === 'light' ? 'Light Mode' : 'Dark Mode'
          } accents.</p>
          <div className="flex items-center gap-4">
            {isAuthorMode ? (
              <div className="flex items-center gap-4">
                <span className="text-cyan-500/40">
                  ✦ Ledger Session Active
                </span>
                <span className="text-neutral-800">|</span>
                <button 
                  id="footer-lock"
                  onClick={handleLockAuthorMode}
                  className="font-bold cursor-pointer select-none transition-colors font-mono tracking-wider text-cyan-400 hover:text-cyan-300"
                  title="Lock author mode"
                >
                  Exit Writer Panel 🔓
                </button>
              </div>
            ) : (
              <span 
                id="footer-secret-unlock"
                onClick={() => setIsPasscodeModalOpen(true)}
                className="cursor-pointer select-none transition-all duration-300 font-extrabold text-[10px] tracking-widest text-cyan-500/20 hover:text-cyan-400"
                title="Scribal Portal"
              >
                ✦ Scribal Portal Login
              </span>
            )}
          </div>
        </div>
      </footer>

      {/* --- Overlay Modals (Using motion animate) --- */}
      
      {/* 1b. Daily Picture Snapshot Modal */}
      <AnimatePresence>
        {isSnapFormOpen && (
          <div id="modal-container-snap-form" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop cover */}
            <motion.div
              id="backdrop-snap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsSnapFormOpen(false);
                setActivePoemForEditing(null);
              }}
              className="absolute inset-0 bg-neutral-950/85 backdrop-blur-sm"
            />
            {/* Modal Sheet panel */}
            <motion.div
              id="sheet-snap"
              initial={{ scale: 0.95, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 12, opacity: 0 }}
              className="bg-[#0c0d15] border border-neutral-800/80 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto text-neutral-200 animate-sans"
            >
              <DailySnapCapture
                editPoem={activePoemForEditing}
                onSave={async (snapData) => {
                  const isEdit = !!activePoemForEditing;
                  const id = activePoemForEditing?.id || `poem-snap-${Date.now()}`;
                  
                  const existingPoem = poems.find((p) => p.id === id);
                  const createdAt = existingPoem?.createdAt || snapData.createdAt || new Date().toISOString();
                  const finalSnap = {
                    ...snapData,
                    isPrivate: snapData.isPrivate ?? false,
                    id,
                    createdAt,
                    updatedAt: new Date().toISOString(),
                  };

                  // Update Local State with Persistent Cache
                  setPoems((prev) => {
                    let updatedList = [];
                    if (isEdit) {
                      updatedList = prev.map((p) => p.id === id ? finalSnap : p);
                    } else {
                      updatedList = [finalSnap, ...prev];
                    }
                    try {
                      localStorage.setItem('poetry_notebook_poems_cache', JSON.stringify(updatedList));
                    } catch (e) {
                      console.warn('LocalStorage save failed', e);
                    }
                    return updatedList;
                  });

                  try {
                    const response = await fetch('/api/poems', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(finalSnap),
                    });
                    if (response.ok) {
                      showToast(isEdit ? "Daily picture snapshot updated and synchronized in cloud ledger." : "Daily picture snapshot saved and synchronized in cloud ledger.", "success");
                    } else {
                      throw new Error('Sync failed');
                    }
                  } catch (error) {
                    console.error('Error saving snapshot to backend:', error);
                    showToast('Saved locally. Cloud sync failed.', 'warning');
                  } finally {
                    setIsSnapFormOpen(false);
                    setActivePoemForEditing(null);
                  }
                }}
                onCancel={() => {
                  setIsSnapFormOpen(false);
                  setActivePoemForEditing(null);
                }}
                appTheme={appTheme}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              className="absolute inset-0 bg-neutral-950/85 backdrop-blur-sm"
            />
            {/* Modal Sheet panel */}
            <motion.div
              id="sheet-form"
              initial={{ scale: 0.95, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 12, opacity: 0 }}
              className="bg-[#0c0d14] border border-neutral-800/80 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto text-neutral-200"
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
              className="absolute inset-0 bg-neutral-950/85 backdrop-blur-sm"
            />
            {/* Content box */}
            <motion.div
              id="sheet-reader"
              initial={{ scale: 0.95, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 12, opacity: 0 }}
              className="bg-[#0c0d14] border border-neutral-800/80 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] relative z-10 w-full max-w-2xl text-neutral-200"
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
                onSelectMedia={(p) => setActivePoemForLightbox(p)}
              />
            </motion.div>
          </div>
        )}
       </AnimatePresence>

       {/* 2b. ARS Type Foundry Inspired Cinematic Media Lightbox */}
       <AnimatePresence>
         {activePoemForLightbox && (
           <div id="modal-container-lightbox" className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
             {/* Backdrop */}
             <motion.div
               id="backdrop-lightbox"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setActivePoemForLightbox(null)}
               className="absolute inset-0 bg-neutral-950/98 backdrop-blur-md"
             />

             {/* Cinematic Frame Container */}
             <motion.div
               id="lightbox-frame"
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.95, opacity: 0 }}
               transition={{ type: 'spring', damping: 26, stiffness: 170 }}
               className="bg-neutral-950 border border-neutral-800/80 rounded-2xl w-full max-w-6xl h-[85vh] md:h-[80vh] flex flex-col md:flex-row overflow-hidden relative z-10 shadow-[0_0_80px_rgba(6,182,212,0.18)]"
             >
               {/* 1. Primary Widescreen Media Display Area */}
               <div className={`bg-black relative flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-neutral-900 group transition-all duration-300 ${
                 hasAttachmentForLightbox 
                   ? 'h-[55%] md:h-auto md:flex-1' 
                   : 'h-[15%] md:h-auto md:flex-1'
               }`}>
                 {/* Blueprint coordinate matrix background */}
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:24px_24px] opacity-40 pointer-events-none" />
                 
                 {activePoemForLightbox.attachments && activePoemForLightbox.attachments.length > 0 ? (
                   activePoemForLightbox.attachments[0].type === 'image' ? (
                     <div className="w-full h-full p-6 md:p-12 flex items-center justify-center relative font-sans">
                       <img
                         src={activePoemForLightbox.attachments[0].url}
                         alt={activePoemForLightbox.attachments[0].name}
                         className="max-w-full max-h-full object-contain shadow-[0_0_50px_rgba(0,0,0,0.9)] rounded-lg transition-transform duration-700 hover:scale-103 select-none"
                          onContextMenu={(e) => { if (!isAuthorMode) e.preventDefault(); }}
                          onDragStart={(e) => { if (!isAuthorMode) e.preventDefault(); }}
                         referrerPolicy="no-referrer"
                       />
                     </div>
                   ) : (
                     <div className="w-full h-full flex items-center justify-center p-6 bg-neutral-950">
                       <video
                         src={activePoemForLightbox.attachments[0].url}
                         className="max-w-full max-h-full shadow-[0_0_50px_rgba(0,0,0,0.9)] rounded-lg border border-neutral-900 select-none" controlsList={!isAuthorMode ? "nodownload nofullscreen noremoteplayback" : undefined} onContextMenu={(e) => { if (!isAuthorMode) e.preventDefault(); }}
                         controls
                         autoPlay
                         loop
                         playsInline
                       />
                     </div>
                   )
                 ) : (
                   /* Colossal Fallback CSS Typography Specimen Screen */
                   <div className="absolute inset-0 flex flex-col items-center justify-center p-4 md:p-8 select-none text-center">
                     <span className="font-sans font-black text-[6vw] md:text-[12vw] leading-none text-neutral-900/60 tracking-tighter uppercase mb-1 md:mb-2 animate-pulse">
                       {activePoemForLightbox.title.split(' ').map(w => w ? w[0] : '').join('').slice(0, 2).toUpperCase() || activePoemForLightbox.title.slice(0, 2).toUpperCase()}
                     </span>
                     <p className="hidden md:block font-mono text-xs text-neutral-600 uppercase tracking-widest leading-relaxed max-w-xs">
                       [ TYPOGRAPHIC SPECIMEN GRAPHIC // NO COVER MEDIA ASSOCIATED ]
                     </p>
                   </div>
                 )}

                 {/* Left / Right Slider Arrows */}
                 <button
                   id="lightbox-btn-prev"
                   onClick={(e) => {
                     e.stopPropagation();
                     handlePrevLightbox();
                   }}
                   className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-12 h-12 rounded-full border border-neutral-800 bg-neutral-950/90 text-neutral-400 hover:text-white hover:border-cyan-400 hover:bg-neutral-900 transition-all cursor-pointer z-10 backdrop-blur-xs shadow-md font-mono text-lg font-bold"
                   title="Previous media specimen"
                 >
                   ←
                 </button>
                 <button
                   id="lightbox-btn-next"
                   onClick={(e) => {
                     e.stopPropagation();
                     handleNextLightbox();
                   }}
                   className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-12 h-12 rounded-full border border-neutral-800 bg-neutral-950/90 text-neutral-400 hover:text-white hover:border-cyan-400 hover:bg-neutral-900 transition-all cursor-pointer z-10 backdrop-blur-xs shadow-md font-mono text-lg font-bold"
                   title="Next media specimen"
                 >
                   →
                 </button>

                 {/* Corner Blueprint Target Markers */}
                 <div className="absolute top-4 left-4 w-4 h-[1px] bg-neutral-800" />
                 <div className="absolute top-4 left-4 w-[1px] h-4 bg-neutral-800" />
                 <div className="absolute top-4 right-4 w-4 h-[1px] bg-neutral-800" />
                 <div className="absolute top-4 right-4 w-[1px] h-4 bg-neutral-800" />
                 <div className="absolute bottom-4 left-4 w-4 h-[1px] bg-neutral-800" />
                 <div className="absolute bottom-4 left-4 w-[1px] h-4 bg-neutral-800" />
                 <div className="absolute bottom-4 right-4 w-4 h-[1px] bg-neutral-800" />
                 <div className="absolute bottom-4 right-4 w-[1px] h-4 bg-neutral-800" />
               </div>

               {/* 2. Side Metadata Ledger Panel & Scrollable Excerpt */}
               <div className={`w-full md:w-96 flex flex-col justify-between bg-[#08090f] border-t md:border-t-0 md:border-l border-neutral-900 relative overflow-y-auto transition-all duration-300 ${
                 hasAttachmentForLightbox 
                   ? 'h-[45%] md:h-full p-4 sm:p-6 md:p-8' 
                   : 'h-[85%] md:h-full p-6 sm:p-8 md:p-8'
               }`}>
                 <div>
                   {/* Ledger Header: Micro specs */}
                   <div className="flex items-center justify-between border-b border-neutral-900 pb-4 mb-6">
                     <span className="font-mono text-[9.5px] font-bold text-cyan-400 tracking-widest uppercase flex items-center gap-1.5">
                       <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                       SPECIMEN SHEET
                     </span>
                     <span className="font-mono text-[9.5px] font-bold text-neutral-500 uppercase">
                       REF_{activePoemForLightbox.id.toUpperCase().slice(-5)}
                     </span>
                   </div>

                   {/* Title and author block */}
                   <div className="space-y-4 font-sans">
                     <div className="space-y-1">
                       <span className="text-[10px] font-extrabold uppercase font-mono tracking-widest bg-cyan-950/40 text-cyan-400 border border-cyan-900/50 px-2.5 py-1 rounded inline-block">
                         {categories.find(c => c.id === activePoemForLightbox.categoryId)?.name || 'Uncategorized'}
                       </span>
                       <h3 className="text-2xl font-sans font-black tracking-tight text-white leading-tight mt-3">
                         {activePoemForLightbox.title}
                       </h3>
                       <p className="text-xs font-mono text-neutral-400 uppercase tracking-wider mt-1">
                         COMPOSED BY <span className="text-neutral-200 font-semibold">{activePoemForLightbox.author || 'Anonymous'}</span>
                       </p>
                     </div>

                     {/* Divider line */}
                     <div className="w-full h-[1px] bg-neutral-900" />

                     {/* Scrollable verse segment */}
                     <div className="space-y-2.5">
                       <div className="flex items-center justify-between">
                         <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-mono font-bold block">
                           PREVIEW VERSE CAPTURE:
                         </span>
                         {isAuthorMode && (
                           <div className="flex gap-2">
                             {isEditingVerse ? (
                               <>
                                 <button
                                   id="btn-apply-lightbox-verse"
                                   onClick={handleSaveLightboxVerseChange}
                                   className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 border border-cyan-500 text-neutral-950 transition-colors font-bold cursor-pointer"
                                 >
                                   Apply
                                 </button>
                                 <button
                                   id="btn-cancel-lightbox-verse"
                                   onClick={() => {
                                     setEditedVerseText(activePoemForLightbox.body || '');
                                     setIsEditingVerse(false);
                                   }}
                                   className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-neutral-300 transition-colors cursor-pointer"
                                 >
                                   Cancel
                                 </button>
                               </>
                             ) : (
                               <button
                                 id="btn-edit-lightbox-verse"
                                 onClick={() => setIsEditingVerse(true)}
                                 className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-cyan-400 hover:text-cyan-300 transition-colors font-bold cursor-pointer"
                               >
                                 ✏️ Edit
                               </button>
                             )}
                           </div>
                         )}
                       </div>

                       {isEditingVerse ? (
                         <div className="bg-[#0b0c13] border border-cyan-900/60 p-3 rounded-xl">
                           <textarea
                             id="lightbox-verse-editor"
                             className="w-full h-32 bg-neutral-950 text-neutral-200 font-serif text-[13.5px] p-2 border border-neutral-800 rounded-lg focus:outline-none focus:border-cyan-500/50 resize-none leading-relaxed"
                             value={editedVerseText}
                             onChange={(e) => setEditedVerseText(e.target.value)}
                             placeholder="Type or paste the verse capture text here..."
                           />
                           <p className="text-[8.5px] text-neutral-500 font-mono mt-1 text-right uppercase">
                             *Changes propagate to deep reading immediately
                           </p>
                         </div>
                       ) : (
                         <div 
                           className={`bg-[#0b0c13] border border-neutral-900 p-4 rounded-xl overflow-y-auto ${!isAuthorMode ? 'select-none' : ''} ${
                             hasAttachmentForLightbox 
                               ? 'max-h-20 md:max-h-48' 
                               : 'max-h-64 md:max-h-48'
                           }`}
                           onContextMenu={(e) => { if (!isAuthorMode) e.preventDefault(); }}
                           onCopy={(e) => { if (!isAuthorMode) e.preventDefault(); }}
                         >
                           <p className="font-serif text-[14px] text-neutral-200 leading-relaxed whitespace-pre-wrap italic pl-3 border-l-2 border-cyan-500/40">
                             {activePoemForLightbox.isPhotoCapture ? activePoemForLightbox.body : (activePoemForLightbox.body.split('\n').slice(0, 5).join('\n') || 'No textual content available.')}
                             {!activePoemForLightbox.isPhotoCapture && activePoemForLightbox.body.split('\n').length > 5 && "\n..."}
                           </p>
                         </div>
                       )}
                     </div>
                   </div>
                 </div>

                 {/* Action controls */}
                 <div className="space-y-3 mt-8 font-sans">
                   <button
                     id="lightbox-btn-full-read" style={{ display: activePoemForLightbox.isPhotoCapture ? "none" : ("flex" as any) }}
                     onClick={() => {
                       setActivePoemForReading(activePoemForLightbox);
                       setActivePoemForLightbox(null);
                     }}
                     className="w-full py-4 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] cursor-pointer flex items-center justify-center gap-2"
                   >
                     <span>✦</span>
                     <span>DEEP READING PROTOCOL</span>
                   </button>
                   
                   <button
                     id="lightbox-btn-cancel"
                     onClick={() => setActivePoemForLightbox(null)}
                     className="w-full py-3.5 px-4 rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white hover:bg-neutral-900 hover:border-neutral-700 font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center"
                   >
                     CLOSE SPECIMEN
                   </button>
                 </div>
               </div>

               {/* Absolute close hover option (mobile-friendly floating cross) */}
               <button
                 id="lightbox-btn-abs-close"
                 onClick={() => setActivePoemForLightbox(null)}
                 className="absolute top-4 right-4 z-20 text-neutral-500 hover:text-white bg-neutral-950/80 p-2.5 border border-neutral-900 rounded-full cursor-pointer hover:bg-neutral-900 transition-all md:hidden animate-sans"
               >
                 ✕
               </button>
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
              className="absolute inset-0 bg-neutral-950/85 backdrop-blur-sm"
            />
            <motion.div
              id="sheet-cat-mgr"
              initial={{ scale: 0.95, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 12, opacity: 0 }}
              className="bg-[#0c0d14] border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 w-full max-w-md space-y-6 text-neutral-200"
            >
              <div className="flex items-center justify-between border-b pb-4 border-neutral-800">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  <h3 id="cat-mgr-title" className="text-lg font-display font-bold text-neutral-100 tracking-tight">
                    Category Manager
                  </h3>
                </div>
                <button
                  id="btn-close-cat-mgr"
                  onClick={() => setIsCategoryManagerOpen(false)}
                  className="text-neutral-400 hover:text-white rounded-full p-1.5 hover:bg-neutral-800 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Add category box */}
              <div className="space-y-2 font-mono">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest block font-mono">
                  Add New Category
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="input-mgr-add-cat"
                    type="text"
                    value={newCatNameInput}
                    onChange={(e) => setNewCatNameInput(e.target.value)}
                    placeholder="e.g., Space Travel"
                    className="flex-1 px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-neutral-100 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
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
                    className="bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-md font-mono uppercase tracking-wider"
                  >
                    <Plus className="w-3.5 h-3.5 font-bold" />
                    Add
                  </button>
                </div>
              </div>

              {/* List of categories */}
              <div className="space-y-3 pt-2 font-sans">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest block font-mono">
                  Current Categories & Count
                </label>
                <div id="mgr-cat-list" className="max-h-56 overflow-y-auto divide-y divide-neutral-800 border border-neutral-800 rounded-2xl px-3 bg-[#111218]">
                  {categories.map((cat) => {
                    const count = poems.filter((p) => p.categoryId === cat.id).length;
                    return (
                      <div
                        id={`mgr-cat-item-${cat.id}`}
                        key={cat.id}
                        className="flex items-center justify-between py-2.5"
                      >
                        <div className="flex items-center gap-2 font-sans">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                          <span className="text-sm text-neutral-200 font-semibold">{cat.name}</span>
                          <span className="text-[11px] text-neutral-400 font-mono">({count} {count === 1 ? 'poem' : 'poems'})</span>
                        </div>
                        <button
                          id={`btn-mgr-delete-cat-${cat.id}`}
                          onClick={() => handleDeleteCategory(cat.id)}
                          disabled={categories.length <= 1}
                          className="text-neutral-400 hover:text-red-400 disabled:opacity-30 disabled:hover:text-neutral-400 p-1.5 rounded-full hover:bg-neutral-800 transition-colors cursor-pointer"
                          title="Delete category (affected poems will be repurposed)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed font-mono italic">
                  Note: Deleting a category will safe-transfer columns to the first remaining segment.
                </p>
              </div>

              <div className="border-t border-neutral-850 pt-4 flex items-center justify-end">
                <button
                  id="btn-close-cat-mgr-footer"
                  onClick={() => setIsCategoryManagerOpen(false)}
                  className="px-4.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 text-xs font-bold rounded-full transition-colors cursor-pointer font-mono tracking-wider uppercase"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3.5 Cloudinary Settings Modal */}
      <AnimatePresence>
        {isCloudinarySettingsOpen && (
          <CloudinarySettingsModal
            isOpen={isCloudinarySettingsOpen}
            onClose={() => setIsCloudinarySettingsOpen(false)}
            onShowToast={showToast}
            onEnableAuthorMode={() => {
              setIsAuthorMode(true);
              localStorage.setItem('poetry_notebook_is_author_authenticated', 'true');
            }}
          />
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
              className="absolute inset-0 bg-neutral-950/85 backdrop-blur-sm"
            />
            <motion.div
              id="sheet-reset-confirm"
              initial={{ scale: 0.95, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 12, opacity: 0 }}
              className="bg-[#0c0d14] border border-[#ff0055]/30 rounded-2xl p-6 shadow-2xl relative z-10 w-full max-w-sm space-y-4 text-neutral-200"
            >
              <div className="flex items-center gap-3 text-red-400">
                <AlertCircle className="w-6 h-6 shrink-0 text-red-400" />
                <h3 id="reset-confirm-heading" className="text-lg font-display font-bold text-neutral-100 tracking-tight">
                  Revert to Demo?
                </h3>
              </div>
              <p className="text-neutral-400 text-xs leading-relaxed font-mono">
                This will overwrite current storage entries with the Frost, Burns, and Dickinson classical demo verses.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  id="btn-cancel-reset"
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="px-4.5 py-2 border border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white text-xs font-bold rounded-full transition-colors cursor-pointer font-mono tracking-widest uppercase"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-reset"
                  onClick={handleRevertToDemo}
                  className="px-4.5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-full shadow-md transition-colors cursor-pointer font-mono tracking-widest uppercase"
                >
                  Revert
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
              className="absolute inset-0 bg-neutral-950/85 backdrop-blur-sm"
            />
            <motion.div
              id="sheet-passcode"
              initial={{ scale: 0.95, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 12, opacity: 0 }}
              className="bg-[#0c0d14] border border-neutral-800 rounded-2xl p-6 shadow-2xl relative z-10 w-full max-w-sm space-y-5 text-neutral-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-cyan-400">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 id="passcode-heading" className="text-lg font-display font-bold text-neutral-100 tracking-tight leading-tight">
                    Author Verification
                  </h3>
                  <p className="text-[9px] text-cyan-400 font-mono tracking-widest font-extrabold uppercase">
                    Enter Verification Key
                  </p>
                </div>
              </div>

              <p className="text-neutral-400 text-xs leading-relaxed font-mono">
                To enable writer mode, please authorize using the notebook validation password.
              </p>

              <form onSubmit={handleVerifyPasscode} className="space-y-4">
                <div className="space-y-1.5 font-mono">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
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
                    className={`w-full px-3.5 py-2.5 bg-[#141622] border ${
                      passcodeError ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-neutral-800 focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500'
                    } rounded-xl text-sm text-neutral-100 outline-none transition-all font-mono`}
                    autoFocus
                  />
                  {passcodeError && (
                    <p className="text-[11px] text-red-400 font-bold flex items-center gap-1 mt-1 font-mono">
                      ⚠️ Incorrect access token. Please verify and retry.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[10px] text-neutral-500 font-mono">
                    Default key: <span className="font-mono text-cyan-400 not-italic font-bold">nature</span>
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
                      className="px-4 py-1.5 border border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white text-xs font-bold rounded-full transition-colors cursor-pointer font-mono uppercase tracking-wider"
                    >
                      Close
                    </button>
                    <button
                      id="btn-confirm-passcode"
                      type="submit"
                      className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs rounded-full shadow-md transition-colors cursor-pointer font-mono uppercase tracking-wider"
                    >
                      Authorize
                    </button>
                  </div>
                </div>
              </form>

              <div className="relative py-2 select-none">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-800"></div>
                </div>
                <div className="relative flex justify-center text-[9px] uppercase font-mono tracking-widest text-neutral-500">
                  <span className="bg-[#0c0d14] px-2 font-bold">OR LINK CLOUDINARY VAULT</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  id="btn-cloudinary-modal-open-from-passcode"
                  type="button"
                  onClick={() => {
                    setIsPasscodeModalOpen(false);
                    setIsCloudinarySettingsOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 hover:text-cyan-300 hover:border-cyan-800 text-cyan-400 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer font-sans uppercase tracking-wider"
                >
                  <Cloud className="w-4 h-4 shrink-0 text-cyan-400" />
                  Configure Cloudinary Credentials
                </button>

                <div className="p-3.5 bg-[#111218]/90 border border-neutral-800/80 rounded-xl space-y-2 text-left">
                  <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-bold font-mono">
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Cloudinary Authorization</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-relaxed font-sans">
                    Setting up your custom Cloudinary Cloud Name and Upload Preset automatically authenticates and authorizes your writing privileges without relying on Google accounts or Firebase databases.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
