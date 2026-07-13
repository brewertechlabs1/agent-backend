#!/usr/bin/env bash
# Builds the customer-facing ZIP that gets uploaded to Etsy / Payhip.
# Usage: ./build-zip.sh   (from the product/ directory or repo root)
set -euo pipefail
cd "$(dirname "$0")"

OUT_DIR="../dist"
OUT="$OUT_DIR/Celebration-of-Life-Bundle.zip"
mkdir -p "$OUT_DIR"
rm -f "$OUT"

# Zip the bundle folder contents at the top level of the archive so buyers
# see START-HERE.html immediately after unzipping.
(cd bundle && zip -r -X "../$OUT" . -x '.*')

echo
echo "Built: $(cd "$OUT_DIR" && pwd)/$(basename "$OUT")"
unzip -l "$OUT"
