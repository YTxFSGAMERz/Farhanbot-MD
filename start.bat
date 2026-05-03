@echo off
title FarhanBot-MD Auto-Restart
color 0a

echo ==============================================
echo FarhanBot-MD Auto-Restart Script
echo ==============================================
echo.

:loop
echo [INFO] Starting Bot...
node --no-deprecation index.js

echo.
echo [WARNING] Bot stopped or crashed! Restarting in 5 seconds...
echo Press CTRL+C to stop it completely.
timeout /t 5
goto loop
