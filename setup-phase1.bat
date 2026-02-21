@echo off
REM Narrador - Phase 1 Quick Start Script (Windows)

echo.
echo 🎭 NARRADOR - Phase 1 Setup
echo ================================

REM Check backend directory
echo.
echo 🔧 Setting up backend...
if not exist "backend\" (
    echo ❌ backend\ directory not found
    exit /b 1
)

cd backend

REM Create .env if doesn't exist
if not exist ".env" (
    echo 📝 Creating .env from .env.example...
    copy .env.example .env
    echo ⚠️  Update .env with your MongoDB URI and JWT_SECRET
)

REM Install dependencies
if not exist "node_modules\" (
    echo 📥 Installing backend dependencies...
    call npm install
)

cd ..
echo ✅ Backend ready

REM Setup frontend
echo.
echo 🎨 Setting up frontend...
if not exist "node_modules\" (
    echo 📥 Installing frontend dependencies...
    call npm install
)
echo ✅ Frontend ready

echo.
echo ✨ Setup complete!
echo.
echo 📋 Next steps:
echo    1. Terminal 1: cd backend ^&^& npm run dev
echo    2. Terminal 2: npm run dev
echo    3. Open http://localhost:3000
echo.
echo 📚 Full setup guide: see PHASE_1_SETUP.md
echo.
pause
