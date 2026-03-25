import express from 'express';
import cors from 'cors';
import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import pkg from 'node-cron';
import multer from 'multer';
import pdf from 'pdf-parse/lib/pdf-parse.js';
const cron = pkg;
const upload = multer({ storage: multer.memoryStorage() });

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
      recurring INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(owner_id, concept, month, year)
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER,
      name TEXT DEFAULT 'Usuario',
      avatar TEXT,
      email TEXT,
      phone TEXT,
      family_name TEXT DEFAULT 'Mi Familia',
      city TEXT,
      currency TEXT DEFAULT 'EUR',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try { db.run(`ALTER TABLE user_profile ADD COLUMN city TEXT`); } catch(e) {}

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
    CREATE TABLE IF NOT EXISTS password_reset_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notification_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER,
      email_enabled INTEGER DEFAULT 0,
      email_to TEXT,
      smtp_host TEXT DEFAULT 'smtp.gmail.com',
      smtp_port INTEGER DEFAULT 587,
      smtp_user TEXT,
      smtp_password TEXT,
      notify_time TEXT DEFAULT '22:00',
      notify_timezone TEXT DEFAULT 'Europe/Madrid',
      notify_day_before INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS family_events (
      id TEXT PRIMARY KEY,
      owner_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      end_date TEXT,
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
      share_dashboard INTEGER DEFAULT 1,
      share_accounting INTEGER DEFAULT 1,
      share_budgets INTEGER DEFAULT 1,
      share_agenda INTEGER DEFAULT 1,
      share_tasks INTEGER DEFAULT 1,
      share_notes INTEGER DEFAULT 0,
      share_shopping INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(from_user_id, to_username)
    )
  `);

  try { db.run(`ALTER TABLE invitations ADD COLUMN share_dashboard INTEGER DEFAULT 1`); } catch(e) {}
  try { db.run(`ALTER TABLE invitations ADD COLUMN share_accounting INTEGER DEFAULT 1`); } catch(e) {}
  try { db.run(`ALTER TABLE invitations ADD COLUMN share_budgets INTEGER DEFAULT 1`); } catch(e) {}
  try { db.run(`ALTER TABLE invitations ADD COLUMN share_agenda INTEGER DEFAULT 1`); } catch(e) {}
  try { db.run(`ALTER TABLE invitations ADD COLUMN share_tasks INTEGER DEFAULT 1`); } catch(e) {}
  try { db.run(`ALTER TABLE invitations ADD COLUMN share_notes INTEGER DEFAULT 0`); } catch(e) {}
  try { db.run(`ALTER TABLE invitations ADD COLUMN share_shopping INTEGER DEFAULT 0`); } catch(e) {}
  try { db.run(`ALTER TABLE invitations ADD COLUMN share_contacts INTEGER DEFAULT 0`); } catch(e) {}
  try { db.run(`ALTER TABLE invitations ADD COLUMN share_recipes INTEGER DEFAULT 0`); } catch(e) {}
  try { db.run(`ALTER TABLE invitations ADD COLUMN share_restaurants INTEGER DEFAULT 0`); } catch(e) {}
  try { db.run(`ALTER TABLE invitations ADD COLUMN share_family_members INTEGER DEFAULT 0`); } catch(e) {}

  db.run(`
    CREATE TABLE IF NOT EXISTS user_shares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      shared_with_id INTEGER NOT NULL,
      share_dashboard INTEGER DEFAULT 1,
      share_accounting INTEGER DEFAULT 1,
      share_budgets INTEGER DEFAULT 1,
      share_agenda INTEGER DEFAULT 1,
      share_tasks INTEGER DEFAULT 1,
      share_notes INTEGER DEFAULT 0,
      share_shopping INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(owner_id, shared_with_id)
    )
  `);

  try { db.run(`ALTER TABLE user_shares ADD COLUMN share_dashboard INTEGER DEFAULT 1`); } catch(e) {}
  try { db.run(`ALTER TABLE user_shares ADD COLUMN share_accounting INTEGER DEFAULT 1`); } catch(e) {}
  try { db.run(`ALTER TABLE user_shares ADD COLUMN share_budgets INTEGER DEFAULT 1`); } catch(e) {}
  try { db.run(`ALTER TABLE user_shares ADD COLUMN share_agenda INTEGER DEFAULT 1`); } catch(e) {}
  try { db.run(`ALTER TABLE user_shares ADD COLUMN share_tasks INTEGER DEFAULT 1`); } catch(e) {}
  try { db.run(`ALTER TABLE user_shares ADD COLUMN share_notes INTEGER DEFAULT 0`); } catch(e) {}
  try { db.run(`ALTER TABLE user_shares ADD COLUMN share_shopping INTEGER DEFAULT 0`); } catch(e) {}
  try { db.run(`ALTER TABLE user_shares ADD COLUMN share_contacts INTEGER DEFAULT 0`); } catch(e) {}
  try { db.run(`ALTER TABLE user_shares ADD COLUMN share_recipes INTEGER DEFAULT 0`); } catch(e) {}
  try { db.run(`ALTER TABLE user_shares ADD COLUMN share_restaurants INTEGER DEFAULT 0`); } catch(e) {}
  try { db.run(`ALTER TABLE user_shares ADD COLUMN share_family_members INTEGER DEFAULT 0`); } catch(e) {}

  try { db.run(`ALTER TABLE family_events ADD COLUMN recurrence TEXT`); } catch(e) {}
  try { db.run(`ALTER TABLE family_events ADD COLUMN days_of_week TEXT`); } catch(e) {}
  try { db.run(`ALTER TABLE family_events ADD COLUMN end_date TEXT`); } catch(e) {}
  try { db.run(`ALTER TABLE transactions ADD COLUMN owner_id INTEGER DEFAULT 1`); } catch(e) {}
  try { db.run(`ALTER TABLE budgets ADD COLUMN owner_id INTEGER DEFAULT 1`); } catch(e) {}
  try { db.run(`ALTER TABLE budgets ADD COLUMN recurring INTEGER DEFAULT 0`); } catch(e) {}
  try { db.run(`ALTER TABLE family_events ADD COLUMN owner_id INTEGER DEFAULT 1`); } catch(e) {}
  try { db.run(`ALTER TABLE expense_concepts ADD COLUMN owner_id INTEGER DEFAULT 0`); } catch(e) {}
  try { db.run(`ALTER TABLE user_profile ADD COLUMN owner_id INTEGER DEFAULT 1`); } catch(e) {}
  try { db.run(`ALTER TABLE notification_settings ADD COLUMN owner_id INTEGER DEFAULT 1`); } catch(e) {}
  try { db.run(`ALTER TABLE notification_settings ADD COLUMN notify_timezone TEXT DEFAULT 'Europe/Madrid'`); } catch(e) {}
  
  db.run(`
    CREATE TABLE IF NOT EXISTS family_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      completed INTEGER DEFAULT 0,
      due_date TEXT,
      priority TEXT DEFAULT 'normal',
      is_family_task INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  try { db.run(`ALTER TABLE family_tasks ADD COLUMN owner_id INTEGER DEFAULT 1`); } catch(e) {}
  try { db.run(`ALTER TABLE family_tasks ADD COLUMN is_family_task INTEGER DEFAULT 0`); } catch(e) {}

  db.run(`
    CREATE TABLE IF NOT EXISTS shopping_lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#22c55e',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  try { db.run(`ALTER TABLE shopping_lists ADD COLUMN owner_id INTEGER DEFAULT 1`); } catch(e) {}
  try { db.run(`ALTER TABLE shopping_lists ADD COLUMN color TEXT DEFAULT '#22c55e'`); } catch(e) {}

  try { db.run(`ALTER TABLE family_tasks ADD COLUMN shopping_list_id INTEGER`); } catch(e) {}
  try { db.run(`ALTER TABLE family_tasks ADD COLUMN assigned_to_id INTEGER`); } catch(e) {}

  db.run(`
    CREATE TABLE IF NOT EXISTS family_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER,
      title TEXT NOT NULL,
      content TEXT,
      category TEXT DEFAULT 'general',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  try { db.run(`ALTER TABLE family_notes ADD COLUMN owner_id INTEGER DEFAULT 1`); } catch(e) {}

  db.run(`
    CREATE TABLE IF NOT EXISTS note_boards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#eab308',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  try { db.run(`ALTER TABLE note_boards ADD COLUMN owner_id INTEGER DEFAULT 1`); } catch(e) {}
  try { db.run(`ALTER TABLE note_boards ADD COLUMN color TEXT DEFAULT '#eab308'`); } catch(e) {}

  try { db.run(`ALTER TABLE family_notes ADD COLUMN board_id INTEGER`); } catch(e) {}

  db.run(`DROP TABLE IF EXISTS favorite_restaurants`);
  db.run(`
    CREATE TABLE favorite_restaurants (
      id TEXT PRIMARY KEY,
      owner_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      cuisine_type TEXT,
      rating INTEGER DEFAULT 3,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS family_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      age_group TEXT,
      restrictions TEXT,
      allergies TEXT,
      intolerances TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS meal_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      week_start TEXT NOT NULL,
      day_of_week TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      recipe_id TEXT,
      recipe_name TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS faqs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      order_index INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const faqCheck = db.exec('SELECT COUNT(*) as count FROM faqs');
  if (faqCheck.length === 0 || faqCheck[0].values[0][0] === 0) {
    const defaultFaqs = [
      ['¿Cómo creo una cuenta?', 'Pide al administrador que te cree un usuario desde el panel de administración. Recibirás tus credenciales por email o directamente del administrador.', 1],
      ['¿Cómo registro un gasto?', 'Ve a la sección "Contabilidad" y haz clic en "Nueva Transacción". Selecciona el tipo (gasto/ingreso), introduce la cantidad, descripción, concepto y fecha.', 2],
      ['¿Qué son los conceptos de gasto?', 'Los conceptos categorizan tus gastos (Comida, Gasolina, Alquiler, etc.). Puedes editarlos según tus necesidades desde la configuración.', 3],
      ['¿Cómo funciona el presupuesto mensual?', 'En "Presupuestos" puedes establecer límites mensuales para cada concepto. El sistema te mostrará cuánto has gastado y cuánto te queda disponible.', 4],
      ['¿Puedo compartir mis datos con otros usuarios?', 'Sí. Desde tu perfil puedes invitar a otros usuarios a ver tus datos familiares. Ellos podrán ver tus transacciones, presupuestos y eventos, pero no modificarlos.', 5],
      ['¿Cómo funcionan las notificaciones por email?', 'En tu perfil, activa las notificaciones y configura tu cuenta SMTP. Recibirás un resumen diario con tus gastos y los eventos próximos.', 6],
      ['¿El chatbot puede ayudarme con mis finanzas?', 'Sí, el asistente IA puede analizar tus datos, explicar gastos, darte consejos de ahorro y responder preguntas sobre tu situación financiera.', 7],
      ['¿Mis datos están seguros?', 'Sí. Cada usuario tiene sus propios datos aislados. Solo tú y las personas que tú invites pueden ver tu información.', 8],
      ['¿Puedo importar datos de Excel?', 'Sí, en la sección Contabilidad hay un botón para importar transacciones desde un archivo Excel.', 9],
      ['¿Cómo cambio mi contraseña?', 'Puedes recuperarla desde la pantalla de login usando la opción "Olvidé mi contraseña". Recibirás un código por email que caducará en 15 minutos.', 10]
    ];
    const stmt = db.prepare('INSERT INTO faqs (question, answer, order_index) VALUES (?, ?, ?)');
    for (const faq of defaultFaqs) {
      stmt.run(faq);
    }
    stmt.free();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER,
      type TEXT DEFAULT 'idea',
      subject TEXT,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS family_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      relationship TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS family_gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      image_data TEXT NOT NULL,
      album TEXT DEFAULT 'General',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
try { db.run(`ALTER TABLE family_gallery ADD COLUMN owner_id INTEGER DEFAULT 1`); } catch(e) {}

  db.run(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      ingredients TEXT,
      instructions TEXT,
      prep_time INTEGER,
      cook_time INTEGER,
      servings INTEGER DEFAULT 4,
      category TEXT DEFAULT 'main',
      restrictions TEXT,
      contains TEXT,
      is_favorite INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
try { db.run(`ALTER TABLE recipes ADD COLUMN owner_id INTEGER DEFAULT 1`); } catch(e) {}

  db.run(`
    CREATE TABLE IF NOT EXISTS meal_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      week_start TEXT NOT NULL,
      day_of_week INTEGER NOT NULL,
      meal_type TEXT NOT NULL,
      recipe_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
try { db.run(`ALTER TABLE meal_plans ADD COLUMN owner_id INTEGER DEFAULT 1`); } catch(e) {}

  db.run(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER,
      name TEXT,
      email TEXT,
      subject TEXT,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sales_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER,
      company_name TEXT,
      contact_name TEXT,
      email TEXT,
      phone TEXT,
      employees TEXT,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDb();
}

function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex');
}

function validatePassword(password) {
  const errors = [];
  if (password.length < 8) errors.push('Al menos 8 caracteres');
  if (!/[A-Z]/.test(password)) errors.push('Una mayúscula');
  if (!/[a-z]/.test(password)) errors.push('Una minúscula');
  if (!/[0-9]/.test(password)) errors.push('Un número');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Un carácter especial');
  return { valid: errors.length === 0, errors };
}

function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(DB_FILE, buffer);
}

function getCurrentUserId(headers) {
  const { username, password, userId } = headers || {};
  
  if (userId) {
    const numericUserId = parseInt(userId, 10);
    if (!isNaN(numericUserId)) {
      const stmt = db.prepare('SELECT id FROM auth_user WHERE id = ? AND status IN ("approved", "active")');
      stmt.bind([numericUserId]);
      let foundUserId = null;
      if (stmt.step()) {
        foundUserId = stmt.getAsObject().id;
      }
      stmt.free();
      if (foundUserId) return foundUserId;
    }
  }
  
  if (username && password) {
    const stmt = db.prepare('SELECT id FROM auth_user WHERE username = ? AND status IN ("approved", "active")');
    stmt.bind([username]);
    let foundUserId = null;
    if (stmt.step()) {
      foundUserId = stmt.getAsObject().id;
    }
    stmt.free();
    return foundUserId;
  }
  
  return null;
}

function checkAdmin(headers) {
  const { username, password } = headers || {};
  if (!username || !password) return false;
  
  const stmt = db.prepare('SELECT is_admin FROM auth_user WHERE username = ? AND status IN ("approved", "active")');
  stmt.bind([username]);
  let isAdmin = false;
  if (stmt.step()) {
    isAdmin = stmt.getAsObject().is_admin === 1;
  }
  stmt.free();
  return isAdmin;
}

function getAccessibleUserIds(ownerId, module = null) {
  const ids = [ownerId];
  
  if (!module) {
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
  } else {
    const stmt = db.prepare(`SELECT shared_with_id FROM user_shares WHERE owner_id = ? AND ${module} = 1`);
    stmt.bind([ownerId]);
    while (stmt.step()) {
      ids.push(stmt.getAsObject().shared_with_id);
    }
    stmt.free();
    
    const stmt2 = db.prepare(`SELECT owner_id FROM user_shares WHERE shared_with_id = ? AND ${module} = 1`);
    stmt2.bind([ownerId]);
    while (stmt2.step()) {
      ids.push(stmt2.getAsObject().owner_id);
    }
    stmt2.free();
  }
  
  return [...new Set(ids)];
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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

  const adminCheck = db.exec('SELECT COUNT(*) as count FROM auth_user WHERE is_admin = 1');
  const adminCount = adminCheck.length > 0 ? adminCheck[0].values[0][0] : 0;
  
  const salt = crypto.randomBytes(16).toString('hex');
  const password_hash = hashPassword(password, salt);

  try {
    const stmt = db.prepare('INSERT INTO auth_user (username, password_hash, salt, status, is_admin) VALUES (?, ?, ?, ?, ?)');
    if (adminCount === 0) {
      stmt.run([username.trim(), password_hash, salt, 'active', 1]);
      stmt.free();
      saveDb();
      return res.json({ success: true, message: 'Usuario creado como administrador.', isAdmin: true });
    } else {
      stmt.run([username.trim(), password_hash, salt, 'pending', 0]);
      stmt.free();
      saveDb();
      return res.json({ success: true, message: 'Usuario creado. Espera aprobación del administrador.', isAdmin: false });
    }
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ error: 'Error creando usuario' });
  }
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { username } = req.body || {};
  
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Usuario requerido' });
  }

  const userStmt = db.prepare('SELECT id FROM auth_user WHERE username = ?');
  userStmt.bind([username.trim()]);
  const user = userStmt.step() ? userStmt.getAsObject() : null;
  userStmt.free();

  if (!user) {
    return res.json({ success: true, message: 'Si el usuario existe, recibirás un código de recuperación' });
  }

  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  db.run('DELETE FROM password_reset_codes WHERE username = ?', [username.trim()]);
  
  const insertStmt = db.prepare('INSERT INTO password_reset_codes (username, code, expires_at) VALUES (?, ?, ?)');
  insertStmt.run([username.trim(), code, expiresAt]);
  insertStmt.free();
  saveDb();

  const userProfileStmt = db.prepare('SELECT email FROM user_profile WHERE owner_id = (SELECT id FROM auth_user WHERE username = ?)');
  userProfileStmt.bind([username.trim()]);
  const userProfile = userProfileStmt.step() ? userProfileStmt.getAsObject() : null;
  userProfileStmt.free();

  if (userProfile?.email) {
    const resetUrl = `${process.env.APP_URL || 'http://localhost:5173'}?reset=${code}`;
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@familyagent.local',
      to: userProfile.email,
      subject: 'Código de recuperación de contraseña - Family Agent',
      text: `Tu código de recuperación es: ${code}\n\nEste código expira en 15 minutos.\n\nSi no solicitaste este código, ignóralo.`
    };

    if (transporter) {
      transporter.sendMail(mailOptions, (err) => {
        if (err) console.error('Error sending email:', err);
      });
    }
  }

  console.log(`Código de recuperación para ${username}: ${code}`);

  res.json({ 
    success: true, 
    message: userProfile?.email 
      ? 'Si el usuario existe, recibirás un email con el código' 
      : 'Código de recuperación generado',
    code: code,
    debug: !userProfile?.email
  });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { username, code, newPassword } = req.body || {};

  if (!username || !code || !newPassword) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  const { valid, errors } = validatePassword(newPassword);
  if (!valid) {
    return res.status(400).json({ error: 'Contraseña inválida: ' + errors.join(', ') });
  }

  const codeStmt = db.prepare('SELECT * FROM password_reset_codes WHERE username = ? AND code = ? AND used = 0 AND expires_at > ?');
  codeStmt.bind([username.trim(), code.toUpperCase(), new Date().toISOString()]);
  const resetCode = codeStmt.step() ? codeStmt.getAsObject() : null;
  codeStmt.free();

  if (!resetCode) {
    return res.status(400).json({ error: 'Código inválido o expirado' });
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const password_hash = hashPassword(newPassword, salt);

  const updateStmt = db.prepare('UPDATE auth_user SET password_hash = ?, salt = ? WHERE username = ?');
  updateStmt.run([password_hash, salt, username.trim()]);
  updateStmt.free();

  db.run('UPDATE password_reset_codes SET used = 1 WHERE id = ?', [resetCode.id]);
  saveDb();

  res.json({ success: true, message: 'Contraseña actualizada correctamente' });
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

app.get('/api/users', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });

  const usersStmt = db.prepare('SELECT id, username FROM auth_user WHERE status IN ("approved", "active") AND id != ? ORDER BY username');
  usersStmt.bind([userId]);
  const users = [];
  while (usersStmt.step()) {
    users.push(usersStmt.getAsObject());
  }
  usersStmt.free();

  return res.json(users);
});

app.post('/api/auth/admin/user/create', (req, res) => {
  const { username, password } = req.headers || {};
  const { username: newUsername, password: newPassword } = req.body;

  if (!username || !password) return res.status(401).json({ error: 'No autorizado' });

  const stmt = db.prepare('SELECT id, is_admin FROM auth_user WHERE username = ?');
  stmt.bind([username]);
  let admin = null;
  if (stmt.step()) admin = stmt.getAsObject();
  stmt.free();

  if (!admin || !admin.is_admin) return res.status(403).json({ error: 'Solo administradores' });

  if (!newUsername || newUsername.length < 3) {
    return res.status(400).json({ error: 'El nombre de usuario debe tener al menos 3 caracteres' });
  }
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres' });
  }

  const checkStmt = db.prepare('SELECT id FROM auth_user WHERE username = ?');
  checkStmt.bind([newUsername]);
  if (checkStmt.step()) {
    checkStmt.free();
    return res.status(409).json({ error: 'El nombre de usuario ya existe' });
  }
  checkStmt.free();

  try {
    const salt = Math.random().toString(36).substring(2);
    const hash = hashPassword(newPassword, salt);
    const insertStmt = db.prepare('INSERT INTO auth_user (username, password_hash, salt, is_admin, status) VALUES (?, ?, ?, 0, "approved")');
    insertStmt.run([newUsername, hash, salt]);
    insertStmt.free();
    
    const lastId = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    
    const profileStmt = db.prepare('INSERT INTO user_profile (owner_id, name) VALUES (?, ?)');
    profileStmt.run([lastId, 'Usuario']);
    profileStmt.free();
    
    saveDb();
    return res.json({ success: true, userId: lastId });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Error creando usuario' });
  }
});

app.get('/api/auth/admin/stats', (req, res) => {
  const { username, password } = req.headers || {};

  if (!username || !password) return res.status(401).json({ error: 'No autorizado' });

  const stmt = db.prepare('SELECT id, is_admin FROM auth_user WHERE username = ?');
  stmt.bind([username]);
  let admin = null;
  if (stmt.step()) admin = stmt.getAsObject();
  stmt.free();

  if (!admin || !admin.is_admin) return res.status(403).json({ error: 'Solo administradores' });

  const stats = { total: 0, active: 0, blocked: 0, pending: 0, admins: 0, totalTransactions: 0, totalBudgets: 0 };

  const countStmt = db.prepare('SELECT status, COUNT(*) as count FROM auth_user GROUP BY status');
  while (countStmt.step()) {
    const row = countStmt.getAsObject();
    stats.total += row.count;
    if (row.status === 'approved') stats.active++;
    else if (row.status === 'blocked') stats.blocked++;
    else if (row.status === 'pending') stats.pending++;
  }
  countStmt.free();

  const adminStmt = db.prepare('SELECT COUNT(*) as count FROM auth_user WHERE is_admin = 1');
  adminStmt.step();
  stats.admins = adminStmt.getAsObject().count;
  adminStmt.free();

  const transStmt = db.prepare('SELECT COUNT(*) as count FROM transactions');
  transStmt.step();
  stats.totalTransactions = transStmt.getAsObject().count;
  transStmt.free();

  const budgetStmt = db.prepare('SELECT COUNT(*) as count FROM budgets');
  budgetStmt.step();
  stats.totalBudgets = budgetStmt.getAsObject().count;
  budgetStmt.free();

  return res.json(stats);
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

app.get('/api/settings/login-image', (req, res) => {
  const imageStmt = db.prepare('SELECT value FROM app_settings WHERE key = ?');
  imageStmt.bind(['loginImage']);
  const imageResult = imageStmt.step() ? imageStmt.getAsObject() : null;
  imageStmt.free();

  const showLockStmt = db.prepare('SELECT value FROM app_settings WHERE key = ?');
  showLockStmt.bind(['loginShowLock']);
  const showLockResult = showLockStmt.step() ? showLockStmt.getAsObject() : null;
  showLockStmt.free();

  res.json({ 
    image: imageResult?.value || '',
    showLock: showLockResult?.value !== 'false'
  });
});

app.put('/api/settings/login-image', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { username, password } = req.headers || {};
  const stmt = db.prepare('SELECT is_admin FROM auth_user WHERE username = ?');
  stmt.bind([username]);
  let admin = null;
  if (stmt.step()) admin = stmt.getAsObject();
  stmt.free();
  
  if (!admin || !admin.is_admin) return res.status(403).json({ error: 'Solo administradores' });
  
  const { image, showLock } = req.body;
  
  const upsertStmt = db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)');
  upsertStmt.run(['loginImage', image || '']);
  upsertStmt.free();
  
  if (typeof showLock === 'boolean') {
    const lockStmt = db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)');
    lockStmt.run(['loginShowLock', String(showLock)]);
    lockStmt.free();
  }
  
  saveDb();
  res.json({ success: true });
});

app.get('/api/events', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { from, to } = req.query;
  const accessibleIds = getAccessibleUserIds(userId, 'share_agenda');
  const placeholders = accessibleIds.map(() => '?').join(',');

  let query = `SELECT * FROM family_events WHERE owner_id IN (${placeholders})`;
  const params = [...accessibleIds];

  if (from && to) {
    query += ' AND (date BETWEEN ? AND ? OR recurrence IN (?, ?))';
    params.push(String(from), String(to), 'weekly', 'daily');
  } else if (from) {
    query += ' AND (date >= ? OR recurrence IN (?, ?))';
    params.push(String(from), 'weekly', 'daily');
  } else if (to) {
    query += ' AND (date <= ? OR recurrence IN (?, ?))';
    params.push(String(to), 'weekly', 'daily');
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
      if ((event.recurrence === 'weekly' || event.recurrence === 'daily') && event.days_of_week) {
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
  
  const { id, title, description, date, end_date, start_time, end_time, type, location, recurrence, days_of_week } = req.body || {};

  if (!id || !title || !date) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const stmt = db.prepare(`
    INSERT INTO family_events (id, owner_id, title, description, date, end_date, start_time, end_time, type, location, recurrence, days_of_week)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    stmt.run([id, userId, title, description || null, date, end_date || null, start_time || null, end_time || null, type || null, location || null, recurrence || null, days_of_week || null]);
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
  const { title, description, date, end_date, start_time, end_time, type, location, recurrence, days_of_week } = req.body || {};

  if (!title || !date) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const stmt = db.prepare(`
    UPDATE family_events
    SET title = ?, description = ?, date = ?, end_date = ?, start_time = ?, end_time = ?, type = ?, location = ?, recurrence = ?, days_of_week = ?
    WHERE id = ? AND owner_id = ?
  `);

  try {
    stmt.run([title, description || null, date, end_date || null, start_time || null, end_time || null, type || null, location || null, recurrence || null, days_of_week || null, id, userId]);
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
  const accessibleIds = getAccessibleUserIds(userId, 'share_accounting');
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
  const accessibleIds = getAccessibleUserIds(userId, 'share_accounting');
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

app.get('/api/transactions/months', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const accessibleIds = getAccessibleUserIds(userId, 'share_accounting');
  const placeholders = accessibleIds.map(() => '?').join(',');
  
  try {
    const stmt = db.prepare(`
      SELECT DISTINCT strftime('%Y', date) as year, strftime('%m', date) as month
      FROM transactions
      WHERE owner_id IN (${placeholders})
      ORDER BY year DESC, month DESC
    `);
    stmt.bind([...accessibleIds]);
    
    const months = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      months.push({
        year: parseInt(row.year),
        month: parseInt(row.month)
      });
    }
    stmt.free();
    
    res.json(months);
  } catch (error) {
    console.error('Error fetching months:', error);
    res.status(500).json({ error: 'Error fetching months' });
  }
});

app.get('/api/transactions/monthly', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { months = 12 } = req.query;
  const numMonths = parseInt(months) || 12;
  const accessibleIds = getAccessibleUserIds(userId, 'share_accounting');
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
  const accessibleIds = getAccessibleUserIds(userId, 'share_accounting');
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
  const accessibleIds = getAccessibleUserIds(userId, 'share_budgets');
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
  
  const { id, concept, amount, month, year, recurring } = req.body;
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO budgets (id, owner_id, concept, amount, month, year, recurring)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  try {
    stmt.run([id, userId, concept, amount, parseInt(month), parseInt(year), recurring ? 1 : 0]);
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
  const { concept, amount, month, year, recurring } = req.body || {};

  if (!concept || typeof amount !== 'number' || typeof month !== 'number' || typeof year !== 'number') {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const stmt = db.prepare(`
    UPDATE budgets
    SET concept = ?, amount = ?, month = ?, year = ?, recurring = ?
    WHERE id = ? AND owner_id = ?
  `);

  try {
    stmt.run([concept, amount, parseInt(month), parseInt(year), recurring ? 1 : 0, id, userId]);
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

app.post('/api/budgets/copy-recurring', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { fromMonth, fromYear, toMonth, toYear } = req.body;
  const sourceMonth = fromMonth || new Date().getMonth() + 1;
  const sourceYear = fromYear || new Date().getFullYear();
  const targetMonth = toMonth || (sourceMonth === 12 ? 1 : sourceMonth + 1);
  const targetYear = toYear || (sourceMonth === 12 ? sourceYear + 1 : sourceYear);
  
  try {
    const stmt = db.prepare('SELECT * FROM budgets WHERE recurring = 1 AND owner_id = ? AND month = ? AND year = ?');
    stmt.bind([userId, sourceMonth, sourceYear]);
    
    const newStmt = db.prepare('INSERT INTO budgets (id, owner_id, concept, amount, month, year, recurring) VALUES (?, ?, ?, ?, ?, ?, 1)');
    
    let copied = 0;
    while (stmt.step()) {
      const budget = stmt.getAsObject();
      newStmt.run([
        crypto.randomUUID(),
        userId,
        budget.concept,
        budget.amount,
        targetMonth,
        targetYear
      ]);
      copied++;
    }
    stmt.free();
    newStmt.free();
    saveDb();
    
    res.json({ success: true, copied, month: targetMonth, year: targetYear });
  } catch (error) {
    console.error('Error copying recurring budgets:', error);
    res.status(500).json({ error: 'Error copying recurring budgets' });
  }
});

app.get('/api/budgets/with-spending', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { month, year } = req.query;
  const accessibleIds = getAccessibleUserIds(userId, 'share_budgets');
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

app.get('/api/me', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const stmt = db.prepare('SELECT id, username FROM auth_user WHERE id = ?');
  stmt.bind([userId]);
  let user = null;
  if (stmt.step()) user = stmt.getAsObject();
  stmt.free();
  
  res.json(user);
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
    try {
      stmt = db.prepare('INSERT INTO user_profile (owner_id, name) VALUES (?, ?)');
      stmt.run([userId, 'Usuario']);
      stmt.free();
      saveDb();
      
      stmt = db.prepare('SELECT * FROM user_profile WHERE owner_id = ?');
      stmt.bind([userId]);
      if (stmt.step()) profile = stmt.getAsObject();
      stmt.free();
    } catch (e) {
      console.error('Error creating profile:', e);
    }
  }
  
  const baseProfile = profile || { id: userId, name: 'Usuario', family_name: 'Mi Familia', currency: 'EUR' };
  
  const dashboardIds = getAccessibleUserIds(userId, 'share_dashboard');
  const familyMembersStmt = db.prepare(`SELECT * FROM family_members WHERE owner_id IN (${dashboardIds.map(() => '?').join(',')}) ORDER BY owner_id, name`);
  familyMembersStmt.bind(dashboardIds);
  const familyMembers = [];
  while (familyMembersStmt.step()) familyMembers.push(familyMembersStmt.getAsObject());
  familyMembersStmt.free();
  
  const familyProfiles = [];
  if (dashboardIds.length > 1) {
    const profileStmt = db.prepare(`SELECT * FROM user_profile WHERE owner_id IN (${dashboardIds.map(() => '?').join(',')})`);
    profileStmt.bind(dashboardIds);
    while (profileStmt.step()) familyProfiles.push(profileStmt.getAsObject());
    profileStmt.free();
  }
  
  res.json({ ...baseProfile, familyMembers, familyProfiles });
});

app.put('/api/profile', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { name, avatar, email, phone, family_name, city, currency } = req.body;
  
  try {
    const checkStmt = db.prepare('SELECT id FROM user_profile WHERE owner_id = ?');
    checkStmt.bind([userId]);
    const hasRows = checkStmt.step();
    checkStmt.free();
    
    if (hasRows) {
      const stmt = db.prepare(`
        UPDATE user_profile 
        SET name = ?, avatar = ?, email = ?, phone = ?, family_name = ?, city = ?, currency = ?, updated_at = CURRENT_TIMESTAMP
        WHERE owner_id = ?
      `);
      stmt.run([name || null, avatar || null, email || null, phone || null, family_name || 'Mi Familia', city || null, currency || 'EUR', userId]);
      stmt.free();
    } else {
      const stmt = db.prepare(`
        INSERT INTO user_profile (owner_id, name, avatar, email, phone, family_name, city, currency)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run([userId, name || 'Usuario', avatar || null, email || null, phone || null, family_name || 'Mi Familia', city || null, currency || 'EUR']);
      stmt.free();
    }
    
    saveDb();
    
    const updatedStmt = db.prepare('SELECT * FROM user_profile WHERE owner_id = ?');
    updatedStmt.bind([userId]);
    if (updatedStmt.step()) {
      const profile = updatedStmt.getAsObject();
      updatedStmt.free();
      res.json(profile);
    } else {
      updatedStmt.free();
      res.status(404).json({ error: 'Perfil no encontrado' });
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Error updating profile' });
  }
});

app.get('/api/weather', async (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  try {
    const profileStmt = db.prepare('SELECT city FROM user_profile WHERE owner_id = ?');
    profileStmt.bind([userId]);
    let city = null;
    if (profileStmt.step()) {
      city = profileStmt.getAsObject().city;
    }
    profileStmt.free();
    
    if (!city) {
      return res.json({ error: 'Ciudad no configurada', temperature: null, description: null });
    }
    
    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
    const geoData = await geoResponse.json();
    
    if (!geoData.results || geoData.results.length === 0) {
      return res.json({ error: 'Ciudad no encontrada', temperature: null, description: null });
    }
    
    const { latitude, longitude } = geoData.results[0];
    
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`
    );
    const weatherData = await weatherResponse.json();
    
    const temp = weatherData.current?.temperature_2m;
    const weatherCode = weatherData.current?.weather_code;
    
    const weatherDescriptions = {
      0: 'Despejado',
      1: 'Mayormente despejado',
      2: 'Parcialmente nublado',
      3: 'Nublado',
      45: 'Niebla',
      48: 'Niebla',
      51: 'Llovizna ligera',
      53: 'Llovizna',
      55: 'Llovizna densa',
      61: 'Lluvia ligera',
      63: 'Lluvia',
      65: 'Lluvia intensa',
      71: 'Nieve ligera',
      73: 'Nieve',
      75: 'Nieve intensa',
      80: 'Chubascos ligeros',
      81: 'Chubascos',
      82: 'Chubascos intensos',
      95: 'Tormenta'
    };
    
    const description = weatherDescriptions[weatherCode] || 'Desconocido';
    const isRainy = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95].includes(weatherCode);
    const isSnowy = [71, 73, 75].includes(weatherCode);
    
    res.json({
      city,
      temperature: temp,
      description,
      isRainy,
      isSnowy,
      weatherCode
    });
  } catch (error) {
    console.error('Weather API error:', error);
    res.status(500).json({ error: 'Error obteniendo el clima' });
  }
});

app.get('/api/export', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  try {
    const exportData = {
      exported_at: new Date().toISOString(),
      version: '2.0'
    };
    
    const tables = [
      { name: 'user_profile', query: 'SELECT * FROM user_profile WHERE owner_id = ?' },
      { name: 'transactions', query: 'SELECT * FROM transactions WHERE owner_id = ? ORDER BY date DESC' },
      { name: 'budgets', query: 'SELECT * FROM budgets WHERE owner_id = ?' },
      { name: 'family_events', query: 'SELECT * FROM family_events WHERE owner_id = ? ORDER BY date ASC' },
      { name: 'expense_concepts', query: 'SELECT * FROM expense_concepts WHERE owner_id = ? OR owner_id = 0' },
      { name: 'family_tasks', query: 'SELECT * FROM family_tasks WHERE owner_id = ?' },
      { name: 'family_members', query: 'SELECT * FROM family_members WHERE owner_id = ?' },
      { name: 'family_notes', query: 'SELECT * FROM family_notes WHERE owner_id = ? ORDER BY updated_at DESC' },
      { name: 'note_boards', query: 'SELECT * FROM note_boards WHERE owner_id = ?' },
      { name: 'shopping_lists', query: 'SELECT * FROM shopping_lists WHERE owner_id = ?' },
      { name: 'family_contacts', query: 'SELECT * FROM family_contacts WHERE owner_id = ?' },
      { name: 'favorite_restaurants', query: 'SELECT * FROM favorite_restaurants WHERE owner_id = ?' },
      { name: 'recipes', query: 'SELECT * FROM recipes WHERE owner_id = ?' },
      { name: 'meal_plans', query: 'SELECT * FROM meal_plans WHERE owner_id = ?' },
      { name: 'family_gallery', query: 'SELECT * FROM family_gallery WHERE owner_id = ?' },
      { name: 'invitations', query: 'SELECT * FROM invitations WHERE from_user_id = ? OR to_user_id = ?' },
      { name: 'user_shares', query: 'SELECT * FROM user_shares WHERE owner_id = ? OR shared_with_id = ?' }
    ];
    
    for (const table of tables) {
      const stmt = db.prepare(table.query);
      if (table.query.includes('to_user_id') || table.query.includes('shared_with_id')) {
        stmt.bind([userId, userId]);
      } else {
        stmt.bind([userId]);
      }
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();
      exportData[table.name] = rows;
    }
    
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Error exporting data' });
  }
});

app.post('/api/import', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  try {
    const data = req.body;
    
    if (data.transactions && Array.isArray(data.transactions)) {
      for (const t of data.transactions) {
        try {
          const stmt = db.prepare('INSERT INTO transactions (owner_id, type, amount, category, description, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
          stmt.run([userId, t.type, t.amount, t.category, t.description || null, t.date, t.created_at || new Date().toISOString()]);
          stmt.free();
        } catch (e) {}
      }
    }
    
    if (data.budgets && Array.isArray(data.budgets)) {
      for (const b of data.budgets) {
        try {
          const stmt = db.prepare('INSERT INTO budgets (owner_id, category, amount, month, year) VALUES (?, ?, ?, ?, ?)');
          stmt.run([userId, b.category, b.amount, b.month, b.year]);
          stmt.free();
        } catch (e) {}
      }
    }
    
    if (data.events && Array.isArray(data.events)) {
      for (const e of data.events) {
        try {
          const stmt = db.prepare('INSERT INTO family_events (owner_id, title, date, type, description, recurrence, days_of_week) VALUES (?, ?, ?, ?, ?, ?, ?)');
          stmt.run([userId, e.title, e.date, e.type || "family", e.description || null, e.recurrence || null, e.days_of_week || null]);
          stmt.free();
        } catch (e) {}
      }
    }
    
    if (data.tasks && Array.isArray(data.tasks)) {
      for (const t of data.tasks) {
        try {
          const stmt = db.prepare('INSERT INTO family_tasks (owner_id, title, description, completed, due_date, priority, is_family_task, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
          stmt.run([userId, t.title, t.description || null, t.completed || 0, t.due_date || null, t.priority || 'normal', t.is_family_task || 0, t.created_at || new Date().toISOString()]);
          stmt.free();
        } catch (e) {}
      }
    }
    
    if (data.family_members && Array.isArray(data.family_members)) {
      for (const m of data.family_members) {
        try {
          const stmt = db.prepare('INSERT INTO family_members (owner_id, name, relationship, birthdate, avatar, notes) VALUES (?, ?, ?, ?, ?, ?)');
          stmt.run([userId, m.name, m.relationship || null, m.birthdate || null, m.avatar || null, m.notes || null]);
          stmt.free();
        } catch (e) {}
      }
    }
    
    if (data.family_notes && Array.isArray(data.family_notes)) {
      for (const n of data.family_notes) {
        try {
          const stmt = db.prepare('INSERT INTO family_notes (owner_id, title, content, board_id, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
          stmt.run([userId, n.title, n.content || null, n.board_id || null, n.color || null, n.created_at || new Date().toISOString(), n.updated_at || new Date().toISOString()]);
          stmt.free();
        } catch (e) {}
      }
    }
    
    if (data.note_boards && Array.isArray(data.note_boards)) {
      for (const b of data.note_boards) {
        try {
          const stmt = db.prepare('INSERT INTO note_boards (owner_id, name, color, created_at) VALUES (?, ?, ?, ?)');
          stmt.run([userId, b.name, b.color || null, b.created_at || new Date().toISOString()]);
          stmt.free();
        } catch (e) {}
      }
    }
    
    if (data.shopping_lists && Array.isArray(data.shopping_lists)) {
      for (const s of data.shopping_lists) {
        try {
          const stmt = db.prepare('INSERT INTO shopping_lists (owner_id, name, items, created_at, updated_at) VALUES (?, ?, ?, ?, ?)');
          stmt.run([userId, s.name, s.items || '[]', s.created_at || new Date().toISOString(), s.updated_at || new Date().toISOString()]);
          stmt.free();
        } catch (e) {}
      }
    }
    
    if (data.family_contacts && Array.isArray(data.family_contacts)) {
      for (const c of data.family_contacts) {
        try {
          const stmt = db.prepare('INSERT INTO family_contacts (owner_id, name, phone, email, address, notes, category) VALUES (?, ?, ?, ?, ?, ?, ?)');
          stmt.run([userId, c.name, c.phone || null, c.email || null, c.address || null, c.notes || null, c.category || null]);
          stmt.free();
        } catch (e) {}
      }
    }
    
    if (data.favorite_restaurants && Array.isArray(data.favorite_restaurants)) {
      for (const r of data.favorite_restaurants) {
        try {
          const stmt = db.prepare('INSERT INTO favorite_restaurants (owner_id, name, address, phone, cuisine_type, notes, rating, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
          stmt.run([userId, r.name, r.address || null, r.phone || null, r.cuisine_type || null, r.notes || null, r.rating || 3, r.created_at || new Date().toISOString()]);
          stmt.free();
        } catch (e) {}
      }
    }
    
    if (data.recipes && Array.isArray(data.recipes)) {
      for (const r of data.recipes) {
        try {
          const stmt = db.prepare('INSERT INTO recipes (owner_id, name, ingredients, instructions, prep_time, cook_time, servings, category, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
          stmt.run([userId, r.name, r.ingredients || null, r.instructions || null, r.prep_time || null, r.cook_time || null, r.servings || null, r.category || null, r.notes || null, r.created_at || new Date().toISOString()]);
          stmt.free();
        } catch (e) {}
      }
    }
    
    if (data.meal_plans && Array.isArray(data.meal_plans)) {
      for (const m of data.meal_plans) {
        try {
          const stmt = db.prepare('INSERT INTO meal_plans (owner_id, date, meal_type, recipe_id, recipe_name, notes) VALUES (?, ?, ?, ?, ?, ?)');
          stmt.run([userId, m.date, m.meal_type || null, m.recipe_id || null, m.recipe_name || null, m.notes || null]);
          stmt.free();
        } catch (e) {}
      }
    }
    
    if (data.family_gallery && Array.isArray(data.family_gallery)) {
      for (const g of data.family_gallery) {
        try {
          const stmt = db.prepare('INSERT INTO family_gallery (owner_id, title, image, description, created_at) VALUES (?, ?, ?, ?, ?)');
          stmt.run([userId, g.title || null, g.image || null, g.description || null, g.created_at || new Date().toISOString()]);
          stmt.free();
        } catch (e) {}
      }
    }
    
    saveDb();
    res.json({ success: true, message: 'Datos importados correctamente' });
  } catch (error) {
    console.error('Error importing data:', error);
    res.status(500).json({ error: 'Error importing data' });
  }
});

app.get('/api/export/db', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const isAdmin = checkAdmin(req.headers);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Solo administradores pueden exportar la base de datos' });
  }
  
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    
    const filename = `family_agent_backup_${new Date().toISOString().split('T')[0]}.db`;
    
    res.setHeader('Content-Type', 'application/x-sqlite3');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting database:', error);
    res.status(500).json({ error: 'Error exportando la base de datos' });
  }
});

app.post('/api/import/db', upload.single('file'), async (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const isAdmin = checkAdmin(req.headers);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Solo administradores pueden importar bases de datos' });
  }
  
  if (!req.file) {
    return res.status(400).json({ error: 'No se ha proporcionado ningún archivo' });
  }
  
  try {
    const backupDb = new (await initSqlJs()).Database(req.file.buffer);
    
    const tables = ['transactions', 'budgets', 'family_events', 'family_tasks', 'family_notes', 'note_boards', 'family_members', 'shopping_lists', 'family_contacts', 'favorite_restaurants', 'recipes', 'meal_plans', 'family_gallery', 'auth_user', 'user_profile', 'notification_settings', 'expense_concepts', 'faqs', 'user_shares', 'invitations', 'suggestions', 'app_settings'];
    let importedCount = 0;
    
    for (const table of tables) {
      try {
        const result = backupDb.exec(`SELECT * FROM ${table}`);
        if (result.length === 0) continue;
        
        const columns = result[0].columns;
        const rows = result[0].values;
        
        for (const row of rows) {
          try {
            const placeholders = columns.map(() => '?').join(', ');
            const stmt = db.prepare(`INSERT OR IGNORE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`);
            stmt.run(row);
            stmt.free();
            importedCount++;
          } catch (e) {}
        }
      } catch (e) {}
    }
    
    backupDb.close();
    saveDb();
    res.json({ success: true, message: `Base de datos importada. ${importedCount} registros insertados.` });
  } catch (error) {
    console.error('Error importing database:', error);
    res.status(500).json({ error: 'Error importando la base de datos' });
  }
});

app.get('/api/faqs', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM faqs ORDER BY order_index ASC');
    const faqs = [];
    while (stmt.step()) {
      faqs.push(stmt.getAsObject());
    }
    stmt.free();
    res.json(faqs);
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ error: 'Error fetching FAQs' });
  }
});

app.post('/api/faqs', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const isAdmin = checkAdmin(req.headers);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Solo los administradores pueden modificar las FAQs' });
  }
  
  const { question, answer, order_index } = req.body;
  
  if (!question || !answer) {
    return res.status(400).json({ error: 'Pregunta y respuesta son obligatorias' });
  }
  
  try {
    const stmt = db.prepare('INSERT INTO faqs (question, answer, order_index) VALUES (?, ?, ?)');
    stmt.run([question, answer, order_index || 0]);
    stmt.free();
    saveDb();
    res.json({ success: true });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    res.status(500).json({ error: 'Error creating FAQ' });
  }
});

