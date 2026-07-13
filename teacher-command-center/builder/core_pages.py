"""Pages included in every edition of the Teacher Command Center."""
import calendar
from datetime import date
from reportlab.lib.colors import white
from .theme import PAGE_W, PAGE_H, MARGIN, CONTENT_W, INK, FAINT, RULE, PAPER_TINT, SCHOOL_YEAR, YEAR_MONTHS
from .pdf_utils import (start_page, footer, label_line, checkbox, section_label,
                        table, note_lines, para, bullets)

calendar.setfirstweekday(calendar.SUNDAY)


def _nth_weekday(year, month, weekday, n):
    """n-th (1-based) weekday of a month; n=-1 for last."""
    days = [d for d in calendar.Calendar().itermonthdates(year, month)
            if d.month == month and d.weekday() == weekday]
    return days[n - 1] if n > 0 else days[-1]


def us_holidays():
    """Major US holidays that fall inside the 2026–27 school year, computed."""
    h = []
    h.append(("Labor Day", _nth_weekday(2026, 9, 0, 1)))
    h.append(("Indigenous Peoples' Day / Columbus Day", _nth_weekday(2026, 10, 0, 2)))
    h.append(("Halloween", date(2026, 10, 31)))
    h.append(("Veterans Day", date(2026, 11, 11)))
    h.append(("Thanksgiving", _nth_weekday(2026, 11, 3, 4)))
    h.append(("Christmas Day", date(2026, 12, 25)))
    h.append(("New Year's Day", date(2027, 1, 1)))
    h.append(("Martin Luther King Jr. Day", _nth_weekday(2027, 1, 0, 3)))
    h.append(("Valentine's Day", date(2027, 2, 14)))
    h.append(("Presidents' Day", _nth_weekday(2027, 2, 0, 3)))
    h.append(("Memorial Day", _nth_weekday(2027, 5, 0, -1)))
    h.append(("Juneteenth", date(2027, 6, 19)))
    h.append(("Independence Day", date(2027, 7, 4)))
    return h


HOLIDAY_BY_DATE = {d: name for name, d in us_holidays()}


