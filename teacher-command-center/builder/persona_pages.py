"""Pages unique to each persona edition."""
from .theme import MARGIN, CONTENT_W, INK, RULE
from .pdf_utils import (start_page, label_line, checkbox, section_label,
                        table, note_lines, para, bullets)


def _form_row(c, y, row):
    """row = [(label, width_fraction), ...] on one line; returns next y."""
    x = MARGIN
    for label, frac in row:
        w = CONTENT_W * frac
        c.setFont("Helvetica", 9.5)
        c.setFillColor(INK)
        c.drawString(x, y, label)
        lx = x + c.stringWidth(label, "Helvetica", 9.5) + 4
        c.setStrokeColor(RULE)
        c.setLineWidth(0.8)
        c.line(lx, y - 1.5, x + w - 8, y - 1.5)
        x += w
    return y - 24


# ================================================== SPECIAL EDUCATION
def sped_pages(c, theme):
    # IEP at a glance
    for _ in range(2):
        y = start_page(c, theme, "IEP at a Glance", "One per student • confidential — store securely")
        y = _form_row(c, y, [("Student:", .5), ("Case manager:", .5)])
        y = _form_row(c, y, [("IEP annual review date:", .5), ("Reevaluation due:", .5)])
        y = _form_row(c, y, [("Eligibility category:", .5), ("Related services:", .5)])
        y = section_label(c, theme, MARGIN, y - 2, "GOALS")
        y = table(c, theme, MARGIN, y, [CONTENT_W * .45, CONTENT_W * .3, CONTENT_W * .25],
                  ["Goal (short form)", "How progress is measured", "Reporting schedule"], 5, row_h=26)
        y = section_label(c, theme, MARGIN, y - 2, "ACCOMMODATIONS & MODIFICATIONS")
        y = table(c, theme, MARGIN, y, [CONTENT_W * .5, CONTENT_W * .5],
                  ["Accommodation / modification", "Where it applies (class, testing, both)"], 6, row_h=20)
        y = section_label(c, theme, MARGIN, y - 2, "BEHAVIOR PLAN / MEDICAL / OTHER NOTES")
        note_lines(c, MARGIN, y - 4, CONTENT_W, 3, gap=20)
        c.showPage()

    # service minutes log
    for _ in range(2):
        y = start_page(c, theme, "Service Minutes Log",
                       "Track delivered service time against IEP-required minutes")
        y = _form_row(c, y, [("Student:", .4), ("Service:", .3), ("Required min/week:", .3)])
        table(c, theme, MARGIN, y - 2,
              [CONTENT_W * .13, CONTENT_W * .13, CONTENT_W * .16, CONTENT_W * .38, CONTENT_W * .20],
              ["Date", "Minutes", "Setting", "What we worked on", "Provider initials"],
              20, row_h=24)
        c.showPage()

    # progress monitoring
    for _ in range(2):
        y = start_page(c, theme, "Progress Monitoring Data Sheet", "One goal per page")
        y = _form_row(c, y, [("Student:", .5), ("Goal #:", .2), ("Mastery criterion:", .3)])
        table(c, theme, MARGIN, y - 2,
              [CONTENT_W * .13, CONTENT_W * .17, CONTENT_W * .40, CONTENT_W * .30],
              ["Date", "Score / trials", "Conditions & prompts used", "Trend (+ / – / flat)"],
              20, row_h=24)
        c.showPage()

    # ABC behavior log
    y = start_page(c, theme, "Behavior Data Log (ABC)",
                   "Antecedent → Behavior → Consequence • bring to IEP and FBA meetings")
    y = _form_row(c, y, [("Student:", .6), ("Target behavior:", .4)])
    table(c, theme, MARGIN, y - 2,
          [CONTENT_W * .12, CONTENT_W * .10, CONTENT_W * .26, CONTENT_W * .26, CONTENT_W * .26],
          ["Date", "Time", "Antecedent (what happened before)", "Behavior (what it looked like)",
           "Consequence (what happened after)"], 16, row_h=30)
    c.showPage()

    # caseload & meeting tracker
    y = start_page(c, theme, "Caseload & IEP Meeting Tracker", "Your whole caseload on one page")
    table(c, theme, MARGIN, y - 2,
          [CONTENT_W * .20, CONTENT_W * .10, CONTENT_W * .18, CONTENT_W * .18,
           CONTENT_W * .17, CONTENT_W * .17],
          ["Student", "Grade", "Annual review", "Reevaluation", "Progress reports sent",
           "Paperwork status"], 18, row_h=26)
    c.showPage()


