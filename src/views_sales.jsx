/* ============================================================
   LEDGER — Sales views: Customers, Invoices (+Stripe), Payments, Links
   ============================================================ */
const { Icon: SIcon, BizChip: SBizChip, Avatar: SAvatar, Button: SButton, Badge: SBadge,
        Card: SCard, Seg: SSeg, Modal: SModal, Drawer: SDrawer, Empty: SEmpty,
        toast: sToast, copyText: sCopy, Stat: SStat, h: sh } = window;
const SF = window.DB.fmt;
const sMoney = (n, dp) => SF.fmtAUD(n, { dp });

/* ----- shared page header ----- */
function PageHead({ title, sub, actions, bizId }) {
  return sh('div', { className: 'row between', style: { marginBottom: 16, flexWrap: 'wrap', gap: 10 } },
    sh('div', null,
      sh('div', { className: 'row', style: { gap: 9 } },
        bizId && bizId !== 'all' && sh(SBizChip, { biz: bizId, size: 'sm' }),
        sh('span', { style: { fontSize: 18, fontWeight: 700, color: 'var(--ink)' } }, title)),
      sub && sh('div', { className: 'muted', style: { fontSize: 12.5, marginTop: 2 } }, sub)),
    actions && sh('div', { className: 'row', style: { gap: 8 } }, actions));
}

/* ============================================================
   CUSTOMERS
   ============================================================ */
function CustomersView({ bizId, store }) {
  const DB = window.DB;
  const [q, setQ] = window.useState('');
  const [open, setOpen] = window.useState(null);
  let custs = DB.byBiz(DB.customers, bizId);
  if (q) custs = custs.filter(c => (c.name + c.contact + c.city).toLowerCase().includes(q.toLowerCase()));

  const stats = (cid) => {
    const inv = store.invoices.filter(i => i.cust === cid);
    const billed = inv.reduce((s, i) => s + i.total, 0);
    const owed = inv.filter(i => ['sent', 'overdue', 'partial'].includes(i.status)).reduce((s, i) => s + (i.total - i.amountPaid), 0);
    return { count: inv.length, billed, owed };
  };

  return sh('div', { className: 'content-inner fade-up' },
    sh(PageHead, { bizId, title: 'Customers & contacts', sub: custs.length + ' ' + (bizId === 'all' ? 'across all businesses' : 'for this business'),
      actions: [
        sh('div', { className: 'field', key: 'f' }, sh(SIcon, { name: 'search' }), sh('input', { placeholder: 'Search…', value: q, onChange: e => setQ(e.target.value) })),
        sh(SButton, { key: 'n', variant: 'primary', icon: 'plus' }, 'New customer')] }),
    sh(SCard, { bodyClass: 'tight' },
      sh('div', { className: 'tbl-wrap' }, sh('table', { className: 'tbl' },
        sh('thead', null, sh('tr', null,
          sh('th', null, 'Customer'),
          bizId === 'all' && sh('th', null, 'Business'),
          sh('th', null, 'Primary contact'),
          sh('th', null, 'Type'),
          sh('th', { className: 'r' }, 'Invoices'),
          sh('th', { className: 'r' }, 'Billed'),
          sh('th', { className: 'r' }, 'Owing'),
          sh('th', { style: { width: 30 } }, ''))),
        sh('tbody', null, custs.map(c => { const st = stats(c.id);
          return sh('tr', { key: c.id, className: 'clickable', onClick: () => setOpen(c) },
            sh('td', null, sh('div', { className: 'cellrow' }, sh(SAvatar, { name: c.name, size: 28 }),
              sh('div', null, sh('div', { className: 'strong' }, c.name), sh('div', { className: 'muted', style: { fontSize: 11 } }, c.city)))),
            bizId === 'all' && sh('td', null, sh('div', { className: 'cellrow' }, sh(SBizChip, { biz: c.biz, size: 'sm' }), sh('span', { className: 'muted', style: { fontSize: 11.5 } }, DB.biz(c.biz).abbr))),
            sh('td', null, sh('div', null, sh('div', { style: { color: 'var(--ink-2)' } }, c.contact), sh('div', { className: 'muted', style: { fontSize: 11 } }, c.email))),
            sh('td', null, sh('span', { className: 'tag' }, c.type)),
            sh('td', { className: 'amt' }, st.count),
            sh('td', { className: 'amt' }, sMoney(st.billed, 0)),
            sh('td', { className: 'amt', style: { color: st.owed > 0 ? 'var(--neg)' : 'var(--muted)', fontWeight: st.owed > 0 ? 600 : 400 } }, st.owed > 0 ? sMoney(st.owed, 0) : '—'),
            sh('td', null, sh(SIcon, { name: 'chevRight', size: 15, style: { color: 'var(--faint)' } })));
        }))))),
    open && sh(CustomerDrawer, { c: open, store, onClose: () => setOpen(null) }));
}

