@echo off
cd /d "%~dp0"
where py >nul 2>nul
if not errorlevel 1 (
 start "" http://127.0.0.1:8071/
 py -m http.server 8071 --bind 127.0.0.1
 goto :end
)
where python >nul 2>nul
if not errorlevel 1 (
 start "" http://127.0.0.1:8071/
 python -m http.server 8071 --bind 127.0.0.1
 goto :end
)
echo Python not found. Install Python or serve this folder with a local HTTP server on port 8071.
:end
pause
