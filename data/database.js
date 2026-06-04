/* ============================================================
   LEDGER — Database initialization and management
   Uses localStorage for persistent data storage
   Auto-creates blank database structures on first run
   ============================================================ */

const DB_KEY = 'ledger_admin_dashboard';

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

/* ---- Database Schema ---- */
const createBlankDatabase = () => ({
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
  settings: {
    currency: 'AUD',
    gstRate: 0.10,
    locale: 'en-AU'
  }
});

/* ---- Database Operations ---- */
const Database = {
  // Initialize database - creates blank structure if doesn't exist
  init: () => {
    const existing = localStorage.getItem(DB_KEY);
    if (!existing) {
      const blankDB = createBlankDatabase();
      localStorage.setItem(DB_KEY, JSON.stringify(blankDB));
      return blankDB;
    }
    return JSON.parse(existing);
  },

  // Get entire database
  get: () => {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : Database.init();
  },

  // Save entire database
  save: (data) => {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  },

  // CRUD operations for each collection
  add: (collection, item) => {
    const db = Database.get();
    if (!db[collection]) db[collection] = [];
    db[collection].push(item);
    Database.save(db);
    return item;
  },

  update: (collection, id, updates) => {
    const db = Database.get();
    if (!db[collection]) return null;
    const index = db[collection].findIndex(item => item.id === id);
    if (index === -1) return null;
    db[collection][index] = { ...db[collection][index], ...updates };
    Database.save(db);
    return db[collection][index];
  },

  delete: (collection, id) => {
    const db = Database.get();
    if (!db[collection]) return false;
    const initialLength = db[collection].length;
    db[collection] = db[collection].filter(item => item.id !== id);
    Database.save(db);
    return db[collection].length < initialLength;
  },

  getById: (collection, id) => {
    const db = Database.get();
    if (!db[collection]) return null;
    return db[collection].find(item => item.id === id) || null;
  },

  getAll: (collection) => {
    const db = Database.get();
    return db[collection] || [];
  },

  // Filter by business ID
  getByBiz: (collection, bizId) => {
    const items = Database.getAll(collection);
    return bizId === 'all' ? items : items.filter(item => item.biz === bizId);
  },

  // Reset database to blank state
  reset: () => {
    const blankDB = createBlankDatabase();
    localStorage.setItem(DB_KEY, JSON.stringify(blankDB));
    return blankDB;
  },

  // Check if database has any data
  isEmpty: () => {
    const db = Database.get();
    return db.businesses.length === 0 && 
           db.customers.length === 0 && 
           db.invoices.length === 0;
  }
};

/* ---- Export to window ---- */
window.Database = Database;
window.DB = {
  TODAY: new Date(),
  businesses: Database.getAll('businesses'),
  customers: Database.getAll('customers'),
  invoices: Database.getAll('invoices'),
  payments: Database.getAll('payments'),
  expenses: Database.getAll('expenses'),
  appointments: Database.getAll('appointments'),
  tasks: Database.getAll('tasks'),
  timeLogs: Database.getAll('timeLogs'),
  emails: Database.getAll('emails'),
  documents: Database.getAll('documents'),
  series: { all: [] }, // Placeholder for chart data
  catBreakdown: (biz) => {
    const expenses = Database.getByBiz('expenses', biz);
    const map = {};
    expenses.forEach(e => { map[e.cat] = (map[e.cat] || 0) + e.amount; });
    return Object.entries(map).map(([cat, amount]) => ({ cat, amount })).sort((a, b) => b.amount - a.amount);
  },
  fmt: { fmtAUD, fmtK, fmtNum, fmtDate, fmtDateShort, fmtTime, relDays, daysFromToday, iso, addDays, MONTHS, DOW },
  biz: (id) => Database.getById('businesses', id),
  cust: (id) => Database.getById('customers', id),
  byBiz: (arr, bizId) => bizId === 'all' ? arr : arr.filter(x => x.biz === bizId),
  // Database operations
  db: Database
};

// Initialize database on load
Database.init();
