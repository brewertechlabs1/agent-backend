// clone/crypto.js — AES-256-GCM at-rest encryption for Richard's media
// (voice samples and photos). Key comes from VOICE_STORAGE_KEY: either a
// 64-char hex key or any secret ≥16 chars (hashed to a key).
import crypto from 'crypto';

export function storageKey() {
  const raw = process.env.VOICE_STORAGE_KEY;
  if (!raw || raw.length < 16) {
    throw new Error('VOICE_STORAGE_KEY must be set (≥16 chars). Generate with: openssl rand -hex 32');
  }
  return /^[0-9a-f]{64}$/i.test(raw)
    ? Buffer.from(raw, 'hex')
    : crypto.createHash('sha256').update(raw).digest();
}

export function encrypt(buf) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', storageKey(), iv);
  const data = Buffer.concat([cipher.update(buf), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]);
}

export function decrypt(buf) {
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', storageKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]);
}

/** Base directory for all runtime data (users, voice, media). On cloud
 *  hosts, point CLONE_DATA_DIR at the persistent disk mount. */
export function dataBase() {
  return process.env.CLONE_DATA_DIR || '.';
}