function CustomerDrawer({ c, store, onClose }) {
  const DB = window.DB;
  const inv = store.invoices.filter(i => i.cust === c.id).sort((a, b) => new Date(b.issued) - new Date(a.issued));
  const billed = inv.reduce((s, i) => s + i.total, 0);
  const paid = inv.reduce((s, i) => s + i.amountPaid, 0);
  return sh(SDrawer, { onClose, width: 560 },
    sh('div', { className: 'modal-h' },
      sh(SAvatar, { name: c.name, size: 42 }),
      sh('div', { style: { flex: 1 } },
        sh('h3', null, c.name),
        sh('div', { className: 'muted', style: { fontSize: 12 } }, c.type + ' · ' + c.city + ' · since ' + c.since)),
      sh('button', { className: 'icon-btn', onClick: onClose, style: { width: 30, height: 30 } }, sh(SIcon, { name: 'x', size: 16 }))),
    sh('div', { className: 'modal-b' },
      sh('div', { className: 'grid g-3', style: { gap: 10, marginBottom: 16 } },
        miniStat('Billed', sMoney(billed, 0)), miniStat('Paid', sMoney(paid, 0)), miniStat('Owing', sMoney(billed - paid, 0), billed - paid > 0 ? 'var(--neg)' : null)),
      sh('div', { className: 'card flat', style: { padding: 13, marginBottom: 16, background: 'var(--surface-2)' } },
        contactRow('mail', c.email), contactRow('phone', c.phone), contactRow('briefcase', DB.biz(c.biz).name)),
      sh('div', { className: 'section-title' }, 'Invoice history', sh('span', { className: 'line' })),
      sh('div', { className: 'tbl-wrap card', bodyClass: 'tight' }, sh('table', { className: 'tbl dense' },
        sh('thead', null, sh('tr', null, sh('th', null, 'Invoice'), sh('th', { className: 'r' }, 'Total'), sh('th', null, 'Status'), sh('th', null, 'Issued'))),
        sh('tbody', null, inv.map(i => sh('tr', { key: i.id },
          sh('td', { className: 'id' }, i.id), sh('td', { className: 'amt' }, sMoney(i.total, 2)),
          sh('td', null, sh(SBadge, { status: i.status })), sh('td', { className: 'muted' }, SF.fmtDateShort(i.issued)))))))));
}
function miniStat(label, val, color) {
  return sh('div', { className: 'card flat', style: { padding: '10px 12px', background: 'var(--surface-2)' } },
    sh('div', { className: 'muted', style: { fontSize: 10.5 } }, label),
    sh('div', { className: 'mono', style: { fontSize: 16, fontWeight: 600, color: color || 'var(--ink)', marginTop: 3 } }, val));
}
function contactRow(icon, val) {
  return sh('div', { className: 'row', style: { gap: 9, padding: '4px 0', fontSize: 12.5, color: 'var(--ink-2)' } },
    sh(SIcon, { name: icon, size: 14, style: { color: 'var(--faint)' } }), val);
}

/* ============================================================
   INVOICES  (+ Stripe payment-link workflow)
   ============================================================ */
