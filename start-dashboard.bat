@echo off
REM STOCKVEL Business Logic Dashboard - Quick Start Script

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║    STOCKVEL Business Logic Dashboard - Starting Server     ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

echo ✅ Node.js found
echo.
echo 🚀 Starting dashboard server...
echo.

REM Start the server
node serve-dashboard.js

pause
