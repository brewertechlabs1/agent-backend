"""Shared page geometry, colors and persona themes."""
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import HexColor

PAGE_W, PAGE_H = letter          # 612 x 792 pt (US Letter)
MARGIN = 44
CONTENT_W = PAGE_W - 2 * MARGIN

INK = HexColor("#2b2b33")        # body text
FAINT = HexColor("#8a8a94")      # helper text
RULE = HexColor("#c9c9d1")       # table rules
PAPER_TINT = HexColor("#f5f4f7") # header-row fill

SCHOOL_YEAR = "2026–2027"
BRAND = f"Teacher Command Center • {SCHOOL_YEAR}"

# months of the school year: (year, month)
YEAR_MONTHS = [(2026, m) for m in range(8, 13)] + [(2027, m) for m in range(1, 8)]


class Theme:
    def __init__(self, key, title, subtitle, accent, accent_soft):
        self.key = key                    # file-name slug
        self.title = title                # persona name on the cover
        self.subtitle = subtitle          # tagline under the title
        self.accent = HexColor(accent)
        self.accent_soft = HexColor(accent_soft)


THEMES = {
    "sped": Theme(
        "Special-Education-Teacher", "Special Education Teacher",
        "IEP tracking • accommodations • service minutes • progress data",
        "#6b4fa3", "#efe9f7"),
    "science": Theme(
        "High-School-Science-Teacher", "High School Science Teacher",
        "Period planning • labs • safety • standards tracking",
        "#0e7c7b", "#e5f3f3"),
    "elementary": Theme(
        "Elementary-Teacher", "Elementary Teacher",
        "Subject blocks • centers • reading levels • classroom jobs",
        "#d96c47", "#fbeee8"),
    "homeschool": Theme(
        "Homeschool-Parent", "Homeschool Parent",
        "Multi-child planning • hours logs • portfolio records",
        "#3e8a4e", "#e9f4eb"),
    "substitute": Theme(
        "Substitute-Teacher", "Substitute Teacher",
        "Daily plans • school quick-sheets • job and pay tracking",
        "#2f6db5", "#e8f0f9"),
    "newteacher": Theme(
        "New-Teacher", "New Teacher",
        "First-year checklists • mentor logs • observation prep",
        "#b0447c", "#f8e9f1"),
}
