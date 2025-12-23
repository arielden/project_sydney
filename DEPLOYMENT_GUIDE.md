# Sidney SAT Platform - Complete Deployment Guide

**Date:** December 23, 2025  
**Status:** ✅ Production Ready  
**Project:** Sidney (Renamed from Sydney)  
**Repository:** https://github.com/arielden/project_sidney (phase3 branch)

---

## 📋 Executive Summary

The Sidney SAT Learning Platform has been successfully deployed to Google Cloud Platform with:
- ✅ Backend API on Cloud Run (Node.js/Express)
- ✅ Frontend SPA on Cloud Run (React/Vite)
- ✅ PostgreSQL 15 database on Cloud SQL
- ✅ 29 seeded SAT math questions
- ✅ 18 SAT Math categories
- ✅ Adaptive learning system with ELO ratings
- ✅ Complete schema with 9 tables, triggers, and functions

---

## 🌐 Live Services

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | https://sidney-frontend-504880375460.us-central1.run.app | ✅ Running |
| **Backend** | https://sidney-backend-504880375460.us-central1.run.app | ✅ Running |
| **Database** | Cloud SQL: sidney-postgres (PostgreSQL 15) | ✅ Connected |

### Test Account
- **Email:** arieldenaro@gmail.com
- **Password:** Pass1234$

---

## 🚀 Complete Deployment Steps

### Prerequisites
```bash
# Ensure you have gcloud CLI installed and authenticated
gcloud auth login
gcloud config set project project-sidney-prod
```

### Step 1: Build and Push Docker Images

#### Backend
```bash
cd /media/arielden/DATA-M2/Projects/Software/project_sidney/backend

# Build
docker build -t gcr.io/project-sidney-prod/sidney-backend:latest \
  -t gcr.io/project-sidney-prod/sidney-backend:1.0.0 .

# Push
docker push gcr.io/project-sidney-prod/sidney-backend:latest
docker push gcr.io/project-sidney-prod/sidney-backend:1.0.0
```

#### Frontend
```bash
cd /media/arielden/DATA-M2/Projects/Software/project_sidney

# Build with backend URL
docker build -t gcr.io/project-sidney-prod/sidney-frontend:latest \
  -t gcr.io/project-sidney-prod/sidney-frontend:1.0.0 \
  --build-arg VITE_API_URL="https://sidney-backend-504880375460.us-central1.run.app/api" .

# Push
docker push gcr.io/project-sidney-prod/sidney-frontend:latest
docker push gcr.io/project-sidney-prod/sidney-frontend:1.0.0
```

### Step 2: Create Cloud SQL Infrastructure

```bash
# Create Cloud SQL instance
gcloud sql instances create sidney-postgres \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

# Create database
gcloud sql databases create sidney_db --instance=sidney-postgres

# Create database user
gcloud sql users create admin --instance=sidney-postgres --password=Sidney2024Secure
```

### Step 3: Deploy Backend to Cloud Run

```bash
gcloud run deploy sidney-backend \
  --image=gcr.io/project-sidney-prod/sidney-backend:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --memory=1Gi \
  --cpu=1 \
  --max-instances=10 \
  --min-instances=0 \
  --add-cloudsql-instances=project-sidney-prod:us-central1:sidney-postgres \
  --set-env-vars="NODE_ENV=production,DB_HOST=/cloudsql/project-sidney-prod:us-central1:sidney-postgres,DB_PORT=5432,DB_NAME=sidney_db,DB_USER=admin,DB_PASSWORD=Sidney2024Secure,JWT_SECRET=sidney-jwt-key-2024" \
  --quiet
```

### Step 4: Deploy Frontend to Cloud Run

```bash
# Get backend URL
BACKEND_URL=$(gcloud run services describe sidney-backend \
  --region=us-central1 --format='value(status.url)')

# Deploy frontend
gcloud run deploy sidney-frontend \
  --image=gcr.io/project-sidney-prod/sidney-frontend:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --max-instances=10 \
  --min-instances=0 \
  --set-env-vars="VITE_API_URL=${BACKEND_URL}" \
  --quiet
```

