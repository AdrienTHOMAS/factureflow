const express = require('express');
const path = require('path');
const { getDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 8091;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Warm up DB connection on start
getDb().then(() => {
  const apiRouter = require('./routes/api');
  const pdfRouter = require('./routes/pdf');

  app.use('/api', apiRouter);
  app.use('/pdf', pdfRouter);

  app.get('*', (req, res) => {
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
