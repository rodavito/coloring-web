const sharp = require('sharp');
const path = require('path');

async function createWatermark() {
    const textPath = 'd:/Usuario/Desktop/rocio/coloring-web/public/img/logo-text.png';
    const iconPath = 'd:/Usuario/Desktop/rocio/coloring-web/public/img/logo-icon.png';
    const outputPath = 'd:/Usuario/Desktop/rocio/coloring-web/public/img/watermark.png';

    const targetHeight = 100; // Original text height is 123, let's make it 100 base

    const text = await sharp(textPath)
        .resize({ height: targetHeight })
        .toBuffer({ resolveWithObject: true });

    const icon = await sharp(iconPath)
        .resize({ height: targetHeight })
        .toBuffer({ resolveWithObject: true });

    const gap = 15;
    const totalWidth = text.info.width + gap + icon.info.width;

    await sharp({
        create: {
            width: totalWidth,
            height: targetHeight,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    })
        .composite([
            { input: text.data, left: 0, top: 0 },
            { input: icon.data, left: text.info.width + gap, top: 0 }
        ])
        .png()
        .toFile(outputPath);

    console.log('Watermark created at:', outputPath);
}

createWatermark().catch(console.error);
