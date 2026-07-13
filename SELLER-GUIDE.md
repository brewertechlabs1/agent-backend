# Seller Guide — packaging & listing LeadFlow Pro on Payhip / Etsy

This repo contains **LeadFlow Pro** (in `leadflow/`), a complete digital
product you can sell as a downloadable ZIP. This file is for **you, the
seller** — it is *not* included in the buyer's download.

## 1. Build the sellable ZIP

```bash
./package-for-sale.sh
```

This produces `dist/LeadFlow-Pro-v1.0.zip` (buyer-ready: app, launchers,
quick-start guide, license — no dev files, no `data/` folder). Upload that
single ZIP to Payhip or Etsy as the digital file.

Before each release, bump the version in `package-for-sale.sh` and
`leadflow/app/package.json`.

## 2. Platform notes

**Payhip:** create a Digital Product, upload the ZIP directly (Payhip
delivers the file itself). No size issues (~50 KB).

**Etsy:** create a listing, choose "Digital files", upload the ZIP (Etsy
allows up to 5 files, 20 MB each — this is one small file). Etsy requires
you to state it's an instant download and that no physical item ships.

## 3. Suggested listing copy

**Title:**
> Automated Lead Follow-Up & Appointment Booking System for Small Business — Instant Lead Response Software, No Monthly Fees, Windows & Mac

**Price guidance:** $47–$149 one-time. Comparable SaaS (GoHighLevel,
Keap, Podium) charges $97–$300 *per month* — lead with that comparison.

**Description:**

> **Never lose another lead.** Businesses that respond to a lead within 5
> minutes are up to 21x more likely to win the sale — but most owners are
> busy working. LeadFlow Pro answers every lead in seconds, follows up for
> days, and books the appointment for you.
>
> ⚡ INSTANT RESPONSE — every lead gets a friendly reply within seconds, 24/7
> 📨 AUTOMATED FOLLOW-UP — emails at 1, 3 and 7 days until they book (fully editable)
> 📅 SELF-SERVE BOOKING — customers pick a time; confirmations, calendar invites and 24-hour reminders are automatic
> 🔔 HOT-LEAD ALERTS — you get an email the moment a lead arrives or books
> ♻️ OLD-LEAD REVIVAL — import your old customer list and launch a win-back campaign in one click
> 📊 SIMPLE DASHBOARD — pipeline, notes, CSV export, all in your browser
>
> **Unlike the monthly-fee apps:**
> ✔ One-time purchase — no subscription, ever
> ✔ Runs on YOUR computer — your customer list never leaves your machine
> ✔ Works with the email you already have (Gmail, Outlook, Yahoo, Zoho…)
> ✔ 10-minute setup, no technical skills needed
>
> **What you get (instant download):** the LeadFlow Pro app for Windows,
> Mac and Linux, one-click launchers, an illustrated quick-start guide, and
> a single-business license.
>
> **Requirements:** a Windows/Mac/Linux computer and Node.js (free, from
> nodejs.org — the guide walks you through it in 2 minutes). To send email,
> any ordinary email account.

**Tags (Etsy):** small business tools, lead generation, crm software,
appointment scheduler, email automation, follow up system, digital download,
booking system, sales funnel, customer management

## 4. Support answers you'll need

- *"Is there a monthly fee?"* No — one-time purchase, runs locally.
- *"Does it work on a website?"* Yes — share the form link or paste the
  iframe embed. For public-internet forms, the guide explains using a free
  tunnel (Cloudflare Tunnel/ngrok) or running it on a cheap VPS.
- *"Do I need to keep the computer on?"* Automation runs while the app is
  open; the guide shows how to auto-start it with the computer.
- *"Refunds?"* Etsy digital downloads are generally non-refundable — state
  your policy in the listing.

## 5. Developing / testing locally

```bash
cd leadflow && node app/server.js        # dashboard at http://localhost:4321
LEADFLOW_DATA=/tmp/lf-test PORT=4500 node app/server.js   # sandboxed test run
```

No dependencies, no build step. All state is in the `data/` folder
(`LEADFLOW_DATA` overrides its location). With no SMTP configured the app
runs in demo mode and writes outgoing email to `data/outbox/*.eml`.
