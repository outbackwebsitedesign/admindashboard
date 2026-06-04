/* ============================================================
   LEDGER — Settings view
   ============================================================ */
const { Icon: StIcon, BizChip: StBizChip, Button: StButton, Badge: StBadge, Card: StCard,
        Avatar: StAvatar, PageHead: StPageHead, h: sth } = window;

function SettingsView({ bizId, store }) {
  const DB = window.DB;
  const [tab, setTab] = window.useState(bizId === 'all' ? 'businesses' : 'business');
  const tabs = bizId === 'all'
    ? [['businesses', 'Businesses', 'building'], ['account', 'My account', 'user'], ['integrations', 'Integrations', 'zap'], ['team', 'Team', 'users']]
    : [['business', 'Business profile', 'briefcase'], ['integrations', 'Integrations', 'zap'], ['invoicing', 'Invoicing & tax', 'invoice'], ['docs', 'Documents', 'file']];

  return sth('div', { className: 'content-inner fade-up' },
    sth(StPageHead, { bizId, title: 'Settings', sub: bizId === 'all' ? 'Workspace & account' : DB.biz(bizId).name }),
    sth('div', { className: 'grid', style: { gridTemplateColumns: '210px 1fr', gap: 16, alignItems: 'start' } },
      sth('div', { className: 'card', style: { padding: 7 } },
        tabs.map(([id, label, icon]) => sth('div', { key: id, className: 'nav-item', style: {
          color: tab === id ? 'var(--ink)' : 'var(--muted)', background: tab === id ? 'var(--surface-3)' : 'transparent', marginBottom: 2 },
          onClick: () => setTab(id) },
          sth(StIcon, { name: icon, size: 16, style: { color: tab === id ? 'var(--brand)' : 'var(--faint)' } }), label))),
      sth('div', null,
        tab === 'businesses' ? sth(BusinessesSettings, { store }) :
        tab === 'integrations' ? sth(IntegrationsSettings, { bizId }) :
        tab === 'account' ? sth(AccountSettings) :
        tab === 'business' ? sth(BusinessProfile, { bizId }) :
        tab === 'invoicing' ? sth(InvoicingSettings, { bizId }) :
        tab === 'docs' ? sth(DocsSettings, { bizId }) :
        sth(TeamSettings))));
}

function row2(label, val, mono) {
  return sth('div', { className: 'form-row', style: { flex: 1, marginBottom: 0 } },
    sth('label', null, label), sth('input', { className: 'input' + (mono ? ' mono' : ''), defaultValue: val }));
}

function BusinessesSettings({ store }) {
  const DB = window.DB;
  return sth('div', { className: 'col', style: { gap: 16 } },
    sth(StCard, { title: 'Client businesses', sub: DB.businesses.length + ' active',
      right: sth(StButton, { size: 'sm', variant: 'primary', icon: 'plus' }, 'Add business') },
      sth('div', { className: 'col', style: { gap: 10 } },
        DB.businesses.map(b => sth('div', { key: b.id, className: 'row', style: { gap: 12, padding: '11px 12px', border: '1px solid var(--line)', borderRadius: 'var(--r)', background: 'var(--surface-2)' } },
          sth(StBizChip, { biz: b, size: 'lg' }),
          sth('div', { style: { flex: 1 } },
            sth('div', { style: { fontSize: 13.5, fontWeight: 600 } }, b.name),
            sth('div', { className: 'muted', style: { fontSize: 11.5 } }, b.type + ' · ' + b.owner + ' · since ' + b.since)),
          sth(StBadge, { className: b.stripe ? 'paid' : 'draft', dot: true }, b.stripe ? 'Stripe' : 'No Stripe'),
          sth(StBadge, { className: b.gst ? 'open' : 'soft' }, b.gst ? 'GST registered' : 'No GST'),
          sth('button', { className: 'icon-btn', style: { width: 32, height: 32 } }, sth(StIcon, { name: 'edit', size: 15 })))))));
}

