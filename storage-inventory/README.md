# Storage Inventory App

A mobile-friendly storage unit inventory management system that runs entirely
on **Google Apps Script** — no hosting, no servers, **$0/month**.

## Why this architecture

| Requirement | How it's met |
|---|---|
| Runs without being run locally | Deployed as a Google Apps Script **web app** — hosted by Google, always on |
| Google Drive for images | Photos taken on the phone upload straight to a Drive folder |
| Google Sheets for inventory | All inventory + client data lives in a normal spreadsheet she can also open directly |
| Uses her Google Business account | Everything is created under and owned by her account; nothing leaves it |
| Calendar for clients + reminders | Dedicated Google Calendar with popup **and** email reminders per appointment |
| Very user friendly | Phone-first UI: big buttons, bottom tabs, camera capture, search, add-to-home-screen icon |
| Cost effective | Apps Script, Sheets, Drive, Calendar are all included with her account — zero monthly fees |
| Features added later | Plain HTML/JS frontend + simple `.gs` backend functions; redeploying keeps the same app URL |

## What's here

```
storage-inventory/
├── SETUP.md                  ← step-by-step setup instructions (start here)
└── apps-script/
    ├── Code.gs               ← backend: Sheets/Drive/Calendar logic + one-time setup()
    ├── Index.html            ← the app UI (single file, no build step)
    └── appsscript.json       ← optional project manifest (timezone, web app defaults)
```

## Features

- **Inventory**: add/edit/delete items with name, description, category,
  unit/location, quantity, value, status (In Storage / Removed / Sold /
  Donated), notes, and multiple photos. Search across everything.
  Dashboard tiles show item count and total value.
- **Photos**: taken with the phone camera, auto-compressed in the browser
  (max 1280px) before upload, stored in a dedicated Drive folder. Deleting
  an item moves its photos to Drive trash (recoverable for 30 days).
- **Clients**: name, phone (tap-to-call), email (tap-to-email), unit,
  move-in date, notes.
- **Calendar**: schedule appointments with duration and a reminder
  (30 min – 2 days before) as phone popup and/or email. Appointments also
  appear in the normal Google Calendar app.

## Setup

Follow **[SETUP.md](SETUP.md)** — about 15 minutes, done once, on a computer.
The `setup()` function creates the spreadsheet, Drive folder, and calendar
automatically; there are no IDs or config files to manage by hand.
