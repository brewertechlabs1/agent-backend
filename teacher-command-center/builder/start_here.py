"""START-HERE guide PDF and license file that ship inside the buyer's download."""
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import white, HexColor
from .theme import PAGE_W, PAGE_H, MARGIN, CONTENT_W, INK, SCHOOL_YEAR
from .pdf_utils import start_page, section_label, bullets, para


class _NeutralTheme:
    accent = HexColor("#4a5fa5")
    accent_soft = HexColor("#e8ecf7")
    key = "start-here"
    title = "Start Here"
    subtitle = ""


def build_start_here(path):
    theme = _NeutralTheme()
    c = canvas.Canvas(path, pagesize=letter)
    c.setTitle(f"START HERE — Teacher Command Center {SCHOOL_YEAR}")

    # page 1 — welcome + what's inside
    y = start_page(c, theme, "START HERE — Welcome!",
                   f"Teacher Command Center • {SCHOOL_YEAR} school year")
    y -= 2
    y = para(c, MARGIN, y, CONTENT_W,
             "Thank you for your purchase! Everything works on a computer, tablet or phone — "
             "no special software needed. Here's what's in your download and how to get set "
             "up in under five minutes.", size=10.5, leading=15)
    y -= 8
    y = section_label(c, theme, MARGIN, y, "WHAT'S IN YOUR DOWNLOAD")
    y = bullets(c, MARGIN + 4, y, CONTENT_W - 8, [
        "1-Printable-Planners: six complete PDF planners, one for each type of educator — Special Education, High School Science, Elementary, Homeschool Parent, Substitute and New Teacher. Open the one that fits you (you get all six!). Each contains the weekly lesson planner, grade and attendance trackers, student info sheets, parent contact log, expense tracker, substitute packet, dated 2026–2027 calendars and specialty pages for that role.",
        "2-Spreadsheets: Teacher-Command-Center-2026-2027.xlsx — a digital workbook with an auto-calculating gradebook, attendance counter, expense totals and a live dashboard. Homeschool families also get Homeschool-Command-Center-2026-2027.xlsx built for multiple children with an instruction-hours log.",
        "LICENSE.txt: your personal-use license.",
    ], size=10, leading=14, bold_head=False)
    y -= 8
    y = section_label(c, theme, MARGIN, y, "FASTEST START (3 STEPS)")
    y = bullets(c, MARGIN + 4, y, CONTENT_W - 8, [
        "1. Open the PDF planner for your role and print (or send to a print shop for spiral binding).",
        "2. Fill in the Important Dates Dashboard from your district or family calendar.",
        "3. Upload the spreadsheet to Google Sheets (steps on page 2) or open it in Excel.",
    ], size=10.5, leading=15)
    c.showPage()

    # page 2 — google sheets + phone
    y = start_page(c, theme, "Using the Spreadsheets", "Google Sheets, Excel, phone and tablet")
    y = section_label(c, theme, MARGIN, y, "IMPORT INTO GOOGLE SHEETS (FREE)")
    y = bullets(c, MARGIN + 4, y, CONTENT_W - 8, [
        "1. Go to drive.google.com and sign in (any free Google account works).",
        "2. Click  New → File upload  and choose Teacher-Command-Center-2026-2027.xlsx from your download.",
        "3. Double-click the uploaded file to open it, then click  File → Save as Google Sheets.",
        "4. That's it — every formula, dropdown and the dashboard work in Google Sheets.",
    ], size=10.5, leading=16)
    y -= 6
    y = section_label(c, theme, MARGIN, y, "USE IT ON YOUR PHONE")
    y = bullets(c, MARGIN + 4, y, CONTENT_W - 8, [
        "Spreadsheets: install the free Google Sheets app (or Excel app) — your workbook syncs automatically once imported. Take attendance from your phone in seconds.",
        "PDF planners: open the PDF in GoodNotes, Notability, Xodo or your phone's built-in PDF viewer and annotate directly. On iPhone, Files + Markup works out of the box.",
    ], size=10.5, leading=16)
    y -= 6
    y = section_label(c, theme, MARGIN, y, "HOW THE WORKBOOK TABS CONNECT")
    y = bullets(c, MARGIN + 4, y, CONTENT_W - 8, [
        "Type your class roster once in the Students tab — names flow automatically into the Gradebook and Attendance tabs.",
        "Gradebook: enter the points possible in the top row, then scores below. Averages and letter grades calculate themselves.",
        "Attendance: type P, A, T or E under each date column — totals count automatically.",
        "Dashboard: live totals from every tab. Don't type into the shaded cells.",
        "Teaching multiple classes? Right-click the Gradebook tab → Duplicate, one copy per period.",
    ], size=10.5, leading=16)
    y -= 6
    y = section_label(c, theme, MARGIN, y, "NEED HELP?")
    para(c, MARGIN + 4, y, CONTENT_W - 8,
         "Reply to your order message on the shop where you purchased this and we'll get you sorted. "
         "Happy planning — have a wonderful 2026–2027 school year!",
         size=10.5, leading=15)
    c.showPage()
    c.save()
    return path


LICENSE_TEXT = """TEACHER COMMAND CENTER 2026-2027 — LICENSE

PERSONAL USE LICENSE

You MAY:
- Print unlimited copies for your own classroom, homeschool or tutoring practice
- Use the files on all of your own devices (computer, tablet, phone)
- Make copies of individual pages for your own students and their families
  (e.g. behavior charts, sign-up sheets, student info forms)

You may NOT:
- Resell, redistribute or share the files themselves, in whole or in part
- Upload the files to shared drives, school-wide servers or websites
- Claim the design as your own or use it to create products for sale

One purchase = one educator. Buying for a team or a whole school?
Contact the seller for an affordable multi-user license.

Thank you for supporting a small business!
"""
