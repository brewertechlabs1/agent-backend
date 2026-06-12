# Agent Server

Express.js server for managing AI agents with Notion memory integration.

## 🕸️ SPIDER-SWING — web-swinging game

A 3D Spider-Man-style web-swinging sandbox built with Three.js lives in `public/spiderman/`.
No API keys needed — just start the server and open:

```
npm start
# then visit http://localhost:3000/spiderman/
```

**Controls:** mouse to look/aim · hold **LMB / Space** to fire and hold a web line ·
**WASD** to run and steer mid-air · **Shift** to reel in (or sprint) · **Space** to jump ·
**R** to reset to a rooftop. Collect the glowing red orbs scattered through the skyline.

Features: procedural dusk city with emissive windows, pendulum-physics swinging,
HDR bloom post-processing, soft shadows, dynamic FOV, procedural hero animation,
and WebAudio wind/thwip sound. All Three.js files are vendored locally
(`public/spiderman/lib/`), so it works fully offline.

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
