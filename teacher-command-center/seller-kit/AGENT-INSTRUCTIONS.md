# Autonomous Listing Instructions (paste into a browser-capable LLM agent)

Paste everything between the START/END markers into an LLM agent that can
control a web browser (e.g. Claude with computer use, or a browser-automation
agent). Before running it, make sure:

1. You are **already logged in** to etsy.com and/or payhip.com in the browser
   the agent controls (the agent must never handle your password or 2FA).
2. These files from this folder are on the machine the agent can upload from:
   - `dist/Teacher-Command-Center-2026-2027.zip` (the product file)
   - `seller-kit/listing-images/01-hero.png` … `10-start-here-guide.png`
3. Your Etsy shop is already open (Etsy charges a $0.20 USD listing fee when
   a listing is published — the agent is authorized to accept it).

---

## ===== START OF AGENT PROMPT =====

You are listing a finished digital product for sale on my behalf. I am the
owner of the product, the Etsy shop, and the Payhip account, and I authorize
you to create and publish these listings. Work autonomously, but obey the
GUARDRAILS section absolutely.

### GUARDRAILS

- You may publish the listings and accept Etsy's standard $0.20 listing fee.
- STOP and ask me before doing anything else that costs money (ads, Etsy Plus,
  shipping labels, promoted listings — decline all upsells).
- If you hit a login screen, CAPTCHA, 2FA prompt, or identity verification,
  STOP and ask me to complete it. Never enter or request my password.
- Do not change shop settings, bank/payment details, or any existing listing.
- Enter the text between the ``` fences EXACTLY as written, including emoji.
- If a field's UI has changed from these instructions, find the equivalent
  field by its purpose; if genuinely ambiguous, save as draft and ask me.
- When finished, reply with: the live listing URL(s), the price shown, and a
  screenshot of each published listing.

### PRODUCT FACTS (for any field not scripted below)

- Product type: instant digital download (ZIP). Nothing ships.
- Contents: 6 printable PDF teacher planners for the 2026–2027 school year
  (Special Education, High School Science, Elementary, Homeschool Parent,
  Substitute, New Teacher) + 2 auto-calculating Excel/Google Sheets workbooks
  + START-HERE guide + personal-use license.
- Who made it: I did (the shop owner). When made: 2026. It is not vintage,
  not a supply, not handmade-physical — choose the digital/download options.

---

### TASK 1 — ETSY

1. Go to https://www.etsy.com/your/shops/me/dashboard → **Listings** →
   **Add a listing** (or https://www.etsy.com/your/shops/me/listing-editor/create).
2. **Type of listing:** Digital files (instant download).
3. **Photos:** upload in this exact order (order controls the thumbnail):
   01-hero.png, 02-cover-special-ed.png, 03-important-dates-dashboard.png,
   04-weekly-planner-periods.png, 05-homeschool-multi-child-planner.png,
   06-year-at-a-glance.png, 07-grade-tracker.png, 08-first-week-checklist.png,
   09-sub-quick-sheet.png, 10-start-here-guide.png
4. **Title:**
```
2026-2027 Teacher Planner Bundle, Lesson Plan Gradebook Attendance Tracker, Google Sheets + PDF, Special Ed Homeschool Substitute New Teacher
```
5. **About this listing:** I made it / A finished product / 2026.
6. **Category:** search and pick the closest to
   "Paper & Party Supplies > Paper > Calendars & Planners" (a planner/calendar
   digital category is fine if Etsy suggests one).
7. **Description:** paste exactly:
```
⭐ THE 2026–2027 TEACHER COMMAND CENTER ⭐

Six complete planners in one download — because a special-ed caseload, a high-school lab schedule and a homeschool kitchen table do NOT need the same planner. Open the edition built for YOUR classroom:

🟣 SPECIAL EDUCATION — IEP-at-a-glance, service minutes log, progress monitoring data sheets, ABC behavior log, caseload & meeting tracker
🩵 HIGH SCHOOL SCIENCE — period-based planner, lab activity planner, equipment inventory, lab report rubric, safety contract checklist, standards tracker
🟠 ELEMENTARY — centers rotation planner, reading level tracker, weekly behavior charts, classroom jobs, party & volunteer sign-ups
🟢 HOMESCHOOL (MULTI-CHILD) — plan up to 4+ children side by side, state-ready instruction hours log, curriculum plans, portfolio & field trip logs
🔵 SUBSTITUTE — per-school quick sheets, assignment & pay tracker, sub day logs, go-bag checklist with no-prep filler activities
🩷 NEW TEACHER — first-week survival checklist, classroom setup checklist, mentor meeting logs, observation prep, PD hours log

EVERY EDITION ALSO INCLUDES (230+ pages total across the bundle):
✔ Weekly lesson planner (layout customized to each role)
✔ Grade tracker & attendance grids
✔ Student information sheets
✔ Parent contact log
✔ Classroom expense tracker (tax-time ready)
✔ 3-page substitute packet
✔ Important dates dashboard pre-loaded with 2026–27 US holidays
✔ Dated monthly calendars August 2026 – July 2027 + year at a glance

PLUS TWO DIGITAL WORKBOOKS (Google Sheets + Excel):
✔ Auto-calculating gradebook with letter grades
✔ One-tap attendance with automatic totals
✔ Expense tracker with category summaries
✔ Live dashboard: class average, absences, follow-ups needed
✔ Separate homeschool workbook with multi-child hours log

📱 WORKS EVERYWHERE — print at home (US Letter), annotate in GoodNotes/Notability on a tablet, or take attendance from your phone with the free Google Sheets app. Step-by-step import instructions included; setup takes 2 minutes.

📥 INSTANT DOWNLOAD — one ZIP file. No physical item ships. Personal-use license for one educator (message me for school/team licensing).

❓ Questions? Message me — I answer fast and I want your school year to be easy.
```
8. **Price:** 14.99 USD. **Quantity:** 999.
9. **Digital files:** upload `Teacher-Command-Center-2026-2027.zip`.
10. **Tags** (add all 13):
```
teacher planner 2027, lesson plan template, gradebook template, attendance tracker, homeschool planner, substitute teacher, special education, new teacher gift, google sheets planner, teacher printables, sub binder, parent contact log, digital gradebook
```
11. **Renewal:** Automatic. Decline any ads/promotion upsells.
12. **Publish**, accept the $0.20 listing fee, and capture the listing URL.

---

### TASK 2 — PAYHIP

1. Go to https://payhip.com/products → **Add New Product** → **Digital Product**.
2. **Product file:** upload `Teacher-Command-Center-2026-2027.zip`.
3. **Product name:**
```
2026–2027 Teacher Command Center — 6 Planner Editions + Google Sheets Gradebook (PDF & Spreadsheet Bundle)
```
4. **Price:** 14.99 USD.
5. **Description:** paste the same description used for Etsy (Task 1, step 7).
   If the editor supports formatting, bold the ALL-CAPS section headers.
6. **Cover/preview images:** upload 01-hero.png first, then images 02–10.
7. Leave VAT/tax handling at Payhip defaults (Payhip remits automatically).
   Do not enable affiliates, upsells, or subscriptions.
8. **Publish** the product and capture the public product URL
   (payhip.com/b/XXXX).

### FINAL REPORT

Reply with both live URLs, confirm the price displayed on each public page is
$14.99, confirm the Etsy listing shows "Digital download", and attach one
screenshot per listing.

## ===== END OF AGENT PROMPT =====
