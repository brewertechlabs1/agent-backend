// clone/voice.js — voice sample storage (encrypted at rest) + ElevenLabs voice clone.
//
// Single-purpose rule: audio stored here is used solely to create and
// maintain Richard's voice model. Samples and the model are deletable in
// one call (deleteEverything).
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const VOICE_DIR = path.resolve('voice-data');
const SAMPLES_DIR = path.join(VOICE_DIR, 'samples');
const VOICE_META = path.join(VOICE_DIR, 'voice.json');
const ELEVEN_BASE = 'https://api.elevenlabs.io/v1';

function storageKey() {
  const hex = process.env.VOICE_STORAGE_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('VOICE_STORAGE_KEY must be a 32-byte hex key. Generate one with: openssl rand -hex 32');
  }
  return Buffer.from(hex, 'hex');
}

function elevenHeaders() {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error('ELEVENLABS_API_KEY is not set.');
  return { 'xi-api-key': key };
}

// --- encryption at rest (AES-256-GCM) ---

function encrypt(buf) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', storageKey(), iv);
  const data = Buffer.concat([cipher.update(buf), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]);
}

function decrypt(buf) {
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', storageKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]);
}

// --- sample storage ---

export function saveSample(audioBuffer, { label = 'sample', mimeType = 'audio/mpeg' } = {}) {
  fs.mkdirSync(SAMPLES_DIR, { recursive: true });
  label = String(label).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 60) || 'sample';
  const id = crypto.randomUUID();
  fs.writeFileSync(path.join(SAMPLES_DIR, `${id}.enc`), encrypt(audioBuffer));
  fs.writeFileSync(path.join(SAMPLES_DIR, `${id}.meta.json`), JSON.stringify({
    id, label, mimeType, sizeBytes: audioBuffer.length, createdAt: new Date().toISOString(),
  }, null, 2));
  return getSampleMeta(id);
}

function getSampleMeta(id) {
  return JSON.parse(fs.readFileSync(path.join(SAMPLES_DIR, `${id}.meta.json`), 'utf8'));
}

export function listSamples() {
  if (!fs.existsSync(SAMPLES_DIR)) return [];
  return fs.readdirSync(SAMPLES_DIR)
    .filter((f) => f.endsWith('.meta.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(SAMPLES_DIR, f), 'utf8')));
}

export function deleteSample(id) {
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new Error('Invalid sample id.');
  let deleted = false;
  for (const suffix of ['.enc', '.meta.json']) {
    const p = path.join(SAMPLES_DIR, `${id}${suffix}`);
    if (fs.existsSync(p)) { fs.unlinkSync(p); deleted = true; }
  }
  return deleted;
}

// --- voice model (ElevenLabs) ---

export function getVoiceId() {
  if (fs.existsSync(VOICE_META)) {
    return JSON.parse(fs.readFileSync(VOICE_META, 'utf8')).voiceId;
  }
  return process.env.ELEVENLABS_VOICE_ID || null;
}

/** Send all stored samples to ElevenLabs and create/update the voice model. */
export async function enrollVoice(name = 'Richard (clone)') {
  const samples = listSamples();
  if (samples.length === 0) throw new Error('No samples stored. Upload samples first.');

  const extByMime = {
    'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/webm': 'webm',
    'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/ogg': 'ogg',
  };
  const form = new FormData();
  form.append('name', name);
  form.append('description', 'Consented voice clone of Richard B. Single purpose: his AI clone.');
  for (const s of samples) {
    const audio = decrypt(fs.readFileSync(path.join(SAMPLES_DIR, `${s.id}.enc`)));
    const ext = extByMime[s.mimeType] || 'mp3';
    form.append('files', new Blob([audio], { type: s.mimeType }), `${s.label}-${s.id}.${ext}`);
  }

  const res = await fetch(`${ELEVEN_BASE}/voices/add`, {
    method: 'POST',
    headers: elevenHeaders(),
    body: form,
  });
  if (!res.ok) throw new Error(`ElevenLabs enroll failed (${res.status}): ${await res.text()}`);
  const { voice_id: voiceId } = await res.json();

  fs.mkdirSync(VOICE_DIR, { recursive: true });
  fs.writeFileSync(VOICE_META, JSON.stringify({
    voiceId, name, enrolledAt: new Date().toISOString(), sampleCount: samples.length,
  }, null, 2));
  return { voiceId, sampleCount: samples.length };
}

/** Text → speech in Richard's cloned voice. Returns an MP3 buffer. */
export async function speak(text) {
  const voiceId = getVoiceId();
  if (!voiceId) throw new Error('No voice enrolled. POST /clone/voice/enroll first.');

  const res = await fetch(`${ELEVEN_BASE}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { ...elevenHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: process.env.ELEVENLABS_TTS_MODEL || 'eleven_multilingual_v2',
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs TTS failed (${res.status}): ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

/** One-tap delete: remove the ElevenLabs voice model AND all local samples. */
export async function deleteEverything() {
  const result = { voiceModelDeleted: false, samplesDeleted: 0 };

  const voiceId = getVoiceId();
  if (voiceId && process.env.ELEVENLABS_API_KEY) {
    const res = await fetch(`${ELEVEN_BASE}/voices/${voiceId}`, {
      method: 'DELETE',
      headers: elevenHeaders(),
    });
    if (!res.ok && res.status !== 404) {
      throw new Error(`ElevenLabs voice delete failed (${res.status}): ${await res.text()}`);
    }
    result.voiceModelDeleted = true;
  }

  result.samplesDeleted = listSamples().length;
  fs.rmSync(VOICE_DIR, { recursive: true, force: true });
  return result;
}
