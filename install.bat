@echo off
title Live CCTV Camera Monitor - Installation
color 0A

echo ========================================
echo    Live CCTV Camera Monitor Setup
echo ========================================
echo.
echo This will install all required packages
echo for your camera monitoring system.
echo.
echo Camera Configuration:
echo - IP Address: 10.10.10.146:554
echo - Username: admin
echo - Password: admin123
echo.
pause

echo Installing Node.js dependencies...
echo.
npm install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo        INSTALLATION SUCCESSFUL!
    echo ========================================
    echo.
    echo Your camera monitoring system is ready!
    echo.
    echo To start the system:
    echo 1. Double-click "start-camera-monitor.bat"
    echo 2. Open browser to http://localhost:5000
    echo.
    echo Your live camera feed will display automatically!
    echo.
) else (
    echo.
    echo ========================================
    echo         INSTALLATION FAILED
    echo ========================================
    echo.
    echo Please check:
    echo 1. Node.js is installed (download from nodejs.org)
    echo 2. Internet connection is working
    echo 3. Run as Administrator if needed
    echo.
)

pause