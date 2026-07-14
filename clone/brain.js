// clone/brain.js — loads the knowledge base and retrieves entries for a message.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const BRAIN_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'brain');

// audience level → which relationship_scopes may surface to it
const SCOPE_ACCESS = {
  public: ['public'],
  known: ['public', 'known'],
  private: ['public', 'known', 'private'],
};

export function loadBrain() {
  const entries = [];
  const collections = fs.readdirSync(BRAIN_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory());

  for (const dir of collections) {
    const dirPath = path.join(BRAIN_DIR, dir.name);
    for (const file of fs.readdirSync(dirPath)) {
      if (!file.endsWith('.json')) continue;
      try {
        const entry = JSON.parse(fs.readFileSync(path.join(dirPath, file), 'utf8'));
        entry.collection = dir.name;
        entry.file = `${dir.name}/${file}`;
        entries.push(entry);
      } catch (err) {
        console.warn(`⚠️  Skipping malformed brain entry ${dir.name}/${file}: ${err.message}`);
      }
    }
  }
  return entries;
}

function tokenize(text) {
  return new Set(
    (text || '').toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2)
  );
}

function recencyValue(recency) {
  if (!recency || recency === 'evergreen') return 0;
  const t = Date.parse(recency);
  return Number.isNaN(t) ? 0 : t;
}

/**
 * Retrieve the brain entries most relevant to a message.
 * @param {string} message   incoming conversation text
 * @param {string} audience  'public' | 'known' | 'private' — who the clone is talking to
 * @param {number} limit     max entries to return
 */
export function retrieve(message, audience = 'public', limit = 5) {
  const allowedScopes = SCOPE_ACCESS[audience] || SCOPE_ACCESS.public;
  const words = tokenize(message);

  const scored = loadBrain()
    // 2. filter by relationship_scope — wrong-audience entries never surface
    .filter((e) => allowedScopes.includes(e.relationship_scope))
    .map((e) => {
      // 1. match on topic_tags (strongest signal), then title/content keywords
      let score = 0;
      for (const tag of e.topic_tags || []) {
        if (words.has(tag.toLowerCase())) score += 3;
      }
      const entryWords = tokenize(`${e.title} ${e.content}`);
      for (const w of words) {
        if (entryWords.has(w)) score += 1;
      }
      return { entry: e, score };
    })
    .filter((s) => s.score > 0)
    // 3. on ties, prefer higher recency, then confidence: stated
    .sort((a, b) =>
      b.score - a.score ||
      recencyValue(b.entry.recency) - recencyValue(a.entry.recency) ||
      (b.entry.confidence === 'stated') - (a.entry.confidence === 'stated')
    );

  return scored.slice(0, limit).map((s) => s.entry);
}

/** Format retrieved entries as context for the clone's prompt. */
export function formatContext(entries) {
  if (entries.length === 0) return '(nothing relevant found in the brain)';
  return entries.map((e) =>
    `[${e.file} | ${e.type} | confidence: ${e.confidence} | ${e.recency}]\n${e.content}`
  ).join('\n\n');
}
