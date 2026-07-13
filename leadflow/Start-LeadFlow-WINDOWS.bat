@echo off
title LeadFlow Pro
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo.
  echo  Node.js is not installed yet - it's free and takes 2 minutes.
  echo  Opening the download page now. Install it ^(click Next, Next, Finish^),
  echo  then double-click this file again.
  echo.
  start https://nodejs.org/en/download
  pause
  exit /b
)

echo Starting LeadFlow Pro... your browser will open automatically.
node app\server.js
echo.
echo LeadFlow Pro has stopped. Double-click this file to start it again.
pause
