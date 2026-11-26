// Product photos uploaded from the admin dashboard, kept in the database (free plan) and served through the CDN.
import crypto from 'crypto';
import { query } from './db.js';
import { ProductInputError } from './product-admin.js';

export const PHOTO_PATH = /^\/api\/products\/photo\/([a-f0-9]{24})(-s)?\.jpg$/;
export const PHOTO_LIMIT_BYTES = 300 * 1024 * 1024; // keeps room in Neon's free 1 GB for orders
const MAX_MAIN = 900 * 1024;
const MAX_THUMB = 150 * 1024;

const bad = message => new ProductInputError(400, message);

// The phone sends JPEGs it made itself; anything else is refused rather than stored.
function decodeJpeg(base64, max, label) {
  if (typeof base64 !== 'string' || base64.length > Math.ceil(max / 3) * 4 + 4) throw bad(`${label} is too large.`);
  const bytes = Buffer.from(base64, 'base64');
  if (bytes.length < 200 || bytes.length > max) throw bad(`${label} is too large or empty.`);
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff || bytes[bytes.length - 2] !== 0xff || bytes[bytes.length - 1] !== 0xd9) {
    throw bad(`${label} is not a JPEG photo.`);
  }
  return bytes;
}

export async function photoUsage() {
  const row = await query('SELECT COALESCE(SUM(OCTET_LENGTH(bytes) + OCTET_LENGTH(thumb)), 0)::bigint AS used, COUNT(*)::int AS count FROM product_photos');
  return { used: Number(row?.used || 0), count: Number(row?.count || 0), limit: PHOTO_LIMIT_BYTES };
}

export async function savePhoto(input) {
  const body = input && typeof input === "object" ? input : {};
  if (!process.env.DATABASE_URL) throw new ProductInputError(503, 'Photos need the online database.');
  const main = decodeJpeg(body.photo, MAX_MAIN, 'Photo');
  const thumb = decodeJpeg(body.thumb, MAX_THUMB, 'Small photo');
  const usage = await photoUsage();
  if (usage.used + main.length + thumb.length > PHOTO_LIMIT_BYTES) {
    throw new ProductInputError(409, 'Photo storage is full. Ask Claude to move photos to bigger storage.');
  }
  const id = crypto.randomBytes(12).toString('hex');
  await query('INSERT INTO product_photos (id, bytes, thumb) VALUES ($1, $2, $3)', [id, main, thumb]);
  return { url: `/api/products/photo/${id}.jpg`, thumb: `/api/products/photo/${id}-s.jpg`, usage: { ...usage, used: usage.used + main.length + thumb.length } };
}

/** Writes the photo, or a 404. Ids are random and never reused, so copies can be kept for a year. */
export async function sendPhoto(path, res) {
  const match = String(path).match(PHOTO_PATH);
  const row = match && process.env.DATABASE_URL
    ? await query(`SELECT ${match[2] ? 'thumb' : 'bytes'} AS data FROM product_photos WHERE id = $1`, [match[1]])
    : null;
  if (!row?.data) {
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.status(404).end('Not found');
  }
  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('Vercel-CDN-Cache-Control', 'public, max-age=31536000, immutable');
  return res.status(200).send(row.data);
}