app.put('/api/faqs/:id', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });

  const isAdmin = checkAdmin(req.headers);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Solo los administradores pueden modificar las FAQs' });
  }

  const { id } = req.params;
  const { question, answer, order_index } = req.body;

  try {
    const stmt = db.prepare('UPDATE faqs SET question = ?, answer = ?, order_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run([question, answer, order_index || 0, id]);
    stmt.free();
    saveDb();
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({ error: 'Error updating FAQ' });
  }
});

app.delete('/api/faqs/:id', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const isAdmin = checkAdmin(req.headers);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Solo los administradores pueden eliminar las FAQs' });
  }
  
  const { id } = req.params;
  
  try {
    db.run('DELETE FROM faqs WHERE id = ?', [id]);
    saveDb();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({ error: 'Error deleting FAQ' });
  }
});

app.get('/api/suggestions', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  try {
    let stmt;
    const isAdmin = checkAdmin(req.headers);
    
    if (isAdmin) {
      stmt = db.prepare('SELECT * FROM suggestions ORDER BY created_at DESC');
    } else {
      stmt = db.prepare('SELECT * FROM suggestions WHERE owner_id = ? ORDER BY created_at DESC');
      stmt.bind([userId]);
    }
    
    const suggestions = [];
    while (stmt.step()) {
      suggestions.push(stmt.getAsObject());
    }
    stmt.free();
    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Error fetching suggestions' });
  }
});

