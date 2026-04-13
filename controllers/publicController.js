const db = require('../models/db');
const { imageUrl, categoryUrl, subcategoryUrl } = require('../utils/urlHelper');

// =============================================================================
// Helpers internos
// =============================================================================

/**
 * Renderiza la página de detalle de un dibujo.
 */
async function renderImageDetail(req, res, image) {
    const catsResult = await db.query('SELECT * FROM categories ORDER BY name');
    res.render('public/detail', {
        title: image.title,
        image,
        categories: catsResult.rows
    });
}

/**
 * Renderiza la página de una subcategoría.
 */
async function renderSubcategoryPage(req, res, category, subcategory) {
    const page = parseInt(req.query.page) || 1;
    const limit = 24;
    const offset = (page - 1) * limit;

    const imagesResult = await db.query(`
        SELECT i.*, c.name as category_name, c.slug as category_slug,
               s.slug as subcategory_slug
        FROM images i
        JOIN categories c ON i.category_id = c.id
        LEFT JOIN subcategories s ON i.subcategory_id = s.id
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
        baseUrl: subcategoryUrl(category.slug, subcategory.slug)
    });
}

// =============================================================================
// Home
// =============================================================================

exports.getCommon = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const offset = (page - 1) * limit;

    try {
        const imagesResult = await db.query(`
            SELECT i.*, c.name as category_name, c.slug as category_slug,
                   s.slug as subcategory_slug
            FROM images i
            LEFT JOIN categories c ON i.category_id = c.id
            LEFT JOIN subcategories s ON i.subcategory_id = s.id
            ORDER BY i.created_at DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);

        const countResult = await db.query('SELECT COUNT(*) FROM images');
        const totalImages = parseInt(countResult.rows[0].count);
        const hasMore = totalImages > (page * limit);

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

// =============================================================================
// Categoría — /:catSlug
// =============================================================================

exports.getCategory = async (req, res) => {
    const { catSlug } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 24;
    const offset = (page - 1) * limit;

    try {
        const catResult = await db.query('SELECT * FROM categories WHERE slug = $1', [catSlug]);
        if (catResult.rows.length === 0) return res.status(404).render('404', { title: 'Página no encontrada' });

        const category = catResult.rows[0];

        const imagesResult = await db.query(`
            SELECT i.*, c.name as category_name, c.slug as category_slug,
                   s.slug as subcategory_slug
            FROM images i
            JOIN categories c ON i.category_id = c.id
            LEFT JOIN subcategories s ON i.subcategory_id = s.id
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
            baseUrl: categoryUrl(catSlug)
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en el servidor');
    }
};

// Compatibilidad con código legacy
exports.getSubcategory = async (req, res) => {
    const { catSlug, subSlug } = req.params;
    try {
        const catResult = await db.query('SELECT * FROM categories WHERE slug = $1', [catSlug]);
        if (catResult.rows.length === 0) return res.status(404).render('404', { title: 'Página no encontrada' });
        const category = catResult.rows[0];

        const subcatResult = await db.query('SELECT * FROM subcategories WHERE slug = $1 AND category_id = $2', [subSlug, category.id]);
        if (subcatResult.rows.length === 0) return res.status(404).render('404', { title: 'Página no encontrada' });

        await renderSubcategoryPage(req, res, category, subcatResult.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en el servidor');
    }
};

// =============================================================================
// Resolver segmento: /:catSlug/:segment
// Puede ser una subcategoría o un dibujo sin subcategoría
// =============================================================================

exports.resolveSegment = async (req, res) => {
    const { catSlug, segment } = req.params;

    try {
        // 1. Buscar la categoría
        const catResult = await db.query('SELECT * FROM categories WHERE slug = $1', [catSlug]);
        if (catResult.rows.length === 0) return res.status(404).render('404', { title: 'Página no encontrada' });
        const category = catResult.rows[0];

        // 2. ¿Es el segmento una subcategoría de esta categoría?
        const subcatResult = await db.query(
            'SELECT * FROM subcategories WHERE slug = $1 AND category_id = $2',
            [segment, category.id]
        );
        if (subcatResult.rows.length > 0) {
            return await renderSubcategoryPage(req, res, category, subcatResult.rows[0]);
        }

        // 3. ¿Es el segmento el slug de un dibujo?
        const imageResult = await db.query(`
            SELECT i.*, c.name as category_name, c.slug as category_slug,
                   s.name as subcategory_name, s.slug as subcategory_slug
            FROM images i
            LEFT JOIN categories c ON i.category_id = c.id
            LEFT JOIN subcategories s ON i.subcategory_id = s.id
            WHERE i.slug = $1
        `, [segment]);

        if (imageResult.rows.length > 0) {
            const image = imageResult.rows[0];
            const canonical = imageUrl(image.category_slug, image.slug, image.subcategory_slug);
            const requested = imageUrl(catSlug, image.slug, null);

            // Si la URL solicitada no es la canónica, redirigir
            if (canonical !== requested) {
                return res.redirect(301, canonical);
            }

            return await renderImageDetail(req, res, image);
        }

        // 4. No encontrado
        res.status(404).render('404', { title: 'Página no encontrada' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en el servidor');
    }
};

// =============================================================================
// Dibujo con subcategoría en URL: /:catSlug/:subSlug/:imageSlug
// =============================================================================

exports.getImageWithSub = async (req, res) => {
    const { catSlug, subSlug, imageSlug } = req.params;

    try {
        const imageResult = await db.query(`
            SELECT i.*, c.name as category_name, c.slug as category_slug,
                   s.name as subcategory_name, s.slug as subcategory_slug
            FROM images i
            LEFT JOIN categories c ON i.category_id = c.id
            LEFT JOIN subcategories s ON i.subcategory_id = s.id
            WHERE i.slug = $1
        `, [imageSlug]);

        if (imageResult.rows.length === 0) return res.status(404).render('404', { title: 'Página no encontrada' });

        const image = imageResult.rows[0];
        const canonical = imageUrl(image.category_slug, image.slug, image.subcategory_slug);
        const requested = imageUrl(catSlug, imageSlug, subSlug);

        // Redirigir a la URL canónica si hay discrepancia
        if (canonical !== requested) {
            return res.redirect(301, canonical);
        }

        await renderImageDetail(req, res, image);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en el servidor');
    }
};

// Alias para compatibilidad
exports.getImage = exports.resolveSegment;

// =============================================================================
// Redirecciones 301 desde URLs antiguas
// =============================================================================

exports.redirectOldCategory = (req, res) => {
    const { slug } = req.params;
    res.redirect(301, categoryUrl(slug));
};

exports.redirectOldSubcategory = (req, res) => {
    const { catSlug, subSlug } = req.params;
    res.redirect(301, subcategoryUrl(catSlug, subSlug));
};

exports.redirectOldDrawing = async (req, res) => {
    const { slug } = req.params;
    try {
        const result = await db.query(`
            SELECT i.slug, c.slug as category_slug, s.slug as subcategory_slug
            FROM images i
            JOIN categories c ON i.category_id = c.id
            LEFT JOIN subcategories s ON i.subcategory_id = s.id
            WHERE i.slug = $1
        `, [slug]);

        if (result.rows.length === 0) {
            return res.status(404).render('404', { title: 'Imagen no encontrada' });
        }

        const img = result.rows[0];
        res.redirect(301, imageUrl(img.category_slug, img.slug, img.subcategory_slug));
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en el servidor');
    }
};

// =============================================================================
// Middleware de redirección desde la base de datos
// Captura URLs no resueltas que estén en la tabla redirects
// =============================================================================

exports.handleDbRedirect = async (req, res, next) => {
    try {
        const result = await db.query(
            'SELECT new_path FROM redirects WHERE old_path = $1',
            [req.path.split('?')[0]]
        );
        if (result.rows.length > 0) {
            return res.redirect(301, result.rows[0].new_path);
        }
        next();
    } catch (err) {
        next();
    }
};

// =============================================================================
// Búsqueda
// =============================================================================

exports.searchByTags = async (req, res) => {
    let { q } = req.query;
    q = (q || '').trim();
    const page = parseInt(req.query.page) || 1;
    const limit = 24;
    const offset = (page - 1) * limit;

    try {
        const searchPattern = `%${q.replace(/\s+/g, '%')}%`;

        const imagesResult = await db.query(`
            SELECT DISTINCT i.*, c.name as category_name, c.slug as category_slug,
                   s.slug as subcategory_slug
            FROM images i
            LEFT JOIN categories c ON i.category_id = c.id
            LEFT JOIN subcategories s ON i.subcategory_id = s.id
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
            LEFT JOIN categories c ON i.category_id = c.id
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
            subcategories: [],
            activeCategory: null,
            activeSubcategory: null,
            currentPage: page,
            hasMore,
            baseUrl: `/buscar?q=${encodeURIComponent(q)}`
        });
    } catch (err) {
        console.error('Search API Error:', err);
        res.status(500).send('Error en el servidor: ' + err.message);
    }
};

