/* ============================================================
   LEDGER — Books views: Expenses, Income, Bookkeeping, Reports
   ============================================================ */
const { Icon: BIcon, BizChip: BBizChip, Button: BButton, Badge: BBadge, Card: BCard,
        Seg: BSeg, Stat: BStat, Donut: BDonut, CashflowChart: BCashflow, NetBars: BNetBars,
        HBars: BHBars, PageHead: BPageHead, h: bh } = window;
const BF = window.DB.fmt;
const bMoney = (n, dp) => BF.fmtAUD(n, { dp });

function auFYLabel() {
  const m = new Date().getMonth();
  const y = m >= 6 ? new Date().getFullYear() : new Date().getFullYear() - 1;
  return `FY${String(y).slice(2)}–${String(y + 1).slice(2)}`;
}
function auFYRange() {
  const m = new Date().getMonth();
  const y = m >= 6 ? new Date().getFullYear() : new Date().getFullYear() - 1;
  return `1 Jul ${y} – 30 Jun ${y + 1}`;
}
function auBASQuarter() {
  const now = new Date(); const m = now.getMonth(); const yr = now.getFullYear();
  if (m >= 3 && m <= 5) return { label: `Apr to Jun ${yr}`, due: `28 Jul ${yr}` };
  if (m >= 6 && m <= 8) return { label: `Jul to Sep ${yr}`, due: `28 Oct ${yr}` };
  if (m >= 9 && m <= 11) return { label: `Oct to Dec ${yr}`, due: `28 Feb ${yr + 1}` };
  return { label: `Jan to Mar ${yr}`, due: `28 Apr ${yr}` };
}

/* ============================================================
   EXPENSES
   ============================================================ */
function ExpensesView({ bizId, store }) {
  const DB = window.DB;
  const [cat, setCat] = window.useState('all');
  let exp = DB.byBiz(DB.expenses, bizId).sort((a, b) => new Date(b.date) - new Date(a.date));
  const cats = [...new Set(exp.map(e => e.cat))];
  const rows = cat === 'all' ? exp : exp.filter(e => e.cat === cat);
  const total = exp.reduce((s, e) => s + e.amount, 0);
  const gst = exp.reduce((s, e) => s + e.gst, 0);
  const unrec = exp.filter(e => e.status === 'unreconciled').length;
  const breakdown = DB.catBreakdown(bizId === 'all' ? 'all' : bizId);
  // for "all", catBreakdown only handles single biz; build manually
  const catData = bizId === 'all'
    ? Object.entries(exp.reduce((m, e) => ((m[e.cat] = (m[e.cat] || 0) + e.amount), m), {})).map(([cat, amount]) => ({ cat, amount })).sort((a, b) => b.amount - a.amount)
    : breakdown;

  return bh('div', { className: 'content-inner fade-up' },
    bh(BPageHead, { bizId, title: 'Expenses', sub: 'Bills, purchases and reconciliation',
      actions: [bh(BButton, { key: 'i', variant: 'ghost', icon: 'download' }, 'Import bank feed'), bh(BButton, { key: 'n', variant: 'primary', icon: 'plus' }, 'Add expense')] }),
    bh('div', { className: 'grid g-4', style: { marginBottom: 16 } },
      bh(BStat, { label: 'Total spend', icon: 'trendDown', iconColor: 'var(--neg)', value: BF.fmtNum(Math.round(total)) }),
      bh(BStat, { label: 'GST credits', icon: 'receipt', iconColor: 'var(--brand)', value: BF.fmtNum(Math.round(gst)) }),
      bh(BStat, { label: 'Unreconciled', icon: 'alert', iconColor: 'var(--warn)', value: unrec, cur: '', foot: 'need matching' }),
      bh(BStat, { label: 'Categories', icon: 'pie', iconColor: 'var(--info)', value: cats.length, cur: '' })),
    bh('div', { className: 'split wide', style: { marginBottom: 16 } },
      bh(BCard, { bodyClass: 'tight' },
        bh('div', { className: 'tbl-toolbar' },
          bh('div', { className: 'field', style: { padding: '5px 9px' } }, bh(BIcon, { name: 'filter', size: 13 }),
            bh('select', { value: cat, onChange: e => setCat(e.target.value), style: { fontSize: 12 } },
              bh('option', { value: 'all' }, 'All categories'), cats.map(c => bh('option', { key: c, value: c }, c)))),
          bh('div', { className: 'spacer' }),
          bh('span', { className: 'muted', style: { fontSize: 11.5 } }, rows.length + ' transactions')),
        bh('div', { className: 'tbl-wrap' }, bh('table', { className: 'tbl' },
          bh('thead', null, bh('tr', null,
            bh('th', null, 'Date'), bizId === 'all' && bh('th', null, 'Biz'),
            bh('th', null, 'Vendor'), bh('th', null, 'Category'), bh('th', null, 'Method'),
            bh('th', { className: 'r' }, 'GST'), bh('th', { className: 'r' }, 'Amount'), bh('th', null, ''))),
          bh('tbody', null, rows.map(e => bh('tr', { key: e.id, className: 'clickable' },
            bh('td', { className: 'muted', style: { whiteSpace: 'nowrap' } }, BF.fmtDateShort(e.date)),
            bizId === 'all' && bh('td', null, bh(BBizChip, { biz: e.biz, size: 'sm' })),
            bh('td', { className: 'strong' }, e.vendor),
            bh('td', null, bh('span', { className: 'tag' }, e.cat)),
            bh('td', { className: 'muted', style: { textTransform: 'capitalize', fontSize: 11.5 } }, e.method),
            bh('td', { className: 'amt muted' }, e.gst ? bMoney(e.gst, 2) : '—'),
            bh('td', { className: 'amt' }, bMoney(e.amount, 2)),
            bh('td', null, e.status === 'reconciled'
              ? bh('span', { className: 'row', style: { gap: 4, color: 'var(--pos)', fontSize: 11 } }, bh(BIcon, { name: 'check', size: 13 }))
              : bh('span', { className: 'badge pending', style: { fontSize: 10 } }, 'match')))))))),
      bh(BCard, { title: 'By category' }, bh(BDonut, { data: catData.slice(0, 7), fmt: BF, centerValue: BF.fmtK(total), centerLabel: 'spend' }))));
}

