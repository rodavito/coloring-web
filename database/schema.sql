-- Crear base de datos
-- CREATE DATABASE dibujos_db;

-- Tabla de Usuarios (para el admin)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Tabla de Categorías
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    intro_text TEXT NOT NULL
);

-- Tabla de Imágenes
CREATE TABLE IF NOT EXISTS images (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    alt_text TEXT,
    description TEXT,
    tags TEXT, -- Tags como string separado por comas
    filename VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE ON UPDATE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Nota: Las tablas tags e image_tags ya no son necesarias en este nuevo esquema simplificado

-- Insertar usuario admin inicial (contraseña: admin123 hashada con bcrypt)
-- $2a$10$bg7t.iTQrvKXYYLbdRS2K.CrTXSEwCnR2/GD9dU4vRi5Q47DZMpXi
INSERT INTO users (username, password) 
VALUES ('admin', '$2a$10$bg7t.iTQrvKXYYLbdRS2K.CrTXSEwCnR2/GD9dU4vRi5Q47DZMpXi')
ON CONFLICT (username) DO NOTHING;

-- Categoría inicial
INSERT INTO categories (name, slug) VALUES ('Animales', 'animales') ON CONFLICT (slug) DO NOTHING;