// =============================================================================
// Sitemap
// =============================================================================

exports.getSitemap = async (req, res) => {
    try {
        const images = await db.query(`
            SELECT i.slug, i.created_at, c.slug as category_slug, s.slug as subcategory_slug
            FROM images i
            JOIN categories c ON i.category_id = c.id
            LEFT JOIN subcategories s ON i.subcategory_id = s.id
            ORDER BY i.created_at DESC
        `);
        const categories = await db.query('SELECT slug FROM categories');
        const subcategories = await db.query(`
            SELECT s.slug as sub_slug, c.slug as cat_slug
            FROM subcategories s
            JOIN categories c ON s.category_id = c.id
        `);
        const articles = await db.query('SELECT slug, created_at FROM articles ORDER BY created_at DESC');

        const baseUrl = `${req.protocol}://${req.get('host')}`;

        let xml = '<?xml version="1.0" encoding="UTF-8"?>';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

        // Home
        xml += `<url><loc>${baseUrl}/</loc><priority>1.0</priority></url>`;

        // Artículos (listado)
        xml += `<url><loc>${baseUrl}/articulos</loc><priority>0.9</priority></url>`;

        // Categorías: /{slug}/
        categories.rows.forEach(cat => {
            xml += `<url><loc>${baseUrl}${categoryUrl(cat.slug)}</loc><priority>0.8</priority></url>`;
        });

        // Subcategorías: /{cat}/{sub}/
        subcategories.rows.forEach(sub => {
            xml += `<url><loc>${baseUrl}${subcategoryUrl(sub.cat_slug, sub.sub_slug)}</loc><priority>0.8</priority></url>`;
        });

        // Artículos individuales
        articles.rows.forEach(art => {
            const date = art.created_at ? art.created_at.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            xml += `<url><loc>${baseUrl}/articulo/${art.art_slug || art.slug}</loc><lastmod>${date}</lastmod><priority>0.7</priority></url>`;
        });

        // Dibujos: /{cat}/{sub}/{slug}  O  /{cat}/{slug}
        images.rows.forEach(img => {
            const date = img.created_at ? img.created_at.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            const url = imageUrl(img.category_slug, img.slug, img.subcategory_slug);
            xml += `<url><loc>${baseUrl}${url}</loc><lastmod>${date}</lastmod><priority>0.6</priority></url>`;
        });

        xml += '</urlset>';

        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error generating sitemap');
    }
};

// =============================================================================
// Páginas estáticas
// =============================================================================

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

// =============================================================================
// Artículos
// =============================================================================

exports.getArticle = async (req, res) => {
    const { slug } = req.params;
    try {
        const result = await db.query('SELECT * FROM articles WHERE slug = $1', [slug]);
        if (result.rows.length === 0) return res.status(404).render('404', { title: 'Artículo no encontrado' });

        const article = result.rows[0];
        res.render('public/article', {
            title: article.title,
            article
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en el servidor');
    }
};

exports.getArticlesList = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM articles ORDER BY created_at DESC');
        res.render('public/articles', {
            title: 'Artículos de Pintacolores',
            articles: result.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en el servidor');
    }
};