app.post('/api/suggestions', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { type, subject, content } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: 'El contenido es obligatorio' });
  }
  
  try {
    const stmt = db.prepare('INSERT INTO suggestions (owner_id, type, subject, content) VALUES (?, ?, ?, ?)');
    stmt.run([userId, type || 'idea', subject || '', content]);
    stmt.free();
    saveDb();
    res.json({ success: true });
  } catch (error) {
    console.error('Error creating suggestion:', error);
    res.status(500).json({ error: 'Error creating suggestion' });
  }
});

app.put('/api/suggestions/:id', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const isAdmin = checkAdmin(req.headers);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Solo los administradores pueden modificar las sugerencias' });
  }
  
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    const stmt = db.prepare('UPDATE suggestions SET status = ? WHERE id = ?');
    stmt.run([status || 'pending', id]);
    stmt.free();
    saveDb();
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating suggestion:', error);
    res.status(500).json({ error: 'Error updating suggestion' });
  }
});

app.delete('/api/suggestions/:id', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const isAdmin = checkAdmin(req.headers);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Solo los administradores pueden eliminar las sugerencias' });
  }
  
  const { id } = req.params;
  
  try {
    db.run('DELETE FROM suggestions WHERE id = ?', [id]);
    saveDb();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting suggestion:', error);
    res.status(500).json({ error: 'Error deleting suggestion' });
  }
});

