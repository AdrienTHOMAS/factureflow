const express = require('express');
const path = require('path');
const fs = require('fs');
const { getDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 8091;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Warm up DB connection on start
getDb().then(async (db) => {
  // Create waitlist table
  await db.exec(`CREATE TABLE IF NOT EXISTS waitlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  const apiRouter = require('./routes/api');
  const pdfRouter = require('./routes/pdf');

  // Landing page at root
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'landing.html'));
  });

  // Waitlist API
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

  // App routes
  app.use('/api', apiRouter);
  app.use('/pdf', pdfRouter);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', version: '1.0.0' });
  });

  // Static files
  app.use(express.static(path.join(__dirname, 'public')));

  // App SPA - serve index.html for /app and sub-routes
  app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.get('/app/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  });

  app.listen(PORT, () => {
    console.log(`\n🚀 FactureFlow running at http://localhost:${PORT}\n`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
