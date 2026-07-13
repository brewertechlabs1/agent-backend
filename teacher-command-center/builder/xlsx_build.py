"""Build the Excel / Google Sheets workbooks with live formulas.

Everything here uses functions that behave identically in Excel and
Google Sheets after a plain File-upload import (AVERAGE, COUNTIF, SUM,
SUMIF, COUNTA, IF, IFERROR), so buyers can use either app.
"""
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

ACCENT = "4A5FA5"
ACCENT_LIGHT = "E8ECF7"
HEADER_FONT = Font(bold=True, color="FFFFFF", size=11)
HEADER_FILL = PatternFill("solid", fgColor=ACCENT)
SUB_FILL = PatternFill("solid", fgColor=ACCENT_LIGHT)
BOLD = Font(bold=True)
THIN = Side(style="thin", color="C9C9D1")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
CENTER = Alignment(horizontal="center", vertical="center")

N_STUDENTS = 35


def _header_row(ws, row, headers, widths=None):
    for i, h in enumerate(headers, 1):
        cell = ws.cell(row=row, column=i, value=h)
        cell.font = HEADER_FONT
        cell.fill = HEADER_FILL
        cell.alignment = CENTER
        cell.border = BORDER
    if widths:
        for i, w in enumerate(widths, 1):
            ws.column_dimensions[get_column_letter(i)].width = w
    ws.freeze_panes = ws.cell(row=row + 1, column=2)


def _body_borders(ws, first_row, last_row, n_cols):
    for r in range(first_row, last_row + 1):
        for col in range(1, n_cols + 1):
            ws.cell(row=r, column=col).border = BORDER


def _title(ws, text, n_cols):
    ws.insert_rows(1)
    cell = ws.cell(row=1, column=1, value=text)
    cell.font = Font(bold=True, size=14, color=ACCENT)
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=n_cols)


def _readme(wb, lines):
    ws = wb.active
    ws.title = "READ ME"
    ws.column_dimensions["A"].width = 110
    ws.sheet_properties.tabColor = ACCENT
    for i, line in enumerate(lines, 1):
        cell = ws.cell(row=i, column=1, value=line)
        if i == 1:
            cell.font = Font(bold=True, size=16, color=ACCENT)
        elif line.isupper():
            cell.font = Font(bold=True, size=12, color=ACCENT)
    return ws


