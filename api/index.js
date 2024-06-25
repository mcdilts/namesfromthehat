const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const session = require('express-session');
const path = require('path');

const app = express();
const router = express.Router();

// Set up middleware
app.use(bodyParser.json());
app.use(session({
  secret: 'secret-key', // Replace with a secure secret key
  resave: false,
  saveUninitialized: true
}));

const db = mysql.createConnection({
  host: 'p3plzcpnl505317.prod.phx3.secureserver.net',
  port: 3306,
  user: process.env(DATABASE_USER),
  password: process.env(DATABASE_AUTH),
  database: 'namesfromthehat'
});

db.connect((err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Login route
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const query = 'SELECT id, username FROM Users WHERE username = ? AND password = ?';
  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error('Login query failed:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    if (results.length > 0) {
      const user = results[0];
      req.session.userId = user.id;
      req.session.username = user.username;
      res.status(200).json({ message: 'Login successful' });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  });
});

// Admin and event management routes
router.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

router.get('/event-management', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'event-management.html'));
});

router.get('/manage-event/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'manage-event.html'));
});

router.get('/user-management', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user-management.html'));
});

// Event CRUD operations
router.post('/create-event', (req, res) => {
  const { name } = req.body;
  const query = 'INSERT INTO Events (name) VALUES (?)';
  db.query(query, [name], function(err, result) {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    } else {
      res.status(200).json({ message: 'Event created successfully', eventId: result.insertId });
    }
  });
});

router.delete('/delete-event/:id', (req, res) => {
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

router.get('/events', (req, res) => {
  const query = 'SELECT * FROM Events';
  db.query(query, [], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    } else {
      res.status(200).json(rows);
    }
  });
});

router.get('/event-data/:id', (req, res) => {
  const eventId = req.params.id;
  const query = 'SELECT * FROM Events WHERE id = ?';
  db.query(query, [eventId], (err, row) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    } else if (row.length > 0) {
      res.status(200).json(row[0]);
    } else {
      res.status(404).json({ message: 'Event not found' });
    }
  });
});

// Fetch available rounds not associated with the event
router.get('/available-rounds/:eventId', (req, res) => {
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

// Fetch rounds associated with the event
router.get('/event-rounds/:eventId', (req, res) => {
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

// Add existing round to event
router.post('/add-list-to-event', (req, res) => {
  const { eventId, roundId } = req.body;
  const query = 'INSERT INTO EventLists (event_id, round_id) VALUES (?, ?)';
  db.query(query, [eventId, roundId], function(err) {
    if (err) {
      console.error(err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Internal server error' });
      }
    } else {
      if (!res.headersSent) {
        res.status(200).json({ message: 'List added to event successfully' });
      }
    }
  });
});

// Add banned user to list
router.post('/add-list-banned-user', (req, res) => {
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

router.get('/list-banned-users/:userId', (req, res) => {
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

router.post('/remove-list-banned-user', (req, res) => {
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

router.get('/banned-users-for-list/:listId', (req, res) => {
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
router.post('/assign-given-users-event/:eventId', (req, res) => {
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
      const insertStmt = db.prepare(insertQuery);

      await Promise.all(allAssignments.map(assignment => {
        return new Promise((resolve, reject) => {
          insertStmt.run([assignment.user_id, assignment.given_user_id, assignment.round_id], err => {
            if (err) return reject(err);
            resolve();
          });
        });
      }));

      insertStmt.finalize();
      console.log('All assignments inserted successfully');
      return res.status(200).json({ message: 'Given users assigned successfully' });

    } catch (error) {
      console.error('Error during assignment:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  assignUsers();
});

// Create new round and associate with event
router.post('/create-selection-round', (req, res) => {
  const { name, eventId } = req.body;
  const query = 'INSERT INTO SelectionRounds (name, event_id) VALUES (?, ?)';
  db.query(query, [name, eventId], function(err, result) {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    } else {
      res.status(200).json({ message: 'Selection round created successfully', roundId: result.insertId });
    }
  });
});

router.delete('/delete-selection-round/:id', (req, res) => {
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

router.get('/selection-rounds', (req, res) => {
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

router.get('/selection-round-data/:id', (req, res) => {
  const roundId = req.params.id;
  const query = 'SELECT * FROM SelectionRounds WHERE id = ?';
  db.query(query, [roundId], (err, row) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    } else if (row.length > 0) {
      res.status(200).json(row[0]);
    } else {
      res.status(404).json({ message: 'Selection round not found' });
    }
  });
});

router.get('/given-users/:roundId', (req, res) => {
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
    console.log('Fetched given users:', rows);
    res.status(200).json(rows);
  });
});

// User login and dashboard routes
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

router.get('/dashboard', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  res.sendFile(path.join(__dirname, 'public', 'user-dashboard.html'));
});

router.get('/user-data', (req, res) => {
  if (!req.session.userId) {
    return res.json({ loggedIn: false });
  }
  res.json({
    loggedIn: true,
    username: req.session.username
  });
});

router.get('/user-lists', (req, res) => {
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
router.get('/users', (req, res) => {
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

router.get('/banned-users/:userId', (req, res) => {
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

router.post('/add-banned-user', (req, res) => {
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

router.post('/remove-banned-user', (req, res) => {
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

app.use('/api', router);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
