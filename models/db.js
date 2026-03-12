const { Pool } = require('pg');
require('dotenv').config();

console.log('--- BUSCANDO DATABASE_URL ---');
if (process.env.DATABASE_URL) {
    console.log('--- DATABASE_URL ENCONTRADA (empieza con):', process.env.DATABASE_URL.substring(0, 15), '...');
} else {
    console.error('--- ERROR: DATABASE_URL NO EXISTE EN EL ENTORNO ---');
}

const isProduction = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost');

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
