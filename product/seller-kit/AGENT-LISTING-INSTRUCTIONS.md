# Autonomous Listing Instructions (for an LLM agent with browser control)

You are an agent tasked with publishing ONE digital product to Etsy and Payhip
on behalf of the shop owner. Follow these instructions exactly. Do not
improvise new copy, prices, or files beyond what is specified here.

---

## 0 · Assets and final copy (single source of truth)

| Field | Value |
|---|---|
| Product file to upload | `dist/Celebration-of-Life-Bundle.zip` (~35 KB, well under Etsy's 20 MB limit) |
| Listing images | `product/seller-kit/listing-images/` (PNG, 2× resolution) |
| Price | **$19.99 USD** (both platforms) |
| Optional launch promo | 25% off sale → $14.99 (Etsy: Marketing → Sales & discounts; Payhip: coupon `COMFORT25`) |
| Quantity (Etsy) | 999 |

**TITLE (both platforms, 139 chars):**

```
Funeral Program Template Bundle | Celebration of Life Kit, Edit on Phone, No Canva | Obituary Help, Prayer Cards, Welcome Sign, 7 Themes
```

**IMAGE ORDER (Etsy allows 10 — use these, in this order):**
1. `program-cover-christian.png` (hero)
2. `app-interface.png`
3. `program-cover-mother.png`
4. `program-cover-military.png`
5. `program-cover-cardinal.png`
6. `program-cover-beach.png`
7. `program-inside-christian.png`
8. `prayer-cards-front.png`
9. `invitation.png`
10. `welcome-sign.png`

(Payhip: use image 1 as the product cover; add the rest to the gallery if the
plan allows.)

**ETSY TAGS (exactly these 13):**
`funeral program`, `celebration of life`, `memorial service`, `funeral template`,
`obituary template`, `prayer card`, `funeral welcome sign`, `memorial program`,
`funeral bundle`, `editable program`, `memorial slideshow`, `funeral printable`,
`cardinal memorial`

**DESCRIPTION (paste verbatim on both platforms):**

```
When you're grieving, the last thing you need is a fight with design software.

This bundle opens right in your web browser — on a computer, tablet, or even
your phone. Nothing to install, no Canva or Word needed, works without
internet. Type your loved one's details once, and every document fills itself
in, beautifully.

YOU RECEIVE ALL 8 DOCUMENTS:
• Funeral program — classic 4-page (single fold, letter size)
• Funeral program — extended 8-page booklet with photo page
• Memorial invitation (two 7x5" cards per sheet, fits A7 envelopes)
• Social media announcement (perfect square image for Facebook/Instagram)
• Welcome sign (letter size, or enlarge to 18x24" at any print shop)
• Prayer / keepsake cards (6 per sheet, front & back)
• Photo collage memory page
• Photo slideshow that plays full-screen at the service

IN 7 HEARTFELT THEMES — switch anytime with one click:
Christian Memorial · Military Veteran · Mother/Grandmother
Father/Grandfather · Church Funeral · Red Cardinal · Beach & Nature

ALSO INCLUDED:
• Obituary Writing Prompts — a gentle worksheet that helps you write a loving
  obituary in about 30 minutes, even starting from a blank page
• Step-by-step printing instructions (home printer AND FedEx/Staples/UPS)
• Quick-start guide — most families print their first program within the hour
• 9 public-domain poems & scriptures built in (Psalm 23, Crossing the Bar,
  Death Is Nothing at All, and more) — or paste your own

WHY FAMILIES LOVE IT
✔ Works on your phone — start wherever you are
✔ Type once — the name, dates, photos and obituary flow into every document
✔ Completely private — nothing is uploaded anywhere, ever
✔ Long obituary? The text automatically sizes itself to fit the page
✔ Unlimited use — yours to keep for every service your family ever needs

HOW IT WORKS
1. Download the ZIP and open it (tap on phone, double-click on computer)
2. Open START-HERE.html and click "Start Creating"
3. Pick your theme, type the details, add photos
4. Print at home or save PDFs for any print shop

Instant download · Letter size (8.5x11") · Personal or single-business use.
Due to the digital nature of this item, all sales are final — but message me
anytime and I'll personally help you get printed.
```

---

## 1 · Ground rules (read before touching anything)

1. **Never publish silently.** Create the listing as a **draft** first, verify
   every field against section 0, then publish. If the platform has no draft
   mode for some step, stop and report instead of guessing.
2. **Scope**: you may only create this one listing per platform. Do not edit,
   delete, or touch any other listing, product, shop setting, payment setting,
   or account setting.
3. **Credentials**: the owner must already be logged in (or provide login).
   You will encounter 2FA/CAPTCHA — pause and ask the owner to complete it;
   never attempt to bypass it.
4. **If a field's UI doesn't match these instructions** (platforms change),
   find the equivalent field by its meaning. If genuinely ambiguous, leave the
   listing in draft and report what you found.
5. **Money**: price is $19.99. Do not enable ads, promoted listings, shipping
   profiles, or any paid feature.
6. On completion, report: the listing URL(s), the state (draft/published),
   and a screenshot of each final listing.

---

## 2 · Etsy (www.etsy.com)

Precondition: the owner has an open Etsy shop. If the Shop Manager is not
reachable (no shop exists), STOP and report — do not create a shop.

1. Go to **etsy.com → Shop Manager → Listings → Add a listing**.
2. **Photos**: upload the 10 images from section 0 in the given order
   (first = thumbnail). Skip video.
3. **Listing details**:
   - Title: paste the TITLE exactly.
   - About this listing: **Who made it?** → "I did" · **What is it?** → "A
     finished product" · **When did you make it?** → "2025" (or nearest offered).
   - Category: search and select **"Templates"** (under Paper & Party Supplies
     → Paper); if Etsy suggests "Funeral Programs" or "Memorial Programs"
     as a more specific category, choose that.
   - Renewal options: **Automatic**.
   - Type: **Digital files** (this is critical — not physical).
4. **Description**: paste the DESCRIPTION exactly.
5. **Tags**: add the 13 TAGS exactly as listed. **Materials**: leave empty.
6. **Price**: 19.99 · **Quantity**: 999.
7. **Digital files**: upload `Celebration-of-Life-Bundle.zip`.
8. **Personalization**: off.
9. Save as **draft**. Re-open the draft preview and verify: title, price,
   file attached, 10 photos, digital type, 13 tags.
10. Publish. (Etsy charges a $0.20 listing fee — this is expected; accept it.)
11. Record the live URL (share icon on the listing) for the final report.

## 3 · Payhip (payhip.com)

1. Log in → **Products → Add new product → Digital product**.
2. **Product file**: upload `Celebration-of-Life-Bundle.zip`.
3. **Name**: paste the TITLE (Payhip allows the full title; if a length limit
   is hit, truncate at the last full word before the limit).
4. **Price**: 19.99 USD.
5. **Description**: paste the DESCRIPTION. Payhip supports basic rich text —
   keep the plain text as-is; bolding the section headings is allowed, no
   other formatting changes.
6. **Cover image**: `program-cover-christian.png`. If a gallery is available,
   add the remaining images in the section-0 order.
7. **Product URL / permalink**: set to `celebration-of-life-bundle` if free.
8. Leave OFF: pay-what-you-want, subscriptions, license keys, affiliates,
   upgrade prompts.
9. Save as **draft**, verify all fields, then click **Publish**.
10. Optional (only if the owner asked for the launch promo): create coupon
    `COMFORT25`, 25% off, this product only, no expiry.
11. Record the public product URL for the final report.

## 4 · Final report template

```
ETSY:   [url] — published ✓ (or: draft, blocked on: …)
PAYHIP: [url] — published ✓ (or: draft, blocked on: …)
Price both: $19.99 · File: Celebration-of-Life-Bundle.zip · Images: 10/10, cover set
Screenshots attached.
```
