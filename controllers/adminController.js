const db = require('../models/db');
const bcrypt = require('bcryptjs');
const sharp = require('sharp');
const path = require('path');
const slugify = require('slugify');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Configuración de Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.getLogin = (req, res) => {
    if (req.session.userId) return res.redirect(process.env.ADMIN_PATH || '/admin');
    res.render('admin/login', { title: 'Admin Login', error: null });
};

exports.postLogin = async (req, res) => {
    let { username, password } = req.body;

    // Quitar espacios accidentales
    username = (username || '').trim();
    password = (password || '').trim();

    try {
        // Buscar usuario (ignorando mayúsculas/minúsculas para el nombre de usuario)
        const result = await db.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
        const user = result.rows[0];

        if (user) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                req.session.userId = user.id;
                return res.redirect(process.env.ADMIN_PATH || '/admin');
            } else {
                console.log(`Intento de login fallido: Contraseña incorrecta para el usuario "${username}"`);
            }
        } else {
            console.log(`Intento de login fallido: Usuario no encontrado "${username}"`);
        }

        res.render('admin/login', {
            title: 'Admin Login',
            error: 'Credenciales inválidas',
            adminPath: process.env.ADMIN_PATH || '/admin'
        });
    } catch (err) {
        console.error('Error en el login:', err);
        res.render('admin/login', {
            title: 'Admin Login',
            error: 'Error en el servidor',
            adminPath: process.env.ADMIN_PATH || '/admin'
        });
    }
};

exports.logout = (req, res) => {
    req.session.destroy();
    res.redirect((process.env.ADMIN_PATH || '/admin') + '/login');
};

exports.getDashboard = async (req, res) => {
    let { q } = req.query;
    q = (q || '').trim();
    try {
        let query = `
            SELECT i.*, c.name as category_name, c.slug as category_slug 
            FROM images i 
            LEFT JOIN categories c ON i.category_id = c.id 
        `;
        let params = [];

        if (q) {
            query += `
                WHERE i.title ILIKE $1 
                OR i.tags ILIKE $1 
                OR c.name ILIKE $1
            `;
            params.push(`%${q}%`);
        }

        query += ` ORDER BY i.created_at DESC`;

        const imagesResults = await db.query(query, params);
        res.render('admin/dashboard', {
            title: 'Admin Panel',
            images: imagesResults.rows,
            adminPath: process.env.ADMIN_PATH || '/admin',
            q
        });
    } catch (err) {
        console.error(err);
        res.send('Error al cargar el panel');
    }
};

exports.getUpload = async (req, res) => {
    try {
        const categoriesResults = await db.query('SELECT * FROM categories ORDER BY name');
        res.render('admin/upload', {
            title: 'Subir Imagen',
            categories: categoriesResults.rows,
            adminPath: process.env.ADMIN_PATH || '/admin'
        });
    } catch (err) {
        console.error(err);
        res.send('Error al cargar formulario');
    }
};

exports.postUpload = async (req, res) => {
    const { title, alt_text, description, category_id, tags } = req.body;
    const file = req.file;

    if (!file) return res.send('Debes subir una imagen');

    try {
        // 1. Obtener el slug de la categoría para organizar en Cloudinary
        const catResult = await db.query('SELECT slug FROM categories WHERE id = $1', [category_id]);
        if (catResult.rows.length === 0) return res.send('Categoría no válida');
        const categorySlug = catResult.rows[0].slug;

        // 2. Generar slug para el nombre del archivo
        const slug = slugify(title, { lower: true, strict: true });

        // 3. Aplicar marca de agua con Sharp
        const metadata = await sharp(file.buffer).metadata();
        const watermarkWidth = Math.round(metadata.width * 0.22);
        const watermarkPath = path.join(__dirname, '../public/img/watermark.png');

        let watermark;
        if (fs.existsSync(watermarkPath)) {
            watermark = await sharp(watermarkPath)
                .resize({ width: watermarkWidth })
                .toBuffer();
        }

        let processedBuffer;
        if (watermark) {
            processedBuffer = await sharp(file.buffer)
                .composite([{
                    input: watermark,
                    gravity: 'southeast',
                    blend: 'over'
                }])
                .toBuffer();
        } else {
            processedBuffer = file.buffer;
        }

        // 4. Subir a Cloudinary usando un Stream
        const uploadToCloudinary = (buffer, options) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
                    if (result) resolve(result);
                    else reject(error);
                });
                stream.end(buffer);
            });
        };

        const cloudinaryResult = await uploadToCloudinary(processedBuffer, {
            folder: `coloring-web/${categorySlug}`,
            public_id: slug,
            resource_type: 'image',
            format: 'webp', // Forzamos formato optimizado
            transformation: [
                { quality: 'auto', fetch_format: 'auto' }
            ]
        });

        // 5. Guardar en DB incluyendo datos de Cloudinary
        await db.query(
            'INSERT INTO images (title, slug, alt_text, description, tags, filename, category_id, cloudinary_url, public_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [title, slug, alt_text, description, tags, slug, category_id, cloudinaryResult.secure_url, cloudinaryResult.public_id]
        );

        res.redirect(process.env.ADMIN_PATH || '/admin');
    } catch (err) {
        console.error('Error al subir a Cloudinary:', err);
        res.send('Error al procesar y subir la imagen');
    }
};

exports.getCategories = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM categories ORDER BY name');
        res.render('admin/categories', {
            title: 'Gestionar Categorías',
            categories: result.rows,
            adminPath: process.env.ADMIN_PATH || '/admin'
        });
    } catch (err) {
        console.error(err);
        res.send('Error al cargar categorías');
    }
};

