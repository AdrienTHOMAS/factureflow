# Contribuer à FactureFlow

Merci de votre intérêt pour FactureFlow ! 🎉

## Comment contribuer

### Signaler un bug
1. Vérifiez que le bug n'a pas déjà été signalé dans les [Issues](https://github.com/AdrienTHOMAS/factureflow/issues)
2. Créez une nouvelle issue avec :
   - Description claire du problème
   - Étapes pour reproduire
   - Comportement attendu vs obtenu
   - Captures d'écran si possible

### Proposer une fonctionnalité
1. Ouvrez une issue avec le tag `enhancement`
2. Décrivez le besoin et le cas d'usage
3. Attendez la validation avant de coder

### Soumettre du code
1. Fork le repo
2. Créez une branche (`git checkout -b feature/ma-feature`)
3. Commitez vos changements (`git commit -m 'feat: description'`)
4. Push (`git push origin feature/ma-feature`)
5. Ouvrez une Pull Request

### Conventions de code
- JavaScript ES6+ (pas de TypeScript pour l'instant)
- Vanilla JS côté front (pas de framework)
- Nommage en français pour les libellés UI, en anglais pour le code
- Commits en anglais avec préfixes : `feat:`, `fix:`, `docs:`, `refactor:`

## Setup développement

```bash
git clone https://github.com/AdrienTHOMAS/factureflow.git
cd factureflow
npm install
npm start
# → http://localhost:8091
```

## Idées de contributions

- 🌍 Traduction anglaise de l'UI
- 📧 Envoi de factures par email (Nodemailer)
- 📊 Export FEC (Fichier des Écritures Comptables)
- 🔄 Import/export de données (JSON, CSV)
- 🧪 Tests automatisés (Jest/Vitest)
- 🐳 Dockerfile
- 📱 PWA (Progressive Web App)

## Licence

En contribuant, vous acceptez que vos contributions soient sous licence MIT.
