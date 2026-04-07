const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.get('/', publicController.getCommon);
router.get('/categoria/:slug', publicController.getCategory);
router.get('/categoria/:catSlug/:subSlug', publicController.getSubcategory);
router.get('/dibujo/:slug', publicController.getImage);
router.get('/search', publicController.searchByTags);
router.get('/sitemap.xml', publicController.getSitemap);
router.get('/privacidad', publicController.getPrivacy);
router.get('/cookies', publicController.getCookies);
router.get('/aviso-legal', publicController.getLegal);
router.get('/sobre-nosotros', publicController.getAbout);
router.get('/articulo/:slug', publicController.getArticle);
router.get('/articulos', publicController.getArticlesList);

module.exports = router;
