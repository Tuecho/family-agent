import express from 'express';
import cors from 'cors';
import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import cron from 'node-cron';

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = './family_agent.db';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

let db;

async function initDb() {
  const SQL = await initSqlJs();
  
  if (existsSync(DB_FILE)) {
    const buffer = readFileSync(DB_FILE);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      owner_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      concept TEXT,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      owner_id INTEGER NOT NULL,
      concept TEXT NOT NULL,
      amount REAL NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(owner_id, concept, month, year)
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY,
      owner_id INTEGER,
      name TEXT DEFAULT 'Usuario',
      avatar TEXT,
      email TEXT,
      phone TEXT,
      family_name TEXT DEFAULT 'Mi Familia',
      currency TEXT DEFAULT 'EUR',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS auth_user (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS family_events (
      id TEXT PRIMARY KEY,
      owner_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      type TEXT,
      location TEXT,
      recurrence TEXT,
      days_of_week TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS expense_concepts (
      key TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS invitations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER NOT NULL,
      to_username TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(from_user_id, to_username)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS user_shares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      shared_with_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(owner_id, shared_with_id)
    )
  `);

  try { db.run(`ALTER TABLE family_events ADD COLUMN recurrence TEXT`); } catch(e) {}
  try { db.run(`ALTER TABLE family_events ADD COLUMN days_of_week TEXT`); } catch(e) {}
  try { db.run(`ALTER TABLE transactions ADD COLUMN owner_id INTEGER DEFAULT 1`); } catch(e) {}
  try { db.run(`ALTER TABLE budgets ADD COLUMN owner_id INTEGER DEFAULT 1`); } catch(e) {}
  try { db.run(`ALTER TABLE family_events ADD COLUMN owner_id INTEGER DEFAULT 1`); } catch(e) {}
  try { db.run(`ALTER TABLE expense_concepts ADD COLUMN owner_id INTEGER DEFAULT 0`); } catch(e) {}
  try { db.run(`ALTER TABLE user_profile ADD COLUMN owner_id INTEGER DEFAULT 1`); } catch(e) {}
  
  db.run(`
    INSERT OR IGNORE INTO expense_concepts (key, owner_id, label) VALUES
      ('gasolina', 0, 'Gasolina'),
      ('comida', 0, 'Comida'),
      ('alquiler', 0, 'Alquiler'),
      ('servicios', 0, 'Servicios'),
      ('ocio', 0, 'Ocio'),
      ('otros', 0, 'Otros')
  `);
  
  saveDb();
}

function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex');
}

function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(DB_FILE, buffer);
}

function getCurrentUserId(headers) {
  const { username, password } = headers || {};
  if (!username || !password) return null;
  
  const stmt = db.prepare('SELECT id FROM auth_user WHERE username = ? AND status = "approved"');
  stmt.bind([username]);
  let userId = null;
  if (stmt.step()) {
    userId = stmt.getAsObject().id;
  }
  stmt.free();
  return userId;
}

function getAccessibleUserIds(ownerId) {
  const ids = [ownerId];
  
  const stmt = db.prepare('SELECT shared_with_id FROM user_shares WHERE owner_id = ?');
  stmt.bind([ownerId]);
  while (stmt.step()) {
    ids.push(stmt.getAsObject().shared_with_id);
  }
  stmt.free();
  
  const stmt2 = db.prepare('SELECT owner_id FROM user_shares WHERE shared_with_id = ?');
  stmt2.bind([ownerId]);
  while (stmt2.step()) {
    ids.push(stmt2.getAsObject().owner_id);
  }
  stmt2.free();
  
  return [...new Set(ids)];
}

app.use(cors());
app.use(express.json());

app.get('/api/concepts', (req, res) => {
  const stmt = db.prepare('SELECT key, label FROM expense_concepts ORDER BY label');
  const concepts = [];
  while (stmt.step()) concepts.push(stmt.getAsObject());
  stmt.free();
  res.json(concepts);
});

app.post('/api/concepts', (req, res) => {
  const { key, label } = req.body || {};
  if (!key || typeof key !== 'string' || !/^[a-z0-9_-]{2,30}$/.test(key)) {
    return res.status(400).json({ error: 'Clave inválida (2-30, a-z, 0-9, _ o -)' });
  }
  if (!label || typeof label !== 'string' || label.trim().length < 2) {
    return res.status(400).json({ error: 'Nombre inválido (mínimo 2 caracteres)' });
  }

  try {
    const stmt = db.prepare('INSERT INTO expense_concepts (key, label) VALUES (?, ?)');
    stmt.run([key, label.trim()]);
    stmt.free();
    saveDb();
    return res.json({ success: true });
  } catch (error) {
    console.error('Error inserting concept:', error);
    return res.status(500).json({ error: 'Error creando concepto' });
  }
});

app.put('/api/concepts/:key', (req, res) => {
  const { key } = req.params;
  const { label } = req.body || {};
  if (!label || typeof label !== 'string' || label.trim().length < 2) {
    return res.status(400).json({ error: 'Nombre inválido (mínimo 2 caracteres)' });
  }

  try {
    const stmt = db.prepare('UPDATE expense_concepts SET label = ? WHERE key = ?');
    stmt.run([label.trim(), key]);
    stmt.free();
    saveDb();
    return res.json({ success: true });
  } catch (error) {
    console.error('Error updating concept:', error);
    return res.status(500).json({ error: 'Error actualizando concepto' });
  }
});

app.delete('/api/concepts/:key', (req, res) => {
  const { key } = req.params;

  const usedStmt = db.prepare(`
    SELECT
      (SELECT COUNT(1) FROM transactions WHERE concept = ?) as tx_count,
      (SELECT COUNT(1) FROM budgets WHERE concept = ?) as budget_count
  `);
  usedStmt.bind([key, key]);
  usedStmt.step();
  const used = usedStmt.getAsObject();
  usedStmt.free();

  const txCount = used.tx_count || 0;
  const budgetCount = used.budget_count || 0;
  if (txCount > 0 || budgetCount > 0) {
    return res.status(409).json({ error: 'No se puede eliminar: el concepto está en uso' });
  }

  try {
    db.run('DELETE FROM expense_concepts WHERE key = ?', [key]);
    saveDb();
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting concept:', error);
    return res.status(500).json({ error: 'Error eliminando concepto' });
  }
});

app.get('/api/auth/status', (req, res) => {
  const stmt = db.prepare('SELECT username FROM auth_user WHERE id = 1');
  let row = null;
  if (stmt.step()) row = stmt.getAsObject();
  stmt.free();
  res.json({ isSetup: !!row?.username });
});

app.post('/api/auth/setup', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ error: 'Usuario inválido (mínimo 3 caracteres)' });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Contraseña inválida (mínimo 6 caracteres)' });
  }

  const existingStmt = db.prepare('SELECT username FROM auth_user WHERE id = 1');
  let existing = null;
  if (existingStmt.step()) existing = existingStmt.getAsObject();
  existingStmt.free();
  if (existing?.username) {
    return res.status(409).json({ error: 'Ya existe un usuario configurado' });
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const password_hash = hashPassword(password, salt);

  try {
    const stmt = db.prepare('INSERT INTO auth_user (id, username, password_hash, salt) VALUES (1, ?, ?, ?)');
    stmt.run([username.trim(), password_hash, salt]);
    stmt.free();
    saveDb();
    return res.json({ success: true });
  } catch (error) {
    console.error('Error setting up auth:', error);
    return res.status(500).json({ error: 'Error configurando usuario' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Faltan credenciales' });

  const stmt = db.prepare('SELECT id, username, password_hash, salt, is_admin, status FROM auth_user WHERE username = ?');
  stmt.bind([username.trim()]);
  let row = null;
  if (stmt.step()) row = stmt.getAsObject();
  stmt.free();

  if (!row?.username) return res.status(401).json({ error: 'Credenciales incorrectas' });
  if (row.status === 'pending') return res.status(403).json({ error: 'Usuario pendiente de aprobación' });
  if (row.status === 'rejected') return res.status(403).json({ error: 'Usuario rechazado. Contacta con el administrador.' });

  const computed = hashPassword(String(password), String(row.salt));
  if (computed !== String(row.password_hash)) return res.status(401).json({ error: 'Credenciales incorrectas' });

  return res.json({ success: true, isAdmin: !!row.is_admin, username: row.username, userId: row.id });
});

app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body || {};
  
  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ error: 'Usuario inválido (mínimo 3 caracteres)' });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Contraseña inválida (mínimo 6 caracteres)' });
  }

  const checkStmt = db.prepare('SELECT id FROM auth_user WHERE username = ?');
  checkStmt.bind([username.trim()]);
  const exists = checkStmt.step();
  checkStmt.free();

  if (exists) {
    return res.status(409).json({ error: 'El usuario ya existe' });
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const password_hash = hashPassword(password, salt);

  try {
    const stmt = db.prepare('INSERT INTO auth_user (username, password_hash, salt, status) VALUES (?, ?, ?, ?)');
    stmt.run([username.trim(), password_hash, salt, 'pending']);
    stmt.free();
    saveDb();
    return res.json({ success: true, message: 'Usuario creado. Espera aprobación del administrador.' });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ error: 'Error creando usuario' });
  }
});

app.get('/api/auth/admin/users', (req, res) => {
  const { username, password } = req.headers || {};
  
  if (!username || !password) return res.status(401).json({ error: 'No autorizado' });

  const stmt = db.prepare('SELECT id, username, is_admin, status, created_at FROM auth_user WHERE username = ?');
  stmt.bind([username]);
  let user = null;
  if (stmt.step()) user = stmt.getAsObject();
  stmt.free();

  if (!user || !user.is_admin) return res.status(403).json({ error: 'Solo administradores' });

  const usersStmt = db.prepare('SELECT id, username, is_admin, status, created_at FROM auth_user ORDER BY created_at DESC');
  const users = [];
  while (usersStmt.step()) {
    users.push(usersStmt.getAsObject());
  }
  usersStmt.free();

  return res.json(users);
});

app.post('/api/auth/admin/approve/:id', (req, res) => {
  const { username, password } = req.headers || {};
  const userId = parseInt(req.params.id);

  if (!username || !password) return res.status(401).json({ error: 'No autorizado' });

  const stmt = db.prepare('SELECT id, is_admin FROM auth_user WHERE username = ?');
  stmt.bind([username]);
  let admin = null;
  if (stmt.step()) admin = stmt.getAsObject();
  stmt.free();

  if (!admin || !admin.is_admin) return res.status(403).json({ error: 'Solo administradores' });

  try {
    const updateStmt = db.prepare('UPDATE auth_user SET status = ? WHERE id = ?');
    updateStmt.run(['approved', userId]);
    updateStmt.free();
    saveDb();
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Error actualizando usuario' });
  }
});

app.post('/api/auth/admin/reject/:id', (req, res) => {
  const { username, password } = req.headers || {};
  const userId = parseInt(req.params.id);

  if (!username || !password) return res.status(401).json({ error: 'No autorizado' });

  const stmt = db.prepare('SELECT id, is_admin FROM auth_user WHERE username = ?');
  stmt.bind([username]);
  let admin = null;
  if (stmt.step()) admin = stmt.getAsObject();
  stmt.free();

  if (!admin || !admin.is_admin) return res.status(403).json({ error: 'Solo administradores' });

  try {
    const updateStmt = db.prepare('UPDATE auth_user SET status = ? WHERE id = ?');
    updateStmt.run(['rejected', userId]);
    updateStmt.free();
    saveDb();
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Error actualizando usuario' });
  }
});

app.post('/api/auth/admin/user/:id/block', (req, res) => {
  const { username, password } = req.headers || {};
  const userId = parseInt(req.params.id);
  const { blocked } = req.body;

  if (!username || !password) return res.status(401).json({ error: 'No autorizado' });

  const stmt = db.prepare('SELECT id, is_admin FROM auth_user WHERE username = ?');
  stmt.bind([username]);
  let admin = null;
  if (stmt.step()) admin = stmt.getAsObject();
  stmt.free();

  if (!admin || !admin.is_admin) return res.status(403).json({ error: 'Solo administradores' });

  try {
    const updateStmt = db.prepare('UPDATE auth_user SET status = ? WHERE id = ?');
    updateStmt.run([blocked ? 'blocked' : 'approved', userId]);
    updateStmt.free();
    saveDb();
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Error actualizando usuario' });
  }
});

app.post('/api/auth/admin/user/:id/role', (req, res) => {
  const { username, password } = req.headers || {};
  const userId = parseInt(req.params.id);
  const { is_admin } = req.body;

  if (!username || !password) return res.status(401).json({ error: 'No autorizado' });

  const stmt = db.prepare('SELECT id, is_admin FROM auth_user WHERE username = ?');
  stmt.bind([username]);
  let admin = null;
  if (stmt.step()) admin = stmt.getAsObject();
  stmt.free();

  if (!admin || !admin.is_admin) return res.status(403).json({ error: 'Solo administradores' });
  if (admin.id === userId) return res.status(400).json({ error: 'No puedes cambiarte el rol a ti mismo' });

  if (!is_admin) {
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM auth_user WHERE is_admin = 1');
    countStmt.step();
    const result = countStmt.getAsObject();
    countStmt.free();
    if (result.count <= 1) {
      return res.status(400).json({ error: 'No puedes quitar el último administrador' });
    }
  }

  try {
    const updateStmt = db.prepare('UPDATE auth_user SET is_admin = ? WHERE id = ?');
    updateStmt.run([is_admin ? 1 : 0, userId]);
    updateStmt.free();
    saveDb();
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Error actualizando usuario' });
  }
});

app.post('/api/auth/admin/user/:id/password', (req, res) => {
  const { username, password } = req.headers || {};
  const userId = parseInt(req.params.id);
  const { new_password } = req.body;

  if (!username || !password) return res.status(401).json({ error: 'No autorizado' });
  if (!new_password || new_password.length < 4) return res.status(400).json({ error: 'Contraseña muy corta' });

  const stmt = db.prepare('SELECT id, is_admin FROM auth_user WHERE username = ?');
  stmt.bind([username]);
  let admin = null;
  if (stmt.step()) admin = stmt.getAsObject();
  stmt.free();

  if (!admin || !admin.is_admin) return res.status(403).json({ error: 'Solo administradores' });

  try {
    const salt = Math.random().toString(36).substring(2);
    const hash = hashPassword(new_password, salt);
    const updateStmt = db.prepare('UPDATE auth_user SET password_hash = ?, salt = ? WHERE id = ?');
    updateStmt.run([hash, salt, userId]);
    updateStmt.free();
    saveDb();
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Error cambiando contraseña' });
  }
});

app.delete('/api/auth/admin/user/:id', (req, res) => {
  const { username, password } = req.headers || {};
  const userId = parseInt(req.params.id);

  if (!username || !password) return res.status(401).json({ error: 'No autorizado' });

  const stmt = db.prepare('SELECT id, is_admin FROM auth_user WHERE username = ?');
  stmt.bind([username]);
  let admin = null;
  if (stmt.step()) admin = stmt.getAsObject();
  stmt.free();

  if (!admin || !admin.is_admin) return res.status(403).json({ error: 'Solo administradores' });
  if (admin.id === userId) return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });

  try {
    db.run('DELETE FROM transactions WHERE owner_id = ?', [userId]);
    db.run('DELETE FROM budgets WHERE owner_id = ?', [userId]);
    db.run('DELETE FROM family_events WHERE owner_id = ?', [userId]);
    db.run('DELETE FROM user_shares WHERE owner_id = ? OR shared_with_id = ?', [userId, userId]);
    db.run('DELETE FROM auth_user WHERE id = ?', [userId]);
    saveDb();
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Error eliminando usuario' });
  }
});

app.get('/api/events', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { from, to } = req.query;
  const accessibleIds = getAccessibleUserIds(userId);
  const placeholders = accessibleIds.map(() => '?').join(',');

  let query = `SELECT * FROM family_events WHERE owner_id IN (${placeholders})`;
  const params = [...accessibleIds];

  if (from && to) {
    query += ' AND (date BETWEEN ? AND ? OR recurrence = ?)';
    params.push(String(from), String(to), 'weekly');
  } else if (from) {
    query += ' AND (date >= ? OR recurrence = ?)';
    params.push(String(from), 'weekly');
  } else if (to) {
    query += ' AND (date <= ? OR recurrence = ?)';
    params.push(String(to), 'weekly');
  }

  query += ' ORDER BY date ASC, start_time ASC';

  const stmt = db.prepare(query);
  stmt.bind(params);

  const events = [];
  while (stmt.step()) {
    events.push(stmt.getAsObject());
  }
  stmt.free();

  if (from && to) {
    const expanded = [];
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    for (const event of events) {
      if (event.recurrence === 'weekly' && event.days_of_week) {
        const days = event.days_of_week.split(',').map(d => parseInt(d.trim()));
        const cursor = new Date(fromDate);
        while (cursor <= toDate) {
          if (days.includes(cursor.getDay())) {
            const year = cursor.getFullYear();
            const month = String(cursor.getMonth() + 1).padStart(2, '0');
            const day = String(cursor.getDate()).padStart(2, '0');
            expanded.push({
              ...event,
              date: `${year}-${month}-${day}`,
              is_recurring_instance: true
            });
          }
          cursor.setDate(cursor.getDate() + 1);
        }
      } else {
        expanded.push(event);
      }
    }
    expanded.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.start_time || '').localeCompare(b.start_time || '');
    });
    return res.json(expanded);
  }

  res.json(events);
});

app.post('/api/events', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { id, title, description, date, start_time, end_time, type, location, recurrence, days_of_week } = req.body || {};

  if (!id || !title || !date) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const stmt = db.prepare(`
    INSERT INTO family_events (id, owner_id, title, description, date, start_time, end_time, type, location, recurrence, days_of_week)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    stmt.run([id, userId, title, description || null, date, start_time || null, end_time || null, type || null, location || null, recurrence || null, days_of_week || null]);
    stmt.free();
    saveDb();
    res.json({ success: true });
  } catch (error) {
    console.error('Error inserting event:', error);
    res.status(500).json({ error: 'Error insertando evento' });
  }
});

app.put('/api/events/:id', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { id } = req.params;
  const { title, description, date, start_time, end_time, type, location, recurrence, days_of_week } = req.body || {};

  if (!title || !date) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const stmt = db.prepare(`
    UPDATE family_events
    SET title = ?, description = ?, date = ?, start_time = ?, end_time = ?, type = ?, location = ?, recurrence = ?, days_of_week = ?
    WHERE id = ? AND owner_id = ?
  `);

  try {
    stmt.run([title, description || null, date, start_time || null, end_time || null, type || null, location || null, recurrence || null, days_of_week || null, id, userId]);
    stmt.free();
    saveDb();
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Error actualizando evento' });
  }
});

