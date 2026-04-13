const db = require('./models/db');
const slugify = require('slugify');

async function testDuplicate() {
    const name = "Pájaros"; // I'll use a new name to test subcategory creation.
    const category_id = 1;
    const slug = slugify(name, { lower: true, strict: true });
    try {
        await db.query(
            'INSERT INTO subcategories (name, slug, category_id) VALUES ($1, $2, $3)',
            [name, slug, category_id]
        );
        console.log("Insert successful!");
    } catch(err) {
        console.error("Caught error:", err.message);
    } finally {
        process.exit();
    }
}
testDuplicate();
