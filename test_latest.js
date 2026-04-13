const db = require('./models/db');
async function latestImage() {
    try {
        const result = await db.query(`SELECT slug, title, created_at FROM images ORDER BY created_at DESC LIMIT 3`);
        console.log("Latest images in Neon:", result.rows);
    } catch(err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
latestImage();