app.get('/api/tasks', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const accessibleIds = getAccessibleUserIds(userId, 'share_tasks');
  const placeholders = accessibleIds.map(() => '?').join(',');
  
  const stmt = db.prepare(`SELECT * FROM family_tasks WHERE owner_id IN (${placeholders}) OR owner_id = ? OR assigned_to_id = ? ORDER BY completed ASC, created_at DESC`);
  stmt.bind([...accessibleIds, userId, userId]);
  
  const tasks = [];
  while (stmt.step()) {
    tasks.push(stmt.getAsObject());
  }
  stmt.free();
  
  res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { title, description, due_date, priority, is_family_task, shopping_list_id, assigned_to_id } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'El título es obligatorio' });
  }
  
  const listId = is_family_task ? null : (shopping_list_id || null);
  const stmt = db.prepare('INSERT INTO family_tasks (owner_id, title, description, due_date, priority, is_family_task, shopping_list_id, assigned_to_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  stmt.run([userId, title, description || null, due_date || null, priority || 'normal', is_family_task ? 1 : 0, listId, assigned_to_id || null]);
  stmt.free();
  saveDb();
  
  const newStmt = db.prepare('SELECT * FROM family_tasks WHERE owner_id = ? ORDER BY id DESC LIMIT 1');
  newStmt.bind([userId]);
  let newTask = null;
  if (newStmt.step()) newTask = newStmt.getAsObject();
  newStmt.free();
  
  res.json({ success: true, task: newTask });
});

app.put('/api/tasks/:id', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { id } = req.params;
  const { title, description, completed, due_date, priority, shopping_list_id, assigned_to_id } = req.body;
  
  const checkStmt = db.prepare('SELECT owner_id, is_family_task, assigned_to_id FROM family_tasks WHERE id = ?');
  checkStmt.bind([id]);
  let task = null;
  if (checkStmt.step()) task = checkStmt.getAsObject();
  checkStmt.free();
  
  if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });
  
  const canEdit = task.owner_id === userId || task.assigned_to_id === userId;
  if (!canEdit) {
    return res.status(403).json({ error: 'No tienes permisos para editar esta tarea' });
  }
  
  const listId = task.is_family_task ? null : (shopping_list_id || null);
  const stmt = db.prepare('UPDATE family_tasks SET title = ?, description = ?, completed = ?, due_date = ?, priority = ?, shopping_list_id = ?, assigned_to_id = ? WHERE id = ?');
  stmt.run([title, description || null, completed ? 1 : 0, due_date || null, priority || 'normal', listId, assigned_to_id || null, id]);
  stmt.free();
  saveDb();
  
  res.json({ success: true });
});

app.put('/api/tasks/:id/toggle', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { id } = req.params;
  
  const checkStmt = db.prepare('SELECT owner_id, completed FROM family_tasks WHERE id = ?');
  checkStmt.bind([id]);
  let task = null;
  if (checkStmt.step()) task = checkStmt.getAsObject();
  checkStmt.free();
  
  if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });
  
  if (task.owner_id !== userId) {
    return res.status(403).json({ error: 'No tienes permisos' });
  }
  
  const newCompleted = task.completed ? 0 : 1;
  const stmt = db.prepare('UPDATE family_tasks SET completed = ? WHERE id = ?');
  stmt.run([newCompleted, id]);
  stmt.free();
  saveDb();
  
  res.json({ success: true, completed: newCompleted });
});

app.delete('/api/tasks/:id', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { id } = req.params;
  
  const checkStmt = db.prepare('SELECT owner_id, assigned_to_id FROM family_tasks WHERE id = ?');
  checkStmt.bind([id]);
  let task = null;
  if (checkStmt.step()) task = checkStmt.getAsObject();
  checkStmt.free();
  
  if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });
  
  const canDelete = task.owner_id === userId || task.assigned_to_id === userId;
  if (!canDelete) {
    return res.status(403).json({ error: 'No tienes permisos para eliminar esta tarea' });
  }
  
  db.run('DELETE FROM family_tasks WHERE id = ?', [id]);
  saveDb();
  
  res.json({ success: true });
});

app.get('/api/restaurants', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const accessibleIds = getAccessibleUserIds(userId);
  const placeholders = accessibleIds.map(() => '?').join(',');
  
  const stmt = db.prepare(`SELECT * FROM favorite_restaurants WHERE owner_id IN (${placeholders}) ORDER BY created_at DESC`);
  stmt.bind(accessibleIds);
  
  const restaurants = [];
  while (stmt.step()) {
    restaurants.push(stmt.getAsObject());
  }
  stmt.free();
  
  res.json(restaurants);
});

app.post('/api/restaurants', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { name, address, phone, cuisine_type, notes, rating } = req.body;
  
  if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });
  
  const id = crypto.randomUUID();
  const stmt = db.prepare('INSERT INTO favorite_restaurants (id, owner_id, name, address, phone, cuisine_type, notes, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  stmt.run([id, userId, name, address || null, phone || null, cuisine_type || null, notes || null, rating || 3]);
  stmt.free();
  saveDb();
  
  res.json({ id, name, address, phone, cuisine_type, notes, rating: rating || 3 });
});

app.put('/api/restaurants/:id', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { id } = req.params;
  const { name, address, phone, cuisine_type, notes, rating } = req.body;
  
  const checkStmt = db.prepare('SELECT owner_id FROM favorite_restaurants WHERE id = ?');
  checkStmt.bind([id]);
  let restaurant = null;
  if (checkStmt.step()) restaurant = checkStmt.getAsObject();
  checkStmt.free();
  
  if (!restaurant) return res.status(404).json({ error: 'Restaurante no encontrado' });
  
  if (restaurant.owner_id !== userId) {
    return res.status(403).json({ error: 'No tienes permisos' });
  }
  
  const stmt = db.prepare('UPDATE favorite_restaurants SET name = ?, address = ?, phone = ?, cuisine_type = ?, notes = ?, rating = ? WHERE id = ?');
  stmt.run([name, address || null, phone || null, cuisine_type || null, notes || null, rating || 3, id]);
  stmt.free();
  saveDb();
  
  res.json({ success: true });
});

app.delete('/api/restaurants/:id', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { id } = req.params;
  
  const checkStmt = db.prepare('SELECT owner_id FROM favorite_restaurants WHERE id = ?');
  checkStmt.bind([id]);
  let restaurant = null;
  if (checkStmt.step()) restaurant = checkStmt.getAsObject();
  checkStmt.free();
  
  if (!restaurant) return res.status(404).json({ error: 'Restaurante no encontrado' });
  
  if (restaurant.owner_id !== userId) {
    return res.status(403).json({ error: 'No tienes permisos para eliminar este restaurante' });
  }
  
  db.run('DELETE FROM favorite_restaurants WHERE id = ?', [id]);
  saveDb();
  
  res.json({ success: true });
});

app.get('/api/favorite-restaurants', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const accessibleIds = getAccessibleUserIds(userId, 'share_restaurants');
  const placeholders = accessibleIds.map(() => '?').join(',');
  const stmt = db.prepare(`SELECT * FROM favorite_restaurants WHERE owner_id IN (${placeholders}) ORDER BY created_at DESC`);
  stmt.bind(accessibleIds);
  
  const restaurants = [];
  while (stmt.step()) {
    restaurants.push(stmt.getAsObject());
  }
  stmt.free();
  
  res.json(restaurants);
});

app.post('/api/favorite-restaurants', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  console.log('POST /api/favorite-restaurants - userId:', userId, 'body:', req.body);
  
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { name, address, phone, cuisine_type, notes, rating } = req.body;
  
  if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });
  
  try {
    // Ensure owner_id is an integer
    const ownerIdInt = parseInt(String(userId), 10);
    
    const id = crypto.randomUUID();
    const stmt = db.prepare('INSERT INTO favorite_restaurants (id, owner_id, name, address, phone, cuisine_type, notes, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    stmt.run([id, ownerIdInt, name, address || '', phone || '', cuisine_type || '', notes || '', rating || 3]);
    stmt.free();
    saveDb();
    
    console.log('Restaurant created:', id);
    res.json({ id, name, address, phone, cuisine_type, notes, rating: rating || 3 });
  } catch (err) {
    console.error('Error creating restaurant:', err);
    res.status(500).json({ error: 'Error al crear restaurante: ' + err.message });
  }
});

app.put('/api/favorite-restaurants/:id', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { id } = req.params;
  const { name, address, phone, cuisine_type, notes, rating } = req.body;
  
  const checkStmt = db.prepare('SELECT owner_id FROM favorite_restaurants WHERE id = ?');
  checkStmt.bind([id]);
  let restaurant = null;
  if (checkStmt.step()) restaurant = checkStmt.getAsObject();
  checkStmt.free();
  
  if (!restaurant) return res.status(404).json({ error: 'Restaurante no encontrado' });
  
  if (restaurant.owner_id !== userId) {
    return res.status(403).json({ error: 'No tienes permisos' });
  }
  
  const stmt = db.prepare('UPDATE favorite_restaurants SET name = ?, address = ?, phone = ?, cuisine_type = ?, notes = ?, rating = ? WHERE id = ?');
  stmt.run([name, address || null, phone || null, cuisine_type || null, notes || null, rating || 3, id]);
  stmt.free();
  saveDb();
  
  res.json({ success: true });
});

app.delete('/api/favorite-restaurants/:id', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { id } = req.params;
  
  const checkStmt = db.prepare('SELECT owner_id FROM favorite_restaurants WHERE id = ?');
  checkStmt.bind([id]);
  let restaurant = null;
  if (checkStmt.step()) restaurant = checkStmt.getAsObject();
  checkStmt.free();
  
  if (!restaurant) return res.status(404).json({ error: 'Restaurante no encontrado' });
  
  if (restaurant.owner_id !== userId) {
    return res.status(403).json({ error: 'No tienes permisos para eliminar este restaurante' });
  }
  
  db.run('DELETE FROM favorite_restaurants WHERE id = ?', [id]);
  saveDb();
  
  res.json({ success: true });
});

app.get('/api/notes', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const accessibleIds = getAccessibleUserIds(userId, 'share_notes');
  const placeholders = accessibleIds.map(() => '?').join(',');
  
  const stmt = db.prepare(`SELECT * FROM family_notes WHERE owner_id IN (${placeholders}) ORDER BY updated_at DESC`);
  stmt.bind(accessibleIds);
  
  const notes = [];
  while (stmt.step()) {
    notes.push(stmt.getAsObject());
  }
  stmt.free();
  
  res.json(notes);
});

app.post('/api/notes', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { title, content, category, board_id } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'El título es obligatorio' });
  }
  
  const stmt = db.prepare('INSERT INTO family_notes (owner_id, title, content, category, board_id) VALUES (?, ?, ?, ?, ?)');
  stmt.run([userId, title, content || '', category || 'general', board_id || null]);
  stmt.free();
  saveDb();
  
  const newStmt = db.prepare('SELECT * FROM family_notes WHERE owner_id = ? ORDER BY id DESC LIMIT 1');
  newStmt.bind([userId]);
  let newNote = null;
  if (newStmt.step()) newNote = newStmt.getAsObject();
  newStmt.free();
  
  res.json({ success: true, note: newNote });
});

app.put('/api/notes/:id', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { id } = req.params;
  const { title, content, category, board_id } = req.body;
  
  const checkStmt = db.prepare('SELECT owner_id FROM family_notes WHERE id = ?');
  checkStmt.bind([id]);
  let note = null;
  if (checkStmt.step()) note = checkStmt.getAsObject();
  checkStmt.free();
  
  if (!note) return res.status(404).json({ error: 'Nota no encontrada' });
  
  if (note.owner_id !== userId) {
    return res.status(403).json({ error: 'No tienes permisos para editar esta nota' });
  }
  
  const stmt = db.prepare('UPDATE family_notes SET title = ?, content = ?, category = ?, board_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  stmt.run([title, content || '', category || 'general', board_id || null, id]);
  stmt.free();
  saveDb();
  
  res.json({ success: true });
});

app.delete('/api/notes/:id', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { id } = req.params;
  
  const checkStmt = db.prepare('SELECT owner_id FROM family_notes WHERE id = ?');
  checkStmt.bind([id]);
  let note = null;
  if (checkStmt.step()) note = checkStmt.getAsObject();
  checkStmt.free();
  
  if (!note) return res.status(404).json({ error: 'Nota no encontrada' });
  
  if (note.owner_id !== userId) {
    return res.status(403).json({ error: 'No tienes permisos para eliminar esta nota' });
  }
  
  db.run('DELETE FROM family_notes WHERE id = ?', [id]);
  saveDb();
  
  res.json({ success: true });
});

app.get('/api/shopping-lists', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const accessibleIds = getAccessibleUserIds(userId, 'share_shopping');
  const placeholders = accessibleIds.map(() => '?').join(',');
  
  const stmt = db.prepare(`SELECT * FROM shopping_lists WHERE owner_id IN (${placeholders}) ORDER BY created_at DESC`);
  stmt.bind(accessibleIds);
  const lists = [];
  while (stmt.step()) lists.push(stmt.getAsObject());
  stmt.free();
  
  const result = lists.map(list => {
    const taskStmt = db.prepare('SELECT * FROM family_tasks WHERE shopping_list_id = ? ORDER BY completed ASC, created_at DESC');
    taskStmt.bind([list.id]);
    const items = [];
    while (taskStmt.step()) items.push(taskStmt.getAsObject());
    taskStmt.free();
    return { ...list, items };
  });
  
  const noListStmt = db.prepare('SELECT * FROM family_tasks WHERE (shopping_list_id IS NULL OR shopping_list_id = 0) AND owner_id = ? AND is_family_task = 0 ORDER BY completed ASC, created_at DESC');
  noListStmt.bind([userId]);
  const noListItems = [];
  while (noListStmt.step()) noListItems.push(noListStmt.getAsObject());
  noListStmt.free();
  
  res.json([...result, { id: 0, name: 'Sin lista', color: '#6b7280', items: noListItems }]);
});

app.post('/api/shopping-lists', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });
  
  const stmt = db.prepare('INSERT INTO shopping_lists (owner_id, name, color) VALUES (?, ?, ?)');
  stmt.run([userId, name, color || '#22c55e']);
  stmt.free();
  saveDb();
  
  const newStmt = db.prepare('SELECT * FROM shopping_lists WHERE owner_id = ? ORDER BY id DESC LIMIT 1');
  newStmt.bind([userId]);
  let newList = null;
  if (newStmt.step()) newList = newStmt.getAsObject();
  newStmt.free();
  
  res.json({ success: true, list: { ...newList, items: [] } });
});

app.put('/api/shopping-lists/:id', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { id } = req.params;
  const { name, color } = req.body;
  
  const checkStmt = db.prepare('SELECT owner_id FROM shopping_lists WHERE id = ?');
  checkStmt.bind([id]);
  let list = null;
  if (checkStmt.step()) list = checkStmt.getAsObject();
  checkStmt.free();
  
  if (!list) return res.status(404).json({ error: 'Lista no encontrada' });
  if (list.owner_id !== userId) return res.status(403).json({ error: 'No tienes permisos' });
  
  const stmt = db.prepare('UPDATE shopping_lists SET name = ?, color = ? WHERE id = ?');
  stmt.run([name, color || '#22c55e', id]);
  stmt.free();
  saveDb();
  
  res.json({ success: true });
});

