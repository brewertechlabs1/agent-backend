# Storage Inventory — Step-by-Step Setup Guide

This guide walks you through setting up the Storage Inventory app from scratch.
**No servers, no hosting bills, no credit card.** The app runs entirely on
Google's servers under your Google Business account and costs **$0/month**.

**What you get when you're done:**

- 📱 An app on her phone's home screen (works on iPhone and Android)
- 📦 Inventory list with photos taken straight from the phone camera
- 🗂 All data stored in a **Google Sheet** she can also open and edit directly
- 🖼 All photos stored in a **Google Drive folder**
- 📅 Client appointments on a **Google Calendar** with popup + email reminders
- 👤 A simple client list with tap-to-call and tap-to-email

**Time needed:** about 15 minutes.

---

## Part 1 — Create the app (do this on a computer)

> ⚠️ Make sure you are signed in to **Mom's Google Business account** in the
> browser before starting (check the profile picture in the top-right corner
> of any Google page). Everything created below will belong to that account.

### Step 1: Open Google Apps Script

1. Go to **https://script.google.com**
2. Click **+ New project** (top left).
3. Click the project name **"Untitled project"** at the top and rename it to
   **Storage Inventory**.

### Step 2: Paste the backend code

1. You'll see a file called `Code.gs` with a few lines of starter code.
   Select everything in it and delete it.
2. Open the file **`apps-script/Code.gs`** from this folder, copy **all** of
   it, and paste it into the editor.
3. Press **Ctrl+S** (Mac: **Cmd+S**) to save.

### Step 3: Add the app screen (HTML file)

1. In the left sidebar, click the **+** next to **Files** and choose **HTML**.
2. Name it exactly: **Index** (capital I, no ".html" — it's added automatically).
3. Delete the starter content it created, then copy **all** of
   **`apps-script/Index.html`** from this folder and paste it in.
4. Press **Ctrl+S** to save.

### Step 4: Run the one-time setup

This creates the Google Sheet, the Drive photo folder, and the calendar
automatically — you don't have to make anything by hand.

1. At the top of the editor there's a dropdown that probably says `doGet`.
   Change it to **`setup`**.
2. Click **▶ Run**.
3. A window pops up: **"Authorization required"** → click **Review permissions**.
4. Pick Mom's account.
5. You may see **"Google hasn't verified this app"**. That's normal — *you*
   are the developer of this app, it isn't published to anyone else.
   Click **Advanced** → **Go to Storage Inventory (unsafe)** → **Allow**.
6. Wait for the run to finish. In the **Execution log** at the bottom you'll
   see links to the new spreadsheet — the app remembers everything itself,
   so you don't need to copy anything down.

### Step 5: Publish the app

1. Click the blue **Deploy** button (top right) → **New deployment**.
2. Click the gear ⚙️ next to "Select type" → choose **Web app**.
3. Fill in:
   - **Description:** `Storage Inventory v1`
   - **Execute as:** **Me** (Mom's account)
   - **Who has access:** **Only myself**
     *(If you also want access from your own Google account and you're in the
     same Google Workspace, choose "Anyone within [your organization]" instead.)*
4. Click **Deploy**, then **copy the Web app URL** — this is the app!
5. Send that URL to Mom's phone (text it or email it to her).

---

## Part 2 — Put the app on her phone

### iPhone (Safari)

1. Open the Web app URL in **Safari** and sign in with Mom's Google account
   if asked.
2. Tap the **Share** button (square with an arrow, bottom of the screen).
3. Scroll down and tap **Add to Home Screen** → **Add**.
4. A **Storage Inventory** icon now appears on the home screen like a
   regular app.

### Android (Chrome)

1. Open the Web app URL in **Chrome** and sign in with Mom's Google account
   if asked.
2. Tap the **⋮** menu (top right).
3. Tap **Add to Home screen** → **Add**.

---

## Part 3 — Using the app (give this bit to Mom)

- **📦 Inventory tab** — everything in storage. Tap the blue **+** to add an
  item; tap **📷** in the form to take a photo with the camera. Tap any item
  to see it, edit it, or delete it. Use the search box to find things fast.
- **👤 Clients tab** — tap **+** to add a client with phone, email, and unit
  number. Tap a client to call or email them with one tap.
- **📅 Calendar tab** — tap **+** to schedule a move-in, pickup, or meeting.
  Pick when you want to be reminded (e.g. 1 day before) — you'll get a
  popup on your phone *and* an email. These appointments also show up in
  the regular Google Calendar app under **"Storage Inventory - Clients"**.

Everything the app saves also lives in normal Google tools:

| In the app | Where Google keeps it |
|---|---|
| Inventory & clients | Google Sheets → spreadsheet named **Storage Inventory** |
| Photos | Google Drive → folder named **Storage Inventory Photos** |
| Appointments | Google Calendar → calendar named **Storage Inventory - Clients** |

So even if the app is ever unavailable, the data is plain spreadsheets,
folders, and calendars she already knows.

---

## Part 4 — Making changes later

When you improve the code (new features, fixes):

1. Open **https://script.google.com** → **Storage Inventory** project.
2. Paste in the updated `Code.gs` / `Index.html` and save.
3. Click **Deploy** → **Manage deployments** → ✏️ (pencil icon) →
   **Version: New version** → **Deploy**.

> ⚠️ Use **Manage deployments**, not "New deployment" — that way the app URL
> stays the same and the icon on her phone keeps working.

---

## Costs & limits (the honest fine print)

- **Monthly cost: $0.** Apps Script, Sheets, Drive, and Calendar are included
  with her Google Business account.
- Photos count against her Google Drive storage (Business accounts include
  a large amount; photos are automatically shrunk by the app before upload,
  roughly 150–400 KB each, so ~3,000 photos ≈ 1 GB).
- Google Sheets comfortably handles tens of thousands of inventory rows —
  far more than any storage business will need.
- Apps Script free quotas (e.g. 90 minutes of runtime per day) are enormous
  compared to what this app uses. One person using the app all day won't
  get close.

## Troubleshooting

| Problem | Fix |
|---|---|
| "Setup has not been run yet" error | Part 1, Step 4 — run `setup()` in the editor. |
| Blank page or "You need access" | She's signed into the wrong Google account in the browser. Sign out of other accounts or use a private window with the business account. |
| Photos don't show thumbnails | Make sure she's signed into the same Google account that owns the app (photos are private to that account). |
| Changed the code but the app looks the same | Redeploy via **Manage deployments** → **New version** (Part 4). |
| Want a second person to use it | Redeploy with access "Anyone within [organization]" (same Workspace), then share the spreadsheet/folder/calendar with that person too. |