# ================================================== HS SCIENCE
def science_pages(c, theme):
    # lab activity planner
    for _ in range(2):
        y = start_page(c, theme, "Lab Activity Planner", "One per lab")
        y = _form_row(c, y, [("Lab title:", .6), ("Course / period:", .4)])
        y = _form_row(c, y, [("Date:", .3), ("Standard(s) / NGSS:", .7)])
        y = section_label(c, theme, MARGIN, y - 2, "MATERIALS & SETUP (per group)")
        y = table(c, theme, MARGIN, y, [CONTENT_W * .45, CONTENT_W * .18, CONTENT_W * .37],
                  ["Item", "Qty per group", "Prep / location"], 7, row_h=19)
        y = section_label(c, theme, MARGIN, y - 2, "SAFETY CONSIDERATIONS")
        checkbox(c, MARGIN, y - 4, "Goggles")
        checkbox(c, MARGIN + 100, y - 4, "Gloves")
        checkbox(c, MARGIN + 195, y - 4, "Apron")
        checkbox(c, MARGIN + 290, y - 4, "Fume hood")
        checkbox(c, MARGIN + 400, y - 4, "Waste disposal plan")
        y -= 26
        y = _form_row(c, y, [("Specific hazards:", 1.0)])
        y = section_label(c, theme, MARGIN, y - 2, "PROCEDURE OVERVIEW & TIMING")
        y = note_lines(c, MARGIN, y - 4, CONTENT_W, 5, gap=20)
        y = section_label(c, theme, MARGIN, y - 4, "CLEAN-UP & ASSESSMENT")
        note_lines(c, MARGIN, y - 4, CONTENT_W, 3, gap=20)
        c.showPage()

    # equipment inventory
    y = start_page(c, theme, "Lab Equipment & Supply Inventory", "Audit at the start and end of each semester")
    table(c, theme, MARGIN, y - 2,
          [CONTENT_W * .30, CONTENT_W * .12, CONTENT_W * .12, CONTENT_W * .22, CONTENT_W * .24],
          ["Item", "Qty start", "Qty end", "Storage location", "Reorder? / notes"], 24, row_h=21)
    c.showPage()

    # lab report rubric
    y = start_page(c, theme, "Lab Report Grading Rubric", "Attach to graded reports or project on screen")
    cells = {
        (0, 0): "Hypothesis & background", (1, 0): "Experimental design & variables",
        (2, 0): "Data collection & tables", (3, 0): "Graphs & analysis",
        (4, 0): "Conclusion & error analysis", (5, 0): "Format, citations & clarity",
    }
    y = table(c, theme, MARGIN, y - 2,
              [CONTENT_W * .28, CONTENT_W * .18, CONTENT_W * .18, CONTENT_W * .18, CONTENT_W * .18],
              ["Criterion", "4 — Exceeds", "3 — Meets", "2 — Approaching", "1 — Beginning"],
              6, row_h=52, cell_text=cells)
    y = _form_row(c, y - 2, [("Total:        / 24", .3), ("Comments:", .7)])
    c.showPage()

    # standards tracker
    y = start_page(c, theme, "Standards Coverage Tracker", "One row per standard • check off as taught and assessed")
    table(c, theme, MARGIN, y - 2,
          [CONTENT_W * .16, CONTENT_W * .44, CONTENT_W * .13, CONTENT_W * .13, CONTENT_W * .14],
          ["Code", "Standard (short form)", "Taught", "Assessed", "Reteach?"], 22, row_h=23)
    c.showPage()

    # safety contract checklist
    y = start_page(c, theme, "Lab Safety Contract Checklist", "Track signed safety contracts and goggle training by period")
    y = _form_row(c, y, [("Period:", .3), ("Course:", .7)])
    table(c, theme, MARGIN, y - 2,
          [CONTENT_W * .30, CONTENT_W * .175, CONTENT_W * .175, CONTENT_W * .175, CONTENT_W * .175],
          ["Student", "Contract signed", "Parent signed", "Safety quiz passed", "Goggles fitted"],
          24, row_h=21)
    c.showPage()