app.delete('/api/shopping-lists/:id', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { id } = req.params;
  if (id === '0') return res.status(400).json({ error: 'No se puede eliminar la lista por defecto' });
  
  const checkStmt = db.prepare('SELECT owner_id FROM shopping_lists WHERE id = ?');
  checkStmt.bind([id]);
  let list = null;
  if (checkStmt.step()) list = checkStmt.getAsObject();
  checkStmt.free();
  
  if (!list) return res.status(404).json({ error: 'Lista no encontrada' });
  if (list.owner_id !== userId) return res.status(403).json({ error: 'No tienes permisos' });
  
  db.run('UPDATE family_tasks SET shopping_list_id = NULL WHERE shopping_list_id = ?', [id]);
  db.run('DELETE FROM shopping_lists WHERE id = ?', [id]);
  saveDb();
  
  res.json({ success: true });
});

app.get('/api/family-members', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const accessibleIds = getAccessibleUserIds(userId, 'share_family_members');
  const placeholders = accessibleIds.map(() => '?').join(',');
  const stmt = db.prepare(`SELECT * FROM family_members WHERE owner_id IN (${placeholders}) ORDER BY name`);
  stmt.bind(accessibleIds);
  const members = [];
  while (stmt.step()) members.push(stmt.getAsObject());
  stmt.free();
  res.json(members);
});

app.post('/api/family-members', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  const { name, age_group, restrictions, allergies, intolerances, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });
  const stmt = db.prepare('INSERT INTO family_members (owner_id, name, age_group, restrictions, allergies, intolerances, notes) VALUES (?, ?, ?, ?, ?, ?, ?)');
  stmt.run([userId, name, age_group || 'adult', restrictions || '', allergies || '', intolerances || '', notes || '']);
  stmt.free();
  saveDb();
  res.json({ success: true });
});

app.put('/api/family-members/:id', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  const { id } = req.params;
  const { name, age_group, restrictions, allergies, intolerances, notes } = req.body;
  const stmt = db.prepare('UPDATE family_members SET name = ?, age_group = ?, restrictions = ?, allergies = ?, intolerances = ?, notes = ? WHERE id = ? AND owner_id = ?');
  stmt.run([name, age_group || 'adult', restrictions || '', allergies || '', intolerances || '', notes || '', id, userId]);
  stmt.free();
  saveDb();
  res.json({ success: true });
});

app.delete('/api/family-members/:id', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  const { id } = req.params;
  db.run('DELETE FROM family_members WHERE id = ? AND owner_id = ?', [id, userId]);
  saveDb();
  res.json({ success: true });
});

app.get('/api/recipes', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const accessibleIds = getAccessibleUserIds(userId, 'share_recipes');
  const placeholders = accessibleIds.map(() => '?').join(',');
  const { category, search } = req.query;
  let query = `SELECT * FROM recipes WHERE owner_id IN (${placeholders})`;
  const params = [...accessibleIds];
  if (category) { query += ' AND category = ?'; params.push(category); }
  if (search) { query += ' AND (name LIKE ? OR ingredients LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  query += ' ORDER BY is_favorite DESC, name';
  const stmt = db.prepare(query);
  stmt.bind(params);
  const recipes = [];
  while (stmt.step()) recipes.push(stmt.getAsObject());
  stmt.free();
  res.json(recipes);
});

app.post('/api/recipes', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  const { name, description, ingredients, instructions, prep_time, cook_time, servings, category, restrictions, contains } = req.body;
  if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });
  const stmt = db.prepare('INSERT INTO recipes (owner_id, name, description, ingredients, instructions, prep_time, cook_time, servings, category, restrictions, contains) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  stmt.run([userId, name, description || '', ingredients || '', instructions || '', prep_time || null, cook_time || null, servings || 4, category || 'main', restrictions || '', contains || '']);
  stmt.free();
  saveDb();
  res.json({ success: true });
});

app.put('/api/recipes/:id', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  const { id } = req.params;
  const { name, description, ingredients, instructions, prep_time, cook_time, servings, category, restrictions, contains, is_favorite } = req.body;
  const stmt = db.prepare('UPDATE recipes SET name = ?, description = ?, ingredients = ?, instructions = ?, prep_time = ?, cook_time = ?, servings = ?, category = ?, restrictions = ?, contains = ?, is_favorite = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND owner_id = ?');
  stmt.run([name, description || '', ingredients || '', instructions || '', prep_time || null, cook_time || null, servings || 4, category || 'main', restrictions || '', contains || '', is_favorite ? 1 : 0, id, userId]);
  stmt.free();
  saveDb();
  res.json({ success: true });
});

app.delete('/api/recipes/:id', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  const { id } = req.params;
  db.run('DELETE FROM recipes WHERE id = ? AND owner_id = ?', [id, userId]);
  saveDb();
  res.json({ success: true });
});

app.get('/api/meal-plans', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  const { week_start } = req.query;
  let query = 'SELECT * FROM meal_plans WHERE owner_id = ?';
  const params = [userId];
  if (week_start) { query += ' AND week_start = ?'; params.push(week_start); }
  query += ' ORDER BY day_of_week, meal_type';
  const stmt = db.prepare(query);
  stmt.bind(params);
  const plans = [];
  while (stmt.step()) plans.push(stmt.getAsObject());
  stmt.free();
  res.json(plans);
});

app.post('/api/meal-plans', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  const { week_start, day_of_week, meal_type, recipe_id, recipe_name, notes } = req.body;
  if (!week_start || day_of_week === undefined || !meal_type) return res.status(400).json({ error: 'Faltan campos obligatorios' });
  const stmt = db.prepare('INSERT OR REPLACE INTO meal_plans (owner_id, week_start, day_of_week, meal_type, recipe_id, recipe_name, notes) VALUES (?, ?, ?, ?, ?, ?, ?)');
  stmt.run([userId, week_start, day_of_week, meal_type, recipe_id || null, recipe_name || '', notes || '']);
  stmt.free();
  saveDb();
  res.json({ success: true });
});

app.delete('/api/meal-plans/:id', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  const { id } = req.params;
  db.run('DELETE FROM meal_plans WHERE id = ? AND owner_id = ?', [id, userId]);
  saveDb();
  res.json({ success: true });
});

app.get('/api/meal-plans/shopping-list', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  const { week_start } = req.query;
  if (!week_start) return res.status(400).json({ error: 'Se requiere week_start' });
  const stmt = db.prepare('SELECT * FROM meal_plans WHERE owner_id = ? AND week_start = ? AND recipe_id IS NOT NULL');
  stmt.bind([userId, week_start]);
  const plans = [];
  while (stmt.step()) plans.push(stmt.getAsObject());
  stmt.free();
  const ingredients = {};
  for (const plan of plans) {
    const recipeStmt = db.prepare('SELECT ingredients FROM recipes WHERE id = ?');
    recipeStmt.bind([plan.recipe_id]);
    if (recipeStmt.step()) {
      const recipe = recipeStmt.getAsObject();
      if (recipe.ingredients) {
        const lines = recipe.ingredients.split('\n').filter(l => l.trim());
        for (const line of lines) {
          const name = line.replace(/^[-•*]\s*\d*\s*(g|kg|ml|l|ud|unidades|tazas|cucharadas|cucharaditas)?\s*/i, '').trim().toLowerCase();
          if (name) {
            if (!ingredients[name]) ingredients[name] = { amount: 1, unit: 'ud' };
            else ingredients[name].amount += 1;
          }
        }
      }
    }
    recipeStmt.free();
  }
  const result = Object.entries(ingredients).map(([name, data]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), amount: data.amount, unit: data.unit }));
  res.json(result);
});

app.get('/api/meal-plans/categories', (req, res) => {
  res.json([['breakfast', 'Desayuno'], ['lunch', 'Comida'], ['dinner', 'Cena'], ['snack', 'Merienda'], ['dessert', 'Postre'], ['main', 'Plato principal'], ['side', 'Acompañamiento'], ['soup', 'Sopa'], ['salad', 'Ensalada'], ['drink', 'Bebida']]);
});

app.get('/api/meal-plans/restrictions', (req, res) => {
  res.json([['gluten_free', 'Sin Gluten'], ['dairy_free', 'Sin Lácteos'], ['egg_free', 'Sin Huevos'], ['nut_free', 'Sin Frutos secos'], ['soy_free', 'Sin Soja'], ['fish_free', 'Sin Pescado'], ['shellfish_free', 'Sin Mariscos'], ['vegan', 'Vegano'], ['vegetarian', 'Vegetariano'], ['low_sodium', 'Bajo en Sodio'], ['diabetic', 'Diabético'], ['soft', 'Blanda (mayores)'], ['kids', 'Apto para niños']]);
});

app.get('/api/meal-plans/age-groups', (req, res) => {
  res.json([['baby', 'Bebé (0-2 años)'], ['child', 'Niño (3-12 años)'], ['teen', 'Adolescente (13-17 años)'], ['adult', 'Adulto'], ['senior', 'Mayor (65+ años)']]);
});

app.get('/api/note-boards', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const accessibleIds = getAccessibleUserIds(userId, 'share_notes');
  const placeholders = accessibleIds.map(() => '?').join(',');
  
  const stmt = db.prepare(`SELECT * FROM note_boards WHERE owner_id IN (${placeholders}) ORDER BY created_at DESC`);
  stmt.bind(accessibleIds);
  const boards = [];
  while (stmt.step()) boards.push(stmt.getAsObject());
  stmt.free();
  
  const result = boards.map(board => {
    const noteStmt = db.prepare('SELECT * FROM family_notes WHERE board_id = ? ORDER BY updated_at DESC');
    noteStmt.bind([board.id]);
    const notes = [];
    while (noteStmt.step()) notes.push(noteStmt.getAsObject());
    noteStmt.free();
    return { ...board, notes };
  });
  
  const noBoardStmt = db.prepare(`SELECT * FROM family_notes WHERE (board_id IS NULL OR board_id = 0) AND owner_id IN (${placeholders}) ORDER BY updated_at DESC`);
  noBoardStmt.bind(accessibleIds);
  const noBoardNotes = [];
  while (noBoardStmt.step()) noBoardNotes.push(noBoardStmt.getAsObject());
  noBoardStmt.free();
  
  res.json([...result, { id: 0, name: 'Sin tablero', color: '#6b7280', notes: noBoardNotes }]);
});

app.post('/api/note-boards', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });
  
  const stmt = db.prepare('INSERT INTO note_boards (owner_id, name, color) VALUES (?, ?, ?)');
  stmt.run([userId, name, color || '#eab308']);
  stmt.free();
  saveDb();
  
  const newStmt = db.prepare('SELECT * FROM note_boards WHERE owner_id = ? ORDER BY id DESC LIMIT 1');
  newStmt.bind([userId]);
  let newBoard = null;
  if (newStmt.step()) newBoard = newStmt.getAsObject();
  newStmt.free();
  
  res.json({ success: true, board: { ...newBoard, notes: [] } });
});

app.put('/api/note-boards/:id', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { id } = req.params;
  const { name, color } = req.body;
  
  const checkStmt = db.prepare('SELECT owner_id FROM note_boards WHERE id = ?');
  checkStmt.bind([id]);
  let board = null;
  if (checkStmt.step()) board = checkStmt.getAsObject();
  checkStmt.free();
  
  if (!board) return res.status(404).json({ error: 'Tablero no encontrado' });
  if (board.owner_id !== userId) return res.status(403).json({ error: 'No tienes permisos' });
  
  const stmt = db.prepare('UPDATE note_boards SET name = ?, color = ? WHERE id = ?');
  stmt.run([name, color || '#eab308', id]);
  stmt.free();
  saveDb();
  
  res.json({ success: true });
});

app.delete('/api/note-boards/:id', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { id } = req.params;
  if (id === '0') return res.status(400).json({ error: 'No se puede eliminar el tablero por defecto' });
  
  const checkStmt = db.prepare('SELECT owner_id FROM note_boards WHERE id = ?');
  checkStmt.bind([id]);
  let board = null;
  if (checkStmt.step()) board = checkStmt.getAsObject();
  checkStmt.free();
  
  if (!board) return res.status(404).json({ error: 'Tablero no encontrado' });
  if (board.owner_id !== userId) return res.status(403).json({ error: 'No tienes permisos' });
  
  db.run('UPDATE family_notes SET board_id = NULL WHERE board_id = ?', [id]);
  db.run('DELETE FROM note_boards WHERE id = ?', [id]);
  saveDb();
  
  res.json({ success: true });
});

