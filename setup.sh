#!/bin/bash
# setup.sh - Automated setup script for Smart Study Planner

set -e

echo "🚀 Smart Study Planner - Setup Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for required tools
echo -e "\n📋 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Please install Docker from https://www.docker.com"
    exit 1
fi
echo -e "${GREEN}✓ Docker installed${NC}"

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    echo "Please install Docker Compose"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose installed${NC}"

# Create environment files
echo -e "\n📝 Creating environment files..."

if [ ! -f "smart_planner_web_backend/.env" ]; then
    cp smart_planner_web_backend/.env.example smart_planner_web_backend/.env
    echo -e "${GREEN}✓ Created backend .env${NC}"
    echo -e "${YELLOW}⚠️  Please edit smart_planner_web_backend/.env with your credentials${NC}"
else
    echo -e "${GREEN}✓ Backend .env already exists${NC}"
fi

if [ ! -f "smart_planner_web_frontend/.env" ]; then
    cp smart_planner_web_frontend/.env.example smart_planner_web_frontend/.env
    echo -e "${GREEN}✓ Created frontend .env${NC}"
    echo -e "${YELLOW}⚠️  Please edit smart_planner_web_frontend/.env with your credentials${NC}"
else
    echo -e "${GREEN}✓ Frontend .env already exists${NC}"
fi

# Build and start containers
echo -e "\n🐳 Building and starting Docker containers..."
docker-compose build
docker-compose up -d

# Check if services are running
echo -e "\n✅ Checking service health..."

sleep 10

# Wait for services to be healthy
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -s http://localhost:8000/health > /dev/null; then
        echo -e "${GREEN}✓ Backend API is running (http://localhost:8000)${NC}"
        break
    fi
    ATTEMPT=$((ATTEMPT+1))
    sleep 1
done

sleep 5

# Summary
echo -e "\n🎉 Setup complete!"
echo -e "\n📌 Next steps:"
echo -e "  1. Edit .env files with your credentials:"
echo -e "     - Backend: smart_planner_web_backend/.env"
echo -e "     - Frontend: smart_planner_web_frontend/.env"
echo -e "\n  2. Access the application:"
echo -e "     - Frontend: http://localhost:3000"
echo -e "     - Backend API: http://localhost:8000"
echo -e "     - API Docs: http://localhost:8000/docs"
echo -e "\n  3. View logs:"
echo -e "     docker-compose logs -f api"
echo -e "     docker-compose logs -f web"
echo -e "\n  4. Stop services:"
echo -e "     docker-compose down"
echo -e "\n"
