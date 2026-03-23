/* ─────────────────────────────────────────────────────────
   FactureFlow — Frontend SPA
   ───────────────────────────────────────────────────────── */

'use strict';

// ── State ──────────────────────────────────────────────────
const state = {
  currentPage: 'dashboard',
  clients: [],
  stats: null,
};

// ── Router ─────────────────────────────────────────────────
function navigateTo(page, params = {}) {
  state.currentPage = page;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  const titles = {
    dashboard: 'Tableau de bord',
    invoices: 'Factures',
    quotes: 'Devis',
    clients: 'Clients',
    revenue: 'Revenus',
    profile: 'Mon entreprise',
  };

  document.getElementById('topbarTitle').textContent = titles[page] || page;
  document.getElementById('topbarActions').innerHTML = '';

  closeSidebar();

  switch (page) {
    case 'dashboard': renderDashboard(); break;
    case 'invoices':  renderDocuments('invoice'); break;
    case 'quotes':    renderDocuments('quote'); break;
    case 'clients':   renderClients(); break;
    case 'revenue':   renderRevenue(); break;
    case 'profile':   renderProfile(); break;
  }
}

// ── API helpers ────────────────────────────────────────────
async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch('/api' + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur serveur');
  return data;
}

const GET    = (path)        => api('GET',    path);
const POST   = (path, body)  => api('POST',   path, body);
const PUT    = (path, body)  => api('PUT',    path, body);
const PATCH  = (path, body)  => api('PATCH',  path, body);
const DELETE = (path)        => api('DELETE', path);

// ── Utilities ──────────────────────────────────────────────
function fmt(amount) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0);
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
}

