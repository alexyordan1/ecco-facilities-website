import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { statSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const src = join(root, 'images', 'alina-avatar.jpg');

const targets = [
  { w: 96,  name: 'alina-avatar-96',  quality: 80 },
  { w: 192, name: 'alina-avatar-192', quality: 78 },
  { w: 480, name: 'alina-avatar-480', quality: 75 }
];

const srcBytes = statSync(src).size;
console.log(`Source: ${src} (${(srcBytes/1024).toFixed(1)} KB)`);

for (const t of targets) {
  const pipeline = sharp(src).resize(t.w, t.w, { fit: 'cover', position: 'centre' });

  const webpPath = join(root, 'images', `${t.name}.webp`);
  await pipeline.clone().webp({ quality: t.quality, effort: 6 }).toFile(webpPath);
  const webpBytes = statSync(webpPath).size;

  const avifPath = join(root, 'images', `${t.name}.avif`);
  await pipeline.clone().avif({ quality: t.quality - 8, effort: 6 }).toFile(avifPath);
  const avifBytes = statSync(avifPath).size;

  const jpgPath = join(root, 'images', `${t.name}.jpg`);
  await pipeline.clone().jpeg({ quality: t.quality + 5, mozjpeg: true }).toFile(jpgPath);
  const jpgBytes = statSync(jpgPath).size;

  console.log(`  ${t.name}: webp ${(webpBytes/1024).toFixed(1)} KB | avif ${(avifBytes/1024).toFixed(1)} KB | jpg ${(jpgBytes/1024).toFixed(1)} KB`);
}

console.log('Done.');