# ================================================== ELEMENTARY
def elementary_pages(c, theme):
    # centers rotation
    for _ in range(2):
        y = start_page(c, theme, "Centers Rotation Planner", "Plan small groups and station rotations for the week")
        y = _form_row(c, y, [("Week of:", .4), ("Skill focus:", .6)])
        rest = CONTENT_W - 80
        cells = {(i, 0): g for i, g in enumerate(
            ["Group 1", "Group 2", "Group 3", "Group 4", "Group 5"])}
        y = table(c, theme, MARGIN, y - 2, [80] + [rest / 5] * 5,
                  ["Group", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                  5, row_h=46, cell_text=cells, tint_col=0)
        y = section_label(c, theme, MARGIN, y - 2, "GROUP ROSTERS")
        table(c, theme, MARGIN, y, [CONTENT_W / 5] * 5,
              ["Group 1", "Group 2", "Group 3", "Group 4", "Group 5"], 6, row_h=18)
        c.showPage()

    # reading level tracker
    y = start_page(c, theme, "Reading Level Tracker", "Record levels each assessment window (BOY / MOY / EOY)")
    table(c, theme, MARGIN, y - 2,
          [CONTENT_W * .24, CONTENT_W * .14, CONTENT_W * .14, CONTENT_W * .14,
           CONTENT_W * .14, CONTENT_W * .20],
          ["Student", "BOY level", "MOY level", "EOY level", "Goal", "Intervention / notes"],
          24, row_h=21)
    c.showPage()

    # behavior communication chart
    y = start_page(c, theme, "Weekly Behavior Chart", "Send home Fridays for a parent signature")
    y = _form_row(c, y, [("Student:", .5), ("Week of:", .5)])
    cells = {(i, 0): d for i, d in enumerate(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])}
    y = table(c, theme, MARGIN, y - 2,
              [80, (CONTENT_W - 80) * .3, (CONTENT_W - 80) * .4, (CONTENT_W - 80) * .3],
              ["Day", "Color / rating", "Teacher note", "Parent initials"],
              5, row_h=42, cell_text=cells, tint_col=0)
    y = section_label(c, theme, MARGIN, y - 2, "OUR CLASS EXPECTATIONS")
    y = note_lines(c, MARGIN, y - 4, CONTENT_W, 3, gap=20)
    y = _form_row(c, y - 4, [("Parent signature:", .6), ("Date:", .4)])
    c.showPage()

    # classroom jobs
    y = start_page(c, theme, "Classroom Jobs Chart", "Rotate weekly or monthly")
    cells = {(i, 0): j for i, j in enumerate(
        ["Line leader", "Door holder", "Paper passer", "Librarian", "Tech helper",
         "Calendar helper", "Plant / pet helper", "Supply manager", "Messenger",
         "Table captains", "Substitute helper", "Clean-up crew"])}
    table(c, theme, MARGIN, y - 2,
          [CONTENT_W * .25] + [CONTENT_W * .1875] * 4,
          ["Job", "Week 1", "Week 2", "Week 3", "Week 4"], 12, row_h=27, cell_text=cells, tint_col=0)
    c.showPage()

    # volunteer / party sign-up
    y = start_page(c, theme, "Class Party & Volunteer Sign-Up", "Send home or post at open house")
    y = _form_row(c, y, [("Event:", .6), ("Date:", .4)])
    y = table(c, theme, MARGIN, y - 2,
              [CONTENT_W * .28, CONTENT_W * .30, CONTENT_W * .22, CONTENT_W * .20],
              ["Parent / guardian", "Bringing / helping with", "Phone or email", "Confirmed"],
              14, row_h=24)
    y = section_label(c, theme, MARGIN, y - 2, "ALLERGY REMINDERS FOR THIS CLASS")
    note_lines(c, MARGIN, y - 4, CONTENT_W, 2, gap=20)
    c.showPage()