function BusinessProfile({ bizId }) {
  const b = window.DB.biz(bizId);
  return sth('div', { className: 'col', style: { gap: 16 } },
    sth(StCard, { title: 'Business profile' },
      sth('div', { className: 'row', style: { gap: 12, marginBottom: 14 } }, row2('Business name', b.name), row2('Trading type', b.type)),
      sth('div', { className: 'row', style: { gap: 12, marginBottom: 14 } }, row2('ABN', b.abn, true), row2('Owner', b.owner)),
      sth('div', { className: 'row', style: { gap: 12, marginBottom: 14 } }, row2('Email', b.email), row2('Phone', b.phone, true)),
      sth('div', { className: 'form-row', style: { marginBottom: 0 } }, sth('label', null, 'Address'), sth('input', { className: 'input', defaultValue: b.address })),
      sth('div', { className: 'row', style: { marginTop: 16, gap: 8 } }, sth(StButton, { variant: 'primary' }, 'Save changes'), sth(StButton, { variant: 'ghost' }, 'Cancel'))));
}

function IntegrationsSettings({ bizId }) {
  const DB = window.DB;
  const b = bizId !== 'all' ? DB.biz(bizId) : null;
  const items = (DB.integrations || []).map(it => ({
    ...it,
    on: it.name === 'Stripe' && b ? !!b.stripe : !!it.connected,
  }));
  return sth(StCard, { title: 'Integrations', sub: b ? b.name : 'Workspace-wide' },
    sth('div', { className: 'col', style: { gap: 10 } },
      items.map(it => sth('div', { key: it.name, className: 'row', style: { gap: 12, padding: '12px', border: '1px solid var(--line)', borderRadius: 'var(--r)' } },
        sth('div', { style: { width: 36, height: 36, borderRadius: 8, background: it.color, display: 'grid', placeItems: 'center', flex: 'none' } }, sth(StIcon, { name: it.icon, size: 18, style: { color: '#fff' } })),
        sth('div', { style: { flex: 1 } }, sth('div', { style: { fontSize: 13, fontWeight: 600 } }, it.name), sth('div', { className: 'muted', style: { fontSize: 11.5 } }, it.desc)),
        it.on ? sth(StBadge, { status: 'paid', dot: true }, 'Connected') : sth(StButton, { size: 'sm' }, 'Connect')))));
}

function InvoicingSettings({ bizId }) {
  const b = window.DB.biz(bizId);
  return sth('div', { className: 'col', style: { gap: 16 } },
    sth(StCard, { title: 'Invoicing & tax' },
      sth('div', { className: 'row', style: { gap: 12, marginBottom: 14 } },
        sth('div', { className: 'form-row', style: { flex: 1, marginBottom: 0 } }, sth('label', null, 'Invoice prefix'), sth('input', { className: 'input mono', defaultValue: b.id === 'nbs' ? 'NB-' : b.id === 'bws' ? 'BW-' : 'INV-' })),
        sth('div', { className: 'form-row', style: { flex: 1, marginBottom: 0 } }, sth('label', null, 'Default payment terms'), sth('select', null, sth('option', null, 'Net 14 days'), sth('option', null, 'Net 7 days'), sth('option', null, 'Net 30 days')))),
      sth('div', { className: 'row', style: { gap: 12, marginBottom: 14 } },
        sth('div', { className: 'form-row', style: { flex: 1, marginBottom: 0 } }, sth('label', null, 'GST rate'), sth('input', { className: 'input mono', defaultValue: '10%' })),
        sth('div', { className: 'form-row', style: { flex: 1, marginBottom: 0 } }, sth('label', null, 'Currency'), sth('input', { className: 'input', defaultValue: 'AUD ($)' }))),
      sth('div', { className: 'card flat', style: { padding: 12, background: 'var(--brand-tint)', border: '1px solid var(--brand-tint-2)', display: 'flex', gap: 9, alignItems: 'center' } },
        sth(StIcon, { name: 'receipt', size: 16, style: { color: 'var(--brand-700)', flex: 'none' } }),
        sth('span', { style: { fontSize: 12, color: 'var(--ink-2)' } }, 'This business is registered for GST. Invoices include 10% GST and feed the quarterly BAS report.'))));
}