/* ============================================================
   INCOME
   ============================================================ */
function IncomeView({ bizId, store }) {
  const DB = window.DB;
  // income = paid invoices + payments; show as ledger of income transactions
  let pays = DB.byBiz(store.payments, bizId).sort((a, b) => new Date(b.date) - new Date(a.date));
  const series = DB.series[bizId === 'all' ? 'all' : bizId] || [];
  const biz = bizId === 'all' ? null : DB.biz(bizId);
  const total = biz ? biz.ytdIncome : DB.businesses.reduce((s, b) => s + (b.ytdIncome || 0), 0);
  // income by customer
  const byCust = {};
  pays.forEach(p => { const c = DB.cust(p.cust); if (c) byCust[c.name] = (byCust[c.name] || 0) + p.amount; });
  const custRows = Object.entries(byCust).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  const maxC = Math.max(...custRows.map(r => r.value), 1);

  return bh('div', { className: 'content-inner fade-up' },
    bh(BPageHead, { bizId, title: 'Income', sub: 'Revenue recognised across the financial year' }),
    bh('div', { className: 'grid g-4', style: { marginBottom: 16 } },
      bh(BStat, { label: 'Income · FY', icon: 'trendUp', iconColor: 'var(--brand)', value: BF.fmtNum(Math.round(total)) }),
      bh(BStat, { label: 'This month', icon: 'dollar', iconColor: 'var(--info)', value: BF.fmtNum(series.length ? series[series.length - 1].income : 0) }),
      bh(BStat, { label: 'Avg / month', icon: 'book', iconColor: 'var(--purple)', value: BF.fmtNum(series.length ? Math.round(series.reduce((s, x) => s + x.income, 0) / series.length) : 0) }),
      bh(BStat, { label: 'Received (cleared)', icon: 'card', iconColor: 'var(--brand)', value: BF.fmtNum(Math.round(pays.reduce((s, p) => s + p.amount, 0))) })),
    series.length ? bh(BCard, { title: 'Income trend', sub: auFYLabel(), className: 'fade-up', style: { marginBottom: 16 } },
      bh(BCashflow, { series, fmt: BF })) : null,
    bh('div', { className: 'split wide' },
      bh(BCard, { title: 'Income transactions', bodyClass: 'tight' },
        bh('div', { className: 'tbl-wrap' }, bh('table', { className: 'tbl' },
          bh('thead', null, bh('tr', null, bh('th', null, 'Date'), bizId === 'all' && bh('th', null, 'Biz'), bh('th', null, 'Source'), bh('th', null, 'Invoice'), bh('th', { className: 'r' }, 'Amount'))),
          bh('tbody', null, pays.slice(0, 12).map(p => { const c = DB.cust(p.cust);
            return bh('tr', { key: p.id },
              bh('td', { className: 'muted', style: { whiteSpace: 'nowrap' } }, BF.fmtDateShort(p.date)),
              bizId === 'all' && bh('td', null, bh(BBizChip, { biz: p.biz, size: 'sm' })),
              bh('td', { className: 'strong' }, c ? c.name : '—'),
              bh('td', { className: 'id' }, p.invoice),
              bh('td', { className: 'amt', style: { color: 'var(--pos)', fontWeight: 600 } }, bMoney(p.amount, 2))); })))),
        ),
      bh(BCard, { title: 'Top customers', sub: 'by revenue' },
        bh(BHBars, { rows: custRows.map(r => ({ label: r.name, value: r.value, color: 'var(--brand)', chip: bh('span', { style: { width: 6 } }) })), fmt: BF, max: maxC }))));
}

