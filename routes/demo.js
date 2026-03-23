const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getDb } = require('../db');

// GET /demo — crée un compte démo temporaire et redirige vers /app
router.get('/', async (req, res) => {
  try {
    const db = await getDb();

    // ── Nettoyage des anciens comptes démo (> 1h) ──────────────────────────
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString().replace('T', ' ').split('.')[0];
    const oldDemos = await db.all(
      `SELECT id FROM users WHERE email LIKE 'demo-%@factureflow.demo' AND created_at < ?`,
      [oneHourAgo]
    );
    for (const u of oldDemos) {
      // Les documents et clients se suppriment par CASCADE
      await db.run('DELETE FROM users WHERE id = ?', [u.id]);
    }

    // ── Création du compte démo unique ────────────────────────────────────
    const demoId = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const email = `${demoId}@factureflow.demo`;
    const hash = await bcrypt.hash('demo-password-' + demoId, 6); // rounds réduits pour perf

    const userResult = await db.run(
      `INSERT INTO users (email, password_hash, company_name) VALUES (?, ?, ?)`,
      [email, hash, 'Artisan Démo — Dupont Rénovations']
    );
    const userId = userResult.lastID;

    // ── Clients démo ──────────────────────────────────────────────────────
    const client1 = await db.run(
      `INSERT INTO clients (user_id, name, email, address, city, postal_code, phone, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, 'Marie Dupont', 'marie.dupont@email.fr', '12 rue des Lilas', 'Lyon', '69003', '06 12 34 56 78', 'Cliente régulière, rénovation cuisine terminée']
    );

    const client2 = await db.run(
      `INSERT INTO clients (user_id, name, email, address, city, postal_code, phone, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, 'Pierre Martin', 'p.martin@gmail.com', '8 avenue Gambetta', 'Grenoble', '38000', '06 98 76 54 32', 'Chantier électricité en cours']
    );

    const client3 = await db.run(
      `INSERT INTO clients (user_id, name, email, address, city, postal_code, phone, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, 'Sophie Bernard', 'sophie.bernard@orange.fr', '3 chemin des Vignes', 'Bordeaux', '33000', '07 11 22 33 44', 'Devis terrasse en attente de validation']
    );

    const today = new Date();
    const fmt = (d) => d.toISOString().split('T')[0];
    const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

    // Génère des numéros uniques pour les documents démo (basés sur userId)
    const demoSuffix = String(userId).padStart(4, '0');
    const year = today.getFullYear();

    // ── Facture 1 : Marie Dupont — Rénovation cuisine (payée, 850€) ────────
    const inv1 = await db.run(
      `INSERT INTO documents (user_id, type, number, client_id, date, due_date, status, notes, total_ht, total_ttc, tva_rate, tva_amount)
       VALUES (?, 'invoice', ?, ?, ?, ?, 'paid', 'Rénovation complète de la cuisine — pose carrelage, peinture, menuiserie', 850, 850, 0, 0)`,
      [userId, `FACT-${year}-D${demoSuffix}-001`, client1.lastID, fmt(addDays(today, -45)), fmt(addDays(today, -15))]
    );
    await db.run(
      `INSERT INTO document_items (document_id, description, quantity, unit, unit_price, total, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [inv1.lastID, 'Pose carrelage cuisine (12 m²)', 12, 'm²', 35, 420, 0]
    );
    await db.run(
      `INSERT INTO document_items (document_id, description, quantity, unit, unit_price, total, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [inv1.lastID, 'Peinture murs et plafond', 1, 'forfait', 250, 250, 1]
    );
    await db.run(
      `INSERT INTO document_items (document_id, description, quantity, unit, unit_price, total, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [inv1.lastID, 'Pose portes de placard', 1, 'forfait', 180, 180, 2]
    );

    // ── Facture 2 : Pierre Martin — Installation électrique (en attente, 1200€) ──
    const inv2 = await db.run(
      `INSERT INTO documents (user_id, type, number, client_id, date, due_date, status, notes, total_ht, total_ttc, tva_rate, tva_amount)
       VALUES (?, 'invoice', ?, ?, ?, ?, 'sent', 'Installation électrique complète — tableau + prises + éclairage', 1200, 1200, 0, 0)`,
      [userId, `FACT-${year}-D${demoSuffix}-002`, client2.lastID, fmt(addDays(today, -10)), fmt(addDays(today, 20))]
    );
    await db.run(
      `INSERT INTO document_items (document_id, description, quantity, unit, unit_price, total, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [inv2.lastID, 'Mise aux normes tableau électrique', 1, 'forfait', 450, 450, 0]
    );
    await db.run(
      `INSERT INTO document_items (document_id, description, quantity, unit, unit_price, total, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [inv2.lastID, 'Pose prises et interrupteurs (15 points)', 15, 'unité', 35, 525, 1]
    );
    await db.run(
      `INSERT INTO document_items (document_id, description, quantity, unit, unit_price, total, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [inv2.lastID, 'Câblage éclairage LED salon/cuisine', 1, 'forfait', 225, 225, 2]
    );

    // ── Devis : Sophie Bernard — Terrasse (envoyé, 2400€) ─────────────────
    const quote1 = await db.run(
      `INSERT INTO documents (user_id, type, number, client_id, date, due_date, status, notes, total_ht, total_ttc, tva_rate, tva_amount)
       VALUES (?, 'quote', ?, ?, ?, ?, 'sent', 'Création terrasse bois — dalles composite + pergola légère', 2400, 2400, 0, 0)`,
      [userId, `DEVIS-${year}-D${demoSuffix}-001`, client3.lastID, fmt(addDays(today, -3)), fmt(addDays(today, 27))]
    );
    await db.run(
      `INSERT INTO document_items (document_id, description, quantity, unit, unit_price, total, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [quote1.lastID, 'Dalles composite terrasse (25 m²)', 25, 'm²', 65, 1625, 0]
    );
    await db.run(
      `INSERT INTO document_items (document_id, description, quantity, unit, unit_price, total, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [quote1.lastID, 'Pose et nivellement', 1, 'forfait', 475, 475, 1]
    );
    await db.run(
      `INSERT INTO document_items (document_id, description, quantity, unit, unit_price, total, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [quote1.lastID, 'Pergola bois traité 3x4m', 1, 'forfait', 300, 300, 2]
    );

    // ── Session active ────────────────────────────────────────────────────
    req.session.userId = userId;
    req.session.userEmail = email;
    req.session.companyName = 'Artisan Démo — Dupont Rénovations';
    req.session.isDemo = true;

    req.session.save((err) => {
      if (err) return res.status(500).json({ error: 'Erreur session: ' + err.message });
      res.redirect('/app');
    });

  } catch (e) {
    console.error('[DEMO] Error:', e);
    res.status(500).send('Erreur lors de la création du compte démo: ' + e.message);
  }
});

module.exports = router;
