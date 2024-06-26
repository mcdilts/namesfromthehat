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

const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
});

db.connect((err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

const sessionStore = new MySQLStore({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  schema: {
    tableName: 'sessions',
  },
});

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
  db.query(query, [username, password], (err, results) => {
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
  db.query(query, [name], function(err, results) {
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
  db.query(query, [eventId], function(err) {
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
  db.query(query, (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    } else {
      res.status(200).json(rows);
    }
  });
});

// Add this route to fetch user's events and given users
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
  db.query(query, [userId], (err, rows) => {
    if (err) {
      console.error('Failed to fetch user events:', err);
      res.status(500).json({ message: 'Failed to fetch user events' });
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
  db.query(query, [eventId], (err, rows) => {
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
  db.query(query, [eventId], (err, rows) => {
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
  db.query(query, [eventId, roundId], function(err) {
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
  db.query(query, [userId, bannedUserId, listId], function(err) {
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
  db.query(query, [userId], (err, rows) => {
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
  db.query(query, [userId, bannedUserId, listId], function(err) {
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
  db.query(query, [listId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    res.status(200).json(rows);
  });
});

// Assign Given Users for an event
app.post('/api/assign-given-users-event/:eventId', checkSession, (req, res) => {
  const eventId = req.params.eventId;
  let attempt = 0;

  async function assignUsers() {
    attempt++;
    console.log(`Assignment attempt: ${attempt}`);

    try {
      const rounds = await new Promise((resolve, reject) => {
        const roundsQuery = 'SELECT id FROM SelectionRounds WHERE event_id = ?';
        db.query(roundsQuery, [eventId], (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        });
      });

      if (rounds.length === 0) {
        console.log('No rounds found for the event');
        return res.status(500).json({ message: 'No rounds found for the event' });
      }

      const roundIds = rounds.map(r => r.id);
      console.log('Fetched rounds for event:', roundIds);

      const users = await new Promise((resolve, reject) => {
        const userQuery = 'SELECT id, banned_users FROM Users';
        db.query(userQuery, [], (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        });
      });

      const availableUsers = users.map(u => u.id);
      console.log('Fetched users:', availableUsers);

      const existingAssignments = await new Promise((resolve, reject) => {
        const existingAssignmentsQuery = `
          SELECT us.user_id, us.given_user_id
          FROM UserSelections us
          JOIN SelectionRounds sr ON us.round_id = sr.id
          WHERE sr.event_id = ?
        `;
        db.query(existingAssignmentsQuery, [eventId], (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        });
      });

      const existingPairs = new Set(existingAssignments.map(a => `${a.user_id}-${a.given_user_id}`));
      console.log('Existing assignments:', Array.from(existingPairs));

      const allAssignments = [];

      for (const roundId of roundIds) {
        const assignments = [];
        const localExistingPairs = new Set(existingPairs);
        const assignedGivenUsers = new Set();
        let constraintsError = false;

        for (const user of users) {
          const bannedUsers = user.banned_users ? user.banned_users.split(',').map(Number) : [];

          const listBannedUsers = await new Promise((resolve, reject) => {
            const listBannedQuery = 'SELECT banned_user_id FROM ListBannedUsers WHERE user_id = ? AND list_id = ?';
            db.query(listBannedQuery, [user.id, roundId], (err, rows) => {
              if (err) return reject(err);
              resolve(rows.map(u => u.banned_user_id));
            });
          });

          let possibleUsers = availableUsers.filter(id => 
            id !== user.id && 
            !bannedUsers.includes(id) && 
            !listBannedUsers.includes(id) &&
            !localExistingPairs.has(`${user.id}-${id}`) && 
            !assignedGivenUsers.has(id)
          );

          if (possibleUsers.length === 0) {
            console.error('No possible users for:', user.id);
            constraintsError = true;
            break;
          }

          const givenUserId = possibleUsers[Math.floor(Math.random() * possibleUsers.length)];
          assignments.push({ user_id: user.id, given_user_id: givenUserId, round_id: roundId });
          localExistingPairs.add(`${user.id}-${givenUserId}`);
          assignedGivenUsers.add(givenUserId);

          console.log(`Assigned user ${user.id} to given user ${givenUserId} in round ${roundId}`);
        }

        if (constraintsError) {
          if (attempt < 5) {
            console.log('Retrying assignment due to constraints...');
            return assignUsers();
          } else {
            return res.status(500).json({ message: 'Unable to assign given users due to constraints' });
          }
        }

        allAssignments.push(...assignments);
      }

      const insertQuery = 'INSERT INTO UserSelections (user_id, given_user_id, round_id) VALUES (?, ?, ?)';
      await Promise.all(allAssignments.map(assignment => {
        return new Promise((resolve, reject) => {
          db.query(insertQuery, [assignment.user_id, assignment.given_user_id, assignment.round_id], err => {
            if (err) return reject(err);
            resolve();
          });
        });
      }));

      console.log('All assignments inserted successfully');
      return res.status(200).json({ message: 'Given users assigned successfully' });

    } catch (error) {
      console.error('Error during assignment:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  assignUsers();
});

app.get('/api/selection-round-list', checkSession, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'selection-round-list.html'));
});

app.get('/api/selection-round/:id', checkSession, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'selection-round.html'));
});

app.post('/api/create-selection-round', checkSession, (req, res) => {
  const { name, eventId } = req.body;
  const query = 'INSERT INTO SelectionRounds (name, event_id) VALUES (?, ?)';
  db.query(query, [name, eventId], function(err, results) {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    } else {
      res.status(200).json({ message: 'Selection round created successfully', roundId: results.insertId });
    }
  });
});

app.delete('/api/delete-selection-round/:id', checkSession, (req, res) => {
  const roundId = req.params.id;
  const query = 'DELETE FROM SelectionRounds WHERE id = ?';
  db.query(query, [roundId], function(err) {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    } else {
      res.status(200).json({ message: 'Selection round deleted successfully' });
    }
  });
});

app.get('/api/selection-rounds', checkSession, (req, res) => {
  const query = 'SELECT * FROM SelectionRounds';
  db.query(query, [], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    } else {
      res.status(200).json(rows);
    }
  });
});

app.get('/api/selection-round-data/:id', checkSession, (req, res) => {
  const roundId = req.params.id;
  const query = 'SELECT * FROM SelectionRounds WHERE id = ?';
  db.query(query, [roundId], (err, row) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    } else if (row) {
      res.status(200).json(row);
    } else {
      res.status(404).json({ message: 'Selection round not found' });
    }
  });
});

app.get('/api/given-users/:roundId', checkSession, (req, res) => {
  const roundId = req.params.roundId;
  const query = `
    SELECT u.username, gu.username AS given_username
    FROM Users u
    LEFT JOIN UserSelections us ON u.id = us.user_id AND us.round_id = ?
    LEFT JOIN Users gu ON us.given_user_id = gu.id
  `;
  db.query(query, [roundId], (err, rows) => {
    if (err) {
      console.error('Error fetching given users:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    res.status(200).json(rows);
  });
});

// User login and dashboard routes
app.get('/login', (req, res) => {
  const filePath = path.join(__dirname, '..', 'public', 'login.html');
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('File does not exist:', filePath);
      return res.status(404).send('File not found');
    }
    res.sendFile(filePath);
  });
});

app.get('/dashboard', checkSession, (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'user-dashboard.html'));
});

app.get('/api/user-lists', checkSession, (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const userId = req.session.userId;
  const query = `
    SELECT sr.name, us.given_user_id, u.username AS given_user
    FROM UserSelections us
    JOIN SelectionRounds sr ON us.round_id = sr.id
    LEFT JOIN Users u ON us.given_user_id = u.id
    WHERE us.user_id = ?
  `;
  db.query(query, [userId], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    } else {
      res.status(200).json(rows.map(row => ({
        name: row.name,
        given_user: row.given_user
      })));
    }
  });
});

// User management routes
app.get('/api/users', checkSession, (req, res) => {
  const query = 'SELECT id, username FROM Users';
  db.query(query, [], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    } else {
      res.status(200).json(rows);
    }
  });
});

app.get('/api/banned-users/:userId', checkSession, (req, res) => {
  const userId = req.params.userId;
  const query = `
    SELECT bu.banned_user_id, u.username 
    FROM BannedUsers bu 
    JOIN Users u ON bu.banned_user_id = u.id 
    WHERE bu.user_id = ?
  `;
  db.query(query, [userId], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    } else {
      res.status(200).json(rows);
    }
  });
});

app.post('/api/add-banned-user', checkSession, (req, res) => {
  const { userId, bannedUserId } = req.body;
  const query = 'INSERT INTO BannedUsers (user_id, banned_user_id) VALUES (?, ?)';
  db.query(query, [userId, bannedUserId], function(err) {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    } else {
      res.status(200).json({ message: 'Banned user added successfully' });
    }
  });
});

app.post('/api/remove-banned-user', checkSession, (req, res) => {
  const { userId, bannedUserId } = req.body;
  const query = 'DELETE FROM BannedUsers WHERE user_id = ? AND banned_user_id = ?';
  db.query(query, [userId, bannedUserId], function(err) {
    if (err) {
      console.error('Failed to remove banned user:', err);
      res.status(500).json({ message: 'Failed to remove banned user' });
    } else {
      res.status(200).json({ message: 'Banned user removed successfully' });
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
