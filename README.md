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

### Using it from a phone

Phone browsers require HTTPS for mic access (both the capture page and
the chat mic), so expose the server via a tunnel — `npx localtunnel
--port 3000`, `ngrok http 3000`, or `tailscale serve 3000` — then open
`https://<url>/` on the phone and sign in. For a permanent setup, put
the app on a small host (Fly.io, Railway, a VPS behind Caddy) with real
TLS.

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
