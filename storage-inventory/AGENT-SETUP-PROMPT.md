# Claude Agent Setup Script

Copy the prompt below into a **Claude Code** session (best options:
**claude.ai/code** in a browser, or the Claude Code desktop app / CLI on any
computer). Claude Code is the right surface because the setup uses `clasp` —
Google's official Apps Script command-line tool — which needs a terminal.

> **Before you paste it:** be ready to do the two steps only a human can do —
> both take under a minute and Claude will tell you exactly when:
> 1. A Google sign-in link (sign in with **Mom's Google Business account**).
> 2. Flipping one "Apps Script API" toggle at script.google.com.

---

## The prompt (copy everything in the box)

```
You are setting up my Google Apps Script web app called "Storage Inventory".
The source code is in the GitHub repo brewertechlabs1/agent-backend, branch
claude/storage-inventory-app-ygrqiw, folder storage-inventory/apps-script/
(three files: Code.gs, Index.html, appsscript.json). Clone or fetch it first.

Follow these steps exactly, and stop and tell me clearly whenever a step
needs ME to do something in a browser:

1. Install Google's Apps Script CLI:
   npm install -g @google/clasp

2. Log in to Google:
   clasp login --no-localhost
   This prints a URL. Give me that URL and tell me to open it, sign in with
   the Google Business account that should OWN the app, approve access, and
   paste the code back to you. Wait for me.

3. Tell me to enable the Apps Script API (one-time toggle):
   https://script.google.com/home/usersettings → set "Google Apps Script API"
   to ON, using the same account. Wait for me to confirm.

4. From inside the storage-inventory/apps-script directory, create the
   project:
   clasp create --type webapp --title "Storage Inventory" --rootDir .
   If it complains about a file overwrite of appsscript.json, keep OUR
   appsscript.json (it contains the required webapp settings: executeAs
   USER_DEPLOYING, access MYSELF).

5. Push the code:
   clasp push -f
   Verify all three files pushed (Code.gs, Index.html, appsscript.json).

6. Deploy it as a web app:
   clasp deploy --description "v1"
   Take the deployment ID from the output (the one marked @1, NOT @HEAD) and
   build the app URL:
   https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec

7. Give me the final app URL along with these exact instructions:
   - Open the URL in a browser while signed in to the same Google account.
   - The FIRST visit shows "Authorization required" → Review permissions →
     choose the account → if it says "Google hasn't verified this app",
     click Advanced → "Go to Storage Inventory (unsafe)" → Allow. This is
     normal for a self-built app; no one else can access it.
   - Reload the page once after allowing. The app sets itself up
     automatically on this first load: it creates a Google Sheet named
     "Storage Inventory", a Drive folder "Storage Inventory Photos", and a
     calendar "Storage Inventory - Clients".
   - On her phone: open the URL in Safari (iPhone) → Share → Add to Home
     Screen, or Chrome (Android) → ⋮ menu → Add to Home screen.

8. Sanity checks before you finish — confirm and report:
   - `clasp deployments` lists the v1 deployment.
   - The URL returns the app (not an error page) — note that I may need to
     complete the authorization step first before it fully loads.

If any step fails, show me the exact error and the fix; do not skip steps.
Never change "Execute as" away from the deploying user or widen access
beyond MYSELF unless I explicitly ask.
```

---

## What still needs a human (and why)

| Step | Why an agent can't do it |
|---|---|
| Google sign-in (`clasp login`) | Google OAuth requires a real person to approve account access |
| Apps Script API toggle | Lives behind that Google login |
| First-visit "Allow" in the app | Google shows the consent screen to the account owner only |

Everything else — creating the project, uploading the code, deploying, and
building the app URL — the agent does on its own. The app then creates its
own spreadsheet, Drive folder, and calendar on first load, so there is zero
manual configuration.

## Alternative: no terminal at all

If you'd rather not use Claude Code, the manual path in **SETUP.md** is a
15-minute copy-paste job at **https://script.google.com** (paste two files,
click Deploy). An agent that can drive a browser (e.g. Claude in Chrome) can
walk those same SETUP.md steps, but you'll still be asked to handle the
Google sign-in and permission screens yourself.