function fmtDateInput(d) {
  if (!d) return '';
  return d.split('T')[0];
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function statusBadge(status, type) {
  const labels = {
    draft:     ['draft',     type === 'invoice' ? 'Brouillon' : 'Brouillon'],
    sent:      ['sent',      type === 'invoice' ? 'Envoyée' : 'Envoyé'],
    paid:      ['paid',      'Payée'],
    accepted:  ['accepted',  'Accepté'],
    refused:   ['refused',   'Refusé'],
    cancelled: ['cancelled', 'Annulé(e)'],
  };
  const [cls, label] = labels[status] || ['draft', status];
  return `<span class="badge badge-${cls}">${label}</span>`;
}

function typeLabel(type) {
  return type === 'invoice'
    ? '<span class="badge badge-invoice">Facture</span>'
    : '<span class="badge badge-quote">Devis</span>';
}

// ── Toast ──────────────────────────────────────────────────
function toast(msg, type = 'success') {
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icon}</span> ${msg}`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ── Modal helpers ──────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function confirm(title, msg, onConfirm) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMessage').textContent = msg;
  const btn = document.getElementById('confirmBtn');
  btn.onclick = () => { closeModal('confirmModal'); onConfirm(); };
  openModal('confirmModal');
}

// ── Sidebar (mobile) ───────────────────────────────────────
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('open');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
}

// ── Dashboard ──────────────────────────────────────────────
async function renderDashboard() {
  const pc = document.getElementById('pageContent');
  pc.innerHTML = '<div style="color:var(--text-muted);padding:40px;text-align:center">Chargement...</div>';

  const [stats, profile] = await Promise.all([GET('/stats'), GET('/profile')]);
  state.stats = stats;

  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
                  'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

  // Build monthly data array (fill gaps)
  const monthData = new Array(12).fill(0);
  (stats.monthlyData || []).forEach(m => {
    monthData[parseInt(m.month, 10) - 1] = m.total;
  });
  const maxVal = Math.max(...monthData, 1);

  const barsHtml = monthData.map((val, i) => {
    const pct = Math.round((val / maxVal) * 100);
    return `
      <div class="chart-bar-wrap" title="${months[i]}: ${fmt(val)}">
        <div class="chart-bar" style="height:${pct}%"></div>
        <div class="chart-label">${months[i]}</div>
      </div>
    `;
  }).join('');

  const recentRows = (stats.recentDocs || []).map(d => `
    <tr>
      <td>${typeLabel(d.type)}</td>
      <td><strong>${d.number}</strong></td>
      <td>${d.client_name || '—'}</td>
      <td>${fmtDate(d.date)}</td>
      <td>${statusBadge(d.status, d.type)}</td>
      <td class="text-right">${fmt(d.total_ht)}</td>
      <td>
        <button class="btn btn-icon" onclick="openDocumentDetail(${d.id})" title="Voir">👁</button>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="7"><div class="empty-state" style="padding:20px"><div class="empty-icon">📄</div><div class="empty-text">Aucun document</div></div></td></tr>`;

  const profileWarning = !profile.name || !profile.siret
    ? `<div class="card mb-3" style="border-color:var(--gold);background:var(--gold-soft)">
        <div class="flex items-center gap-2">
          <span>⚠️</span>
          <div>
            <strong>Complétez votre profil</strong>
            <div class="text-muted text-sm">Votre profil entreprise est incomplet. Ajoutez votre SIRET et vos informations pour émettre des documents légaux.</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="navigateTo('profile')" style="margin-left:auto;flex-shrink:0">Compléter →</button>
        </div>
      </div>`
    : '';

  pc.innerHTML = `
    ${profileWarning}

    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-icon">💰</span>
        <div class="stat-value">${fmt(stats.yearlyRevenue)}</div>
        <div class="stat-label">CA annuel (${new Date().getFullYear()})</div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">📅</span>
        <div class="stat-value">${fmt(stats.monthlyRevenue)}</div>
        <div class="stat-label">CA mensuel</div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">⏳</span>
        <div class="stat-value">${fmt(stats.pendingAmount)}</div>
        <div class="stat-label">En attente de paiement</div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">📄</span>
        <div class="stat-value">${stats.invoiceCount}</div>
        <div class="stat-label">Factures émises</div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">📋</span>
        <div class="stat-value">${stats.quoteCount}</div>
        <div class="stat-label">Devis créés</div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">👥</span>
        <div class="stat-value">${stats.clientCount}</div>
        <div class="stat-label">Clients</div>
      </div>
    </div>

    <div class="grid-2 mb-3" style="align-items:start">
      <div class="card">
        <div class="card-header">
          <div class="card-title">📈 Revenus mensuels ${new Date().getFullYear()}</div>
        </div>
        <div class="chart-bars">${barsHtml}</div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">⚡ Actions rapides</div>
        </div>
        <div class="flex" style="flex-direction:column;gap:10px">
          <button class="btn btn-primary" style="justify-content:center" onclick="openDocumentModal('invoice')">
            📄 Nouvelle facture
          </button>
          <button class="btn btn-secondary" style="justify-content:center" onclick="openDocumentModal('quote')">
            📋 Nouveau devis
          </button>
          <button class="btn btn-ghost" style="justify-content:center" onclick="openClientModal()">
            👤 Nouveau client
          </button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">📋 Documents récents</div>
        <div class="flex gap-2">
          <button class="btn btn-ghost btn-sm" onclick="navigateTo('invoices')">Voir factures →</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Numéro</th>
              <th>Client</th>
              <th>Date</th>
              <th>Statut</th>
              <th class="text-right">Montant HT</th>
              <th></th>
            </tr>
          </thead>
          <tbody>${recentRows}</tbody>
        </table>
      </div>
    </div>
  `;
}

// ── Documents List ─────────────────────────────────────────
async function renderDocuments(type) {
  const pc = document.getElementById('pageContent');
  const tb = document.getElementById('topbarActions');

  const label = type === 'invoice' ? 'facture' : 'devis';
  const labelPlural = type === 'invoice' ? 'Factures' : 'Devis';
  const icon = type === 'invoice' ? '📄' : '📋';

  tb.innerHTML = `<button class="btn btn-primary" onclick="openDocumentModal('${type}')">+ Nouveau${type === 'invoice' ? '' : ''} ${label}</button>`;

  pc.innerHTML = '<div style="color:var(--text-muted);padding:40px;text-align:center">Chargement...</div>';

  const docs = await GET(`/documents?type=${type}`);

  if (docs.length === 0) {
    pc.innerHTML = `
      <div class="card">
        <div class="empty-state">
          <div class="empty-icon">${icon}</div>
          <div class="empty-text">Aucun${type === 'quote' ? '' : ''} ${label}</div>
          <div class="empty-sub">Créez votre premier${type === 'quote' ? '' : ''} ${label} en cliquant sur le bouton ci-dessus.</div>
          <div class="mt-3">
            <button class="btn btn-primary" onclick="openDocumentModal('${type}')">+ Nouveau ${label}</button>
          </div>
        </div>
      </div>`;
    return;
  }

  const rows = docs.map(d => `
    <tr>
      <td><strong>${d.number}</strong></td>
      <td>${d.client_name || '—'}</td>
      <td>${fmtDate(d.date)}</td>
      <td>${d.due_date ? fmtDate(d.due_date) : '—'}</td>
      <td>${statusBadge(d.status, d.type)}</td>
      <td class="text-right">${fmt(d.total_ht)}</td>
      <td class="text-right">${fmt(d.total_ttc)}</td>
      <td>
        <div class="flex gap-2 justify-end">
          <button class="btn btn-icon" onclick="openDocumentDetail(${d.id})" title="Voir">👁</button>
          <button class="btn btn-icon" onclick="downloadPdf(${d.id}, '${d.number}')" title="PDF">⬇️</button>
          <div class="dropdown" id="drop-${d.id}">
            <button class="btn btn-icon" onclick="toggleDropdown('drop-${d.id}')">⋯</button>
            <div class="dropdown-menu" id="menu-${d.id}">
              <button class="dropdown-item" onclick="editDocument(${d.id});closeDropdowns()">✏️ Modifier</button>
              ${type === 'invoice' && d.status !== 'paid' ? `<button class="dropdown-item" onclick="setDocStatus(${d.id},'paid');closeDropdowns()">✅ Marquer payée</button>` : ''}
              ${d.status === 'draft' ? `<button class="dropdown-item" onclick="setDocStatus(${d.id},'sent');closeDropdowns()">📤 Marquer envoyé(e)</button>` : ''}
              ${type === 'quote' && d.status === 'sent' ? `<button class="dropdown-item" onclick="setDocStatus(${d.id},'accepted');closeDropdowns()">👍 Accepté</button>` : ''}
              <button class="dropdown-item" onclick="previewDoc(${d.id});closeDropdowns()">🖨️ Aperçu</button>
              <button class="dropdown-item danger" onclick="deleteDocument(${d.id});closeDropdowns()">🗑️ Supprimer</button>
            </div>
          </div>
        </div>
      </td>
    </tr>
  `).join('');

  pc.innerHTML = `
    <div class="filter-bar">
      <div class="search-input flex-1">
        <input type="text" placeholder="Rechercher..." oninput="filterTable(this.value)">
      </div>
      <select onchange="filterByStatus(this.value)">
        <option value="">Tous les statuts</option>
        <option value="draft">Brouillon</option>
        <option value="sent">Envoyé(e)</option>
        ${type === 'invoice' ? '<option value="paid">Payée</option>' : '<option value="accepted">Accepté</option><option value="refused">Refusé</option>'}
        <option value="cancelled">Annulé(e)</option>
      </select>
    </div>
    <div class="card" style="padding:0">
      <div class="table-wrap">
        <table id="docsTable">
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Client</th>
              <th>Date</th>
              <th>Échéance</th>
              <th>Statut</th>
              <th class="text-right">Montant HT</th>
              <th class="text-right">Montant TTC</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="docsTableBody">${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function filterTable(q) {
  const rows = document.querySelectorAll('#docsTableBody tr');
  const lower = q.toLowerCase();
  rows.forEach(r => {
    r.style.display = r.textContent.toLowerCase().includes(lower) ? '' : 'none';
  });
}

function filterByStatus(status) {
  const rows = document.querySelectorAll('#docsTableBody tr');
  rows.forEach(r => {
    if (!status) { r.style.display = ''; return; }
    const badge = r.querySelector('.badge');
    const matches = badge && badge.className.includes('badge-' + status);
    r.style.display = matches ? '' : 'none';
  });
}

// ── Document detail (view) ─────────────────────────────────
async function openDocumentDetail(id) {
  const doc = await GET('/documents/' + id);

  const isTvaExempt = doc.tva_rate === 0;
  const itemsHtml = doc.items.map(item => `
    <tr>
      <td>${item.description}</td>
      <td class="text-right">${item.quantity}</td>
      <td>${item.unit}</td>
      <td class="text-right">${fmt(item.unit_price)}</td>
      <td class="text-right"><strong>${fmt(item.total)}</strong></td>
    </tr>
  `).join('');

  const modal = document.createElement('div');
  modal.className = 'modal-overlay open';
  modal.id = 'detailModal';
  modal.innerHTML = `
    <div class="modal modal-lg">
      <div class="modal-header">
        <div class="modal-title">${doc.number} — ${doc.client_name}</div>
        <button class="modal-close" onclick="document.getElementById('detailModal').remove()">✕</button>
      </div>
      <div class="modal-body">
        <div class="doc-meta-grid">
          <div class="doc-meta-item"><div class="label">Type</div><div class="value">${doc.type === 'invoice' ? '📄 Facture' : '📋 Devis'}</div></div>
          <div class="doc-meta-item"><div class="label">Date</div><div class="value">${fmtDate(doc.date)}</div></div>
          <div class="doc-meta-item"><div class="label">Échéance</div><div class="value">${fmtDate(doc.due_date)}</div></div>
          <div class="doc-meta-item"><div class="label">Statut</div><div class="value">${statusBadge(doc.status, doc.type)}</div></div>
        </div>
        <div class="table-wrap mb-3">
          <table>
            <thead><tr>
              <th>Description</th><th class="text-right">Qté</th><th>Unité</th>
              <th class="text-right">Prix unit.</th><th class="text-right">Total HT</th>
            </tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
        </div>
        <div class="totals-summary">
          <div class="totals-box">
            <div class="totals-row"><span>Total HT</span><span>${fmt(doc.total_ht)}</span></div>
            ${!isTvaExempt ? `<div class="totals-row"><span>TVA (${doc.tva_rate}%)</span><span>${fmt(doc.tva_amount)}</span></div>` : ''}
            <div class="totals-row grand-total"><span>${isTvaExempt ? 'Total' : 'Total TTC'}</span><span>${fmt(isTvaExempt ? doc.total_ht : doc.total_ttc)}</span></div>
          </div>
        </div>
        ${isTvaExempt ? '<p class="text-muted text-sm mt-2 text-right">TVA non applicable, article 293 B du CGI</p>' : ''}
        ${doc.notes ? `<div class="notes-section mt-2"><div class="label">Notes</div><p>${doc.notes}</p></div>` : ''}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="editDocument(${doc.id});document.getElementById('detailModal').remove()">✏️ Modifier</button>
        <button class="btn btn-ghost" onclick="previewDoc(${doc.id})">🖨️ Aperçu PDF</button>
        <button class="btn btn-primary" onclick="downloadPdf(${doc.id},'${doc.number}')">⬇️ Télécharger PDF</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

// ── Clients ────────────────────────────────────────────────
async function renderClients() {
  const pc = document.getElementById('pageContent');
  const tb = document.getElementById('topbarActions');
  tb.innerHTML = `<button class="btn btn-primary" onclick="openClientModal()">+ Nouveau client</button>`;
  pc.innerHTML = '<div style="color:var(--text-muted);padding:40px;text-align:center">Chargement...</div>';

  const clients = await GET('/clients');
  state.clients = clients;

  if (clients.length === 0) {
    pc.innerHTML = `
      <div class="card">
        <div class="empty-state">
          <div class="empty-icon">👥</div>
          <div class="empty-text">Aucun client</div>
          <div class="empty-sub">Ajoutez votre premier client pour commencer à facturer.</div>
          <div class="mt-3"><button class="btn btn-primary" onclick="openClientModal()">+ Nouveau client</button></div>
        </div>
      </div>`;
    return;
  }

  const rows = clients.map(c => `
    <tr>
      <td><strong>${c.name}</strong></td>
      <td>${c.email || '—'}</td>
      <td>${[c.postal_code, c.city].filter(Boolean).join(' ') || '—'}</td>
      <td>${c.siret || '—'}</td>
      <td>${c.phone || '—'}</td>
      <td>
        <div class="flex gap-2 justify-end">
          <button class="btn btn-icon" onclick="editClient(${c.id})" title="Modifier">✏️</button>
          <button class="btn btn-icon" onclick="navigateTo('invoices');setTimeout(()=>filterByClient(${c.id}),300)" title="Voir factures">📄</button>
          <button class="btn btn-icon" onclick="deleteClient(${c.id}, '${escJs(c.name)}')" title="Supprimer">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');

  pc.innerHTML = `
    <div class="filter-bar">
      <div class="search-input flex-1">
        <input type="text" placeholder="Rechercher un client..." oninput="filterTable(this.value)">
      </div>
    </div>
    <div class="card" style="padding:0">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nom</th><th>Email</th><th>Ville</th>
              <th>SIRET</th><th>Téléphone</th><th></th>
            </tr>
          </thead>
          <tbody id="docsTableBody">${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function openClientModal(data = null) {
  document.getElementById('clientModalTitle').textContent = data ? 'Modifier le client' : 'Nouveau client';
  document.getElementById('clientId').value      = data ? data.id : '';
  document.getElementById('clientName').value    = data ? data.name : '';
  document.getElementById('clientEmail').value   = data ? data.email : '';
  document.getElementById('clientAddress').value = data ? data.address : '';
  document.getElementById('clientPostal').value  = data ? data.postal_code : '';
  document.getElementById('clientCity').value    = data ? data.city : '';
  document.getElementById('clientCountry').value = data ? data.country : 'France';
  document.getElementById('clientSiret').value   = data ? data.siret : '';
  document.getElementById('clientPhone').value   = data ? data.phone : '';
  document.getElementById('clientNotes').value   = data ? data.notes : '';
  openModal('clientModal');
}

async function editClient(id) {
  const client = await GET('/clients/' + id);
  openClientModal(client);
}

async function saveClient() {
  const id = document.getElementById('clientId').value;
  const body = {
    name:        document.getElementById('clientName').value.trim(),
    email:       document.getElementById('clientEmail').value.trim(),
    address:     document.getElementById('clientAddress').value.trim(),
    postal_code: document.getElementById('clientPostal').value.trim(),
    city:        document.getElementById('clientCity').value.trim(),
    country:     document.getElementById('clientCountry').value.trim(),
    siret:       document.getElementById('clientSiret').value.trim(),
    phone:       document.getElementById('clientPhone').value.trim(),
    notes:       document.getElementById('clientNotes').value.trim(),
  };
  if (!body.name) { toast('Le nom du client est requis', 'error'); return; }

  try {
    if (id) await PUT('/clients/' + id, body);
    else await POST('/clients', body);
    closeModal('clientModal');
    toast(id ? 'Client modifié ✓' : 'Client ajouté ✓');
    renderClients();
    // Refresh clients list for document modal
    state.clients = await GET('/clients');
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function deleteClient(id, name) {
  confirm('Supprimer le client', `Supprimer "${name}" ? Cette action est irréversible.`, async () => {
    try {
      await DELETE('/clients/' + id);
      toast('Client supprimé');
      renderClients();
    } catch (e) {
      toast(e.message, 'error');
    }
  });
}

// ── Document modal ─────────────────────────────────────────
async function openDocumentModal(type, existingDoc = null) {
  // Load clients
  state.clients = await GET('/clients');

  if (state.clients.length === 0) {
    toast('Ajoutez d\'abord un client pour créer une ' + (type === 'invoice' ? 'facture' : 'devis'), 'info');
    openClientModal();
    return;
  }

  const label = type === 'invoice' ? 'Nouvelle facture' : 'Nouveau devis';
  document.getElementById('documentModalTitle').textContent = existingDoc ? 'Modifier le document' : label;
  document.getElementById('docId').value = existingDoc ? existingDoc.id : '';
  document.getElementById('docType').value = type;

  // Due date label
  document.getElementById('dueDateLabel').textContent = type === 'invoice' ? 'Date d\'échéance' : 'Validité jusqu\'au';

  // Status options: filter by type
  const statusSel = document.getElementById('docStatus');
  statusSel.innerHTML = type === 'invoice' ? `
    <option value="draft">Brouillon</option>
    <option value="sent">Envoyée</option>
    <option value="paid">Payée</option>
    <option value="cancelled">Annulée</option>
  ` : `
    <option value="draft">Brouillon</option>
    <option value="sent">Envoyé</option>
    <option value="accepted">Accepté</option>
    <option value="refused">Refusé</option>
    <option value="cancelled">Annulé</option>
  `;

  // Populate clients
  const sel = document.getElementById('docClient');
  sel.innerHTML = '<option value="">— Sélectionner un client —</option>' +
    state.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  // Defaults
  const todayStr = today();
  document.getElementById('docDate').value    = existingDoc ? fmtDateInput(existingDoc.date) : todayStr;
  document.getElementById('docDueDate').value = existingDoc ? fmtDateInput(existingDoc.due_date) : addDays(todayStr, 30);
  document.getElementById('docNotes').value   = existingDoc ? existingDoc.notes : '';

  if (existingDoc) {
    document.getElementById('docClient').value = existingDoc.client_id;
    document.getElementById('docStatus').value  = existingDoc.status;
    const hasTva = existingDoc.tva_rate > 0;
    document.getElementById('tvaToggle').checked = hasTva;
    document.getElementById('tvaRateGroup').classList.toggle('hidden', !hasTva);
    document.getElementById('tvaExemptNote').style.display = hasTva ? 'none' : '';
    document.getElementById('tvaRow').style.display = hasTva ? '' : 'none';
    if (hasTva) document.getElementById('tvaRate').value = existingDoc.tva_rate;
    renderItems(existingDoc.items || []);
  } else {
    document.getElementById('tvaToggle').checked = false;
    document.getElementById('tvaRateGroup').classList.add('hidden');
    document.getElementById('tvaExemptNote').style.display = '';
    document.getElementById('tvaRow').style.display = 'none';
    renderItems([{ description: '', quantity: 1, unit: 'forfait', unit_price: 0, total: 0 }]);
  }

  updateTotals();
  openModal('documentModal');
}

async function editDocument(id) {
  const doc = await GET('/documents/' + id);
  await openDocumentModal(doc.type, doc);
}

// ── Items editor ───────────────────────────────────────────
function renderItems(items) {
  const container = document.getElementById('itemsList');
  container.innerHTML = items.map((item, i) => buildItemRow(item, i)).join('');
}

function buildItemRow(item = {}, idx) {
  return `
    <div class="item-row" data-idx="${idx}">
      <input type="text" placeholder="Description de la prestation" value="${escHtml(item.description || '')}"
        class="item-desc" oninput="updateTotals()">
      <input type="number" value="${item.quantity || 1}" min="0" step="any"
        class="item-qty" onchange="recalcRow(this)" style="text-align:center">
      <select class="item-unit" onchange="updateTotals()">
        ${['forfait','heure','jour','unité','mois'].map(u =>
          `<option value="${u}"${(item.unit||'forfait')===u?' selected':''}>${u}</option>`
        ).join('')}
      </select>
      <input type="number" value="${item.unit_price || 0}" min="0" step="0.01"
        class="item-price" onchange="recalcRow(this)" style="text-align:right">
      <div class="item-total">${fmtSimple((item.quantity||1)*(item.unit_price||0))}</div>
      <button class="btn btn-icon" onclick="removeItem(this)" title="Supprimer" style="color:var(--danger)">✕</button>
    </div>
  `;
}

function fmtSimple(n) {
  return new Intl.NumberFormat('fr-FR', {minimumFractionDigits:2,maximumFractionDigits:2}).format(n||0) + ' €';
}

function recalcRow(el) {
  const row = el.closest('.item-row');
  const qty   = parseFloat(row.querySelector('.item-qty').value) || 0;
  const price = parseFloat(row.querySelector('.item-price').value) || 0;
  row.querySelector('.item-total').textContent = fmtSimple(qty * price);
  updateTotals();
}

function addItem() {
  const container = document.getElementById('itemsList');
  const idx = container.children.length;
  const div = document.createElement('div');
  div.innerHTML = buildItemRow({}, idx);
  container.appendChild(div.firstElementChild);
}

function removeItem(btn) {
  const container = document.getElementById('itemsList');
  if (container.children.length <= 1) { toast('Au moins une ligne est requise', 'info'); return; }
  btn.closest('.item-row').remove();
  updateTotals();
}

function updateTotals() {
  const rows = document.querySelectorAll('#itemsList .item-row');
  let totalHT = 0;
  rows.forEach(row => {
    const qty   = parseFloat(row.querySelector('.item-qty').value) || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    const total = qty * price;
    row.querySelector('.item-total').textContent = fmtSimple(total);
    totalHT += total;
  });

  totalHT = Math.round(totalHT * 100) / 100;

  const hasTva = document.getElementById('tvaToggle').checked;
  const tvaRate = hasTva ? (parseFloat(document.getElementById('tvaRate').value) || 20) : 0;
  const tvaAmount = Math.round(totalHT * tvaRate / 100 * 100) / 100;
  const totalTTC = Math.round((totalHT + tvaAmount) * 100) / 100;

  document.getElementById('totalHT').textContent = fmtSimple(totalHT);
  document.getElementById('totalTVA').textContent = fmtSimple(tvaAmount);
  document.getElementById('totalTTC').textContent = fmtSimple(hasTva ? totalTTC : totalHT);
  document.getElementById('totalTTCLabel').textContent = hasTva ? 'Total TTC' : 'Total';
  document.getElementById('tvaLabel').textContent = `TVA (${tvaRate}%)`;
  document.getElementById('tvaRateGroup').classList.toggle('hidden', !hasTva);
  document.getElementById('tvaExemptNote').style.display = hasTva ? 'none' : '';
  document.getElementById('tvaRow').style.display = hasTva ? '' : 'none';
}

function getItems() {
  const rows = document.querySelectorAll('#itemsList .item-row');
  return Array.from(rows).map(row => ({
    description: row.querySelector('.item-desc').value.trim(),
    quantity:    parseFloat(row.querySelector('.item-qty').value) || 0,
    unit:        row.querySelector('.item-unit').value,
    unit_price:  parseFloat(row.querySelector('.item-price').value) || 0,
  })).filter(i => i.description);
}

async function saveDocument() {
  const id      = document.getElementById('docId').value;
  const type    = document.getElementById('docType').value;
  const client  = document.getElementById('docClient').value;
  const date    = document.getElementById('docDate').value;
  const dueDate = document.getElementById('docDueDate').value;
  const status  = document.getElementById('docStatus').value;
  const notes   = document.getElementById('docNotes').value.trim();
  const hasTva  = document.getElementById('tvaToggle').checked;
  const tvaRate = hasTva ? parseFloat(document.getElementById('tvaRate').value) : 0;
  const items   = getItems();

  if (!client) { toast('Sélectionnez un client', 'error'); return; }
  if (!date)   { toast('La date est requise', 'error'); return; }
  if (items.length === 0) { toast('Ajoutez au moins une prestation', 'error'); return; }

  const body = { type, client_id: client, date, due_date: dueDate || null, status, notes, tva_rate: tvaRate, items };

  try {
    if (id) await PUT('/documents/' + id, body);
    else    await POST('/documents', body);
    closeModal('documentModal');
    toast(id ? 'Document mis à jour ✓' : 'Document créé ✓');
    navigateTo(type === 'invoice' ? 'invoices' : 'quotes');
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function deleteDocument(id) {
  confirm('Supprimer le document', 'Supprimer ce document ? Cette action est irréversible.', async () => {
    try {
      await DELETE('/documents/' + id);
      toast('Document supprimé');
      navigateTo(state.currentPage);
    } catch (e) {
      toast(e.message, 'error');
    }
  });
}

async function setDocStatus(id, status) {
  try {
    await PATCH('/documents/' + id + '/status', { status });
    toast('Statut mis à jour ✓');
    navigateTo(state.currentPage);
  } catch (e) {
    toast(e.message, 'error');
  }
}

function previewDoc(id) {
  window.open('/pdf/preview/' + id, '_blank');
}

async function downloadPdf(id, number) {
  toast('Génération du PDF...', 'info');
  try {
    const res = await fetch('/pdf/download/' + id);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${number}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast('PDF téléchargé ✓');
  } catch (e) {
    toast('Erreur PDF : ' + e.message, 'error');
  }
}

// ── Revenue ────────────────────────────────────────────────
async function renderRevenue() {
  const pc = document.getElementById('pageContent');
  pc.innerHTML = '<div style="color:var(--text-muted);padding:40px;text-align:center">Chargement...</div>';

  const stats = await GET('/stats');
  const year  = new Date().getFullYear();

  const months = ['Janvier','Février','Mars','Avril','Mai','Juin',
                  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

  const monthData = new Array(12).fill(0);
  (stats.monthlyData || []).forEach(m => {
    monthData[parseInt(m.month, 10) - 1] = m.total;
  });

  const monthRows = monthData.map((val, i) => `
    <tr>
      <td><strong>${months[i]}</strong></td>
      <td class="text-right">${fmt(val)}</td>
      <td class="text-right">
        <div style="display:flex;align-items:center;gap:8px;justify-content:flex-end">
          <div style="width:100px;height:6px;background:var(--bg-surface);border-radius:3px;overflow:hidden">
            <div style="width:${Math.round(val/Math.max(...monthData,1)*100)}%;height:100%;background:var(--gold);border-radius:3px"></div>
          </div>
        </div>
      </td>
    </tr>
  `).join('');

  const total = monthData.reduce((a, b) => a + b, 0);

  pc.innerHTML = `
    <div class="stats-grid mb-3">
      <div class="stat-card">
        <span class="stat-icon">💰</span>
        <div class="stat-value">${fmt(stats.yearlyRevenue)}</div>
        <div class="stat-label">CA annuel ${year}</div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">📅</span>
        <div class="stat-value">${fmt(stats.monthlyRevenue)}</div>
        <div class="stat-label">CA mois courant</div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">⏳</span>
        <div class="stat-value">${fmt(stats.pendingAmount)}</div>
        <div class="stat-label">En attente</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">📊 Revenus mensuels ${year}</div>
        <div class="text-muted text-sm">Factures payées uniquement</div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mois</th>
              <th class="text-right">Montant HT</th>
              <th class="text-right">Répartition</th>
            </tr>
          </thead>
          <tbody>${monthRows}</tbody>
          <tfoot>
            <tr style="background:var(--bg-surface)">
              <td><strong>Total ${year}</strong></td>
              <td class="text-right"><strong>${fmt(total)}</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <div class="card mt-3" style="background:var(--gold-soft);border-color:var(--gold)">
      <div class="flex items-center gap-3">
        <span style="font-size:24px">📋</span>
        <div>
          <strong>Plafond micro-entreprise</strong>
          <div class="text-muted text-sm">Seuil de chiffre d'affaires annuel pour les prestations de service : <strong>77 700 €</strong> (2024)</div>
          <div class="text-muted text-sm">Seuil pour les activités de vente : <strong>188 700 €</strong> (2024)</div>
        </div>
      </div>
    </div>
  `;
}

// ── Profile ────────────────────────────────────────────────
async function renderProfile() {
  const pc = document.getElementById('pageContent');
  const profile = await GET('/profile');

  pc.innerHTML = `
    <div class="profile-section">
      <div class="card">
        <div class="card-header">
          <div class="card-title">⚙️ Informations de l'entreprise</div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Nom / Raison sociale *</label>
            <input type="text" id="pName" value="${escHtml(profile.name)}" placeholder="Mon Entreprise">
          </div>
          <div class="form-group">
            <label>Forme juridique</label>
            <select id="pLegalForm">
              ${['Micro-entreprise','Auto-entrepreneur','EURL','SASU','SAS','SARL','SA','EI'].map(f =>
                `<option value="${f}"${profile.legal_form===f?' selected':''}>${f}</option>`
              ).join('')}
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>SIRET *</label>
            <input type="text" id="pSiret" value="${escHtml(profile.siret)}" placeholder="12345678900012">
            <div class="form-hint">14 chiffres — obligatoire sur toutes les factures</div>
          </div>
          <div class="form-group">
            <label>N° TVA intracommunautaire</label>
            <input type="text" id="pTvaNumber" value="${escHtml(profile.tva_number)}" placeholder="FR12345678901">
            <div class="form-hint">Laisser vide si exonéré de TVA</div>
          </div>
        </div>

        <div class="form-group">
          <label>Adresse</label>
          <input type="text" id="pAddress" value="${escHtml(profile.address)}" placeholder="12 rue de la Paix">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Code postal</label>
            <input type="text" id="pPostal" value="${escHtml(profile.postal_code)}" placeholder="75001">
          </div>
          <div class="form-group">
            <label>Ville</label>
            <input type="text" id="pCity" value="${escHtml(profile.city)}" placeholder="Paris">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="pEmail" value="${escHtml(profile.email)}" placeholder="contact@monentreprise.fr">
          </div>
          <div class="form-group">
            <label>Téléphone</label>
            <input type="tel" id="pPhone" value="${escHtml(profile.phone)}" placeholder="+33 6 12 34 56 78">
          </div>
        </div>

        <div class="form-group">
          <label>Site web</label>
          <input type="url" id="pWebsite" value="${escHtml(profile.website)}" placeholder="https://monentreprise.fr">
        </div>

        <hr class="section-divider">

        <div class="form-row">
          <div class="form-group">
            <label>IBAN</label>
            <input type="text" id="pIban" value="${escHtml(profile.iban)}" placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX">
            <div class="form-hint">Affiché sur les factures pour le virement</div>
          </div>
          <div class="form-group">
            <label>BIC / SWIFT</label>
            <input type="text" id="pBic" value="${escHtml(profile.bic)}" placeholder="AGRIFRPP">
          </div>
        </div>

        <hr class="section-divider">

        <div class="form-group">
          <div class="toggle-group">
            <label class="toggle">
              <input type="checkbox" id="pTvaExempt" ${profile.is_tva_exempt ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
            <span class="toggle-label">Exonéré de TVA (micro-entreprise)</span>
          </div>
          <div class="form-hint" style="margin-top:6px">Si coché, la mention "TVA non applicable, article 293 B du CGI" sera automatiquement ajoutée.</div>
        </div>

        <hr class="section-divider">

        <div class="form-group">
          <label>Conditions de paiement</label>
          <textarea id="pPaymentConditions" rows="3">${escHtml(profile.payment_conditions)}</textarea>
        </div>

        <div class="form-group">
          <label>Pénalités de retard</label>
          <textarea id="pLatePenalty" rows="3">${escHtml(profile.late_penalty)}</textarea>
          <div class="form-hint">Mention légale obligatoire sur les factures.</div>
        </div>

        <div class="flex justify-end mt-3">
          <button class="btn btn-primary" onclick="saveProfile()">💾 Enregistrer le profil</button>
        </div>
      </div>
    </div>
  `;
}

async function saveProfile() {
  const body = {
    name:               document.getElementById('pName').value.trim(),
    siret:              document.getElementById('pSiret').value.trim(),
    address:            document.getElementById('pAddress').value.trim(),
    city:               document.getElementById('pCity').value.trim(),
    postal_code:        document.getElementById('pPostal').value.trim(),
    email:              document.getElementById('pEmail').value.trim(),
    phone:              document.getElementById('pPhone').value.trim(),
    website:            document.getElementById('pWebsite').value.trim(),
    iban:               document.getElementById('pIban').value.trim(),
    bic:                document.getElementById('pBic').value.trim(),
    tva_number:         document.getElementById('pTvaNumber').value.trim(),
    is_tva_exempt:      document.getElementById('pTvaExempt').checked,
    payment_conditions: document.getElementById('pPaymentConditions').value.trim(),
    late_penalty:       document.getElementById('pLatePenalty').value.trim(),
    legal_form:         document.getElementById('pLegalForm').value,
  };

  try {
    await PUT('/profile', body);
    toast('Profil enregistré ✓');
  } catch (e) {
    toast(e.message, 'error');
  }
}

// ── Dropdown ───────────────────────────────────────────────
function toggleDropdown(id) {
  closeDropdowns();
  document.getElementById('menu-' + id.replace('drop-', '')).classList.toggle('open');
}

function closeDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('open'));
}

document.addEventListener('click', e => {
  if (!e.target.closest('.dropdown')) closeDropdowns();
});

// ── Escape helpers ─────────────────────────────────────────
function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function escJs(s) {
  if (!s) return '';
  return String(s).replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  navigateTo('dashboard');
});
