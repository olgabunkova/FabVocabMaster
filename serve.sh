#!/usr/bin/env zsh
# Serve the project folder, regenerate topics/index.json first
# Usage: ./serve.sh
set -e
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$SCRIPT_DIR"
# regenerate index.json
if command -v python3 >/dev/null 2>&1; then
  python3 generate_index.py || true
fi
# start server in background and open browser
python3 -m http.server 8000 &
SERVER_PID=$!
sleep 0.5
open "http://localhost:8000/russian_app.html"
# keep script running until server stops
wait $SERVER_PID
