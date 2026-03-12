const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
    console.error('--- ERROR CRÍTICO: La variable DATABASE_URL está vacía o no existe ---');
}

const isProduction = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost');

if (isProduction) {
    console.log('--- Intentando conectar a la BD de Railway ---');
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
