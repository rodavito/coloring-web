const fs = require('fs');
const path = require('path');
const db = require('../models/db');

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, '../database/migration_subcategories.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Running migration...');
        await db.query(sql);
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
