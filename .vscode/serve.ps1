# PowerShell script to serve the project (Windows)
# Usage: Right-click -> Run with PowerShell or run in a PowerShell terminal
Set-Location -Path $PSScriptRoot
# regenerate index.json
try {
    python generate_index.py
} catch {
    try { python3 generate_index.py } catch { Write-Host 'Failed to run generate_index.py' }
}
# Start python http server in background
Start-Process -NoNewWindow -FilePath python -ArgumentList '-m','http.server','8000'
Start-Sleep -Milliseconds 500
Start-Process 'http://localhost:8000/russian_app1.html'
