@echo off
setlocal
cd /d "%~dp0.."
if not exist "runtime\node.exe" (
 echo Missing bundled runtime. Extract the whole ZIP first.
 pause
 exit /b 1
)
"runtime\node.exe" "windows\start.mjs" --development
if errorlevel 1 echo Server stopped with an error. See the message above.
pause



