@echo off
cd /d "%~dp0.."
if not exist "Development-World\REBUILD-VERIFIED.json" (
 echo Preparing the full development world and backing up player identities...
 "runtime\node.exe" "windows\prepare-development.mjs"
 if errorlevel 1 (
  echo Preparation failed. Original data has not been replaced.
  pause
  exit /b 1
 )
)
set "REALM_DATA_DIR=%CD%\Development-World"
set "REALM_WORLD_DB=%CD%\Development-World\world.sqlite"
set "REALM_WORLD_PROFILE=master-reference"
"runtime\node.exe" "windows\start.mjs"
pause

