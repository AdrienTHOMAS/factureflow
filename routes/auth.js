const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getDb } = require('../db');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, company_name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });
    if (password.length < 6) return res.status(400).json({ error: 'Mot de passe trop court (6 caractères minimum)' });

    const db = await getDb();
    const existing = await db.get('SELECT id FROM users WHERE email = ?', email.toLowerCase().trim());
    if (existing) return res.status(409).json({ error: 'Cet email est déjà utilisé' });

    const hash = await bcrypt.hash(password, 12);
    const result = await db.run(
      'INSERT INTO users (email, password_hash, company_name) VALUES (?, ?, ?)',
      [email.toLowerCase().trim(), hash, company_name || '']
    );

    req.session.userId = result.lastID;
    req.session.userEmail = email.toLowerCase().trim();
    req.session.companyName = company_name || '';

    res.status(201).json({ success: true, id: result.lastID });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE email = ?', email.toLowerCase().trim());
    if (!user) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.companyName = user.company_name;

    res.json({ success: true, id: user.id, email: user.email, company_name: user.company_name });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Non authentifié' });
  try {
    const db = await getDb();
    const user = await db.get('SELECT id, email, company_name, created_at FROM users WHERE id = ?', req.session.userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
