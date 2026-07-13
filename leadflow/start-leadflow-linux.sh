#!/bin/bash
# LeadFlow Pro launcher for Linux.
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "  Node.js is not installed. Install it with your package manager, e.g.:"
  echo "    sudo apt install nodejs        (Debian/Ubuntu)"
  echo "    sudo dnf install nodejs        (Fedora)"
  echo "  or download it from https://nodejs.org"
  echo ""
  exit 1
fi

echo "Starting LeadFlow Pro..."
node app/server.js
