const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'crm.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database tables
function initDatabase() {
  // Users table (Admin, Employee, Client)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'employee', 'client')),
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Clients table (extended profile for clients)
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      facebook_link TEXT,
      whatsapp_number TEXT,
      balance REAL DEFAULT 0.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Top-up requests table
  db.exec(`
    CREATE TABLE IF NOT EXISTS topup_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      processed_at DATETIME,
      processed_by INTEGER,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY (processed_by) REFERENCES users(id)
    )
  `);

  // Daily spend tracking for Facebook Marketing
  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_spends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      spend_date DATE NOT NULL,
      amount REAL NOT NULL,
      sales_count INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      UNIQUE(client_id, spend_date)
    )
  `);

  // Projects table (Website Development, Landing Page)
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      project_type TEXT NOT NULL CHECK(project_type IN ('facebook_marketing', 'website_development', 'landing_page')),
      project_name TEXT NOT NULL,
      website_url TEXT,
      username TEXT,
      password TEXT,
      assigned_to INTEGER,
      status TEXT DEFAULT 'in_progress' CHECK(status IN ('in_progress', 'completed', 'on_hold')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    )
  `);

  // Create default admin user if not exists
  const checkAdmin = db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').get('admin');
  if (!checkAdmin) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (username, password, role, name, email)
      VALUES (?, ?, ?, ?, ?)
    `).run('admin', hashedPassword, 'admin', 'System Administrator', 'admin@crm.local');
    console.log('Default admin user created: username=admin, password=admin123');
  }
}

module.exports = { db, initDatabase };
