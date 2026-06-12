import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const POEMS_FILE = path.join(DATA_DIR, 'poems.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');

// Ensure data directory and files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Nature & Seasons', color: 'bg-emerald-950/50 text-emerald-300 border-emerald-800/40' },
  { id: 'cat-2', name: 'Love & Affection', color: 'bg-rose-950/50 text-rose-300 border-rose-800/45' },
  { id: 'cat-3', name: 'Reflection & Silence', color: 'bg-violet-950/50 text-violet-300 border-violet-800/40' },
  { id: 'cat-4', name: 'Hope & Dreams', color: 'bg-amber-950/50 text-amber-300 border-amber-800/45' },
  { id: 'cat-5', name: 'Modern & Free Verse', color: 'bg-sky-950/50 text-sky-300 border-sky-800/40' }
];

if (!fs.existsSync(POEMS_FILE)) {
  fs.writeFileSync(POEMS_FILE, JSON.stringify([], null, 2));
}

if (!fs.existsSync(CATEGORIES_FILE)) {
  fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(DEFAULT_CATEGORIES, null, 2));
}

// Helpers for file persistence
function readPoems(): any[] {
  try {
    const content = fs.readFileSync(POEMS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading poems file:', err);
    return [];
  }
}

function writePoems(poems: any[]): void {
  try {
    fs.writeFileSync(POEMS_FILE, JSON.stringify(poems, null, 2));
  } catch (err) {
    console.error('Error writing poems file:', err);
  }
}

function readCategories(): any[] {
  try {
    const content = fs.readFileSync(CATEGORIES_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading categories file:', err);
    return DEFAULT_CATEGORIES;
  }
}

function writeCategories(categories: any[]): void {
  try {
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
  } catch (err) {
    console.error('Error writing categories file:', err);
  }
}

async function startServer() {
  const app = express();

  // Allow larger payloads in case of offline photos or base64 data uploads
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // --- API Routes ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Get all poems
  app.get('/api/poems', (req, res) => {
    res.json(readPoems());
  });

  // Save/Update a poem
  app.post('/api/poems', (req, res) => {
    const poem = req.body;
    if (!poem || !poem.id) {
       res.status(400).json({ error: 'Poem objects must have an id.' });
       return;
    }

    const poems = readPoems();
    const index = poems.findIndex((p: any) => p.id === poem.id);

    if (index !== -1) {
      poems[index] = { ...poems[index], ...poem, updatedAt: new Date().toISOString() };
    } else {
      poems.push({ ...poem, createdAt: poem.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
    }

    writePoems(poems);
    res.json({ success: true, poem: index !== -1 ? poems[index] : poem });
  });

  // Delete a poem
  app.delete('/api/poems/:id', (req, res) => {
    const { id } = req.params;
    const poems = readPoems();
    const updated = poems.filter((p: any) => p.id !== id);
    writePoems(updated);
    res.json({ success: true });
  });

  // Get all categories
  app.get('/api/categories', (req, res) => {
    res.json(readCategories());
  });

  // Save/Create a category
  app.post('/api/categories', (req, res) => {
    const cat = req.body;
    if (!cat || !cat.id) {
      res.status(400).json({ error: 'Category objects must have an id.' });
       return;
    }

    const categories = readCategories();
    const index = categories.findIndex((c: any) => c.id === cat.id);

    if (index !== -1) {
      categories[index] = { ...categories[index], ...cat };
    } else {
      categories.push(cat);
    }

    writeCategories(categories);
    res.json({ success: true, category: cat });
  });

  // Delete a category and re-route affected poems
  app.delete('/api/categories/:id', (req, res) => {
    const { id } = req.params;
    const categories = readCategories().filter((c: any) => c.id !== id);
    const backupCatId = categories[0]?.id || '';

    // Re-route poems
    const poems = readPoems().map((p: any) => {
      if (p.categoryId === id) {
        return { ...p, categoryId: backupCatId, updatedAt: new Date().toISOString() };
      }
      return p;
    });

    writeCategories(categories);
    writePoems(poems);
    res.json({ success: true, backupCatId });
  });

  // Rewrite / Reset database completely to revert to defaults (with NO poems)
  app.post('/api/reset', (req, res) => {
    writePoems([]);
    writeCategories(DEFAULT_CATEGORIES);
    res.json({ success: true, categories: DEFAULT_CATEGORIES, poems: [] });
  });

  // --- Vite Asset / Static Serving Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server fully listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