/* ============================================================
   BOOKKEEPING  (chart of accounts / ledger / reconciliation)
   ============================================================ */
function BookkeepingView({ bizId, store }) {
  const DB = window.DB;
  const biz = bizId === 'all' ? null : DB.biz(bizId);
  const income = biz ? biz.ytdIncome : DB.businesses.reduce((s, b) => s + (b.ytdIncome || 0), 0);
  const expense = biz ? biz.ytdExpense : DB.businesses.reduce((s, b) => s + (b.ytdExpense || 0), 0);
  const cash = biz ? biz.cash : DB.businesses.reduce((s, b) => s + (b.cash || 0), 0);
  const exp = DB.byBiz(DB.expenses, bizId);
  const unrec = exp.filter(e => e.status === 'unreconciled');

  // chart of accounts roll-up derived from actual expense records
  const CAT_MAP = {
    'Cost of goods sold': { code: '310', name: 'Cost of goods sold', type: 'Direct cost' },
    'COGS': { code: '310', name: 'Cost of goods sold', type: 'Direct cost' },
    'Wages': { code: '400', name: 'Wages & salaries', type: 'Operating' },
    'Salaries': { code: '400', name: 'Wages & salaries', type: 'Operating' },
    'Materials': { code: '420', name: 'Materials & supplies', type: 'Operating' },
    'Supplies': { code: '420', name: 'Materials & supplies', type: 'Operating' },
    'Rent': { code: '445', name: 'Rent & outgoings', type: 'Operating' },
    'Software': { code: '485', name: 'Software & subscriptions', type: 'Operating' },
    'Subscriptions': { code: '485', name: 'Software & subscriptions', type: 'Operating' },
  };
  const expTotals = {};
  DB.byBiz(DB.expenses, bizId).forEach(e => {
    const acct = CAT_MAP[e.cat] || { code: '490', name: e.cat || 'Other expenses', type: 'Operating' };
    const key = acct.code + '|' + acct.name;
    if (!expTotals[key]) expTotals[key] = { ...acct, bal: 0 };
    expTotals[key].bal += e.amount;
  });
  const expenseAccounts = Object.values(expTotals)
    .map(a => ({ ...a, bal: Math.round(a.bal), dir: 'dr' }))
    .sort((a, b) => a.code.localeCompare(b.code));
  const bizGstRate = biz?.gstRate ?? 0.1;
  const gstDivisor = 1 + bizGstRate;
  const accounts = [
    { code: '200', name: 'Sales income', type: 'Revenue', bal: income, dir: 'cr' },
    ...expenseAccounts,
    { code: '610', name: 'Business bank account', type: 'Asset', bal: cash, dir: 'dr' },
    { code: '820', name: 'GST owing', type: 'Liability', bal: Math.round(income / gstDivisor - expense / gstDivisor), dir: 'cr' },
  ];

  return bh('div', { className: 'content-inner fade-up' },
    bh(BPageHead, { bizId, title: 'Bookkeeping', sub: 'General ledger, chart of accounts & reconciliation',
      actions: [bh(BButton, { key: 'r', variant: 'primary', icon: 'refresh' }, 'Reconcile')] }),
    bh('div', { className: 'grid g-4', style: { marginBottom: 16 } },
      bh(BStat, { label: 'Total assets', icon: 'bank', iconColor: 'var(--brand)', value: BF.fmtNum(cash) }),
      bh(BStat, { label: 'Revenue YTD', icon: 'trendUp', iconColor: 'var(--info)', value: BF.fmtNum(income) }),
      bh(BStat, { label: 'Expenses YTD', icon: 'trendDown', iconColor: 'var(--neg)', value: BF.fmtNum(expense) }),
      bh(BStat, { label: 'To reconcile', icon: 'alert', iconColor: 'var(--warn)', value: unrec.length, cur: '', foot: 'transactions' })),
    bh('div', { className: 'split wide' },
      bh(BCard, { title: 'Chart of accounts', sub: 'Trial balance roll-up', bodyClass: 'tight' },
        bh('div', { className: 'tbl-wrap' }, bh('table', { className: 'tbl' },
          bh('thead', null, bh('tr', null, bh('th', null, 'Code'), bh('th', null, 'Account'), bh('th', null, 'Type'), bh('th', { className: 'r' }, 'Balance'))),
          bh('tbody', null, accounts.map(a => bh('tr', { key: a.code },
            bh('td', { className: 'id' }, a.code),
            bh('td', { className: 'strong' }, a.name),
            bh('td', null, bh('span', { className: 'tag' }, a.type)),
            bh('td', { className: 'amt', style: { color: a.dir === 'cr' ? 'var(--pos)' : 'var(--ink)' } }, bMoney(a.bal, 0))))))),
        ),
      bh(BCard, { title: 'Reconciliation', sub: unrec.length + ' to match' },
        unrec.length ? bh('div', { className: 'col', style: { gap: 8 } },
          unrec.slice(0, 5).map(e => bh('div', { key: e.id, className: 'card flat', style: { padding: '9px 11px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', gap: 10 } },
            bizId === 'all' && bh(BBizChip, { biz: e.biz, size: 'sm' }),
            bh('div', { style: { flex: 1, minWidth: 0 } },
              bh('div', { style: { fontSize: 12, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, e.vendor),
              bh('div', { className: 'muted', style: { fontSize: 10.5 } }, BF.fmtDateShort(e.date) + ' · ' + e.cat)),
            bh('span', { className: 'mono', style: { fontSize: 12, fontWeight: 600 } }, bMoney(e.amount, 2)),
            bh('button', { className: 'btn sm primary', onClick: () => window.toast('Matched ' + e.vendor, 'check') }, 'Match')))
        ) : bh('div', { className: 'empty', style: { padding: 30 } }, bh(BIcon, { name: 'check', size: 30 }), bh('h4', null, 'All reconciled')))));
}

/* ============================================================
   REPORTS
   ============================================================ */
function ReportsView({ bizId, store }) {
  const DB = window.DB;
  const [report, setReport] = window.useState('pnl');
  const biz = bizId === 'all' ? null : DB.biz(bizId);
  const income = biz ? biz.ytdIncome : DB.businesses.reduce((s, b) => s + (b.ytdIncome || 0), 0);
  const expense = biz ? biz.ytdExpense : DB.businesses.reduce((s, b) => s + (b.ytdExpense || 0), 0);
  const series = DB.series[bizId === 'all' ? 'all' : bizId] || [];

  const reports = [
    { id: 'pnl', name: 'Profit & Loss', icon: 'trendUp' },
    { id: 'bas', name: 'GST / BAS summary', icon: 'receipt' },
    { id: 'aged', name: 'Aged receivables', icon: 'clock' },
    { id: 'cash', name: 'Cash flow', icon: 'dollar' },
  ];

  return bh('div', { className: 'content-inner fade-up' },
    bh(BPageHead, { bizId, title: 'Reports', sub: 'Financial year ' + auFYLabel(),
      actions: [bh(BButton, { key: 'p', variant: 'ghost', icon: 'download' }, 'Export PDF'), bh(BButton, { key: 'x', variant: 'ghost', icon: 'download' }, 'CSV')] }),
    bh('div', { className: 'grid', style: { gridTemplateColumns: '210px 1fr', gap: 16, alignItems: 'start' } },
      bh('div', { className: 'card', style: { padding: 7 } },
        reports.map(r => bh('div', { key: r.id, className: 'nav-item', style: {
          color: report === r.id ? 'var(--ink)' : 'var(--muted)', background: report === r.id ? 'var(--surface-3)' : 'transparent', marginBottom: 2 },
          onClick: () => setReport(r.id) },
          bh(BIcon, { name: r.icon, size: 16, style: { color: report === r.id ? 'var(--brand)' : 'var(--faint)' } }), r.name))),
      report === 'pnl' ? bh(PnL, { income, expense, series }) :
      report === 'bas' ? bh(BAS, { income, expense }) :
      report === 'aged' ? bh(AgedReceivables, { bizId, store }) :
      bh(CashReport, { series })));
}

function reportRow(label, val, opts = {}) {
  return bh('div', { className: 'row between', style: {
    padding: opts.total ? '11px 0' : '6px 0',
    borderTop: opts.total ? '1.5px solid var(--ink)' : (opts.sub ? '1px solid var(--line-2)' : 'none'),
    marginTop: opts.gap ? 8 : 0 } },
    bh('span', { style: { fontSize: opts.total ? 13.5 : 12.5, fontWeight: opts.total || opts.bold ? 600 : 400, color: opts.indent ? 'var(--muted)' : 'var(--ink-2)', paddingLeft: opts.indent ? 16 : 0 } }, label),
    bh('span', { className: 'mono', style: { fontSize: opts.total ? 14.5 : 13, fontWeight: opts.total || opts.bold ? 700 : 500, color: opts.color || 'var(--ink)' } }, val));
}

function PnL({ income, expense, series }) {
  const cogs = Math.round(expense * 0.34), wages = Math.round(expense * 0.31), other = expense - cogs - wages;
  const gross = income - cogs, net = income - expense;
  return bh(BCard, { title: 'Profit & Loss', sub: auFYRange() },
    bh('div', { style: { maxWidth: 560 } },
      bh('div', { className: 'section-title' }, 'Income'),
      reportRow('Sales income', bMoney(income, 0), { indent: true }),
      reportRow('Total income', bMoney(income, 0), { sub: true, bold: true }),
      bh('div', { className: 'section-title', style: { marginTop: 18 } }, 'Cost of sales'),
      reportRow('Cost of goods sold', bMoney(cogs, 0), { indent: true }),
      reportRow('Gross profit', bMoney(gross, 0), { sub: true, bold: true, color: 'var(--pos)' }),
      bh('div', { className: 'section-title', style: { marginTop: 18 } }, 'Operating expenses'),
      reportRow('Wages & salaries', bMoney(wages, 0), { indent: true }),
      reportRow('Other operating costs', bMoney(other, 0), { indent: true }),
      reportRow('Total expenses', bMoney(expense, 0), { sub: true, bold: true }),
      reportRow('Net profit', bMoney(net, 0), { total: true, color: 'var(--pos)' }),
      bh('div', { style: { marginTop: 20 } }, bh(BNetBars, { series, fmt: BF }))));
}

function BAS({ income, expense }) {
  const g1 = income, gstCollected = Math.round(income / 11), gstPaid = Math.round(expense / 11), net = gstCollected - gstPaid;
  const q = auBASQuarter();
  return bh(BCard, { title: 'GST / BAS summary', sub: 'Quarter — ' + q.label },
    bh('div', { style: { maxWidth: 560 } },
      reportRow('G1 — Total sales (incl. GST)', bMoney(g1, 0), { bold: true }),
      reportRow('1A — GST on sales (collected)', bMoney(gstCollected, 0), { sub: true }),
      reportRow('1B — GST on purchases (credits)', '−' + bMoney(gstPaid, 0), { sub: true, color: 'var(--pos)' }),
      reportRow('Net GST payable to ATO', bMoney(net, 0), { total: true, color: 'var(--neg)' }),
      bh('div', { className: 'card flat', style: { marginTop: 18, padding: 12, background: 'var(--info-tint)', border: '1px solid rgba(47,95,192,0.2)', display: 'flex', gap: 9 } },
        bh(BIcon, { name: 'alert', size: 16, style: { color: 'var(--info)', flex: 'none', marginTop: 1 } }),
        bh('div', { style: { fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5 } }, 'BAS is due ' + q.due + '. This summary is an estimate — review unreconciled transactions before lodging.'))));
}

function AgedReceivables({ bizId, store }) {
  const DB = window.DB;
  const open = DB.byBiz(store.invoices, bizId).filter(i => ['sent', 'overdue', 'partial'].includes(i.status));
  const buckets = { current: 0, d30: 0, d60: 0, d90: 0 };
  open.forEach(i => { const d = -BF.daysFromToday(i.due); const bal = i.total - i.amountPaid;
    if (d <= 0) buckets.current += bal; else if (d <= 30) buckets.d30 += bal; else if (d <= 60) buckets.d60 += bal; else buckets.d90 += bal; });
  return bh(BCard, { title: 'Aged receivables', sub: 'Outstanding by age' },
    bh('div', { className: 'grid g-4', style: { marginBottom: 16 } },
      agedCard('Current', buckets.current, 'var(--pos)'), agedCard('1–30 days', buckets.d30, 'var(--warn)'),
      agedCard('31–60 days', buckets.d60, 'var(--neg)'), agedCard('60+ days', buckets.d90, 'var(--neg)')),
    bh('div', { className: 'tbl-wrap' }, bh('table', { className: 'tbl' },
      bh('thead', null, bh('tr', null, bh('th', null, 'Invoice'), bh('th', null, 'Customer'), bh('th', null, 'Due'), bh('th', { className: 'r' }, 'Balance'), bh('th', null, 'Age'))),
      bh('tbody', null, open.sort((a, b) => new Date(a.due) - new Date(b.due)).map(i => { const c = DB.cust(i.cust); const d = -BF.daysFromToday(i.due);
        return bh('tr', { key: i.id },
          bh('td', { className: 'id' }, i.id), bh('td', { className: 'strong' }, c ? c.name : '—'),
          bh('td', { className: 'muted' }, BF.fmtDateShort(i.due)),
          bh('td', { className: 'amt' }, bMoney(i.total - i.amountPaid, 2)),
          bh('td', null, d > 0 ? bh('span', { className: 'badge overdue', style: { fontSize: 10 } }, d + 'd') : bh('span', { className: 'badge done', style: { fontSize: 10 } }, 'current'))); })))));
}
function agedCard(label, val, color) {
  return bh('div', { className: 'card flat', style: { padding: '12px 13px', borderTop: '2px solid ' + color } },
    bh('div', { className: 'muted', style: { fontSize: 11 } }, label),
    bh('div', { className: 'mono', style: { fontSize: 18, fontWeight: 600, color: 'var(--ink)', marginTop: 4 } }, bMoney(val, 0)));
}

function CashReport({ series }) {
  return bh(BCard, { title: 'Cash flow statement', sub: 'Monthly movement' },
    bh(BCashflow, { series, fmt: BF }),
    bh('div', { className: 'tbl-wrap', style: { marginTop: 16 } }, bh('table', { className: 'tbl dense' },
      bh('thead', null, bh('tr', null, bh('th', null, 'Month'), bh('th', { className: 'r' }, 'Income'), bh('th', { className: 'r' }, 'Expenses'), bh('th', { className: 'r' }, 'Net'))),
      bh('tbody', null, series.map((s, i) => bh('tr', { key: i },
        bh('td', { className: 'strong' }, s.m),
        bh('td', { className: 'amt' }, bMoney(s.income, 0)),
        bh('td', { className: 'amt neg' }, bMoney(s.expense, 0)),
        bh('td', { className: 'amt', style: { color: s.net >= 0 ? 'var(--pos)' : 'var(--neg)', fontWeight: 600 } }, bMoney(s.net, 0))))))));
}

Object.assign(window, { ExpensesView, IncomeView, BookkeepingView, ReportsView });
