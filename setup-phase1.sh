#!/bin/bash

# Narrador - Phase 1 Quick Start Script

echo "🎭 NARRADOR - Phase 1 Setup"
echo "================================"

# Check if MongoDB is running
echo ""
echo "📦 Checking MongoDB..."
if ! mongo --version > /dev/null 2>&1; then
    echo "⚠️  MongoDB CLI not found. Make sure MongoDB is running!"
    echo "   Start with: mongod"
    echo "   Or Docker: docker run -d -p 27017:27017 mongo:latest"
else
    echo "✅ MongoDB found"
fi

# Setup backend
echo ""
echo "🔧 Setting up backend..."
if [ -d "backend" ]; then
    cd backend
    
    # Create .env if doesn't exist
    if [ ! -f ".env" ]; then
        echo "📝 Creating .env from .env.example..."
        cp .env.example .env
        echo "⚠️  Update .env with your MongoDB URI and JWT_SECRET"
    fi
    
    # Install dependencies
    if [ ! -d "node_modules" ]; then
        echo "📥 Installing backend dependencies..."
        npm install
    fi
    
    cd ..
    echo "✅ Backend ready"
else
    echo "❌ backend/ directory not found"
    exit 1
fi

# Setup frontend
echo ""
echo "🎨 Setting up frontend..."
if [ ! -d "node_modules" ]; then
    echo "📥 Installing frontend dependencies..."
    npm install
fi
echo "✅ Frontend ready"

echo ""
echo "✨ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Terminal 1: cd backend && npm run dev"
echo "   2. Terminal 2: npm run dev"
echo "   3. Open http://localhost:3000"
echo ""
echo "📚 Full setup guide: see PHASE_1_SETUP.md"
