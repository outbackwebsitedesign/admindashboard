const http = require('http');
const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');
const url = require('url');

const PORT = 9000;
const DB_PATH = path.join(__dirname, 'data', 'admindashboard.db');

let db = null;

// Initialize SQLite database
async function initDatabase() {
  const SQL = await initSqlJs();
  
  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    console.log('SQLite database loaded from:', DB_PATH);
    let migrated = false;

    // Add missing columns to businesses
    const existingCols = new Set(
      db.exec('PRAGMA table_info(businesses)')[0]?.values.map(r => r[1]) || []
    );
    [['invoicePrefix', 'TEXT'], ['gstRate', 'REAL'], ['paymentTermsDays', 'INTEGER'],
     ['stripeFeeRate', 'REAL'], ['stripeFeeFlat', 'REAL']].forEach(([col, type]) => {
      if (!existingCols.has(col)) {
        db.run(`ALTER TABLE businesses ADD COLUMN ${col} ${type}`);
        migrated = true;
      }
    });

    // Create missing tables (added after initial release)
    const existingTables = new Set(
      db.exec("SELECT name FROM sqlite_master WHERE type='table'")[0]?.values.map(r => r[0]) || []
    );
    if (!existingTables.has('users')) {
      db.run(`CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT, email TEXT, role TEXT, practice TEXT, phone TEXT, photo TEXT)`);
      migrated = true;
    }
    if (!existingTables.has('team')) {
      db.run(`CREATE TABLE team (id TEXT PRIMARY KEY, name TEXT, email TEXT, role TEXT)`);
      migrated = true;
    }
    if (!existingTables.has('integrations')) {
      db.run(`CREATE TABLE integrations (id TEXT PRIMARY KEY, name TEXT, desc TEXT, icon TEXT, color TEXT, connected INTEGER)`);
      migrated = true;
    }

    if (migrated) {
      saveDatabase();
      console.log('Database migrated successfully');
    }
  } else {
    db = new SQL.Database();
    
    // Create tables
    db.run(`
      CREATE TABLE IF NOT EXISTS businesses (
        id TEXT PRIMARY KEY,
        name TEXT,
        type TEXT,
        abbr TEXT,
        color TEXT,
        owner TEXT,
        abn TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        since TEXT,
        stripe INTEGER,
        gst INTEGER,
        ytdIncome REAL,
        ytdExpense REAL,
        cash REAL,
        invoicePrefix TEXT,
        gstRate REAL,
        paymentTermsDays INTEGER,
        stripeFeeRate REAL,
        stripeFeeFlat REAL
      );
      
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        biz TEXT,
        name TEXT,
        contact TEXT,
        email TEXT,
        phone TEXT,
        type TEXT,
        city TEXT,
        since TEXT
      );
      
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        biz TEXT,
        cust TEXT,
        issued TEXT,
        due TEXT,
        status TEXT,
        stripe TEXT,
        items TEXT,
        subtotal REAL,
        gst REAL,
        total REAL,
        amountPaid REAL,
        paid TEXT
      );
      
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        biz TEXT,
        invoice TEXT,
        cust TEXT,
        date TEXT,
        amount REAL,
        method TEXT,
        fee REAL,
        status TEXT
      );
      
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        biz TEXT,
        date TEXT,
        vendor TEXT,
        cat TEXT,
        amount REAL,
        gst REAL,
        method TEXT,
        status TEXT
      );
      
      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        biz TEXT,
        start TEXT,
        durMin INTEGER,
        title TEXT,
        cust TEXT,
        kind TEXT
      );
      
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        biz TEXT,
        due TEXT,
        title TEXT,
        prio TEXT,
        done INTEGER,
        tag TEXT
      );
      
      CREATE TABLE IF NOT EXISTS timeLogs (
        id TEXT PRIMARY KEY,
        biz TEXT,
        date TEXT,
        who TEXT,
        cust TEXT,
        hrs REAL,
        rate REAL,
        note TEXT,
        billable INTEGER,
        billed INTEGER
      );
      
      CREATE TABLE IF NOT EXISTS emails (
        id TEXT PRIMARY KEY,
        biz TEXT,
        thread TEXT,
        "from" TEXT,
        cust TEXT,
        subject TEXT,
        preview TEXT,
        ago TEXT,
        unread INTEGER,
        dir TEXT,
        tag TEXT
      );
      
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        biz TEXT,
        name TEXT,
        kind TEXT,
        size TEXT,
        date TEXT,
        by TEXT
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT,
        role TEXT,
        practice TEXT,
        phone TEXT,
        photo TEXT
      );

      CREATE TABLE IF NOT EXISTS team (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT,
        role TEXT
      );

      CREATE TABLE IF NOT EXISTS integrations (
        id TEXT PRIMARY KEY,
        name TEXT,
        desc TEXT,
        icon TEXT,
        color TEXT,
        connected INTEGER
      );
    `);

    // Seed default user
    db.run(`INSERT INTO users (id, name, email, role, practice, phone) VALUES (?, ?, ?, ?, ?, ?)`,
      ['user-1', 'Practice Owner', 'owner@mypractice.com.au', 'Bookkeeper · Admin', 'My Practice', '']);

    // Seed integrations
    const integrations = [
      ['int-stripe', 'Stripe', 'Payment links & checkout', 'zap', '#635bff', 0],
      ['int-xero', 'Xero', 'Accounting sync', 'book', '#13b5ea', 0],
      ['int-gmail', 'Gmail', 'Email integration', 'mail', '#ea4335', 0],
      ['int-gcal', 'Google Calendar', 'Appointment sync', 'calendar', '#4285f4', 0],
      ['int-auspost', 'Australia Post', 'Postal / document mailing', 'send', '#dc1928', 0],
    ];
    integrations.forEach(([id, name, desc, icon, color, connected]) => {
      db.run(`INSERT INTO integrations (id, name, desc, icon, color, connected) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, name, desc, icon, color, connected]);
    });

    saveDatabase();
    console.log('SQLite database created at:', DB_PATH);
  }
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.jsx': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
};

const ALLOWED_TABLES = new Set(['businesses','customers','invoices','payments','expenses','appointments','tasks','timeLogs','emails','documents','users','team','integrations']);

// API handler
function handleAPI(req, res, pathname) {
  if (!db) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Database not initialized' }));
    return;
  }

  try {
    const urlParts = pathname.split('/').filter(Boolean);
    const collection = urlParts[2]; // /api/db/{collection}
    const id = urlParts[3]; // /api/db/{collection}/{id}

    if (!ALLOWED_TABLES.has(collection)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid collection' }));
      return;
    }

    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'GET') {
      if (id) {
        const stmt = db.prepare(`SELECT * FROM ${collection} WHERE id = ?`);
        stmt.bind([id]);
        let row = null;
        if (stmt.step()) row = stmt.getAsObject();
        stmt.free();
        if (row && row.items) row.items = JSON.parse(row.items);
        res.end(JSON.stringify(row));
      } else {
        const stmt = db.prepare(`SELECT * FROM ${collection}`);
        const rows = [];
        while (stmt.step()) {
          const row = stmt.getAsObject();
          if (row.items) row.items = JSON.parse(row.items);
          rows.push(row);
        }
        stmt.free();
        res.end(JSON.stringify(rows));
      }
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        let data;
        try { data = JSON.parse(body); } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
          return;
        }
        const columns = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data).map(v => (v !== null && typeof v === 'object') ? JSON.stringify(v) : v);

        db.run(`INSERT INTO ${collection} (${columns}) VALUES (${placeholders})`, values);
        saveDatabase();
        res.end(JSON.stringify({ success: true, id: data.id }));
      });
    } else if (req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        let data;
        try { data = JSON.parse(body); } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
          return;
        }
        const updates = Object.keys(data).map(k => `${k} = ?`).join(', ');
        const values = Object.values(data).map(v => (v !== null && typeof v === 'object') ? JSON.stringify(v) : v);
        values.push(id);

        db.run(`UPDATE ${collection} SET ${updates} WHERE id = ?`, values);
        saveDatabase();
        res.end(JSON.stringify({ success: true }));
      });
    } else if (req.method === 'DELETE') {
      db.run(`DELETE FROM ${collection} WHERE id = ?`, [id]);
      saveDatabase();
      res.end(JSON.stringify({ success: true }));
    }
  } catch (error) {
    console.error('API error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // Handle API requests
  if (parsedUrl.pathname.startsWith('/api/db')) {
    handleAPI(req, res, parsedUrl.pathname);
    return;
  }
  
  // Serve static files
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, filePath);

  const extname = path.extname(filePath);
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`, 'utf-8');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Initialize database and start server
initDatabase().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}/`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
