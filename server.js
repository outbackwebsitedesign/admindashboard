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
        cash REAL
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
    `);
    
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
};

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
        const data = JSON.parse(body);
        const columns = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data).map(v => typeof v === 'object' ? JSON.stringify(v) : v);
        
        db.run(`INSERT INTO ${collection} (${columns}) VALUES (${placeholders})`, values);
        saveDatabase();
        res.end(JSON.stringify({ success: true, id: data.id }));
      });
    } else if (req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        const data = JSON.parse(body);
        const updates = Object.keys(data).map(k => `${k} = ?`).join(', ');
        const values = Object.values(data).map(v => typeof v === 'object' ? JSON.stringify(v) : v);
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