app.delete('/api/events/:id', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { id } = req.params;

  try {
    db.run('DELETE FROM family_events WHERE id = ? AND owner_id = ?', [id, userId]);
    saveDb();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Error eliminando evento' });
  }
});

app.get('/api/transactions', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { month, year } = req.query;
  const accessibleIds = getAccessibleUserIds(userId);
  const placeholders = accessibleIds.map(() => '?').join(',');
  
  let query = `SELECT * FROM transactions WHERE owner_id IN (${placeholders})`;
  const params = [...accessibleIds];
  
  if (month && year) {
    query += ' AND date LIKE ?';
    params.push(`${String(year)}-${String(month).padStart(2, '0')}-%`);
  }
  
  query += ' ORDER BY date DESC';
  
  const stmt = db.prepare(query);
  stmt.bind(params);
  
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  res.json(results);
});

app.post('/api/transactions', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { id, type, amount, description, concept, date } = req.body;
  
  const stmt = db.prepare(`
    INSERT INTO transactions (id, owner_id, type, amount, description, concept, date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  try {
    stmt.run([id, userId, type, amount, description, concept || null, date]);
    stmt.free();
    saveDb();
    res.json({ success: true });
  } catch (error) {
    console.error('Error inserting:', error);
    res.status(500).json({ error: 'Error inserting transaction' });
  }
});

app.put('/api/transactions/:id', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { id } = req.params;
  const { type, amount, description, concept, date } = req.body || {};

  if (!type || typeof amount !== 'number' || !description || !date) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const stmt = db.prepare(`
    UPDATE transactions
    SET type = ?, amount = ?, description = ?, concept = ?, date = ?
    WHERE id = ? AND owner_id = ?
  `);

  try {
    stmt.run([type, amount, description, concept || null, date, id, userId]);
    stmt.free();
    saveDb();
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Error updating transaction' });
  }
});

app.delete('/api/transactions/:id', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { id } = req.params;
  
  db.run('DELETE FROM transactions WHERE id = ? AND owner_id = ?', [id, userId]);
  saveDb();
  res.json({ success: true });
});

app.get('/api/transactions/summary', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { month, year } = req.query;
  const accessibleIds = getAccessibleUserIds(userId);
  const placeholders = accessibleIds.map(() => '?').join(',');
  
  let query = `
    SELECT 
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
    FROM transactions
    WHERE owner_id IN (${placeholders})
  `;
  const params = [...accessibleIds];
  
  if (month && year) {
    query += ' AND date LIKE ?';
    params.push(`${String(year)}-${String(month).padStart(2, '0')}-%`);
  }
  
  const stmt = db.prepare(query);
  stmt.bind(params);
  
  stmt.step();
  const result = stmt.getAsObject();
  stmt.free();
  
  const income = result.total_income || 0;
  const expense = result.total_expense || 0;
  
  res.json({
    income,
    expense,
    balance: income - expense
  });
});

app.get('/api/transactions/monthly', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { months = 12 } = req.query;
  const numMonths = parseInt(months) || 12;
  const accessibleIds = getAccessibleUserIds(userId);
  const placeholders = accessibleIds.map(() => '?').join(',');
  
  const results = [];
  
  for (let i = numMonths - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    const stmt = db.prepare(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM transactions
      WHERE owner_id IN (${placeholders}) AND date LIKE ?
    `);
    stmt.bind([...accessibleIds, `${year}-${month}-%`]);
    stmt.step();
    const row = stmt.getAsObject();
    stmt.free();
    
    results.push({
      month: parseInt(month),
      year,
      label: d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
      income: row.income || 0,
      expense: row.expense || 0,
      balance: (row.income || 0) - (row.expense || 0)
    });
  }
  
  res.json(results);
});

