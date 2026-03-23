const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let _db = null;

async function getDb() {
  if (_db) return _db;

  _db = await open({
    filename: path.join(DATA_DIR, 'factureflow.db'),
    driver: sqlite3.Database
  });

  await _db.exec('PRAGMA journal_mode = WAL');
  await _db.exec('PRAGMA foreign_keys = ON');

  await _db.exec(`CREATE TABLE IF NOT EXISTS business_profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL DEFAULT '',
    siret TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    postal_code TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    website TEXT NOT NULL DEFAULT '',
    iban TEXT NOT NULL DEFAULT '',
    bic TEXT NOT NULL DEFAULT '',
    tva_number TEXT NOT NULL DEFAULT '',
    is_tva_exempt INTEGER NOT NULL DEFAULT 1,
    payment_conditions TEXT NOT NULL DEFAULT 'Paiement a 30 jours',
    late_penalty TEXT NOT NULL DEFAULT 'Penalites de retard applicables',
    legal_form TEXT NOT NULL DEFAULT 'Micro-entreprise',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  await _db.exec(`INSERT OR IGNORE INTO business_profile (id) VALUES (1)`);

  await _db.exec(`CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    postal_code TEXT NOT NULL DEFAULT '',
    country TEXT NOT NULL DEFAULT 'France',
    siret TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  await _db.exec(`CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK (type IN ('invoice', 'quote')),
    number TEXT NOT NULL UNIQUE,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    date TEXT NOT NULL,
    due_date TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled', 'accepted', 'refused')),
    notes TEXT NOT NULL DEFAULT '',
    total_ht REAL NOT NULL DEFAULT 0,
    total_ttc REAL NOT NULL DEFAULT 0,
    tva_rate REAL NOT NULL DEFAULT 0,
    tva_amount REAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'EUR',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  await _db.exec(`CREATE TABLE IF NOT EXISTS document_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT 'forfait',
    unit_price REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
  )`);

  await _db.exec(`CREATE TABLE IF NOT EXISTS document_counters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    year INTEGER NOT NULL,
    last_number INTEGER NOT NULL DEFAULT 0,
    UNIQUE(type, year)
  )`);

  return _db;
}

module.exports = { getDb };
