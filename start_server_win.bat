@echo off
REM Double-click this file in Explorer to start the local server on Windows.
REM It regenerates topics/index.json, opens the browser, and starts the custom server.

cd /d "%~dp0"

:: Regenerate index.json (best-effort)
echo Regenerating index...
C:\Users\Fabia\.local\bin\python3.14.exe generate_index.py
if errorlevel 1 (
    echo WARNING: Failed to regenerate index, continuing anyway...
)

echo Starting server...
REM Start the custom HTTP server in a new cmd window
start "FabVocabMaster Server" cmd /k C:\Users\Fabia\.local\bin\python3.14.exe local_server.py

REM Wait 2 seconds for server to start
timeout /t 2 /nobreak

:: Open the default browser to the app
echo Opening browser...
start "" "http://localhost:8000/russian_app.html"