app.post('/api/reset', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const tables = [
    { name: 'transactions', ownerField: 'owner_id' },
    { name: 'budgets', ownerField: 'owner_id' },
    { name: 'family_events', ownerField: 'owner_id' },
    { name: 'family_tasks', ownerField: 'owner_id' },
    { name: 'family_notes', ownerField: 'owner_id' },
    { name: 'family_members', ownerField: 'owner_id' },
    { name: 'shopping_lists', ownerField: 'owner_id' },
    { name: 'note_boards', ownerField: 'owner_id' },
    { name: 'family_contacts', ownerField: 'owner_id' },
    { name: 'family_gallery', ownerField: 'owner_id' },
    { name: 'user_shares', ownerField: null, customWhere: 'owner_id = ? OR shared_with_id = ?' },
    { name: 'invitations', ownerField: null, customWhere: 'from_user_id = ?' }
  ];
  
  try {
    for (const table of tables) {
      try {
        if (table.customWhere) {
          db.run(`DELETE FROM ${table.name} WHERE ${table.customWhere}`, [userId, userId]);
        } else {
          db.run(`DELETE FROM ${table.name} WHERE ${table.ownerField} = ?`, [userId]);
        }
      } catch (e) {
        console.warn(`Warning: Could not delete from ${table.name}:`, e.message);
      }
    }
    saveDb();
    res.json({ success: true, message: 'Todos tus datos han sido eliminados' });
  } catch (error) {
    console.error('Error resetting data:', error);
    res.status(500).json({ error: 'Error al resetear los datos: ' + error.message });
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
  
  const { to_username, share_dashboard, share_accounting, share_budgets, share_agenda, share_tasks, share_notes, share_shopping, share_contacts, share_recipes, share_restaurants, share_family_members } = req.body;
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
  
  const existingInviteStmt = db.prepare('SELECT id, status FROM invitations WHERE from_user_id = ? AND to_username = ?');
  existingInviteStmt.bind([userId, to_username]);
  if (existingInviteStmt.step()) {
    const existing = existingInviteStmt.getAsObject();
    existingInviteStmt.free();
    if (existing.status === 'pending') {
      return res.status(409).json({ error: 'Ya tienes una invitación pendiente para este usuario' });
    }
    db.run('DELETE FROM invitations WHERE id = ?', [existing.id]);
  }
  existingInviteStmt.free();
  
  try {
    const inviteStmt = db.prepare(`
      INSERT INTO invitations (from_user_id, to_username, share_dashboard, share_accounting, share_budgets, share_agenda, share_tasks, share_notes, share_shopping, share_contacts, share_recipes, share_restaurants, share_family_members) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    inviteStmt.run([
      userId, 
      to_username,
      share_dashboard ? 1 : 0,
      share_accounting ? 1 : 0,
      share_budgets ? 1 : 0,
      share_agenda ? 1 : 0,
      share_tasks ? 1 : 0,
      share_notes ? 1 : 0,
      share_shopping ? 1 : 0,
      share_contacts ? 1 : 0,
      share_recipes ? 1 : 0,
      share_restaurants ? 1 : 0,
      share_family_members ? 1 : 0
    ]);
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
  
  const inviteStmt = db.prepare(`
    SELECT i.*, u.username as from_username 
    FROM invitations i 
    JOIN auth_user u ON i.from_user_id = u.id 
    WHERE i.id = ? AND i.to_username = (SELECT username FROM auth_user WHERE id = ?)
  `);
  inviteStmt.bind([id, userId]);
  let invite = null;
  if (inviteStmt.step()) invite = inviteStmt.getAsObject();
  inviteStmt.free();
  
  if (!invite) return res.status(404).json({ error: 'Invitación no encontrada' });
  
  try {
    if (invite.from_username) {
      const shareStmt = db.prepare(`
        INSERT OR IGNORE INTO user_shares 
        (owner_id, shared_with_id, share_dashboard, share_accounting, share_budgets, share_agenda, share_tasks, share_notes, share_shopping, share_contacts, share_recipes, share_restaurants, share_family_members) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      shareStmt.run([
        invite.from_user_id, 
        userId,
        invite.share_dashboard || 0,
        invite.share_accounting || 0,
        invite.share_budgets || 0,
        invite.share_agenda || 0,
        invite.share_tasks || 0,
        invite.share_notes || 0,
        invite.share_shopping || 0,
        invite.share_contacts || 0,
        invite.share_recipes || 0,
        invite.share_restaurants || 0,
        invite.share_family_members || 0
      ]);
      shareStmt.free();
    }
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

app.put('/api/shares/:sharedWithId', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { sharedWithId } = req.params;
  const { share_dashboard, share_accounting, share_budgets, share_agenda, share_tasks, share_notes, share_shopping, share_contacts, share_recipes, share_restaurants, share_family_members } = req.body;
  
  try {
    db.run(`
      UPDATE user_shares 
      SET share_dashboard = ?, share_accounting = ?, share_budgets = ?, share_agenda = ?, share_tasks = ?, share_notes = ?, share_shopping = ?, share_contacts = ?, share_recipes = ?, share_restaurants = ?, share_family_members = ?
      WHERE owner_id = ? AND shared_with_id = ?
    `, [
      share_dashboard ? 1 : 0,
      share_accounting ? 1 : 0,
      share_budgets ? 1 : 0,
      share_agenda ? 1 : 0,
      share_tasks ? 1 : 0,
      share_notes ? 1 : 0,
      share_shopping ? 1 : 0,
      share_contacts ? 1 : 0,
      share_recipes ? 1 : 0,
      share_restaurants ? 1 : 0,
      share_family_members ? 1 : 0,
      userId,
      sharedWithId
    ]);
    saveDb();
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating share:', error);
    res.status(500).json({ error: 'Error actualizando compartición' });
  }
});



import XLSX from 'xlsx';

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
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });

  if (!req.file) {
    return res.status(400).json({ error: 'No se ha proporcionado ningún archivo' });
  }

  try {
    let data;
    const fileName = req.file.originalname.toLowerCase();
    
    if (fileName.endsWith('.csv')) {
      const csvText = req.file.buffer.toString('utf-8');
      const lines = csvText.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        return res.status(400).json({ error: 'El archivo CSV está vacío o no tiene datos' });
      }
      
      const parseCSVLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };
      
      data = lines.map(line => parseCSVLine(line));
    } else {
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (data.length < 2) {
        return res.status(400).json({ error: 'El archivo está vacío o no tiene datos' });
      }
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
          INSERT INTO transactions (id, owner_id, type, amount, description, concept, date)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run([transaction.id, userId, transaction.type, transaction.amount, transaction.description, transaction.concept, transaction.date]);
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

app.post('/api/import/pdf', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se ha proporcionado ningún archivo' });
  }

  try {
    const pdfData = await pdf(req.file.buffer);
    const text = pdfData.text;
    
    const amountMatch = text.match(/[\d.,]+\s*(?:€|EUR|euros?|USD|dollars?)/i) || text.match(/(?:total|importe|cantidad|amount)[:\s]*[\d.,]+/i);
    const dateMatch = text.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/) || text.match(/\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}/);
    
    let amount = 0;
    if (amountMatch) {
      const cleanAmount = amountMatch[0].replace(/[^\d.,]/g, '').replace(',', '.');
      amount = parseFloat(cleanAmount);
    }
    
    let extractedDate = new Date().toISOString().split('T')[0];
    if (dateMatch) {
      const parts = dateMatch[0].split(/[\/\-\.]/);
      if (parts[0].length === 4) {
        extractedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else {
        const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        extractedDate = `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    
    let concept = 'otros';
    const lowerText = text.toLowerCase();
    if (lowerText.includes('hipoteca') || lowerText.includes('alquiler')) concept = 'alquiler';
    else if (lowerText.includes('luz') || lowerText.includes('electricidad') || lowerText.includes('endesa') || lowerText.includes('iberdrola')) concept = 'servicios';
    else if (lowerText.includes('agua')) concept = 'servicios';
    else if (lowerText.includes('gasolina') || lowerText.includes('combustible') || lowerText.includes('repsol') || lowerText.includes('cepsa')) concept = 'gasolina';
    else if (lowerText.includes('supermercado') || lowerText.includes('mercadona') || lowerText.includes('carrefour') || lowerText.includes('dia')) concept = 'comida';
    else if (lowerText.includes('restaurante') || lowerText.includes('bar') || lowerText.includes('café')) concept = 'ocio';
    
    res.json({
      success: true,
      extracted: {
        concept,
        amount,
        date: extractedDate,
        description: `Factura PDF - ${req.file.originalname}`
      }
    });
  } catch (error) {
    console.error('Error parsing PDF:', error);
    res.status(500).json({ error: 'Error procesando el PDF' });
  }
});

const conversationHistory = [];

app.post('/api/chat', async (req, res) => {
  const { message, context } = req.body;
  const userId = getCurrentUserId(req.headers);
  
  if (!userId) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  conversationHistory.push({ role: 'user', content: message });

  let response = '';

  if (context === 'family_accounting') {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear());
    const accessibleIds = getAccessibleUserIds(userId, 'share_accounting');
    const placeholders = accessibleIds.map(() => '?').join(',');
    
    const stmt = db.prepare(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM transactions
      WHERE date LIKE ? AND owner_id IN (${placeholders})
    `);
    stmt.bind([`${String(year)}-${String(month).padStart(2, '0')}-%`, ...accessibleIds]);
    stmt.step();
    const summary = stmt.getAsObject();
    stmt.free();

    const transactionsStmt = db.prepare(`
      SELECT t.id, t.type, t.amount, t.description, t.concept, t.date, u.name as owner_name
      FROM transactions t
      LEFT JOIN user_profile u ON t.owner_id = u.owner_id
      WHERE t.owner_id IN (${placeholders})
      ORDER BY t.date DESC LIMIT 100
    `);
    transactionsStmt.bind([...accessibleIds]);
    const transactions = [];
    while (transactionsStmt.step()) transactions.push(transactionsStmt.getAsObject());
    transactionsStmt.free();

    const allTimeStmt = db.prepare(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM transactions
      WHERE owner_id IN (${placeholders})
    `);
    allTimeStmt.step();
    const allTimeSummary = allTimeStmt.getAsObject();
    allTimeStmt.free();

    const byConceptStmt = db.prepare(`
      SELECT concept, SUM(amount) as total
      FROM transactions
      WHERE type = 'expense' AND owner_id IN (${placeholders}) AND date LIKE ?
      GROUP BY concept
      ORDER BY total DESC
      LIMIT 10
    `);
    byConceptStmt.bind([`${String(year)}-${String(month).padStart(2, '0')}-%`]);
    const byConcept = [];
    while (byConceptStmt.step()) byConcept.push(byConceptStmt.getAsObject());
    byConceptStmt.free();

    const notesStmt = db.prepare(`SELECT id, title, content, category, updated_at FROM family_notes WHERE owner_id IN (${placeholders}) ORDER BY updated_at DESC LIMIT 50`);
    notesStmt.bind([...accessibleIds]);
    const notes = [];
    while (notesStmt.step()) notes.push(notesStmt.getAsObject());
    notesStmt.free();

    const tasksStmt = db.prepare(`SELECT id, title, completed, priority FROM family_tasks WHERE owner_id IN (${placeholders}) AND completed = 0 ORDER BY priority DESC LIMIT 20`);
    tasksStmt.bind([...accessibleIds]);
    const tasks = [];
    while (tasksStmt.step()) tasks.push(tasksStmt.getAsObject());
    tasksStmt.free();

    const shoppingListsStmt = db.prepare(`SELECT id, name, color FROM shopping_lists WHERE owner_id IN (${placeholders})`);
    shoppingListsStmt.bind([...accessibleIds]);
    const shoppingLists = [];
    while (shoppingListsStmt.step()) shoppingLists.push(shoppingListsStmt.getAsObject());
    shoppingListsStmt.free();

    let shoppingItems = [];
    if (shoppingLists.length > 0) {
      const listPlaceholders = shoppingLists.map(() => '?').join(',');
      const shoppingItemsStmt = db.prepare(`
        SELECT t.id, t.title, t.completed, sl.name as list_name
        FROM family_tasks t
        JOIN shopping_lists sl ON t.shopping_list_id = sl.id
        WHERE t.shopping_list_id IN (${listPlaceholders})
        ORDER BY t.completed ASC, t.title
        LIMIT 50
      `);
      shoppingItemsStmt.bind(shoppingLists.map(l => l.id));
      while (shoppingItemsStmt.step()) shoppingItems.push(shoppingItemsStmt.getAsObject());
      shoppingItemsStmt.free();
    }

    const chatData = {
      summary,
      allTimeSummary,
      byConcept,
      notes,
      tasks,
      shoppingLists,
      shoppingItems,
      transactions
    };

    response = generateFamilyResponse(message, chatData);
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
  const userId = getCurrentUserId(req.headers);

  if (!userId) {
    return res.status(401).json({ error: 'No autorizado' });
  }

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
  const accessibleIds = getAccessibleUserIds(userId, 'share_accounting');
  const placeholders = accessibleIds.map(() => '?').join(',');

  // Get monthly summary
  const summaryStmt = db.prepare(`
    SELECT 
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense,
      COUNT(*) as transaction_count
    FROM transactions
    WHERE date LIKE ? AND owner_id IN (${placeholders})
  `);
  summaryStmt.bind([`${String(year)}-${String(month).padStart(2, '0')}-%`, ...accessibleIds]);
  summaryStmt.step();
  const monthlySummary = summaryStmt.getAsObject();
  summaryStmt.free();

  // Get expenses by concept
  const conceptStmt = db.prepare(`
    SELECT concept, SUM(amount) as total
    FROM transactions
    WHERE type = 'expense'
      AND date LIKE ?
      AND owner_id IN (${placeholders})
    GROUP BY concept
    ORDER BY total DESC
  `);
  conceptStmt.bind([`${String(year)}-${String(month).padStart(2, '0')}-%`, ...accessibleIds]);
  const expensesByConcept = [];
  while (conceptStmt.step()) {
    expensesByConcept.push(conceptStmt.getAsObject());
  }
  conceptStmt.free();

  // Get family profile for this user
  const profileStmt = db.prepare('SELECT name, family_name FROM user_profile WHERE owner_id = ?');
  profileStmt.bind([userId]);
  profileStmt.step();
  const profile = profileStmt.getAsObject();
  profileStmt.free();

  // Get budget info for this user
  const budgetStmt = db.prepare(`
    SELECT concept, amount
    FROM budgets
    WHERE month = ? AND year = ? AND owner_id IN (${placeholders})
  `);
  budgetStmt.bind([parseInt(month), parseInt(year), ...accessibleIds]);
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

function generateFamilyResponse(message, chatData) {
  const msg = message.toLowerCase();
  const { summary = {}, allTimeSummary = {}, byConcept = [], notes = [], tasks = [], shoppingItems = [], transactions = [] } = chatData;
  
  const income = summary.income || 0;
  const expense = summary.expense || 0;
  const balance = income - expense;
  const totalIncome = allTimeSummary.income || 0;
  const totalExpense = allTimeSummary.expense || 0;
  const totalBalance = totalIncome - totalExpense;

  const searchInNotes = (query) => {
    const q = query.toLowerCase();
    return notes.filter(n => 
      n.title.toLowerCase().includes(q) || 
      (n.content && n.content.toLowerCase().includes(q))
    );
  };

  if (msg.includes('hola') || msg.includes('buenas') || msg.includes('hello') || msg.includes('hey')) {
    let reply = `¡Hola! Soy el asistente IA de Family Agent. Puedo ayudarte a buscar en:\n\n📝 Notas\n🛒 Lista de la compra\n💰 Contabilidad (gastos e ingresos)\n\nEste mes:
- Ingresos: ${income.toFixed(2)}€
- Gastos: ${expense.toFixed(2)}€
- Balance: ${balance.toFixed(2)}€`;

    if (tasks.length > 0) {
      reply += `\n\n📋 Tienes ${tasks.length} tarea(s) pendiente(s).`;
    }
    if (shoppingItems.length > 0) {
      reply += `\n🛒 Lista de la compra: ${shoppingItems.length} producto(s).`;
    }
    reply += '\n\n¿Qué quieres buscar?';
    return reply;
  }

  if (msg.includes('nota') || msg.includes('apunte') || msg.includes('recordar') || msg.includes('buscar en nota')) {
    const noteQuery = msg.replace(/buscar|busca|encontrar|nota|apunte|recordar|en/gi, '').trim();
    if (noteQuery && notes.length > 0) {
      const found = searchInNotes(noteQuery);
      if (found.length > 0) {
        return `📝 Notas encontradas para "${noteQuery}":\n\n${found.slice(0, 10).map(n => `• ${n.title}${n.content ? ': ' + n.content.substring(0, 80) : ''}`).join('\n')}`;
      }
      return `📝 No encontré notas con "${noteQuery}".\n\nTienes ${notes.length} nota(s) en total.`;
    }
    if (notes.length > 0) {
      return `📝 Tienes ${notes.length} nota(s):\n\n${notes.slice(0, 10).map(n => `• ${n.title}`).join('\n')}\n\n🔍 Busca con "buscar nota [término]"`;
    }
    return '📝 No tienes notas guardadas todavía.';
  }

  if (msg.includes('tarea') || msg.includes('pendiente') || msg.includes('hacer')) {
    if (tasks.length > 0) {
      return `📋 Tienes ${tasks.length} tarea(s) pendiente(s):\n\n${tasks.slice(0, 5).map((t, i) => `${i + 1}. ${t.title}`).join('\n')}`;
    }
    return '✅ ¡No tienes tareas pendientes!';
  }

  if (msg.includes('compra') || msg.includes('comprar') || msg.includes('lista') || msg.includes('producto')) {
    const shoppingQuery = msg.replace(/buscar|compra|comprar|lista|producto|en/gi, '').trim();
    if (shoppingQuery && shoppingItems.length > 0) {
      const found = shoppingItems.filter(s => s.title.toLowerCase().includes(shoppingQuery.toLowerCase()));
      if (found.length > 0) {
        return `🛒 Productos encontrados para "${shoppingQuery}":\n\n${found.slice(0, 10).map((s, i) => `${i + 1}. ${s.title} (${s.list_name || ''})`).join('\n')}`;
      }
    }
    if (shoppingItems.length > 0) {
      return `🛒 Lista de la compra (${shoppingItems.length} productos):\n\n${shoppingItems.slice(0, 15).map((s, i) => `${i + 1}. ${s.title} [${s.list_name || 'sin lista'}]`).join('\n')}`;
    }
    return '🛒 La lista de la compra está vacía.';
  }

  if (msg.includes('gasto') || msg.includes('gastado') || msg.includes('gastos')) {
    const gastoQuery = msg.replace(/buscar|gasto|gastado|gastos|por|de|en/gi, '').trim();
    
    if (gastoQuery && transactions.length > 0) {
      const found = transactions.filter(t => t.type === 'expense' && (t.description.toLowerCase().includes(gastoQuery.toLowerCase()) || (t.concept && t.concept.toLowerCase().includes(gastoQuery.toLowerCase()))));
      if (found.length > 0) {
        const total = found.reduce((sum, t) => sum + t.amount, 0);
        return `💰 Gastos encontrados para "${gastoQuery}" (${found.length}):\n\n${found.slice(0, 10).map(t => `• ${t.description}: ${t.amount.toFixed(2)}€ (${t.date})`).join('\n')}\n\nTotal: ${total.toFixed(2)}€`;
      }
    }

    if (byConcept.length > 0) {
      return `💰 Gastos este mes por concepto:\n\n${byConcept.map((c, i) => `${i + 1}. ${c.concept || 'Sin concepto'}: ${c.total.toFixed(2)}€`).join('\n')}\n\nTotal: ${expense.toFixed(2)}€`;
    }
    return `💰 Este mes habéis gastado un total de ${expense.toFixed(2)}€.`;
  }

  if (msg.includes('ingreso') || msg.includes('ganado') || msg.includes('ingresos')) {
    const ingresoQuery = msg.replace(/buscar|ingreso|ingresos|ganado|de/gi, '').trim();
    
    if (ingresoQuery && transactions.length > 0) {
      const found = transactions.filter(t => t.type === 'income' && (t.description.toLowerCase().includes(ingresoQuery.toLowerCase()) || (t.concept && t.concept.toLowerCase().includes(ingresoQuery.toLowerCase()))));
      if (found.length > 0) {
        const total = found.reduce((sum, t) => sum + t.amount, 0);
        return `💵 Ingresos encontrados para "${ingresoQuery}" (${found.length}):\n\n${found.slice(0, 10).map(t => `• ${t.description}: ${t.amount.toFixed(2)}€ (${t.date})`).join('\n')}\n\nTotal: ${total.toFixed(2)}€`;
      }
    }
    return `💵 Los ingresos de este mes suman ${income.toFixed(2)}€.\n\nTotal acumulado: ${totalIncome.toFixed(2)}€`;
  }

  if (msg.includes('balance') || msg.includes('queda') || msg.includes('saldo') || msg.includes('resumen')) {
    return `📊 Resumen financiero:\n\nEste mes:
- Ingresos: ${income.toFixed(2)}€
- Gastos: ${expense.toFixed(2)}€
- Balance: ${balance.toFixed(2)}€

Total acumulado:
- Ingresos: ${totalIncome.toFixed(2)}€
- Gastos: ${totalExpense.toFixed(2)}€`;
  }

  if (msg.includes('transaccion') || msg.includes('movimiento')) {
    const transQuery = msg.replace(/buscar|transaccion|transacciones|movimiento|movimientos|de|por/gi, '').trim();
    if (transQuery && transactions.length > 0) {
      const found = transactions.filter(t => t.description.toLowerCase().includes(transQuery.toLowerCase()) || (t.concept && t.concept.toLowerCase().includes(transQuery.toLowerCase())));
      if (found.length > 0) {
        return `📋 Transacciones encontradas para "${transQuery}" (${found.length}):\n\n${found.slice(0, 10).map(t => `${t.type === 'income' ? '💵' : '💰'} ${t.description}: ${t.amount.toFixed(2)}€ (${t.concept || 'sin concepto'}) - ${t.date}`).join('\n')}`;
      }
    }
    if (transactions.length > 0) {
      return `📋 Últimas transacciones (${transactions.length}):\n\n${transactions.slice(0, 10).map(t => `${t.type === 'income' ? '💵' : '💰'} ${t.description}: ${t.amount.toFixed(2)}€ - ${t.date}`).join('\n')}`;
    }
    return '📋 No hay transacciones registradas.';
  }

  if (msg.includes('ayuda') || msg.includes('qué puedes') || msg.includes('que puedes')) {
    return `🤖 Puedo ayudarte con:

📝 NOTAS:
- "buscar nota [término]"
- "mis notas"
- "últimas notas"

🛒 LISTA DE LA COMPRA:
- "qué hay en la lista"
- "buscar producto [nombre]"
- "lista de compra"

💰 CONTABILIDAD:
- "gastos del mes"
- "ingresos"
- "balance"
- "gastos por concepto"
- "buscar gasto [término]"
- "últimas transacciones"
- "transacciones de [concepto]"

📋 TAREAS:
- "tareas pendientes"
- "qué tareas tengo"

Ejemplos: "buscar nota reunion", "gastos de comida", "últimos movimientos"
`;
  }

  return `📊 Resumen rápido:\n\nEste mes:
- Ingresos: ${income.toFixed(2)}€
- Gastos: ${expense.toFixed(2)}€
- Balance: ${balance.toFixed(2)}€\n\n📋 ${tasks.length} tareas | 🛒 ${shoppingItems.length} productos | 📝 ${notes.length} notas\n\n💡 Prueba: "ayuda" para ver todo lo que puedo buscar`;
}

async function sendNotificationEmail(settings, events, budgets, profile, tasks = [], mealPlans = []) {
  if (!settings.email_enabled || !settings.email_to || !settings.smtp_user || !settings.smtp_password) {
    return { success: false, reason: 'Email notifications not configured' };
  }

  const profileData = profile || { name: 'Usuario', family_name: 'Mi Familia' };
  
  if (!events || !Array.isArray(events)) events = [];
  if (!budgets || !Array.isArray(budgets)) budgets = [];
  if (!tasks || !Array.isArray(tasks)) tasks = [];
  if (!mealPlans || !Array.isArray(mealPlans)) mealPlans = [];

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  let htmlContent;
  let textContent;

  const hasEvents = events.length > 0;
  const hasBudgets = budgets && budgets.length > 0;
  const hasTasks = tasks.length > 0;
  const hasMealPlans = mealPlans && mealPlans.length > 0;

  let budgetsSection = '';
  let budgetsText = '';
  let tasksSection = '';
  let tasksText = '';
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

  if (hasTasks) {
    const priorityOrder = { high: 0, urgent: 0, normal: 1, low: 2 };
    const sortedTasks = [...tasks].sort((a, b) => {
      const aP = priorityOrder[a.priority] ?? 1;
      const bP = priorityOrder[b.priority] ?? 1;
      if (aP !== bP) return aP - bP;
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return 0;
    });

    tasksText = `📋 TAREAS PENDIENTES\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      sortedTasks.map(t => {
        const emoji = (t.priority === 'high' || t.priority === 'urgent') ? '🔴' : (t.priority === 'low' ? '🟢' : '🟡');
        const due = t.due_date ? ` (Hasta: ${new Date(t.due_date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })})` : '';
        return `${emoji} ${t.title}${due}`;
      }).join('\n');

    tasksSection = `
      <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <h3 style="margin: 0 0 16px 0; color: #92400e;">📋 Tareas Pendientes (${tasks.length})</h3>
        <table style="width: 100%; font-size: 14px;">
          <tbody>
            ${sortedTasks.map(t => {
              const emoji = (t.priority === 'high' || t.priority === 'urgent') ? '🔴' : (t.priority === 'low' ? '🟢' : '🟡');
              const due = t.due_date ? `<br><small style="color: #92400e;">Hasta: ${new Date(t.due_date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</small>` : '';
              return `
                <tr style="border-bottom: 1px solid #fcd34d;">
                  <td style="padding: 10px 0;">${emoji}</td>
                  <td style="padding: 10px 0; color: #111827;">${t.title}${due}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  let mealPlansSection = '';
  let mealPlansText = '';
  const mealLabels = { breakfast: 'Desayuno', lunch: 'Comida', dinner: 'Cena', snack: 'Merienda' };
  
  if (hasMealPlans) {
    const mealsByType = mealPlans.reduce((acc, m) => {
      const type = m.meal_type || 'snack';
      if (!acc[type]) acc[type] = [];
      acc[type].push(m);
      return acc;
    }, {});

    mealPlansText = `🍽️ MENÚ DE MAÑANA (${tomorrow.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })})\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      Object.entries(mealsByType).map(([type, meals]) => {
        return `  ${mealLabels[type] || type}: ${meals.map(m => m.recipe_name).join(', ')}`;
      }).join('\n');

    mealPlansSection = `
      <div style="background: #fff7ed; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <h3 style="margin: 0 0 16px 0; color: #c2410c;">🍽️ Menú de mañana (${tomorrow.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })})</h3>
        <table style="width: 100%; font-size: 14px;">
          <tbody>
            ${Object.entries(mealsByType).map(([type, meals]) => `
              <tr style="border-bottom: 1px solid #fed7aa;">
                <td style="padding: 10px 0; color: #9a3412; font-weight: 600;">${mealLabels[type] || type}</td>
                <td style="padding: 10px 0; color: #111827;">${meals.map(m => m.recipe_name).join(', ')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  const familyName = profileData.family_name || 'Familia';
  
  const dateRangeStr = `${today.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${nextWeek.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  if (!hasEvents) {
    textContent = `Hola ${familyName},\n\nNo hay planes para los pr\u00f3ximos 7 d\u00edas (${dateRangeStr}).\n${mealPlansText ? '\n' + mealPlansText : ''}\n${budgetsText}\n${tasksText ? '\n' + tasksText : ''}\n\n\u00a1Que tengas un buen d\u00eda!\n\nSaludos,\nFamily Agent`;
    htmlContent = `<h2>Hola ${familyName}</h2><p>No hay planes para los pr\u00f3ximos 7 d\u00edas (${dateRangeStr}).</p>${mealPlansSection}${tasksSection}${budgetsSection}<p>\u00a1Que tengas un buen d\u00eda!</p><p><em>Saludos,<br>Family Agent</em></p>`;
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

    htmlContent = `<h2>Hola ${familyName}</h2>${mealPlansSection}${eventsHtml}${tasksSection}${budgetsSection}<p>\u00a1Que disfrutes!</p><p><em>Saludos,<br>Family Agent</em></p>`;
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
  if (hasTasks && !hasEvents) subject = `📋 Tienes ${tasks.length} tarea${tasks.length !== 1 ? 's' : ''} pendiente${tasks.length !== 1 ? 's' : ''}`;
  else if (hasEvents) subject = `📅 ${events.length} ${events.length === 1 ? 'plan' : 'planes'} para los pr\u00f3ximos 7 d\u00edas`;
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
    const usersStmt = db.prepare('SELECT owner_id FROM notification_settings WHERE email_enabled = 1');
    const users = [];
    while (usersStmt.step()) {
      users.push(usersStmt.getAsObject().owner_id);
    }
    usersStmt.free();

    for (const userId of users) {
      await sendUserNotification(userId);
    }
  } catch (error) {
    console.error('Error in daily notification:', error);
  }
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

async function sendUserNotification(userId) {
  try {
    const settingsStmt = db.prepare('SELECT * FROM notification_settings WHERE owner_id = ?');
    settingsStmt.bind([userId]);
    let settings = null;
    if (settingsStmt.step()) settings = settingsStmt.getAsObject();
    settingsStmt.free();

    if (!settings?.email_enabled) {
      return;
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const eventsStmt = db.prepare('SELECT * FROM family_events WHERE owner_id = ? AND ((date >= ? AND date <= ?) OR recurrence = ?) ORDER BY date ASC, start_time ASC');
    eventsStmt.bind([userId, tomorrowStr, nextWeekStr, 'weekly']);
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
      LEFT JOIN transactions t ON t.concept = b.concept_key AND t.owner_id = b.owner_id
      WHERE b.owner_id = ?
      GROUP BY b.id
    `);
    budgetsStmt.bind([`${year}-${monthStr}%`, userId]);
    const budgets = [];
    while (budgetsStmt.step()) {
      budgets.push(budgetsStmt.getAsObject());
    }
    budgetsStmt.free();

    const profileStmt = db.prepare('SELECT * FROM user_profile WHERE owner_id = ?');
    profileStmt.bind([userId]);
    let profile = { name: 'Usuario', family_name: 'Mi Familia' };
    if (profileStmt.step()) profile = profileStmt.getAsObject();
    profileStmt.free();

    const tasksStmt = db.prepare('SELECT * FROM family_tasks WHERE owner_id = ? AND completed = 0 ORDER BY CASE priority WHEN "high" THEN 0 WHEN "urgent" THEN 0 WHEN "normal" THEN 1 WHEN "low" THEN 2 ELSE 1 END, due_date ASC');
    tasksStmt.bind([userId]);
    const tasks = [];
    while (tasksStmt.step()) {
      tasks.push(tasksStmt.getAsObject());
    }
    tasksStmt.free();

    const weekStart = getWeekStart(tomorrow);
    const mealPlansStmt = db.prepare('SELECT * FROM meal_plans WHERE week_start = ? AND owner_id = ? AND day_of_week = ? ORDER BY day_of_week, meal_type');
    mealPlansStmt.bind([weekStart, userId, tomorrow.getDay() === 0 ? 7 : tomorrow.getDay()]);
    const mealPlans = [];
    while (mealPlansStmt.step()) {
      mealPlans.push(mealPlansStmt.getAsObject());
    }
    mealPlansStmt.free();

    await sendNotificationEmail(settings, expandedEvents, budgets, profile, tasks, mealPlans);
  } catch (error) {
    console.error('Error sending notification to user', userId, error);
  }
}

app.get('/api/notifications/settings', (req, res) => {
  const { username, password, userId } = req.headers || {};
  
  let authUserId = null;
  
  if (userId) {
    const numericUserId = parseInt(userId, 10);
    if (!isNaN(numericUserId)) {
      const stmt = db.prepare('SELECT id FROM auth_user WHERE id = ?');
      stmt.bind([numericUserId]);
      if (stmt.step()) {
        authUserId = stmt.getAsObject().id;
      }
      stmt.free();
    }
  }
  
  if (!authUserId && username && password) {
    const stmt = db.prepare('SELECT id FROM auth_user WHERE username = ?');
    stmt.bind([username]);
    if (stmt.step()) {
      authUserId = stmt.getAsObject().id;
    }
    stmt.free();
  }
  
  if (!authUserId) return res.status(401).json({ error: 'No autorizado' });

  const stmt = db.prepare('SELECT email_enabled, email_to, smtp_host, smtp_port, smtp_user, smtp_password, notify_time, notify_day_before FROM notification_settings WHERE owner_id = ?');
  stmt.bind([authUserId]);
  let settings = null;
  if (stmt.step()) settings = stmt.getAsObject();
  stmt.free();
  
  console.log('notification_settings DB result:', settings);
  
  if (settings && settings.smtp_password) {
    settings.has_smtp_password = true;
    settings.smtp_password = '';
  }
  
  console.log('sending to frontend:', JSON.stringify(settings));
  
  res.json(settings || {});
});

app.post('/api/notifications/settings', (req, res) => {
  const { username, password, userId } = req.headers || {};
  
  let authUserId = null;
  
  if (userId) {
    const numericUserId = parseInt(userId, 10);
    if (!isNaN(numericUserId)) {
      const stmt = db.prepare('SELECT id FROM auth_user WHERE id = ?');
      stmt.bind([numericUserId]);
      if (stmt.step()) {
        authUserId = stmt.getAsObject().id;
      }
      stmt.free();
    }
  }
  
  if (!authUserId && username && password) {
    const stmt = db.prepare('SELECT id FROM auth_user WHERE username = ?');
    stmt.bind([username]);
    if (stmt.step()) {
      authUserId = stmt.getAsObject().id;
    }
    stmt.free();
  }
  
  if (!authUserId) return res.status(401).json({ error: 'No autorizado' });

  try {
    const { email_enabled, email_to, smtp_host, smtp_port, smtp_user, smtp_password, notify_time, notify_timezone, notify_day_before } = req.body || {};

    console.log('POST /api/notifications/settings - smtp_password received:', !!smtp_password, 'length:', smtp_password?.length);

    const currentStmt = db.prepare('SELECT smtp_password, notify_timezone FROM notification_settings WHERE owner_id = ?');
    currentStmt.bind([authUserId]);
    let current = null;
    if (currentStmt.step()) current = currentStmt.getAsObject();
    currentStmt.free();

    console.log('POST /api/notifications/settings - current smtp_password:', !!current?.smtp_password);

    const passwordToSave = smtp_password || current?.smtp_password || '';
    console.log('POST /api/notifications/settings - passwordToSave:', !!passwordToSave, 'length:', passwordToSave?.length);
    const timezone = notify_timezone || current?.notify_timezone || 'Europe/Madrid';

    const checkStmt = db.prepare('SELECT id FROM notification_settings WHERE owner_id = ?');
    checkStmt.bind([authUserId]);
    const exists = checkStmt.step();
    checkStmt.free();

    if (exists) {
      const stmt = db.prepare(`
        UPDATE notification_settings SET 
          email_enabled = ?,
          email_to = ?,
          smtp_host = ?,
          smtp_port = ?,
          smtp_user = ?,
          smtp_password = ?,
          notify_time = ?,
          notify_timezone = ?,
          notify_day_before = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE owner_id = ?
      `);
      stmt.run([
        email_enabled ? 1 : 0,
        email_to || null,
        smtp_host || 'smtp.gmail.com',
        smtp_port || 587,
        smtp_user || null,
        passwordToSave,
        notify_time || '22:00',
        timezone,
        notify_day_before ? 1 : 0,
        authUserId
      ]);
      stmt.free();
    } else {
      const stmt = db.prepare(`
        INSERT INTO notification_settings (owner_id, email_enabled, email_to, smtp_host, smtp_port, smtp_user, smtp_password, notify_time, notify_timezone, notify_day_before)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run([
        authUserId,
        email_enabled ? 1 : 0,
        email_to || null,
        smtp_host || 'smtp.gmail.com',
        smtp_port || 587,
        smtp_user || null,
        passwordToSave,
        notify_time || '22:00',
        timezone,
        notify_day_before ? 1 : 0
      ]);
      stmt.free();
    }
    saveDb();

    if (notify_time) {
      scheduleNotification(notify_time, timezone);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving notification settings:', error);
    res.status(500).json({ error: 'Error guardando configuración' });
  }
});

app.post('/api/notifications/test', async (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });

  const { email_to, smtp_host, smtp_port, smtp_user, smtp_password } = req.body || {};

  if (!email_to || !smtp_user || !smtp_password) {
    return res.status(400).json({ error: 'Faltan datos del email' });
  }

  const testEvents = [
    { title: 'Ejemplo: Cita médica', description: 'Esta es una notificación de prueba', start_time: '10:00', end_time: '11:00' }
  ];
  const testProfile = { name: 'Usuario de prueba', family_name: 'Mi Familia' };

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

app.post('/api/notifications/test-saved', async (req, res) => {
  const { username, password, userId } = req.headers || {};
  
  let authUserId = null;
  
  if (userId) {
    const numericUserId = parseInt(userId, 10);
    if (!isNaN(numericUserId)) {
      const stmt = db.prepare('SELECT id FROM auth_user WHERE id = ?');
      stmt.bind([numericUserId]);
      if (stmt.step()) {
        authUserId = stmt.getAsObject().id;
      }
      stmt.free();
    }
  }
  
  if (!authUserId && username && password) {
    const stmt = db.prepare('SELECT id FROM auth_user WHERE username = ?');
    stmt.bind([username]);
    if (stmt.step()) {
      authUserId = stmt.getAsObject().id;
    }
    stmt.free();
  }
  
  if (!authUserId) return res.status(401).json({ error: 'No autorizado' });

  console.log('test-saved - authUserId:', authUserId);

  const settingsStmt = db.prepare('SELECT * FROM notification_settings WHERE owner_id = ?');
  settingsStmt.bind([authUserId]);
  let settings = null;
  if (settingsStmt.step()) settings = settingsStmt.getAsObject();
  settingsStmt.free();

  console.log('test-saved - settings from DB:', JSON.stringify(settings));

  if (!settings?.email_enabled || !settings?.email_to || !settings?.smtp_user || !settings?.smtp_password) {
    return res.status(400).json({ error: 'Email no configurado. Guarda la configuración primero.' });
  }

  const testEvents = [
    { title: 'Ejemplo: Cita médica', description: 'Esta es una notificación de prueba', start_time: '10:00', end_time: '11:00' }
  ];
  const testProfile = { name: 'Usuario de prueba', family_name: 'Mi Familia' };

  const result = await sendNotificationEmail(settings, testEvents, testProfile);

  if (result.success) {
    res.json({ success: true, message: 'Email de prueba enviado' });
  } else {
    res.status(500).json({ error: 'Error enviando email: ' + result.reason });
  }
});

app.post('/api/tasks/send-email', async (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });

  try {
    const settingsStmt = db.prepare('SELECT * FROM notification_settings WHERE owner_id = ?');
    settingsStmt.bind([userId]);
    let settings = null;
    if (settingsStmt.step()) settings = settingsStmt.getAsObject();
    settingsStmt.free();

    if (!settings?.email_enabled || !settings?.email_to || !settings?.smtp_user || !settings?.smtp_password) {
      return res.status(400).json({ error: 'Email no configurado. Configura las notificaciones en tu perfil.' });
    }

    const profileStmt = db.prepare('SELECT * FROM user_profile WHERE owner_id = ?');
    profileStmt.bind([userId]);
    let profile = { name: 'Usuario', family_name: 'Mi Familia' };
    if (profileStmt.step()) profile = profileStmt.getAsObject();
    profileStmt.free();

    const accessibleIds = getAccessibleUserIds(userId, 'share_tasks');
    const placeholders = accessibleIds.map(() => '?').join(',');
    
    const tasksStmt = db.prepare(`SELECT * FROM family_tasks WHERE owner_id IN (${placeholders}) AND completed = 0 ORDER BY CASE priority WHEN "high" THEN 0 WHEN "urgent" THEN 0 WHEN "normal" THEN 1 WHEN "low" THEN 2 ELSE 1 END, due_date ASC`);
    tasksStmt.bind([...accessibleIds]);
    const tasks = [];
    while (tasksStmt.step()) {
      tasks.push(tasksStmt.getAsObject());
    }
    tasksStmt.free();

    const result = await sendNotificationEmail(settings, [], [], profile, tasks);

    if (result.success) {
      res.json({ success: true, message: 'Email enviado correctamente' });
    } else {
      res.status(500).json({ error: 'Error enviando email: ' + result.reason });
    }
  } catch (error) {
    console.error('Error sending tasks email:', error);
    res.status(500).json({ error: 'Error enviando email' });
  }
});

let notificationTask = null;

function scheduleNotification(timeStr, timezone = 'Europe/Madrid') {
  const [hours, minutes] = timeStr.split(':');
  const cronExpr = `${minutes} ${hours} * * *`;
  
  if (notificationTask) {
    notificationTask.stop();
  }
  
  try {
    notificationTask = cron.schedule(cronExpr, async () => {
      console.log('Running daily notification job...');
      await runDailyNotification();
    }, {
      timezone: timezone
    });
    console.log(`Notification scheduled for ${timeStr} (${timezone})`);
  } catch (e) {
    console.error('Error scheduling notification:', e);
  }
}

app.get('/api/contacts', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const accessibleIds = getAccessibleUserIds(userId, 'share_contacts');
  const placeholders = accessibleIds.map(() => '?').join(',');
  const stmt = db.prepare(`SELECT * FROM family_contacts WHERE owner_id IN (${placeholders}) ORDER BY name ASC`);
  stmt.bind(accessibleIds);
  
  const contacts = [];
  while (stmt.step()) {
    contacts.push(stmt.getAsObject());
  }
  stmt.free();
  
  res.json(contacts);
});

app.post('/api/contacts', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { name, relationship, phone, email, address, notes } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }
  
  const stmt = db.prepare(`
    INSERT INTO family_contacts (owner_id, name, relationship, phone, email, address, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  try {
    stmt.run([userId, name, relationship || null, phone || null, email || null, address || null, notes || null]);
    stmt.free();
    saveDb();
    res.json({ success: true });
  } catch (error) {
    console.error('Error inserting contact:', error);
    res.status(500).json({ error: 'Error insertando contacto' });
  }
});

app.post('/api/contacts/import', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { contacts } = req.body;
  
  if (!Array.isArray(contacts) || contacts.length === 0) {
    return res.status(400).json({ error: 'No se proporcionaron contactos' });
  }
  
  let imported = 0;
  let skipped = 0;
  const errors = [];
  
  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    
    if (!contact.name) {
      skipped++;
      errors.push({ row: i + 1, error: 'Falta el nombre' });
      continue;
    }
    
    try {
      const stmt = db.prepare(`
        INSERT INTO family_contacts (owner_id, name, relationship, phone, email, address, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run([
        userId,
        contact.name,
        contact.relationship || null,
        contact.phone || null,
        contact.email || null,
        contact.address || null,
        contact.notes || null
      ]);
      stmt.free();
      imported++;
    } catch (e) {
      errors.push({ row: i + 1, error: e.message });
    }
  }
  
  saveDb();
  
  res.json({
    success: true,
    summary: { total: contacts.length, imported, skipped: skipped + errors.length },
    details: { errors }
  });
});

app.delete('/api/contacts/:id', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  const { id } = req.params;
  
  const checkStmt = db.prepare('SELECT owner_id FROM family_contacts WHERE id = ?');
  checkStmt.bind([id]);
  const owner = checkStmt.step() ? checkStmt.getAsObject() : null;
  checkStmt.free();
  
  if (!owner || owner.owner_id !== userId) {
    return res.status(403).json({ error: 'No autorizado' });
  }
  
  db.run('DELETE FROM family_contacts WHERE id = ?', [id]);
  saveDb();
  res.json({ success: true });
});

await initDb();

const loadNotificationSettings = db.prepare('SELECT DISTINCT notify_time, notify_timezone FROM notification_settings WHERE email_enabled = 1 LIMIT 1');
if (loadNotificationSettings.step()) {
  const settings = loadNotificationSettings.getAsObject();
  if (settings.notify_time) {
    scheduleNotification(settings.notify_time, settings.notify_timezone || 'Europe/Madrid');
  }
}
loadNotificationSettings.free();

app.get('/api/gallery/photos', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });

  const stmt = db.prepare('SELECT * FROM family_gallery WHERE owner_id = ? ORDER BY created_at DESC');
  stmt.bind([userId]);

  const photos = [];
  while (stmt.step()) {
    photos.push(stmt.getAsObject());
  }
  stmt.free();

  res.json(photos);
});

app.post('/api/gallery/photos', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });

  const { title, description, image_data, album } = req.body;

  if (!title || !image_data) {
    return res.status(400).json({ error: 'El título y la imagen son obligatorios' });
  }

  try {
    const stmt = db.prepare('INSERT INTO family_gallery (owner_id, title, description, image_data, album) VALUES (?, ?, ?, ?, ?)');
    stmt.run([userId, title, description || null, image_data, album || 'General']);
    stmt.free();
    saveDb();

    const newStmt = db.prepare('SELECT * FROM family_gallery WHERE owner_id = ? ORDER BY id DESC LIMIT 1');
    newStmt.bind([userId]);
    let newPhoto = null;
    if (newStmt.step()) newPhoto = newStmt.getAsObject();
    newStmt.free();

    res.json({ success: true, photo: newPhoto });
  } catch (error) {
    console.error('Error inserting photo:', error);
    res.status(500).json({ error: 'Error insertando foto' });
  }
});

