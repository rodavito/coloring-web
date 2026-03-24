const db = require('../models/db');

async function generateDescriptions() {
    try {
        console.log('Obteniendo imágenes de la base de datos...');
        const result = await db.query('SELECT id, title FROM images');
        const images = result.rows;

        console.log(`Procesando ${images.length} imágenes...`);

        for (const img of images) {
            let description = '';
            const titleLower = img.title.toLowerCase();

            if (titleLower.includes('dinosaurio') || titleLower.includes('triceratops') || titleLower.includes('t-rex')) {
                description = `Un increíble dibujo de ${img.title} para que los niños exploren el mundo prehistórico con sus colores favoritos.`;
            } else if (titleLower.includes('ambulancia') || titleLower.includes('bomberos') || titleLower.includes('policía')) {
                description = `Divertida página para colorear de ${img.title}. Una forma genial de aprender sobre los héroes de nuestra comunidad.`;
            } else if (titleLower.includes('espacio') || titleLower.includes('cohete') || titleLower.includes('astronauta')) {
                description = `¡Despega hacia la diversión con este dibujo de ${img.title}! Perfecto para pequeños astronautas con mucha imaginación.`;
            } else if (titleLower.includes('animal') || titleLower.includes('perro') || titleLower.includes('gato')) {
                description = `Un tierno dibujo de ${img.title} para que los amantes de los animales disfruten pintando y desarrollando su creatividad.`;
            } else if (titleLower.includes('vehículo') || titleLower.includes('coche') || titleLower.includes('camión')) {
                description = `Acelera tu creatividad con esta página de ${img.title}. Ideal para niños que aman la velocidad y los motores.`;
            } else {
                description = `Un dibujo detallado de ${img.title}, diseñado con amor para que disfrutes coloreando y pases un momento mágico y creativo.`;
            }

            // Actualizar la base de datos
            await db.query('UPDATE images SET description = $1 WHERE id = $2', [description, img.id]);
        }

        console.log('¡Descripciones actualizadas con éxito!');
    } catch (err) {
        console.error('Error al actualizar descripciones:', err);
    } finally {
        process.exit();
    }
}

generateDescriptions();