# ================================================== HOMESCHOOL
def homeschool_pages(c, theme):
    # attendance / hours log (state reporting)
    for _ in range(2):
        y = start_page(c, theme, "Attendance & Instruction Hours Log",
                       "One per child per month • formatted for state reporting requirements")
        y = _form_row(c, y, [("Child:", .4), ("Month:", .3), ("Required hours (if any):", .3)])
        y2 = table(c, theme, MARGIN, y - 2,
                   [CONTENT_W * .12, CONTENT_W * .40, CONTENT_W * .16, CONTENT_W * .16, CONTENT_W * .16],
                   ["Date", "Subjects covered", "Core hours", "Elective hours", "Total"],
                   19, row_h=22)
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(theme.accent)
        c.drawString(MARGIN + CONTENT_W * .40, y2 - 2, "MONTH TOTALS:")
        c.setStrokeColor(RULE)
        c.line(MARGIN + CONTENT_W * .56, y2 - 4, MARGIN + CONTENT_W * .70, y2 - 4)
        c.line(MARGIN + CONTENT_W * .72, y2 - 4, MARGIN + CONTENT_W * .86, y2 - 4)
        c.setFillColor(INK)
        c.showPage()

    # curriculum plan per child
    for _ in range(2):
        y = start_page(c, theme, "Curriculum Plan", "One per child per year")
        y = _form_row(c, y, [("Child:", .4), ("Grade level:", .3), ("School year: 2026–2027", .3)])
        y = table(c, theme, MARGIN, y - 2,
                  [CONTENT_W * .18, CONTENT_W * .34, CONTENT_W * .24, CONTENT_W * .24],
                  ["Subject", "Curriculum / resources", "Goal for the year", "Completed?"],
                  10, row_h=30)
        y = section_label(c, theme, MARGIN, y - 2, "EXTRACURRICULARS, CO-OPS & CLASSES")
        table(c, theme, MARGIN, y, [CONTENT_W * .35, CONTENT_W * .35, CONTENT_W * .30],
              ["Activity", "Schedule", "Cost / contact"], 5, row_h=20)
        c.showPage()

    # portfolio log
    y = start_page(c, theme, "Portfolio & Work Sample Log",
                   "Track saved work samples for evaluations and records")
    table(c, theme, MARGIN, y - 2,
          [CONTENT_W * .12, CONTENT_W * .14, CONTENT_W * .16, CONTENT_W * .38, CONTENT_W * .20],
          ["Date", "Child", "Subject", "Work sample / description", "Stored where"],
          24, row_h=21)
    c.showPage()

    # field trip log
    y = start_page(c, theme, "Field Trip & Enrichment Log", "Counts as instruction in most states — log it!")
    table(c, theme, MARGIN, y - 2,
          [CONTENT_W * .12, CONTENT_W * .28, CONTENT_W * .18, CONTENT_W * .12, CONTENT_W * .30],
          ["Date", "Trip / activity", "Children", "Hours", "What we learned"],
          22, row_h=23)
    c.showPage()

    # read-aloud log
    y = start_page(c, theme, "Read-Aloud & Reading Log", "Family read-alouds and independent reading")
    table(c, theme, MARGIN, y - 2,
          [CONTENT_W * .12, CONTENT_W * .34, CONTENT_W * .18, CONTENT_W * .16, CONTENT_W * .20],
          ["Date", "Title & author", "Child(ren)", "Pages / time", "Finished?"],
          24, row_h=21)
    c.showPage()


