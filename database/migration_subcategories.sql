-- Crear tabla de subcategorías
CREATE TABLE IF NOT EXISTS subcategories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Agregar columna subcategory_id a images si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='images' AND column_name='subcategory_id') THEN
        ALTER TABLE images ADD COLUMN subcategory_id INTEGER REFERENCES subcategories(id) ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
