/* ============================================================
   LEDGER — App shell: sidebar, business switcher, topbar, router
   ============================================================ */
const { Icon: AIcon, BizChip: ABizChip, Avatar: AAvatar, Button: AButton, Badge: ABadge,
        ToastHost, toast: aToast, h: ah } = window;
const ADB = window.DB;
const AF = ADB.fmt;

/* nav definition */
const NAV = [
  { group: 'Overview', items: [['dashboard', 'Dashboard', 'grid']] },
  { group: 'Sales', items: [
    ['customers', 'Customers', 'users'],
    ['invoices', 'Invoices', 'invoice'],
    ['payments', 'Payments', 'card'],
    ['stripe', 'Payment links', 'link'],
  ] },
  { group: 'Operations', items: [
    ['appointments', 'Appointments', 'calendar'],
    ['tasks', 'Tasks', 'checkSquare'],
    ['time', 'Time tracking', 'clock'],
    ['email', 'Email', 'mail'],
  ] },
  { group: 'Books', items: [
    ['income', 'Income', 'trendUp'],
    ['expenses', 'Expenses', 'receipt'],
    ['bookkeeping', 'Bookkeeping', 'book'],
    ['reports', 'Reports', 'pie'],
  ] },
];

const TITLES = {
  dashboard: 'Dashboard', customers: 'Customers', invoices: 'Invoices', payments: 'Payments',
  stripe: 'Payment links', appointments: 'Appointments', tasks: 'Tasks & reminders', time: 'Time tracking',
  email: 'Email', income: 'Income', expenses: 'Expenses', bookkeeping: 'Bookkeeping', reports: 'Reports', settings: 'Settings',
};

function nextInvoiceId(bizId, invoices) {
  const bizObj = ADB.biz(bizId);
  const prefix = bizObj?.invoicePrefix || 'INV-';
  const nums = invoices.filter(i => i.biz === bizId).map(i => parseInt(i.id.replace(/\D/g, ''), 10) || 0);
  const n = (Math.max(0, ...nums) + 1);
  return prefix + n;
}