app.delete('/api/gallery/photos/:id', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });

  const { id } = req.params;

  const checkStmt = db.prepare('SELECT owner_id FROM family_gallery WHERE id = ?');
  checkStmt.bind([id]);
  let photo = null;
  if (checkStmt.step()) photo = checkStmt.getAsObject();
  checkStmt.free();

  if (!photo) return res.status(404).json({ error: 'Foto no encontrada' });
  if (photo.owner_id !== userId) return res.status(403).json({ error: 'No tienes permisos' });

  try {
    db.run('DELETE FROM family_gallery WHERE id = ?', [id]);
    saveDb();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Error eliminando foto' });
  }
});

app.get('/api/gallery/albums', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  if (!userId) return res.status(401).json({ error: 'No autorizado' });

  const stmt = db.prepare('SELECT album as name, COUNT(*) as count FROM family_gallery WHERE owner_id = ? GROUP BY album ORDER BY album');
  stmt.bind([userId]);

  const albums = [];
  while (stmt.step()) {
    albums.push(stmt.getAsObject());
  }
  stmt.free();

  res.json(albums);
});

app.post('/api/contact', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  const { name, email, subject, message } = req.body;
  if (!message) return res.status(400).json({ error: 'El mensaje es obligatorio' });
  try {
    const stmt = db.prepare('INSERT INTO contact_messages (owner_id, name, email, subject, message) VALUES (?, ?, ?, ?, ?)');
    stmt.run([userId || null, name || '', email || '', subject || '', message]);
    stmt.free();
    saveDb();
    res.json({ success: true });
  } catch (error) {
    console.error('Error creating contact message:', error);
    res.status(500).json({ error: 'Error enviando mensaje' });
  }
});

