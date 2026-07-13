// util.js — shared helpers (no external dependencies)
import crypto from 'crypto';

// ---------- HTML escaping ----------
export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ---------- Passwords ----------
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const check = crypto.scryptSync(password, salt, 64).toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'));
  } catch {
    return false;
  }
}

// ---------- Session tokens (HMAC-signed, stateless) ----------
export function makeToken(secret, ttlMs = 1000 * 60 * 60 * 24 * 7) {
  const exp = Date.now() + ttlMs;
  const sig = crypto.createHmac('sha256', secret).update(String(exp)).digest('hex');
  return `${exp}.${sig}`;
}

export function verifyToken(secret, token) {
  if (!token || !token.includes('.')) return false;
  const [exp, sig] = token.split('.');
  if (Number(exp) < Date.now()) return false;
  const expect = crypto.createHmac('sha256', secret).update(String(exp)).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expect, 'hex'));
  } catch {
    return false;
  }
}

// ---------- Cookies ----------
export function parseCookies(req) {
  const out = {};
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

// ---------- Request body parsing ----------
export function readBody(req, limit = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > limit) { reject(new Error('Body too large')); req.destroy(); }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export async function parseBody(req) {
  const raw = await readBody(req);
  const type = (req.headers['content-type'] || '').split(';')[0].trim();
  if (type === 'application/json') {
    try { return JSON.parse(raw || '{}'); } catch { return {}; }
  }
  // default: application/x-www-form-urlencoded
  const out = {};
  for (const [k, v] of new URLSearchParams(raw)) out[k] = v;
  return out;
}

// ---------- Merge tags ----------
export function mergeTags(template, tags) {
  return String(template ?? '').replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) =>
    tags[key] != null ? String(tags[key]) : '');
}

// ---------- CSV ----------
export function csvEscape(v) {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows, headers) {
  const lines = [headers.map(csvEscape).join(',')];
  for (const row of rows) lines.push(headers.map((h) => csvEscape(row[h])).join(','));
  return lines.join('\r\n');
}

// Parses simple CSV text (handles quoted fields). Returns array of objects keyed by header row.
export function parseCsv(text) {
  const rows = [];
  let field = '', row = [], inQuotes = false;
  const src = String(text ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); field = ''; rows.push(row); row = []; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1)
    .filter((r) => r.some((v) => v.trim() !== ''))
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? '').trim()])));
}

// ---------- Misc ----------
export const uid = () => crypto.randomUUID();

export function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());
}

export function fmtDateTime(iso, tzHint) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  } catch { return iso; }
}