# ================================================== SUBSTITUTE
def substitute_pages(c, theme):
    # school quick sheet
    for _ in range(3):
        y = start_page(c, theme, "School Quick Sheet", "One per school you sub at — fill it in on your first visit")
        y = _form_row(c, y, [("School:", .6), ("District:", .4)])
        y = _form_row(c, y, [("Address:", .6), ("Phone:", .4)])
        y = _form_row(c, y, [("Check-in procedure:", 1.0)])
        y = _form_row(c, y, [("Parking notes:", .5), ("Badge / keys:", .5)])
        y = _form_row(c, y, [("Bell schedule location:", .5), ("Copier code:", .5)])
        y = _form_row(c, y, [("Wi-Fi / login info location:", 1.0)])
        y = _form_row(c, y, [("Helpful office staff:", .5), ("Nurse location:", .5)])
        y = section_label(c, theme, MARGIN, y - 2, "SCHOOL PROCEDURES")
        y = table(c, theme, MARGIN, y, [CONTENT_W * .3, CONTENT_W * .7],
                  ["Procedure", "How this school does it"], 5, row_h=22,
                  cell_text={(0, 0): "Attendance reporting", (1, 0): "Hall passes",
                             (2, 0): "Lunch count / duty", (3, 0): "Dismissal",
                             (4, 0): "Emergency drills"})
        y = section_label(c, theme, MARGIN, y - 2, "NOTES FOR NEXT TIME")
        note_lines(c, MARGIN, y - 4, CONTENT_W, 4, gap=20)
        c.showPage()

    # assignment & pay tracker
    y = start_page(c, theme, "Assignment & Pay Tracker", "Log every job — makes invoicing and taxes painless")
    y2 = table(c, theme, MARGIN, y - 2,
               [CONTENT_W * .11, CONTENT_W * .24, CONTENT_W * .19, CONTENT_W * .12,
                CONTENT_W * .12, CONTENT_W * .11, CONTENT_W * .11],
               ["Date", "School", "Teacher / class", "Full/half day", "Rate", "Paid?", "Rebook?"],
               22, row_h=22)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(theme.accent)
    c.drawString(MARGIN + CONTENT_W * .5, y2 - 2, "MONTH TOTAL:  $")
    c.setStrokeColor(RULE)
    c.line(MARGIN + CONTENT_W * .68, y2 - 4, MARGIN + CONTENT_W * .86, y2 - 4)
    c.setFillColor(INK)
    c.showPage()

    # day-of notes
    for _ in range(2):
        y = start_page(c, theme, "Sub Day Log", "Your working notes for one assignment")
        y = _form_row(c, y, [("Date:", .3), ("School:", .4), ("Room:", .3)])
        y = _form_row(c, y, [("Teacher:", .5), ("Grade / subject:", .5)])
        y = section_label(c, theme, MARGIN, y - 2, "SCHEDULE & PLANS LEFT FOR ME")
        y = table(c, theme, MARGIN, y, [CONTENT_W * .16, CONTENT_W * .42, CONTENT_W * .42],
                  ["Time", "Plan", "How it went / completed?"], 8, row_h=24)
        y = section_label(c, theme, MARGIN, y - 2, "STUDENTS & NOTES TO LEAVE THE TEACHER")
        note_lines(c, MARGIN, y - 4, CONTENT_W, 5, gap=20)
        c.showPage()

    # go-bag checklist + fillers
    y = start_page(c, theme, "Sub Go-Bag & Filler Activities", "Be the sub every school asks for again")
    y = section_label(c, theme, MARGIN, y, "GO-BAG CHECKLIST")
    items = ["Photo ID & sub credentials", "This planner + pen and pencils", "Whistle (recess duty)",
             "Sticky notes & name-tag labels", "Dry-erase markers", "Stickers / reward stamps",
             "Water bottle & snacks", "Phone charger", "Read-aloud picture book",
             "Deck of cards / dice for games"]
    for i, item in enumerate(items):
        x = MARGIN + (0 if i < 5 else CONTENT_W / 2)
        yy = y - 6 - (i % 5) * 22
        checkbox(c, x, yy, item)
    y -= 6 + 5 * 22 + 14
    y = section_label(c, theme, MARGIN, y, "NO-PREP FILLER ACTIVITIES THAT WORK AT ANY GRADE")
    y = bullets(c, MARGIN + 4, y - 2, CONTENT_W - 8, [
        "Silent ball — a classroom-management classic for earned free minutes.",
        "Categories: pick a topic; students list as many items as they can in 3 minutes.",
        "Would-you-rather journal prompt on the board; share-out in pairs.",
        "Sketch-and-label: draw the main idea of today's lesson with 3 labeled parts.",
        "20 questions with vocabulary from the posted word wall.",
        "Heads-up seven-up (elementary) or quiz-trade with index cards (secondary).",
    ], size=10, leading=15)
    c.showPage()


