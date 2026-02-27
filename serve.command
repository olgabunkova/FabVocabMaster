#!/bin/zsh
# Double-clickable on macOS to serve the app and open the browser
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"
python3 generate_index.py || true
python3 -m http.server 8000 &
open "http://localhost:8000/russian_app1.html"
wait
