# FactureFlow — Directory Submissions

Recherches et contenu prêt à soumettre pour référencer FactureFlow dans les principales listes de logiciels open source.

---

## 1. awesome-selfhosted

### Comment ça marche

awesome-selfhosted a migré vers un système **data-driven** (YAML). Les entrées ne sont plus éditées directement dans le README.md — tout se gère via le dépôt [`awesome-selfhosted-data`](https://github.com/awesome-selfhosted/awesome-selfhosted-data).

**Deux façons de soumettre :**
- **Via GitHub Issue** (plus simple) : ouvrir une issue avec le template YAML
- **Via Pull Request** : créer directement un fichier `software/factureflow.yml` dans le dépôt

**Prérequis importants :**
- ✅ Le projet doit avoir au moins **une release publiée depuis plus de 4 mois**
- ✅ Instructions d'installation fonctionnelles
- ✅ Projet activement maintenu
- ✅ Logiciel libre (licence SPDX reconnue)
- ❌ Ne pas mentionner "open-source", "free", "self-hosted" dans la description (c'est implicite sur la liste)

> ⚠️ **Point critique :** Vérifier si FactureFlow a une release GitHub taguée (v1.0.0 ou similaire) **publiée il y a plus de 4 mois**. Si la première release est récente, attendre avant de soumettre.

### Catégorie recommandée

**`Money, Budgeting & Management`** — C'est la catégorie qui regroupe Invoice Ninja, Akaunting, Crater, etc. C'est le fit évident pour un outil de facturation.

### Fichier YAML à créer (`software/factureflow.yml`)

```yaml
name: FactureFlow
website_url: https://github.com/AdrienTHOMAS/factureflow
source_code_url: https://github.com/AdrienTHOMAS/factureflow
description: Invoice and quote generator for French self-employed workers (auto-entrepreneurs), with legal compliance (TVA art. 293B, sequential numbering, mandatory mentions).
licenses:
  - MIT
platforms:
  - Nodejs
tags:
  - Money, Budgeting & Management
```

> **Note :** Pas de `demo_url` pour l'instant (pas de démo en ligne). Si une démo est déployée plus tard, l'ajouter.

### Issue GitHub à ouvrir

**URL :** https://github.com/awesome-selfhosted/awesome-selfhosted-data/issues/new?template=addition.md  
**Titre de l'issue :** `Add FactureFlow`

Copier-coller le YAML ci-dessus dans le corps de l'issue, et cocher toutes les cases de la checklist.

### Description alternative (version courte, <250 chars)

> Invoice and quote generator for French self-employed workers (auto-entrepreneurs), with French legal compliance (TVA exemption, sequential numbering, mandatory legal mentions).

*(237 caractères — dans la limite)*

---

## 2. OpenAlternative (openalternative.co)

### Comment soumettre

OpenAlternative est un **répertoire curé** (pas une simple liste) qui référence les alternatives open source aux logiciels propriétaires.

**Étapes :**
1. Aller sur **https://openalternative.co/submit**
2. Remplir le formulaire de soumission (URL du repo GitHub, description, catégorie)
3. L'équipe examine et approuve manuellement
4. Une fois approuvé, le projet apparaît automatiquement dans leur liste GitHub [`piotrkulpinski/openalternative`](https://github.com/piotrkulpinski/openalternative)

**Catégorie cible :** `Finance & Accounting` (sous `Business Software`)

**Alternatives propriétaires à mentionner** (pour le positionnement sur le site) :
- Henrri
- Freebe
- Abby
- Factur-X
- QuickBooks (si pertinent)

### Contenu suggéré pour le formulaire

**Project name:** FactureFlow  
**Website/Repo URL:** https://github.com/AdrienTHOMAS/factureflow  
**Short description:** Free, self-hosted invoice and quote generator for French auto-entrepreneurs. No account needed, no limits, no data sent to third parties. French legal compliance built-in (TVA art. 293B, sequential numbering, IBAN on invoices).  
**License:** MIT  
**Alternatives to:** Henrri, Freebe, Abby  

---

## 3. AlternativeTo (alternativeto.net)

### Comment soumettre

AlternativeTo est un **wiki collaboratif** — n'importe qui peut ajouter un logiciel.

**Étapes :**
1. Créer un compte sur https://alternativeto.net (si pas déjà fait)
2. Aller sur **https://alternativeto.net/software/add/**
3. Remplir le formulaire :
   - **Name:** FactureFlow
   - **URL:** https://github.com/AdrienTHOMAS/factureflow
   - **Description** (voir ci-dessous)
   - **License:** Open Source
   - **Platform:** Self-Hosted, Web
   - **Categories:** Business & Commerce > Invoicing

**Important :** Après avoir ajouté le logiciel, ajouter FactureFlow comme **alternative** aux logiciels existants déjà listés sur AlternativeTo :
- Chercher "Henrri" et l'ajouter comme alternative
- Chercher "Freebe" et l'ajouter comme alternative  
- Chercher "Invoice Ninja" et l'ajouter comme alternative (positionnement : simplifié, dédié FR)

### Description pour AlternativeTo

> FactureFlow is a free, open-source invoice and quote generator designed specifically for French auto-entrepreneurs. Self-hosted with no account required, no invoice limits, and no data sent to third parties. Features include dashboard with revenue tracking, quote-to-invoice conversion, client management, PDF generation, CSV export, and full French legal compliance (TVA art. 293B exemption, sequential numbering FACT-YYYY-NNN, mandatory legal mentions).

---

## 4. Autres répertoires à considérer

| Répertoire | URL | Type de soumission |
|---|---|---|
| **ProductHunt** | https://www.producthunt.com/posts/new | Formulaire web — très visible pour le lancement |
| **Hacker News (Show HN)** | https://news.ycombinator.com/submit | Post "Show HN: FactureFlow – ..." |
| **GitHub Topics** | (auto) | Ajouter les topics `invoice`, `self-hosted`, `french`, `auto-entrepreneur` sur le repo |
| **LibreHunt** | https://librehunt.org | Alternative à awesome-selfhosted |
| **PRISM Break** | https://prism-break.org | Si pertinent (vie privée) |

---

## Checklist avant soumission

- [ ] FactureFlow a une **release taguée** sur GitHub (ex: v1.0.0) — *requis pour awesome-selfhosted*
- [ ] La première release a **plus de 4 mois** — *requis pour awesome-selfhosted*
- [ ] Le README est en **anglais** (ou au moins billingue) — *recommandé pour audience internationale*
- [ ] Une **démo en ligne** serait un fort plus pour OpenAlternative et AlternativeTo
- [ ] Les **GitHub Topics** du repo sont bien renseignés
- [ ] Le fichier `LICENSE` est présent à la racine du repo ✅

---

*Recherches effectuées le 2026-03-23 par bertholt*