### Step 5: Initialize Database Schema & Seed Data

```bash
cd /media/arielden/DATA-M2/Projects/Software/project_sidney

# Create directory for Cloud SQL Proxy
mkdir -p /tmp/cloudsql

# Start Cloud SQL Proxy with Unix socket
./cloud_sql_proxy -dir=/tmp/cloudsql \
  -instances="project-sidney-prod:us-central1:sidney-postgres" \
  > /tmp/proxy.log 2>&1 &
PROXY_PID=$!
sleep 4

# Define socket path
SOCKET_PATH="/tmp/cloudsql/project-sidney-prod:us-central1:sidney-postgres"

# Load schema
echo "Loading schema..."
PGPASSWORD="Sidney2024Secure" psql -h "$SOCKET_PATH" -U admin -d sidney_db < database/schema.sql

# Load categories (18 SAT Math categories)
echo "Loading categories..."
PGPASSWORD="Sidney2024Secure" psql -h "$SOCKET_PATH" -U admin -d sidney_db < database/seeds/seed_categories.sql

# Load questions (29 sample questions with mappings)
echo "Loading questions..."
PGPASSWORD="Sidney2024Secure" psql -h "$SOCKET_PATH" -U admin -d sidney_db < database/seeds/seed_development_m2m.sql

# Stop proxy
kill $PROXY_PID 2>/dev/null
sleep 1
echo "✅ Database initialized successfully!"
```

---

## 📊 Database Schema Overview

The database includes 9 tables with complete schema, indexes, triggers, and functions:

### Tables Created

1. **users**
   - User accounts with email/username authentication
   - Stores registration details and timestamps

2. **player_ratings**
   - ELO rating system for overall user performance
   - Default rating: 1200
   - Dynamic K-factor (100 for new, 40 for intermediate, 10 for experienced)

3. **categories**
   - 18 SAT Math categories (Single Variable Equations, Percentages, Areas, etc.)
   - Difficulty levels associated with each category

4. **micro_ratings**
   - ELO ratings per category for targeted learning
   - Tracks user performance in specific topic areas

5. **questions**
   - 29 sample SAT math questions
   - Includes question text, answer choices, correct answer, explanation
   - ELO difficulty rating (1000-1450+ scale)

6. **question_categories**
   - Many-to-many junction table
   - Maps 29 questions to 18 categories
   - Primary category flag for adaptive selection

7. **quiz_sessions**
   - Records each quiz attempt
   - Tracks session type (practice/diagnostic/exam), difficulty, duration
   - Timestamp tracking

8. **question_attempts**
   - Individual question responses within a session
   - Records user answer, correctness, time spent, ELO change
   - Used for adaptive question selection

9. **admin_activity_log**
   - Audit trail for admin actions
   - Tracks user management and system events

### Key Features

- **30+ Indexes** optimized for quiz queries and rating lookups
- **8+ Triggers** for automatic timestamp updates, K-factor calculations, reliability metrics
- **20+ Functions** including ELO K-factor calculations and reliability metrics
- **Integer PKs** (not UUIDs) for performance
- **Automatic Updates** via triggers for statistical calculations

### Seeded Data

- **18 Categories:** 
  - Single Variable Equations
  - Percentages
  - Areas and Volumes
  - Fractions
  - Exponents
  - Ratios and Proportions
  - Linear Equations
  - Quadratic Equations
  - Systems of Equations
  - Word Problems
  - Inequalities
  - Polynomials
  - Absolute Value
  - Sequences and Series
  - Probability
  - Geometry
  - Trigonometry
  - Complex Numbers

- **29 Questions:**
  - Easy (1000-1100 ELO): 7 questions
  - Medium (1100-1300 ELO): 12 questions
  - Hard (1300-1450 ELO): 5 questions
  - Very Hard (1450+ ELO): 5 questions

