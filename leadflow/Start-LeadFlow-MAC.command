#!/bin/bash
# LeadFlow Pro launcher for macOS.
# First time: right-click this file and choose "Open" (macOS Gatekeeper).
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "  Node.js is not installed yet — it's free and takes 2 minutes."
  echo "  Opening the download page now. Install it, then open this file again."
  echo ""
  open "https://nodejs.org/en/download"
  read -p "Press Enter to close..."
  exit 1
fi

echo "Starting LeadFlow Pro... your browser will open automatically."
node app/server.js
echo ""
echo "LeadFlow Pro has stopped. Open this file again to restart it."
read -p "Press Enter to close..."
