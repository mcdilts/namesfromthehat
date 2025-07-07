const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');
const MySQLStore = require('express-mysql-session')(session);
const fs = require('fs');

dotenv.config();

const app = express();

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

const pool = mysql.createPool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const sessionStore = new MySQLStore({
  expiration: 10800000,
  createDatabaseTable: true,
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  }
}, pool.promise());

app.use(bodyParser.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: { secure: false, httpOnly: true },
  })
);

// Middleware to log session data
app.use((req, res, next) => {
  console.log("Middleware session check:", req.session);
  next();
});

// Middleware to check session and redirect to login if not present
function checkSession(req, res, next) {
  if (!req.session || !req.session.userId) {
    console.log("No user session found. Redirecting to login page.");
    return res.redirect('/login');
  }
  next();
}

// Check if login.html exists and serve it
app.get('/login', (req, res) => {
  const filePath = path.join(__dirname, '..', 'public', 'login.html');
  console.log(`Checking file path: ${filePath}`);
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('File does not exist:', filePath);
      return res.status(404).send('File not found');
    }
    res.sendFile(filePath);
  });
});

// Define API routes
app.get('/api/user-data', (req, res) => {
  console.log("Checking user session in /api/user-data:", req.session);
  if (req.session && req.session.userId) {
    res.status(200).json({
      loggedIn: true,
      username: req.session.username,
    });
  } else {
    res.status(200).json({
      loggedIn: false,
    });
  }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const query = 'SELECT id, username FROM Users WHERE username = ? AND password = ?';
  pool.query(query, [username, password], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    if (results.length > 0) {
      const user = results[0];
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: 'Session save error' });
        }
        console.log("Login successful for user:", user.username);
        console.log("Session after login:", req.session);
        return res.status(200).json({ message: 'Login successful' });
      });
    } else {
      console.log("Invalid username or password.");
      return res.status(401).json({ message: 'Invalid username or password' });
    }
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Logout successful' });
  });
});

// Serve other pages
app.get('/dashboard', checkSession, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'user-dashboard.html'));
});

app.get('/admin', checkSession, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

app.get('/event-management', checkSession, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'event-management.html'));
});

app.get('/manage-event/:id', checkSession, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'manage-event.html'));
});

app.get('/user-management', checkSession, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'user-management.html'));
});

app.post('/api/create-event', checkSession, (req, res) => {
  const { name } = req.body;
  const query = 'INSERT INTO Events (name) VALUES (?)';
  pool.query(query, [name], function(err, results) {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    } else {
      res.status(200).json({ message: 'Event created successfully', eventId: results.insertId });
    }
  });
});

app.delete('/api/delete-event/:id', checkSession, (req, res) => {
  const eventId = req.params.id;
  const query = 'DELETE FROM Events WHERE id = ?';
  pool.query(query, [eventId], function(err) {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    } else {
      res.status(200).json({ message: 'Event deleted successfully' });
    }
  });
});

app.get('/api/events', checkSession, (req, res) => {
  const query = 'SELECT * FROM Events';
  pool.query(query, (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    } else {
      res.status(200).json(rows);
    }
  });
});

app.get('/api/available-rounds/:eventId', checkSession, (req, res) => {
  const eventId = req.params.eventId;
  const query = `
    SELECT sr.id, sr.name
    FROM SelectionRounds sr
    LEFT JOIN EventLists el ON sr.id = el.round_id AND el.event_id = ?
    WHERE el.event_id IS NULL
  `;
  pool.query(query, [eventId], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    } else {
      res.status(200).json(rows);
    }
  });
});

app.get('/api/event-rounds/:eventId', checkSession, (req, res) => {
  const eventId = req.params.eventId;
  const query = `
    SELECT sr.id, sr.name
    FROM SelectionRounds sr
    JOIN EventLists el ON sr.id = el.round_id
    WHERE el.event_id = ?
  `;
  pool.query(query, [eventId], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    } else {
      res.status(200).json(rows);
    }
  });
});

app.post('/api/add-list-to-event', checkSession, (req, res) => {
  const { eventId, roundId } = req.body;
  const query = 'INSERT INTO EventLists (event_id, round_id) VALUES (?, ?)';
  pool.query(query, [eventId, roundId], function(err) {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    } else {
      res.status(200).json({ message: 'List added to event successfully' });
    }
  });
});

