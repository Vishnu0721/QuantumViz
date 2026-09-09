@echo off
echo Starting Quantum Visualizer...
echo.

cd /d "%~dp0"

echo Opening quantum visualizer in browser...
start "" "web/index.html"

echo.
echo Quantum Visualizer opened!
echo.
echo If the page doesn't load properly, try:
echo 1. http://localhost:5500/web/index.html
echo 2. http://127.0.0.1:5500/web/index.html
echo.
pause
