#!/usr/bin/env pwsh

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║    STOCKVEL Business Logic Dashboard - Starting Server     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $null = node --version
    Write-Host "✅ Node.js found - $(node --version)" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "🚀 Starting dashboard server..." -ForegroundColor Yellow
Write-Host ""

# Start the server
& node serve-dashboard.js
