@echo off
echo Starting Quantum Visualizer Server...
echo.

REM Try Python first
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Using Python server...
    cd web
    python -m http.server 5500
    goto :end
)

REM Try py command (Windows Python launcher)
py --version >nul 2>&1
if %errorlevel% == 0 (
    echo Using Python (py) server...
    cd web
    py -m http.server 5500
    goto :end
)

REM Try Node.js
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo Using Node.js server...
    cd web
    npx http-server -p 5500 -o
    goto :end
)

echo No suitable server found. Please install Python or Node.js.
echo Opening file directly in browser...
start index.html
goto :end

:end
pause
