import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

const svgPath = path.join(__dirname, 'public', 'pwa-512x512.svg');

for (const { name, size } of sizes) {
  const outPath = path.join(__dirname, 'public', name);
  await sharp(svgPath)
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`✅ Generated ${name} (${size}x${size})`);
}

console.log('Done!');
