import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = 3000;

// Retrieve Supabase environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

let supabase: any = null;
let supabaseEnabled = false;

async function checkSupabaseConnection() {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      // Try a lightweight query to verify the connection & credentials
      const { data, error } = await client.from('categories').select('id').limit(1);
      if (error) {
        console.log(`[Database] Supabase connection check returned an error (likely invalid keys or tables not created yet). Fallback local JSON file storage active. Details: ${error.message}`);
        supabaseEnabled = false;
      } else {
        supabase = client;
        supabaseEnabled = true;
        console.log('[Database] Supabase cloud sync is active.');
      }
    } catch (err: any) {
      console.log(`[Database] Supabase connection check failed. Fallback local JSON file storage active. Details: ${err?.message || String(err)}`);
      supabaseEnabled = false;
    }
  } else {
    console.log('[Database] Supabase credentials not configured. Local JSON file storage is active.');
    supabaseEnabled = false;
  }
}

// Perform the check asynchronously on startup
checkSupabaseConnection();

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Log all incoming requests to console and to a persistent file for debugging
const DATA_DIR = path.join(process.cwd(), 'data');
const REQUESTS_LOG_FILE = path.join(DATA_DIR, 'server_requests.log');

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLine = `[${new Date().toISOString()}] ${req.method} ${req.url} - Status: ${res.statusCode} (${duration}ms) - UA: ${req.headers['user-agent'] || 'unknown'}\n`;
    console.log(`[SERVER LOG] ${logLine.trim()}`);
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.appendFileSync(REQUESTS_LOG_FILE, logLine, 'utf-8');
    } catch (err) {
      console.error('Failed to write to request log file:', err);
    }
  });
  next();
});

const POEMS_FILE = path.join(DATA_DIR, 'poems.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');
const CLOUDINARY_CONFIG_FILE = path.join(DATA_DIR, 'cloudinary_config.json');

// Initial baseline categories congruent with client side definitions
const INITIAL_CATEGORIES = [
  { id: 'cat-1', name: 'Nature & Seasons', color: 'bg-emerald-950/50 text-emerald-300 border-emerald-800/40' },
  { id: 'cat-2', name: 'Love & Affection', color: 'bg-rose-950/50 text-rose-300 border-rose-800/45' },
  { id: 'cat-3', name: 'Reflection & Silence', color: 'bg-violet-950/50 text-violet-300 border-violet-800/40' },
  { id: 'cat-4', name: 'Hope & Dreams', color: 'bg-amber-950/50 text-amber-300 border-amber-800/45' },
  { id: 'cat-5', name: 'Modern & Free Verse', color: 'bg-sky-950/50 text-sky-300 border-sky-800/40' },
];

function initDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(POEMS_FILE)) {
    fs.writeFileSync(POEMS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
  if (!fs.existsSync(CATEGORIES_FILE)) {
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(INITIAL_CATEGORIES, null, 2), 'utf-8');
  }
}

initDataFiles();

// Helper to read data safely
function readJSONFile(filePath: string, fallback: any = []) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return fallback;
}

