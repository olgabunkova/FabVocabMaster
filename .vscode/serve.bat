@echo off
REM Serve the project on Windows (double-clickable)
REM Usage: double-click serve.bat or run from cmd in project folder

REM Change to script directory
cd /d %~dp0

nREM Regenerate index.json (try python, then python3)
python generate_index.py 2>nul || python3 generate_index.py 2>nul || (
  echo Failed to run generate_index.py; make sure Python is installed and on PATH
)

nREM Start simple HTTP server in a new window so this script can exit
start "Russian App Server" cmd /k "python -m http.server 8000"

nREM Wait a moment and open the browser to the app
ping -n 2 127.0.0.1 >nul
start "" "http://localhost:8000/russian_app1.html"

nexit /b 0
