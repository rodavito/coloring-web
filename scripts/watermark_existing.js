const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const WATERMARK_PATH = 'd:/Usuario/Desktop/rocio/coloring-web/public/img/watermark.png';
const BASE_IMAGES_PATH = 'd:/Usuario/Desktop/rocio/coloring-web/public/assets/images';

async function applyWatermarkToDir(directory, isWebp) {
    if (!fs.existsSync(directory)) return;

    const categories = fs.readdirSync(directory);

    for (const category of categories) {
        const categoryPath = path.join(directory, category);
        if (!fs.lstatSync(categoryPath).isDirectory()) continue;

        const images = fs.readdirSync(categoryPath);
        for (const image of images) {
            const imagePath = path.join(categoryPath, image);
            if (!image.endsWith('.jpg') && !image.endsWith('.webp')) continue;

            console.log(`Processing: ${imagePath}`);
            try {
                const imageBuffer = fs.readFileSync(imagePath);
                const metadata = await sharp(imageBuffer).metadata();

                // Scale watermark to 15% of image width
                const watermarkWidth = Math.round(metadata.width * 0.15);
                const watermark = await sharp(WATERMARK_PATH)
                    .resize({ width: watermarkWidth })
                    .toBuffer();

                const watermarkedImage = await sharp(imageBuffer)
                    .composite([{
                        input: watermark,
                        gravity: 'southeast',
                        blend: 'over'
                    }])
                    .toBuffer();

                fs.writeFileSync(imagePath, watermarkedImage);
            } catch (err) {
                console.error(`Error processing ${imagePath}:`, err);
            }
        }
    }
}

async function main() {
    console.log('Starting watermarking existing images...');

    await applyWatermarkToDir(path.join(BASE_IMAGES_PATH, 'webp'), true);
    await applyWatermarkToDir(path.join(BASE_IMAGES_PATH, 'jpg'), false);

    console.log('Finished watermarking all existing images!');
}

main().catch(console.error);
