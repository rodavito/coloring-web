const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.get('/', publicController.getCommon);
router.get('/categoria/:slug', publicController.getCategory);
router.get('/dibujo/:slug', publicController.getImage);
router.get('/search', publicController.searchByTags);
router.get('/sitemap.xml', publicController.getSitemap);

module.exports = router;
