// clone/images.js — photos of Richard for avatar/video generation.
// Same rules as voice: encrypted at rest, single purpose (his avatar and
// music videos), deletable individually or all at once.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { encrypt, decrypt, dataBase } from './crypto.js';

const IMAGES_DIR = path.resolve(dataBase(), 'media-data', 'images');

export function saveImage(imageBuffer, { label = 'photo', mimeType = 'image/jpeg' } = {}) {
  if (!/^image\/(jpeg|png|webp)$/.test(mimeType)) {
    throw new Error('mimeType must be image/jpeg, image/png, or image/webp.');
  }
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  label = String(label).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 60) || 'photo';
  const id = crypto.randomUUID();
  fs.writeFileSync(path.join(IMAGES_DIR, `${id}.enc`), encrypt(imageBuffer));
  const meta = { id, label, mimeType, sizeBytes: imageBuffer.length, createdAt: new Date().toISOString() };
  fs.writeFileSync(path.join(IMAGES_DIR, `${id}.meta.json`), JSON.stringify(meta, null, 2));
  return meta;
}

export function listImages() {
  if (!fs.existsSync(IMAGES_DIR)) return [];
  return fs.readdirSync(IMAGES_DIR)
    .filter((f) => f.endsWith('.meta.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(IMAGES_DIR, f), 'utf8')));
}

function assertId(id) {
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new Error('Invalid image id.');
}

export function getImage(id) {
  assertId(id);
  const meta = JSON.parse(fs.readFileSync(path.join(IMAGES_DIR, `${id}.meta.json`), 'utf8'));
  const data = decrypt(fs.readFileSync(path.join(IMAGES_DIR, `${id}.enc`)));
  return { meta, data };
}

export function imageDataUri(id) {
  const { meta, data } = getImage(id);
  return `data:${meta.mimeType};base64,${data.toString('base64')}`;
}

export function deleteImage(id) {
  assertId(id);
  let deleted = false;
  for (const suffix of ['.enc', '.meta.json']) {
    const p = path.join(IMAGES_DIR, `${id}${suffix}`);
    if (fs.existsSync(p)) { fs.unlinkSync(p); deleted = true; }
  }
  return deleted;
}

export function deleteAllImages() {
  const count = listImages().length;
  fs.rmSync(IMAGES_DIR, { recursive: true, force: true });
  return count;
}
