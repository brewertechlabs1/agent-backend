// clone/auth.js — users, sessions, and auth middleware for the clone app.
// Dependency-free: scrypt-hashed passwords, random-token sessions in an
// httpOnly cookie, persisted to the gitignored data/ folder.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.resolve('data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const COOKIE_NAME = 'clone_session';

// audience levels double as permission ranks (see brain relationship_scope)
export const AUDIENCE_RANK = { public: 0, known: 1, private: 2 };

// --- users ---

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

function writeJson(file, value) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

export function listUsers() {
  return readJson(USERS_FILE, []);
}

export function upsertUser({ username, password, audience = 'known', displayName }) {
  if (!/^[a-z0-9._-]{2,32}$/i.test(username)) {
    throw new Error('Username must be 2-32 chars: letters, digits, . _ -');
  }
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }
  if (!(audience in AUDIENCE_RANK)) {
    throw new Error(`Audience must be one of: ${Object.keys(AUDIENCE_RANK).join(', ')}`);
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  const users = listUsers().filter((u) => u.username !== username.toLowerCase());
  users.push({
    username: username.toLowerCase(),
    displayName: displayName || username,
    audience, salt, hash,
    createdAt: new Date().toISOString(),
  });
  writeJson(USERS_FILE, users);
}

export function verifyUser(username, password) {
  const user = listUsers().find((u) => u.username === String(username).toLowerCase());
  if (!user || !password) return null;
  const hash = crypto.scryptSync(password, user.salt, 64);
  const stored = Buffer.from(user.hash, 'hex');
  if (hash.length !== stored.length || !crypto.timingSafeEqual(hash, stored)) return null;
  return { username: user.username, displayName: user.displayName, audience: user.audience };
}

// --- sessions ---

let sessions = null;

function loadSessions() {
  if (!sessions) {
    sessions = new Map(Object.entries(readJson(SESSIONS_FILE, {})));
  }
  return sessions;
}

function persistSessions() {
  const now = Date.now();
  for (const [token, s] of sessions) {
    if (s.expires < now) sessions.delete(token);
  }
  writeJson(SESSIONS_FILE, Object.fromEntries(sessions));
}

export function createSession(username) {
  const token = crypto.randomBytes(32).toString('hex');
  loadSessions().set(token, { username, expires: Date.now() + SESSION_TTL_MS });
  persistSessions();
  return token;
}

export function destroySession(token) {
  if (loadSessions().delete(token)) persistSessions();
}

function sessionUser(token) {
  const s = token && loadSessions().get(token);
  if (!s || s.expires < Date.now()) return null;
  const user = listUsers().find((u) => u.username === s.username);
  if (!user) return null;
  return { username: user.username, displayName: user.displayName, audience: user.audience };
}

function cookieToken(req) {
  const match = /(?:^|;\s*)clone_session=([0-9a-f]+)/.exec(req.get('cookie') || '');
  return match ? match[1] : null;
}

export function sessionCookie(token, req) {
  const secure = req.secure || req.get('x-forwarded-proto') === 'https' ? '; Secure' : '';
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_MS / 1000}${secure}`;
}

export function clearedCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

// --- middleware ---

/** Attach req.user from session cookie or CLONE_API_TOKEN; else 401/redirect. */
export function requireAuth(req, res, next) {
  const apiToken = process.env.CLONE_API_TOKEN;
  if (apiToken) {
    const provided = req.get('x-clone-token') ||
      (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
    if (provided === apiToken) {
      req.user = { username: 'api', displayName: 'API', audience: 'private' };
      req.sessionToken = null;
      return next();
    }
  }
  const token = cookieToken(req);
  const user = sessionUser(token);
  if (user) {
    req.user = user;
    req.sessionToken = token;
    return next();
  }
  if ((req.get('accept') || '').includes('text/html')) {
    return res.redirect('/clone/login');
  }
  res.status(401).json({ error: 'Not logged in.' });
}

/** Gate a route to users at or above an audience level ('private' = Richard). */
export function requireAudience(level) {
  return (req, res, next) => {
    if (AUDIENCE_RANK[req.user?.audience] >= AUDIENCE_RANK[level]) return next();
    res.status(403).json({ error: 'Not allowed for this account.' });
  };
}