app.get('/api/transactions/by-concept', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { month, year } = req.query;
  const accessibleIds = getAccessibleUserIds(userId);
  const placeholders = accessibleIds.map(() => '?').join(',');
  
  let query = `
    SELECT concept, SUM(amount) as total
    FROM transactions
    WHERE type = 'expense' AND owner_id IN (${placeholders})
  `;
  const params = [...accessibleIds];
  
  if (month && year) {
    query += ' AND date LIKE ?';
    params.push(`${String(year)}-${String(month).padStart(2, '0')}-%`);
  }
  
  query += ' GROUP BY concept';
  
  const stmt = db.prepare(query);
  if (params.length) stmt.bind(params);
  
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  res.json(results);
});

app.get('/api/budgets', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { month, year } = req.query;
  const accessibleIds = getAccessibleUserIds(userId);
  const placeholders = accessibleIds.map(() => '?').join(',');
  
  let query = `SELECT * FROM budgets WHERE owner_id IN (${placeholders})`;
  const params = [...accessibleIds];
  
  if (month && year) {
    query += ' AND month = ? AND year = ?';
    params.push(parseInt(month), parseInt(year));
  }
  
  query += ' ORDER BY concept';
  
  const stmt = db.prepare(query);
  stmt.bind(params);
  
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  res.json(results);
});

