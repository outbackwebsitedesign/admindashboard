/* ============================================================
   LEDGER — Overview views: Global + Per-business dashboards
   → window.GlobalDashboard, window.BusinessDashboard
   ============================================================ */
const { Icon, BizChip, Avatar, Button, Badge, Card, Stat, Seg, Sparkline,
        CashflowChart, NetBars, Donut, HBars, h } = window;

function money(n, dp) { return window.DB.fmt.fmtAUD(n, { dp }); }
const F = window.DB.fmt;

// Australian FY: Jul 1 – Jun 30
function auFYLabel() {
  const m = new Date().getMonth(); // 0=Jan … 6=Jul
  const y = m >= 6 ? new Date().getFullYear() : new Date().getFullYear() - 1;
  return `FY${String(y).slice(2)}–${String(y + 1).slice(2)}`;
}
// BAS quarters: Q1 Jul-Sep, Q2 Oct-Dec, Q3 Jan-Mar, Q4 Apr-Jun
function auBASQuarter() {
  const m = new Date().getMonth();
  if (m >= 3 && m <= 5) return 'Apr–Jun quarter';
  if (m >= 6 && m <= 8) return 'Jul–Sep quarter';
  if (m >= 9 && m <= 11) return 'Oct–Dec quarter';
  return 'Jan–Mar quarter';
}

/* small status pill row used in lists */
function InvRow({ inv, onOpen }) {
  const DB = window.DB; const c = DB.cust(inv.cust);
  return h('tr', { className: 'clickable', onClick: () => onOpen && onOpen(inv) },
    h('td', { className: 'id' }, inv.id),
    h('td', null, h('div', { className: 'cellrow' }, h(BizChip, { biz: inv.biz, size: 'sm' }),
      h('span', { className: 'strong' }, c ? c.name : '—'))),
    h('td', { className: 'amt' }, money(inv.total, 2)),
    h('td', null, h(Badge, { status: inv.status })),
    h('td', { className: 'muted', style: { whiteSpace: 'nowrap' } }, F.relDays(inv.due)));
}

/* ============================================================
   GLOBAL DASHBOARD  (all businesses)
   ============================================================ */
