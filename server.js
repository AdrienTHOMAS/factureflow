const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const ConnectSQLite = require('connect-sqlite3')(session);
const { getDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 8091;

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Sessions ────────────────────────────────────────────────────────────────
app.use(session({
  store: new ConnectSQLite({
    db: 'sessions.db',
    dir: DATA_DIR
  }),
  secret: process.env.SESSION_SECRET || 'factureflow-secret-change-me-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    sameSite: 'lax'
  }
}));

// ── Middleware Auth ──────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  // Retourne JSON 401 si c'est une route API
  if (req.originalUrl.startsWith('/api/') || req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Authentification requise' });
  }
  res.redirect('/login');
}

// Warm up DB connection on start
getDb().then(async (db) => {
  // Create waitlist table
  await db.exec(`CREATE TABLE IF NOT EXISTS waitlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  const authRouter = require('./routes/auth');
  const apiRouter = require('./routes/api');
  const pdfRouter = require('./routes/pdf');

  // ── Routes publiques ────────────────────────────────────────────────────

  // Landing page
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'landing.html'));
  });

  // Login / Register pages
  app.get('/login', (req, res) => {
    if (req.session && req.session.userId) return res.redirect('/app');
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  });

  app.get('/register', (req, res) => {
    if (req.session && req.session.userId) return res.redirect('/app');
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
  });

  // Health check (public)
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', version: '1.0.0' });
  });

  // Waitlist API (public)
  app.post('/api/waitlist', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email required' });
      const db = await getDb();
      await db.run('INSERT OR IGNORE INTO waitlist (email) VALUES (?)', [email]);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/waitlist', async (req, res) => {
    try {
      const db = await getDb();
      const list = await db.all('SELECT * FROM waitlist ORDER BY created_at DESC');
      res.json(list);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Demo route (public)
  const demoRouter = require('./routes/demo');
  app.use('/demo', demoRouter);

  // Auth routes (public — register, login, logout, me)
  app.use('/api/auth', authRouter);

  // ── Routes protégées ─────────────────────────────────────────────────────

  // App SPA — redirect to /login if not authenticated
  app.get('/app', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.get('/app/*', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  // API routes — require auth
  app.use('/api', requireAuth, apiRouter);

  // PDF routes — require auth
  app.use('/pdf', requireAuth, pdfRouter);

  // ── Error handler ──────────────────────────────────────────────────────
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  });

  // Static files (after routes — for assets, js, css)
  app.use(express.static(path.join(__dirname, 'public')));

  app.listen(PORT, () => {
    console.log(`\n🚀 FactureFlow running at http://localhost:${PORT}\n`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
