@echo off
cd /d "%~dp0.."
echo This creates a NEW development world and identity backup. Original files remain untouched.
"runtime\node.exe" "windows\prepare-development.mjs"
pause

