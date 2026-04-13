const { Pool } = require('pg');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function importData() {
    try {
        console.log('--- Iniciando preparación de estructura y datos ---');
        
        const dbDir = path.join(__dirname, '../database');
        
        // 0. Limpieza inicial (para asegurar que se creen las nuevas columnas)
        console.log('Limpiando tablas existentes para una instalación limpia...');
        await pool.query('DROP TABLE IF EXISTS articles, images, subcategories, categories, users CASCADE;');

        // 1. Ejecutar el esquema base
        if (fs.existsSync(path.join(dbDir, 'schema.sql'))) {
            console.log('Creando tablas base (schema.sql)...');
            const schemaSql = fs.readFileSync(path.join(dbDir, 'schema.sql'), 'utf8');
            await pool.query(schemaSql);
        }

        // 2. Ejecutar migraciones en orden (v1, v2, subcategories)
        const migrations = [
            'migration_v1.sql',
            'migration_v2.sql',
            'migration_subcategories.sql'
        ];

        for (const mig of migrations) {
            const migPath = path.join(dbDir, mig);
            if (fs.existsSync(migPath)) {
                console.log(`Aplicando migración: ${mig}...`);
                const migSql = fs.readFileSync(migPath, 'utf8');
                await pool.query(migSql);
            }
        }

        // 3. Importar los datos del backup
        const backupPath = path.join(dbDir, 'railway_import.sql');
        if (fs.existsSync(backupPath)) {
            console.log('Importando datos de tu backup (railway_import.sql)...');
            const backupSql = fs.readFileSync(backupPath, 'utf8');
            await pool.query(backupSql);
        } else {
            throw new Error('No se encontró el archivo railway_import.sql. Asegúrate de haber corrido export-data.js primero.');
        }

        console.log('\n✅ ¡Todo listo! Estructura y datos migrados a Neon correctamente.');
    } catch (err) {
        console.error('❌ Error durante el proceso:', err.message);
    } finally {
        await pool.end();
    }
}

importData();
