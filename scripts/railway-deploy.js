const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Instrucciones: Necesitas la DATABASE_URL de Railway para correr esto.
const connectionString = process.env.RAILWAY_DATABASE_URL;

if (!connectionString) {
    console.error('Error: No se encontró RAILWAY_DATABASE_URL en el archivo .env');
    process.exit(1);
}

const pool = new Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false // Railway requiere SSL para conexiones externas
    }
});

async function migrate() {
    try {
        console.log('--- Iniciando migración a Railway ---');

        // 1. Crear extensiones y tablas (Schema)
        console.log('Configurando base de datos (extensiones y tablas)...');
        const schema = `
            CREATE EXTENSION IF NOT EXISTS unaccent;
            CREATE OR REPLACE FUNCTION public.immutable_unaccent(text) RETURNS text AS $$
                SELECT public.unaccent($1);
            $$ LANGUAGE sql IMMUTABLE;

            CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL);
            CREATE TABLE IF NOT EXISTS categories (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, slug VARCHAR(100) UNIQUE NOT NULL, intro_text TEXT NOT NULL, emoji VARCHAR(50));
            ALTER TABLE categories ADD COLUMN IF NOT EXISTS emoji VARCHAR(50);
            
            CREATE TABLE IF NOT EXISTS images (id SERIAL PRIMARY KEY, title VARCHAR(200) NOT NULL, slug VARCHAR(200) UNIQUE NOT NULL, alt_text TEXT, description TEXT, tags TEXT, filename VARCHAR(255) NOT NULL, category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE ON UPDATE CASCADE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, cloudinary_url TEXT, public_id TEXT);
        `;
        await pool.query(schema);
        console.log('Configuración completada correctamente.');

        // 2. Importar datos
        const importPath = path.join(__dirname, '../database/railway_import.sql');
        if (fs.existsSync(importPath)) {
            console.log('Importando datos de railway_import.sql...');
            const sql = fs.readFileSync(importPath, 'utf8');
            await pool.query(sql);
            console.log('¡Datos importados con éxito!');
        } else {
            console.warn('Advertencia: No se encontró el archivo database/railway_import.sql');
        }

        console.log('--- Migración completada exitosamente ---');
    } catch (err) {
        console.error('Error durante la migración:', err);
    } finally {
        await pool.end();
    }
}

migrate();
