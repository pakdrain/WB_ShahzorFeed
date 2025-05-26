@echo off
echo ====================================
echo    Weighbridge Camera Monitor
echo ====================================
echo.
echo Installing dependencies (first run only)...
call npm install
echo.
echo Starting camera monitoring system...
echo.
echo Available at:
echo  * ZERO ERRORS:   http://localhost:5000/clean        (RECOMMENDED!)
echo  * Clean Camera:  http://localhost:5000/camera.html
echo  * Offline Mode:  http://localhost:5000/offline
echo  * Simple View:   http://localhost:5000/
echo  * Full Monitor:  http://localhost:5000/monitor
echo.
echo Camera: 10.10.10.146:554 (admin/admin123)
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the development server
npx tsx server/index.ts

pause