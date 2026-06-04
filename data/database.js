/* ============================================================
   LEDGER — Database initialization and management
   Uses SQLite for persistent data storage
   Auto-creates blank database structures on first run
   ============================================================ */

/* ---- Formatters ---- */
const fmtAUD = (n, opts = {}) => {
  const sign = n < 0 ? '-' : '';
  const v = Math.abs(n);
  const s = v.toLocaleString('en-AU', { minimumFractionDigits: opts.dp ?? 2, maximumFractionDigits: opts.dp ?? 2 });
  return (opts.noSign ? '' : sign) + '$' + s;
};
const fmtK = (n) => {
  const sign = n < 0 ? '-' : '';
  const v = Math.abs(n);
  if (v >= 1000000) return sign + '$' + (v / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (v >= 1000) return sign + '$' + (v / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return sign + '$' + v.toFixed(0);
};
const fmtNum = (n) => n.toLocaleString('en-AU');
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const fmtDate = (d) => { const x = new Date(d); return `${x.getDate()} ${MONTHS[x.getMonth()]} ${x.getFullYear()}`; };
const fmtDateShort = (d) => { const x = new Date(d); return `${x.getDate()} ${MONTHS[x.getMonth()]}`; };
const fmtTime = (d) => { const x = new Date(d); let h = x.getHours(); const m = x.getMinutes(); const ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return `${h}:${String(m).padStart(2,'0')}${ap}`; };
const iso = (d) => new Date(d).toISOString().slice(0, 10);
const addDays = (base, n) => { const d = new Date(base); d.setDate(d.getDate() + n); return d; };
const daysFromToday = (d) => Math.round((new Date(d) - new Date()) / 86400000);
const relDays = (d) => {
  const diff = daysFromToday(d);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff < 0) return `${-diff}d ago`;
  return `in ${diff}d`;
};

/* ---- Database Operations (API-based) ---- */
const Database = {
  API_BASE: '/api/db',

  async request(endpoint, method = 'GET', data = null) {
    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (data) options.body = JSON.stringify(data);
      
      const response = await fetch(this.API_BASE + endpoint, options);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Database API error:', error);
      return null;
    }
  },

  async getAll(collection) {
    const result = await this.request(`/${collection}`);
    return result || [];
  },

  async getById(collection, id) {
    const result = await this.request(`/${collection}/${id}`);
    return result;
  },

  async add(collection, item) {
    return await this.request(`/${collection}`, 'POST', item);
  },

  async update(collection, id, updates) {
    return await this.request(`/${collection}/${id}`, 'PUT', updates);
  },

  async delete(collection, id) {
    return await this.request(`/${collection}/${id}`, 'DELETE');
  },

  async getByBiz(collection, bizId) {
    const items = await this.getAll(collection);
    return bizId === 'all' ? items : items.filter(item => item.biz === bizId);
  }
};

/* ---- Export to window ---- */
window.Database = Database;

const FMT = { fmtAUD, fmtK, fmtNum, fmtDate, fmtDateShort, fmtTime, relDays, daysFromToday, iso, addDays, MONTHS, DOW };

// Set up window.DB synchronously so JSX scripts can reference it immediately
window.DB = {
  TODAY: new Date(),
  businesses: [],
  customers: [],
  invoices: [],
  payments: [],
  expenses: [],
  appointments: [],
  tasks: [],
  timeLogs: [],
  emails: [],
  documents: [],
  users: [],
  team: [],
  integrations: [],
  currentUser: null,
  series: { all: [] },
  catBreakdown: () => [],
  fmt: FMT,
  biz: () => null,
  cust: () => null,
  byBiz: (arr, bizId) => bizId === 'all' ? arr : arr.filter(x => x.biz === bizId),
  db: Database
};

// Build monthly income/expense/net series from invoices + expenses (last 12 months)
function buildSeries(businesses, invoices, expenses) {
  const today = new Date();
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth(), m: MONTHS[d.getMonth()] });
  }

  function seriesFor(bizId) {
    return months.map(({ year, month, m }, idx) => {
      const isFuture = year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth());
      const income = invoices
        .filter(i => {
          if (bizId !== 'all' && i.biz !== bizId) return false;
          if (!i.paid && i.status !== 'paid') return false;
          const d = new Date(i.paid || i.issued);
          return d.getFullYear() === year && d.getMonth() === month;
        })
        .reduce((s, i) => s + (i.total || 0), 0);
      const expense = expenses
        .filter(e => {
          if (bizId !== 'all' && e.biz !== bizId) return false;
          const d = new Date(e.date);
          return d.getFullYear() === year && d.getMonth() === month;
        })
        .reduce((s, e) => s + (e.amount || 0), 0);
      return { m, income, expense, net: income - expense, future: isFuture };
    });
  }

  const result = { all: seriesFor('all') };
  businesses.forEach(b => { result[b.id] = seriesFor(b.id); });
  return result;
}

// Load initial data from API, then update window.DB and signal ready
window.DBReady = (async function loadInitialData() {
  try {
    const [businesses, customers, invoices, payments, expenses, appointments, tasks, timeLogs, emails, documents, users, team, integrations] = await Promise.all([
      Database.getAll('businesses'),
      Database.getAll('customers'),
      Database.getAll('invoices'),
      Database.getAll('payments'),
      Database.getAll('expenses'),
      Database.getAll('appointments'),
      Database.getAll('tasks'),
      Database.getAll('timeLogs'),
      Database.getAll('emails'),
      Database.getAll('documents'),
      Database.getAll('users'),
      Database.getAll('team'),
      Database.getAll('integrations'),
    ]);

    Object.assign(window.DB, {
      TODAY: new Date(),
      businesses,
      customers,
      invoices,
      payments,
      expenses,
      appointments,
      tasks,
      timeLogs,
      emails,
      documents,
      users,
      team,
      integrations,
      currentUser: users[0] || null,
      series: buildSeries(businesses, invoices, expenses),
      catBreakdown: (biz) => {
        const map = {};
        expenses.filter(e => e.biz === biz).forEach(e => { map[e.cat] = (map[e.cat] || 0) + e.amount; });
        return Object.entries(map).map(([cat, amount]) => ({ cat, amount })).sort((a, b) => b.amount - a.amount);
      },
      biz: (id) => businesses.find(b => b.id === id),
      cust: (id) => customers.find(c => c.id === id),
    });
  } catch (error) {
    console.error('Failed to load initial data:', error);
  }
})();
