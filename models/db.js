const { Pool } = require('pg');
require('dotenv').config();

// En producción (Railway), DATABASE_URL siempre estará presente
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: connectionString,
    // Activamos SSL solo si no estamos en localhost
    ssl: connectionString && !connectionString.includes('localhost')
        ? { rejectUnauthorized: false }
        : false
});

pool.on('error', (err) => {
    console.error('Error en PostgreSQL:', err.message);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};
