const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost');

if (isProduction) {
    console.log('--- Detectado entorno de producción. Intentando conectar a:', process.env.DATABASE_URL.split('@')[1] || 'URL no válida');
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false
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
