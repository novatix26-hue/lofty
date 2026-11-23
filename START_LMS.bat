@echo off
setlocal
title Lofty LMS - One-Click Launcher

:: Ensure Node.js is in PATH
set "PATH=C:\Program Files\nodejs;%APPDATA%\npm;%USERPROFILE%\AppData\Roaming\npm;%PATH%"

cd /d "c:\Users\hp\Desktop\lofty"

echo ===================================================
echo             LOFTY LMS - LOCAL SERVER
echo ===================================================
echo.

echo [1/4] Checking and clearing port 3000...
:: Terminate any previous stuck Node process on port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [2/4] Checking configuration...
if not exist ".env.local" (
    if exist ".env.local.example" (
        copy ".env.local.example" ".env.local" >nul
        echo Configuration initialized: .env.local created
    )
)

echo [3/4] Starting Next.js server on http://localhost:3000 ...
echo [4/4] Opening your browser in 4 seconds...
echo.
echo ---------------------------------------------------
echo  Keep this black window OPEN while testing the site.
echo  To close the server, close this window or press Ctrl+C.
echo ---------------------------------------------------
echo.

:: Automatically open browser once server is booting
start "" powershell -NoProfile -Command "Start-Sleep -Seconds 4; Start-Process 'http://localhost:3000'"

:: Run Next.js dev server
call "C:\Program Files\nodejs\npm.cmd" run dev

pause
