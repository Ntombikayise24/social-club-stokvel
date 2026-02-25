@echo off
echo ============================================
echo   Stokvel Management System - Full Setup
echo ============================================
echo.

echo [1/4] Installing frontend dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
echo.

echo [2/4] Installing backend dependencies...
cd backend
call npm install
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to install backend dependencies
    cd ..
    pause
    exit /b 1
)
echo.

echo [3/4] Running database migration and seed...
call npm run migrate
if %ERRORLEVEL% neq 0 (
    echo.
    echo WARNING: Database migration failed.
    echo Make sure MySQL is running and accessible with:
    echo   Host: localhost  Port: 3306  User: root  Password: (empty)
    echo You can edit backend\.env to change database credentials.
    echo Then run: cd backend ^&^& npm run migrate
    echo.
)
cd ..
echo.

echo [4/4] Setup complete!
echo.
echo ============================================
echo   HOW TO START:
echo ============================================
echo   Terminal 1 (Backend):  cd backend ^&^& npm run dev
echo   Terminal 2 (Frontend): npm run dev
echo.
echo   Frontend: http://localhost:5174
echo   Backend:  http://localhost:5000
echo ============================================
echo.
pause
