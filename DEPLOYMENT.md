# Smart Study Planner - Production Deployment Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Local Development Setup](#local-development-setup)
5. [Docker Deployment](#docker-deployment)
6. [Production Deployment](#production-deployment)
7. [Environment Configuration](#environment-configuration)
8. [Database Migration](#database-migration)
9. [Monitoring & Logs](#monitoring--logs)
10. [Troubleshooting](#troubleshooting)

## Project Overview

**Smart Study Planner** is an AI-powered student productivity platform featuring:
- 🎯 Intelligent task management with AI-powered breakdown
- 📚 AI-assisted note summarization
- 🎮 Gamification system with achievements and badges
- ⏱️ Pomodoro & focus modes for study sessions
- 🔐 Firebase authentication
- 📊 Analytics and progress tracking
- ☁️ Cloud-based with real-time synchronization

**Tech Stack:**
- **Backend:** FastAPI, SQLAlchemy, Firebase Admin SDK
- **Frontend:** React 19, Vite, Zustand, Tailwind CSS
- **Database:** SQLite (dev), PostgreSQL (prod)
- **Cache:** Redis
- **AI:** OpenAI, Google Gemini, Claude APIs
- **Deployment:** Docker, Docker Compose

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Client (React)                    │
│         (localhost:3000 or deployed URL)            │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────┐
│              API Gateway / Nginx                    │
│         (Load balancing, SSL/TLS)                   │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
    ┌────────┐  ┌────────┐  ┌────────┐
    │ FastAPI│  │ Cache  │  │  AI    │
    │ Server │  │ (Redis)│  │Services│
    │ :8000  │  │:6379   │  │        │
    └────┬───┘  └────────┘  └────────┘
         │
         ▼
    ┌──────────────────┐
    │   Database       │
    │ (PostgreSQL)     │
    │ or SQLite (dev)  │
    └──────────────────┘
```

## Prerequisites

### Required Software
- **Docker & Docker Compose** (for containerized deployment)
- **Python 3.11+** (for local backend development)
- **Node.js 18+** (for local frontend development)
- **npm or yarn** (package manager)

### Required Accounts & Credentials
1. **Firebase Project**
   - Google Cloud Console account
   - Firebase project created
   - Service account JSON downloaded

2. **AI APIs** (choose at least one):
   - OpenAI API key
   - Google Gemini API key
   - Anthropic Claude API key

3. **Optional Services**
   - SendGrid/SMTP for email
   - Sentry for error tracking
   - Datadog/New Relic for monitoring

## Local Development Setup

### Backend Setup

```bash
# Navigate to backend directory
cd smart_planner_web_backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
.\\venv\\Scripts\\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your credentials

# Initialize database
python -c "
from app.database import init_db
import asyncio
asyncio.run(init_db())
"

# Run development server
uvicorn app.main_v2:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd smart_planner_web_frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your Firebase credentials

# Run development server
npm run dev
# Access at http://localhost:5173
```

## Docker Deployment

### Docker Compose (Recommended for Development)

```bash
# From project root
docker-compose up -d

# Check services
docker-compose ps

# View logs
docker-compose logs -f api
docker-compose logs -f web

# Stop services
docker-compose down
```

### Building Individual Services

```bash
# Backend
cd smart_planner_web_backend
docker build -t smart-planner-api:latest .
docker run -p 8000:8000 --env-file .env smart-planner-api:latest

# Frontend
cd smart_planner_web_frontend
docker build -t smart-planner-web:latest .
docker run -p 3000:3000 smart-planner-web:latest
```

## Production Deployment

### Option 1: Cloud Platforms (Recommended)

#### AWS Deployment
```bash
# Using Elastic Beanstalk
eb init -p "Docker running on 64bit Amazon Linux 2"
eb create smart-planner-env
eb deploy

# Using ECS
aws ecs create-cluster --cluster-name smart-planner
# ... configure ECS task and service
```

#### Google Cloud Run
```bash
# Backend
gcloud builds submit --tag gcr.io/PROJECT_ID/smart-planner-api
gcloud run deploy smart-planner-api \\
  --image gcr.io/PROJECT_ID/smart-planner-api \\
  --platform managed \\
  --region us-central1 \\
  --set-env-vars DATABASE_URL="..."

# Frontend
gcloud builds submit --tag gcr.io/PROJECT_ID/smart-planner-web
gcloud run deploy smart-planner-web \\
  --image gcr.io/PROJECT_ID/smart-planner-web \\
  --platform managed \\
  --region us-central1
```

#### Heroku
```bash
# Create Dockerfile and deploy
heroku create smart-planner-api
heroku container:push web
heroku container:release web
```

### Option 2: Self-Hosted (VPS/Dedicated Server)

```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repository
git clone https://github.com/yourusername/smart-planner.git
cd smart-planner

# Configure environment
cp .env.production .env
# Edit .env with production credentials

# Deploy with Nginx reverse proxy
sudo docker-compose -f docker-compose.prod.yml up -d

# Setup SSL with Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d yourdomain.com
```

### Option 3: Kubernetes Deployment

```bash
# Create namespace
kubectl create namespace smart-planner

# Deploy backend
kubectl apply -f k8s/backend-deployment.yaml -n smart-planner

# Deploy frontend
kubectl apply -f k8s/frontend-deployment.yaml -n smart-planner

# Deploy Redis
kubectl apply -f k8s/redis-deployment.yaml -n smart-planner

# Check deployment
kubectl get pods -n smart-planner
kubectl get services -n smart-planner
```

## Environment Configuration

### Backend .env
```env
# App
APP_NAME=Smart Study Planner
APP_VERSION=1.0.0
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=your-super-secret-key-change-this
ALGORITHM=HS256

# Database
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/smartplanner

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=key-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
FIREBASE_CLIENT_EMAIL=firebase@project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789

# Redis
REDIS_URL=redis://localhost:6379/0

# AI APIs
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=...
AI_PROVIDER=openai

# CORS
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Server
HOST=0.0.0.0
PORT=8000
```

### Frontend .env
```env
# API
VITE_BACKEND_URL=https://api.yourdomain.com

# Firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...

# App
VITE_APP_NAME=Smart Study Planner
VITE_APP_ENV=production
```

## Database Migration

### SQLite to PostgreSQL

```bash
# 1. Export SQLite data
python scripts/export_sqlite.py --output data.json

# 2. Create PostgreSQL database
createdb smartplanner

# 3. Update DATABASE_URL in .env
DATABASE_URL=postgresql+asyncpg://user:password@localhost/smartplanner

# 4. Import data
python scripts/import_postgresql.py --input data.json

# 5. Verify
python -c "from app.database import engine; print('Connected to PostgreSQL')"
```

## Monitoring & Logs

### Docker Logs
```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f api
docker-compose logs -f web

# Filter logs
docker-compose logs --since 10m api
```

### Application Monitoring

```bash
# CPU & Memory usage
docker stats smart-planner-api smart-planner-web

# Health checks
curl http://localhost:8000/health
curl http://localhost:3000/health
```

### Log Aggregation (Production)

```bash
# Using ELK Stack (Elasticsearch, Logstash, Kibana)
docker-compose -f docker-compose.elk.yml up -d

# Or use external services
# - Datadog: integration via Docker labels
# - New Relic: APM agent integration
# - Sentry: error tracking
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Error
```bash
# Check database URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Reset database (dev only)
rm ./smart_planner.db
python -c "from app.database import init_db; asyncio.run(init_db())"
```

#### 2. Firebase Authentication Failure
```bash
# Verify Firebase credentials
python -c "
from app.services.firebase_auth import initialize_firebase
initialize_firebase()
print('Firebase initialized successfully')
"
```

#### 3. API Memory Issues
```bash
# Increase Docker memory limit
docker-compose -f docker-compose.yml up -d --memory='4g'

# Monitor memory
docker stats --no-stream
```

#### 4. Frontend Can't Connect to API
```bash
# Check backend is running
curl http://localhost:8000/health

# Check CORS configuration
# Verify CORS_ORIGINS in backend .env

# Check browser console for cors errors
# Clear browser cache and retry
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=true docker-compose up -d api

# View detailed API logs
docker-compose logs -f --tail=100 api

# Test endpoints with curl
curl -H "Authorization: Bearer token" http://localhost:8000/api/v1/users/me
```

## Performance Optimization

### Caching Strategy
```bash
# Redis cache for frequently accessed data
# Set in backend config:
# CACHE_TTL=3600  # 1 hour

# API response caching
# Implemented in routers via @cache decorator
```

### Database Optimization
```sql
-- Create indexes for common queries
CREATE INDEX idx_user_tasks ON tasks(owner_id, status);
CREATE INDEX idx_task_due_date ON tasks(due_date);
CREATE INDEX idx_user_created ON users(created_at);
```

### Frontend Optimization
```bash
# Code splitting
npm run build  # Generates optimized bundle

# Image optimization
# Images in public/ are served efficiently
# Consider using WebP format
```

## Security Checklist

- [ ] Change SECRET_KEY in production
- [ ] Enable HTTPS/SSL certificates
- [ ] Set DEBUG=false in production
- [ ] Configure strong CORS origins
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting
- [ ] Set up Web Application Firewall (WAF)
- [ ] Regular security updates
- [ ] Database backups enabled
- [ ] Monitor API usage and errors

## Support & Resources

- **Documentation:** [API Docs](http://localhost:8000/docs)
- **GitHub:** [Repository](https://github.com/yourusername/smart-planner)
- **Issues:** [GitHub Issues](https://github.com/yourusername/smart-planner/issues)
- **Discord:** [Community Server](https://discord.gg/your-server)

## License

This project is licensed under the MIT License - see LICENSE file for details.
