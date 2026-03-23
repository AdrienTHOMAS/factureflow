# Posts prêts à poster — FactureFlow

---

## Reddit r/developpeurs

**Titre :** [Open Source] J'ai créé FactureFlow — un logiciel de facturation gratuit pour auto-entrepreneurs

**Corps :**
Salut à tous,

Comme pas mal de devs ici, je suis auto-entrepreneur et je galérais à trouver un outil de facturation qui soit :
- Vraiment gratuit (pas "gratuit jusqu'à 5 factures")
- Conforme au droit français (art. 293 B CGI, numérotation séquentielle...)
- Self-hosted (mes données restent chez moi)
- Simple et pas bloated

Du coup j'ai développé **FactureFlow** — une app Node.js + SQLite en ~1500 lignes qui fait le job :

✅ Devis & factures conformes
✅ Conversion devis → facture en 1 clic
✅ Dashboard CA avec graphiques
✅ Export PDF & CSV
✅ Recherche globale
✅ Dark mode (parce qu'on est des devs)
✅ Zero dépendance cloud

**Stack :** Express + SQLite + Vanilla JS (pas de React/Vue, ça démarre en 2s)

🔗 **GitHub** : https://github.com/AdrienTHOMAS/factureflow
📖 **MIT License** — fork, modifie, redistribue

Je cherche du feedback et des contributions ! Les issues sont ouvertes si vous avez des idées.

---

## Reddit r/france / r/EntrepreneurFrancais

**Titre :** Logiciel de facturation 100% gratuit pour auto-entrepreneurs — open source

**Corps :**
Salut,

Pour ceux qui cherchent un outil de facturation gratuit et sans prise de tête, j'ai développé FactureFlow.

**C'est quoi ?** Une application web que vous installez sur votre ordi (ou un serveur). Vos données restent chez vous, pas de compte à créer, pas de limite.

**Ça fait quoi ?**
- Factures et devis conformes au droit français
- Numérotation automatique (FACT-2026-001, FACT-2026-002...)
- Mention art. 293 B du CGI (TVA non applicable)
- Gestion clients, suivi CA, export PDF
- Conversion devis → facture en 1 clic

**Pourquoi c'est gratuit ?** Parce que c'est open source (licence MIT). Le code est sur GitHub, tout le monde peut l'utiliser et le modifier.

**Comment l'installer ?** 3 commandes :
```
git clone https://github.com/AdrienTHOMAS/factureflow.git
cd factureflow && npm install && npm start
```

Vous avez besoin de Node.js installé sur votre machine. Si ça vous semble technique, je prépare une version hébergée (cloud) bientôt.

Feedback bienvenu ! 🙏

---

## Forum ae.fr

**Titre :** [Outil gratuit] FactureFlow — facturation open source pour auto-entrepreneurs

**Corps :**
Bonjour à tous,

Je partage un outil que j'ai développé : **FactureFlow**, un logiciel de facturation entièrement gratuit et open source.

**Pour qui ?** Les auto-entrepreneurs / micro-entrepreneurs qui veulent un outil simple, conforme, et sans abonnement.

**Ce qu'il fait :**
- Création de devis et factures conformes (CGI art. 293 B, numérotation séquentielle)
- Gestion des clients
- Suivi du chiffre d'affaires mensuel/annuel
- Export PDF pour impression ou envoi
- Conversion devis → facture automatique
- Interface moderne (dark mode)

**Ce qu'il ne fait PAS (pour l'instant) :**
- Envoi d'emails (prévu)
- Comptabilité complète (c'est un outil de facturation, pas un logiciel comptable)

**Comment l'utiliser ?**
Il faut installer Node.js sur votre ordinateur, puis 3 commandes dans le terminal. C'est expliqué sur la page GitHub.

Lien : https://github.com/AdrienTHOMAS/factureflow

N'hésitez pas à me faire vos retours, c'est un projet jeune et je suis preneur de suggestions !

---

## developpez.net (réponse au thread existant)

**Corps :**
Bonjour,

Je me permets de partager un outil que j'ai développé : **FactureFlow** — un logiciel de facturation 100% gratuit et open source (MIT).

C'est du Node.js + Express + SQLite, pas de framework frontend (Vanilla JS), ça tient en ~1500 lignes et ça démarre en 2 secondes.

Fonctionnalités : devis, factures, clients, dashboard CA, export PDF/CSV, recherche, conversion devis→facture.
Conforme droit français : art. 293 B CGI, numérotation séquentielle, IBAN/BIC.

GitHub : https://github.com/AdrienTHOMAS/factureflow

Les contributions sont bienvenues ! 🙂

---

## Product Hunt (EN)

**Name:** FactureFlow
**Tagline:** Free, open-source invoicing for French freelancers
**Description:**
FactureFlow is a free, self-hosted invoicing tool built specifically for French auto-entrepreneurs (freelancers).

🇫🇷 Fully compliant with French tax law (CGI art. 293B, sequential numbering)
🆓 100% free, no limits, no account needed
🔒 Self-hosted — your data stays on your machine
⚡ Lightweight — Node.js + SQLite, starts in 2 seconds

Features: quotes, invoices, client management, revenue dashboard, PDF export, CSV export, quote-to-invoice conversion, dark mode.

Built with Express + Vanilla JS in ~1500 lines. MIT licensed.

**Topics:** Invoicing, Open Source, Freelance, Small Business, France
**Makers:** AdrienTHOMAS
**Links:** GitHub, Demo

---

## Hacker News (Show HN)

**Title:** Show HN: FactureFlow – Free open-source invoicing for French freelancers

**Text:**
Hi HN,

I built FactureFlow, a lightweight invoicing app for French auto-entrepreneurs (solo freelancers). It's free, open source (MIT), and self-hosted.

Why? France has ~4M auto-entrepreneurs who all need to generate compliant invoices. Most tools are either limited in free tier or SaaS-only. FactureFlow runs locally with SQLite, no cloud dependency.

Tech: Node.js + Express + SQLite + Vanilla JS SPA. ~1500 LOC, starts in <2s.

Features: quotes, invoices, clients, revenue tracking, PDF export, CSV export, quote→invoice conversion, dark mode.

Compliance: sequential numbering (FACT-2026-001), CGI art. 293B mention, bank details on invoices, payment terms.

GitHub: https://github.com/AdrienTHOMAS/factureflow

Would love feedback, especially from French freelancers or anyone interested in lightweight self-hosted tools.
