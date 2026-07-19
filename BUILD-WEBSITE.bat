@echo off
title BookFlow - build website
cd /d "%~dp0bookflow-app"
if not exist node_modules (
  echo Installing dependencies - first run only, takes a minute...
  call npm install
)
call npm run build
if %errorlevel%==0 (
  echo.
  echo ============================================================
  echo  Build complete! The finished website is in:
  echo    %cd%\out
  echo  To publish: drag that folder onto https://app.netlify.com/drop
  echo ============================================================
  start "" "%cd%\out"
)
pause
