@echo off
title Y2mate YouTube Downloader Setup

echo.
echo ========================================
echo   Y2MATE YOUTUBE DOWNLOADER SETUP
echo ========================================
echo.

echo 🔧 Membersihkan module lama...
echo.

REM Hapus ytdl-core lama
echo Menghapus ytdl-core modules...
npm uninstall ytdl-core @distube/ytdl-core

echo.
echo 📦 Installing dependencies untuk Y2mate...
echo.

REM Install axios untuk HTTP requests
echo Installing axios...
npm install axios

if %errorlevel% equ 0 (
    echo.
    echo ✅ Y2mate YouTube Downloader setup berhasil!
    echo.
    echo 🎥 Fitur baru yang tersedia:
    echo    • ytmp4 [link] - Download video YouTube (Y2mate)
    echo    • ytmp3 [link] - Download audio YouTube (Y2mate)
    echo    • ytinfo [link] - Info video YouTube
    echo    • yt [link] - Singkatan ytmp4
    echo.
    echo 💡 Contoh penggunaan:
    echo    ytmp4 https://youtu.be/dQw4w9WgXcQ
    echo    ytmp3 https://youtu.be/dQw4w9WgXcQ
    echo.
    echo 🚀 **Keunggulan Y2mate:**
    echo    • Lebih stabil dari ytdl-core
    echo    • Support MP3 dan MP4
    echo    • Bypass YouTube restrictions
    echo    • Quality selection otomatis
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