app.post('/api/budgets', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { id, concept, amount, month, year } = req.body;
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO budgets (id, owner_id, concept, amount, month, year)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  try {
    stmt.run([id, userId, concept, amount, parseInt(month), parseInt(year)]);
    stmt.free();
    saveDb();
    res.json({ success: true });
  } catch (error) {
    console.error('Error inserting budget:', error);
    res.status(500).json({ error: 'Error inserting budget' });
  }
});

app.put('/api/budgets/:id', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { id } = req.params;
  const { concept, amount, month, year } = req.body || {};

  if (!concept || typeof amount !== 'number' || typeof month !== 'number' || typeof year !== 'number') {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const stmt = db.prepare(`
    UPDATE budgets
    SET concept = ?, amount = ?, month = ?, year = ?
    WHERE id = ? AND owner_id = ?
  `);

  try {
    stmt.run([concept, amount, parseInt(month), parseInt(year), id, userId]);
    stmt.free();
    saveDb();
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ error: 'Error updating budget' });
  }
});

app.delete('/api/budgets/:id', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { id } = req.params;
  
  db.run('DELETE FROM budgets WHERE id = ? AND owner_id = ?', [id, userId]);
  saveDb();
  res.json({ success: true });
});

app.get('/api/budgets/with-spending', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { month, year } = req.query;
  const accessibleIds = getAccessibleUserIds(userId);
  const placeholders = accessibleIds.map(() => '?').join(',');
  
  const budgetsStmt = db.prepare(`SELECT * FROM budgets WHERE month = ? AND year = ? AND owner_id IN (${placeholders})`);
  budgetsStmt.bind([parseInt(month), parseInt(year), ...accessibleIds]);
  
  const budgets = [];
  while (budgetsStmt.step()) {
    budgets.push(budgetsStmt.getAsObject());
  }
  budgetsStmt.free();
  
  const transactionsStmt = db.prepare(`
    SELECT concept, SUM(amount) as spent
    FROM transactions
    WHERE type = 'expense'
      AND owner_id IN (${placeholders})
      AND date LIKE ?
    GROUP BY concept
  `);
  transactionsStmt.bind([...accessibleIds, `${String(year)}-${String(month).padStart(2, '0')}-%`]);
  
  const spending = {};
  while (transactionsStmt.step()) {
    const row = transactionsStmt.getAsObject();
    spending[row.concept] = row.spent;
  }
  transactionsStmt.free();
  
  const result = budgets.map(budget => ({
    ...budget,
    spent: spending[budget.concept] || 0,
    remaining: budget.amount - (spending[budget.concept] || 0),
    percentage: Math.round(((spending[budget.concept] || 0) / budget.amount) * 100)
  }));
  
  res.json(result);
});

app.get('/api/profile', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  let stmt = db.prepare('SELECT * FROM user_profile WHERE owner_id = ?');
  stmt.bind([userId]);
  let profile = null;
  if (stmt.step()) profile = stmt.getAsObject();
  stmt.free();
  
  if (!profile) {
    stmt = db.prepare('INSERT INTO user_profile (owner_id, name) VALUES (?, ?)');
    stmt.run([userId, 'Usuario']);
    stmt.free();
    saveDb();
    
    stmt = db.prepare('SELECT * FROM user_profile WHERE owner_id = ?');
    stmt.bind([userId]);
    stmt.step();
    profile = stmt.getAsObject();
    stmt.free();
  }
  
  res.json(profile);
});

app.put('/api/profile', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { name, avatar, email, phone, family_name, currency } = req.body;
  
  const stmt = db.prepare(`
    UPDATE user_profile 
    SET name = ?, avatar = ?, email = ?, phone = ?, family_name = ?, currency = ?, updated_at = CURRENT_TIMESTAMP
    WHERE owner_id = ?
  `);
  
  try {
    stmt.run([name, avatar || null, email || null, phone || null, family_name || 'Mi Familia', currency || 'EUR', userId]);
    stmt.free();
    saveDb();
    
    const updatedStmt = db.prepare('SELECT * FROM user_profile WHERE owner_id = ?');
    updatedStmt.bind([userId]);
    updatedStmt.step();
    const profile = updatedStmt.getAsObject();
    updatedStmt.free();
    
    res.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Error updating profile' });
  }
});

app.post('/api/reset', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  try {
    db.run('DELETE FROM transactions WHERE owner_id = ?', [userId]);
    db.run('DELETE FROM budgets WHERE owner_id = ?', [userId]);
    db.run('DELETE FROM family_events WHERE owner_id = ?', [userId]);
    db.run('DELETE FROM user_shares WHERE owner_id = ? OR shared_with_id = ?', [userId, userId]);
    db.run('DELETE FROM invitations WHERE from_user_id = ?', [userId]);
    saveDb();
    res.json({ success: true, message: 'Todos tus datos han sido eliminados' });
  } catch (error) {
    console.error('Error resetting data:', error);
    res.status(500).json({ error: 'Error al resetear los datos' });
  }
});

