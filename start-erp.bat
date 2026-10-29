@echo off
title College ERP - Website Launcher
cls
echo =============================================================
echo               COLLEGE ERP - 1-CLICK LAUNCHER
echo =============================================================
echo.

cd /d "%~dp0"

:: 1. Check if dependencies are installed, install if missing
if not exist "node_modules\" (
    echo [SETUP] Installing required dependencies (first-time setup)...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install npm packages. Make sure Node.js is installed.
        pause
        exit /b 1
    )
    echo [SETUP] Dependencies installed successfully!
    echo.
)

echo [STARTING] Launching College ERP Website on Port 3000...
echo [INFO] Your browser will open automatically at http://localhost:3000
echo.
echo =============================================================
echo                    QUICK TEST ACCOUNTS
echo =============================================================
echo  STUDENT:  Roll: 31001  Password: Kavya@31001   (or click demo chip)
echo  FACULTY:  Code: FAC-001  Password: Ashwini@FAC001 (or click demo chip)
echo  STAFF:    Code: TNP-HEAD  Password: TNP@Campus2026
echo =============================================================
echo.

:: Automatically launch browser after 3 seconds in the background
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"

:: Start the Vite frontend server
call npm run dev

pause