exports.postCategory = async (req, res) => {
    const { name, intro_text, emoji, seo_text } = req.body;
    const slug = slugify(name, { lower: true, strict: true });
    try {
        await db.query('INSERT INTO categories (name, slug, intro_text, emoji, seo_text) VALUES ($1, $2, $3, $4, $5)', [name, slug, intro_text, emoji, seo_text]);
        res.redirect((process.env.ADMIN_PATH || '/admin') + '/categories');
    } catch (err) {
        console.error(err);
        res.send('Error al crear categoría');
    }
};

exports.getEditCategory = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM categories WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.redirect((process.env.ADMIN_PATH || '/admin') + '/categories');

        res.render('admin/edit-category', {
            title: 'Editar Categoría',
            category: result.rows[0],
            adminPath: process.env.ADMIN_PATH || '/admin'
        });
    } catch (err) {
        console.error(err);
        res.send('Error al cargar categoría');
    }
};

exports.postEditCategory = async (req, res) => {
    const { id } = req.params;
    const { name, intro_text, emoji, seo_text } = req.body;
    const newSlug = slugify(name, { lower: true, strict: true });

    try {
        // 1. Obtener el slug antiguo antes de actualizar
        const oldResult = await db.query('SELECT slug FROM categories WHERE id = $1', [id]);
        if (oldResult.rows.length === 0) return res.redirect((process.env.ADMIN_PATH || '/admin') + '/categories');
        const oldSlug = oldResult.rows[0].slug;

        // 2. Actualizar en la base de datos
        await db.query(
            'UPDATE categories SET name = $1, slug = $2, intro_text = $3, emoji = $4, seo_text = $5 WHERE id = $6',
            [name, newSlug, intro_text, emoji, seo_text, id]
        );

        // 3. Si el slug cambió, renombrar las carpetas de imágenes
        if (oldSlug !== newSlug) {
            const types = ['webp', 'jpg'];
            types.forEach(type => {
                const oldPath = path.join(__dirname, '../public/assets/images', type, oldSlug);
                const newPath = path.join(__dirname, '../public/assets/images', type, newSlug);

                if (fs.existsSync(oldPath)) {
                    // Si ya existe la carpeta destino, mover contenidos (o simplemente renombrar si no existe)
                    if (fs.existsSync(newPath)) {
                        const files = fs.readdirSync(oldPath);
                        files.forEach(file => {
                            fs.renameSync(path.join(oldPath, file), path.join(newPath, file));
                        });
                        fs.rmdirSync(oldPath);
                    } else {
                        fs.renameSync(oldPath, newPath);
                    }
                }
            });
        }

        res.redirect((process.env.ADMIN_PATH || '/admin') + '/categories');
    } catch (err) {
        console.error(err);
        res.send('Error al editar categoría');
    }
};

exports.postDeleteCategory = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM categories WHERE id = $1', [id]);
        res.redirect((process.env.ADMIN_PATH || '/admin') + '/categories');
    } catch (err) {
        console.error(err);
        res.send('Error al eliminar categoría');
    }
};

exports.postDelete = async (req, res) => {
    const { id } = req.params;
    try {
        // Obtener datos para borrar de Cloudinary y de local (por compatibilidad con antiguas)
        const result = await db.query(`
            SELECT i.filename, i.public_id, c.slug as category_slug 
            FROM images i 
            JOIN categories c ON i.category_id = c.id 
            WHERE i.id = $1
        `, [id]);

        if (result.rows.length === 0) return res.redirect(process.env.ADMIN_PATH || '/admin');

        const { filename, public_id, category_slug } = result.rows[0];

        // 1. Borrar de la base de datos
        await db.query('DELETE FROM images WHERE id = $1', [id]);

        // 2. Borrar de Cloudinary si tiene public_id
        if (public_id) {
            await cloudinary.uploader.destroy(public_id);
        }

        // 3. Borrar archivos del sistema local si existen (para imágenes antiguas)
        if (filename && category_slug) {
            const webpPath = path.join(__dirname, '../public/assets/images/webp', category_slug, `${filename}.webp`);
            const jpgPath = path.join(__dirname, '../public/assets/images/jpg', category_slug, `${filename}.jpg`);

            if (fs.existsSync(webpPath)) fs.unlinkSync(webpPath);
            if (fs.existsSync(jpgPath)) fs.unlinkSync(jpgPath);
        }

        res.redirect(process.env.ADMIN_PATH || '/admin');
    } catch (err) {
        console.error('Error al eliminar imagen:', err);
        res.status(500).send('Error al eliminar imagen');
    }
};

// Nueva ruta que agregó el usuario
exports.postDeleteImage = exports.postDelete;

exports.getEditImage = async (req, res) => {
    const { id } = req.params;
    try {
        const imageResult = await db.query('SELECT * FROM images WHERE id = $1', [id]);
        if (imageResult.rows.length === 0) return res.redirect(process.env.ADMIN_PATH || '/admin');

        const categoriesResult = await db.query('SELECT * FROM categories ORDER BY name');

        res.render('admin/edit-image', {
            title: 'Editar Imagen',
            image: imageResult.rows[0],
            categories: categoriesResult.rows,
            adminPath: process.env.ADMIN_PATH || '/admin'
        });
    } catch (err) {
        console.error(err);
        res.send('Error al cargar la imagen para editar');
    }
};

exports.postEditImage = async (req, res) => {
    const { id } = req.params;
    const { title, alt_text, description, category_id, tags } = req.body;

    try {
        await db.query(
            'UPDATE images SET title = $1, alt_text = $2, description = $3, category_id = $4, tags = $5 WHERE id = $6',
            [title, alt_text, description, category_id, tags, id]
        );
        res.redirect(process.env.ADMIN_PATH || '/admin');
    } catch (err) {
        console.error(err);
        res.send('Error al actualizar la imagen');
    }
};
