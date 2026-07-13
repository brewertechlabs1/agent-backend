# Teacher Command Center 2026–2027 — Digital Product

A complete, sellable digital download for teachers, homeschool parents and
substitutes, ready to list on **Payhip** or **Etsy**.

## What the buyer gets (the ZIP)

```
Teacher-Command-Center-2026-2027.zip
├── START-HERE.pdf                     ← buyer quick-start (print, phone, Google Sheets import)
├── LICENSE.txt                        ← personal-use license
├── 1-Printable-Planners/              ← six role-specific planners, ~36–40 pages each
│   ├── Special-Education-Teacher-Edition-2026-2027.pdf
│   ├── High-School-Science-Teacher-Edition-2026-2027.pdf
│   ├── Elementary-Teacher-Edition-2026-2027.pdf
│   ├── Homeschool-Parent-Edition-2026-2027.pdf
│   ├── Substitute-Teacher-Edition-2026-2027.pdf
│   └── New-Teacher-Edition-2026-2027.pdf
└── 2-Spreadsheets/
    ├── Teacher-Command-Center-2026-2027.xlsx     ← auto gradebook, attendance, expenses, dashboard
    └── Homeschool-Command-Center-2026-2027.xlsx  ← multi-child planner + hours log
```

Every planner edition contains the weekly lesson planner (layout customized
per role), grade tracker, attendance grids, student info sheets, parent
contact log, expense tracker, substitute packet, an important-dates
dashboard pre-loaded with computed 2026–27 US holidays, dated monthly
calendars (Aug 2026 – Jul 2027), a year-at-a-glance, and 5–7 specialty
pages unique to that role.

The spreadsheets use only formulas that work identically in Excel and
Google Sheets (SUM, COUNTIF, SUMIF, SUMPRODUCT, IFERROR), so a plain
Drive upload → "Save as Google Sheets" gives buyers a fully working
digital gradebook on any computer or phone.

## Selling it

Everything you need is in [`seller-kit/`](seller-kit/):

- `ETSY-LISTING.md` — title, 13 tags, description, pricing and photo tips
- `PAYHIP-LISTING.md` — name, summary, description and setup steps

Upload `dist/Teacher-Command-Center-2026-2027.zip` as the digital file on
either platform. It is ~0.3 MB — far under Etsy's 20 MB per-file limit.

## Rebuilding / customizing

```bash
pip install reportlab openpyxl
python3 build.py
```

Output lands in `dist/`. To customize:

- **Colors / persona names** — `builder/theme.py`
- **Pages shared by all editions** — `builder/core_pages.py`
- **Role-specific pages** — `builder/persona_pages.py`
- **Which pages go in which edition** — `builder/editions.py`
- **Spreadsheets** — `builder/xlsx_build.py`
- **Buyer quick-start + license** — `builder/start_here.py`

For a 2027–2028 refresh, change `SCHOOL_YEAR` and `YEAR_MONTHS` in
`builder/theme.py`; holidays are computed automatically for the new year.
