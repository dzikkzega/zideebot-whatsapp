@echo off
title YouTube Downloader Setup

echo.
echo ========================================
echo   YOUTUBE DOWNLOADER SETUP
echo ========================================
echo.

echo 📦 Installing YouTube Downloader dependency...
echo.

REM Install ytdl-core package
echo Installing ytdl-core...
npm install ytdl-core@4.11.5

if %errorlevel% equ 0 (
    echo.
    echo ✅ YouTube Downloader setup successful!
    echo.
    echo 🎥 Fitur baru yang tersedia:
    echo    • ytmp4 [link] - Download video YouTube
    echo    • ytinfo [link] - Info video YouTube  
    echo    • yt [link] - Singkatan ytmp4
    echo.
    echo 💡 Contoh penggunaan:
    echo    ytmp4 https://youtu.be/dQw4w9WgXcQ
    echo.
    echo 📁 File akan otomatis dibersihkan setelah dikirim
    echo ⚠️  Video maksimal 10 menit dan 25MB
    echo.
    echo Press any key to continue...
    pause >nul
) else (
    echo.
    echo ❌ Installation failed!
    echo    Please check your internet connection and try again.
    echo.
    pause
)
