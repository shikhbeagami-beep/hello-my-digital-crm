const { db } = require('./database');

const User = {
  findById: (id) => {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },

  findByUsername: (username) => {
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  },

  create: (username, password, role, name, email = null, phone = null) => {
    const result = db.prepare(`
      INSERT INTO users (username, password, role, name, email, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(username, password, role, name, email, phone);
    return result.lastInsertRowid;
  },

  getAll: (role = null) => {
    if (role) {
      return db.prepare('SELECT * FROM users WHERE role = ? ORDER BY created_at DESC').all(role);
    }
    return db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  },

  update: (id, data) => {
    const fields = [];
    const values = [];
    
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    });
    
    values.push(id);
    return db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }
};

const Client = {
  findById: (id) => {
    return db.prepare(`
      SELECT c.*, u.name, u.username, u.email, u.phone
      FROM clients c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(id);
  },

  findByUserId: (userId) => {
    return db.prepare(`
      SELECT c.*, u.name, u.username, u.email, u.phone
      FROM clients c
      JOIN users u ON c.user_id = u.id
      WHERE c.user_id = ?
    `).get(userId);
  },

  create: (userId, facebookLink = null, whatsappNumber = null) => {
    const result = db.prepare(`
      INSERT INTO clients (user_id, facebook_link, whatsapp_number)
      VALUES (?, ?, ?)
    `).run(userId, facebookLink, whatsappNumber);
    return result.lastInsertRowid;
  },

  getAll: () => {
    return db.prepare(`
      SELECT c.*, u.name, u.username, u.email, u.phone
      FROM clients c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
    `).all();
  },

  update: (id, data) => {
    const fields = [];
    const values = [];
    
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    });
    
    values.push(id);
    return db.prepare(`UPDATE clients SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  },

  updateBalance: (id, amount) => {
    return db.prepare('UPDATE clients SET balance = balance + ? WHERE id = ?').run(amount, id);
  }
};

const TopupRequest = {
  create: (clientId, amount) => {
    const result = db.prepare(`
      INSERT INTO topup_requests (client_id, amount)
      VALUES (?, ?)
    `).run(clientId, amount);
    return result.lastInsertRowid;
  },

  getAll: (status = null) => {
    let query = `
      SELECT tr.*, c.*, u.name as client_name, u.phone, u.email
      FROM topup_requests tr
      JOIN clients c ON tr.client_id = c.id
      JOIN users u ON c.user_id = u.id
    `;
    
    if (status) {
      query += ' WHERE tr.status = ?';
      return db.prepare(query + ' ORDER BY tr.requested_at DESC').all(status);
    }
    return db.prepare(query + ' ORDER BY tr.requested_at DESC').all();
  },

  getByClientId: (clientId) => {
    return db.prepare(`
      SELECT * FROM topup_requests
      WHERE client_id = ?
      ORDER BY requested_at DESC
    `).all(clientId);
  },

  updateStatus: (id, status, processedBy) => {
    return db.prepare(`
      UPDATE topup_requests
      SET status = ?, processed_at = CURRENT_TIMESTAMP, processed_by = ?
      WHERE id = ?
    `).run(status, processedBy, id);
  }
};

const DailySpend = {
  create: (clientId, spendDate, amount, salesCount = 0, notes = null) => {
    const result = db.prepare(`
      INSERT INTO daily_spends (client_id, spend_date, amount, sales_count, notes)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(client_id, spend_date) 
      DO UPDATE SET amount = ?, sales_count = ?, notes = ?
    `).run(clientId, spendDate, amount, salesCount, notes, amount, salesCount, notes);
    return result.lastInsertRowid;
  },

  getByClientId: (clientId, limit = 30) => {
    return db.prepare(`
      SELECT * FROM daily_spends
      WHERE client_id = ?
      ORDER BY spend_date DESC
      LIMIT ?
    `).all(clientId, limit);
  },

  getByDate: (spendDate) => {
    return db.prepare(`
      SELECT ds.*, c.*, u.name as client_name
      FROM daily_spends ds
      JOIN clients c ON ds.client_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE ds.spend_date = ?
    `).all(spendDate);
  },

  getTotalSpendByClient: (clientId) => {
    const result = db.prepare(`
      SELECT SUM(amount) as total_spend, SUM(sales_count) as total_sales
      FROM daily_spends
      WHERE client_id = ?
    `).get(clientId);
    return {
      total_spend: result?.total_spend || 0,
      total_sales: result?.total_sales || 0
    };
  }
};

const Project = {
  create: (clientId, projectType, projectName, websiteUrl = null, username = null, password = null, assignedTo = null, notes = null) => {
    const result = db.prepare(`
      INSERT INTO projects (client_id, project_type, project_name, website_url, username, password, assigned_to, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(clientId, projectType, projectName, websiteUrl, username, password, assignedTo, notes);
    return result.lastInsertRowid;
  },

  getAll: (status = null) => {
    let query = `
      SELECT p.*, c.*, u1.name as client_name, u2.name as assigned_to_name
      FROM projects p
      JOIN clients c ON p.client_id = c.id
      JOIN users u1 ON c.user_id = u1.id
      LEFT JOIN users u2 ON p.assigned_to = u2.id
    `;
    
    if (status) {
      query += ' WHERE p.status = ?';
      return db.prepare(query + ' ORDER BY p.created_at DESC').all(status);
    }
    return db.prepare(query + ' ORDER BY p.created_at DESC').all();
  },

  getByClientId: (clientId) => {
    return db.prepare(`
      SELECT p.*, u.name as assigned_to_name
      FROM projects p
      LEFT JOIN users u ON p.assigned_to = u.id
      WHERE p.client_id = ?
      ORDER BY p.created_at DESC
    `).all(clientId);
  },

  getById: (id) => {
    return db.prepare(`
      SELECT p.*, c.*, u1.name as client_name, u2.name as assigned_to_name
      FROM projects p
      JOIN clients c ON p.client_id = c.id
      JOIN users u1 ON c.user_id = u1.id
      LEFT JOIN users u2 ON p.assigned_to = u2.id
      WHERE p.id = ?
    `).get(id);
  },

  update: (id, data) => {
    const fields = [];
    const values = [];
    
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    });
    
    values.push(id);
    return db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }
};

module.exports = {
  User,
  Client,
  TopupRequest,
  DailySpend,
  Project
};