function InvoicesView({ bizId, store, openInv, setOpenInv }) {
  const DB = window.DB;
  const [filter, setFilter] = window.useState('all');
  const [q, setQ] = window.useState('');
  const [showNew, setShowNew] = window.useState(false);
  let inv = DB.byBiz(store.invoices, bizId);
  const counts = { all: inv.length };
  ['draft', 'sent', 'overdue', 'partial', 'paid'].forEach(s => counts[s] = inv.filter(i => i.status === s).length);
  let rows = filter === 'all' ? inv : inv.filter(i => i.status === filter);
  if (q) rows = rows.filter(i => { const c = DB.cust(i.cust); return (i.id + (c ? c.name : '')).toLowerCase().includes(q.toLowerCase()); });
  rows = [...rows].sort((a, b) => new Date(b.issued) - new Date(a.issued));

  const totalOut = inv.filter(i => ['sent', 'overdue', 'partial'].includes(i.status)).reduce((s, i) => s + (i.total - i.amountPaid), 0);
  const overdue = inv.filter(i => i.status === 'overdue').reduce((s, i) => s + (i.total - i.amountPaid), 0);
  const draftTot = inv.filter(i => i.status === 'draft').reduce((s, i) => s + i.total, 0);
  const paidMonth = store.payments.filter(p => bizId === 'all' || p.biz === bizId).reduce((s, p) => s + p.amount, 0);

  return sh('div', { className: 'content-inner fade-up' },
    sh(PageHead, { bizId, title: 'Invoices', sub: 'Create, send and collect — with Stripe payment links',
      actions: [
        sh('div', { className: 'field', key: 'f' }, sh(SIcon, { name: 'search' }), sh('input', { placeholder: 'Search invoices…', value: q, onChange: e => setQ(e.target.value) })),
        sh(SButton, { key: 'n', variant: 'primary', icon: 'plus', onClick: () => setShowNew(true) }, 'New invoice')] }),

    sh('div', { className: 'grid g-3', style: { marginBottom: 16 } },
      sh(SStat, { label: 'Outstanding', icon: 'invoice', iconColor: 'var(--warn)', value: SF.fmtNum(Math.round(totalOut)) }),
      sh(SStat, { label: 'Overdue', icon: 'alert', iconColor: 'var(--neg)', value: SF.fmtNum(Math.round(overdue)) }),
      sh(SStat, { label: 'Draft (not sent)', icon: 'file', iconColor: 'var(--muted)', value: SF.fmtNum(Math.round(draftTot)) })),

    sh(SCard, { bodyClass: 'tight' },
      sh('div', { className: 'tbl-toolbar' },
        sh(SSeg, { value: filter, onChange: setFilter, options: [
          { value: 'all', label: 'All', count: counts.all },
          { value: 'draft', label: 'Draft', count: counts.draft },
          { value: 'sent', label: 'Sent', count: counts.sent },
          { value: 'overdue', label: 'Overdue', count: counts.overdue },
          { value: 'partial', label: 'Part-paid', count: counts.partial },
          { value: 'paid', label: 'Paid', count: counts.paid }] }),
        sh('div', { className: 'spacer' }),
        sh(SButton, { size: 'sm', variant: 'ghost', icon: 'download' }, 'Export')),
      sh('div', { className: 'tbl-wrap' }, sh('table', { className: 'tbl' },
        sh('thead', null, sh('tr', null,
          sh('th', null, 'Invoice'),
          bizId === 'all' && sh('th', null, 'Business'),
          sh('th', null, 'Customer'),
          sh('th', null, 'Issued'), sh('th', null, 'Due'),
          sh('th', { className: 'r' }, 'Total'),
          sh('th', null, 'Payment'),
          sh('th', null, 'Status'), sh('th', { style: { width: 30 } }, ''))),
        sh('tbody', null, rows.map(i => { const c = DB.cust(i.cust);
          return sh('tr', { key: i.id, className: 'clickable', onClick: () => setOpenInv(i.id) },
            sh('td', { className: 'id' }, i.id),
            bizId === 'all' && sh('td', null, sh(SBizChip, { biz: i.biz, size: 'sm' })),
            sh('td', { className: 'strong' }, c.name),
            sh('td', { className: 'muted', style: { whiteSpace: 'nowrap' } }, SF.fmtDateShort(i.issued)),
            sh('td', { style: { whiteSpace: 'nowrap', color: i.status === 'overdue' ? 'var(--neg)' : 'var(--ink-2)' } }, SF.fmtDateShort(i.due)),
            sh('td', { className: 'amt' }, sMoney(i.total, 2)),
            sh('td', null, i.stripeLink || i.stripe
              ? sh('span', { className: 'row', style: { gap: 5, color: 'var(--purple)', fontSize: 11.5, fontWeight: 600 } }, sh(SIcon, { name: 'link', size: 13 }), 'Link')
              : sh('span', { className: 'muted', style: { fontSize: 11.5 } }, '—')),
            sh('td', null, sh(SBadge, { status: i.status })),
            sh('td', null, sh(SIcon, { name: 'chevRight', size: 15, style: { color: 'var(--faint)' } })));
        }))))),
    openInv && sh(InvoiceDrawer, { id: openInv, store, onClose: () => setOpenInv(null) }),
    showNew && sh(NewInvoiceModal, { bizId, store, onClose: () => setShowNew(false) }));
}