function DocsSettings({ bizId }) {
  const DB = window.DB;
  const docs = DB.byBiz(DB.documents, bizId);
  return sth(StCard, { title: 'Documents', sub: docs.length + ' files', bodyClass: 'tight',
    right: sth(StButton, { size: 'sm', variant: 'primary', icon: 'plus' }, 'Upload') },
    sth('div', { className: 'tbl-wrap' }, sth('table', { className: 'tbl' },
      sth('thead', null, sth('tr', null, sth('th', null, 'Name'), sth('th', null, 'Type'), sth('th', null, 'Size'), sth('th', null, 'Added'), sth('th', null, 'By'), sth('th', null, ''))),
      sth('tbody', null, docs.map(d => sth('tr', { key: d.id, className: 'clickable' },
        sth('td', null, sth('div', { className: 'cellrow' }, sth(StIcon, { name: 'file', size: 16, style: { color: 'var(--muted)' } }), sth('span', { className: 'strong' }, d.name))),
        sth('td', null, sth('span', { className: 'tag' }, d.kind)),
        sth('td', { className: 'muted' }, d.size),
        sth('td', { className: 'muted' }, window.DB.fmt.fmtDateShort(d.date)),
        sth('td', { className: 'muted' }, d.by),
        sth('td', null, sth(StIcon, { name: 'download', size: 15, style: { color: 'var(--faint)' } }))))))));
}

function AccountSettings() {
  const DB = window.DB;
  const u = DB.currentUser || {};
  return sth('div', { className: 'col', style: { gap: 16 } },
    sth(StCard, { title: 'My account' },
      sth('div', { className: 'row', style: { gap: 14, marginBottom: 16 } },
        sth(StAvatar, { name: u.name || '?', size: 56 }),
        sth('div', null, sth('div', { style: { fontSize: 15, fontWeight: 600 } }, u.name || '—'), sth('div', { className: 'muted', style: { fontSize: 12 } }, u.role || ''), sth('div', { className: 'lk', style: { fontSize: 12, marginTop: 4 } }, 'Change photo'))),
      sth('div', { className: 'row', style: { gap: 12, marginBottom: 14 } }, row2('Full name', u.name || ''), row2('Email', u.email || '')),
      sth('div', { className: 'row', style: { gap: 12 } }, row2('Practice name', u.practice || ''), row2('Phone', u.phone || '', true)),
      sth('div', { className: 'row', style: { marginTop: 16, gap: 8 } }, sth(StButton, { variant: 'primary' }, 'Save'), sth(StButton, { variant: 'ghost' }, 'Cancel'))));
}

function TeamSettings() {
  const DB = window.DB;
  const team = DB.team || [];
  const label = team.length === 0 ? 'No members yet' : team.length + ' member' + (team.length === 1 ? '' : 's');
  return sth(StCard, { title: 'Team', sub: label, right: sth(StButton, { size: 'sm', variant: 'primary', icon: 'plus' }, 'Invite') },
    team.length === 0
      ? sth('div', { className: 'muted', style: { fontSize: 13, padding: '12px 0' } }, 'No team members yet. Invite someone to get started.')
      : sth('div', { className: 'col', style: { gap: 10 } },
          team.map(m => sth('div', { key: m.id, className: 'row', style: { gap: 12, padding: '11px 12px', border: '1px solid var(--line)', borderRadius: 'var(--r)' } },
            sth(StAvatar, { name: m.name, size: 38 }),
            sth('div', { style: { flex: 1 } }, sth('div', { style: { fontSize: 13, fontWeight: 600 } }, m.name), sth('div', { className: 'muted', style: { fontSize: 11.5 } }, m.email)),
            sth(StBadge, { className: 'soft' }, m.role)))));
}

Object.assign(window, { SettingsView });
