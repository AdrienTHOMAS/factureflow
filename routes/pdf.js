const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0);
}

function getStatusLabel(status, type) {
  const labels = {
    invoice: { draft: 'Brouillon', sent: 'Envoyée', paid: 'Payée', cancelled: 'Annulée' },
    quote: { draft: 'Brouillon', sent: 'Envoyé', accepted: 'Accepté', refused: 'Refusé', cancelled: 'Annulé' }
  };
  return (labels[type] || labels.invoice)[status] || status;
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function buildHtml(doc, profile, items) {
  const isInvoice = doc.type === 'invoice';
  const docTitle = isInvoice ? 'FACTURE' : 'DEVIS';
  const isTvaExempt = profile.is_tva_exempt || doc.tva_rate === 0;
  const bizAddr = [profile.address, profile.postal_code, profile.city].filter(Boolean).join(', ');

  const itemsHtml = items.map(item => `
    <tr>
      <td class="desc">${esc(item.description)}</td>
      <td class="center">${item.quantity}</td>
      <td class="center">${esc(item.unit)}</td>
      <td class="right">${formatCurrency(item.unit_price)}</td>
      <td class="right">${formatCurrency(item.total)}</td>
    </tr>`).join('');

  const totalsHtml = isTvaExempt ? `
    <tr class="total-row"><td class="label"><strong>Total</strong></td><td class="right"><strong>${formatCurrency(doc.total_ht)}</strong></td></tr>
  ` : `
    <tr><td class="label">Total HT</td><td class="right">${formatCurrency(doc.total_ht)}</td></tr>
    <tr><td class="label">TVA (${doc.tva_rate}%)</td><td class="right">${formatCurrency(doc.tva_amount)}</td></tr>
    <tr class="total-row"><td class="label"><strong>Total TTC</strong></td><td class="right"><strong>${formatCurrency(doc.total_ttc)}</strong></td></tr>
  `;

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>${docTitle} ${esc(doc.number)}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',Arial,sans-serif;font-size:11px;color:#1a1a2e;background:white;padding:40px;line-height:1.5}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;padding-bottom:24px;border-bottom:3px solid #1a1a2e}
.brand-name{font-size:24px;font-weight:700}
.brand-sub{font-size:10px;color:#666;margin-top:2px}
.doc-type{font-size:28px;font-weight:700;letter-spacing:2px;text-align:right}
.doc-number{font-size:14px;font-weight:600;color:#e2b714;text-align:right;margin-top:4px}
.doc-status{display:inline-block;padding:3px 10px;border-radius:12px;font-size:10px;font-weight:600;background:#f0f0f0;color:#666;margin-top:6px}
.addresses{display:flex;justify-content:space-between;margin-bottom:30px}
.address-block{flex:0 0 48%}
.address-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:8px}
.address-name{font-size:13px;font-weight:600;margin-bottom:4px}
.address-detail{color:#555;font-size:10px;line-height:1.6}
.meta-grid{display:flex;gap:20px;margin-bottom:30px;padding:16px;background:#f8f8fa;border-radius:8px;border-left:4px solid #e2b714}
.meta-item{font-size:10px;color:#555}
.meta-label{font-weight:600;color:#1a1a2e}
table{width:100%;border-collapse:collapse;margin-bottom:20px}
thead th{background:#1a1a2e;color:white;padding:10px 12px;text-align:left;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
thead th.center{text-align:center}thead th.right{text-align:right}
tbody td{padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:10px;color:#333}
tbody tr:nth-child(even) td{background:#fafafa}
td.desc{max-width:200px}td.center{text-align:center}td.right{text-align:right}
.totals-section{display:flex;justify-content:flex-end;margin-bottom:20px}
.totals-table{width:280px}
.totals-table td{padding:6px 12px;font-size:11px;border:none;border-bottom:1px solid #eee}
.totals-table td.label{color:#555}.totals-table td.right{text-align:right;font-weight:500}
.totals-table tr.total-row td{background:#1a1a2e;color:white;font-size:13px;padding:10px 12px;border:none}
.totals-table tr.total-row td.right{font-weight:700}
.tva-mention{font-size:9px;color:#888;font-style:italic;margin-bottom:20px;text-align:right}
.notes-section{margin-top:16px;padding:12px;background:#f8f8fa;border-radius:6px}
.notes-section h4{font-size:10px;font-weight:700;margin-bottom:4px}
.notes-section p{font-size:10px;color:#555}
.iban-section{margin-top:16px;padding:12px;background:#fff8e6;border:1px solid #e2b714;border-radius:6px}
.iban-section h4{font-size:10px;font-weight:700;margin-bottom:4px}
.iban-section p{font-size:10px;color:#555}
.conditions{margin-top:20px;padding-top:20px;border-top:1px solid #eee}
.conditions h4{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
.conditions p{font-size:9px;color:#777;line-height:1.6}
.footer{margin-top:40px;padding-top:16px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:center}
.footer-info{font-size:8px;color:#bbb}
.footer-brand{font-size:9px;color:#ddd;font-weight:500}
.print-btn{position:fixed;top:20px;right:20px;background:#1a1a2e;color:white;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;z-index:999}
@media print{.print-btn{display:none}}
</style></head><body>
<button class="print-btn" onclick="window.print()">📥 Télécharger PDF</button>

<div class="header">
  <div>
    <div class="brand-name">${esc(profile.name || 'Mon Entreprise')}</div>
    <div class="brand-sub">${esc(profile.legal_form || 'Micro-entreprise')}</div>
    ${profile.siret ? `<div class="brand-sub">SIRET : ${esc(profile.siret)}</div>` : ''}
    ${bizAddr ? `<div class="brand-sub">${esc(bizAddr)}</div>` : ''}
    ${profile.email ? `<div class="brand-sub">${esc(profile.email)}</div>` : ''}
    ${profile.phone ? `<div class="brand-sub">${esc(profile.phone)}</div>` : ''}
  </div>
  <div>
    <div class="doc-type">${docTitle}</div>
    <div class="doc-number">${esc(doc.number)}</div>
    <div style="text-align:right"><span class="doc-status">${getStatusLabel(doc.status, doc.type)}</span></div>
  </div>
</div>

<div class="addresses">
  <div class="address-block">
    <div class="address-label">Émetteur</div>
    <div class="address-name">${esc(profile.name || '')}</div>
    <div class="address-detail">
      ${esc(profile.address || '')}<br>
      ${esc([profile.postal_code, profile.city].filter(Boolean).join(' '))}
      ${profile.tva_number ? `<br>N° TVA : ${esc(profile.tva_number)}` : ''}
    </div>
  </div>
  <div class="address-block">
    <div class="address-label">Client</div>
    <div class="address-name">${esc(doc.client_name || '')}</div>
    <div class="address-detail">
      ${doc.client_address ? esc(doc.client_address) + '<br>' : ''}
      ${[doc.client_postal_code, doc.client_city].filter(Boolean).map(esc).join(' ')}
      ${doc.client_siret ? `<br>SIRET : ${esc(doc.client_siret)}` : ''}
      ${doc.client_email ? `<br>${esc(doc.client_email)}` : ''}
    </div>
  </div>
</div>

<div class="meta-grid">
  <div class="meta-item"><span class="meta-label">Date d'émission :</span> ${formatDate(doc.date)}</div>
  ${isInvoice && doc.due_date ? `<div class="meta-item"><span class="meta-label">Échéance :</span> ${formatDate(doc.due_date)}</div>` : ''}
  ${!isInvoice ? `<div class="meta-item"><span class="meta-label">Valable jusqu'au :</span> ${doc.due_date ? formatDate(doc.due_date) : '30 jours'}</div>` : ''}
</div>

<table>
  <thead><tr>
    <th>Description</th><th class="center">Qté</th>
    <th class="center">Unité</th><th class="right">Prix unitaire HT</th><th class="right">Total HT</th>
  </tr></thead>
  <tbody>${itemsHtml}</tbody>
</table>

<div class="totals-section">
  <table class="totals-table"><tbody>${totalsHtml}</tbody></table>
</div>

${isTvaExempt ? '<p class="tva-mention">TVA non applicable, article 293 B du CGI</p>' : ''}

${doc.notes ? `<div class="notes-section"><h4>Notes</h4><p>${esc(doc.notes)}</p></div>` : ''}

${isInvoice && profile.iban ? `<div class="iban-section"><h4>Coordonnées bancaires</h4><p>IBAN : ${esc(profile.iban)}${profile.bic ? ` &nbsp;|&nbsp; BIC : ${esc(profile.bic)}` : ''}</p></div>` : ''}

<div class="conditions">
  ${isInvoice ? `
    <h4>Conditions de paiement</h4>
    <p>${esc(profile.payment_conditions || '')}</p><br>
    <h4>Pénalités de retard</h4>
    <p>${esc(profile.late_penalty || '')}</p>
  ` : `
    <h4>Conditions du devis</h4>
    <p>Ce devis est valable 30 jours à compter de sa date d'émission. Pour accepter ce devis, veuillez le retourner signé avec la mention "Bon pour accord".</p>
  `}
</div>

<div class="footer">
  <div class="footer-info">${esc(profile.name || '')} — ${esc(profile.legal_form || 'Micro-entreprise')}${profile.siret ? ` — SIRET : ${esc(profile.siret)}` : ''}</div>
  <div class="footer-brand">FactureFlow</div>
</div>
</body></html>`;
}

// Download — serves the same HTML with Content-Disposition header
// The user clicks "📥 Télécharger PDF" which triggers window.print() in browser
router.get('/download/:id', async (req, res) => {
  try {
    const db = await getDb();
    const doc = await db.get(`
      SELECT d.*,c.name as client_name,c.email as client_email,
             c.address as client_address,c.city as client_city,
             c.postal_code as client_postal_code,c.country as client_country,
             c.siret as client_siret,c.phone as client_phone
      FROM documents d LEFT JOIN clients c ON d.client_id=c.id
      WHERE d.id=?`, [req.params.id]);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    const items = await db.all('SELECT * FROM document_items WHERE document_id=? ORDER BY sort_order ASC', [req.params.id]);
    const profile = await db.get('SELECT * FROM business_profile WHERE id=1');
    const html = buildHtml(doc, profile || {}, items);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="${doc.number}.html"`);
    res.send(html);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/preview/:id', async (req, res) => {
  try {
    const db = await getDb();
    const doc = await db.get(`
      SELECT d.*,c.name as client_name,c.email as client_email,
             c.address as client_address,c.city as client_city,
             c.postal_code as client_postal_code,c.country as client_country,
             c.siret as client_siret,c.phone as client_phone
      FROM documents d LEFT JOIN clients c ON d.client_id=c.id
      WHERE d.id=?`, [req.params.id]);
    if (!doc) return res.status(404).send('Document not found');
    const items = await db.all('SELECT * FROM document_items WHERE document_id=? ORDER BY sort_order ASC', [req.params.id]);
    const profile = await db.get('SELECT * FROM business_profile WHERE id=1');
    const html = buildHtml(doc, profile || {}, items);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (e) { res.status(500).send(e.message); }
});

module.exports = router;
