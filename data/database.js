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

// Load initial data from API
async function loadInitialData() {
  try {
    const [businesses, customers, invoices, payments, expenses, appointments, tasks, timeLogs, emails, documents] = await Promise.all([
      Database.getAll('businesses'),
      Database.getAll('customers'),
      Database.getAll('invoices'),
      Database.getAll('payments'),
      Database.getAll('expenses'),
      Database.getAll('appointments'),
      Database.getAll('tasks'),
      Database.getAll('timeLogs'),
      Database.getAll('emails'),
      Database.getAll('documents')
    ]);

    window.DB = {
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
      series: { all: [] },
      catBreakdown: (biz) => {
        const map = {};
        expenses.filter(e => e.biz === biz).forEach(e => { map[e.cat] = (map[e.cat] || 0) + e.amount; });
        return Object.entries(map).map(([cat, amount]) => ({ cat, amount })).sort((a, b) => b.amount - a.amount);
      },
      fmt: { fmtAUD, fmtK, fmtNum, fmtDate, fmtDateShort, fmtTime, relDays, daysFromToday, iso, addDays, MONTHS, DOW },
      biz: (id) => businesses.find(b => b.id === id),
      cust: (id) => customers.find(c => c.id === id),
      byBiz: (arr, bizId) => bizId === 'all' ? arr : arr.filter(x => x.biz === bizId),
      db: Database
    };
  } catch (error) {
    console.error('Failed to load initial data:', error);
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
      series: { all: [] },
      catBreakdown: () => [],
      fmt: { fmtAUD, fmtK, fmtNum, fmtDate, fmtDateShort, fmtTime, relDays, daysFromToday, iso, addDays, MONTHS, DOW },
      biz: () => null,
      cust: () => null,
      byBiz: (arr, bizId) => bizId === 'all' ? arr : arr.filter(x => x.biz === bizId),
      db: Database
    };
  }
}

loadInitialData();
