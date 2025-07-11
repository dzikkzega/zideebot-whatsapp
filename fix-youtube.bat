@echo off
title Fix YouTube Downloader - Manual Install

echo.
echo ========================================
echo   FIX YOUTUBE DOWNLOADER ERROR
echo ========================================
echo.

echo 🛑 Step 1: Stop bot completely...
echo.

REM Kill any running processes
taskkill /F /IM node.exe 2>nul
taskkill /F /IM chrome.exe 2>nul
timeout /t 2 /nobreak >nul

echo ✅ Processes stopped
echo.

echo 📦 Step 2: Force install ytdl-core...
echo.

REM Force install to bypass lock issues
npm install ytdl-core@4.11.5 --force

if %errorlevel% equ 0 (
    echo.
    echo ✅ Installation successful with --force flag!
    echo.
) else (
    echo.
    echo 🔧 Trying alternative method...
    npm cache clean --force
    npm install ytdl-core --save --force
)

echo.
echo 📋 Step 3: Verify installation...
node -e "console.log('✅ ytdl-core version:', require('ytdl-core').version || 'installed')" 2>nul

if %errorlevel% equ 0 (
    echo.
    echo 🎉 SETUP COMPLETE!
    echo.
    echo 🎥 Commands ready:
    echo    • ytmp4 [link] - Download video YouTube
    echo    • yt [link] - Shortcut for ytmp4
    echo    • ytinfo [link] - Video info only
    echo.
    echo 🚀 Restart bot sekarang:
    echo    start-zideebot.bat
    echo.
) else (
    echo.
    echo ❌ Module verification failed
    echo    Manual command: npm install ytdl-core --save
    echo.
)

echo Press any key to continue...
pause >nul
