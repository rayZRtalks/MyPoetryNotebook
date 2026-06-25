import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`[SERVER LOG] ${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`[SERVER LOG] Request body keys: ${Object.keys(req.body).join(', ')}`);
  }
  next();
});

const DATA_DIR = path.join(process.cwd(), 'data');
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
app.get('/api/categories', (req, res) => {
  const categories = readJSONFile(CATEGORIES_FILE, INITIAL_CATEGORIES);
  res.json(categories);
});

app.post('/api/categories', (req, res) => {
  const newCat = req.body;
  if (!newCat || !newCat.id || !newCat.name) {
    return res.status(400).json({ error: 'Invalid category format' });
  }
  const categories = readJSONFile(CATEGORIES_FILE, INITIAL_CATEGORIES);
  const existingIdx = categories.findIndex((c: any) => c.id === newCat.id);
  if (existingIdx > -1) {
    categories[existingIdx] = newCat;
  } else {
    categories.push(newCat);
  }
  writeJSONFile(CATEGORIES_FILE, categories);
  res.json(newCat);
});

app.delete('/api/categories/:id', (req, res) => {
  const catId = req.params.id;
  const categories = readJSONFile(CATEGORIES_FILE, INITIAL_CATEGORIES);
  const remainingCats = categories.filter((c: any) => c.id !== catId);
  writeJSONFile(CATEGORIES_FILE, remainingCats);

  // Fallback category ID for re-routing affected poems
  const backupCatId = remainingCats[0]?.id || 'cat-1';

  // Update affected poems category
  const poems = readJSONFile(POEMS_FILE, []);
  let updated = false;
  const updatedPoems = poems.map((p: any) => {
    if (p.categoryId === catId) {
      updated = true;
      return { ...p, categoryId: backupCatId, updatedAt: new Date().toISOString() };
    }
    return p;
  });
  if (updated) {
    writeJSONFile(POEMS_FILE, updatedPoems);
  }

  res.json({ success: true, backupCatId });
});

// Poems APIs
app.get('/api/poems', (req, res) => {
  const poems = readJSONFile(POEMS_FILE, []);
  res.json(poems);
});

app.post('/api/poems', (req, res) => {
  const newPoem = req.body;
  if (!newPoem || !newPoem.id || !newPoem.title) {
    return res.status(400).json({ error: 'Invalid poem format' });
  }
  const poems = readJSONFile(POEMS_FILE, []);
  const existingIdx = poems.findIndex((p: any) => p.id === newPoem.id);
  if (existingIdx > -1) {
    poems[existingIdx] = newPoem;
  } else {
    // New poem prepended
    poems.unshift(newPoem);
  }
  writeJSONFile(POEMS_FILE, poems);
  res.json(newPoem);
});

app.delete('/api/poems/:id', (req, res) => {
  const id = req.params.id;
  const poems = readJSONFile(POEMS_FILE, []);
  const remainingPoems = poems.filter((p: any) => p.id !== id);
  writeJSONFile(POEMS_FILE, remainingPoems);
  res.json({ success: true });
});

// Reset API
app.post('/api/reset', (req, res) => {
  writeJSONFile(POEMS_FILE, []);
  writeJSONFile(CATEGORIES_FILE, INITIAL_CATEGORIES);
  res.json({ poems: [], categories: INITIAL_CATEGORIES });
});

// Real Persistent Local Upload Endpoint for Incognito and Fallback support
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

app.post('/api/upload', (req, res) => {
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
