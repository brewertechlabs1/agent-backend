# Deploying Richard's Clone to the Cloud

End state: the app runs 24/7 at `https://richard-clone.onrender.com`,
reachable from any phone or computer, with your login, your cloned
voice, the brain, voice capture, and the music-video Studio all working
over HTTPS.

Time: ~15 minutes. Cost: ~$7/month (Render Starter — needed for the
persistent disk and always-on behavior).

---

## Step 0 — Have these ready

| What | Where to get it |
|---|---|
| GitHub account with this repo | you have this |
| Render account | [render.com](https://render.com) — sign up free, add a card for the Starter plan |
| OpenAI API key | platform.openai.com → API keys → **create a fresh key** (the old one was exposed in git history — revoke it) |
| ElevenLabs API key + voice ID | elevenlabs.io → Profile → API key; voice ID from your Voices page (`iAZOOqBvOD0WjhaCrElf`) — **rotate the key you pasted in chat** |
| fal.ai API key *(optional — music videos)* | [fal.ai](https://fal.ai) → sign up → Keys |
| A strong login password | min 8 chars — this is what you'll type on your phone to sign in |

Also rotate the old Notion key (it was in the exposed `.env` too); Notion
is only needed for the legacy `/ask-agent` route, so you can skip it
entirely for the clone.

## Step 1 — Get the code onto your main branch

The clone lives on branch `claude/richard-voice-clone-builder-7ae2o9`.
Either merge it to `main` (GitHub → Pull requests → New → merge), or
just select that branch in Step 2 — Render can deploy any branch.

## Step 2 — Create the service from the blueprint

1. Go to [dashboard.render.com](https://dashboard.render.com).
2. **New → Blueprint**.
3. Connect your GitHub and pick the **agent-backend** repo and branch.
4. Render reads `render.yaml` and shows the service `richard-clone`
   with a form for the secret env vars. Fill in:

   | Variable | Value |
   |---|---|
   | `LLM_API_KEY` | your **new** OpenAI key |
   | `ELEVENLABS_API_KEY` | your **rotated** ElevenLabs key |
   | `ELEVENLABS_VOICE_ID` | `iAZOOqBvOD0WjhaCrElf` |
   | `ADMIN_PASSWORD` | your login password |
   | `FAL_KEY` | fal.ai key (or leave blank to skip music videos for now) |
   | `NOTION_API_KEY`, `NOTION_AGENT_DATABASES` | blank unless you still use `/ask-agent` |

   `VOICE_STORAGE_KEY` (encrypts your voice samples and photos) is
   generated automatically. `ADMIN_USER` defaults to `richard`.

5. Click **Apply**. First build takes a few minutes.

## Step 3 — Your website address

When the deploy goes green, the app is live at:

> **https://richard-clone.onrender.com**

- Want a different address? Rename the service in Render → Settings
  (the subdomain follows the service name), or add a **custom domain**
  (Settings → Custom Domains → add e.g. `clone.yourdomain.com`, create
  the CNAME it shows you at your DNS provider — TLS is automatic).
- On first boot the server creates your account from
  `ADMIN_USER`/`ADMIN_PASSWORD` — no shell needed.

## Step 4 — First login (do this from your phone)

1. Open the URL in your phone browser → you land on the sign-in page.
2. Sign in as `richard` + your password.
3. **Make it feel like an app:** in the browser menu choose **Add to
   Home Screen** (iPhone: Share → Add to Home Screen; Android: ⋮ → Add
   to Home screen). You get an icon that opens straight into the clone.
4. Smoke test, in order:
   - Chat: ask it something → reply should come back **and speak in
     your voice** (voice toggle is on by default).
   - 🎙️ Capture: record one short take, upload it, see it listed.
   - 🎬 Studio (if you set `FAL_KEY`): add a photo, write a scene
     prompt, generate a 5s 480p clip as a cheap test.

Everything is HTTPS, so the mic and camera work on mobile without any
tunnel.

## Step 5 — Always-on: what's already handled

- **No sleeping:** Render Starter instances run continuously (the free
  tier spins down after idle — that's why we don't use it).
- **Restarts:** if the process crashes, Render restarts it; the
  `healthCheckPath` in `render.yaml` (`/clone/login`) lets Render detect
  a hung app and recycle it.
- **Data survives deploys:** the 1 GB disk at `/var/data` holds your
  users/sessions, encrypted voice samples, photos, and generated clips.
  Code redeploys don't touch it.
- **Auto-deploy:** by default Render redeploys on every push to the
  connected branch. Leave it on — pushing to GitHub becomes your deploy
  button. (Settings → Build & Deploy to change.)

## Step 6 — Let other people in

Friends/colleagues get their own logins with an audience level that
controls what the clone shares with them and what they can do:

Render dashboard → your service → **Shell** tab, then:

```bash
node clone/add-user.js jamie known "Jamie"     # friend — sees known+public brain entries
node clone/add-user.js guest public            # anyone — public entries only
```

(It prompts for their password.) Only your `private` account can reach
Capture, Studio, and voice management. Send them the same URL.

## Ongoing care

- **Logs:** service → Logs tab (look here first if something misbehaves).
- **Change a secret:** service → Environment → edit → it redeploys.
- **Backups:** Settings → Disks → enable snapshots if you want restore
  points for voice data and users.
- **Costs to watch:** Render $7/mo flat; OpenAI and ElevenLabs bill per
  use (chat replies + speech); fal.ai bills per generated clip (cents
  for 5s Lite, more for Pro/1080p).
- **Kill switch:** `DELETE /clone/voice` (or the button on the Capture
  page) wipes the ElevenLabs voice model and all stored samples; the
  Studio has per-photo and per-clip delete. Suspending the service in
  Render stops everything instantly.

## Alternative hosts

The `Dockerfile` runs the same app on Fly.io, Railway, or a VPS:
mount a volume at `/var/data`, set the same env vars, terminate TLS
(Caddy/nginx on a VPS). Render is the least moving parts, which is why
it's the documented path.
