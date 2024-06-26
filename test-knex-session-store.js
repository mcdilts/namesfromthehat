const session = require('express-session');
const connectSessionKnex = require('connect-session-knex')(session);

if (typeof connectSessionKnex !== 'function') {
  console.error('connectSessionKnex is not a function');
} else {
  console.log('connectSessionKnex imported successfully');
}
