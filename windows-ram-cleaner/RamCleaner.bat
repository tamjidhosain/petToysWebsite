@echo off
:: RAM Cleaner launcher - asks for Administrator rights so Deep Clean works.
:: If you click "No" on the UAC prompt it still runs with the basic features.

net session >nul 2>&1
if %errorlevel%==0 goto run

powershell -NoProfile -Command "try { Start-Process -FilePath '%~f0' -Verb RunAs -ErrorAction Stop } catch { exit 1 }"
if %errorlevel%==0 exit /b

:run
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0RamCleaner.ps1" %*
