import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

const INITIAL_CATEGORIES = [
  { id: 'cat-1', name: 'Nature & Seasons', color: 'bg-emerald-950/50 text-emerald-300 border-emerald-800/40' },
  { id: 'cat-2', name: 'Love & Affection', color: 'bg-rose-950/50 text-rose-300 border-rose-800/45' },
  { id: 'cat-3', name: 'Reflection & Silence', color: 'bg-violet-950/50 text-violet-300 border-violet-800/40' },
  { id: 'cat-4', name: 'Hope & Dreams', color: 'bg-amber-950/50 text-amber-300 border-amber-800/45' },
  { id: 'cat-5', name: 'Modern & Free Verse', color: 'bg-sky-950/50 text-sky-300 border-sky-800/40' },
];

interface Poem {
  id: string;
  title: string;
  body: string;
  categoryId: string;
  tags: string[];
  mood?: string;
  author?: string;
  createdAt: string;
  updatedAt?: string;
  attachments?: any[];
  isPhotoCapture?: boolean;
  isPrivate?: boolean;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Database {
  categories: Category[];
  poems: Poem[];
}

// Helpers for reading/writing our robust ledger database
async function getDb(): Promise<Database> {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
    const content = await fs.readFile(DB_FILE, 'utf-8');
    const data = JSON.parse(content) as Database;
    // Auto-seed default categories if empty
    if (!data.categories || data.categories.length === 0) {
      data.categories = [...INITIAL_CATEGORIES];
      await saveDb(data);
    }
    if (!data.poems) {
      data.poems = [];
    }
    return data;
  } catch {
    const defaultDb: Database = {
      categories: [...INITIAL_CATEGORIES],
      poems: [],
    };
    await saveDb(defaultDb);
    return defaultDb;
  }
}

async function saveDb(data: Database): Promise<void> {
  await fs.mkdir(DB_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '100mb' }));

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', provider: 'local-ledger' });
  });

  // Get categories list
  app.get('/api/categories', async (req, res) => {
    try {
      const db = await getDb();
      res.json(db.categories);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to read categories' });
    }
  });

  // Save/Create Category
  app.post('/api/categories', async (req, res) => {
    try {
      const db = await getDb();
      const newCat = req.body as Category;
      if (!newCat.id || !newCat.name) {
        return res.status(400).json({ error: 'Missing category id or name' });
      }

      const existingIndex = db.categories.findIndex((c) => c.id === newCat.id);
      if (existingIndex > -1) {
        db.categories[existingIndex] = newCat;
      } else {
        db.categories.push(newCat);
      }

      await saveDb(db);
      res.json({ success: true, category: newCat });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to save category' });
    }
  });

  // Delete Category
  app.delete('/api/categories/:id', async (req, res) => {
    try {
      const db = await getDb();
      const catId = req.params.id;
      db.categories = db.categories.filter((c) => c.id !== catId);

      // Re-assign any poems in this category to the first remaining category if needed
      const backupCatId = db.categories[0]?.id || '';
      db.poems = db.poems.map((poem) => {
        if (poem.categoryId === catId) {
          return { ...poem, categoryId: backupCatId };
        }
        return poem;
      });

      await saveDb(db);
      res.json({ success: true, backupCatId });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete category' });
    }
  });

  // Get all poems
  app.get('/api/poems', async (req, res) => {
    try {
      const db = await getDb();
      res.json(db.poems);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to read poems' });
    }
  });

  // Save/Create Poem
  app.post('/api/poems', async (req, res) => {
    try {
      const db = await getDb();
      const poem = req.body as Poem;
      if (!poem.id) {
        return res.status(400).json({ error: 'Missing poem id' });
      }

      const existingIndex = db.poems.findIndex((p) => p.id === poem.id);
      if (existingIndex > -1) {
        db.poems[existingIndex] = {
          ...poem,
          updatedAt: new Date().toISOString(),
        };
      } else {
        db.poems.unshift({
          ...poem,
          createdAt: poem.createdAt || new Date().toISOString(),
        });
      }

      await saveDb(db);
      res.json({ success: true, poem });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to save poem' });
    }
  });

  // Delete Poem
  app.delete('/api/poems/:id', async (req, res) => {
    try {
      const db = await getDb();
      const poemId = req.params.id;
      db.poems = db.poems.filter((p) => p.id !== poemId);
      await saveDb(db);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete poem' });
    }
  });

  // --- VITE FRONTEND INTEGRATION middleware ---
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
    console.log(`[Poetry Server] Node Full-Stack service live on http://localhost:${PORT}`);
  });
}

startServer();
