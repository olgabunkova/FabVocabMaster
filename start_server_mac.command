#!/usr/bin/env zsh
# Double-click this file in Finder to start the local server on macOS.
# It opens a new Terminal window and runs the project's `serve.sh` so you don't need to type commands.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Make sure serve.sh is executable
if [ -f "./serve.sh" ] && [ ! -x "./serve.sh" ]; then
  chmod +x ./serve.sh 2>/dev/null || true
fi

# Open a new Terminal window and run the serve script there (so Finder remains responsive)
# When double-clicked in Finder this script already runs in a Terminal window.
# Use exec to run the project's serve.sh in the same window (prevents opening a second Terminal).
if [ -f "./serve.sh" ]; then
  exec ./serve.sh
else
  echo "serve.sh not found in $SCRIPT_DIR"
  exit 1
fi
