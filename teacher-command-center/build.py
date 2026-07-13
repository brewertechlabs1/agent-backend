#!/usr/bin/env python3
"""Build the complete Teacher Command Center 2026-2027 product.

Usage:  python3 build.py
Output: dist/Teacher-Command-Center-2026-2027.zip   (upload this to Payhip/Etsy)
        dist/Teacher-Command-Center-2026-2027/      (unzipped preview)
"""
import os
import shutil
import zipfile

from builder.editions import build_all_editions
from builder.xlsx_build import build_teacher_workbook, build_homeschool_workbook
from builder.start_here import build_start_here, LICENSE_TEXT

HERE = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(HERE, "dist")
PRODUCT = os.path.join(DIST, "Teacher-Command-Center-2026-2027")


def main():
    if os.path.exists(PRODUCT):
        shutil.rmtree(PRODUCT)
    pdf_dir = os.path.join(PRODUCT, "1-Printable-Planners")
    xlsx_dir = os.path.join(PRODUCT, "2-Spreadsheets")
    os.makedirs(pdf_dir)
    os.makedirs(xlsx_dir)

    print("Building START-HERE guide...")
    build_start_here(os.path.join(PRODUCT, "START-HERE.pdf"))

    print("Building six persona editions (PDF)...")
    for p in build_all_editions(pdf_dir):
        print("  •", os.path.basename(p))

    print("Building spreadsheets...")
    build_teacher_workbook(os.path.join(xlsx_dir, "Teacher-Command-Center-2026-2027.xlsx"))
    build_homeschool_workbook(os.path.join(xlsx_dir, "Homeschool-Command-Center-2026-2027.xlsx"))

    with open(os.path.join(PRODUCT, "LICENSE.txt"), "w") as f:
        f.write(LICENSE_TEXT)

    zip_path = PRODUCT + ".zip"
    print("Zipping ->", zip_path)
    if os.path.exists(zip_path):
        os.remove(zip_path)
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        for root, _dirs, files in os.walk(PRODUCT):
            for name in sorted(files):
                full = os.path.join(root, name)
                z.write(full, os.path.relpath(full, DIST))
    size_mb = os.path.getsize(zip_path) / 1e6
    print(f"Done. ZIP size: {size_mb:.1f} MB (Etsy digital-file limit is 20 MB)")


if __name__ == "__main__":
    main()