---

## 🔧 Key Fixes Applied During Deployment

### CORS Configuration
Fixed CORS to allow requests from production frontend:
```typescript
// In backend/src/server.ts
const allowedOrigins = [
  'http://localhost:5173',           // Local dev
  'http://localhost:3000',            // Local prod
  'https://sidney-frontend-504880375460.us-central1.run.app',  // Production
  FRONTEND_URL                        // Env override
];
```

### Port Configuration
Updated Docker images to listen on port 8080 (Cloud Run requirement):
- `Dockerfile`: Changed EXPOSE from 80 to 8080
- `nginx.conf`: Changed server listen from 80 to 8080
- Backend automatically uses 8080 via Cloud Run

### Database Initialization
All of the following must be completed in order:
1. Create Cloud SQL instance
2. Create database
3. Create admin user
4. Deploy services (they need credentials to exist)
5. Load schema
6. Load seed data

---

## 🧪 Testing

### Verify Services Are Running
```bash
# Check backend health
curl https://sidney-backend-504880375460.us-central1.run.app/api/health

# Should return:
# {"status":"OK","message":"Sidney Learning Platform API is running",...,"database":"connected"}
```

### Test User Registration
1. Visit: https://sidney-frontend-504880375460.us-central1.run.app
2. Click "Register"
3. Create a new account
4. Login with credentials

### Test Quiz System
1. Login with test account: arieldenaro@gmail.com / Pass1234$
2. Click "Start Quiz"
3. Answer questions (should be adaptively selected based on your rating)
4. Submit and view results

### Verify Database Data
```bash
# Connect to database (requires proxy running)
PGPASSWORD="Sidney2024Secure" psql -h /tmp/cloudsql/project-sidney-prod:us-central1:sidney-postgres -U admin -d sidney_db

# Check counts
SELECT COUNT(*) FROM questions;        -- Should show 29
SELECT COUNT(*) FROM categories;       -- Should show 18
SELECT COUNT(*) FROM users;            -- Initially 0, grows with registrations
```

---

## 📈 Architecture & Scaling

| Component | Type | Memory | CPU | Auto-Scaling | Region |
|-----------|------|--------|-----|--------------|--------|
| Frontend | Cloud Run | 512Mi | 1 | 0-10 | us-central1 |
| Backend | Cloud Run | 1Gi | 1 | 0-10 | us-central1 |
| Database | Cloud SQL | - | 1 | - | us-central1 |

**Expected Performance:**
- Cold start: 2-5 seconds
- Warm API response: 50-200ms
- Database query: 10-50ms
- Full page load: <2 seconds

---

## 🔍 Monitoring & Logs

### View Backend Logs
```bash
gcloud run services logs read sidney-backend --region=us-central1 --limit=50
```

### View Frontend Logs
```bash
gcloud run services logs read sidney-frontend --region=us-central1 --limit=50
```

### Check Service Status
```bash
# Backend
gcloud run services describe sidney-backend --region=us-central1

# Frontend
gcloud run services describe sidney-frontend --region=us-central1

# Database
gcloud sql instances describe sidney-postgres --region=us-central1
```

---

## 🗑️ Cleanup: Remove Old Sydney Services

### Delete Old Cloud Run Services
```bash
gcloud run services delete sydney-backend --region=us-central1 --quiet
gcloud run services delete sydney-frontend --region=us-central1 --quiet
```

### Delete Old Container Registry Images
```bash
# List old images
gcloud container images list --repository=gcr.io/project-sidney-prod | grep sydney

# Delete them
gcloud container images delete gcr.io/project-sidney-prod/sydney-backend --quiet
gcloud container images delete gcr.io/project-sidney-prod/sydney-frontend --quiet
```

### Delete Old Cloud SQL Instance
```bash
# Only if you have a separate sydney-postgres instance
gcloud sql instances delete sydney-postgres --quiet
```

---

## 📁 Project Structure

