const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// Helper : user_id depuis la session (null si pas de session, pour données legacy)
function uid(req) {
  return req.session && req.session.userId ? req.session.userId : null;
}

// ─── Business Profile ────────────────────────────────────────────────────────

router.get('/profile', async (req, res) => {
  try {
    const db = await getDb();
    res.json(await db.get('SELECT * FROM business_profile WHERE id = 1'));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/profile', async (req, res) => {
  try {
    const db = await getDb();
    const { name, siret, address, city, postal_code, email, phone, website,
      iban, bic, tva_number, is_tva_exempt, payment_conditions, late_penalty, legal_form } = req.body;
    await db.run(`UPDATE business_profile SET
      name=?,siret=?,address=?,city=?,postal_code=?,email=?,phone=?,website=?,
      iban=?,bic=?,tva_number=?,is_tva_exempt=?,payment_conditions=?,late_penalty=?,legal_form=?
      WHERE id=1`,
      [name||'',siret||'',address||'',city||'',postal_code||'',email||'',phone||'',website||'',
       iban||'',bic||'',tva_number||'',is_tva_exempt?1:0,payment_conditions||'',late_penalty||'',legal_form||'']);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Clients ─────────────────────────────────────────────────────────────────

router.get('/clients', async (req, res) => {
  try {
    const db = await getDb();
    const userId = uid(req);
    // Chaque user voit ses clients ; les données legacy (user_id NULL) restent accessibles
    const clients = userId
      ? await db.all('SELECT * FROM clients WHERE user_id = ? OR user_id IS NULL ORDER BY name ASC', userId)
      : await db.all('SELECT * FROM clients WHERE user_id IS NULL ORDER BY name ASC');
    res.json(clients);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/clients/:id', async (req, res) => {
  try {
    const db = await getDb();
    const userId = uid(req);
    const client = userId
      ? await db.get('SELECT * FROM clients WHERE id = ? AND (user_id = ? OR user_id IS NULL)', [req.params.id, userId])
      : await db.get('SELECT * FROM clients WHERE id = ? AND user_id IS NULL', req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/clients', async (req, res) => {
  try {
    const db = await getDb();
    const { name, email, address, city, postal_code, country, siret, phone, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const userId = uid(req);
    const result = await db.run(
      `INSERT INTO clients (user_id,name,email,address,city,postal_code,country,siret,phone,notes) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [userId,name,email||'',address||'',city||'',postal_code||'',country||'France',siret||'',phone||'',notes||'']);
    res.status(201).json({ id: result.lastID });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/clients/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { name, email, address, city, postal_code, country, siret, phone, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const userId = uid(req);
    const existing = userId
      ? await db.get('SELECT * FROM clients WHERE id = ? AND (user_id = ? OR user_id IS NULL)', [req.params.id, userId])
      : await db.get('SELECT * FROM clients WHERE id = ? AND user_id IS NULL', req.params.id);
    if (!existing) return res.status(404).json({ error: 'Client not found' });
    await db.run(
      `UPDATE clients SET name=?,email=?,address=?,city=?,postal_code=?,country=?,siret=?,phone=?,notes=? WHERE id=?`,
      [name,email||'',address||'',city||'',postal_code||'',country||'France',siret||'',phone||'',notes||'',req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/clients/:id', async (req, res) => {
  try {
    const db = await getDb();
    const userId = uid(req);
    const existing = userId
      ? await db.get('SELECT * FROM clients WHERE id = ? AND (user_id = ? OR user_id IS NULL)', [req.params.id, userId])
      : await db.get('SELECT * FROM clients WHERE id = ? AND user_id IS NULL', req.params.id);
    if (!existing) return res.status(404).json({ error: 'Client not found' });
    const docCount = await db.get('SELECT COUNT(*) as count FROM documents WHERE client_id = ?', req.params.id);
    if (docCount.count > 0) return res.status(400).json({ error: "Ce client a des documents associés." });
    await db.run('DELETE FROM clients WHERE id = ?', req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Document Number Generation ──────────────────────────────────────────────

async function generateDocumentNumber(db, type) {
  const year = new Date().getFullYear();
  const prefix = type === 'invoice' ? 'FACT' : 'DEVIS';
  const existing = await db.get('SELECT last_number FROM document_counters WHERE type=? AND year=?', [type, year]);
  let num;
  if (existing) {
    num = existing.last_number + 1;
    await db.run('UPDATE document_counters SET last_number=? WHERE type=? AND year=?', [num, type, year]);
  } else {
    num = 1;
    await db.run('INSERT INTO document_counters (type,year,last_number) VALUES (?,?,1)', [type, year]);
  }
  return `${prefix}-${year}-${String(num).padStart(3, '0')}`;
}

// ─── Documents ───────────────────────────────────────────────────────────────

router.get('/documents', async (req, res) => {
  try {
    const db = await getDb();
    const { type, status, client_id } = req.query;
    const userId = uid(req);

    let query = `SELECT d.*,c.name as client_name,c.email as client_email
      FROM documents d LEFT JOIN clients c ON d.client_id=c.id WHERE 1=1`;
    const params = [];

    if (userId) {
      query += ' AND (d.user_id = ? OR d.user_id IS NULL)';
      params.push(userId);
    } else {
      query += ' AND d.user_id IS NULL';
    }

    if (type) { query += ' AND d.type=?'; params.push(type); }
    if (status) { query += ' AND d.status=?'; params.push(status); }
    if (client_id) { query += ' AND d.client_id=?'; params.push(client_id); }
    query += ' ORDER BY d.created_at DESC';
    res.json(await db.all(query, params));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/documents/:id', async (req, res) => {
  try {
    const db = await getDb();
    const userId = uid(req);
    const userFilter = userId ? '(d.user_id = ? OR d.user_id IS NULL)' : 'd.user_id IS NULL';
    const queryParams = userId ? [req.params.id, userId] : [req.params.id];

    const doc = await db.get(`
      SELECT d.*,c.name as client_name,c.email as client_email,
             c.address as client_address,c.city as client_city,
             c.postal_code as client_postal_code,c.country as client_country,
             c.siret as client_siret,c.phone as client_phone
      FROM documents d LEFT JOIN clients c ON d.client_id=c.id
      WHERE d.id=? AND ${userFilter}`, queryParams);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    doc.items = await db.all('SELECT * FROM document_items WHERE document_id=? ORDER BY sort_order ASC', req.params.id);
    res.json(doc);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/documents', async (req, res) => {
  try {
    const db = await getDb();
    const { type, client_id, date, due_date, notes, tva_rate, items } = req.body;
    if (!type || !client_id) return res.status(400).json({ error: 'Type and client are required' });
    if (!items || items.length === 0) return res.status(400).json({ error: 'At least one item is required' });

    const userId = uid(req);
    const number = await generateDocumentNumber(db, type);
    const tvaRate = parseFloat(tva_rate) || 0;
    let totalHT = 0;
    const processedItems = items.map((item, i) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      const total = Math.round(qty * price * 100) / 100;
      totalHT += total;
      return { ...item, quantity: qty, unit_price: price, total, sort_order: i };
    });
    totalHT = Math.round(totalHT * 100) / 100;
    const tvaAmount = Math.round(totalHT * tvaRate / 100 * 100) / 100;
    const totalTTC = Math.round((totalHT + tvaAmount) * 100) / 100;

    const result = await db.run(
      `INSERT INTO documents (user_id,type,number,client_id,date,due_date,notes,total_ht,total_ttc,tva_rate,tva_amount) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [userId, type, number, client_id, date||new Date().toISOString().split('T')[0], due_date||null, notes||'', totalHT, totalTTC, tvaRate, tvaAmount]);

    const docId = result.lastID;
    for (const item of processedItems) {
      await db.run(
        `INSERT INTO document_items (document_id,description,quantity,unit,unit_price,total,sort_order) VALUES (?,?,?,?,?,?,?)`,
        [docId, item.description, item.quantity, item.unit||'forfait', item.unit_price, item.total, item.sort_order]);
    }
    res.status(201).json({ id: docId, number });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/documents/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { client_id, date, due_date, status, notes, tva_rate, items } = req.body;
    const docId = parseInt(req.params.id);
    const userId = uid(req);
    const userFilter = userId ? '(user_id = ? OR user_id IS NULL)' : 'user_id IS NULL';
    const queryParams = userId ? [docId, userId] : [docId];
    const existing = await db.get(`SELECT * FROM documents WHERE id=? AND ${userFilter}`, queryParams);
    if (!existing) return res.status(404).json({ error: 'Document not found' });

    const tvaRate = tva_rate !== undefined ? parseFloat(tva_rate) : existing.tva_rate;
    let totalHT = 0;
    let processedItems = null;

    if (items) {
      processedItems = items.map((item, i) => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unit_price) || 0;
        const total = Math.round(qty * price * 100) / 100;
        totalHT += total;
        return { ...item, quantity: qty, unit_price: price, total, sort_order: i };
      });
      totalHT = Math.round(totalHT * 100) / 100;
    } else {
      totalHT = existing.total_ht;
    }

    const tvaAmount = Math.round(totalHT * tvaRate / 100 * 100) / 100;
    const totalTTC = Math.round((totalHT + tvaAmount) * 100) / 100;

    await db.run(`UPDATE documents SET client_id=?,date=?,due_date=?,status=?,notes=?,
      total_ht=?,total_ttc=?,tva_rate=?,tva_amount=?,updated_at=datetime('now') WHERE id=?`,
      [client_id||existing.client_id, date||existing.date,
       due_date!==undefined?due_date:existing.due_date,
       status||existing.status,
       notes!==undefined?notes:existing.notes,
       totalHT, totalTTC, tvaRate, tvaAmount, docId]);

    if (processedItems) {
      await db.run('DELETE FROM document_items WHERE document_id=?', docId);
      for (const item of processedItems) {
        await db.run(
          `INSERT INTO document_items (document_id,description,quantity,unit,unit_price,total,sort_order) VALUES (?,?,?,?,?,?,?)`,
          [docId, item.description, item.quantity, item.unit||'forfait', item.unit_price, item.total, item.sort_order]);
      }
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/documents/:id/status', async (req, res) => {
  try {
    const db = await getDb();
    const { status } = req.body;
    const validStatuses = ['draft','sent','paid','cancelled','accepted','refused'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const userId = uid(req);
    const userFilter = userId ? '(user_id = ? OR user_id IS NULL)' : 'user_id IS NULL';
    const queryParams = userId ? [req.params.id, userId] : [req.params.id];
    const existing = await db.get(`SELECT id FROM documents WHERE id=? AND ${userFilter}`, queryParams);
    if (!existing) return res.status(404).json({ error: 'Document not found' });
    await db.run(`UPDATE documents SET status=?,updated_at=datetime('now') WHERE id=?`, [status, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/documents/:id', async (req, res) => {
  try {
    const db = await getDb();
    const userId = uid(req);
    const userFilter = userId ? '(user_id = ? OR user_id IS NULL)' : 'user_id IS NULL';
    const queryParams = userId ? [req.params.id, userId] : [req.params.id];
    const existing = await db.get(`SELECT id FROM documents WHERE id=? AND ${userFilter}`, queryParams);
    if (!existing) return res.status(404).json({ error: 'Document not found' });
    await db.run('DELETE FROM documents WHERE id=?', req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Convert Quote → Invoice ──────────────────────────────────────────────────

router.post('/documents/:id/convert', async (req, res) => {
  try {
    const db = await getDb();
    const userId = uid(req);
    const userFilter = userId ? '(user_id = ? OR user_id IS NULL)' : 'user_id IS NULL';
    const queryParams = userId ? [req.params.id, userId] : [req.params.id];
    const doc = await db.get(`SELECT * FROM documents WHERE id=? AND ${userFilter}`, queryParams);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (doc.type !== 'quote') return res.status(400).json({ error: 'Only quotes can be converted to invoices' });

    const items = await db.all('SELECT * FROM document_items WHERE document_id=? ORDER BY sort_order ASC', req.params.id);
    const number = await generateDocumentNumber(db, 'invoice');
    const todayStr = new Date().toISOString().split('T')[0];

    const result = await db.run(
      `INSERT INTO documents (user_id,type,number,client_id,date,due_date,notes,total_ht,total_ttc,tva_rate,tva_amount) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [userId, 'invoice', number, doc.client_id, todayStr, doc.due_date || null, doc.notes, doc.total_ht, doc.total_ttc, doc.tva_rate, doc.tva_amount]);

    const newId = result.lastID;
    for (const item of items) {
      await db.run(
        `INSERT INTO document_items (document_id,description,quantity,unit,unit_price,total,sort_order) VALUES (?,?,?,?,?,?,?)`,
        [newId, item.description, item.quantity, item.unit, item.unit_price, item.total, item.sort_order]);
    }

    await db.run(`UPDATE documents SET status='accepted',updated_at=datetime('now') WHERE id=?`, req.params.id);
    res.status(201).json({ id: newId, number });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Duplicate Document ───────────────────────────────────────────────────────

router.post('/documents/:id/duplicate', async (req, res) => {
  try {
    const db = await getDb();
    const userId = uid(req);
    const userFilter = userId ? '(user_id = ? OR user_id IS NULL)' : 'user_id IS NULL';
    const queryParams = userId ? [req.params.id, userId] : [req.params.id];
    const doc = await db.get(`SELECT * FROM documents WHERE id=? AND ${userFilter}`, queryParams);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const items = await db.all('SELECT * FROM document_items WHERE document_id=? ORDER BY sort_order ASC', req.params.id);
    const number = await generateDocumentNumber(db, doc.type);
    const todayStr = new Date().toISOString().split('T')[0];

    const result = await db.run(
      `INSERT INTO documents (user_id,type,number,client_id,date,due_date,notes,total_ht,total_ttc,tva_rate,tva_amount,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [userId, doc.type, number, doc.client_id, todayStr, doc.due_date || null, doc.notes, doc.total_ht, doc.total_ttc, doc.tva_rate, doc.tva_amount, 'draft']);

    const newId = result.lastID;
    for (const item of items) {
      await db.run(
        `INSERT INTO document_items (document_id,description,quantity,unit,unit_price,total,sort_order) VALUES (?,?,?,?,?,?,?)`,
        [newId, item.description, item.quantity, item.unit, item.unit_price, item.total, item.sort_order]);
    }

    res.status(201).json({ id: newId, number });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Search ───────────────────────────────────────────────────────────────────

router.get('/search', async (req, res) => {
  try {
    const db = await getDb();
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ clients: [], documents: [] });

    const like = `%${q}%`;
    const userId = uid(req);

    const clientsQuery = userId
      ? `SELECT * FROM clients WHERE (user_id = ? OR user_id IS NULL) AND (name LIKE ? OR email LIKE ? OR siret LIKE ?) ORDER BY name ASC LIMIT 10`
      : `SELECT * FROM clients WHERE user_id IS NULL AND (name LIKE ? OR email LIKE ? OR siret LIKE ?) ORDER BY name ASC LIMIT 10`;

    const docsQuery = userId
      ? `SELECT d.*,c.name as client_name FROM documents d LEFT JOIN clients c ON d.client_id=c.id
         WHERE (d.user_id = ? OR d.user_id IS NULL) AND (d.number LIKE ? OR c.name LIKE ? OR CAST(d.total_ht AS TEXT) LIKE ? OR CAST(d.total_ttc AS TEXT) LIKE ?)
         ORDER BY d.created_at DESC LIMIT 10`
      : `SELECT d.*,c.name as client_name FROM documents d LEFT JOIN clients c ON d.client_id=c.id
         WHERE d.user_id IS NULL AND (d.number LIKE ? OR c.name LIKE ? OR CAST(d.total_ht AS TEXT) LIKE ? OR CAST(d.total_ttc AS TEXT) LIKE ?)
         ORDER BY d.created_at DESC LIMIT 10`;

    const [clients, documents] = await Promise.all([
      userId
        ? db.all(clientsQuery, [userId, like, like, like])
        : db.all(clientsQuery, [like, like, like]),
      userId
        ? db.all(docsQuery, [userId, like, like, like, like])
        : db.all(docsQuery, [like, like, like, like])
    ]);

    res.json({ clients, documents });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Stats / Dashboard ────────────────────────────────────────────────────────

router.get('/stats', async (req, res) => {
  try {
    const db = await getDb();
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const userId = uid(req);

    const uf = userId ? '(user_id = ? OR user_id IS NULL)' : 'user_id IS NULL';
    const p = (extra) => userId ? [userId, ...extra] : [...extra];

    const [yearlyRevenue, monthlyRevenue, invoiceCount, quoteCount, pendingAmount, clientCount, monthlyData, recentDocs] = await Promise.all([
      db.get(`SELECT COALESCE(SUM(total_ht),0) as total FROM documents WHERE ${uf} AND type='invoice' AND status='paid' AND strftime('%Y',date)=?`, p([String(currentYear)])),
      db.get(`SELECT COALESCE(SUM(total_ht),0) as total FROM documents WHERE ${uf} AND type='invoice' AND status='paid' AND strftime('%Y',date)=? AND strftime('%m',date)=?`, p([String(currentYear), String(currentMonth).padStart(2,'0')])),
      db.get(`SELECT COUNT(*) as count FROM documents WHERE ${uf} AND type='invoice' AND status!='cancelled'`, userId ? [userId] : []),
      db.get(`SELECT COUNT(*) as count FROM documents WHERE ${uf} AND type='quote' AND status!='cancelled'`, userId ? [userId] : []),
      db.get(`SELECT COALESCE(SUM(total_ht),0) as total FROM documents WHERE ${uf} AND type='invoice' AND status='sent'`, userId ? [userId] : []),
      db.get(`SELECT COUNT(*) as count FROM clients WHERE ${uf}`, userId ? [userId] : []),
      db.all(`SELECT strftime('%m',date) as month,COALESCE(SUM(total_ht),0) as total FROM documents WHERE ${uf} AND type='invoice' AND status='paid' AND strftime('%Y',date)=? GROUP BY month ORDER BY month ASC`, p([String(currentYear)])),
      db.all(`SELECT d.id,d.type,d.number,d.date,d.status,d.total_ht,d.total_ttc,c.name as client_name FROM documents d LEFT JOIN clients c ON d.client_id=c.id WHERE ${uf} ORDER BY d.created_at DESC LIMIT 5`, userId ? [userId] : [])
    ]);

    res.json({
      yearlyRevenue: yearlyRevenue.total,
      monthlyRevenue: monthlyRevenue.total,
      invoiceCount: invoiceCount.count,
      quoteCount: quoteCount.count,
      pendingAmount: pendingAmount.total,
      clientCount: clientCount.count,
      monthlyData,
      recentDocs
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
