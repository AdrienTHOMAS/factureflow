# FactureFlow 📄

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![CI](https://github.com/AdrienTHOMAS/factureflow/actions/workflows/ci.yml/badge.svg)](https://github.com/AdrienTHOMAS/factureflow/actions/workflows/ci.yml)

**Application de facturation gratuite et open source pour auto-entrepreneurs français.**

> 🇫🇷 Conforme au droit français • 🆓 100% gratuit, sans limite • 🔒 Self-hosted, vos données restent chez vous

---

## ✨ Pourquoi FactureFlow ?

Les outils de facturation existants (Henrri, Freebe, Abby) imposent des limites ou deviennent payants. FactureFlow est **gratuit, sans restriction, et le restera toujours** grâce à sa licence open source.

- **Pas de compte à créer** — installez et utilisez
- **Pas de limite** de factures, devis ou clients
- **Pas de données envoyées** à un tiers — tout reste sur votre machine
- **Dark mode** par défaut — moderne et lisible

## 🚀 Démarrage rapide

```bash
git clone https://github.com/AdrienTHOMAS/factureflow.git
cd factureflow
npm install
npm start
# → http://localhost:8091
```

C'est tout. La base de données SQLite se crée automatiquement au premier lancement.

## 📸 Fonctionnalités

| Fonctionnalité | Description |
|---|---|
| 📊 **Dashboard** | CA annuel/mensuel, documents récents, graphiques |
| 📄 **Factures** | Création, édition, suivi statut (brouillon → envoyé → payé) |
| 📋 **Devis** | Création, conversion en facture en 1 clic |
| 👥 **Clients** | Carnet d'adresses avec SIRET, coordonnées, notes |
| 💰 **Revenus** | Graphique mensuel, suivi plafond micro-entreprise |
| 🖨️ **PDF** | Documents imprimables conformes aux obligations légales |
| 🔍 **Recherche** | Recherche globale clients et documents |
| 📥 **Export CSV** | Export des factures et devis pour comptabilité |
| 📑 **Duplication** | Dupliquer un devis ou une facture en 1 clic |

## 🇫🇷 Conformité française

FactureFlow respecte les obligations légales des auto-entrepreneurs :

- ✅ Mention TVA non applicable (art. 293 B du CGI)
- ✅ Numérotation séquentielle (FACT-YYYY-NNN / DEVIS-YYYY-NNN)
- ✅ Coordonnées bancaires (IBAN/BIC) sur les factures
- ✅ Conditions de paiement et pénalités de retard
- ✅ Toggle TVA avec taux français (20%, 10%, 5.5%, 2.1%)
- ✅ Mentions légales obligatoires sur les documents

## 🏗️ Stack technique

| Composant | Technologie |
|---|---|
| Backend | Node.js + Express |
| Base de données | SQLite (fichier local, zéro config) |
| Frontend | Vanilla JS SPA, CSS custom |
| PDF | Rendu HTML + impression navigateur |

**Pas de framework lourd.** L'app tient dans ~1500 lignes de code et démarre en moins de 2 secondes.

## 📁 Structure

```
factureflow/
├── server.js           # Point d'entrée Express
├── db.js               # SQLite init + migrations
├── routes/
│   ├── api.js          # API REST complète
│   └── pdf.js          # Génération aperçu/PDF
├── public/
│   ├── index.html      # SPA shell
│   ├── landing.html    # Page marketing
│   ├── css/style.css   # Dark mode UI
│   └── js/app.js       # Frontend logic
└── data/               # SQLite DB (auto-créé)
```

## 🔌 API

| Méthode | Route | Description |
|---------|-------|-------------|
| GET/PUT | `/api/profile` | Profil entreprise |
| CRUD | `/api/clients` | Gestion clients |
| CRUD | `/api/documents` | Factures et devis |
| PATCH | `/api/documents/:id/status` | Changement de statut |
| POST | `/api/documents/:id/convert` | Convertir devis → facture |
| POST | `/api/documents/:id/duplicate` | Dupliquer un document |
| GET | `/api/stats` | Statistiques dashboard |
| GET | `/pdf/preview/:id` | Aperçu HTML du document |

## 🐳 Docker (bientôt)

```bash
docker run -p 8091:8091 -v factureflow-data:/app/data factureflow
```

## 🤝 Contribuer

Les contributions sont les bienvenues ! Consultez [CONTRIBUTING.md](CONTRIBUTING.md) pour les guidelines.

**Idées de contributions :**
- 🌍 Traduction anglaise
- 📧 Envoi de factures par email
- 📊 Export FEC
- 🐳 Dockerfile
- 📱 PWA
- 🧪 Tests automatisés

## 📄 Licence

[MIT](LICENSE) — Utilisez, modifiez, distribuez librement.

---

**⭐ Si FactureFlow vous est utile, mettez une étoile sur GitHub !**

*Créé avec ❤️ par [AdrienTHOMAS](https://github.com/AdrienTHOMAS)*