# ================================================== NEW TEACHER
def newteacher_pages(c, theme):
    # first week checklist
    y = start_page(c, theme, "First-Week Survival Checklist", "Everything veterans wish someone had told them")
    cols = {
        "BEFORE STUDENTS ARRIVE": [
            "Get keys, badge, laptop login & email working",
            "Find: copier, mailbox, laminator, restrooms, lounge",
            "Set up gradebook & LMS access",
            "Learn fire drill / lockdown routes for your room",
            "Prep seating chart (pencil, not pen!)",
            "Plan routines: entering, materials, bathroom, dismissal",
            "Over-plan the first two days (2x more than you think)",
        ],
        "WEEK ONE": [
            "Teach routines every day — routines before content",
            "Learn every student's name by Friday",
            "Send a positive note or call to 5 families",
            "Find your mentor and ask 'what do I not know to ask?'",
            "Locate the sub packet expectations for your school",
            "Write down what worked / flopped each afternoon",
            "Leave by a set time at least 3 days — pace yourself",
        ],
    }
    for title, items in cols.items():
        y = section_label(c, theme, MARGIN, y, title)
        for item in items:
            checkbox(c, MARGIN + 2, y - 4, item, font=9.5)
            y -= 21
        y -= 10
    y = section_label(c, theme, MARGIN, y, "MY QUESTIONS TO ASK THIS WEEK")
    note_lines(c, MARGIN, y - 4, CONTENT_W, 4, gap=20)
    c.showPage()

    # classroom setup checklist
    y = start_page(c, theme, "Classroom Setup Checklist", "Work through zones — not everything must be Pinterest-ready")
    zones = {
        "TEACHING ZONE": ["Board visible from every seat", "Doc cam / projector tested",
                          "Daily agenda space", "Timer within reach"],
        "STUDENT ZONES": ["Seating chart & desk arrangement", "Turn-in trays labeled",
                          "Supply station stocked", "Absent-work folder system"],
        "WALLS & DISPLAYS": ["Expectations posted", "Emergency info posted (required)",
                             "Student work display space", "Word wall / anchor chart space"],
        "TEACHER ZONE": ["Sub folder location labeled", "Locked drawer for confidential files",
                         "Parent contact log by the phone", "Emergency snack drawer (for you)"],
    }
    for title, items in zones.items():
        y = section_label(c, theme, MARGIN, y, title)
        for i, item in enumerate(items):
            x = MARGIN + (0 if i % 2 == 0 else CONTENT_W / 2)
            if i % 2 == 0:
                y -= 21
            checkbox(c, x + 2, y + 17 - 4, item, font=9.5)
        y -= 14
    y = section_label(c, theme, MARGIN, y, "STILL NEED / TO BUY")
    note_lines(c, MARGIN, y - 4, CONTENT_W, 4, gap=20)
    c.showPage()

    # mentor meeting log
    for _ in range(2):
        y = start_page(c, theme, "Mentor Meeting Log", "Bring questions; leave with actions")
        for _i in range(3):
            y = _form_row(c, y, [("Date:", .3), ("Topic:", .7)])
            y = section_label(c, theme, MARGIN, y, "WE DISCUSSED / MY ACTION ITEMS")
            y = note_lines(c, MARGIN, y - 2, CONTENT_W, 4, gap=19)
            y -= 8
        c.showPage()

    # observation prep
    y = start_page(c, theme, "Observation & Evaluation Prep", "Fill this out before any formal observation")
    y = _form_row(c, y, [("Observation date:", .4), ("Observer:", .6)])
    y = _form_row(c, y, [("Lesson / class being observed:", 1.0)])
    y = section_label(c, theme, MARGIN, y - 2, "LESSON SNAPSHOT")
    y = table(c, theme, MARGIN, y, [CONTENT_W * .3, CONTENT_W * .7],
              ["Element", "My plan"], 6, row_h=26,
              cell_text={(0, 0): "Objective (posted?)", (1, 0): "Hook / opening",
                         (2, 0): "Direct instruction", (3, 0): "Student practice & grouping",
                         (4, 0): "Checks for understanding", (5, 0): "Closure & exit ticket"})
    y = section_label(c, theme, MARGIN, y - 2, "EVIDENCE I WANT THE OBSERVER TO SEE")
    y = note_lines(c, MARGIN, y - 4, CONTENT_W, 3, gap=20)
    y = section_label(c, theme, MARGIN, y - 4, "POST-OBSERVATION: FEEDBACK & MY NEXT STEPS")
    note_lines(c, MARGIN, y - 4, CONTENT_W, 4, gap=20)
    c.showPage()

    # PD log + reflection
    y = start_page(c, theme, "Professional Development Log", "Many states require documented hours for license renewal")
    y2 = table(c, theme, MARGIN, y - 2,
               [CONTENT_W * .12, CONTENT_W * .34, CONTENT_W * .18, CONTENT_W * .12, CONTENT_W * .24],
               ["Date", "Training / PD title", "Provider", "Hours", "Certificate saved where"],
               16, row_h=23)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(theme.accent)
    c.drawString(MARGIN + CONTENT_W * .45, y2 - 2, "TOTAL HOURS:")
    c.setStrokeColor(RULE)
    c.line(MARGIN + CONTENT_W * .60, y2 - 4, MARGIN + CONTENT_W * .76, y2 - 4)
    c.setFillColor(INK)
    y = section_label(c, theme, MARGIN, y2 - 24, "MONTHLY REFLECTION — what's working, what I'll try next")
    note_lines(c, MARGIN, y - 4, CONTENT_W, 5, gap=20)
    c.showPage()


PERSONA_PAGES = {
    "sped": sped_pages,
    "science": science_pages,
    "elementary": elementary_pages,
    "homeschool": homeschool_pages,
    "substitute": substitute_pages,
    "newteacher": newteacher_pages,
}
