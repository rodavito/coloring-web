const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const multer = require('multer');
const path = require('path');

// Configuración de Multer para subida temporal
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) return cb(null, true);
        cb(new Error("Solo se permiten imágenes"));
    }
});

// Middleware para proteger rutas
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) return next();
    res.redirect((process.env.ADMIN_PATH || '/admin') + '/login');
};

// Rutas Públicas de Admin
router.get('/login', adminController.getLogin);
router.post('/login', adminController.postLogin);
router.get('/logout', adminController.logout);

// Rutas Protegidas de Admin
router.get('/', isAuthenticated, adminController.getDashboard);
router.get('/upload', isAuthenticated, adminController.getUpload);
router.post('/upload', isAuthenticated, upload.single('image'), adminController.postUpload);
router.get('/categories', isAuthenticated, adminController.getCategories);
router.post('/categories', isAuthenticated, adminController.postCategory);
router.get('/categories/edit/:id', isAuthenticated, adminController.getEditCategory);
router.post('/categories/edit/:id', isAuthenticated, adminController.postEditCategory);
router.post('/categories/delete/:id', isAuthenticated, adminController.postDeleteCategory);

// Rutas de Subcategorías
router.get('/subcategories', isAuthenticated, adminController.getSubcategories);
router.post('/subcategories', isAuthenticated, adminController.postSubcategory);
router.get('/subcategories/edit/:id', isAuthenticated, adminController.getEditSubcategory);
router.post('/subcategories/edit/:id', isAuthenticated, adminController.postEditSubcategory);
router.post('/subcategories/delete/:id', isAuthenticated, adminController.postDeleteSubcategory);

router.post('/delete/:id', isAuthenticated, adminController.postDelete);
router.get('/edit/:id', isAuthenticated, adminController.getEditImage);
router.post('/edit/:id', isAuthenticated, adminController.postEditImage);

// Rutas de Artículos
router.get('/articles', isAuthenticated, adminController.getArticles);
router.get('/articles/create', isAuthenticated, adminController.getCreateArticle);
router.post('/articles/create', isAuthenticated, adminController.postCreateArticle);
router.get('/articles/edit/:id', isAuthenticated, adminController.getEditArticle);
router.post('/articles/edit/:id', isAuthenticated, adminController.postEditArticle);
router.post('/articles/delete/:id', isAuthenticated, adminController.postDeleteArticle);

module.exports = router;
