# Agent Server

Express.js server for managing AI agents with Notion memory integration —
now including **Richard's AI clone**: a voice-enabled agent grounded in a
knowledge base of his expertise, opinions, projects, and style.

## The Clone (`/clone/*`)

The clone = a cloned voice (ElevenLabs) + a knowledge base ("the brain")
it consults before speaking. See:

- `clone/CAPTURE_PLAN.md` — the recording session to train the voice
- `clone/brain/README.md` — knowledge base structure, schema, seeding checklist
- `clone/persona.md` — the clone's speaking rules and Style Guide (v1 draft)

### The web app (works on phones)

`/` redirects to **`/clone/app`** — a mobile-first chat UI behind a
login. Signed-in users talk to the clone by text or mic (on-device
speech recognition where the browser supports it) and hear replies in
Richard's cloned voice.

**Create users** (stored scrypt-hashed in the gitignored `data/` folder):

```bash
node clone/add-user.js richard private "Richard"   # full access
node clone/add-user.js jamie known "Jamie"         # friends/colleagues
node clone/add-user.js guest public                # anyone else
```

The account's **audience level** decides two things, enforced
server-side:

- which `relationship_scope` of brain entries the clone will surface to
  them (`private` sees everything, `known` sees known+public, `public`
  sees public only) — clients cannot escalate this;
- what they can do: only `private` accounts reach `/clone/capture`,
  `/clone/speak`, and the `/clone/voice/*` management routes.

Sessions are httpOnly cookies (30 days); sign out from the app header.
For scripts, `CLONE_API_TOKEN` (header `x-clone-token` or Bearer) acts
as a `private`-level API credential.

### Endpoints

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/clone/login` | public | Sign-in page |
| POST | `/clone/auth/login` | public | `{username, password}` → session cookie |
| POST | `/clone/auth/logout` | signed-in | End session |
| GET | `/clone/auth/me` | signed-in | Current user + audience |
| GET | `/clone/app` | signed-in | **Chat app** (mobile-first) |
| POST | `/clone/ask` | signed-in | `{message, speak?}` → grounded reply (+ base64 audio); audience comes from the account |
| GET | `/clone/capture` | private | **Mobile capture page** — record, review, upload, train |
| POST | `/clone/speak` | private | `{text}` → MP3 in the cloned voice |
| POST | `/clone/voice/samples` | private | `{audio: base64, label?, mimeType?}` → store an encrypted sample |
| GET | `/clone/voice/samples` | private | List stored samples |
| DELETE | `/clone/voice/samples/:id` | private | Delete one sample |
| POST | `/clone/voice/enroll` | private | Train the ElevenLabs voice from stored samples |
| GET | `/clone/voice` | private | Voice model status |
| DELETE | `/clone/voice` | private | **One-tap delete**: voice model + all samples |

### Studio: music videos with the avatar (`/clone/studio`)

Private-only page for making music-video clips of Richard via
**Seedance** (ByteDance's video model, called through fal.ai):

1. Add photos of yourself (phone camera or upload). Stored encrypted,
   used solely for the avatar/videos, deletable anytime.
2. Tap a photo, describe the scene ("performs under moody blue stage
   lights, slow push-in…"), pick 5s/10s and resolution.
3. Seedance animates the photo into a clip; finished MP4s appear on the
   page to preview, download, and cut into the music video.

Requires `FAL_KEY` (from fal.ai). Default model is Seedance 1.0 Lite
image-to-video; set `SEEDANCE_MODEL=fal-ai/bytedance/seedance/v1/pro/image-to-video`
for Pro quality.

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/clone/studio` | private | Studio page |
| POST/GET | `/clone/images` | private | Upload / list photos (encrypted at rest) |
| GET/DELETE | `/clone/images/:id` | private | View / delete a photo |
| POST | `/clone/video/generate` | private | `{prompt, imageId, duration?, resolution?}` → queue a Seedance clip |
| GET | `/clone/video/status/:id` | private | Poll a job (downloads the MP4 on completion) |
| GET | `/clone/videos` | private | List clip jobs |
| GET | `/clone/videos/file/:name` | private | Stream/download a finished clip |
| DELETE | `/clone/videos/:id` | private | Delete a clip |

## Deploying to the cloud (Render)

The repo ships a `render.yaml` blueprint. One-time setup:

1. Go to [dashboard.render.com](https://dashboard.render.com) → **New →
   Blueprint** → connect this GitHub repo (branch of your choice).
2. Render reads `render.yaml`. Fill in the secrets it asks for:
   `LLM_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`,
   `ADMIN_PASSWORD` (your login password), and optionally `FAL_KEY`
   (music videos) — `VOICE_STORAGE_KEY` is generated automatically.
3. Apply. The app builds and comes up at
   **`https://richard-clone.onrender.com`** (rename the service to pick
   a different subdomain, or attach a custom domain in Render settings).

Your account is created automatically on first boot from
`ADMIN_USER`/`ADMIN_PASSWORD` — open the URL on any phone or computer
and sign in. Everything runs over HTTPS, so the chat mic, the capture
page, and the camera all work on mobile. A 1 GB persistent disk at
`/var/data` keeps users, voice data, and media across deploys (disks
need Render's paid Starter instance, ~$7/mo).

**Other hosts:** the included `Dockerfile` runs on Fly.io, Railway, or
any VPS — mount a volume at `/var/data` and supply the same env vars.

### Local use from a phone (no cloud)

Expose the local server via a tunnel — `npx localtunnel --port 3000`,
`ngrok http 3000`, or `tailscale serve 3000` — then open the HTTPS URL
on the phone and sign in.

### Voice data rules

- Samples are encrypted at rest (AES-256-GCM, key = `VOICE_STORAGE_KEY`)
  in the gitignored `voice-data/` folder.
- Audio is used solely to build/maintain the voice model.
- The clone identifies as Richard's AI in consequential conversations and
  never handles payments, identity checks, or security verification
  (see `clone/persona.md`).

## Fixed Issues

1. **Updated OpenAI SDK usage**: Replaced deprecated `Configuration` and `OpenAIApi` with modern `OpenAI` client (v6.x)
2. **Added ES module support**: Added `"type": "module"` to `package.json`
3. **Added error handling**: Gracefully handles missing environment variables
4. **Created `.env.example`**: Template for required configuration

## Setup

1. Copy `.env.example` to `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```

2. Edit `.env` and add your credentials:
   - `LLM_API_KEY`: Your OpenAI API key
   - `NOTION_API_KEY`: Your Notion integration token
   - `NOTION_AGENT_DATABASES`: JSON mapping of agent names to database IDs

3. Install dependencies:
   ```powershell
   npm install
   ```

4. Start the server:
   ```powershell
   node server.js
   ```

## Usage

The server runs on `http://localhost:3000` (or the port specified in `.env`).

### POST /ask-agent

Send a message to an AI agent:

```bash
curl -X POST http://localhost:3000/ask-agent \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "agent": "alex", "user": "richard"}'
```

Response:
```json
{
  "reply": "Agent response here..."
}
```

## Requirements

- Node.js v22.x or later
- OpenAI API key (or compatible LLM)
- Notion integration with database access
