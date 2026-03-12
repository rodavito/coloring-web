const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
        ? { rejectUnauthorized: false }
        : false
});

pool.on('connect', () => {
    console.log('--- Base de datos conectada correctamente ---');
});

pool.on('error', (err) => {
    console.error('--- ERROR EN POSTGRESQL ---', err.message);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};