```
project_sidney/
├── backend/                         # Node.js/Express API
│   ├── src/
│   │   ├── server.ts               # Express setup with CORS fix
│   │   ├── routes/                 # Auth, quiz, ratings endpoints
│   │   ├── models/                 # User, Question models
│   │   ├── middleware/             # Auth, admin protection
│   │   └── utils/                  # ELO calculator, helpers
│   ├── Dockerfile                  # Listens on 8080
│   └── package.json
├── src/                            # React/Vite frontend
│   ├── components/
│   ├── pages/
│   ├── services/                   # API client
│   └── contexts/
├── database/
│   ├── schema.sql                  # Complete 9-table schema
│   └── seeds/
│       ├── seed_categories.sql     # 18 categories
│       └── seed_development_m2m.sql # 29 questions
├── Dockerfile                      # Listens on 8080
├── nginx.conf                      # Port 8080 config
├── docker-compose.yml              # Local dev setup
├── DEPLOYMENT_GUIDE.md             # This file
└── package.json
```

---

## 🔐 Environment Variables

### Backend (Cloud Run)
```
NODE_ENV=production
DB_HOST=/cloudsql/project-sidney-prod:us-central1:sidney-postgres
DB_PORT=5432
DB_NAME=sidney_db
DB_USER=admin
DB_PASSWORD=Sidney2024Secure
JWT_SECRET=sidney-jwt-key-2024
```

### Frontend (Cloud Run)
```
VITE_API_URL=https://sidney-backend-504880375460.us-central1.run.app
```

---

## ✨ Features Deployed

- ✅ User registration and authentication
- ✅ Quiz system (practice, diagnostic, timed exam modes)
- ✅ Adaptive question selection based on user rating
- ✅ ELO rating system (player-level and category-level)
- ✅ 29 sample questions across 18 categories
- ✅ Question attempt tracking
- ✅ Performance metrics and progress tracking
- ✅ Admin activity logging

---

## 🎯 Deployment Checklist

- ✅ GCP project configured (project-sidney-prod)
- ✅ Docker images built and pushed to GCR
- ✅ Cloud SQL instance created (sidney-postgres)
- ✅ Database created (sidney_db)
- ✅ Admin user created
- ✅ Backend deployed to Cloud Run
- ✅ Frontend deployed to Cloud Run
- ✅ Database schema loaded
- ✅ 18 categories seeded
- ✅ 29 questions seeded
- ✅ CORS configured for production
- ✅ Database connection verified
- ✅ Test account created
- ✅ All code committed to GitHub (phase3 branch)

---

## 🚀 Quick Reference

| Task | Command |
|------|---------|
| View backend logs | `gcloud run services logs read sidney-backend --region=us-central1` |
| View frontend logs | `gcloud run services logs read sidney-frontend --region=us-central1` |
| Check backend health | `curl https://sidney-backend-504880375460.us-central1.run.app/api/health` |
| Restart backend | `gcloud run deploy sidney-backend --region=us-central1 --quiet` |
| Start DB proxy | `./cloud_sql_proxy -dir=/tmp/cloudsql -instances="project-sidney-prod:us-central1:sidney-postgres"` |
| Connect to database | `PGPASSWORD="Sidney2024Secure" psql -h /tmp/cloudsql/project-sidney-prod:us-central1:sidney-postgres -U admin -d sidney_db` |

---

## 📞 Support

If you encounter issues:

1. **Check logs:** `gcloud run services logs read [SERVICE] --region=us-central1`
2. **Verify health:** Visit `/api/health` endpoint on backend
3. **Test database:** Connect via Cloud SQL Proxy and run `SELECT NOW();`
4. **Check environment:** `gcloud run services describe [SERVICE] --region=us-central1`

---

**Last Updated:** December 23, 2025  
**Status:** ✅ Production Ready  
**Repository:** https://github.com/arielden/project_sidney (phase3)  
**Live:** https://sidney-frontend-504880375460.us-central1.run.app
