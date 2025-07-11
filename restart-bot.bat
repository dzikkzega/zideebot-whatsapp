@echo off
echo 🔄 Restarting WhatsApp Bot...
echo.

REM Kill any existing node processes for the bot
taskkill /f /im node.exe 2>nul

echo ⏳ Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo 🚀 Starting bot...
node index.js

pause