def build_teacher_workbook(path):
    wb = Workbook()
    _readme(wb, [
        "Teacher Command Center 2026–2027 — Digital Workbook",
        "",
        "GOOGLE SHEETS USERS",
        "1. Go to drive.google.com and click New → File upload → pick this file.",
        "2. Open the uploaded file, then click File → Save as Google Sheets.",
        "3. Done — every formula in this workbook works in Google Sheets.",
        "",
        "EXCEL USERS",
        "Just open the file. Works in Excel 2016+, Excel Online and the Excel mobile app.",
        "",
        "HOW THE TABS CONNECT",
        "• Students — type your roster ONCE here. Names flow into Gradebook and Attendance automatically.",
        "• Gradebook — enter points; averages and letter grades calculate themselves.",
        "• Attendance — type P, A, T or E under each date; totals per student count automatically.",
        "• Lesson Planner — one row per lesson; filter by week or subject.",
        "• Parent Contact Log — one row per call/email/conference.",
        "• Expenses — log purchases; the total and per-category summary update automatically.",
        "• Important Dates — pre-loaded 2026–27 US holidays plus space for your school dates.",
        "• Dashboard — live counts pulled from the other tabs. Don't type into gray cells.",
        "",
        "TIPS",
        "• Duplicate the Gradebook or Attendance tab for each class period (right-click the tab).",
        "• On phones: use the free Google Sheets or Excel app — this file works in both.",
    ])

    # ---------------- Students
    ws = wb.create_sheet("Students")
    headers = ["#", "Student name", "Preferred name", "Grade", "Guardian 1", "Guardian 1 phone",
               "Guardian 1 email", "Guardian 2", "Guardian 2 phone", "Birthday",
               "Allergies / medical", "IEP/504?", "Notes"]
    _header_row(ws, 1, headers, [5, 22, 14, 8, 18, 16, 24, 18, 16, 12, 22, 10, 28])
    for i in range(N_STUDENTS):
        ws.cell(row=2 + i, column=1, value=i + 1)
    _body_borders(ws, 2, 1 + N_STUDENTS, len(headers))
    dv = DataValidation(type="list", formula1='"Yes,No"', allow_blank=True)
    ws.add_data_validation(dv)
    dv.add(f"L2:L{1 + N_STUDENTS}")

    # ---------------- Gradebook
    ws = wb.create_sheet("Gradebook")
    n_assign = 15
    headers = (["#", "Student"] + [f"A{i+1}" for i in range(n_assign)]
               + ["Points earned", "Points possible", "Average %", "Letter"])
    _header_row(ws, 1, headers, [5, 22] + [7] * n_assign + [13, 14, 11, 8])
    # row 2 = points-possible row
    ws.cell(row=2, column=2, value="Points possible →").font = BOLD
    for col in range(3, 3 + n_assign):
        ws.cell(row=2, column=col).fill = SUB_FILL
    first_a, last_a = get_column_letter(3), get_column_letter(2 + n_assign)
    earned_col = get_column_letter(3 + n_assign)
    poss_col = get_column_letter(4 + n_assign)
    avg_col = get_column_letter(5 + n_assign)
    letter_col = get_column_letter(6 + n_assign)
    for i in range(N_STUDENTS):
        r = 3 + i
        ws.cell(row=r, column=1, value=i + 1)
        ws.cell(row=r, column=2, value=f'=IF(Students!B{2+i}="","",Students!B{2+i})')
        ws.cell(row=r, column=3 + n_assign, value=f"=SUM({first_a}{r}:{last_a}{r})")
        ws.cell(row=r, column=4 + n_assign,
                value=f'=SUMPRODUCT(({first_a}$2:{last_a}$2)*({first_a}{r}:{last_a}{r}<>""))')
        ws.cell(row=r, column=5 + n_assign,
                value=f'=IFERROR(ROUND({earned_col}{r}/{poss_col}{r}*100,1),"")')
        ws.cell(row=r, column=6 + n_assign,
                value=(f'=IF({avg_col}{r}="","",IF({avg_col}{r}>=90,"A",'
                       f'IF({avg_col}{r}>=80,"B",IF({avg_col}{r}>=70,"C",'
                       f'IF({avg_col}{r}>=60,"D","F")))))'))
    r_last = 2 + N_STUDENTS
    ws.cell(row=r_last + 1, column=2, value="CLASS AVERAGE").font = BOLD
    ws.cell(row=r_last + 1, column=5 + n_assign,
            value=f"=IFERROR(ROUND(AVERAGE({avg_col}3:{avg_col}{r_last}),1),\"\")").font = BOLD
    _body_borders(ws, 2, r_last + 1, len(headers))

    # ---------------- Attendance
    ws = wb.create_sheet("Attendance")
    n_days = 45
    headers = ["#", "Student"] + [f"Day {i+1}" for i in range(n_days)] + ["Present", "Absent", "Tardy", "Excused"]
    _header_row(ws, 2, headers, [5, 22] + [6.5] * n_days + [9, 9, 9, 9])
    ws.cell(row=1, column=2, value="Write the date under each Day header. Enter P, A, T or E.").font = BOLD
    first_d, last_d = get_column_letter(3), get_column_letter(2 + n_days)
    for i in range(N_STUDENTS):
        r = 3 + i
        ws.cell(row=r, column=1, value=i + 1)
        ws.cell(row=r, column=2, value=f'=IF(Students!B{2+i}="","",Students!B{2+i})')
        for j, code in enumerate(["P", "A", "T", "E"]):
            ws.cell(row=r, column=3 + n_days + j,
                    value=f'=COUNTIF({first_d}{r}:{last_d}{r},"{code}")')
    dv = DataValidation(type="list", formula1='"P,A,T,E"', allow_blank=True)
    ws.add_data_validation(dv)
    dv.add(f"{first_d}3:{last_d}{2 + N_STUDENTS}")
    _body_borders(ws, 3, 2 + N_STUDENTS, len(headers))

    # ---------------- Lesson Planner
    ws = wb.create_sheet("Lesson Planner")
    headers = ["Week of", "Day", "Class / period / subject", "Objective & standard",
               "Activities", "Materials", "Assessment / homework", "Done?"]
    _header_row(ws, 1, headers, [12, 12, 20, 32, 40, 24, 28, 8])
    dv = DataValidation(type="list", formula1='"Mon,Tue,Wed,Thu,Fri"', allow_blank=True)
    ws.add_data_validation(dv)
    dv.add("B2:B400")
    dv2 = DataValidation(type="list", formula1='"Yes,Moved,Skipped"', allow_blank=True)
    ws.add_data_validation(dv2)
    dv2.add("H2:H400")
    _body_borders(ws, 2, 60, len(headers))

    # ---------------- Parent Contact Log
    ws = wb.create_sheet("Parent Contact Log")
    headers = ["Date", "Student", "Contact person", "Method", "Reason / summary",
               "Outcome", "Follow-up needed?", "Follow-up done"]
    _header_row(ws, 1, headers, [12, 20, 20, 12, 40, 32, 16, 14])
    dv = DataValidation(type="list", formula1='"Call,Email,Text,In person,Conference,App"', allow_blank=True)
    ws.add_data_validation(dv)
    dv.add("D2:D300")
    _body_borders(ws, 2, 40, len(headers))

    # ---------------- Expenses
    ws = wb.create_sheet("Expenses")
    headers = ["Date", "Item", "Category", "Store / vendor", "Amount", "Reimbursed?"]
    _header_row(ws, 1, headers, [12, 32, 18, 20, 12, 14])
    cats = "Supplies,Books,Decor,Technology,Snacks/Rewards,Professional,Other"
    dv = DataValidation(type="list", formula1=f'"{cats}"', allow_blank=True)
    ws.add_data_validation(dv)
    dv.add("C2:C200")
    dv2 = DataValidation(type="list", formula1='"Yes,No,Pending"', allow_blank=True)
    ws.add_data_validation(dv2)
    dv2.add("F2:F200")
    _body_borders(ws, 2, 60, len(headers))
    ws.cell(row=2, column=8, value="TOTAL SPENT").font = BOLD
    ws.cell(row=2, column=9, value="=SUM(E2:E200)").font = BOLD
    ws.cell(row=4, column=8, value="BY CATEGORY").font = BOLD
    for i, cat in enumerate(cats.split(",")):
        ws.cell(row=5 + i, column=8, value=cat)
        ws.cell(row=5 + i, column=9, value=f'=SUMIF(C2:C200,"{cat}",E2:E200)')
    ws.column_dimensions["H"].width = 18
    for col in ("E", "I"):
        for r in range(2, 200):
            ws[f"{col}{r}"].number_format = "$#,##0.00"

    # ---------------- Important Dates
    ws = wb.create_sheet("Important Dates")
    headers = ["Date", "Event", "Type", "Prep needed", "Done?"]
    _header_row(ws, 1, headers, [16, 40, 18, 32, 8])
    from .core_pages import us_holidays
    r = 2
    for name, d in us_holidays():
        ws.cell(row=r, column=1, value=d.strftime("%a %b %d, %Y"))
        ws.cell(row=r, column=2, value=name)
        ws.cell(row=r, column=3, value="US holiday")
        r += 1
    dv = DataValidation(type="list",
                        formula1='"US holiday,School event,Grading deadline,Testing,Break,IEP/Meeting,Personal"',
                        allow_blank=True)
    ws.add_data_validation(dv)
    dv.add(f"C2:C100")
    _body_borders(ws, 2, 60, len(headers))

    # ---------------- Dashboard
    ws = wb.create_sheet("Dashboard")
    ws.sheet_properties.tabColor = ACCENT
    ws.column_dimensions["A"].width = 34
    ws.column_dimensions["B"].width = 16
    cell = ws.cell(row=1, column=1, value="COMMAND CENTER DASHBOARD  •  2026–2027")
    cell.font = Font(bold=True, size=14, color=ACCENT)
    rows = [
        ("Students on roster", '=COUNTA(Students!B2:B36)'),
        ("Class grade average (%)", f"=IFERROR(ROUND(AVERAGE(Gradebook!{avg_col}3:{avg_col}{r_last}),1),\"—\")"),
        ("Students below 70%", f'=COUNTIF(Gradebook!{avg_col}3:{avg_col}{r_last},"<70")'),
        ("Total absences logged", f"=SUM(Attendance!{get_column_letter(4 + n_days)}3:{get_column_letter(4 + n_days)}{2 + N_STUDENTS})"),
        ("Total tardies logged", f"=SUM(Attendance!{get_column_letter(5 + n_days)}3:{get_column_letter(5 + n_days)}{2 + N_STUDENTS})"),
        ("Parent contacts logged", "=COUNTA('Parent Contact Log'!A2:A300)"),
        ("Contacts needing follow-up", "=MAX(0,COUNTIF('Parent Contact Log'!G2:G300,\"Yes\")-COUNTIF('Parent Contact Log'!H2:H300,\"<>\"))"),
        ("Classroom spending to date", "=SUM(Expenses!E2:E200)"),
        ("Lessons planned", "=COUNTA('Lesson Planner'!D2:D400)"),
    ]
    for i, (label, formula) in enumerate(rows):
        r = 3 + i
        ws.cell(row=r, column=1, value=label).font = BOLD
        cell = ws.cell(row=r, column=2, value=formula)
        cell.fill = SUB_FILL
        cell.border = BORDER
        cell.alignment = CENTER
    ws["B10"].number_format = "$#,##0.00"

    wb.save(path)
    return path