function GlobalDashboard({ go, openInvoice }) {
  const DB = window.DB;
  const businesses = DB.businesses;
  const allInv = DB.invoices;
  const series = DB.series.all;

  const totalIncome = businesses.reduce((s, b) => s + b.ytdIncome, 0);
  const totalExpense = businesses.reduce((s, b) => s + b.ytdExpense, 0);
  const totalCash = businesses.reduce((s, b) => s + b.cash, 0);
  const netProfit = totalIncome - totalExpense;

  const outstanding = allInv.filter(i => ['sent', 'overdue', 'partial'].includes(i.status))
    .reduce((s, i) => s + (i.total - i.amountPaid), 0);
  const overdueCount = allInv.filter(i => i.status === 'overdue').length;
  const overdueAmt = allInv.filter(i => i.status === 'overdue').reduce((s, i) => s + (i.total - i.amountPaid), 0);

  const recentInv = [...allInv].sort((a, b) => new Date(b.issued) - new Date(a.issued)).slice(0, 7);
  const attention = allInv.filter(i => i.status === 'overdue').sort((a, b) => new Date(a.due) - new Date(b.due));

  // per-business income bars
  const incRows = businesses.map(b => ({
    label: b.name, value: b.ytdIncome, color: b.color,
    chip: h(BizChip, { biz: b, size: 'sm' }),
  }));

  // GST estimate (collected on income, credits on expenses) — rough BAS net
  const gstNet = Math.round((totalIncome / 11) - (totalExpense / 11));

  return h('div', { className: 'content-inner stagger' },
    // KPI ROW
    h('div', { className: 'grid g-4', style: { marginBottom: 16 } },
      h(Stat, { label: 'Income · FY to date', icon: 'trendUp', iconColor: 'var(--brand)', value: F.fmtNum(Math.round(totalIncome)),
        spark: h(Sparkline, { data: series.map(s => s.income), w: 96, hgt: 34, color: 'var(--brand)' }) }),
      h(Stat, { label: 'Expenses · FY to date', icon: 'trendDown', iconColor: 'var(--neg)', value: F.fmtNum(Math.round(totalExpense)),
        spark: h(Sparkline, { data: series.map(s => s.expense), w: 96, hgt: 34, color: 'var(--neg)', fill: true }) }),
      h(Stat, { label: 'Net profit · FY', icon: 'dollar', iconColor: 'var(--info)', value: F.fmtNum(netProfit),
        foot: ((netProfit / totalIncome) * 100).toFixed(0) + '% margin' }),
      h(Stat, { label: 'Cash on hand', icon: 'bank', iconColor: 'var(--purple)', value: F.fmtNum(totalCash),
        foot: 'across ' + businesses.length + ' accounts' })),

    // CASHFLOW + RIGHT RAIL
    h('div', { className: 'split wide', style: { marginBottom: 16 } },
      h(Card, { title: 'Cash flow', sub: 'All businesses · ' + auFYLabel(),
        right: h('div', { className: 'row', style: { gap: 14 } },
          h(Legend, { color: 'var(--brand)', label: 'Income' }),
          h(Legend, { color: 'var(--neg)', label: 'Expenses', dash: true })) },
        h(CashflowChart, { series, fmt: F }),
        h('div', { style: { marginTop: 6 } }, h(NetBars, { series, fmt: F })),
        h('div', { className: 'row', style: { marginTop: 8, gap: 14, paddingLeft: 4 } },
          h(Legend, { color: 'var(--brand)', label: 'Monthly net profit', square: true }))),
      h('div', { className: 'col', style: { gap: 16 } },
        h(Card, { title: 'Needs attention',
          right: overdueCount > 0 && h(Badge, { status: 'overdue' }, overdueCount + ' overdue') },
          attention.length ? h('div', { className: 'col', style: { gap: 2 } },
            attention.slice(0, 4).map(inv => {
              const c = DB.cust(inv.cust);
              return h('div', { key: inv.id, className: 'row', style: { padding: '8px 0', borderBottom: '1px solid var(--line-2)', cursor: 'pointer' }, onClick: () => openInvoice(inv) },
                h(BizChip, { biz: inv.biz, size: 'sm' }),
                h('div', { style: { flex: 1, minWidth: 0 } },
                  h('div', { style: { fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, c ? c.name : '—'),
                  h('div', { className: 'muted', style: { fontSize: 11 } }, inv.id + ' · due ' + F.relDays(inv.due))),
                h('span', { className: 'mono', style: { fontSize: 12.5, fontWeight: 600, color: 'var(--neg)' } }, money(inv.total - inv.amountPaid, 0)));
            }),
            h('div', { style: { paddingTop: 10 } }, h(Button, { size: 'sm', variant: 'ghost', icon: 'arrowRight', onClick: () => go('invoices') }, 'Review all invoices'))
          ) : h('div', { className: 'muted', style: { fontSize: 12.5, padding: '6px 0' } }, 'Nothing overdue. All clear.')),
        h(Card, { title: 'BAS / GST estimate', sub: auBASQuarter() },
          h('div', { className: 'row between', style: { marginBottom: 8 } },
            h('span', { className: 'muted', style: { fontSize: 12 } }, 'GST collected'),
            h('span', { className: 'mono', style: { fontWeight: 600 } }, money(totalIncome / 11, 0))),
          h('div', { className: 'row between', style: { marginBottom: 8 } },
            h('span', { className: 'muted', style: { fontSize: 12 } }, 'GST credits'),
            h('span', { className: 'mono', style: { fontWeight: 600 } }, '−' + money(totalExpense / 11, 0))),
          h('div', { className: 'row between', style: { paddingTop: 8, borderTop: '1px solid var(--line)' } },
            h('span', { style: { fontSize: 12.5, fontWeight: 600 } }, 'Net GST payable'),
            h('span', { className: 'mono', style: { fontWeight: 700, color: 'var(--neg)' } }, money(gstNet, 0)))))),

    // PER-BUSINESS GRID
    h('div', { className: 'section-title' }, 'Businesses', h('span', { className: 'line' })),
    h('div', { className: 'grid g-4', style: { marginBottom: 20 } },
      businesses.map(b => h(BizCard, { key: b.id, b, go }))),

    // PERFORMANCE + RECENT
    h('div', { className: 'split wide' },
      h(Card, { title: 'Income by business', sub: 'Financial year to date' },
        h(HBars, { rows: incRows, fmt: F })),
      h(Card, { title: 'Recent invoices', bodyClass: 'tight',
        right: h(Button, { size: 'sm', variant: 'ghost', icon: 'arrowRight', onClick: () => go('invoices') }, 'All') },
        h('div', { className: 'tbl-wrap' }, h('table', { className: 'tbl dense' },
          h('thead', null, h('tr', null, h('th', null, 'Invoice'), h('th', null, 'Customer'), h('th', { className: 'r' }, 'Total'), h('th', null, 'Status'), h('th', null, 'Due'))),
          h('tbody', null, recentInv.map(inv => h(InvRow, { key: inv.id, inv, onOpen: openInvoice }))))))));
}

function Legend({ color, label, dash, square }) {
  return h('span', { className: 'row', style: { gap: 6, fontSize: 11.5, color: 'var(--muted)' } },
    square
      ? h('span', { style: { width: 10, height: 10, borderRadius: 2, background: color } })
      : h('span', { style: { width: 16, height: 0, borderTop: (dash ? '2px dashed ' : '2px solid ') + color, display: 'inline-block' } }),
    label);
}

/* business summary card on the global dash */
function BizCard({ b, go }) {
  const DB = window.DB;
  const s = DB.series[b.id] || [];
  const net = b.ytdIncome - b.ytdExpense;
  const open = DB.invoices.filter(i => i.biz === b.id && ['sent', 'overdue', 'partial'].includes(i.status))
    .reduce((a, i) => a + (i.total - i.amountPaid), 0);
  const overdue = DB.invoices.filter(i => i.biz === b.id && i.status === 'overdue').length;
  return h('div', { className: 'card', style: { cursor: 'pointer', overflow: 'hidden' }, onClick: () => go('biz-dash', b.id) },
    h('div', { style: { padding: '13px 14px 10px' } },
      h('div', { className: 'row', style: { gap: 10, marginBottom: 11 } },
        h(BizChip, { biz: b }),
        h('div', { style: { flex: 1, minWidth: 0 } },
          h('div', { style: { fontSize: 13, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, b.name),
          h('div', { className: 'muted', style: { fontSize: 10.5 } }, b.type)),
        overdue > 0 && h('span', { className: 'badge overdue', style: { fontSize: 10 } }, overdue)),
      h('div', { className: 'row between', style: { alignItems: 'flex-end' } },
        h('div', null,
          h('div', { className: 'muted', style: { fontSize: 10.5 } }, 'Net profit FY'),
          h('div', { className: 'mono', style: { fontSize: 18, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.4px' } }, money(net, 0))),
        h(Sparkline, { data: s.map(x => x.net), w: 72, hgt: 30, color: b.color }))),
    h('div', { className: 'row between', style: { padding: '9px 14px', borderTop: '1px solid var(--line-2)', background: 'var(--surface-2)' } },
      h('span', { className: 'muted', style: { fontSize: 11 } }, 'Outstanding'),
      h('span', { className: 'mono', style: { fontSize: 12, fontWeight: 600, color: open > 0 ? 'var(--ink)' : 'var(--muted)' } }, money(open, 0))));
}

/* ============================================================
   PER-BUSINESS DASHBOARD
   ============================================================ */
function BusinessDashboard({ bizId, go, openInvoice }) {
  const DB = window.DB; const b = DB.biz(bizId); const F = DB.fmt;
  const series = DB.series[bizId] || [];
  const inv = DB.invoices.filter(i => i.biz === bizId);
  const net = b.ytdIncome - b.ytdExpense;
  const outstanding = inv.filter(i => ['sent', 'overdue', 'partial'].includes(i.status)).reduce((s, i) => s + (i.total - i.amountPaid), 0);
  const overdue = inv.filter(i => i.status === 'overdue');
  const draft = inv.filter(i => i.status === 'draft');
  const cats = DB.catBreakdown(bizId);
  const totalExp = cats.reduce((s, c) => s + c.amount, 0);
  const upcoming = DB.appointments.filter(a => a.biz === bizId && F.daysFromToday(a.start) >= 0)
    .sort((a, c) => new Date(a.start) - new Date(c.start)).slice(0, 4);
  const openTasks = DB.tasks.filter(t => t.biz === bizId && !t.done).sort((a, c) => new Date(a.due) - new Date(c.due));
  const recentInv = [...inv].sort((a, c) => new Date(c.issued) - new Date(a.issued)).slice(0, 6);

  return h('div', { className: 'content-inner stagger' },
    // header strip
    h('div', { className: 'card', style: { marginBottom: 16, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 16 } },
      h(BizChip, { biz: b, size: 'lg' }),
      h('div', { style: { flex: 1 } },
        h('div', { className: 'row', style: { gap: 9, marginBottom: 3 } },
          h('span', { style: { fontSize: 17, fontWeight: 700, color: 'var(--ink)' } }, b.name),
          h('span', { className: 'badge soft', style: { fontSize: 10.5 } }, b.type)),
        h('div', { className: 'row muted', style: { gap: 12, fontSize: 12, flexWrap: 'wrap' } },
          h('span', { className: 'row', style: { gap: 5 } }, h(Icon, { name: 'user', size: 13 }), b.owner),
          h('span', { className: 'row', style: { gap: 5 } }, h(Icon, { name: 'receipt', size: 13 }), 'ABN ' + b.abn),
          h('span', { className: 'row', style: { gap: 5 } }, h(Icon, { name: 'mapPin', size: 13 }), b.address))),
      h('div', { className: 'row', style: { gap: 8 } },
        h(Badge, { className: b.stripe ? 'paid' : 'draft', dot: true }, b.stripe ? 'Stripe connected' : 'Stripe not set up'),
        h(Button, { variant: 'primary', icon: 'plus', onClick: () => go('invoices') }, 'New invoice'))),

    // KPIs
    h('div', { className: 'grid g-4', style: { marginBottom: 16 } },
      h(Stat, { label: 'Income · FY', icon: 'trendUp', iconColor: 'var(--brand)', value: F.fmtNum(b.ytdIncome),
        spark: h(Sparkline, { data: series.map(s => s.income), w: 90, hgt: 34, color: b.color }) }),
      h(Stat, { label: 'Expenses · FY', icon: 'trendDown', iconColor: 'var(--neg)', value: F.fmtNum(b.ytdExpense) }),
      h(Stat, { label: 'Net profit', icon: 'dollar', iconColor: 'var(--info)', value: F.fmtNum(net), foot: ((net / b.ytdIncome) * 100).toFixed(0) + '% margin' }),
      h(Stat, { label: 'Outstanding', icon: 'invoice', iconColor: 'var(--warn)', value: F.fmtNum(Math.round(outstanding)),
        foot: overdue.length ? overdue.length + ' overdue' : 'all current' })),

    h('div', { className: 'split wide', style: { marginBottom: 16 } },
      h(Card, { title: 'Cash flow', sub: b.name,
        right: h('div', { className: 'row', style: { gap: 14 } }, h(Legend, { color: 'var(--brand)', label: 'Income' }), h(Legend, { color: 'var(--neg)', label: 'Expenses', dash: true })) },
        h(CashflowChart, { series, fmt: F })),
      h(Card, { title: 'Expense categories', sub: F.fmtAUD(totalExp, { dp: 0 }) + ' this period' },
        h(Donut, { data: cats.slice(0, 6), fmt: F, centerValue: F.fmtK(totalExp), centerLabel: 'spent' }))),

    h('div', { className: 'grid', style: { gridTemplateColumns: '1.3fr 1fr', gap: 16 } },
      h(Card, { title: 'Recent invoices', bodyClass: 'tight',
        right: h(Button, { size: 'sm', variant: 'ghost', icon: 'arrowRight', onClick: () => go('invoices') }, 'All') },
        h('div', { className: 'tbl-wrap' }, h('table', { className: 'tbl dense' },
          h('thead', null, h('tr', null, h('th', null, 'Invoice'), h('th', null, 'Customer'), h('th', { className: 'r' }, 'Total'), h('th', null, 'Status'))),
          h('tbody', null, recentInv.map(i => { const c = DB.cust(i.cust);
            return h('tr', { key: i.id, className: 'clickable', onClick: () => openInvoice(i) },
              h('td', { className: 'id' }, i.id),
              h('td', { className: 'strong' }, c ? c.name : '—'),
              h('td', { className: 'amt' }, money(i.total, 2)),
              h('td', null, h(Badge, { status: i.status }))); })))),
        ),
      h('div', { className: 'col', style: { gap: 16 } },
        h(Card, { title: 'Upcoming', bodyClass: 'tight', right: h(Button, { size: 'sm', variant: 'ghost', onClick: () => go('appointments') }, 'Calendar') },
          upcoming.length ? upcoming.map(a => { const c = DB.cust(a.cust);
            return h('div', { key: a.id, className: 'row', style: { gap: 11, padding: '10px 14px', borderBottom: '1px solid var(--line-2)' } },
              h('div', { style: { textAlign: 'center', flex: 'none', width: 38 } },
                h('div', { className: 'mono', style: { fontSize: 15, fontWeight: 600, color: 'var(--ink)', lineHeight: 1 } }, new Date(a.start).getDate()),
                h('div', { className: 'muted upper', style: { fontSize: 9 } }, F.MONTHS[new Date(a.start).getMonth()])),
              h('div', { style: { flex: 1, minWidth: 0 } },
                h('div', { style: { fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, a.title),
                h('div', { className: 'muted', style: { fontSize: 11 } }, F.fmtTime(a.start) + (c ? ' · ' + c.name : ''))),
              h('span', { className: 'badge ' + (a.kind === 'job' ? 'sent' : 'soft'), style: { fontSize: 10 } }, a.kind));
          }) : h('div', { className: 'empty', style: { padding: 24 } }, 'No upcoming bookings')),
        h(Card, { title: 'Open tasks', bodyClass: 'tight', right: h('span', { className: 'badge soft' }, openTasks.length) },
          openTasks.slice(0, 5).map(t =>
            h('div', { key: t.id, className: 'row', style: { gap: 10, padding: '9px 14px', borderBottom: '1px solid var(--line-2)' } },
              h('span', { style: { width: 7, height: 7, borderRadius: '50%', background: window.PRIORITY_COLOR[t.prio] || 'var(--line-strong)', flex: 'none' } }),
              h('span', { style: { flex: 1, fontSize: 12.5, color: 'var(--ink-2)' } }, t.title),
              h('span', { className: 'mono muted', style: { fontSize: 11 } }, F.relDays(t.due))))))));
}

Object.assign(window, { GlobalDashboard, BusinessDashboard, Legend });