# ---------------------------------------------------------------- cover
def cover(c, theme):
    c.setFillColor(theme.accent_soft)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    c.setFillColor(theme.accent)
    c.rect(0, PAGE_H - 220, PAGE_W, 220, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 15)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 90, SCHOOL_YEAR + "  SCHOOL YEAR")
    c.setFont("Helvetica-Bold", 34)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 135, "Teacher Command Center")
    c.setFont("Helvetica", 13)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 165, "Plan the year. Track everything. Stay ready.")

    # persona plate
    c.setFillColor(white)
    c.roundRect(MARGIN + 40, PAGE_H - 330, CONTENT_W - 80, 78, 10, stroke=0, fill=1)
    c.setFillColor(theme.accent)
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 292, theme.title.upper() + " EDITION")
    c.setFillColor(INK)
    c.setFont("Helvetica", 10.5)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 315, theme.subtitle)

    items = ["Weekly lesson planner", "Grade + attendance trackers",
             "Student information sheets", "Parent contact log",
             "Classroom expense tracker", "Substitute-teacher packet",
             "Important dates dashboard", "Dated monthly calendars"]
    y = PAGE_H - 400
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(theme.accent)
    c.drawCentredString(PAGE_W / 2, y, "INSIDE THIS PLANNER")
    y -= 26
    col_x = [MARGIN + 90, PAGE_W / 2 + 30]
    for i, item in enumerate(items):
        x = col_x[i % 2]
        yy = y - (i // 2) * 26
        c.setFillColor(theme.accent)
        c.circle(x - 10, yy + 3, 3, stroke=0, fill=1)
        c.setFillColor(INK)
        c.setFont("Helvetica", 11)
        c.drawString(x, yy, item)
    yy = y - 4 * 26 - 30
    c.setFillColor(theme.accent)
    c.roundRect(MARGIN + 40, yy - 46, CONTENT_W - 80, 54, 8, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 11)
    label = "Teacher" if theme.key != "Homeschool-Parent" else "Family"
    c.drawString(MARGIN + 60, yy - 15, f"{label}:")
    c.drawString(MARGIN + 60, yy - 35, "School / Room:" if theme.key != "Homeschool-Parent" else "Homeschool name:")
    c.setStrokeColor(white)
    c.setLineWidth(1)
    c.line(MARGIN + 150, yy - 17, PAGE_W - MARGIN - 60, yy - 17)
    c.line(MARGIN + 170, yy - 37, PAGE_W - MARGIN - 60, yy - 37)
    footer(c, theme)
    c.showPage()


def how_to_use(c, theme):
    y = start_page(c, theme, "How to Use This Planner", "Two-minute setup")
    y -= 8
    y = bullets(c, MARGIN + 4, y, CONTENT_W - 8, [
        "Print what you need: every page is US Letter (8.5 × 11 in). Print single pages as many times as you like — the weekly planner and trackers are designed to be reprinted all year.",
        "Or go digital: open this PDF in GoodNotes, Notability, Xodo or any PDF annotation app on a tablet or phone and write directly on the pages.",
        "Spreadsheet users: the download also includes an Excel/Google Sheets workbook with a working gradebook, attendance counter and expense totals. Import steps are in the START-HERE guide.",
        "Start with the Important Dates Dashboard: copy your district calendar, grading periods and testing windows in first — everything else hangs off those dates.",
        "Build your Substitute Packet now, not the night you are sick: fill in the sub packet pages during the first week of school and leave them in a labeled folder on your desk.",
        "Reprint monthly: attendance grids and parent-contact logs work best printed fresh each month.",
    ], size=10.5, leading=16)
    y -= 10
    y = section_label(c, theme, MARGIN + 4, y, "PRINTING TIPS")
    y = bullets(c, MARGIN + 4, y, CONTENT_W - 8, [
        "Set your printer to “Actual size” (not “Fit to page”) so the lines stay crisp.",
        "Grayscale printing works — every page was designed to stay readable in black and white.",
        "For a binder: print single-sided and use a 3-hole punch; margins leave room on the left.",
    ], size=10.5, leading=16)
    c.showPage()


# ------------------------------------------------------- year at a glance
def year_at_a_glance(c, theme):
    y_top = start_page(c, theme, f"Year at a Glance  •  {SCHOOL_YEAR}",
                       "August 2026 – July 2027 • shaded dates are major US holidays")
    cell_w, cell_h = (CONTENT_W - 24) / 3, 148
    for idx, (yr, mo) in enumerate(YEAR_MONTHS):
        col, row = idx % 3, idx // 3
        x = MARGIN + col * (cell_w + 12)
        y = y_top - 6 - row * (cell_h + 10)
        _mini_month(c, theme, x, y, cell_w, cell_h, yr, mo)
    c.showPage()


def _mini_month(c, theme, x, y, w, h, yr, mo):
    c.setFillColor(theme.accent)
    c.roundRect(x, y - 16, w, 16, 3, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawCentredString(x + w / 2, y - 11.5, f"{calendar.month_name[mo]} {yr}")
    cw = w / 7
    c.setFillColor(FAINT)
    c.setFont("Helvetica-Bold", 6)
    for i, d in enumerate("SMTWTFS"):
        c.drawCentredString(x + cw * i + cw / 2, y - 26, d)
    weeks = calendar.monthcalendar(yr, mo)
    c.setFont("Helvetica", 7)
    for wi, week in enumerate(weeks):
        for di, day in enumerate(week):
            if day == 0:
                continue
            cx, cy = x + cw * di + cw / 2, y - 38 - wi * 13
            if date(yr, mo, day) in HOLIDAY_BY_DATE:
                c.setFillColor(theme.accent_soft)
                c.circle(cx, cy + 2, 5.5, stroke=0, fill=1)
            c.setFillColor(INK)
            c.drawCentredString(cx, cy, str(day))


# ------------------------------------------------------ monthly calendars
def monthly_calendar(c, theme, yr, mo):
    y = start_page(c, theme, f"{calendar.month_name[mo]} {yr}", "Monthly calendar")
    grid_top = y - 4
    grid_h = grid_top - (MARGIN + 78)
    cw = CONTENT_W / 7
    weeks = calendar.monthcalendar(yr, mo)
    rh = grid_h / max(len(weeks), 5)
    # weekday header
    c.setFillColor(theme.accent)
    c.rect(MARGIN, grid_top, CONTENT_W, 0.1, stroke=0, fill=1)
    c.setFont("Helvetica-Bold", 9)
    for i, name in enumerate(["Sunday", "Monday", "Tuesday", "Wednesday",
                              "Thursday", "Friday", "Saturday"]):
        c.setFillColor(theme.accent)
        c.drawCentredString(MARGIN + cw * i + cw / 2, grid_top + 4, name)
    c.setStrokeColor(RULE)
    c.setLineWidth(0.7)
    for wi, week in enumerate(weeks):
        for di, day in enumerate(week):
            x0, y0 = MARGIN + cw * di, grid_top - (wi + 1) * rh
            if day:
                d = date(yr, mo, day)
                if d in HOLIDAY_BY_DATE:
                    c.setFillColor(theme.accent_soft)
                    c.rect(x0, y0, cw, rh, stroke=0, fill=1)
                c.setFillColor(INK)
                c.setFont("Helvetica-Bold", 9)
                c.drawString(x0 + 4, y0 + rh - 12, str(day))
                if d in HOLIDAY_BY_DATE:
                    c.setFillColor(theme.accent)
                    c.setFont("Helvetica", 5.8)
                    name = HOLIDAY_BY_DATE[d]
                    if len(name) > 24:
                        name = name.split(" / ")[0]
                    c.drawString(x0 + 4, y0 + 4, name[:26])
            else:
                c.setFillColor(PAPER_TINT)
                c.rect(x0, y0, cw, rh, stroke=0, fill=1)
            c.setFillColor(INK)
    for r in range(len(weeks) + 1):
        c.line(MARGIN, grid_top - r * rh, MARGIN + CONTENT_W, grid_top - r * rh)
    for col in range(8):
        c.line(MARGIN + cw * col, grid_top, MARGIN + cw * col, grid_top - len(weeks) * rh)
    c.setStrokeColor(theme.accent)
    c.setLineWidth(1.2)
    c.rect(MARGIN, grid_top - len(weeks) * rh, CONTENT_W, len(weeks) * rh, stroke=1, fill=0)
    # focus strip
    yb = grid_top - len(weeks) * rh - 16
    c.setFillColor(theme.accent)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(MARGIN, yb, "THIS MONTH'S PRIORITIES")
    c.drawString(MARGIN + CONTENT_W / 2 + 8, yb, "REMEMBER")
    c.setStrokeColor(RULE)
    c.setLineWidth(0.8)
    for i in range(2):
        yy = yb - 14 - i * 15
        c.line(MARGIN, yy, MARGIN + CONTENT_W / 2 - 12, yy)
        c.line(MARGIN + CONTENT_W / 2 + 8, yy, MARGIN + CONTENT_W, yy)
    c.showPage()


# --------------------------------------------------- important dates dash
def important_dates_dashboard(c, theme, extra_section=None):
    y = start_page(c, theme, "Important Dates Dashboard",
                   f"Pre-loaded US holidays for {SCHOOL_YEAR} + space for your school's dates")
    half = (CONTENT_W - 16) / 2
    # left: pre-filled holidays
    yl = section_label(c, theme, MARGIN, y, "US HOLIDAYS (PRE-FILLED)")
    cells = {}
    for i, (name, d) in enumerate(us_holidays()):
        cells[(i, 0)] = d.strftime("%a  %b %d, %Y")
        cells[(i, 1)] = name.split(" / ")[0] if len(name) > 30 else name
    table(c, theme, MARGIN, yl, [half * 0.38, half * 0.62], ["Date", "Holiday"],
          len(us_holidays()), row_h=17, cell_text=cells)
    # right: school-specific
    xr = MARGIN + half + 16
    yr_ = section_label(c, theme, xr, y, "GRADING PERIODS / TERMS")
    yr_ = table(c, theme, xr, yr_, [half * 0.34, half * 0.33, half * 0.33],
                ["Term", "Starts", "Ends"], 4, row_h=17)
    yr_ = section_label(c, theme, xr, yr_ - 2, "TESTING WINDOWS")
    yr_ = table(c, theme, xr, yr_, [half * 0.55, half * 0.45],
                ["Test / subject", "Dates"], 4, row_h=17)
    y2 = min(yl - len(us_holidays()) * 17 - 17 - 30, yr_)
    y2 = section_label(c, theme, MARGIN, y2 - 4,
                       extra_section or "SCHOOL EVENTS, BREAKS & DEADLINES")
    table(c, theme, MARGIN, y2, [CONTENT_W * 0.18, CONTENT_W * 0.52, CONTENT_W * 0.30],
          ["Date", "Event", "Prep needed"], 9, row_h=18)
    c.showPage()


# --------------------------------------------------------- weekly planner
def weekly_planner_days(c, theme, columns, title="Weekly Lesson Planner", note="", copies=2):
    """Mon–Fri rows x custom planning columns. Printed twice (spread)."""
    for _ in range(copies):
        y = start_page(c, theme, title, note or "Print one per week")
        label_line(c, MARGIN, y - 4, "Week of:", 190)
        label_line(c, MARGIN + 230, y - 4, "Focus / unit:", CONTENT_W - 230)
        y -= 22
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        day_w = 62
        rest = CONTENT_W - day_w
        widths = [day_w] + [rest / len(columns)] * len(columns)
        row_h = (y - (MARGIN + 74)) / len(days)
        cells = {(i, 0): d for i, d in enumerate(days)}
        table(c, theme, MARGIN, y, widths, ["Day"] + columns, len(days),
              row_h=row_h, cell_text=cells, tint_col=0)
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(theme.accent)
        yb = MARGIN + 42
        c.drawString(MARGIN, yb, "NEXT WEEK / DON'T FORGET:")
        c.setStrokeColor(RULE)
        c.line(MARGIN + 150, yb - 2, MARGIN + CONTENT_W, yb - 2)
        c.line(MARGIN, yb - 18, MARGIN + CONTENT_W, yb - 18)
        c.setFillColor(INK)
        c.showPage()


def weekly_planner_matrix(c, theme, rows, row_label, title="Weekly Lesson Planner",
                          note="", copies=2):
    """Custom rows (periods/subjects/children) x Mon–Fri columns."""
    for _ in range(copies):
        y = start_page(c, theme, title, note or "Print one per week")
        label_line(c, MARGIN, y - 4, "Week of:", 190)
        label_line(c, MARGIN + 230, y - 4, "Focus / unit:", CONTENT_W - 230)
        y -= 22
        first_w = 76
        rest = CONTENT_W - first_w
        widths = [first_w] + [rest / 5] * 5
        row_h = (y - (MARGIN + 40)) / len(rows)
        cells = {(i, 0): r for i, r in enumerate(rows)}
        table(c, theme, MARGIN, y, widths,
              [row_label, "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
              len(rows), row_h=row_h, cell_text=cells, tint_col=0)
        c.showPage()


# ----------------------------------------------------------- grade tracker
def grade_tracker(c, theme, copies=2):
    for _ in range(copies):
        y = start_page(c, theme, "Grade Tracker",
                       "One page per class/subject • write assignment names vertically in the header")
        label_line(c, MARGIN, y - 4, "Class / subject:", 220)
        label_line(c, MARGIN + 250, y - 4, "Term:", 120)
        y -= 20
        name_w = 128
        n_assign = 12
        aw = (CONTENT_W - name_w - 46) / n_assign
        headers = ["Student"] + [""] * n_assign + ["Avg"]
        widths = [name_w] + [aw] * n_assign + [46]
        table(c, theme, MARGIN, y, widths, headers, 26, row_h=19.5, tint_col=0)
        c.showPage()


def attendance_tracker(c, theme, copies=2):
    for _ in range(copies):
        y = start_page(c, theme, "Attendance Tracker",
                       "One page per month • P present · A absent · T tardy · E excused")
        label_line(c, MARGIN, y - 4, "Month:", 150)
        label_line(c, MARGIN + 180, y - 4, "Class:", 190)
        y -= 20
        name_w = 120
        n_days = 23
        dw = (CONTENT_W - name_w) / n_days
        headers = ["Student"] + [str(i + 1) for i in range(n_days)]
        widths = [name_w] + [dw] * n_days
        table(c, theme, MARGIN, y, widths, headers, 26, row_h=19.5, tint_col=0)
        c.showPage()


# ------------------------------------------------------- student info form
def student_info_sheet(c, theme, copies=2):
    for _ in range(copies):
        y = start_page(c, theme, "Student Information Sheet", "One per student • keep confidential")
        y -= 6
        lw = CONTENT_W
        rows = [
            [("Student name:", lw * 0.55), ("Preferred name:", lw * 0.45)],
            [("Date of birth:", lw * 0.34), ("Grade:", lw * 0.22), ("Student ID:", lw * 0.44)],
            [("Guardian 1 name:", lw * 0.55), ("Relationship:", lw * 0.45)],
            [("Guardian 1 phone:", lw * 0.5), ("Email:", lw * 0.5)],
            [("Guardian 2 name:", lw * 0.55), ("Relationship:", lw * 0.45)],
            [("Guardian 2 phone:", lw * 0.5), ("Email:", lw * 0.5)],
            [("Home address:", lw)],
            [("Emergency contact:", lw * 0.55), ("Phone:", lw * 0.45)],
            [("Doctor / clinic:", lw * 0.55), ("Phone:", lw * 0.45)],
        ]
        for row in rows:
            x = MARGIN
            for label, w in row:
                c.setFont("Helvetica", 9.5)
                c.drawString(x, y, label)
                lx = x + c.stringWidth(label, "Helvetica", 9.5) + 4
                c.setStrokeColor(RULE)
                c.line(lx, y - 1.5, x + w - 8, y - 1.5)
                x += w
            y -= 24
        y -= 4
        y = section_label(c, theme, MARGIN, y, "HEALTH & SAFETY")
        for label in ["Allergies:", "Medications / medical notes:", "Dietary restrictions:"]:
            c.setFont("Helvetica", 9.5); c.setFillColor(INK)
            c.drawString(MARGIN, y, label)
            lx = MARGIN + c.stringWidth(label, "Helvetica", 9.5) + 4
            c.setStrokeColor(RULE)
            c.line(lx, y - 1.5, MARGIN + CONTENT_W, y - 1.5)
            y -= 22
        y -= 4
        y = section_label(c, theme, MARGIN, y, "DISMISSAL & PERMISSIONS")
        checkbox(c, MARGIN, y, "Bus  — route #: ______")
        checkbox(c, MARGIN + 160, y, "Car rider")
        checkbox(c, MARGIN + 260, y, "Walker")
        checkbox(c, MARGIN + 350, y, "After-school program")
        y -= 20
        checkbox(c, MARGIN, y, "Photo release on file")
        checkbox(c, MARGIN + 160, y, "Internet permission")
        checkbox(c, MARGIN + 320, y, "Field trip form on file")
        y -= 26
        y = section_label(c, theme, MARGIN, y, "LEARNING NOTES  (strengths, interests, supports, IEP/504)")
        y = note_lines(c, MARGIN, y - 6, CONTENT_W, 6, gap=21)
        c.showPage()


def parent_contact_log(c, theme, copies=2):
    for _ in range(copies):
        y = start_page(c, theme, "Parent Contact Log",
                       "Document every call, email, text and conference")
        w = CONTENT_W
        table(c, theme, MARGIN, y - 2,
              [w * .11, w * .17, w * .17, w * .12, w * .23, w * .20],
              ["Date", "Student", "Contact person", "Method", "Reason / summary", "Follow-up"],
              24, row_h=23.5)
        c.showPage()


def expense_tracker(c, theme, copies=2):
    for _ in range(copies):
        y = start_page(c, theme, "Classroom Expense Tracker",
                       "Keep receipts — many classroom expenses are tax-deductible (US educator expense deduction)")
        w = CONTENT_W
        y2 = table(c, theme, MARGIN, y - 2,
                   [w * .11, w * .30, w * .17, w * .16, w * .12, w * .14],
                   ["Date", "Item", "Category", "Store / vendor", "Amount", "Reimbursed?"],
                   22, row_h=23)
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(theme.accent)
        c.drawString(MARGIN + w * .58, y2 - 4, "TOTAL:  $")
        c.setStrokeColor(RULE)
        c.line(MARGIN + w * .70, y2 - 6, MARGIN + w * .86, y2 - 6)
        c.setFillColor(INK)
        c.showPage()


# --------------------------------------------------------------- sub packet
def sub_packet(c, theme):
    # page 1 — welcome & essentials
    y = start_page(c, theme, "Substitute Packet  •  Welcome", "Page 1 of 3 — fill out during week 1, keep in a labeled folder")
    y -= 4
    rows = [[("Teacher:", .55), ("Room:", .45)],
            [("Grade / subject:", .55), ("School phone:", .45)],
            [("Where to find lesson plans:", 1.0)],
            [("Teacher next door (ask for help):", .55), ("Room:", .45)],
            [("Reliable student helpers:", 1.0)]]
    for row in rows:
        x = MARGIN
        for label, frac in row:
            w = CONTENT_W * frac
            c.setFont("Helvetica", 9.5); c.setFillColor(INK)
            c.drawString(x, y, label)
            lx = x + c.stringWidth(label, "Helvetica", 9.5) + 4
            c.setStrokeColor(RULE); c.line(lx, y - 1.5, x + w - 8, y - 1.5)
            x += w
        y -= 24
    y -= 2
    y = section_label(c, theme, MARGIN, y, "DAILY SCHEDULE")
    cells = {}
    y = table(c, theme, MARGIN, y, [CONTENT_W * .18, CONTENT_W * .42, CONTENT_W * .40],
              ["Time", "Class / activity", "Notes for the sub"], 9, row_h=20, cell_text=cells)
    y = section_label(c, theme, MARGIN, y - 2, "NON-NEGOTIABLE PROCEDURES")
    y = table(c, theme, MARGIN, y, [CONTENT_W * .30, CONTENT_W * .70],
              ["Procedure", "How we do it"], 5, row_h=20,
              cell_text={(0, 0): "Attendance", (1, 0): "Bathroom / hall passes",
                         (2, 0): "Dismissal", (3, 0): "Behavior system", (4, 0): "Emergency drills"})
    c.showPage()

    # page 2 — emergency plans
    y = start_page(c, theme, "Substitute Packet  •  Emergency Lesson Plans", "Page 2 of 3 — plans that work any day of the year")
    for i in range(2):
        y = section_label(c, theme, MARGIN, y, f"EMERGENCY LESSON {i + 1}")
        rows = [[("Subject:", .4), ("Time needed:", .3), ("Materials location:", .3)],
                [("Instructions:", 1.0)]]
        for row in rows:
            x = MARGIN
            for label, frac in row:
                w = CONTENT_W * frac
                c.setFont("Helvetica", 9.5); c.setFillColor(INK)
                c.drawString(x, y, label)
                lx = x + c.stringWidth(label, "Helvetica", 9.5) + 4
                c.setStrokeColor(RULE); c.line(lx, y - 1.5, x + w - 8, y - 1.5)
                x += w
            y -= 22
        y = note_lines(c, MARGIN, y, CONTENT_W, 5, gap=20)
        y -= 8
    y = section_label(c, theme, MARGIN, y, "STUDENTS THE SUB SHOULD KNOW ABOUT (medical, supports, seating)")
    table(c, theme, MARGIN, y, [CONTENT_W * .3, CONTENT_W * .7], ["Student", "What to know"], 5, row_h=20)
    c.showPage()

    # page 3 — sub feedback form
    y = start_page(c, theme, "Substitute Packet  •  How Did It Go?", "Page 3 of 3 — the sub fills this out and leaves it on your desk")
    rows = [[("Substitute name:", .55), ("Date:", .45)],
            [("Classes covered:", 1.0)]]
    for row in rows:
        x = MARGIN
        for label, frac in row:
            w = CONTENT_W * frac
            c.setFont("Helvetica", 9.5); c.setFillColor(INK)
            c.drawString(x, y, label)
            lx = x + c.stringWidth(label, "Helvetica", 9.5) + 4
            c.setStrokeColor(RULE); c.line(lx, y - 1.5, x + w - 8, y - 1.5)
            x += w
        y -= 24
    y = section_label(c, theme, MARGIN, y, "WHAT WE COMPLETED")
    y = note_lines(c, MARGIN, y - 4, CONTENT_W, 4, gap=21)
    y = section_label(c, theme, MARGIN, y - 6, "OUTSTANDING / DIDN'T GET TO")
    y = note_lines(c, MARGIN, y - 4, CONTENT_W, 3, gap=21)
    y = section_label(c, theme, MARGIN, y - 6, "BEHAVIOR NOTES  (shout-outs and concerns)")
    y = note_lines(c, MARGIN, y - 4, CONTENT_W, 4, gap=21)
    y = section_label(c, theme, MARGIN, y - 6, "MESSAGES / QUESTIONS FOR THE TEACHER")
    note_lines(c, MARGIN, y - 4, CONTENT_W, 3, gap=21)
    c.showPage()


def notes_page(c, theme, title="Notes"):
    y = start_page(c, theme, title, "")
    note_lines(c, MARGIN, y - 8, CONTENT_W, 26, gap=23)
    c.showPage()