app.get('/api/invitations', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const sent = [];
  const sentStmt = db.prepare('SELECT * FROM invitations WHERE from_user_id = ? ORDER BY created_at DESC');
  sentStmt.bind([userId]);
  while (sentStmt.step()) {
    sent.push(sentStmt.getAsObject());
  }
  sentStmt.free();
  
  const received = [];
  const stmt = db.prepare(`
    SELECT i.*, u.username as from_username 
    FROM invitations i 
    JOIN auth_user u ON i.from_user_id = u.id 
    WHERE i.to_username = (SELECT username FROM auth_user WHERE id = ?)
    ORDER BY i.created_at DESC
  `);
  stmt.bind([userId]);
  while (stmt.step()) {
    received.push(stmt.getAsObject());
  }
  stmt.free();
  
  const sharedWith = [];
  const sharedStmt = db.prepare('SELECT us.*, u.username FROM user_shares us JOIN auth_user u ON us.shared_with_id = u.id WHERE us.owner_id = ?');
  sharedStmt.bind([userId]);
  while (sharedStmt.step()) {
    sharedWith.push(sharedStmt.getAsObject());
  }
  sharedStmt.free();
  
  const sharedBy = [];
  const sharedByStmt = db.prepare('SELECT us.*, u.username as owner_username FROM user_shares us JOIN auth_user u ON us.owner_id = u.id WHERE us.shared_with_id = ?');
  sharedByStmt.bind([userId]);
  while (sharedByStmt.step()) {
    sharedBy.push(sharedByStmt.getAsObject());
  }
  sharedByStmt.free();
  
  res.json({ sent, received, sharedWith, sharedBy });
});

app.post('/api/invitations', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { to_username } = req.body;
  if (!to_username) return res.status(400).json({ error: 'Falta el nombre de usuario' });
  
  const targetStmt = db.prepare('SELECT id FROM auth_user WHERE username = ?');
  targetStmt.bind([to_username]);
  let targetId = null;
  if (targetStmt.step()) targetId = targetStmt.getAsObject().id;
  targetStmt.free();
  
  if (!targetId) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (targetId === userId) return res.status(400).json({ error: 'No puedes compartir contigo mismo' });
  
  const existingStmt = db.prepare('SELECT id FROM user_shares WHERE owner_id = ? AND shared_with_id = ?');
  existingStmt.bind([userId, targetId]);
  if (existingStmt.step()) {
    existingStmt.free();
    return res.status(409).json({ error: 'Ya compartes tus datos con este usuario' });
  }
  existingStmt.free();
  
  try {
    const inviteStmt = db.prepare('INSERT INTO invitations (from_user_id, to_username) VALUES (?, ?)');
    inviteStmt.run([userId, to_username]);
    inviteStmt.free();
    saveDb();
    res.json({ success: true, message: 'Invitación enviada' });
  } catch (error) {
    console.error('Error creating invitation:', error);
    res.status(500).json({ error: 'Error enviando invitación' });
  }
});

app.put('/api/invitations/:id/accept', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { id } = req.params;
  
  const inviteStmt = db.prepare('SELECT * FROM invitations WHERE id = ? AND to_username = (SELECT username FROM auth_user WHERE id = ?)');
  inviteStmt.bind([id, userId]);
  let invite = null;
  if (inviteStmt.step()) invite = inviteStmt.getAsObject();
  inviteStmt.free();
  
  if (!invite) return res.status(404).json({ error: 'Invitación no encontrada' });
  
  const fromStmt = db.prepare('SELECT id FROM auth_user WHERE username = ?');
  fromStmt.bind([invite.from_username]);
  let fromId = null;
  if (fromStmt.step()) fromId = fromStmt.getAsObject().id;
  fromStmt.free();
  
  if (!fromId) return res.status(404).json({ error: 'Usuario no encontrado' });
  
  try {
    db.run('INSERT OR IGNORE INTO user_shares (owner_id, shared_with_id) VALUES (?, ?)', [fromId, userId]);
    db.run('UPDATE invitations SET status = "accepted" WHERE id = ?', [id]);
    saveDb();
    res.json({ success: true, message: 'Invitación aceptada. Ahora puedes ver los datos de este usuario.' });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: 'Error aceptando invitación' });
  }
});

app.put('/api/invitations/:id/reject', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { id } = req.params;
  
  try {
    db.run('UPDATE invitations SET status = "rejected" WHERE id = ? AND to_username = (SELECT username FROM auth_user WHERE id = ?)', [id, userId]);
    saveDb();
    res.json({ success: true });
  } catch (error) {
    console.error('Error rejecting invitation:', error);
    res.status(500).json({ error: 'Error rechazando invitación' });
  }
});

app.delete('/api/invitations/:id', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { id } = req.params;
  
  try {
    db.run('DELETE FROM invitations WHERE id = ? AND from_user_id = ?', [id, userId]);
    saveDb();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting invitation:', error);
    res.status(500).json({ error: 'Error eliminando invitación' });
  }
});

app.delete('/api/shares/:sharedWithId', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { sharedWithId } = req.params;
  
  try {
    db.run('DELETE FROM user_shares WHERE owner_id = ? AND shared_with_id = ?', [userId, sharedWithId]);
    saveDb();
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing share:', error);
    res.status(500).json({ error: 'Error eliminando compartición' });
  }
});


import multer from 'multer';
import XLSX from 'xlsx';

const upload = multer({ storage: multer.memoryStorage() });