app.post('/api/add-list-banned-user', checkSession, (req, res) => {
  const { userId, bannedUserId, listId } = req.body;
  const query = 'INSERT INTO ListBannedUsers (user_id, banned_user_id, list_id) VALUES (?, ?, ?)';
  pool.query(query, [userId, bannedUserId, listId], function(err) {
    if (err) {
      console.error('Failed to add list banned user:', err);
      res.status(500).json({ message: 'Failed to add list banned user' });
    } else {
      res.status(200).json({ message: 'List banned user added successfully' });
    }
  });
});

app.get('/api/list-banned-users/:userId', checkSession, (req, res) => {
  const userId = req.params.userId;
  const query = `
    SELECT lbu.banned_user_id AS id, u.username, sr.name AS listName, lbu.list_id AS listId
    FROM ListBannedUsers lbu
    JOIN Users u ON lbu.banned_user_id = u.id
    JOIN SelectionRounds sr ON lbu.list_id = sr.id
    WHERE lbu.user_id = ?
  `;
  pool.query(query, [userId], (err, rows) => {
    if (err) {
      console.error('Failed to fetch list banned users:', err);
      res.status(500).json({ message: 'Failed to fetch list banned users' });
    } else {
      res.status(200).json(rows);
    }
  });
});

app.post('/api/remove-list-banned-user', checkSession, (req, res) => {
  const { userId, bannedUserId, listId } = req.body;
  const query = 'DELETE FROM ListBannedUsers WHERE user_id = ? AND banned_user_id = ? AND list_id = ?';
  pool.query(query, [userId, bannedUserId, listId], function(err) {
    if (err) {
      console.error('Failed to remove list banned user:', err);
      res.status(500).json({ message: 'Failed to remove list banned user' });
    } else {
      res.status(200).json({ message: 'List banned user removed successfully' });
    }
  });
});

app.get('/api/banned-users-for-list/:listId', checkSession, (req, res) => {
  const listId = req.params.listId;
  const query = `
    SELECT u.username AS user, bu.username AS banned_user
    FROM ListBannedUsers lbu
    JOIN Users u ON lbu.user_id = u.id
    JOIN Users bu ON lbu.banned_user_id = bu.id
    WHERE lbu.list_id = ?
  `;
  pool.query(query, [listId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    res.status(200).json(rows);
  });
});

/* ---------- user-admin routes ---------- */
// 1.  List all users
app.get('/api/users', checkSession, (req, res) => {
  pool.query('SELECT id, username FROM Users ORDER BY username', (err, rows) => {
    if (err) {
      console.error('Failed to fetch users:', err);
      return res.status(500).json({ message: 'Could not fetch users' });
    }
    res.json(rows);
  });
});

// 2.  Add a user  { username, password }
app.post('/api/users', checkSession, (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'username and password required' });
  }
  pool.query(
    'INSERT INTO Users (username, password) VALUES (?, ?)',
    [username, password],
    (err, result) => {
      if (err) {
        console.error('Failed to create user:', err);
        return res.status(500).json({ message: 'Could not create user' });
      }
      res.json({ id: result.insertId, username });
    }
  );
});

// 3.  Delete a user  /api/users/7
app.delete('/api/users/:id', checkSession, (req, res) => {
  const { id } = req.params;
  pool.query('DELETE FROM Users WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('Failed to delete user:', err);
      return res.status(500).json({ message: 'Could not delete user' });
    }
    res.json({ message: 'User removed' });
  });
});

// Fetch user's events and given users
app.get('/api/user-events', checkSession, (req, res) => {
  const userId = req.session.userId;
  const query = `
    SELECT 
      e.name AS eventName, 
      sr.name AS listName, 
      u.username AS givenUser 
    FROM 
      UserSelections us
      JOIN SelectionRounds sr ON us.round_id = sr.id
      JOIN Events e ON sr.event_id = e.id
      JOIN Users u ON us.given_user_id = u.id
    WHERE 
      us.user_id = ?
  `;
  pool.query(query, [userId], (err, rows) => {
    if (err) {
      console.error('Failed to fetch user events:', err);
      res.status(500).json({ message: 'Failed to fetch user events' });
    } else {
      res.status(200).json(rows);
    }
  });
});

// Ensure server starts only once
if (require.main === module) {
  const port = process.env.PORT || 3003;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

module.exports = app;
