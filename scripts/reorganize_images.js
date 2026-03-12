const db = require('../models/db');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const slugify = require('slugify');

async function migrate() {
    console.log('--- Iniciando migración de imágenes ---');

    try {
        // 1. Obtener todas las imágenes y sus categorías
        const result = await db.query(`
            SELECT i.id, i.title, i.filename, c.slug as category_slug 
            FROM images i
            JOIN categories c ON i.category_id = c.id
        `);
        const images = result.rows;

        console.log(`Se encontraron ${images.length} imágenes para procesar.`);

        for (const img of images) {
            console.log(`Procesando: ${img.title}...`);

            // 2. Generar nombre de archivo SEO
            const seoBaseName = slugify(img.title, { lower: true, strict: true });

            // 3. Definir rutas
            const oldPath = path.join(__dirname, '../public/images', img.filename);
            const webpDir = path.join(__dirname, '../public/assets/images/webp', img.category_slug);
            const jpgDir = path.join(__dirname, '../public/assets/images/jpg', img.category_slug);

            // Crear directorios si no existen
            if (!fs.existsSync(webpDir)) fs.mkdirSync(webpDir, { recursive: true });
            if (!fs.existsSync(jpgDir)) fs.mkdirSync(jpgDir, { recursive: true });

            const webpPath = path.join(webpDir, `${seoBaseName}.webp`);
            const jpgPath = path.join(jpgDir, `${seoBaseName}.jpg`);

            if (!fs.existsSync(oldPath)) {
                console.error(`  [ERROR] No se encuentra el archivo original: ${img.filename}`);
                continue;
            }

            // 4. Convertir a WEBP (Optimizado 300-500KB aprox)
            // Usamos un quality de ~80 para balancear peso y calidad
            await sharp(oldPath)
                .webp({ quality: 80 })
                .toFile(webpPath);

            // 5. Convertir a JPG (Alta calidad para descarga)
            await sharp(oldPath)
                .jpeg({ quality: 90 })
                .toFile(jpgPath);

            // 6. Actualizar base de datos con el nombre base (sin extensión)
            await db.query('UPDATE images SET filename = $1 WHERE id = $2', [seoBaseName, img.id]);

            console.log(`  [OK] ${seoBaseName} procesado correctamente.`);
        }

        console.log('--- Migración completada exitosamente ---');
        process.exit(0);
    } catch (err) {
        console.error('--- ERROR DURANTE LA MIGRACIÓN ---');
        console.error(err);
        process.exit(1);
    }
}

migrate();