def build_homeschool_workbook(path):
    wb = Workbook()
    _readme(wb, [
        "Homeschool Command Center 2026–2027 — Multi-Child Workbook",
        "",
        "GOOGLE SHEETS USERS",
        "1. Go to drive.google.com and click New → File upload → pick this file.",
        "2. Open the uploaded file, then click File → Save as Google Sheets.",
        "",
        "HOW IT WORKS",
        "• Children — enter each child's name and grade once.",
        "• Weekly Plan — one row per child per subject per day.",
        "• Hours Log — log instruction time; totals per child calculate automatically",
        "  (many states require documented hours — this tab is your record).",
        "• Curriculum — what you're using per child per subject, with progress.",
        "• Portfolio Log — work samples you've saved for evaluations.",
        "• Expenses — homeschool spending with automatic totals.",
    ])

    ws = wb.create_sheet("Children")
    _header_row(ws, 1, ["Child", "Name", "Grade level", "Learning style / notes"], [8, 24, 12, 50])
    for i in range(6):
        ws.cell(row=2 + i, column=1, value=f"Child {i+1}")
    _body_borders(ws, 2, 7, 4)

    ws = wb.create_sheet("Weekly Plan")
    headers = ["Week of", "Day", "Child", "Subject", "Lesson / pages / activity", "Time (min)", "Done?"]
    _header_row(ws, 1, headers, [12, 10, 16, 16, 48, 11, 8])
    dv = DataValidation(type="list", formula1='"Mon,Tue,Wed,Thu,Fri,Sat"', allow_blank=True)
    ws.add_data_validation(dv); dv.add("B2:B500")
    dv2 = DataValidation(type="list", formula1='"Yes,Partly,Moved"', allow_blank=True)
    ws.add_data_validation(dv2); dv2.add("G2:G500")
    _body_borders(ws, 2, 80, len(headers))

    ws = wb.create_sheet("Hours Log")
    headers = ["Date", "Child", "Subject(s)", "Core hours", "Elective hours", "Total"]
    _header_row(ws, 1, headers, [12, 16, 36, 12, 13, 10])
    for r in range(2, 202):
        ws.cell(row=r, column=6, value=f'=IF(AND(D{r}="",E{r}=""),"",SUM(D{r}:E{r}))')
    _body_borders(ws, 2, 201, len(headers))
    ws.cell(row=2, column=8, value="TOTALS BY CHILD").font = BOLD
    ws.cell(row=3, column=8, value="Child name").font = BOLD
    ws.cell(row=3, column=9, value="Total hours").font = BOLD
    for i in range(6):
        r = 4 + i
        ws.cell(row=r, column=8, value=f'=IF(Children!B{2+i}="","",Children!B{2+i})')
        ws.cell(row=r, column=9, value=f'=IF(H{r}="","",SUMIF(B2:B201,H{r},F2:F201))')
    ws.cell(row=11, column=8, value="ALL CHILDREN").font = BOLD
    ws.cell(row=11, column=9, value="=SUM(F2:F201)").font = BOLD
    ws.column_dimensions["H"].width = 20

    ws = wb.create_sheet("Curriculum")
    headers = ["Child", "Subject", "Curriculum / resource", "Year goal", "Progress", "Done?"]
    _header_row(ws, 1, headers, [16, 16, 34, 30, 14, 8])
    dv = DataValidation(type="list", formula1='"Not started,On track,Behind,Ahead,Complete"', allow_blank=True)
    ws.add_data_validation(dv); dv.add("E2:E100")
    _body_borders(ws, 2, 60, len(headers))

    ws = wb.create_sheet("Portfolio Log")
    headers = ["Date", "Child", "Subject", "Work sample / description", "Stored where"]
    _header_row(ws, 1, headers, [12, 16, 16, 46, 22])
    _body_borders(ws, 2, 60, len(headers))

    ws = wb.create_sheet("Expenses")
    headers = ["Date", "Item", "Category", "Child (or All)", "Amount"]
    _header_row(ws, 1, headers, [12, 34, 18, 16, 12])
    dv = DataValidation(type="list",
                        formula1='"Curriculum,Books,Supplies,Co-op/classes,Field trips,Technology,Other"',
                        allow_blank=True)
    ws.add_data_validation(dv); dv.add("C2:C200")
    _body_borders(ws, 2, 60, len(headers))
    ws.cell(row=2, column=7, value="TOTAL").font = BOLD
    ws.cell(row=2, column=8, value="=SUM(E2:E200)").font = BOLD
    for r in range(2, 200):
        ws[f"E{r}"].number_format = "$#,##0.00"
    ws["H2"].number_format = "$#,##0.00"

    wb.save(path)
    return path
