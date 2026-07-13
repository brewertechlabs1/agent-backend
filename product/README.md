# Celebration of Life Template Bundle — product source

A complete digital-download product ready to sell on **Etsy** or **Payhip**.

## What's here

```
product/
├── bundle/                          ← everything the BUYER receives (contents of the ZIP)
│   ├── START-HERE.html              ← buyer's landing page (open first)
│   ├── Celebration-of-Life-Studio.html  ← the app: 8 documents × 7 themes, works offline
│   ├── LICENSE.txt                  ← buyer license (personal / single business)
│   └── guides/
│       ├── Quick-Start-Guide.html
│       ├── Obituary-Writing-Prompts.html
│       └── Printing-Instructions.html
├── seller-kit/
│   └── Etsy-Payhip-Listing-Kit.md   ← titles, tags, description, pricing, photo plan
└── build-zip.sh                     ← rebuilds dist/Celebration-of-Life-Bundle.zip

dist/
└── Celebration-of-Life-Bundle.zip   ← THE FILE YOU UPLOAD to Etsy / Payhip
```

## To list the product (3 steps)

1. Upload `dist/Celebration-of-Life-Bundle.zip` as the digital download.
2. Copy a title, tags, and the description from `seller-kit/Etsy-Payhip-Listing-Kit.md`.
3. For listing photos: open the Studio, click **See an Example**, and screenshot
   each theme/document.

## The product itself

The Studio is a single self-contained HTML file — no server, no dependencies, no
internet needed. Buyers open it in any browser (Windows, Mac, iPhone, Android),
type the details once, and generate:

- 4-page funeral program (single-fold, letter)
- 8-page funeral program (booklet, pages auto-imposed for double-sided printing)
- Memorial invitation (two 7×5″ per sheet)
- Social-media announcement (downloads a 1080×1080 PNG)
- Welcome sign (letter, or enlarge to 18×24″ at a print shop)
- Prayer cards (6-up, front & back)
- Photo collage page
- Full-screen photo slideshow for the service

Themes: Christian Memorial, Military Veteran, Mother/Grandmother,
Father/Grandfather, Church Funeral, Red Cardinal, Beach/Nature.

Data autosaves to the device (localStorage) with JSON export/import for backups.
Photos are downscaled client-side; nothing is ever transmitted.

## Editing / rebuilding

Edit files under `bundle/`, then run:

```bash
./product/build-zip.sh
```

and re-upload the new ZIP to Etsy/Payhip (buyers automatically get the latest files).
