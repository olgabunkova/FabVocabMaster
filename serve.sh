#!/usr/bin/env zsh
# Serve the project folder, regenerate topics/index.json first

set -e
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$SCRIPT_DIR"

# Regenerate index.json
if command -v python3 >/dev/null 2>&1; then
  python3 generate_index.py || true
fi

# SAFETY CHECK: Kill any lingering process currently using port 8000
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

# Start the CUSTOM server in the background
python3 local_server.py &
SERVER_PID=$!

sleep 0.5
open "http://localhost:8000/russian_app.html"

# Keep script running until server stops automatically
wait $SERVER_PID