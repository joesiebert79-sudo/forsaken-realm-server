@echo off
setlocal
cd /d "%~dp0.."
if not exist "runtime\node.exe" (
 echo Extract the complete Forsaken Realm server ZIP first.
 pause
 exit /b 1
)
"runtime\node.exe" "windows\change-player-codes.mjs"
pause
