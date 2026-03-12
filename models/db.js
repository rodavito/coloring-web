const { Pool } = require('pg');
require('dotenv').config();

// Intentamos DATABASE_URL o la alternativa DB_URL
const connectionString = process.env.DATABASE_URL || process.env.DB_URL;

if (!connectionString) {
    console.error('--- ADVERTENCIA: No hay DATABASE_URL ni DB_URL en el entorno ---');
}

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
