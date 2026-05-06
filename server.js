import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite Database
const db = new Database('database.sqlite', { verbose: console.log });

// Create users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Check if name exists in users table, if not add it (for migration)
try {
  const nameColumnCheck = db.prepare("SELECT name FROM users LIMIT 1");
  nameColumnCheck.get();
} catch (e) {
  db.exec("ALTER TABLE users ADD COLUMN name TEXT");
}

// Create passwords table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS passwords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    service_name TEXT NOT NULL,
    service_email TEXT NOT NULL,
    service_password TEXT NOT NULL,
    category TEXT DEFAULT 'Personal',
    icon_type TEXT DEFAULT 'generic',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )
`);

// Check if user_id exists in passwords table, if not add it (for migration)
try {
  const columnCheck = db.prepare("SELECT user_id FROM passwords LIMIT 1");
  columnCheck.get();
} catch (e) {
  // Column doesn't exist, alter table
  db.exec("ALTER TABLE passwords ADD COLUMN user_id INTEGER REFERENCES users(id)");
}

// API Routes

// Auth Routes
app.post('/api/signup', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });
  
  try {
    const stmt = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
    const result = stmt.run(name, email, password);
    
    // Assign any orphaned passwords to this first user
    db.exec(`UPDATE passwords SET user_id = ${result.lastInsertRowid} WHERE user_id IS NULL`);
    
    res.status(201).json({ id: result.lastInsertRowid, name, email });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  try {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?');
    const user = stmt.get(email, password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    res.json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auth Middleware
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.userId = parseInt(authHeader.split(' ')[1], 10);
  next();
};

// Get all passwords
app.get('/api/passwords', requireAuth, (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM passwords WHERE user_id = ? ORDER BY created_at DESC');
    const passwords = stmt.all(req.userId);
    res.json(passwords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new password
app.post('/api/passwords', requireAuth, (req, res) => {
  const { service_name, service_email, service_password, category, icon_type } = req.body;
  
  if (!service_name || !service_email || !service_password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const stmt = db.prepare(`
      INSERT INTO passwords (user_id, service_name, service_email, service_password, category, icon_type) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      req.userId,
      service_name, 
      service_email, 
      service_password, 
      category || 'Personal',
      icon_type || 'generic'
    );
    
    res.status(201).json({ 
      id: result.lastInsertRowid,
      message: 'Password saved successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a password
app.put('/api/passwords/:id', requireAuth, (req, res) => {
  const { service_name, service_email, service_password, category, icon_type } = req.body;
  const { id } = req.params;
  
  try {
    const stmt = db.prepare(`
      UPDATE passwords 
      SET service_name = ?, service_email = ?, service_password = ?, category = ?, icon_type = ?
      WHERE id = ? AND user_id = ?
    `);
    
    const info = stmt.run(
      service_name, 
      service_email, 
      service_password, 
      category || 'Personal',
      icon_type || 'generic',
      id,
      req.userId
    );
    
    if (info.changes === 0) return res.status(404).json({ error: 'Not found or unauthorized' });
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a password
app.delete('/api/passwords/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  
  try {
    const stmt = db.prepare('DELETE FROM passwords WHERE id = ? AND user_id = ?');
    const info = stmt.run(id, req.userId);
    
    if (info.changes === 0) return res.status(404).json({ error: 'Not found or unauthorized' });
    
    res.json({ message: 'Password deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