/* ---- Invoice detail drawer with the full Stripe flow ---- */
function InvoiceDrawer({ id, store, onClose }) {
  const DB = window.DB;
  const inv = store.invoices.find(i => i.id === id);
  const [busy, setBusy] = window.useState(false);
  const [showEmail, setShowEmail] = window.useState(false);
  if (!inv) return null;
  const c = DB.cust(inv.cust); const b = DB.biz(inv.biz);
  const link = inv.stripeLink || (inv.stripe ? 'https://buy.stripe.com/' + inv.stripe : null);
  const due = inv.total - inv.amountPaid;

  const timeline = [
    { t: 'Invoice created', d: inv.issued, done: true },
    inv.status !== 'draft' && { t: 'Sent to ' + c.contact, d: inv.issued, done: true },
    link && { t: 'Stripe payment link created', d: inv.issued, done: true, accent: 'var(--purple)' },
    inv.status === 'overdue' && { t: 'Payment overdue', d: inv.due, done: false, accent: 'var(--neg)' },
    inv.amountPaid > 0 && { t: inv.status === 'partial' ? 'Part-payment received' : 'Paid in full', d: inv.paid || inv.due, done: true, accent: 'var(--pos)' },
  ].filter(Boolean);

  const createLink = () => { setBusy(true); setTimeout(() => { store.createLink(inv.id); setBusy(false); sToast('Stripe payment link created', 'link'); }, 850); };
  const markPaid = () => { store.markPaid(inv.id); sToast('Webhook received · invoice marked paid', 'check'); };

  return sh(SDrawer, { onClose, width: 660 },
    sh('div', { className: 'modal-h', style: { alignItems: 'center' } },
      sh(SBizChip, { biz: b, size: 'md' }),
      sh('div', { style: { flex: 1 } },
        sh('div', { className: 'row', style: { gap: 8 } }, sh('h3', { style: { fontFamily: 'var(--mono)' } }, inv.id), sh(SBadge, { status: inv.status })),
        sh('div', { className: 'muted', style: { fontSize: 12 } }, b.name + ' → ' + c.name)),
      sh('button', { className: 'icon-btn', onClick: onClose, style: { width: 30, height: 30 } }, sh(SIcon, { name: 'x', size: 16 }))),

    sh('div', { className: 'modal-b' },
      // amount hero
      sh('div', { className: 'row between', style: { alignItems: 'flex-end', marginBottom: 18 } },
        sh('div', null,
          sh('div', { className: 'muted', style: { fontSize: 11 } }, due > 0 ? 'Amount due' : 'Total (paid)'),
          sh('div', { className: 'mono', style: { fontSize: 30, fontWeight: 700, color: due > 0 ? 'var(--ink)' : 'var(--pos)', letterSpacing: '-1px' } }, sMoney(due > 0 ? due : inv.total, 2)),
          sh('div', { className: 'muted', style: { fontSize: 11.5 } }, 'Issued ' + SF.fmtDate(inv.issued) + ' · Due ' + SF.fmtDate(inv.due))),
        sh('div', { className: 'row', style: { gap: 7 } },
          sh(SButton, { size: 'sm', icon: 'download' }, 'PDF'),
          sh(SButton, { size: 'sm', icon: 'copy', onClick: () => sCopy(inv.id) }, 'Duplicate'))),

      // STRIPE PAYMENT BLOCK
      sh('div', { className: 'card flat', style: { padding: 14, marginBottom: 18, background: link ? 'var(--purple-tint)' : 'var(--surface-2)', border: '1px solid ' + (link ? 'rgba(106,79,192,0.25)' : 'var(--line)') } },
        sh('div', { className: 'row between', style: { marginBottom: link ? 10 : 0 } },
          sh('div', { className: 'row', style: { gap: 8 } },
            sh('div', { style: { width: 26, height: 26, borderRadius: 6, background: '#635bff', display: 'grid', placeItems: 'center', flex: 'none' } }, sh(SIcon, { name: 'zap', size: 14, style: { color: '#fff' } })),
            sh('div', null,
              sh('div', { style: { fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' } }, 'Stripe Checkout'),
              sh('div', { className: 'muted', style: { fontSize: 11 } }, link ? 'Payment link active' : (b.stripe ? 'No link yet for this invoice' : 'Connect Stripe in Settings first')))),
          !link && inv.status !== 'paid' && sh(SButton, { variant: 'primary', size: 'sm', icon: busy ? null : 'link', disabled: busy || !b.stripe, onClick: createLink },
            busy ? 'Creating…' : 'Create payment link')),
        link && sh('div', null,
          sh('div', { className: 'linkbox', style: { marginBottom: 9 } },
            sh(SIcon, { name: 'link', size: 14, style: { color: 'var(--purple)' } }),
            sh('span', { className: 'url' }, link),
            sh('button', { className: 'btn sm', onClick: () => sCopy(link) }, sh(SIcon, { name: 'copy', size: 13 }), 'Copy')),
          sh('div', { className: 'row', style: { gap: 7 } },
            inv.status !== 'paid' && sh(SButton, { size: 'sm', icon: 'send', onClick: () => setShowEmail(true) }, 'Email link to ' + c.contact.split(' ')[0]),
            inv.status !== 'paid' && sh(SButton, { size: 'sm', variant: 'ghost', icon: 'external' }, 'Preview'),
            inv.status !== 'paid' && sh('div', { className: 'spacer' }),
            inv.status !== 'paid' && sh(SButton, { size: 'sm', variant: 'ghost', onClick: markPaid, title: 'Simulate Stripe webhook' }, sh(SIcon, { name: 'refresh', size: 13 }), 'Simulate paid'),
            inv.status === 'paid' && sh('div', { className: 'row', style: { gap: 6, color: 'var(--pos)', fontSize: 12, fontWeight: 600 } }, sh(SIcon, { name: 'check', size: 15 }), 'Paid via Stripe' + (inv.paid ? ' on ' + SF.fmtDate(inv.paid) : ''))))),

      // line items
      sh('div', { className: 'section-title' }, 'Line items', sh('span', { className: 'line' })),
      sh('div', { className: 'tbl-wrap card flat', style: { border: '1px solid var(--line)', marginBottom: 14 } },
        sh('table', { className: 'tbl dense' },
          sh('thead', null, sh('tr', null, sh('th', null, 'Description'), sh('th', { className: 'r' }, 'Qty'), sh('th', { className: 'r' }, 'Unit'), sh('th', { className: 'r' }, 'Amount'))),
          sh('tbody', null, inv.items.map((it, k) => sh('tr', { key: k },
            sh('td', { className: 'strong' }, it.desc),
            sh('td', { className: 'amt' }, it.qty),
            sh('td', { className: 'amt' }, sMoney(it.unit, 2)),
            sh('td', { className: 'amt' }, sMoney(it.amount, 2))))))),
      // totals
      sh('div', { style: { marginLeft: 'auto', width: 260, marginBottom: 18 } },
        totalRow('Subtotal', sMoney(inv.subtotal, 2)),
        totalRow('GST (' + (inv.subtotal ? (inv.gst / inv.subtotal * 100).toFixed(0) : '10') + '%)', sMoney(inv.gst, 2)),
        totalRow('Total', sMoney(inv.total, 2), true),
        inv.amountPaid > 0 && totalRow('Paid', '−' + sMoney(inv.amountPaid, 2), false, 'var(--pos)'),
        inv.amountPaid > 0 && inv.amountPaid < inv.total && totalRow('Balance due', sMoney(due, 2), true, 'var(--neg)')),

      // timeline
      sh('div', { className: 'section-title' }, 'Activity', sh('span', { className: 'line' })),
      sh('div', { className: 'tl', style: { marginTop: 12 } },
        timeline.reverse().map((e, k) => sh('div', { key: k, className: 'tl-item' + (e.done ? '' : ' muted') },
          sh('div', { style: { fontSize: 12.5, fontWeight: 600, color: e.accent || 'var(--ink)' } }, e.t),
          sh('div', { className: 'muted', style: { fontSize: 11 } }, SF.fmtDate(e.d)))))),

    showEmail && sh(EmailLinkModal, { inv, c, b, link, onClose: () => setShowEmail(false) }));
}

function totalRow(label, val, bold, color) {
  return sh('div', { className: 'row between', style: { padding: '5px 0', borderTop: bold ? '1px solid var(--line)' : 'none' } },
    sh('span', { style: { fontSize: bold ? 13 : 12, color: color || (bold ? 'var(--ink)' : 'var(--muted)'), fontWeight: bold ? 600 : 400 } }, label),
    sh('span', { className: 'mono', style: { fontSize: bold ? 14 : 12.5, fontWeight: bold ? 700 : 500, color: color || 'var(--ink)' } }, val));
}

/* ---- Email-link compose modal ---- */
function invoiceEmailSubject(b, inv) {
  return b.name + ' — Invoice ' + inv.id + ' (' + sMoney(inv.total, 2) + ')';
}
function invoiceEmailBody(c, inv, link, b) {
  return `Hi ${c.contact.split(' ')[0]},\n\nPlease find invoice ${inv.id} for ${sMoney(inv.total, 2)} (incl. GST), due ${SF.fmtDate(inv.due)}.\n\nYou can pay securely here:\n${link}\n\nThanks,\n${b.owner}\n${b.name}`;
}
function EmailLinkModal({ inv, c, b, link, onClose }) {
  return sh(SModal, { title: 'Email payment link', sub: 'To ' + c.email, onClose, width: 560,
    footer: [sh('div', { className: 'spacer', key: 's' }),
      sh(SButton, { key: 'c', variant: 'ghost', onClick: onClose }, 'Cancel'),
      sh(SButton, { key: 'x', variant: 'primary', icon: 'send', onClick: () => { onClose(); sToast('Email sent to ' + c.contact, 'send'); } }, 'Send email')] },
    sh('div', { className: 'form-row' }, sh('label', null, 'To'), sh('input', { className: 'input', defaultValue: c.email })),
    sh('div', { className: 'form-row' }, sh('label', null, 'Subject'), sh('input', { className: 'input', defaultValue: invoiceEmailSubject(b, inv) })),
    sh('div', { className: 'form-row' }, sh('label', null, 'Message'),
      sh('textarea', { className: 'input', rows: 6, defaultValue: invoiceEmailBody(c, inv, link, b) })),
    sh('div', { className: 'linkbox' }, sh(SIcon, { name: 'link', size: 14, style: { color: 'var(--purple)' } }), sh('span', { className: 'url' }, link)));
}

/* ---- New invoice modal ---- */
function NewInvoiceModal({ bizId, store, onClose }) {
  const DB = window.DB;
  const defBiz = bizId === 'all' ? DB.businesses[0].id : bizId;
  const [biz, setBiz] = window.useState(defBiz);
  const custs = DB.customers.filter(c => c.biz === biz);
  const [cust, setCust] = window.useState(custs[0] && custs[0].id);
  const [items, setItems] = window.useState([{ desc: '', qty: 1, unit: 0 }]);
  const sub = items.reduce((s, i) => s + (+i.qty || 0) * (+i.unit || 0), 0);
  const gstRate = DB.biz(biz)?.gstRate ?? 0.1;
  const gst = sub * gstRate;

  const upd = (k, f, v) => setItems(items.map((it, i) => i === k ? { ...it, [f]: v } : it));
  return sh(SModal, { title: 'New invoice', onClose, width: 620,
    footer: [
      sh('div', { className: 'mono', key: 't', style: { fontSize: 13, fontWeight: 600 } }, 'Total ' + sMoney(sub + gst, 2)),
      sh('div', { className: 'spacer', key: 's' }),
      sh(SButton, { key: 'd', variant: 'ghost', onClick: onClose }, 'Save draft'),
      sh(SButton, { key: 'c', variant: 'primary', icon: 'send', onClick: () => {
        if (!items.some(x => x.desc)) { sToast('Add at least one line item', 'alert'); return; }
        store.addInvoice(biz, cust, items); onClose(); sToast('Invoice created', 'invoice');
      } }, 'Create & send')] },
    sh('div', { className: 'row', style: { gap: 12, marginBottom: 14 } },
      sh('div', { className: 'form-row', style: { flex: 1, marginBottom: 0 } }, sh('label', null, 'Business'),
        sh('select', { value: biz, onChange: e => { setBiz(e.target.value); const f = DB.customers.find(c => c.biz === e.target.value); setCust(f ? f.id : null); } },
          DB.businesses.map(b => sh('option', { key: b.id, value: b.id }, b.name)))),
      sh('div', { className: 'form-row', style: { flex: 1, marginBottom: 0 } }, sh('label', null, 'Customer'),
        sh('select', { value: cust, onChange: e => setCust(e.target.value) }, custs.map(c => sh('option', { key: c.id, value: c.id }, c.name))))),
    sh('div', { className: 'section-title' }, 'Line items', sh('span', { className: 'line' })),
    sh('div', { className: 'col', style: { gap: 7, marginBottom: 10 } },
      items.map((it, k) => sh('div', { className: 'row', key: k, style: { gap: 7 } },
        sh('input', { className: 'input', placeholder: 'Description', style: { flex: 1 }, value: it.desc, onChange: e => upd(k, 'desc', e.target.value) }),
        sh('input', { className: 'input mono', placeholder: 'Qty', style: { width: 60 }, value: it.qty, onChange: e => upd(k, 'qty', e.target.value) }),
        sh('input', { className: 'input mono', placeholder: 'Unit $', style: { width: 90 }, value: it.unit, onChange: e => upd(k, 'unit', e.target.value) }),
        sh('div', { className: 'mono', style: { width: 78, textAlign: 'right', fontSize: 12.5, alignSelf: 'center', color: 'var(--ink)' } }, sMoney((+it.qty || 0) * (+it.unit || 0), 2))))),
    sh(SButton, { size: 'sm', variant: 'ghost', icon: 'plus', onClick: () => setItems([...items, { desc: '', qty: 1, unit: 0 }]) }, 'Add line'),
    sh('div', { style: { marginLeft: 'auto', width: 240, marginTop: 14 } },
      totalRow('Subtotal', sMoney(sub, 2)), totalRow('GST (' + (gstRate * 100).toFixed(0) + '%)', sMoney(gst, 2)), totalRow('Total', sMoney(sub + gst, 2), true)));
}

/* ============================================================
   PAYMENTS
   ============================================================ */
function PaymentsView({ bizId, store }) {
  const DB = window.DB;
  const [method, setMethod] = window.useState('all');
  let pays = DB.byBiz(store.payments, bizId).sort((a, b) => new Date(b.date) - new Date(a.date));
  const counts = { all: pays.length, stripe: 0, bank: 0, cash: 0 };
  pays.forEach(p => counts[p.method]++);
  const rows = method === 'all' ? pays : pays.filter(p => p.method === method);
  const total = pays.reduce((s, p) => s + p.amount, 0);
  const fees = pays.reduce((s, p) => s + p.fee, 0);
  const stripeTot = pays.filter(p => p.method === 'stripe').reduce((s, p) => s + p.amount, 0);

  const methodMeta = { stripe: { c: 'var(--purple)', i: 'zap', l: 'Stripe' }, bank: { c: 'var(--info)', i: 'bank', l: 'Bank transfer' }, cash: { c: 'var(--brand)', i: 'dollar', l: 'Cash' } };

  return sh('div', { className: 'content-inner fade-up' },
    sh(PageHead, { bizId, title: 'Payments', sub: 'Reconciled receipts across all methods' }),
    sh('div', { className: 'grid g-3', style: { marginBottom: 16 } },
      sh(SStat, { label: 'Received', icon: 'dollar', iconColor: 'var(--brand)', value: SF.fmtNum(Math.round(total)) }),
      sh(SStat, { label: 'Via Stripe', icon: 'zap', iconColor: 'var(--purple)', value: SF.fmtNum(Math.round(stripeTot)) }),
      sh(SStat, { label: 'Processing fees', icon: 'card', iconColor: 'var(--neg)', value: SF.fmtNum(fees.toFixed(0)) })),
    sh(SCard, { bodyClass: 'tight' },
      sh('div', { className: 'tbl-toolbar' },
        sh(SSeg, { value: method, onChange: setMethod, options: [
          { value: 'all', label: 'All', count: counts.all },
          ...Object.entries(methodMeta).map(([k, m]) => ({ value: k, label: m.l, count: counts[k] }))] })),
      sh('div', { className: 'tbl-wrap' }, sh('table', { className: 'tbl' },
        sh('thead', null, sh('tr', null,
          sh('th', null, 'Receipt'), bizId === 'all' && sh('th', null, 'Business'),
          sh('th', null, 'Customer'), sh('th', null, 'Invoice'), sh('th', null, 'Method'),
          sh('th', null, 'Date'), sh('th', { className: 'r' }, 'Fee'), sh('th', { className: 'r' }, 'Amount'), sh('th', null, 'Status'))),
        sh('tbody', null, rows.map(p => { const c = DB.cust(p.cust); const m = methodMeta[p.method];
          return sh('tr', { key: p.id },
            sh('td', { className: 'id' }, p.id),
            bizId === 'all' && sh('td', null, sh(SBizChip, { biz: p.biz, size: 'sm' })),
            sh('td', { className: 'strong' }, c ? c.name : '—'),
            sh('td', { className: 'id' }, p.invoice),
            sh('td', null, sh('span', { className: 'row', style: { gap: 6, color: m.c, fontWeight: 600, fontSize: 11.5 } }, sh(SIcon, { name: m.i, size: 13 }), m.l)),
            sh('td', { className: 'muted', style: { whiteSpace: 'nowrap' } }, SF.fmtDateShort(p.date)),
            sh('td', { className: 'amt muted' }, p.fee ? '−' + sMoney(p.fee, 2) : '—'),
            sh('td', { className: 'amt', style: { color: 'var(--pos)', fontWeight: 600 } }, sMoney(p.amount, 2)),
            sh('td', null, sh(SBadge, { status: p.status === 'partial' ? 'partial' : 'paid' }, p.status === 'partial' ? 'Partial' : 'Settled')));
        }))))));
}

/* ============================================================
   STRIPE PAYMENT LINKS
   ============================================================ */
function StripeLinksView({ bizId, store, setOpenInv }) {
  const DB = window.DB;
  const linked = DB.byBiz(store.invoices, bizId).filter(i => i.stripe || i.stripeLink);
  return sh('div', { className: 'content-inner fade-up' },
    sh(PageHead, { bizId, title: 'Stripe payment links', sub: linked.length + ' active checkout links' }),
    sh(SCard, { bodyClass: 'tight' },
      sh('div', { className: 'tbl-wrap' }, sh('table', { className: 'tbl' },
        sh('thead', null, sh('tr', null,
          sh('th', null, 'Invoice'), bizId === 'all' && sh('th', null, 'Business'),
          sh('th', null, 'Customer'), sh('th', { className: 'r' }, 'Amount'), sh('th', null, 'Checkout URL'), sh('th', null, 'Status'), sh('th', { style: { width: 90 } }, ''))),
        sh('tbody', null, linked.map(i => { const c = DB.cust(i.cust);
          const link = i.stripeLink || 'https://buy.stripe.com/' + i.stripe;
          return sh('tr', { key: i.id },
            sh('td', { className: 'id clickable', onClick: () => setOpenInv(i.id) }, i.id),
            bizId === 'all' && sh('td', null, sh(SBizChip, { biz: i.biz, size: 'sm' })),
            sh('td', { className: 'strong' }, c.name),
            sh('td', { className: 'amt' }, sMoney(i.total, 2)),
            sh('td', null, sh('span', { className: 'mono', style: { fontSize: 11, color: 'var(--purple)' } }, link.replace('https://', ''))),
            sh('td', null, sh(SBadge, { status: i.status === 'paid' ? 'paid' : 'open' }, i.status === 'paid' ? 'Completed' : 'Active')),
            sh('td', null, sh('button', { className: 'btn sm', onClick: () => sCopy(link) }, sh(SIcon, { name: 'copy', size: 13 }), 'Copy')));
        }))))));
}

Object.assign(window, { CustomersView, InvoicesView, PaymentsView, StripeLinksView, PageHead, totalRow });
