const { Pool } = require('pg');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function exportData() {
    try {
        console.log('--- Iniciando exportación de datos ---');
        let sql = `-- Exportación completa de Coloring-Web\n`;
        sql += `-- Fecha: ${new Date().toISOString()}\n\n`;

        const escape = (str) => str ? str.toString().replace(/'/g, "''") : '';

        // 1. Usuarios
        const users = await pool.query('SELECT * FROM users');
        sql += `-- Usuarios\n`;
        users.rows.forEach(user => {
            sql += `INSERT INTO users (id, username, password) VALUES (${user.id}, '${escape(user.username)}', '${escape(user.password)}') ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, password = EXCLUDED.password;\n`;
        });
        sql += `SELECT setval('users_id_seq', (SELECT MAX(id) FROM users)) WHERE EXISTS (SELECT 1 FROM users);\n\n`;

        // 2. Categorías
        const categories = await pool.query('SELECT * FROM categories');
        sql += `-- Categorías\n`;
        categories.rows.forEach(cat => {
            const introText = cat.intro_text || 'Dibujos para colorear e imprimir gratis.';
            sql += `INSERT INTO categories (id, name, slug, intro_text, seo_text, seo_title) VALUES (${cat.id}, '${escape(cat.name)}', '${escape(cat.slug)}', '${escape(introText)}', ${cat.seo_text ? `'${escape(cat.seo_text)}'` : 'NULL'}, ${cat.seo_title ? `'${escape(cat.seo_title)}'` : 'NULL'}) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, intro_text = EXCLUDED.intro_text, seo_text = EXCLUDED.seo_text, seo_title = EXCLUDED.seo_title;\n`;
        });
        sql += `SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories)) WHERE EXISTS (SELECT 1 FROM categories);\n\n`;

        // 3. Subcategorías
        try {
            const subcats = await pool.query('SELECT * FROM subcategories');
            sql += `-- Subcategorías\n`;
            subcats.rows.forEach(sub => {
                sql += `INSERT INTO subcategories (id, name, slug, category_id) VALUES (${sub.id}, '${escape(sub.name)}', '${escape(sub.slug)}', ${sub.category_id}) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, category_id = EXCLUDED.category_id;\n`;
            });
            sql += `SELECT setval('subcategories_id_seq', (SELECT MAX(id) FROM subcategories)) WHERE EXISTS (SELECT 1 FROM subcategories);\n\n`;
        } catch (e) { console.log('Omitiendo subcategorías (posiblemente no existan)'); }

        // 4. Artículos
        try {
            const articles = await pool.query('SELECT * FROM articles');
            sql += `-- Artículos\n`;
            articles.rows.forEach(art => {
                sql += `INSERT INTO articles (id, title, slug, content, created_at, tag, reading_time) VALUES (${art.id}, '${escape(art.title)}', '${escape(art.slug)}', '${escape(art.content)}', '${art.created_at.toISOString()}', '${escape(art.tag)}', '${escape(art.reading_time)}') ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, content = EXCLUDED.content, tag = EXCLUDED.tag, reading_time = EXCLUDED.reading_time;\n`;
            });
            sql += `SELECT setval('articles_id_seq', (SELECT MAX(id) FROM articles)) WHERE EXISTS (SELECT 1 FROM articles);\n\n`;
        } catch (e) { console.log('Omitiendo artículos (posiblemente no existan)'); }

        // 5. Imágenes
        const images = await pool.query('SELECT * FROM images');
        sql += `-- Imágenes\n`;
        images.rows.forEach(img => {
            sql += `INSERT INTO images (id, title, slug, alt_text, description, tags, filename, category_id, subcategory_id, created_at, cloudinary_url, public_id) VALUES (${img.id}, '${escape(img.title)}', '${escape(img.slug)}', '${escape(img.alt_text)}', '${escape(img.description)}', '${escape(img.tags)}', '${escape(img.filename)}', ${img.category_id}, ${img.subcategory_id || 'NULL'}, '${img.created_at.toISOString()}', ${img.cloudinary_url ? `'${escape(img.cloudinary_url)}'` : 'NULL'}, ${img.public_id ? `'${escape(img.public_id)}'` : 'NULL'}) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, alt_text = EXCLUDED.alt_text, description = EXCLUDED.description, tags = EXCLUDED.tags, filename = EXCLUDED.filename, category_id = EXCLUDED.category_id, subcategory_id = EXCLUDED.subcategory_id, created_at = EXCLUDED.created_at, cloudinary_url = EXCLUDED.cloudinary_url, public_id = EXCLUDED.public_id;\n`;
        });
        sql += `SELECT setval('images_id_seq', (SELECT MAX(id) FROM images)) WHERE EXISTS (SELECT 1 FROM images);\n\n`;

        const outputPath = path.join(__dirname, '../database/railway_import.sql');
        fs.writeFileSync(outputPath, sql);
        console.log(`\n✅ Backup completado exitosamente en: ${outputPath}`);
    } catch (err) {
        console.error('❌ Error al exportar datos:', err);
    } finally {
        await pool.end();
    }
}

exportData();
