const { Pool } = require('pg');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function exportData() {
    try {
        let sql = `-- Exportación de datos para Railway\n\n`;

        // 1. Usuarios
        const users = await pool.query('SELECT * FROM users');
        sql += `-- Usuarios\n`;
        users.rows.forEach(user => {
            sql += `INSERT INTO users (id, username, password) VALUES (${user.id}, '${user.username}', '${user.password}') ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, password = EXCLUDED.password;\n`;
        });
        sql += `SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));\n\n`;

        // 2. Categorías
        const categories = await pool.query('SELECT * FROM categories');
        sql += `-- Categorías\n`;
        categories.rows.forEach(cat => {
            sql += `INSERT INTO categories (id, name, slug, intro_text) VALUES (${cat.id}, '${cat.name.replace(/'/g, "''")}', '${cat.slug}', '${(cat.intro_text || '').replace(/'/g, "''")}') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, intro_text = EXCLUDED.intro_text;\n`;
        });
        sql += `SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));\n\n`;

        // 3. Imágenes
        const images = await pool.query('SELECT * FROM images');
        sql += `-- Imágenes\n`;
        images.rows.forEach(img => {
            sql += `INSERT INTO images (id, title, slug, alt_text, description, tags, filename, category_id, created_at, cloudinary_url, public_id) VALUES (${img.id}, '${img.title.replace(/'/g, "''")}', '${img.slug}', '${(img.alt_text || '').replace(/'/g, "''")}', '${(img.description || '').replace(/'/g, "''")}', '${(img.tags || '').replace(/'/g, "''")}', '${img.filename}', ${img.category_id}, '${img.created_at.toISOString()}', ${img.cloudinary_url ? `'${img.cloudinary_url}'` : 'NULL'}, ${img.public_id ? `'${img.public_id}'` : 'NULL'}) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, alt_text = EXCLUDED.alt_text, description = EXCLUDED.description, tags = EXCLUDED.tags, filename = EXCLUDED.filename, category_id = EXCLUDED.category_id, created_at = EXCLUDED.created_at, cloudinary_url = EXCLUDED.cloudinary_url, public_id = EXCLUDED.public_id;\n`;
        });
        sql += `SELECT setval('images_id_seq', (SELECT MAX(id) FROM images));\n\n`;

        const outputPath = path.join(__dirname, '../database/railway_import.sql');
        fs.writeFileSync(outputPath, sql);
        console.log(`Exportación completada: ${outputPath}`);
    } catch (err) {
        console.error('Error al exportar datos:', err);
    } finally {
        await pool.end();
    }
}

exportData();