app.get('/api/contact', (req, res) => {
  const { username, password } = req.headers || {};
  if (!username || !password) return res.status(401).json({ error: 'No autorizado' });
  const stmt = db.prepare('SELECT id, is_admin FROM auth_user WHERE username = ?');
  stmt.bind([username]);
  let admin = null;
  if (stmt.step()) admin = stmt.getAsObject();
  stmt.free();
  if (!admin || !admin.is_admin) return res.status(403).json({ error: 'Solo administradores' });
  try {
    const messagesStmt = db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC');
    const messages = [];
    while (messagesStmt.step()) messages.push(messagesStmt.getAsObject());
    messagesStmt.free();
    res.json(messages);
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({ error: 'Error fetching messages' });
  }
});

app.put('/api/contact/:id', (req, res) => {
  const { username, password } = req.headers || {};
  if (!username || !password) return res.status(401).json({ error: 'No autorizado' });
  const stmt = db.prepare('SELECT id, is_admin FROM auth_user WHERE username = ?');
  stmt.bind([username]);
  let admin = null;
  if (stmt.step()) admin = stmt.getAsObject();
  stmt.free();
  if (!admin || !admin.is_admin) return res.status(403).json({ error: 'Solo administradores' });
  const { id } = req.params;
  const { status } = req.body;
  try {
    const updateStmt = db.prepare('UPDATE contact_messages SET status = ? WHERE id = ?');
    updateStmt.run([status || 'pending', id]);
    updateStmt.free();
    saveDb();
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating contact message:', error);
    res.status(500).json({ error: 'Error actualizando mensaje' });
  }
});

app.delete('/api/contact/:id', (req, res) => {
  const { username, password } = req.headers || {};
  if (!username || !password) return res.status(401).json({ error: 'No autorizado' });
  const stmt = db.prepare('SELECT id, is_admin FROM auth_user WHERE username = ?');
  stmt.bind([username]);
  let admin = null;
  if (stmt.step()) admin = stmt.getAsObject();
  stmt.free();
  if (!admin || !admin.is_admin) return res.status(403).json({ error: 'Solo administradores' });
  const { id } = req.params;
  try {
    db.run('DELETE FROM contact_messages WHERE id = ?', [id]);
    saveDb();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact message:', error);
    res.status(500).json({ error: 'Error eliminando mensaje' });
  }
});

app.post('/api/sales-contact', (req, res) => {
  const userId = getCurrentUserId(req.headers);
  const { companyName, contactName, email, phone, employees, message } = req.body;
  if (!message) return res.status(400).json({ error: 'El mensaje es obligatorio' });
  try {
    const stmt = db.prepare('INSERT INTO sales_contacts (owner_id, company_name, contact_name, email, phone, employees, message) VALUES (?, ?, ?, ?, ?, ?, ?)');
    stmt.run([userId || null, companyName || '', contactName || '', email || '', phone || '', employees || '', message]);
    stmt.free();
    saveDb();
    res.json({ success: true });
  } catch (error) {
    console.error('Error creating sales contact:', error);
    res.status(500).json({ error: 'Error enviando solicitud' });
  }
});

app.get('/api/sales-contact', (req, res) => {
  const { username, password } = req.headers || {};
  if (!username || !password) return res.status(401).json({ error: 'No autorizado' });
  const stmt = db.prepare('SELECT id, is_admin FROM auth_user WHERE username = ?');
  stmt.bind([username]);
  let admin = null;
  if (stmt.step()) admin = stmt.getAsObject();
  stmt.free();
  if (!admin || !admin.is_admin) return res.status(403).json({ error: 'Solo administradores' });
  try {
    const contactsStmt = db.prepare('SELECT * FROM sales_contacts ORDER BY created_at DESC');
    const contacts = [];
    while (contactsStmt.step()) contacts.push(contactsStmt.getAsObject());
    contactsStmt.free();
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching sales contacts:', error);
    res.status(500).json({ error: 'Error fetching contacts' });
  }
});

app.put('/api/sales-contact/:id', (req, res) => {
  const { username, password } = req.headers || {};
  if (!username || !password) return res.status(401).json({ error: 'No autorizado' });
  const stmt = db.prepare('SELECT id, is_admin FROM auth_user WHERE username = ?');
  stmt.bind([username]);
  let admin = null;
  if (stmt.step()) admin = stmt.getAsObject();
  stmt.free();
  if (!admin || !admin.is_admin) return res.status(403).json({ error: 'Solo administradores' });
  const { id } = req.params;
  const { status } = req.body;
  try {
    const updateStmt = db.prepare('UPDATE sales_contacts SET status = ? WHERE id = ?');
    updateStmt.run([status || 'pending', id]);
    updateStmt.free();
    saveDb();
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating sales contact:', error);
    res.status(500).json({ error: 'Error actualizando contacto' });
  }
});

app.delete('/api/sales-contact/:id', (req, res) => {
  const { username, password } = req.headers || {};
  if (!username || !password) return res.status(401).json({ error: 'No autorizado' });
  const stmt = db.prepare('SELECT id, is_admin FROM auth_user WHERE username = ?');
  stmt.bind([username]);
  let admin = null;
  if (stmt.step()) admin = stmt.getAsObject();
  stmt.free();
  if (!admin || !admin.is_admin) return res.status(403).json({ error: 'Solo administradores' });
  const { id } = req.params;
  try {
    db.run('DELETE FROM sales_contacts WHERE id = ?', [id]);
    saveDb();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting sales contact:', error);
    res.status(500).json({ error: 'Error eliminando contacto' });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