function App() {
  const [bizId, setBizId] = window.useState('all');
  const [route, setRoute] = window.useState('dashboard');
  const [menuOpen, setMenuOpen] = window.useState(false);
  const [openInv, setOpenInv] = window.useState(null);

  // mutable store with database persistence
  const [invoices, setInvoices] = window.useState(() => ADB.invoices.map(i => ({ ...i })));
  const [payments, setPayments] = window.useState(() => ADB.payments.map(p => ({ ...p })));

  const store = {
    invoices, payments,
    createLink: async (id) => {
      const updated = invoices.map(i => i.id === id
        ? { ...i, stripeLink: 'https://buy.stripe.com/plink_' + Math.random().toString(36).slice(2, 12), status: i.status === 'draft' ? 'sent' : i.status }
        : i);
      setInvoices(updated);
      await ADB.db.update('invoices', id, updated.find(i => i.id === id));
    },
    markPaid: async (id) => {
      const updated = invoices.map(i => i.id === id ? { ...i, status: 'paid', amountPaid: i.total, paid: AF.iso(ADB.TODAY) } : i);
      setInvoices(updated);
      const i = updated.find(x => x.id === id);
      await ADB.db.update('invoices', id, i);
      if (i) {
        const bizObj = ADB.biz(i.biz);
        const feeRate = bizObj?.stripeFeeRate ?? 0.0175;
        const feeFlat = bizObj?.stripeFeeFlat ?? 0.30;
        const payment = { id: 'PAY-' + (5200 + payments.length), biz: i.biz, invoice: i.id, cust: i.cust, date: AF.iso(ADB.TODAY), amount: i.total, method: 'stripe', fee: +(i.total * feeRate + feeFlat).toFixed(2), status: 'settled' };
        setPayments(p => [payment, ...p]);
        await ADB.db.add('payments', payment);
      }
    },
    addInvoice: async (biz, cust, items) => {
      const its = items.filter(x => x.desc).map(x => ({ desc: x.desc, qty: +x.qty || 0, unit: +x.unit || 0, amount: +((+x.qty || 0) * (+x.unit || 0)).toFixed(2) }));
      const subtotal = +its.reduce((s, x) => s + x.amount, 0).toFixed(2);
      const bizObj = ADB.biz(biz);
      const gstRate = bizObj?.gstRate ?? 0.1;
      const paymentDays = bizObj?.paymentTermsDays ?? 14;
      const gst = +(subtotal * gstRate).toFixed(2);
      const id = nextInvoiceId(biz, invoices);
      const nv = { id, biz, cust, issued: AF.iso(ADB.TODAY), due: AF.iso(AF.addDays(ADB.TODAY, paymentDays)), status: 'sent', items: its, subtotal, gst, total: +(subtotal + gst).toFixed(2), amountPaid: 0 };
      setInvoices(inv => [nv, ...inv]);
      await ADB.db.add('invoices', nv);
    },
  };

  const go = (r, biz) => { if (biz) setBizId(biz); setRoute(r === 'biz-dash' ? 'dashboard' : r); window.scrollTo(0, 0); };

  // nav badges
  const fInv = ADB.byBiz(invoices, bizId);
  const badges = {
    invoices: fInv.filter(i => i.status === 'overdue').length || null,
    tasks: ADB.byBiz(ADB.tasks, bizId).filter(t => !t.done).length || null,
    email: ADB.byBiz(ADB.emails, bizId).filter(e => e.unread).length || null,
  };

  const curBiz = bizId === 'all' ? null : ADB.biz(bizId);

  // render the active view
  const viewProps = { bizId, store, go, openInvoice: (i) => { go('invoices'); setOpenInv(i.id); } };
  let view;
  switch (route) {
    case 'dashboard': view = bizId === 'all' ? ah(window.GlobalDashboard, viewProps) : ah(window.BusinessDashboard, viewProps); break;
    case 'customers': view = ah(window.CustomersView, { bizId, store }); break;
    case 'invoices': view = ah(window.InvoicesView, { bizId, store, openInv, setOpenInv }); break;
    case 'payments': view = ah(window.PaymentsView, { bizId, store }); break;
    case 'stripe': view = ah(window.StripeLinksView, { bizId, store, setOpenInv: (id) => { go('invoices'); setOpenInv(id); } }); break;
    case 'appointments': view = ah(window.AppointmentsView, { bizId, store }); break;
    case 'tasks': view = ah(window.TasksView, { bizId, store }); break;
    case 'time': view = ah(window.TimeView, { bizId, store }); break;
    case 'email': view = ah(window.EmailView, { bizId, store }); break;
    case 'income': view = ah(window.IncomeView, { bizId, store }); break;
    case 'expenses': view = ah(window.ExpensesView, { bizId, store }); break;
    case 'bookkeeping': view = ah(window.BookkeepingView, { bizId, store }); break;
    case 'reports': view = ah(window.ReportsView, { bizId, store }); break;
    case 'settings': view = ah(window.SettingsView, { bizId, store }); break;
    default: view = ah('div', null, 'Not found');
  }

  return ah('div', { className: 'app' },
    // ===== SIDEBAR =====
    ah('div', { className: 'side' },
      ah('div', { className: 'side-brand' },
        ah('div', { className: 'brand-mark' }, ah(AIcon, { name: 'book', size: 15 })),
        ah('div', null,
          ah('div', { className: 'brand-name' }, 'Ledger', ah('b', null, '.')),
          ah('div', { className: 'brand-sub' }, 'Bookkeeping'))),

      // business switcher
      ah('div', { className: 'bizswitch' },
        ah('button', { className: 'bizswitch-btn', onClick: () => setMenuOpen(o => !o) },
          ah(ABizChip, { biz: curBiz }),
          ah('div', { className: 'bizswitch-meta' },
            ah('div', { className: 'bizswitch-name' }, curBiz ? curBiz.name : 'All businesses'),
            ah('div', { className: 'bizswitch-type' }, curBiz ? curBiz.type : ADB.businesses.length + ' businesses')),
          ah(AIcon, { name: 'chevDown', size: 15, className: 'bizswitch-caret' })),
        menuOpen && ah('div', null,
          ah('div', { style: { position: 'fixed', inset: 0, zIndex: 55 }, onClick: () => setMenuOpen(false) }),
          ah('div', { className: 'bizmenu' },
            ah('div', { className: 'bizmenu-label' }, 'Switch context'),
            ah('div', { className: 'bizmenu-item' + (bizId === 'all' ? ' active' : ''), onClick: () => { setBizId('all'); setMenuOpen(false); } },
              ah(ABizChip, { biz: null, size: 'sm' }),
              ah('span', { className: 'bizmenu-item-name' }, 'All businesses'),
              ah('span', { className: 'bizmenu-item-amt' }, ADB.businesses.length)),
            ah('div', { className: 'bizmenu-sep' }),
            ADB.businesses.map(b => {
              const out = invoices.filter(i => i.biz === b.id && ['sent', 'overdue', 'partial'].includes(i.status)).reduce((s, i) => s + (i.total - i.amountPaid), 0);
              return ah('div', { key: b.id, className: 'bizmenu-item' + (bizId === b.id ? ' active' : ''), onClick: () => { setBizId(b.id); setMenuOpen(false); } },
                ah(ABizChip, { biz: b, size: 'sm' }),
                ah('span', { className: 'bizmenu-item-name' }, b.name),
                out > 0 && ah('span', { className: 'bizmenu-item-amt' }, AF.fmtK(out)));
            }),
            ah('div', { className: 'bizmenu-sep' }),
            ah('div', { className: 'bizmenu-item', onClick: () => { setMenuOpen(false); go('settings'); } },
              ah('div', { className: 'biz-chip sm', style: { background: '#2a3645', color: 'var(--side-muted)' } }, ah(AIcon, { name: 'plus', size: 12 })),
              ah('span', { className: 'bizmenu-item-name', style: { color: 'var(--side-muted)' } }, 'Add a business'))))),

      // nav
      ah('div', { className: 'nav' },
        NAV.map(grp => ah('div', { key: grp.group },
          ah('div', { className: 'nav-group-label' }, grp.group),
          grp.items.map(([id, label, icon]) =>
            ah('div', { key: id, className: 'nav-item' + (route === id ? ' active' : ''), onClick: () => go(id) },
              ah(AIcon, { name: icon, size: 16 }),
              ah('span', null, label),
              badges[id] && ah('span', { className: 'nav-badge' + (id === 'invoices' || id === 'email' ? ' alert' : '') }, badges[id])))))),

      // footer
      ah('div', { className: 'side-foot' },
        ah(AAvatar, { name: ADB.currentUser ? ADB.currentUser.name : '?', size: 30 }),
        ah('div', { className: 'who' },
          ah('div', { className: 'who-name' }, ADB.currentUser ? ADB.currentUser.name : '—'),
          ah('div', { className: 'who-role' }, ADB.currentUser ? ADB.currentUser.practice : '—')),
        ah('button', { className: 'icon-btn', style: { width: 30, height: 30, background: 'transparent', border: 'none', color: 'var(--side-muted)' }, onClick: () => go('settings') }, ah(AIcon, { name: 'settings', size: 16 })))),

    // ===== MAIN =====
    ah('div', { className: 'main' },
      ah('div', { className: 'topbar' },
        ah('div', { className: 'top-title-wrap' },
          ah('div', { className: 'top-crumb' }, curBiz ? curBiz.name : 'All businesses'),
          ah('div', { className: 'top-title' }, TITLES[route] || '')),
        ah('div', { className: 'top-spacer' }),
        ah('div', { className: 'search' },
          ah(AIcon, { name: 'search', size: 15 }),
          ah('input', { placeholder: 'Search ' + (curBiz ? curBiz.name.split(' ')[0] : 'everything') + '…' }),
          ah('kbd', null, '⌘K')),
        ah('button', { className: 'btn primary', onClick: () => go('invoices') }, ah(AIcon, { name: 'plus', size: 15 }), 'New invoice'),
        ah('button', { className: 'icon-btn' }, ah(AIcon, { name: 'bell', size: 17 }), ah('span', { className: 'dot' }))),
      ah('div', { className: 'content' }, view)),

    ah(ToastHost, null));
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  componentDidCatch(e, info) { console.error('React crash:', e, info.componentStack); }
  render() {
    if (this.state.error) {
      return ah('div', { style: { padding: 40, fontFamily: 'monospace', color: '#c00' } },
        ah('h2', null, 'App crashed — check the browser console (F12) for details'),
        ah('pre', { style: { whiteSpace: 'pre-wrap', fontSize: 13 } }, String(this.state.error)));
    }
    return this.props.children;
  }
}

window.DBReady.then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    ah(ErrorBoundary, null, ah(App, null))
  );
});