function parseDate(dateValue) {
  if (!dateValue) return null;
  
  if (typeof dateValue === 'number') {
    const date = XLSX.SSF.parse_date_code(dateValue);
    return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
  }
  
  if (typeof dateValue === 'string') {
    const parts = dateValue.split(/[\/\-\.]/);
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const fullYear = year.length === 2 ? `20${year}` : year;
      return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  
  const date = new Date(dateValue);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  return null;
}

function normalizeConcept(concept) {
  if (!concept) return null;
  const normalized = String(concept).toLowerCase().trim();
  const conceptMap = {
    'gasolina': 'gasolina',
    'combustible': 'gasolina',
    'carburante': 'gasolina',
    'comida': 'comida',
    'alimentacion': 'comida',
    'supermercado': 'comida',
    'alquiler': 'alquiler',
    'renta': 'alquiler',
    'servicios': 'servicios',
    'luz': 'servicios',
    'agua': 'servicios',
    'internet': 'servicios',
    'ocio': 'ocio',
    'entretenimiento': 'ocio',
    'restaurante': 'ocio',
    'otros': 'otros',
    'varios': 'otros',
    'general': 'otros'
  };
  return conceptMap[normalized] || normalized;
}

function isDuplicate(transaction) {
  const stmt = db.prepare(`
    SELECT id FROM transactions 
    WHERE date = ? AND description = ? AND amount = ?
    LIMIT 1
  `);
  stmt.bind([transaction.date, transaction.description, transaction.amount]);
  const exists = stmt.step();
  stmt.free();
  return exists;
}

app.post('/api/import/excel', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se ha proporcionado ningún archivo' });
  }

  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length < 2) {
      return res.status(400).json({ error: 'El archivo está vacío o no tiene datos' });
    }

    const headers = data[0].map(h => String(h).toLowerCase().trim());
    const requiredHeaders = ['fecha', 'tipo', 'importe', 'descripcion'];
    
    const headerIndices = {};
    for (const header of requiredHeaders) {
      const index = headers.findIndex(h => h === header || h.includes(header));
      if (index === -1) {
        return res.status(400).json({ error: `Falta la columna obligatoria: ${header}` });
      }
      headerIndices[header] = index;
    }

    const conceptIndex = headers.findIndex(h => h === 'concepto' || h.includes('concepto'));

    const imported = [];
    const errors = [];
    const skipped = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      try {
        const dateStr = row[headerIndices.fecha];
        const type = String(row[headerIndices.tipo]).toLowerCase().trim();
        const amount = parseFloat(String(row[headerIndices.importe]).replace(',', '.'));
        const description = String(row[headerIndices.descripcion] || '').trim();
        const concept = conceptIndex >= 0 ? normalizeConcept(row[conceptIndex]) : null;

        if (!dateStr) {
          skipped.push({ row: i + 1, reason: 'Fecha vacía' });
          continue;
        }

        const date = parseDate(dateStr);
        if (!date || isNaN(new Date(date).getTime())) {
          skipped.push({ row: i + 1, reason: 'Fecha inválida' });
          continue;
        }

        if (!['ingreso', 'gasto', 'income', 'expense'].includes(type)) {
          skipped.push({ row: i + 1, reason: 'Tipo debe ser ingreso o gasto' });
          continue;
        }

        if (isNaN(amount) || amount <= 0) {
          skipped.push({ row: i + 1, reason: 'Importe inválido' });
          continue;
        }

        const normalizedType = (type === 'income' || type === 'ingreso') ? 'income' : 'expense';
        const finalConcept = normalizedType === 'expense' ? (concept || 'otros') : null;

        const transaction = {
          id: crypto.randomBytes(4).toString('hex'),
          type: normalizedType,
          amount,
          description,
          concept: finalConcept,
          date
        };

        if (isDuplicate(transaction)) {
          skipped.push({ row: i + 1, reason: 'Duplicado' });
          continue;
        }

        const stmt = db.prepare(`
          INSERT INTO transactions (id, type, amount, description, concept, date)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        stmt.run([transaction.id, transaction.type, transaction.amount, transaction.description, transaction.concept, transaction.date]);
        stmt.free();

        imported.push(transaction);
      } catch (rowError) {
        errors.push({ row: i + 1, error: rowError.message });
      }
    }

    saveDb();

    res.json({
      success: true,
      summary: {
        total: data.length - 1,
        imported: imported.length,
        skipped: skipped.length,
        errors: errors.length
      },
      details: {
        imported: imported.slice(0, 10),
        skipped: skipped.slice(0, 10),
        errors: errors.slice(0, 10)
      }
    });

  } catch (error) {
    console.error('Error importing Excel:', error);
    res.status(500).json({ error: 'Error procesando el archivo Excel' });
  }
});

const conversationHistory = [];

app.post('/api/chat', async (req, res) => {
  const { message, context } = req.body;

  conversationHistory.push({ role: 'user', content: message });

  let response = '';

  if (context === 'family_accounting') {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear());
    
    const stmt = db.prepare(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM transactions
      WHERE date LIKE ?
    `);
    stmt.bind([`${String(year)}-${String(month).padStart(2, '0')}-%`]);
    stmt.step();
    const summary = stmt.getAsObject();
    stmt.free();

    response = generateFamilyResponse(message, summary);
  } else {
    response = 'Soy el asistente de Family Agent. Estoy configurado para ayudarte con la economía familiar.';
  }

  conversationHistory.push({ role: 'assistant', content: response });

  if (conversationHistory.length > 20) {
    conversationHistory.splice(0, 2);
  }

  res.json({ response });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// LLM Settings endpoints
app.get('/api/llm/settings', (req, res) => {
  const stmt = db.prepare('SELECT id, provider, model, updated_at FROM llm_settings WHERE id = 1');
  stmt.step();
  const settings = stmt.getAsObject();
  stmt.free();
  res.json({
    configured: true,
    provider: settings.provider || 'groq',
    model: settings.model || 'llama-3.3-70b-versatile',
    updated_at: settings.updated_at
  });
});

app.put('/api/llm/settings', (req, res) => {
  const { api_key, model } = req.body || {};
  
  const stmt = db.prepare(`
    UPDATE llm_settings 
    SET api_key = ?, model = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `);
  
  try {
    stmt.run([api_key || null, model || 'llama-3.3-70b-versatile']);
    stmt.free();
    saveDb();
    
    const updatedStmt = db.prepare('SELECT id, provider, model, updated_at FROM llm_settings WHERE id = 1');
    updatedStmt.step();
    const settings = updatedStmt.getAsObject();
    updatedStmt.free();
    
    res.json({
      configured: true,
      provider: settings.provider,
      model: settings.model,
      updated_at: settings.updated_at
    });
  } catch (error) {
    console.error('Error updating LLM settings:', error);
    res.status(500).json({ error: 'Error actualizando configuración LLM' });
  }
});

app.post('/api/llm/test', async (req, res) => {
  const { api_key, model } = req.body || {};
  
  if (!api_key) {
    return res.status(400).json({ error: 'Se requiere API key' });
  }
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${api_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Hola, responde solo "OK" para verificar la conexión.' }],
        max_tokens: 20
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      return res.status(401).json({ error: error.error?.message || 'Error de autenticación' });
    }
    
    res.json({ success: true, message: 'Conexión exitosa' });
  } catch (error) {
    console.error('Groq test error:', error);
    res.status(500).json({ error: 'Error conectando con Groq' });
  }
});

// Advanced chat with Groq
const llmConversationHistory = new Map();

