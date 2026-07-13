"""Assemble each persona edition into a single printable PDF."""
import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from .theme import THEMES, YEAR_MONTHS, SCHOOL_YEAR
from . import core_pages as core
from .persona_pages import PERSONA_PAGES


def _weekly_planner(c, theme, key):
    """Persona-specific weekly lesson planner layout."""
    if key == "sped":
        core.weekly_planner_days(
            c, theme,
            ["Objective / IEP goal link", "Activities & grouping",
             "Accommodations in play", "Data / exit note"],
            note="Built for caseload teaching — tie every day back to goals and data")
    elif key == "science":
        core.weekly_planner_matrix(
            c, theme,
            ["Period 1", "Period 2", "Period 3", "Period 4", "Period 5", "Period 6", "Period 7"],
            "Period",
            note="Plan by period • star (*) any cell that needs lab setup or materials")
    elif key == "elementary":
        core.weekly_planner_matrix(
            c, theme,
            ["Morning meeting", "Reading / ELA", "Writing", "Math",
             "Science / Soc. St.", "Specials & notes"],
            "Block",
            note="Plan by subject block across the week")
    elif key == "homeschool":
        core.weekly_planner_matrix(
            c, theme,
            ["Child 1: ________", "Child 2: ________", "Child 3: ________",
             "Child 4: ________", "Together (family)", "Errands & outside"],
            "Who",
            note="One row per child, plus family subjects you do together")
    elif key == "substitute":
        core.weekly_planner_days(
            c, theme,
            ["School & assignment", "Times / periods", "Prep before I go", "Pay / confirmed?"],
            title="Weekly Assignment Planner",
            note="A sub's week: where you're booked and what to prep")
    else:  # newteacher
        core.weekly_planner_days(
            c, theme,
            ["Objective / standard", "Lesson activities", "Materials & copies", "Assessment / homework"],
            note="Objective first — everything else supports it")


def build_edition(key, out_path):
    theme = THEMES[key]
    c = canvas.Canvas(out_path, pagesize=letter)
    c.setTitle(f"Teacher Command Center {SCHOOL_YEAR} — {theme.title} Edition")
    c.setAuthor("Teacher Command Center")

    core.cover(c, theme)
    core.how_to_use(c, theme)
    core.year_at_a_glance(c, theme)
    extra = {"sped": "IEP MEETINGS, EVALUATIONS & SCHOOL EVENTS",
             "homeschool": "CO-OP, EVALUATION & FAMILY DATES"}.get(key)
    core.important_dates_dashboard(c, theme, extra_section=extra)
    for yr, mo in YEAR_MONTHS:
        core.monthly_calendar(c, theme, yr, mo)

    _weekly_planner(c, theme, key)
    core.grade_tracker(c, theme)
    core.attendance_tracker(c, theme)
    core.student_info_sheet(c, theme)
    core.parent_contact_log(c, theme)
    core.expense_tracker(c, theme)
    if key != "substitute":
        core.sub_packet(c, theme)  # subs get their own school/day sheets instead

    PERSONA_PAGES[key](c, theme)
    core.notes_page(c, theme)
    c.save()
    return out_path


def build_all_editions(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    paths = []
    for key, theme in THEMES.items():
        p = os.path.join(out_dir, f"{theme.key}-Edition-2026-2027.pdf")
        build_edition(key, p)
        paths.append(p)
    return paths
