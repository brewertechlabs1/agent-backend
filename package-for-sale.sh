#!/bin/bash
# Builds the buyer-ready ZIP for Payhip / Etsy: dist/LeadFlow-Pro-v1.0.zip
set -euo pipefail
cd "$(dirname "$0")"

VERSION="1.0"
OUT="dist/LeadFlow-Pro-v${VERSION}.zip"
STAGE="dist/LeadFlow-Pro"

rm -rf dist
mkdir -p "$STAGE"

# copy the product, excluding anything that isn't for buyers
cp -r leadflow/app "$STAGE/app"
cp leadflow/Start-LeadFlow-WINDOWS.bat \
   leadflow/Start-LeadFlow-MAC.command \
   leadflow/start-leadflow-linux.sh \
   leadflow/START-HERE-Quick-Start-Guide.html \
   leadflow/README.txt \
   leadflow/LICENSE.txt \
   "$STAGE/"

# never ship a data folder (would contain the seller's test leads)
rm -rf "$STAGE/app/data" "$STAGE/data"

chmod +x "$STAGE/Start-LeadFlow-MAC.command" "$STAGE/start-leadflow-linux.sh"

( cd dist && zip -r -X "$(basename "$OUT")" "LeadFlow-Pro" )
rm -rf "$STAGE"

echo ""
echo "Built: $OUT"
unzip -l "$OUT"
