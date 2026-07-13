# LeadFlow Pro — Listing Kit (Etsy + Payhip)

Everything needed to list `dist/LeadFlow-Pro-v1.0.zip` for sale. Hand the
"AGENT INSTRUCTIONS" section to an autonomous browser agent, or follow it
yourself. Seller-only file — not included in the buyer ZIP.

---

## Price

**$67 one-time.** Optional launch promo: sale/coupon down to **$47**
(keep the $67 base price). Rationale: comparable SaaS (GoHighLevel, Keap,
Podium) costs $97–$300 **per month** — the description leans on that
comparison. Net after fees at $67: ~$60 on Etsy (~9.5% + $0.20 listing fee),
~$63 on Payhip free plan (5%). Keep both platforms at the same price.

## Titles

**Etsy** (≤140 characters):

> Automated Lead Follow Up & Appointment Booking System for Small Business, Instant Lead Response Email Software, One Time Purchase Download

**Payhip:**

> LeadFlow Pro — Automated Lead Capture, Instant Follow-Up & Appointment Booking for Small Business (One-Time Purchase, No Monthly Fees)

## Description (both platforms, paste verbatim)

**Never lose another lead.** Businesses that respond within 5 minutes are up to 21x more likely to win the sale — but you're busy working. LeadFlow Pro answers every lead in seconds, follows up for days, and books the appointment for you.

⚡ INSTANT RESPONSE — every lead gets a friendly reply within seconds, 24/7, with your booking link
📨 AUTOMATED FOLLOW-UP — emails at 1, 3 and 7 days until they book (fully editable templates)
📅 SELF-SERVE BOOKING — customers pick a time; confirmations, calendar invites and 24-hour reminders are automatic
🔔 HOT-LEAD ALERTS — you get an email the moment a lead arrives or books, so you can call while they're hot
♻️ OLD-LEAD REVIVAL — import your old customer list (CSV) and launch a win-back campaign in one click
📊 SIMPLE DASHBOARD — pipeline, notes, search, CSV export, all in your browser, password protected

**Unlike the monthly-fee apps:**
✔ One-time purchase — no subscription, ever
✔ Runs on YOUR computer — your customer list never leaves your machine
✔ Works with the email you already have (Gmail, Outlook, Yahoo, Zoho…)
✔ 10-minute setup, no technical skills — double-click to start, a wizard does the rest

**WHAT YOU GET (instant download, one ZIP file):** the LeadFlow Pro app for Windows, Mac and Linux, one-click launchers, an illustrated quick-start guide, and a single-business license.

**REQUIREMENTS:** a Windows, Mac or Linux computer and Node.js (free from nodejs.org — the guide walks you through installing it in 2 minutes). To send email, any ordinary email account. To show the form on a public website, the guide explains free options.

This is a digital download — no physical item ships. Due to the nature of digital products, all sales are final, but message me with any setup question and I'll get you running.

## Etsy tags (exactly 13, each ≤20 characters)

`lead generation` · `small business tool` · `crm software` · `email automation` · `appointment booking` · `follow up system` · `booking software` · `digital download` · `lead management` · `sales funnel` · `business software` · `client booking` · `marketing tool`

---

# AGENT INSTRUCTIONS

**Operator notes before dispatching an agent:** both platforms gate logins
behind CAPTCHAs/2FA and require at least one listing image, and Etsy
requires an already-onboarded shop with billing on file — so expect to
answer a few pauses the first run. Provide credentials at runtime through a
secure channel (password manager / secure input), never inside the prompt.

```
# TASK: Publish the digital product "LeadFlow Pro" on Etsy and Payhip

You are an autonomous browser agent. Complete both listings, verify them
live, and report back the two public URLs. Follow every rule in GUARDRAILS.

## ASSETS
- Product file: LeadFlow-Pro-v1.0.zip
  Source: the `dist/` folder of the GitHub repo brewertechlabs1/agent-backend,
  branch `claude/automated-lead-generation-biqa4t` (or the local copy the
  operator provides). Download it to the local machine before starting.
- Cover images: use the image files the operator provides. If none are
  provided, STOP and ask — both platforms require at least one image.
  (Recommended: 2000×2000px, bold text "Automated Lead Follow-Up System",
  subtext "Instant response • Booking • No monthly fees".)
- Title, description, tags, price: use the LISTING COPY sections of this
  document verbatim.

## PART A — PAYHIP (do this first; simpler, no listing fee)
1. Go to https://payhip.com/login and sign in with operator-supplied
   credentials. If CAPTCHA or a verification code appears, pause and ask
   the operator; never guess codes.
2. Dashboard → Products → "Add New Product" → choose "Digital Product".
3. Upload LeadFlow-Pro-v1.0.zip as the product file. Wait until upload
   completes (file ~50 KB, should be instant).
4. Product name: the Payhip title. Price: 67.00 USD.
5. Description: paste the description. Preserve line breaks and emoji.
6. Upload the cover image.
7. Leave "Pay what you want" OFF. Leave stock/limit empty (unlimited).
8. Save/Publish. Open the public product URL in a fresh tab (logged-out
   context if possible) and confirm: title, price $67, Buy Now button, and
   that the file is attached. Screenshot it.
9. Record the public URL.

## PART B — ETSY
Preconditions: the Etsy shop must already exist with billing set up. If the
account lands in shop-onboarding instead of Shop Manager, STOP and report.
1. Go to https://www.etsy.com/your/shops/me/dashboard and sign in. Same
   rule: pause for the operator on CAPTCHA/2FA.
2. Shop Manager → Listings → "Add a listing".
3. Photos: upload the cover image(s) (first image = thumbnail). Skip video.
4. Listing details:
   - Title: the Etsy title (must be ≤140 chars — if the form rejects it,
     trim from the end, never the beginning).
   - About: "Who made it?" → I did. "What is it?" → A finished product.
     "When was it made?" → the most recent year offered.
   - Category: type "software" and choose the closest suggested category
     (accept Etsy's top suggestion for digital software/templates).
   - Type: select "Digital files" (NOT physical). This must be set before
     saving or the file-upload section won't appear.
5. Description: paste the description verbatim.
6. Personalization: off. Materials: leave empty.
7. Tags: enter the 13 tags exactly as listed, one at a time. Each is ≤20
   characters; if one is rejected, skip it rather than inventing a new one.
8. Inventory & pricing: Price 67.00 USD, Quantity 999.
9. Digital files: upload LeadFlow-Pro-v1.0.zip (limit is 5 files / 20 MB —
   this single file is well under).
10. Renewal options: Automatic.
11. Click "Publish". Etsy charges a $0.20 listing fee to the shop's payment
    method — this is expected; do not add any other paid upgrades or ads.
12. Open the public listing URL logged-out, confirm it shows "Digital
    download", price $67, and the description. Screenshot it.
13. Record the public URL.

## GUARDRAILS
- Never enter payment card numbers, change payout/bank settings, buy ads,
  or purchase anything except the unavoidable $0.20 Etsy listing fee.
- Never store or echo credentials, verification codes, or session cookies
  in your output or logs.
- Pause and ask the operator for: CAPTCHAs, 2FA codes, unexpected identity
  checks, any fee other than $0.20, or any form field these instructions
  don't cover.
- Make at most 2 retry attempts per step, then report the blocker instead
  of improvising.
- FINAL REPORT must contain: both public URLs, both screenshots, the exact
  price shown, and anything you had to skip or change.
```
