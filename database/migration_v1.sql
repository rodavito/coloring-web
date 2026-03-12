-- Update categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS intro_text TEXT NOT NULL DEFAULT 'Descarga gratis dibujos para colorear de esta categoría.';

-- Update images table foreign key
ALTER TABLE images DROP CONSTRAINT IF EXISTS images_category_id_fkey;
ALTER TABLE images ADD CONSTRAINT images_category_id_fkey 
    FOREIGN KEY (category_id) REFERENCES categories(id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;
