// Phone photos and PNGs are often 1-5 MB; a 1600px copy looks the same and loads much faster on mobile data.
import fs from 'node:fs';
import sharp from 'sharp';

const MAX_EDGE = 1600;
const SHRINK_OVER_BYTES = 250 * 1024;

/**
 * Shrinks a photo in place. A PNG may become a JPG (only when allowRename and it has no see-through parts).
 * Returns the path now holding the photo, or null when it was left alone.
 */
export async function shrinkPhoto(file, { allowRename = false } = {}) {
  const input = fs.readFileSync(file);
  const meta = await sharp(input).metadata();
  if (input.length <= SHRINK_OVER_BYTES && Math.max(meta.width, meta.height) <= MAX_EDGE) return null;

  const jpgPath = file.replace(/\.png$/i, '.jpg');
  const opaque = !meta.hasAlpha || (await sharp(input).stats()).isOpaque;
  const toJpg = meta.format === 'png' && allowRename && opaque && !fs.existsSync(jpgPath);
  // rotate() keeps phone photos upright; sharp drops hidden data such as the GPS location.
  let image = sharp(input).rotate().resize(MAX_EDGE, MAX_EDGE, { fit: 'inside', withoutEnlargement: true });
  if (toJpg || meta.format === 'jpeg') image = image.flatten({ background: '#ffffff' }).jpeg({ quality: 82, mozjpeg: true });
  else if (meta.format === 'webp') image = image.webp({ quality: 82 });
  else if (meta.format === 'png') image = image.png({ compressionLevel: 9 });
  else return null;

  const output = await image.toBuffer();
  if (output.length >= input.length) return null;
  const target = toJpg ? jpgPath : file;
  fs.writeFileSync(target, output);
  if (toJpg) fs.rmSync(file);
  return target;
}
