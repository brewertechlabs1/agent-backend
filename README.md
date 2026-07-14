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

### Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/clone/ask` | `{message, audience?, speak?}` → grounded reply in Richard's voice (+ base64 audio if `speak: true`) |
| POST | `/clone/speak` | `{text}` → MP3 in the cloned voice |
| POST | `/clone/voice/samples` | `{audio: base64, label?, mimeType?}` → store an encrypted sample |
| GET | `/clone/voice/samples` | List stored samples |
| DELETE | `/clone/voice/samples/:id` | Delete one sample |
| POST | `/clone/voice/enroll` | Train the ElevenLabs voice from stored samples |
| GET | `/clone/voice` | Voice model status |
| DELETE | `/clone/voice` | **One-tap delete**: voice model + all samples |

`audience` on `/clone/ask` is `public` (default), `known`, or `private` —
it controls which `relationship_scope` of brain entries may surface.

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
