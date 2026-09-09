@echo off
echo Starting Quantum Visualizer Server...
echo.

cd /d "%~dp0"

echo Checking if port 5500 is available...
netstat -an | findstr :5500 >nul
if %errorlevel% equ 0 (
    echo Port 5500 is already in use. Stopping existing processes...
    taskkill /f /im python.exe >nul 2>&1
    timeout /t 2 >nul
)

echo Starting Python HTTP server on port 5500...
python -m http.server 5500

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to start server!
    echo.
    echo Trying alternative methods...
    echo.
    
    echo Method 1: Using Python3...
    python3 -m http.server 5500
    
    if %errorlevel% neq 0 (
        echo.
        echo Method 2: Using py command...
        py -m http.server 5500
        
        if %errorlevel% neq 0 (
            echo.
            echo ERROR: All methods failed!
            echo Please ensure Python is installed and in PATH
            echo.
            pause
            exit /b 1
        )
    )
)

echo.
echo Server started successfully!
echo.
echo Access your Quantum Visualizer at:
echo http://localhost:5500/web/index.html
echo http://127.0.0.1:5500/web/index.html
echo.
echo Press Ctrl+C to stop the server
echo.
pause
