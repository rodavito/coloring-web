/**
 * urlHelper.js — Generación centralizada de URLs para PintaColores.
 *
 * Nueva estructura:
 *   Categoría:            /{catSlug}/
 *   Subcategoría:         /{catSlug}/{subSlug}/
 *   Dibujo sin subcategoría:  /{catSlug}/{imageSlug}
 *   Dibujo con subcategoría:  /{catSlug}/{subSlug}/{imageSlug}
 */

/**
 * URL canónica de un dibujo.
 * @param {string} catSlug   - Slug de la categoría.
 * @param {string} imageSlug - Slug del dibujo.
 * @param {string|null} subSlug - Slug de la subcategoría (opcional).
 * @returns {string}
 */
exports.imageUrl = (catSlug, imageSlug, subSlug = null) => {
    if (subSlug) {
        return `/${catSlug}/${subSlug}/${imageSlug}`;
    }
    return `/${catSlug}/${imageSlug}`;
};

/**
 * URL canónica de una categoría.
 * @param {string} catSlug
 * @returns {string}
 */
exports.categoryUrl = (catSlug) => `/${catSlug}/`;

/**
 * URL canónica de una subcategoría.
 * @param {string} catSlug
 * @param {string} subSlug
 * @returns {string}
 */
exports.subcategoryUrl = (catSlug, subSlug) => `/${catSlug}/${subSlug}/`;
