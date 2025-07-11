@echo off
title ZideeBot Auto-Restart
color 0B

:start
echo.
echo ============================================
echo       ZIDEEBOT AUTO-RESTART MODE
echo ============================================
echo.
echo [%time%] Starting WhatsApp Bot...
echo [INFO] Bot will auto-restart if crashed
echo [INFO] Press Ctrl+C to stop completely
echo.

node index.js

echo.
echo [%time%] Bot stopped! Restarting in 5 seconds...
echo [INFO] Press Ctrl+C to cancel restart
echo.
timeout /t 5 /nobreak >nul
goto start
