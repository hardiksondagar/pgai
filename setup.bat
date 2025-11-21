@echo off
echo Setting up PGAI...

REM Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed. Please install Node.js v18 or higher.
    exit /b 1
)
echo Node.js found

REM Check Python
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Python is not installed. Please install Python 3.8 or higher.
    exit /b 1
)
echo Python found

REM Install Node.js dependencies
echo.
echo Installing Node.js dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Failed to install Node.js dependencies
    exit /b 1
)
echo Node.js dependencies installed

REM Setup Python virtual environment
echo.
echo Setting up Python virtual environment...
cd backend

if exist venv (
    echo Removing old virtual environment...
    rmdir /s /q venv
)

python -m venv venv
if %ERRORLEVEL% NEQ 0 (
    echo Failed to create virtual environment
    exit /b 1
)
echo Virtual environment created

REM Activate and install Python dependencies
echo.
echo Installing Python dependencies...
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo Failed to install Python dependencies
    call deactivate
    exit /b 1
)
echo Python dependencies installed
call deactivate
cd ..

echo.
echo Setup complete! You can now run the app with:
echo    npm start
echo.
echo Or in development mode:
echo    npm run dev

