@echo off
echo Starting Weighbridge Camera Monitor System...
echo.
set NODE_ENV=development
npx tsx server/index.ts
pause