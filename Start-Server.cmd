@echo off
setlocal
cd /d "%~dp0"
if not exist "runtime\node.exe" (
 echo Missing bundled runtime. Extract the whole ZIP first.
 pause
 exit /b 1
)
:start
"runtime\node.exe" "windows\start.mjs" --development
set "REALM_EXIT=%errorlevel%"
if "%REALM_EXIT%"=="75" goto start
if not "%REALM_EXIT%"=="0" echo Server stopped with an error. See the message above.
pause



