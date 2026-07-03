import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

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
function handleGetCategories(req: express.Request, res: express.Response) {
  try {
    const categories = readJSONFile(CATEGORIES_FILE, INITIAL_CATEGORIES);
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

function handlePostCategory(req: express.Request, res: express.Response) {
  try {
    const newCat = req.body;
    if (!newCat || !newCat.id || !newCat.name) {
      console.warn('Invalid category POST payload:', req.body);
      return res.status(400).json({ error: 'Invalid category format. Ensure id and name are provided.' });
    }
    const categories = readJSONFile(CATEGORIES_FILE, INITIAL_CATEGORIES);
    const existingIdx = categories.findIndex((c: any) => c.id === newCat.id);
    if (existingIdx > -1) {
      categories[existingIdx] = newCat;
      console.log(`Successfully updated existing category "${newCat.name}" (ID: ${newCat.id}) in cloud database.`);
    } else {
      categories.push(newCat);
      console.log(`Successfully created new category "${newCat.name}" (ID: ${newCat.id}) in cloud database.`);
    }
    writeJSONFile(CATEGORIES_FILE, categories);
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
function deleteCategoryLogic(rawCatId: string, res: express.Response) {
  try {
    // Strip query parameters if present in the raw input
    const cleanRawId = rawCatId.split('?')[0];
    const decodedRawCatId = decodeURIComponent(cleanRawId);
    const catId = decodedRawCatId;

    const categories = readJSONFile(CATEGORIES_FILE, INITIAL_CATEGORIES);
    const remainingCats = categories.filter((c: any) => {
      return c.id !== catId && c.id !== cleanRawId && c.id !== decodedRawCatId;
    });
    writeJSONFile(CATEGORIES_FILE, remainingCats);

    // Fallback category ID for re-routing affected poems
    const backupCatId = remainingCats[0]?.id || 'cat-1';

    // Update affected poems category
    const poems = readJSONFile(POEMS_FILE, []);
    let updated = false;
    const updatedPoems = poems.map((p: any) => {
      if (p.categoryId === catId || p.categoryId === cleanRawId || p.categoryId === decodedRawCatId) {
        updated = true;
        return { ...p, categoryId: backupCatId, updatedAt: new Date().toISOString() };
      }
      return p;
    });
    if (updated) {
      writeJSONFile(POEMS_FILE, updatedPoems);
    }

    res.json({ success: true, backupCatId });
  } catch (err: any) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: `Failed to delete category: ${err?.message || String(err)}` });
  }
}

// Categories APIs Delete Handlers (supports both specific parameter and wildcard paths)
app.delete('/api/categories/:id', (req, res) => {
  deleteCategoryLogic(req.params.id, res);
});

app.delete('/api/categories/*', (req, res) => {
  const rawCatId = req.params[0] || req.originalUrl.substring(req.originalUrl.indexOf('/api/categories/') + '/api/categories/'.length);
  deleteCategoryLogic(rawCatId, res);
});

// Poems APIs
function handleGetPoems(req: express.Request, res: express.Response) {
  try {
    const poems = readJSONFile(POEMS_FILE, []);
    res.json(poems);
  } catch (err: any) {
    console.error('Error in GET poems:', err);
    res.status(500).json({ error: `Failed to load poems: ${err?.message || String(err)}` });
  }
}

app.get('/api/poems', (req, res) => {
  handleGetPoems(req, res);
});

app.get('/api/poems/*', (req, res) => {
  handleGetPoems(req, res);
});

function handlePostPoem(req: express.Request, res: express.Response) {
  try {
    const newPoem = req.body;
    if (!newPoem || !newPoem.id || !newPoem.title) {
      console.warn('Invalid poem POST payload received:', req.body);
      return res.status(400).json({ error: 'Invalid poem format. Ensure id and title are provided.' });
    }
    const poems = readJSONFile(POEMS_FILE, []);
    const existingIdx = poems.findIndex((p: any) => p.id === newPoem.id);
    if (existingIdx > -1) {
      poems[existingIdx] = newPoem;
      console.log(`Successfully updated existing poem "${newPoem.title}" (ID: ${newPoem.id}) in cloud database.`);
    } else {
      // New poem prepended
      poems.unshift(newPoem);
      console.log(`Successfully created new poem "${newPoem.title}" (ID: ${newPoem.id}) in cloud database.`);
    }
    writeJSONFile(POEMS_FILE, poems);
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
function deletePoemLogic(rawId: string, res: express.Response) {
  try {
    // Strip query parameters if present in the raw input
    const cleanRawId = rawId.split('?')[0];
    const decodedRawId = decodeURIComponent(cleanRawId);
    const id = decodedRawId;

    console.log(`Processing delete request for poem ID: ${id} (raw input: ${rawId})`);

    const poems = readJSONFile(POEMS_FILE, []);
    const remainingPoems = poems.filter((p: any) => {
      return p.id !== id && p.id !== cleanRawId && p.id !== decodedRawId;
    });
    writeJSONFile(POEMS_FILE, remainingPoems);
    console.log(`Poem ID ${id} deleted. Remaining poems count: ${remainingPoems.length}`);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting poem:', err);
    res.status(500).json({ error: `Failed to delete poem: ${err?.message || String(err)}` });
  }
}

// Poems APIs Delete Handlers (supports both specific parameter and wildcard paths)
app.delete('/api/poems/:id', (req, res) => {
  deletePoemLogic(req.params.id, res);
});

app.delete('/api/poems/*', (req, res) => {
  const rawId = req.params[0] || req.originalUrl.substring(req.originalUrl.indexOf('/api/poems/') + '/api/poems/'.length);
  deletePoemLogic(rawId, res);
});

// Reset API
app.post('/api/reset', (req, res) => {
  writeJSONFile(POEMS_FILE, []);
  writeJSONFile(CATEGORIES_FILE, INITIAL_CATEGORIES);
  res.json({ poems: [], categories: INITIAL_CATEGORIES });
});

// Real Persistent Local Upload Endpoint for Incognito and Fallback support
// Stored inside DATA_DIR to ensure durable cloud persistence on ephemeral Cloud Run containers
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

    // Strip out the data URL prefix if present (e.g. "data:image/png;base64,")
    const base64Data = data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Create a safe, unique filename
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

// Persistent cloud Cloudinary configuration storage
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
    console.log('Successfully persisted Cloudinary config to backend file database.');
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
