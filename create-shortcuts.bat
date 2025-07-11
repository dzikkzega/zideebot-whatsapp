@echo off
title Create ZideeBot Desktop Shortcuts
color 0C

echo.
echo ============================================
echo       CREATE DESKTOP SHORTCUTS
echo ============================================
echo.
echo This will create shortcuts on your Desktop:
echo 1. ZideeBot Start
echo 2. ZideeBot Auto-Restart  
echo 3. ZideeBot Full Stack
echo.
pause

set "botPath=%~dp0"
set "desktop=%USERPROFILE%\Desktop"

REM Create ZideeBot Start shortcut
echo Creating ZideeBot Start shortcut...
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%temp%\shortcut1.vbs"
echo sLinkFile = "%desktop%\ZideeBot Start.lnk" >> "%temp%\shortcut1.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%temp%\shortcut1.vbs"
echo oLink.TargetPath = "%botPath%start-zideebot.bat" >> "%temp%\shortcut1.vbs"
echo oLink.WorkingDirectory = "%botPath%" >> "%temp%\shortcut1.vbs"
echo oLink.Description = "Start ZideeBot WhatsApp Bot" >> "%temp%\shortcut1.vbs"
echo oLink.Save >> "%temp%\shortcut1.vbs"
cscript "%temp%\shortcut1.vbs" >nul

REM Create Auto-Restart shortcut
echo Creating ZideeBot Auto-Restart shortcut...
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%temp%\shortcut2.vbs"
echo sLinkFile = "%desktop%\ZideeBot Auto-Restart.lnk" >> "%temp%\shortcut2.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%temp%\shortcut2.vbs"
echo oLink.TargetPath = "%botPath%auto-restart-bot.bat" >> "%temp%\shortcut2.vbs"
echo oLink.WorkingDirectory = "%botPath%" >> "%temp%\shortcut2.vbs"
echo oLink.Description = "Start ZideeBot with Auto-Restart" >> "%temp%\shortcut2.vbs"
echo oLink.Save >> "%temp%\shortcut2.vbs"
cscript "%temp%\shortcut2.vbs" >nul

REM Create Full Stack shortcut
echo Creating ZideeBot Full Stack shortcut...
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%temp%\shortcut3.vbs"
echo sLinkFile = "%desktop%\ZideeBot Full Stack.lnk" >> "%temp%\shortcut3.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%temp%\shortcut3.vbs"
echo oLink.TargetPath = "%botPath%start-full-stack.bat" >> "%temp%\shortcut3.vbs"
echo oLink.WorkingDirectory = "%botPath%" >> "%temp%\shortcut3.vbs"
echo oLink.Description = "Start ZideeBot with Web Dashboard" >> "%temp%\shortcut3.vbs"
echo oLink.Save >> "%temp%\shortcut3.vbs"
cscript "%temp%\shortcut3.vbs" >nul

REM Cleanup
del "%temp%\shortcut1.vbs" >nul 2>&1
del "%temp%\shortcut2.vbs" >nul 2>&1
del "%temp%\shortcut3.vbs" >nul 2>&1

echo.
echo ✅ Shortcuts created successfully!
echo.
echo You can now find these shortcuts on your Desktop:
echo - ZideeBot Start
echo - ZideeBot Auto-Restart
echo - ZideeBot Full Stack
echo.
echo Double-click any shortcut to start the bot!
echo.
pause
