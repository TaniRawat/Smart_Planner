@echo off
REM setup.bat - Windows setup script for Smart Study Planner

echo.
echo 🚀 Smart Study Planner - Windows Setup Script
echo ============================================
echo.

REM Check for Docker
docker --version > nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed or not in PATH
    echo Please install Docker Desktop from https://www.docker.com
    pause
    exit /b 1
)
echo ✓ Docker installed

REM Check for Docker Compose
docker-compose --version > nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not installed
    echo Please install Docker Compose
    pause
    exit /b 1
)
echo ✓ Docker Compose installed

REM Create environment files
echo.
echo 📝 Creating environment files...

if not exist "smart_planner_web_backend\.env" (
    copy smart_planner_web_backend\.env.example smart_planner_web_backend\.env
    echo ✓ Created backend .env
    echo ⚠️  Please edit smart_planner_web_backend\.env with your credentials
) else (
    echo ✓ Backend .env already exists
)

if not exist "smart_planner_web_frontend\.env" (
    copy smart_planner_web_frontend\.env.example smart_planner_web_frontend\.env
    echo ✓ Created frontend .env
    echo ⚠️  Please edit smart_planner_web_frontend\.env with your credentials
) else (
    echo ✓ Frontend .env already exists
)

REM Build and start containers
echo.
echo 🐳 Building and starting Docker containers...
docker-compose build
docker-compose up -d

REM Wait for services
echo.
echo ✅ Containers started. Waiting for services to be ready...
timeout /t 10

REM Display summary
echo.
echo 🎉 Setup complete!
echo.
echo 📌 Next steps:
echo   1. Edit .env files with your credentials:
echo      - Backend: smart_planner_web_backend\.env
echo      - Frontend: smart_planner_web_frontend\.env
echo.
echo   2. Access the application:
echo      - Frontend: http://localhost:3000
echo      - Backend API: http://localhost:8000
echo      - API Docs: http://localhost:8000/docs
echo.
echo   3. View logs:
echo      docker-compose logs -f api
echo      docker-compose logs -f web
echo.
echo   4. Stop services:
echo      docker-compose down
echo.
pause
