-- =============================================================
-- Migración: tabla redirects para PintaColores
-- Ejecutar manualmente en Neon (https://console.neon.tech)
-- =============================================================

-- 1. Crear tabla de redirecciones 301
CREATE TABLE IF NOT EXISTS redirects (
    id          SERIAL PRIMARY KEY,
    old_path    VARCHAR(500) UNIQUE NOT NULL,
    new_path    VARCHAR(500) NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsquedas rápidas (se consulta en cada 404)
CREATE INDEX IF NOT EXISTS idx_redirects_old_path ON redirects(old_path);

-- =============================================================
-- 2. Pre-poblar redirecciones desde las URLs antiguas existentes
-- =============================================================

-- Categorías: /categoria/{slug} → /{slug}/
INSERT INTO redirects (old_path, new_path)
SELECT
    '/categoria/' || slug,
    '/' || slug || '/'
FROM categories
ON CONFLICT (old_path) DO NOTHING;

-- Subcategorías: /categoria/{cat}/{sub} → /{cat}/{sub}/
INSERT INTO redirects (old_path, new_path)
SELECT
    '/categoria/' || c.slug || '/' || s.slug,
    '/' || c.slug || '/' || s.slug || '/'
FROM subcategories s
JOIN categories c ON s.category_id = c.id
ON CONFLICT (old_path) DO NOTHING;

-- Dibujos: /dibujo/{slug} → /{cat}/{sub}/{slug}  O  /{cat}/{slug}
INSERT INTO redirects (old_path, new_path)
SELECT
    '/dibujo/' || i.slug,
    CASE
        WHEN s.slug IS NOT NULL
            THEN '/' || c.slug || '/' || s.slug || '/' || i.slug
        ELSE
            '/' || c.slug || '/' || i.slug
    END
FROM images i
JOIN categories c ON i.category_id = c.id
LEFT JOIN subcategories s ON i.subcategory_id = s.id
ON CONFLICT (old_path) DO NOTHING;

-- =============================================================
-- Verificación (opcional — ejecutar para confirmar)
-- =============================================================
-- SELECT COUNT(*) FROM redirects;
-- SELECT old_path, new_path FROM redirects ORDER BY created_at DESC LIMIT 20;