app.post('/api/chat/llm', async (req, res) => {
  const { message, session_id = 'default' } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Mensaje requerido' });
  }

  // Get LLM settings
  const settingsStmt = db.prepare('SELECT model FROM llm_settings WHERE id = 1');
  settingsStmt.step();
  const settings = settingsStmt.getAsObject();
  settingsStmt.free();

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY no configurada. Configúrala en las variables de entorno.' });
  }

  const apiKey = GROQ_API_KEY;

  // Get family context
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear());

  // Get monthly summary
  const summaryStmt = db.prepare(`
    SELECT 
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense,
      COUNT(*) as transaction_count
    FROM transactions
    WHERE date LIKE ?
  `);
  summaryStmt.bind([`${String(year)}-${String(month).padStart(2, '0')}-%`]);
  summaryStmt.step();
  const monthlySummary = summaryStmt.getAsObject();
  summaryStmt.free();

  // Get expenses by concept
  const conceptStmt = db.prepare(`
    SELECT concept, SUM(amount) as total
    FROM transactions
    WHERE type = 'expense'
      AND date LIKE ?
    GROUP BY concept
    ORDER BY total DESC
  `);
  conceptStmt.bind([`${String(year)}-${String(month).padStart(2, '0')}-%`]);
  const expensesByConcept = [];
  while (conceptStmt.step()) {
    expensesByConcept.push(conceptStmt.getAsObject());
  }
  conceptStmt.free();

  // Get family profile
  const profileStmt = db.prepare('SELECT name, family_name FROM user_profile WHERE id = 1');
  profileStmt.step();
  const profile = profileStmt.getAsObject();
  profileStmt.free();

  // Get budget info
  const budgetStmt = db.prepare(`
    SELECT concept, amount
    FROM budgets
    WHERE month = ? AND year = ?
  `);
  budgetStmt.bind([parseInt(month), parseInt(year)]);
  const budgets = [];
  while (budgetStmt.step()) {
    budgets.push(budgetStmt.getAsObject());
  }
  budgetStmt.free();

  // Build family context
  const familyContext = `
FAMILIA: ${profile.family_name || 'Mi Familia'}
MIEMBRO: ${profile.name || 'Usuario'}
PERIODO: ${month}/${year}

RESUMEN DEL MES:
- Ingresos totales: ${monthlySummary.income || 0}€
- Gastos totales: ${monthlySummary.expense || 0}€
- Balance: ${((monthlySummary.income || 0) - (monthlySummary.expense || 0)).toFixed(2)}€
- Transacciones: ${monthlySummary.transaction_count || 0}

GASTOS POR CONCEPTO:
${expensesByConcept.map(e => `- ${e.concept}: ${e.total}€`).join('\n') || 'Sin gastos registrados'}

PRESUPUESTOS ESTABLECIDOS:
${budgets.map(b => `- ${b.concept}: ${b.amount}€`).join('\n') || 'Sin presupuestos establecidos'}
`.trim();

  // System prompt
  const systemPrompt = `Eres un asistente financiero familiar llamado "Asistente Family Agent". 
Tu rol es ayudar a gestionar las finanzas de una familia de forma clara y amigable.

REGLAS:
1. Responde SIEMPRE en español
2. Usa emojis cuando sea apropiado para hacer la conversación más amigable
3. Sé conciso pero informativo
4. Si detectas gastos elevados o anomalías, sugiere formas de ahorrar
5. Si no tienes información suficiente, indícalo claramente
6. No inventes datos - usa solo la información proporcionada
7. Puedes dar consejos generales de finanzas personales

CONtexto FAMILIAR:
${familyContext}`;

  // Get or create conversation history for this session
  if (!llmConversationHistory.has(session_id)) {
    llmConversationHistory.set(session_id, []);
  }
  const history = llmConversationHistory.get(session_id);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: settings.model || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: message }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Groq API error:', error);
      return res.status(401).json({ error: error.error?.message || 'Error con la API de Groq' });
    }

    const data = await response.json();
    const llmResponse = data.choices[0].message.content;

    // Add to conversation history
    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: llmResponse });

    // Keep history manageable (last 10 exchanges)
    if (history.length > 20) {
      history.splice(0, 4);
    }

    res.json({ response: llmResponse, session_id });
  } catch (error) {
    console.error('Groq error:', error);
    res.status(500).json({ error: 'Error conectando con el servicio de IA' });
  }
});

// Clear conversation history
app.delete('/api/chat/llm/history', (req, res) => {
  const { session_id = 'default' } = req.query;
  llmConversationHistory.delete(session_id);
  res.json({ success: true });
});

function generateFamilyResponse(message, summary) {
  const msg = message.toLowerCase();
  const income = summary.income || 0;
  const expense = summary.expense || 0;
  const balance = income - expense;

  if (msg.includes('hola') || msg.includes('buenas') || msg.includes('hello')) {
    return `¡Hola! Soy el asistente IA de Family Agent. Este mes:\n- Ingresos: ${income}€\n- Gastos: ${expense}€\n- Balance: ${balance}€\n\n¿Qué quieres saber?`;
  }

  if (msg.includes('gasto') || msg.includes('gastado')) {
    return `Este mes habéis gastado un total de ${expense}€.`;
  }

  if (msg.includes('ingreso') || msg.includes('ganado')) {
    return `Los ingresos de este mes suman ${income}€.`;
  }

  if (msg.includes('balance') || msg.includes('queda') || msg.includes('saldo')) {
    return `El balance del mes es:\n- Ingresos: ${income}€\n- Gastos: ${expense}€\n- Disponible: ${balance}€`;
  }

  if (msg.includes('ayuda')) {
    return 'Puedo ayudarte con:\n- Gastos del mes\n- Ingresos del mes\n- Balance familiar\n- Análisis por conceptos\n\n¿Sobre qué quieres preguntar?';
  }

  return `Este mes:\n- Ingresos: ${income}€\n- Gastos: ${expense}€\n- Balance: ${balance}€\n\n¿Te interesa algo más?`;
}

