"""Low-level drawing helpers used by every page builder."""
from reportlab.lib.colors import white
from .theme import PAGE_W, PAGE_H, MARGIN, CONTENT_W, INK, FAINT, RULE, PAPER_TINT, BRAND


def start_page(c, theme, title, subtitle=""):
    """Draw the standard page header band; return the y just below it."""
    band_h = 46
    top = PAGE_H - MARGIN
    c.setFillColor(theme.accent)
    c.roundRect(MARGIN, top - band_h, CONTENT_W, band_h, 6, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 17)
    c.drawString(MARGIN + 14, top - 21, title)
    if subtitle:
        c.setFont("Helvetica", 9)
        c.drawString(MARGIN + 14, top - 36, subtitle)
    c.setFont("Helvetica", 8)
    c.drawRightString(MARGIN + CONTENT_W - 12, top - band_h + 8, BRAND)
    footer(c, theme)
    c.setFillColor(INK)
    return top - band_h - 16


def footer(c, theme):
    c.setFont("Helvetica", 7.5)
    c.setFillColor(FAINT)
    c.drawCentredString(PAGE_W / 2, MARGIN - 18, BRAND + "  •  For personal classroom use")
    c.setFillColor(INK)


def label_line(c, x, y, label, line_w, label_font=9):
    """'Label ______' — returns x where the line ends."""
    c.setFont("Helvetica", label_font)
    c.setFillColor(INK)
    c.drawString(x, y, label)
    lx = x + c.stringWidth(label, "Helvetica", label_font) + 4
    c.setStrokeColor(RULE)
    c.setLineWidth(0.8)
    c.line(lx, y - 1.5, x + line_w, y - 1.5)
    return x + line_w


def checkbox(c, x, y, label, size=9, font=9):
    c.setStrokeColor(INK)
    c.setLineWidth(0.9)
    c.rect(x, y - 1, size, size, stroke=1, fill=0)
    c.setFont("Helvetica", font)
    c.drawString(x + size + 6, y, label)


def section_label(c, theme, x, y, text):
    c.setFillColor(theme.accent)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(x, y, text)
    c.setFillColor(INK)
    return y - 14


def table(c, theme, x, y, col_widths, headers, n_rows, row_h=22,
          header_h=20, fill_header=True, cell_text=None, tint_col=None):
    """Draw a ruled table top-down from y. cell_text[(row,col)] pre-fills a cell.
    Returns the y below the table."""
    w = sum(col_widths)
    # header
    if headers:
        c.setFillColor(theme.accent if fill_header else PAPER_TINT)
        c.rect(x, y - header_h, w, header_h, stroke=0, fill=1)
        c.setFillColor(white if fill_header else INK)
        c.setFont("Helvetica-Bold", 8.5)
        cx = x
        for cw, h in zip(col_widths, headers):
            c.drawCentredString(cx + cw / 2, y - header_h + 6.5, h)
            cx += cw
        y -= header_h
    # body rows
    body_top = y
    c.setFillColor(INK)
    c.setFont("Helvetica", 8.5)
    for r in range(n_rows):
        ry = y - (r + 1) * row_h
        if tint_col is not None:
            c.setFillColor(theme.accent_soft)
            cx0 = x + sum(col_widths[:tint_col])
            c.rect(cx0, ry, col_widths[tint_col], row_h, stroke=0, fill=1)
            c.setFillColor(INK)
        if cell_text:
            cx = x
            for col, cw in enumerate(col_widths):
                txt = cell_text.get((r, col))
                if txt:
                    c.setFont("Helvetica", 8.5)
                    c.drawString(cx + 5, ry + row_h / 2 - 3, str(txt))
                cx += cw
    bottom = body_top - n_rows * row_h
    # rules
    c.setStrokeColor(RULE)
    c.setLineWidth(0.7)
    for r in range(n_rows + 1):
        yy = body_top - r * row_h
        c.line(x, yy, x + w, yy)
    cx = x
    top_y = body_top + (header_h if headers else 0)
    for cw in list(col_widths) + [0]:
        c.line(cx, top_y, cx, bottom)
        cx += cw
    # outer border
    c.setStrokeColor(theme.accent)
    c.setLineWidth(1.1)
    c.rect(x, bottom, w, top_y - bottom, stroke=1, fill=0)
    return bottom - 14


def note_lines(c, x, y, width, n, gap=20):
    from .theme import RULE as _R
    c.setStrokeColor(_R)
    c.setLineWidth(0.8)
    for i in range(n):
        yy = y - i * gap
        c.line(x, yy, x + width, yy)
    return y - n * gap - 6


def para(c, x, y, width, text, font="Helvetica", size=9.5, leading=13.5, color=None):
    """Simple word-wrapped paragraph; returns y below the text."""
    c.setFont(font, size)
    if color:
        c.setFillColor(color)
    words, line = text.split(), ""
    for word in words:
        trial = (line + " " + word).strip()
        if c.stringWidth(trial, font, size) > width and line:
            c.drawString(x, y, line)
            y -= leading
            line = word
        else:
            line = trial
    if line:
        c.drawString(x, y, line)
        y -= leading
    if color:
        c.setFillColor(INK)
    return y


def bullets(c, x, y, width, items, size=9.5, leading=14.5, bold_head=False):
    for item in items:
        c.setFillColor(INK)
        c.circle(x + 3, y + 3, 1.6, stroke=0, fill=1)
        if bold_head and ":" in item:
            head, rest = item.split(":", 1)
            c.setFont("Helvetica-Bold", size)
            c.drawString(x + 12, y, head + ":")
            hx = x + 12 + c.stringWidth(head + ":", "Helvetica-Bold", size) + 3
            y = para(c, hx, y, width - (hx - x), rest.strip(), size=size, leading=leading - 1)
            y -= 3
        else:
            y = para(c, x + 12, y, width - 12, item, size=size, leading=leading - 1)
            y -= 3
    return y
