// clone/routes.js — HTTP surface for Richard's AI clone.
import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { retrieve, formatContext } from './brain.js';
import * as voice from './voice.js';

const CLONE_DIR = path.dirname(fileURLToPath(import.meta.url));
const PERSONA = fs.readFileSync(path.join(CLONE_DIR, 'persona.md'), 'utf8');

export function cloneRouter(openai) {
  const router = Router();

  // Mobile capture page — record, review, upload, train from a phone browser
  router.get('/capture', (req, res) => {
    res.sendFile(path.join(CLONE_DIR, 'capture.html'));
  });

  // Optional shared-secret gate for everything below. Set CLONE_API_TOKEN
  // when exposing the server beyond localhost (tunnel/LAN) so voice data
  // and the brain aren't open to anyone with the URL.
  router.use((req, res, next) => {
    const required = process.env.CLONE_API_TOKEN;
    if (!required) return next();
    const provided = req.get('x-clone-token') ||
      (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
    if (provided === required) return next();
    res.status(401).json({ error: 'Invalid or missing clone API token.' });
  });

  // === Ask the clone (grounded, in Richard's voice) ===
  // body: { message, audience?: 'public'|'known'|'private', speak?: boolean }
  router.post('/ask', async (req, res) => {
    const { message, audience = 'public', speak = false } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required.' });
    if (!openai) return res.status(500).json({ error: 'LLM not configured. Set LLM_API_KEY.' });

    try {
      const entries = retrieve(message, audience);
      const chat = await openai.chat.completions.create({
        model: process.env.LLM_MODEL,
        messages: [
          { role: 'system', content: PERSONA },
          {
            role: 'system',
            content: `Audience level for this conversation: ${audience}.\n\n` +
              `Retrieved brain entries (answer from these; flag gaps rather than inventing):\n\n` +
              formatContext(entries),
          },
          { role: 'user', content: message },
        ],
      });
      const reply = chat.choices[0].message.content;

      const payload = {
        reply,
        grounding: entries.map((e) => ({ file: e.file, confidence: e.confidence })),
      };
      if (speak) {
        payload.audio = (await voice.speak(reply)).toString('base64');
        payload.audioFormat = 'audio/mpeg;base64';
      }
      res.json(payload);
    } catch (err) {
      console.error('Clone ask error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // === Speak arbitrary text in the cloned voice ===
  // body: { text }  → audio/mpeg
  router.post('/speak', async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required.' });
    try {
      const audio = await voice.speak(text);
      res.set('Content-Type', 'audio/mpeg').send(audio);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // === Voice enrollment ===
  // body: { audio: <base64>, label?, mimeType? } — one recorded sample
  router.post('/voice/samples', (req, res) => {
    const { audio, label, mimeType } = req.body;
    if (!audio) return res.status(400).json({ error: 'audio (base64) is required.' });
    try {
      const meta = voice.saveSample(Buffer.from(audio, 'base64'), { label, mimeType });
      res.status(201).json(meta);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/voice/samples', (req, res) => {
    res.json(voice.listSamples());
  });

  router.delete('/voice/samples/:id', (req, res) => {
    try {
      const deleted = voice.deleteSample(req.params.id);
      res.status(deleted ? 200 : 404).json({ deleted });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Train/refresh the ElevenLabs voice model from stored samples
  router.post('/voice/enroll', async (req, res) => {
    try {
      res.json(await voice.enrollVoice(req.body?.name));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/voice', (req, res) => {
    res.json({ voiceId: voice.getVoiceId(), samples: voice.listSamples().length });
  });

  // One-tap delete: voice model + all samples
  router.delete('/voice', async (req, res) => {
    try {
      res.json(await voice.deleteEverything());
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
