const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.RAILWAY_DATABASE_URL || process.env.DB_URL,
    ssl: { rejectUnauthorized: false }
});

async function updateTable() {
    try {
        const checkTable = await pool.query("SELECT * FROM information_schema.columns WHERE table_name = 'articles'");
        const columns = checkTable.rows.map(r => r.column_name);

        if (!columns.includes('tag')) {
            console.log('Adding tag column...');
            await pool.query("ALTER TABLE articles ADD COLUMN tag VARCHAR(100) DEFAULT 'Lectura'");
        }

        if (!columns.includes('reading_time')) {
            console.log('Adding reading_time column...');
            await pool.query("ALTER TABLE articles ADD COLUMN reading_time VARCHAR(50) DEFAULT '5 min'");
        }

        console.log('Articles table updated successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error updating table:', err);
        process.exit(1);
    }
}

updateTable();
