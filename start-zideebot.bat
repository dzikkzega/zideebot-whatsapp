@echo off
title ZideeBot WhatsApp - Starting...
color 0A

echo.
echo ============================================
echo           ZIDEEBOT WHATSAPP BOT
echo ============================================
echo.
echo [INFO] Starting WhatsApp Bot...
echo [INFO] Press Ctrl+C to stop
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo [INFO] Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    npm install
    echo.
)

REM Start the bot
echo [INFO] Launching ZideeBot...
echo.
node index.js

echo.
echo [INFO] Bot stopped. Press any key to exit...
pause >nul
