// clone/routes.js — HTTP surface for Richard's AI clone.
import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { retrieve, formatContext } from './brain.js';
import * as voice from './voice.js';
import * as images from './images.js';
import * as video from './video.js';
import {
  verifyUser, createSession, destroySession, sessionCookie, clearedCookie,
  requireAuth, requireAudience, listUsers, upsertUser,
} from './auth.js';

const CLONE_DIR = path.dirname(fileURLToPath(import.meta.url));
const PERSONA = fs.readFileSync(path.join(CLONE_DIR, 'persona.md'), 'utf8');

export function cloneRouter(openai) {
  const router = Router();

  // First boot on a fresh host: seed Richard's account from env so no
  // shell access is needed (set ADMIN_USER + ADMIN_PASSWORD once).
  if (listUsers().length === 0 && process.env.ADMIN_USER && process.env.ADMIN_PASSWORD) {
    try {
      upsertUser({
        username: process.env.ADMIN_USER,
        password: process.env.ADMIN_PASSWORD,
        audience: 'private',
        displayName: process.env.ADMIN_USER,
      });
      console.log(`👤 Seeded admin user "${process.env.ADMIN_USER}" from env.`);
    } catch (err) {
      console.error('Admin seed failed:', err.message);
    }
  }

  // === Public: sign-in ===
  router.get('/login', (req, res) => res.sendFile(path.join(CLONE_DIR, 'login.html')));

  router.post('/auth/login', (req, res) => {
    if (listUsers().length === 0) {
      return res.status(500).json({ error: 'No users exist yet. Create one: node clone/add-user.js <username> private' });
    }
    const user = verifyUser(req.body?.username, req.body?.password);
    if (!user) return res.status(401).json({ error: 'Wrong username or password.' });
    res.set('Set-Cookie', sessionCookie(createSession(user.username), req));
    res.json(user);
  });

  // === Everything below requires a session (or CLONE_API_TOKEN for API use) ===
  router.use(requireAuth);

  router.post('/auth/logout', (req, res) => {
    if (req.sessionToken) destroySession(req.sessionToken);
    res.set('Set-Cookie', clearedCookie());
    res.json({ ok: true });
  });

  router.get('/auth/me', (req, res) => res.json(req.user));

  // Chat app (any signed-in user)
  router.get('/app', (req, res) => res.sendFile(path.join(CLONE_DIR, 'app.html')));

  // Mobile capture page — Richard only (manages his voice data)
  router.get('/capture', requireAudience('private'), (req, res) => {
    res.sendFile(path.join(CLONE_DIR, 'capture.html'));
  });

  // === Ask the clone (grounded, in Richard's voice) ===
  // body: { message, speak?: boolean } — audience comes from the signed-in
  // user's account, so brain scope can't be escalated from the client.
  router.post('/ask', async (req, res) => {
    const { message, speak = false } = req.body;
    const audience = req.user.audience;
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

  // === Speak arbitrary text in the cloned voice — Richard only ===
  // (others hear the voice via /ask replies; free-text TTS in his voice
  //  is not something guests should have)
  // body: { text }  → audio/mpeg
  router.post('/speak', requireAudience('private'), async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required.' });
    try {
      const audio = await voice.speak(text);
      res.set('Content-Type', 'audio/mpeg').send(audio);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // === Voice enrollment — Richard only from here down ===
  router.use('/voice', requireAudience('private'));

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

  // === Studio: photos + Seedance music-video clips — Richard only ===
  router.use(['/studio', '/images', '/video', '/videos'], requireAudience('private'));

  router.get('/studio', (req, res) => res.sendFile(path.join(CLONE_DIR, 'studio.html')));

  // body: { image: <base64>, label?, mimeType? }
  router.post('/images', (req, res) => {
    const { image, label, mimeType } = req.body;
    if (!image) return res.status(400).json({ error: 'image (base64) is required.' });
    try {
      res.status(201).json(images.saveImage(Buffer.from(image, 'base64'), { label, mimeType }));
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/images', (req, res) => res.json(images.listImages()));

  router.get('/images/:id', (req, res) => {
    try {
      const { meta, data } = images.getImage(req.params.id);
      res.set('Content-Type', meta.mimeType).send(data);
    } catch {
      res.status(404).json({ error: 'Image not found.' });
    }
  });

  router.delete('/images/:id', (req, res) => {
    try {
      res.json({ deleted: images.deleteImage(req.params.id) });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // body: { prompt, imageId, duration?: '5'|'10', resolution?: '480p'|'720p'|'1080p' }
  router.post('/video/generate', async (req, res) => {
    try {
      res.status(202).json(await video.generateClip(req.body || {}));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/video/status/:requestId', async (req, res) => {
    try {
      res.json(await video.checkClip(req.params.requestId));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/videos', (req, res) => res.json(video.listJobs()));

  router.get('/videos/file/:name', (req, res) => {
    try {
      const p = video.videoPath(req.params.name);
      if (!p) return res.status(404).json({ error: 'Video not found.' });
      res.sendFile(p);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.delete('/videos/:requestId', (req, res) => {
    res.json({ deleted: video.deleteClip(req.params.requestId) });
  });

  return router;
}
