const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// ─────────────────────────────────────────────────────────────────────────────
// Rutas estáticas / con prefijo fijo
// DEBEN ir ANTES de los comodines dinámicos (/:param)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', publicController.getCommon);
router.get('/search', publicController.searchByTags);
router.get('/sitemap.xml', publicController.getSitemap);
router.get('/privacidad', publicController.getPrivacy);
router.get('/cookies', publicController.getCookies);
router.get('/aviso-legal', publicController.getLegal);
router.get('/sobre-nosotros', publicController.getAbout);
router.get('/articulos', publicController.getArticlesList);
router.get('/articulo/:slug', publicController.getArticle);

// ─────────────────────────────────────────────────────────────────────────────
// Redirecciones 301 desde URLs antiguas
// ─────────────────────────────────────────────────────────────────────────────
router.get('/categoria/:slug', publicController.redirectOldCategory);
router.get('/categoria/:catSlug/:subSlug', publicController.redirectOldSubcategory);
router.get('/dibujo/:slug', publicController.redirectOldDrawing);

// ─────────────────────────────────────────────────────────────────────────────
// Nueva estructura jerárquica (comodines — van AL FINAL)
//   /:catSlug/:subSlug/:imageSlug  → dibujo con subcategoría
//   /:catSlug/:segment             → subcategoría o dibujo sin subcategoría
//   /:catSlug                      → categoría
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:catSlug/:subSlug/:imageSlug', publicController.getImageWithSub);
router.get('/:catSlug/:segment', publicController.resolveSegment);
router.get('/:catSlug', publicController.getCategory);

// ─────────────────────────────────────────────────────────────────────────────
// Middleware de redirección desde la tabla redirects
// (captura cualquier URL no resuelta que esté registrada en la BD)
// ─────────────────────────────────────────────────────────────────────────────
router.use(publicController.handleDbRedirect);

module.exports = router;
