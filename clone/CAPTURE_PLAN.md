# Voice Capture Plan — recording session for the clone

Goal: enough clean audio to train a high-quality ElevenLabs voice model.
Target: **10–15 minutes total**, split across the takes below. You can
review, re-record, and delete any sample at any time; one call deletes
everything (samples + model).

## Recording setup

- Quiet room, no music/fan/traffic. Same mic for all takes.
- Phone or USB mic is fine — consistency matters more than gear.
- Format: MP3 or WAV, mono. Speak at your normal pace and energy —
  don't "announce."
- One take per file. If you stumble, just restart the sentence and keep
  rolling; small imperfections are good signal.

## Takes

### A. Read passages (~4 min) — clean phonetic coverage
Read naturally, like you're explaining to one person:

1. A paragraph from something you wrote (post, email, doc) — 60–90s.
2. A second passage in a different register — e.g. something technical
   you'd explain to a builder — 60–90s.
3. Numbers and names: read a few sentences containing numbers, tool
   names (Zapier, Notion, Ollama, Mistral), and "BEAM" — 30–60s.

### B. Free speech (~6–8 min) — your real cadence
Talk off the cuff, one topic per take:

4. Explain a current build — what it is, how the pipeline works — 2 min.
5. A take you hold about AI/automation hype — 2 min.
6. Talk about BEAM or a track you're working on — 2 min.

### C. Conversational range (~2 min)

7. Leave a casual voicemail-style message for a friend — 30–60s.
8. A clipped, transactional message (vendor/scheduling tone) — 30s.

## Upload

For each file:

```bash
base64 -w0 take-04-current-build.mp3 > audio.b64
curl -X POST http://localhost:3000/clone/voice/samples \
  -H "Content-Type: application/json" \
  -d "{\"audio\": \"$(cat audio.b64)\", \"label\": \"free-speech-current-build\", \"mimeType\": \"audio/mpeg\"}"
```

Then review the list (`GET /clone/voice/samples`), delete any weak takes
(`DELETE /clone/voice/samples/:id`), and train:

```bash
curl -X POST http://localhost:3000/clone/voice/enroll
```

## Bonus: double duty

Takes 4–6 are also Style Corpus gold. Transcribe them and drop the
transcripts into `brain/07-style-corpus/` — they seed the real signature
phrases and never-says for `persona.md`.

## Ground rules (baked into the system)

- Samples are encrypted at rest (`VOICE_STORAGE_KEY`); stored only in
  this repo's `voice-data/` folder, which is gitignored.
- Used solely to build/maintain your voice model — nothing else.
- `DELETE /clone/voice` wipes the ElevenLabs model and every local
  sample in one call.
