const db = require('../models/db');

exports.getCommon = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const offset = (page - 1) * limit;

    try {
        // Obtener dibujos recientes con paginación
        const imagesResult = await db.query(`
            SELECT i.*, c.name as category_name, c.slug as category_slug 
            FROM images i 
            LEFT JOIN categories c ON i.category_id = c.id 
            ORDER BY i.created_at DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);

        const countResult = await db.query('SELECT COUNT(*) FROM images');
        const totalImages = parseInt(countResult.rows[0].count);
        const hasMore = totalImages > (page * limit);

        // Obtener todas las categorías para la sección destacada
        const categoriesResult = await db.query('SELECT * FROM categories ORDER BY name');

        res.render('public/home', {
            title: 'Dibujos gratis para Imprimir y Colorear',
            images: imagesResult.rows,
            categories: categoriesResult.rows,
            currentPage: page,
            hasMore,
            baseUrl: '/'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en el servidor');
    }
};

exports.getCategory = async (req, res) => {
    const { slug } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 24;
    const offset = (page - 1) * limit;

    try {
        const catResult = await db.query('SELECT * FROM categories WHERE slug = $1', [slug]);
        if (catResult.rows.length === 0) return res.status(404).send('Categoría no encontrada');

        const category = catResult.rows[0];
        const imagesResult = await db.query(`
      SELECT i.*, c.name as category_name, c.slug as category_slug
      FROM images i 
      JOIN categories c ON i.category_id = c.id 
      WHERE c.id = $1
      ORDER BY i.created_at DESC
      LIMIT $2 OFFSET $3
    `, [category.id, limit, offset]);

        const countResult = await db.query('SELECT COUNT(*) FROM images WHERE category_id = $1', [category.id]);
        const totalImages = parseInt(countResult.rows[0].count);
        const hasMore = totalImages > (page * limit);

        const catsResult = await db.query('SELECT * FROM categories ORDER BY name');
        const subcatsResult = await db.query('SELECT * FROM subcategories WHERE category_id = $1 ORDER BY name', [category.id]);

        res.render('public/common', {
            title: `${category.name} - Dibujos para Colorear`,
            images: imagesResult.rows,
            categories: catsResult.rows,
            subcategories: subcatsResult.rows,
            activeCategory: category.id,
            activeSubcategory: null,
            categoryIntro: category.intro_text,
            categorySeo: category.seo_text || null,
            categorySeoTitle: category.seo_title || null,
            currentPage: page,
            hasMore,
            baseUrl: `/categoria/${slug}`
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en el servidor');
    }
};

exports.getSubcategory = async (req, res) => {
    const { catSlug, subSlug } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 24;
    const offset = (page - 1) * limit;

    try {
        const catResult = await db.query('SELECT * FROM categories WHERE slug = $1', [catSlug]);
        if (catResult.rows.length === 0) return res.status(404).send('Categoría no encontrada');
        const category = catResult.rows[0];

        const subcatResult = await db.query('SELECT * FROM subcategories WHERE slug = $1 AND category_id = $2', [subSlug, category.id]);
        if (subcatResult.rows.length === 0) return res.status(404).send('Subcategoría no encontrada');
        const subcategory = subcatResult.rows[0];

        const imagesResult = await db.query(`
      SELECT i.*, c.name as category_name, c.slug as category_slug
      FROM images i 
      JOIN categories c ON i.category_id = c.id 
      WHERE i.subcategory_id = $1
      ORDER BY i.created_at DESC
      LIMIT $2 OFFSET $3
    `, [subcategory.id, limit, offset]);

        const countResult = await db.query('SELECT COUNT(*) FROM images WHERE subcategory_id = $1', [subcategory.id]);
        const totalImages = parseInt(countResult.rows[0].count);
        const hasMore = totalImages > (page * limit);

        const catsResult = await db.query('SELECT * FROM categories ORDER BY name');
        const subcatsResult = await db.query('SELECT * FROM subcategories WHERE category_id = $1 ORDER BY name', [category.id]);

        res.render('public/common', {
            title: `${subcategory.name} - ${category.name}`,
            images: imagesResult.rows,
            categories: catsResult.rows,
            subcategories: subcatsResult.rows,
            activeCategory: category.id,
            activeSubcategory: subcategory.id,
            categoryIntro: null,
            categorySeo: null,
            categorySeoTitle: null,
            currentPage: page,
            hasMore,
            baseUrl: `/categoria/${catSlug}/${subSlug}`
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en el servidor');
    }
};

exports.getImage = async (req, res) => {
    const { slug } = req.params;
    try {
        const result = await db.query(`
      SELECT i.*, c.name as category_name, c.slug as category_slug
      FROM images i 
      LEFT JOIN categories c ON i.category_id = c.id 
      WHERE i.slug = $1
    `, [slug]);

        if (result.rows.length === 0) return res.status(404).send('Imagen no encontrada');

        const image = result.rows[0];

        // Convertir string de tags a array
        const tags = image.tags ? image.tags.split(',').map(t => ({ name: t.trim() })) : [];

        // Obtener todas las categorías para el header
        const catsResult = await db.query('SELECT * FROM categories ORDER BY name');

        res.render('public/detail', {
            title: image.title,
            image,
            tags,
            categories: catsResult.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en el servidor');
    }
};

exports.searchByTags = async (req, res) => {
    let { q } = req.query;
    q = (q || '').trim();
    const page = parseInt(req.query.page) || 1;
    const limit = 24;
    const offset = (page - 1) * limit;

    try {
        // Convertir múltiples espacios en % para que busque ambas palabras por separado
        const searchPattern = `%${q.replace(/\s+/g, '%')}%`;

        const imagesResult = await db.query(`
      SELECT DISTINCT i.*, c.name as category_name, c.slug as category_slug 
      FROM images i 
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE immutable_unaccent(i.title) ILIKE public.unaccent($1)
         OR immutable_unaccent(COALESCE(i.tags, '')) ILIKE public.unaccent($1)
         OR immutable_unaccent(COALESCE(i.description, '')) ILIKE public.unaccent($1)
         OR immutable_unaccent(COALESCE(i.alt_text, '')) ILIKE public.unaccent($1)
         OR immutable_unaccent(COALESCE(c.name, '')) ILIKE public.unaccent($1)
         OR i.subcategory_id IN (SELECT id FROM subcategories WHERE immutable_unaccent(name) ILIKE public.unaccent($1))
      ORDER BY i.created_at DESC
      LIMIT $2 OFFSET $3
    `, [searchPattern, limit, offset]);

        const countResult = await db.query(`
      SELECT COUNT(DISTINCT i.id) 
      FROM images i 
      WHERE immutable_unaccent(i.title) ILIKE public.unaccent($1)
         OR immutable_unaccent(COALESCE(i.tags, '')) ILIKE public.unaccent($1)
         OR immutable_unaccent(COALESCE(i.description, '')) ILIKE public.unaccent($1)
         OR immutable_unaccent(COALESCE(i.alt_text, '')) ILIKE public.unaccent($1)
         OR immutable_unaccent(COALESCE(c.name, '')) ILIKE public.unaccent($1)
         OR i.subcategory_id IN (SELECT id FROM subcategories WHERE immutable_unaccent(name) ILIKE public.unaccent($1))
    `, [searchPattern]);

        const totalImages = parseInt(countResult.rows[0].count);
        const hasMore = totalImages > (page * limit);

        const catsResult = await db.query('SELECT * FROM categories ORDER BY name');

        res.render('public/common', {
            title: `Búsqueda: ${q}`,
            images: imagesResult.rows,
            categories: catsResult.rows,
            subcategories: [], // No subcategories to show on generic search
            activeCategory: null,
            activeSubcategory: null,
            currentPage: page,
            hasMore,
            baseUrl: `/buscar?q=${encodeURIComponent(q)}`
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en el servidor');
    }
};

exports.getSitemap = async (req, res) => {
    try {
        const images = await db.query('SELECT slug, created_at FROM images ORDER BY created_at DESC');
        const categories = await db.query('SELECT slug FROM categories');

        const baseUrl = `${req.protocol}://${req.get('host')}`;

        let xml = '<?xml version="1.0" encoding="UTF-8"?>';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

        // Home
        xml += `<url><loc>${baseUrl}/</loc><priority>1.0</priority></url>`;

        // Categorías
        categories.rows.forEach(cat => {
            xml += `<url><loc>${baseUrl}/categoria/${cat.slug}</loc><priority>0.8</priority></url>`;
        });

        // Dibujos
        images.rows.forEach(img => {
            xml += `<url><loc>${baseUrl}/dibujo/${img.slug}</loc><lastmod>${img.created_at.toISOString().split('T')[0]}</lastmod><priority>0.6</priority></url>`;
        });

        xml += '</urlset>';

        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error generating sitemap');
    }
};

exports.getPrivacy = async (req, res) => {
    try {
        const catsResult = await db.query('SELECT * FROM categories ORDER BY name');
        res.render('public/privacy', {
            title: 'Política de Privacidad',
            categories: catsResult.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en el servidor');
    }
};

exports.getCookies = async (req, res) => {
    try {
        const catsResult = await db.query('SELECT * FROM categories ORDER BY name');
        res.render('public/cookies', {
            title: 'Política de Cookies',
            categories: catsResult.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en el servidor');
    }
};

exports.getLegal = async (req, res) => {
    try {
        const catsResult = await db.query('SELECT * FROM categories ORDER BY name');
        res.render('public/legal', {
            title: 'Aviso Legal',
            categories: catsResult.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en el servidor');
    }
};

exports.getAbout = async (req, res) => {
    try {
        const catsResult = await db.query('SELECT * FROM categories ORDER BY name');
        res.render('public/about', {
            title: 'Sobre Nosotros',
            categories: catsResult.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en el servidor');
    }
};
