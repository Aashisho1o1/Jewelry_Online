@echo off
rem Double-click to start the shop and CMS on this computer.
cd /d "%~dp0"
start "" /min cmd /c "ping -n 9 127.0.0.1 >nul & start http://localhost:5173/admin/"
call npm.cmd run cms
pause
