const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const rateLimit = require('express-rate-limit');
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PATH = process.env.ADMIN_PATH || '/admin';

// Confiar en el proxy de Railway para el rate limiter
app.set('trust proxy', 1);

// Rate limiter para seguridad
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // Límite aumentado a 1000 peticiones para evitar bloqueos del admin
    message: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde.'
});

// Configuración de EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.static(path.join(__dirname, 'public'))); // Servir archivos estáticos ANTES del limiter
app.use(limiter); // Aplicar a todas las rutas dinámicas
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'secreto_temporal',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 horas
}));

// Middleware para pasar datos de sesión a todas las vistas
app.use((req, res, next) => {
    res.locals.userId = req.session.userId || null;
    res.locals.adminPath = ADMIN_PATH;
    next();
});

// Rutas
app.get('/diagnostic', (req, res) => {
    res.json({
        status: 'Server is running',
        has_db_url: !!process.env.DATABASE_URL,
        has_cloudinary: !!process.env.CLOUDINARY_API_KEY,
        port: process.env.PORT
    });
});

app.use('/', publicRoutes);
app.use(ADMIN_PATH, adminRoutes);

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).render('404', { title: 'Página no encontrada' });
});

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
