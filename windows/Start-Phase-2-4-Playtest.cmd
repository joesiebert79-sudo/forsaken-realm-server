@echo off
setlocal
cd /d "%~dp0.."
set "REALM_UPDATES_OFF=1"
if exist "runtime\node.exe" (
 "runtime\node.exe" "windows\start.mjs" --development
) else (
 node "windows\start.mjs" --development
)
if errorlevel 1 echo The playtest server stopped with an error. See the message above.
pause
