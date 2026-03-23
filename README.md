# FactureFlow 📄

**Application de facturation et devis pour auto-entrepreneurs français.**

Interface web moderne, dark mode, conforme au droit français (CGI, mentions légales, TVA).

## Fonctionnalités

- 📊 **Tableau de bord** — vue d'ensemble CA annuel/mensuel, documents récents, stats
- 📄 **Factures** — création, édition, suivi statut (brouillon → envoyé → payé)
- 📋 **Devis** — création, édition, suivi (brouillon → envoyé → accepté/refusé)
- 👥 **Gestion clients** — carnet d'adresses avec SIRET, coordonnées, notes
- 💰 **Suivi revenus** — graphique mensuel, comparaison, plafond micro-entreprise
- ⚙️ **Profil entreprise** — SIRET, IBAN, TVA, conditions de paiement, pénalités
- 🖨️ **Aperçu PDF** — documents imprimables conformes (mentions légales, article 293 B CGI)
- 📥 **Export PDF** — téléchargement direct des factures/devis

## Conformité française

- Mention TVA non applicable (art. 293 B du CGI) pour micro-entreprises
- Numérotation séquentielle des factures (FACT-YYYY-NNN)
- Numérotation séquentielle des devis (DEVIS-YYYY-NNN)
- Coordonnées bancaires (IBAN/BIC) sur les factures
- Conditions de paiement et pénalités de retard obligatoires
- Toggle TVA avec taux français (20%, 10%, 5.5%, 2.1%)

## Stack technique

- **Backend** : Node.js + Express
- **Base de données** : SQLite (via `sqlite` + `sqlite3`)
- **Frontend** : Vanilla JS SPA, CSS custom (dark mode)
- **PDF** : Rendu HTML côté serveur + impression navigateur

## Installation

```bash
git clone https://github.com/AdrienTHOMAS/factureflow.git
cd factureflow
npm install
npm start
```

L'application démarre sur `http://localhost:8091`.

## Configuration

| Variable | Défaut | Description |
|----------|--------|-------------|
| `PORT` | 8091 | Port du serveur |

## Structure

```
factureflow/
├── server.js           # Point d'entrée Express
├── db.js               # SQLite init + migrations
├── routes/
│   ├── api.js          # API REST (clients, documents, stats, profil)
│   └── pdf.js          # Génération PDF/aperçu
├── public/
│   ├── index.html      # SPA shell
│   ├── css/style.css   # Dark mode UI
│   └── js/app.js       # Frontend SPA logic
└── data/               # SQLite DB (auto-créé)
```

## API

| Méthode | Route | Description |
|---------|-------|-------------|
| GET/PUT | `/api/profile` | Profil entreprise |
| CRUD | `/api/clients` | Gestion clients |
| CRUD | `/api/documents` | Factures et devis |
| PATCH | `/api/documents/:id/status` | Changement de statut |
| GET | `/api/stats` | Statistiques dashboard |
| GET | `/pdf/preview/:id` | Aperçu HTML du document |

## Licence

MIT

---

*Créé par bertholt 💼 pour [AdrienTHOMAS](https://github.com/AdrienTHOMAS)*
