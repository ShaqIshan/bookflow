@echo off
title BookFlow - dev server
cd /d "%~dp0bookflow-app"
if not exist node_modules (
  echo Installing dependencies - first run only, takes a minute...
  call npm install
)
echo.
echo Starting BookFlow at http://localhost:3000  (press Ctrl+C to stop)
start "" http://localhost:3000
call npm run dev
pause
