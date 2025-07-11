@echo off
title ZideeBot Dashboard & Bot
color 0E

echo.
echo ============================================
echo      ZIDEEBOT FULL STACK LAUNCHER
echo ============================================
echo.
echo [INFO] Starting Bot + Web Dashboard...
echo [INFO] Dashboard will be available at:
echo [INFO] - Local: http://localhost:3000
echo [INFO] - Network: http://[YOUR-IP]:3000
echo.

REM Check dependencies
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    npm install
    echo.
)

REM Start both bot and dashboard
echo [INFO] Launching ZideeBot with Dashboard...
echo.
start "ZideeBot Dashboard" cmd /c "node web-server.js"
timeout /t 2 >nul
node index.js

echo.
echo [INFO] Bot stopped. Press any key to exit...
pause >nul
