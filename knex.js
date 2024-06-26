// knex.js
import Knex from 'knex';
import dotenv from 'dotenv';

dotenv.config();

const knex = Knex({
  client: 'mysql2',
  connection: {
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  },
});

export default knex;
