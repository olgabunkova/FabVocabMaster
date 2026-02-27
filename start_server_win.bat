@echo off
REM Double-click this file in Explorer to start the local server on Windows.
REM It regenerates topics/index.json, opens the browser, and starts python's http.server in a new console.

cd /d "%~dp0"

:: Regenerate index.json (best-effort)
python generate_index.py

:: Start the HTTP server in a new cmd window so this window doesn't block
start "" cmd /k python -m http.server 8000

:: Open the default browser to the app (may open before the server is ready)
start "" "http://localhost:8000/russian_app.html"