// Helper to write data safely
function writeJSONFile(filePath: string, data: any) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing to ${filePath}:`, err);
  }
}

// --- API Routes ---

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Categories APIs
async function handleGetCategories(req: express.Request, res: express.Response) {
  try {
    let categories = [];
    if (supabase && supabaseEnabled) {
      try {
        const { data, error } = await supabase.from('categories').select('*');
        if (error) throw error;
        if (data && data.length > 0) {
          categories = data;
        } else {
          console.log('[Supabase] Categories table is empty. Seeding defaults...');
          const { error: insertError } = await supabase.from('categories').insert(INITIAL_CATEGORIES);
          if (insertError) {
            console.warn('[Supabase] Seeding categories failed:', insertError);
            categories = readJSONFile(CATEGORIES_FILE, INITIAL_CATEGORIES);
          } else {
            categories = INITIAL_CATEGORIES;
          }
        }
      } catch (dbErr) {
        console.warn('[Supabase] Failed to fetch categories from database, falling back to local file:', dbErr);
        categories = readJSONFile(CATEGORIES_FILE, INITIAL_CATEGORIES);
      }
    } else {
      categories = readJSONFile(CATEGORIES_FILE, INITIAL_CATEGORIES);
    }
    res.json(categories);
  } catch (err: any) {
    console.error('Error getting categories:', err);
    res.status(500).json({ error: `Failed to load categories: ${err?.message || String(err)}` });
  }
}

app.get('/api/categories', (req, res) => {
  handleGetCategories(req, res);
});

app.get('/api/categories/*', (req, res) => {
  handleGetCategories(req, res);
});

async function handlePostCategory(req: express.Request, res: express.Response) {
  try {
    const newCat = req.body;
    if (!newCat || !newCat.id || !newCat.name) {
      console.warn('Invalid category POST payload:', req.body);
      return res.status(400).json({ error: 'Invalid category format. Ensure id and name are provided.' });
    }

    if (supabase && supabaseEnabled) {
      try {
        const { error } = await supabase.from('categories').upsert(newCat);
        if (error) throw error;
        console.log(`[Supabase] Category "${newCat.name}" saved successfully.`);
      } catch (dbErr) {
        console.warn('[Supabase] Failed to save category to database, writing only locally:', dbErr);
      }
    }

    const categories = readJSONFile(CATEGORIES_FILE, INITIAL_CATEGORIES);
    const existingIdx = categories.findIndex((c: any) => c.id === newCat.id);
    if (existingIdx > -1) {
      categories[existingIdx] = newCat;
    } else {
      categories.push(newCat);
    }
    writeJSONFile(CATEGORIES_FILE, categories);
    console.log(`Successfully persisted category "${newCat.name}" (ID: ${newCat.id}) locally.`);
    res.json(newCat);
  } catch (err: any) {
    console.error('Error posting category:', err);
    res.status(500).json({ error: `Failed to persist category: ${err?.message || String(err)}` });
  }
}

app.post('/api/categories', (req, res) => {
  handlePostCategory(req, res);
});

app.post('/api/categories/*', (req, res) => {
  handlePostCategory(req, res);
});

// Helper for category deletion logic
async function deleteCategoryLogic(rawCatId: string, res: express.Response) {
  try {
    const cleanRawId = rawCatId.split('?')[0];
    const decodedRawCatId = decodeURIComponent(cleanRawId);
    const catId = decodedRawCatId;

    if (supabase && supabaseEnabled) {
      try {
        const { error } = await supabase.from('categories').delete().eq('id', catId);
        if (error) throw error;
        console.log(`[Supabase] Category ID: ${catId} deleted successfully.`);
      } catch (dbErr) {
        console.warn('[Supabase] Failed to delete category from database, updating only locally:', dbErr);
      }
    }

    const categories = readJSONFile(CATEGORIES_FILE, INITIAL_CATEGORIES);
    const filteredCategories = categories.filter((c: any) => c.id !== catId);
    writeJSONFile(CATEGORIES_FILE, filteredCategories);
    console.log(`Deleted category ID: ${catId} locally`);

    const backupCatId = filteredCategories[0]?.id || 'cat-1';

    // Update affected poems category in Supabase
    if (supabase && supabaseEnabled) {
      try {
        const { error } = await supabase
          .from('poems')
          .update({ categoryId: backupCatId, updatedAt: new Date().toISOString() })
          .eq('categoryId', catId);
        if (error) throw error;
      } catch (dbErr) {
        console.warn('[Supabase] Failed to re-route affected poems in database:', dbErr);
      }
    }

    // Update affected poems category locally
    const poems = readJSONFile(POEMS_FILE, []);
    const updatedPoems = poems.map((p: any) => {
      if (p.categoryId === catId) {
        return { ...p, categoryId: backupCatId, updatedAt: new Date().toISOString() };
      }
      return p;
    });
    writeJSONFile(POEMS_FILE, updatedPoems);

    res.json({ success: true, backupCatId });
  } catch (err: any) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: `Failed to delete category: ${err?.message || String(err)}` });
  }
}

// Categories APIs Delete Handlers
app.delete('/api/categories/:id', (req, res) => {
  deleteCategoryLogic(req.params.id, res);
});

app.delete('/api/categories/*', (req, res) => {
  const rawCatId = req.params[0] || req.originalUrl.substring(req.originalUrl.indexOf('/api/categories/') + '/api/categories/'.length);
  deleteCategoryLogic(rawCatId, res);
});

// Poems APIs
async function handleGetPoems(req: express.Request, res: express.Response) {
  try {
    let poems = [];
    if (supabase && supabaseEnabled) {
      try {
        const { data, error } = await supabase.from('poems').select('*');
        if (error) throw error;
        poems = data || [];
      } catch (dbErr) {
        console.warn('[Supabase] Failed to fetch poems from database, falling back to local file:', dbErr);
        poems = readJSONFile(POEMS_FILE, []);
      }
    } else {
      poems = readJSONFile(POEMS_FILE, []);
    }

    poems.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
    res.json(poems);
  } catch (err: any) {
    console.error('Error getting poems:', err);
    res.status(500).json({ error: `Failed to load poems: ${err?.message || String(err)}` });
  }
}

app.get('/api/poems', (req, res) => {
  handleGetPoems(req, res);
});

app.get('/api/poems/*', (req, res) => {
  handleGetPoems(req, res);
});

async function handlePostPoem(req: express.Request, res: express.Response) {
  try {
    const newPoem = req.body;
    if (!newPoem || !newPoem.id || !newPoem.title) {
      console.warn('Invalid poem POST payload received:', req.body);
      return res.status(400).json({ error: 'Invalid poem format. Ensure id and title are provided.' });
    }

    if (supabase && supabaseEnabled) {
      try {
        const payload = {
          id: newPoem.id,
          title: newPoem.title,
          body: newPoem.body || '',
          categoryId: newPoem.categoryId || '',
          mood: newPoem.mood || '',
          createdAt: newPoem.createdAt || new Date().toISOString(),
          updatedAt: newPoem.updatedAt || new Date().toISOString(),
          attachments: newPoem.attachments || []
        };
        const { error } = await supabase.from('poems').upsert(payload);
        if (error) throw error;
        console.log(`[Supabase] Poem "${newPoem.title}" saved successfully.`);
      } catch (dbErr) {
        console.warn('[Supabase] Failed to save poem to database, writing only locally:', dbErr);
      }
    }

    const poems = readJSONFile(POEMS_FILE, []);
    const existingIdx = poems.findIndex((p: any) => p.id === newPoem.id);
    if (existingIdx > -1) {
      poems[existingIdx] = newPoem;
    } else {
      poems.unshift(newPoem);
    }
    writeJSONFile(POEMS_FILE, poems);
    console.log(`Successfully persisted poem "${newPoem.title}" (ID: ${newPoem.id}) locally.`);
    res.json(newPoem);
  } catch (err: any) {
    console.error('Error posting poem:', err);
    res.status(500).json({ error: `Failed to persist poem: ${err?.message || String(err)}` });
  }
}

app.post('/api/poems', (req, res) => {
  handlePostPoem(req, res);
});

app.post('/api/poems/*', (req, res) => {
  handlePostPoem(req, res);
});

// Helper for poem deletion logic
async function deletePoemLogic(rawId: string, res: express.Response) {
  try {
    const cleanRawId = rawId.split('?')[0];
    const decodedRawId = decodeURIComponent(cleanRawId);
    const id = decodedRawId;

    console.log(`Processing delete request for poem ID: ${id} (raw input: ${rawId})`);

    if (supabase && supabaseEnabled) {
      try {
        const { error } = await supabase.from('poems').delete().eq('id', id);
        if (error) throw error;
        console.log(`[Supabase] Poem ID: ${id} deleted successfully.`);
      } catch (dbErr) {
        console.warn('[Supabase] Failed to delete poem from database, updating only locally:', dbErr);
      }
    }

    const poems = readJSONFile(POEMS_FILE, []);
    const remainingPoems = poems.filter((p: any) => p.id !== id);
    writeJSONFile(POEMS_FILE, remainingPoems);
    console.log(`Poem ID ${id} deleted locally.`);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting poem:', err);
    res.status(500).json({ error: `Failed to delete poem: ${err?.message || String(err)}` });
  }
}

app.delete('/api/poems/:id', (req, res) => {
  deletePoemLogic(req.params.id, res);
});

app.delete('/api/poems/*', (req, res) => {
  const rawId = req.params[0] || req.originalUrl.substring(req.originalUrl.indexOf('/api/poems/') + '/api/poems/'.length);
  deletePoemLogic(rawId, res);
});

// Reset API
app.post('/api/reset', async (req, res) => {
  try {
    if (supabase && supabaseEnabled) {
      try {
        const { error: poemsError } = await supabase.from('poems').delete().neq('id', 'dummy_non_existent_id');
        if (poemsError) throw poemsError;

        const { error: catsError } = await supabase.from('categories').delete().neq('id', 'dummy_non_existent_id');
        if (catsError) throw catsError;

        const { error: seedError } = await supabase.from('categories').insert(INITIAL_CATEGORIES);
        if (seedError) throw seedError;

        console.log('[Supabase] Reset and seeded categories successfully.');
      } catch (dbErr) {
        console.warn('[Supabase] Failed to reset database, resetting locally only:', dbErr);
      }
    }

    writeJSONFile(POEMS_FILE, []);
    writeJSONFile(CATEGORIES_FILE, INITIAL_CATEGORIES);
    console.log('Reset database and re-seeded default categories locally.');
    res.json({ poems: [], categories: INITIAL_CATEGORIES });
  } catch (err: any) {
    console.error('Error resetting database:', err);
    res.status(500).json({ error: `Failed to reset database: ${err?.message || String(err)}` });
  }
});

// Real Persistent Local Upload Endpoint for Incognito and Fallback support
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

function handleUploadLogic(req: express.Request, res: express.Response) {
  try {
    const { filename, data } = req.body;
    if (!filename || !data) {
      return res.status(400).json({ error: 'Filename and data are required' });
    }

    const base64Data = data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(UPLOADS_DIR, safeName);

    fs.writeFileSync(filePath, buffer);

    console.log(`Successfully persisted file locally to ${filePath}`);
    res.json({ url: `/uploads/${safeName}` });
  } catch (err) {
    console.error('Local server file upload failed:', err);
    res.status(500).json({ error: 'Failed to save uploaded file on local disk server' });
  }
}

app.post('/api/upload', (req, res) => {
  handleUploadLogic(req, res);
});

app.post('/api/upload/*', (req, res) => {
  handleUploadLogic(req, res);
});

// Persistent Cloudinary configuration storage locally
app.get('/api/cloudinary-config', (req, res) => {
  try {
    const config = readJSONFile(CLOUDINARY_CONFIG_FILE, { cloudName: '', uploadPreset: '', enabled: 'false' });
    res.json(config);
  } catch (err) {
    console.error('Failed to read Cloudinary config:', err);
    res.json({ cloudName: '', uploadPreset: '', enabled: 'false' });
  }
});

app.post('/api/cloudinary-config', (req, res) => {
  try {
    const { cloudName, uploadPreset, enabled } = req.body;
    const config = {
      cloudName: cloudName || '',
      uploadPreset: uploadPreset || '',
      enabled: enabled || 'false'
    };
    writeJSONFile(CLOUDINARY_CONFIG_FILE, config);
    console.log('Successfully persisted Cloudinary config locally.');
    res.json(config);
  } catch (err) {
    console.error('Failed to write Cloudinary config:', err);
    res.status(500).json({ error: 'Failed to write Cloudinary config' });
  }
});

// Catch-all API 404 handler for unmatched routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// --- Vite Asset / Static Serving Middleware ---
async function startServer() {
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
