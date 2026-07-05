# Claude Agent Setup Script (Claude in Chrome)

This setup is done with the **Claude for Chrome extension** driving the
browser through **https://script.google.com** — the official Google Apps
Script site where the app lives.

## Before you paste the prompt — 2-minute checklist

1. **Chrome is signed in to Mom's Google Business account.** Open
   https://myaccount.google.com and check the profile picture / email in the
   top-right. Everything the agent creates will belong to whichever account
   is active. If other Google accounts are also signed in, sign them out or
   use a fresh Chrome profile with only her account — this is the #1 cause
   of setup problems.
2. **Chrome is signed in to GitHub** with an account that can see the
   `brewertechlabs1/agent-backend` repo (the agent copies the code from
   there).
3. Open the Claude extension and paste the prompt below.

The only things the agent will hand back to you are Google's permission
screens — Google requires the account owner to click those personally.

---

## The prompt (copy everything in the box)

```
Set up my Google Apps Script web app called "Storage Inventory" by driving
the browser. I am already signed in to Chrome with the Google account that
must OWN this app, and signed in to GitHub. Work step by step, verify each
step visually before moving on, and hand control back to me whenever a
Google sign-in or permission screen appears — never click through OAuth
consent screens yourself.

SOURCE CODE (GitHub):
Repo: brewertechlabs1/agent-backend
Branch: claude/storage-inventory-app-ygrqiw
Folder: storage-inventory/apps-script/
Files needed: Code.gs and Index.html

STEP 1 — Copy the backend code
Go to:
https://github.com/brewertechlabs1/agent-backend/blob/claude/storage-inventory-app-ygrqiw/storage-inventory/apps-script/Code.gs
Open the raw view (Raw button) or use the "Copy raw file" button and copy
the ENTIRE file contents.

STEP 2 — Create the Apps Script project
Go to https://script.google.com and click "New project".
Click the project name "Untitled project" at the top and rename it to:
Storage Inventory

STEP 3 — Paste the backend
In the editor, select ALL the starter code in Code.gs and delete it, then
paste the contents copied in Step 1. Save (Ctrl+S). Confirm the first line
reads: /** and mentions "Storage Unit Inventory Manager".

STEP 4 — Copy the app screen code
In a new tab go to:
https://github.com/brewertechlabs1/agent-backend/blob/claude/storage-inventory-app-ygrqiw/storage-inventory/apps-script/Index.html
Copy the ENTIRE raw file contents the same way.

STEP 5 — Add the HTML file
Back in the Apps Script editor: in the left "Files" panel click the + and
choose "HTML". Name it exactly: Index
(capital I — the .html extension is added automatically).
Delete the starter content it generated, paste the contents from Step 4,
and Save. Confirm the file list now shows: Code.gs, Index.html.

STEP 6 — Deploy as a web app
Click the blue "Deploy" button (top right) → "New deployment".
Click the gear icon next to "Select type" → choose "Web app".
Set exactly:
  - Description: Storage Inventory v1
  - Execute as: Me
  - Who has access: Only myself
Click "Deploy".
If Google shows an "Authorize access" / account chooser / consent screen,
STOP and hand control to me — I will pick the account and click Allow
(including "Advanced → Go to Storage Inventory (unsafe)" if it says the
app is unverified; that is expected for a personal app). Tell me exactly
what to click, then wait. After I finish, continue.

STEP 7 — Capture the app URL
On the deployment success screen, copy the "Web app" URL (it ends in /exec).
Report this URL to me prominently — it IS the app.

STEP 8 — First launch (creates everything automatically)
Open the /exec URL in a new tab. If another authorization screen appears,
hand it to me again. Once allowed, reload the page once. The app builds its
own storage on this first load: a Google Sheet named "Storage Inventory",
a Drive folder "Storage Inventory Photos", and a calendar
"Storage Inventory - Clients".

STEP 9 — Verify, then report
Check and tell me the result of each:
  - The app loads with a blue "Storage Inventory" header and three bottom
    tabs: Inventory, Clients, Calendar.
  - https://drive.google.com shows a folder "Storage Inventory Photos".
  - https://docs.google.com/spreadsheets shows "Storage Inventory".
Then give me:
  - The final app URL
  - Phone install steps: iPhone → open URL in Safari → Share → Add to Home
    Screen; Android → open URL in Chrome → ⋮ menu → Add to Home screen.

RULES:
- Do not change "Execute as: Me" or widen access beyond "Only myself".
- Do not edit the code — paste it exactly as copied.
- If a paste looks truncated, redo the copy from the Raw view.
- If anything fails, show me the exact error and stop rather than guessing.
```

---

## After the agent finishes

- Text/email the app URL to Mom's phone and add it to her home screen
  (steps are in the agent's final report and in `SETUP.md` Part 2).
- Her day-to-day usage guide is **SETUP.md → Part 3**.
- To ship future updates without breaking her home-screen icon:
  **SETUP.md → Part 4** (Deploy → *Manage deployments* → New version).

## Alternative paths

- **Manual (no agent):** `SETUP.md` — the same steps done by hand,
  ~15 minutes.
- **Claude Code + clasp (terminal):** ask a Claude Code session to deploy
  `storage-inventory/apps-script/` with Google's `clasp` CLI
  (`clasp login --no-localhost` → `clasp create --type webapp` →
  `clasp push -f` → `clasp deploy`). Useful if you prefer everything
  scripted instead of browser-driven.