async function sendNotificationEmail(settings, events, budgets, profile) {
  if (!settings.email_enabled || !settings.email_to || !settings.smtp_user || !settings.smtp_password) {
    return { success: false, reason: 'Email notifications not configured' };
  }

  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  let htmlContent;
  let textContent;

  const hasEvents = events.length > 0;
  const hasBudgets = budgets && budgets.length > 0;

  let budgetsSection = '';
  let budgetsText = '';
  if (hasBudgets) {
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
    const totalRemaining = totalBudget - totalSpent;

    budgetsText = `💰 DISPONIBLE (${today.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })})\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      budgets.map(b => {
        const remaining = b.amount - (b.spent || 0);
        const emoji = remaining >= 0 ? '✅' : '❌';
        return `${emoji} ${b.concept}: ${remaining.toFixed(2)}€`;
      }).join('\n');

    budgetsSection = `
      <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <h3 style="margin: 0 0 16px 0; color: #374151;">💰 Disponible (${today.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })})</h3>
        <table style="width: 100%; font-size: 14px;">
          <tbody>
            ${budgets.map(b => {
              const remaining = b.amount - (b.spent || 0);
              const color = remaining >= 0 ? '#10b981' : '#ef4444';
              return `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 10px 0;">${b.concept}</td>
                  <td style="text-align: right; font-weight: 600; color: ${color};">${remaining.toFixed(2)}€</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  const familyName = profile.family_name || 'Familia';
  
  const dateRangeStr = `${today.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${nextWeek.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  if (!hasEvents) {
    textContent = `Hola ${familyName},\n\nNo hay planes para los pr\u00f3ximos 7 d\u00edas (${dateRangeStr}).\n\n${budgetsText}\n\n\u00a1Que tengas un buen d\u00eda!\n\nSaludos,\nFamily Agent`;
    htmlContent = `<h2>Hola ${familyName}</h2><p>No hay planes para los pr\u00f3ximos 7 d\u00edas (${dateRangeStr}).</p>${budgetsSection}<p>\u00a1Que tengas un buen d\u00eda!</p><p><em>Saludos,<br>Family Agent</em></p>`;
  } else {
    const eventsByDay = events.reduce((acc, e) => {
      const dayName = new Date(e.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
      if (!acc[dayName]) acc[dayName] = [];
      acc[dayName].push(e);
      return acc;
    }, {});
    
    let eventsHtml = `<p>Tienes <strong>${events.length} plan${events.length > 1 ? 'es' : ''}</strong> para los pr\u00f3ximos 7 d\u00edas (${dateRangeStr}):</p>`;
    eventsHtml += '<div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">';
    
    Object.entries(eventsByDay).forEach(([day, dayEvents], dayIdx) => {
      eventsHtml += '<div style="padding: 12px 0; ' + (dayIdx > 0 ? 'border-top: 2px solid #e5e7eb;' : '') + '">';
      eventsHtml += '<h4 style="margin: 0 0 12px 0; color: #4F46E5; font-size: 14px; text-transform: uppercase;">' + day + '</h4>';
      
      dayEvents.forEach((e, i) => {
        const time = e.start_time ? e.start_time + (e.end_time ? ' - ' + e.end_time : '') : 'Todo el d\u00eda';
        const type = e.type ? '<span style="display: inline-block; background: #4F46E5; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-right: 8px;">' + e.type + '</span>' : '';
        const location = e.location ? '<p style="margin: 6px 0 0 0; color: #6b7280; font-size: 13px;">\ud83d\udccd ' + e.location + '</p>' : '';
        const description = e.description ? '<p style="margin: 6px 0 0 0; color: #374151; font-size: 13px;">' + e.description + '</p>' : '';
        
        eventsHtml += '<div style="padding: 8px 0; ' + (i > 0 ? 'border-top: 1px dashed #e5e7eb;' : '') + '">';
        eventsHtml += '<div style="display: flex; align-items: flex-start;">' + type + '<span style="color: #6b7280; font-size: 13px;">\ud83d\udd50 ' + time + '</span></div>';
        eventsHtml += '<div style="font-weight: 600; color: #111827; margin-top: 4px;">' + e.title + '</div>';
        if (description) eventsHtml += description;
        if (location) eventsHtml += location;
        eventsHtml += '</div>';
      });
      
      eventsHtml += '</div>';
    });
    
    eventsHtml += '</div>';

    htmlContent = `<h2>Hola ${familyName}</h2>${eventsHtml}${budgetsSection}<p>\u00a1Que disfrutes!</p><p><em>Saludos,<br>Family Agent</em></p>`;
  }

  const transporter = nodemailer.createTransport({
    host: settings.smtp_host || 'smtp.gmail.com',
    port: settings.smtp_port || 587,
    secure: false,
    auth: {
      user: settings.smtp_user,
      pass: settings.smtp_password
    }
  });

  let subject = '📋 Resumen Family Agent';
  if (hasEvents) subject = `📅 ${events.length} ${events.length === 1 ? 'plan' : 'planes'} para los pr\u00f3ximos 7 d\u00edas`;
  if (hasBudgets) subject += ` | 💰 Disponible: ${(budgets.reduce((sum, b) => sum + b.amount, 0) - budgets.reduce((sum, b) => sum + (b.spent || 0), 0)).toFixed(2)}€`;

  try {
    await transporter.sendMail({
      from: `"Family Agent" <${settings.smtp_user}>`,
      to: settings.email_to,
      subject: subject,
      text: textContent,
      html: htmlContent
    });
    console.log(`Email sent to ${settings.email_to}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, reason: error.message };
  }
}

function expandRecurringEvents(events, startDate, endDate) {
  const expanded = [];
  
  events.forEach(event => {
    if (event.recurrence === 'weekly' && event.days_of_week) {
      const days = event.days_of_week.split(',').map(d => parseInt(d.trim()));
      const cursor = new Date(startDate);
      
      while (cursor <= endDate) {
        if (days.includes(cursor.getDay())) {
          const dateStr = cursor.toISOString().split('T')[0];
          expanded.push({
            ...event,
            id: event.id + '-' + dateStr,
            date: dateStr
          });
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    } else {
      expanded.push(event);
    }
  });
  
  return expanded.sort((a, b) => a.date.localeCompare(b.date) || (a.start_time || '').localeCompare(b.start_time || ''));
}

async function runDailyNotification() {
  try {
    const settingsStmt = db.prepare('SELECT * FROM notification_settings WHERE id = 1');
    let settings = null;
    if (settingsStmt.step()) settings = settingsStmt.getAsObject();
    settingsStmt.free();

    if (!settings?.email_enabled) {
      return;
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const eventsStmt = db.prepare('SELECT * FROM family_events WHERE (date >= ? AND date <= ?) OR recurrence = ? ORDER BY date ASC, start_time ASC');
    eventsStmt.bind([todayStr, nextWeekStr, 'weekly']);
    const events = [];
    while (eventsStmt.step()) {
      events.push(eventsStmt.getAsObject());
    }
    eventsStmt.free();
    
    const expandedEvents = expandRecurringEvents(events, today, nextWeek);

    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const monthStr = String(month).padStart(2, '0');

    const budgetsStmt = db.prepare(`
      SELECT b.*, COALESCE(SUM(CASE WHEN t.type = 'expense' AND t.date LIKE ? THEN t.amount ELSE 0 END), 0) as spent
      FROM budgets b
      LEFT JOIN transactions t ON t.concept = b.concept_key
      GROUP BY b.id
    `);
    budgetsStmt.bind([`${year}-${monthStr}%`]);
    const budgets = [];
    while (budgetsStmt.step()) {
      budgets.push(budgetsStmt.getAsObject());
    }
    budgetsStmt.free();

    const profileStmt = db.prepare('SELECT * FROM user_profile WHERE id = 1');
    let profile = { name: 'Familia' };
    if (profileStmt.step()) profile = profileStmt.getAsObject();
    profileStmt.free();

    await sendNotificationEmail(settings, expandedEvents, budgets, profile);
  } catch (error) {
    console.error('Error in daily notification:', error);
  }
}

app.get('/api/notifications/settings', (req, res) => {
  const stmt = db.prepare('SELECT email_enabled, email_to, smtp_host, smtp_port, smtp_user, notify_time, notify_day_before FROM notification_settings WHERE id = 1');
  let settings = null;
  if (stmt.step()) settings = stmt.getAsObject();
  stmt.free();
  res.json(settings || {});
});

app.post('/api/notifications/settings', (req, res) => {
  const { email_enabled, email_to, smtp_host, smtp_port, smtp_user, smtp_password, notify_time, notify_day_before } = req.body || {};

  const currentStmt = db.prepare('SELECT smtp_password FROM notification_settings WHERE id = 1');
  let current = null;
  if (currentStmt.step()) current = currentStmt.getAsObject();
  currentStmt.free();

  const password = smtp_password || current?.smtp_password || '';

  const stmt = db.prepare(`
    UPDATE notification_settings SET 
      email_enabled = ?,
      email_to = ?,
      smtp_host = ?,
      smtp_port = ?,
      smtp_user = ?,
      smtp_password = ?,
      notify_time = ?,
      notify_day_before = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `);
  stmt.run([
    email_enabled ? 1 : 0,
    email_to || null,
    smtp_host || 'smtp.gmail.com',
    smtp_port || 587,
    smtp_user || null,
    password,
    notify_time || '22:00',
    notify_day_before ? 1 : 0
  ]);
  stmt.free();
  saveDb();

  if (notify_time) {
    scheduleNotification(notify_time);
  }

  res.json({ success: true });
});

app.post('/api/notifications/test', async (req, res) => {
  const { email_to, smtp_host, smtp_port, smtp_user, smtp_password } = req.body || {};

  if (!email_to || !smtp_user || !smtp_password) {
    return res.status(400).json({ error: 'Faltan datos del email' });
  }

  const testEvents = [
    { title: 'Ejemplo: Cita médica', description: 'Esta es una notificación de prueba', start_time: '10:00', end_time: '11:00' }
  ];
  const testProfile = { name: 'Usuario de prueba' };

  const result = await sendNotificationEmail(
    { ...req.body, email_enabled: 1 },
    testEvents,
    testProfile
  );

  if (result.success) {
    res.json({ success: true, message: 'Email de prueba enviado' });
  } else {
    res.status(500).json({ error: 'Error enviando email: ' + result.reason });
  }
});

function scheduleNotification(timeStr) {
  const [hours, minutes] = timeStr.split(':');
  const cronExpr = `${minutes} ${hours} * * *`;
  
  cron.cancelTask('daily-notification');
  cron.schedule('daily-notification', cronExpr, async () => {
    console.log('Running daily notification job...');
    await runDailyNotification();
  });
  console.log(`Notification scheduled for ${timeStr}`);
}

await initDb();

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
