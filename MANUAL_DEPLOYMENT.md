# Sidney SAT Platform - Manual GCP Deployment Guide

## Current Status

✅ **Docker Images Built and Pushed to GCR:**
- `gcr.io/project-sidney-prod/sidney-backend:latest`
- `gcr.io/project-sidney-prod/sidney-frontend:latest`
- `gcr.io/project-sidney-prod/sidney-backend:1.0.0`
- `gcr.io/project-sidney-prod/sidney-frontend:1.0.0`

⏳ **Awaiting GCP Infrastructure Setup:**
- Cloud SQL Instance
- Cloud Run Services
- IAM/API Configuration

---

## Prerequisites

Before deploying, ensure you have:

1. **GCP Account Access**
   - Project: `project-sidney-prod`
   - Region: `us-central1`

2. **Required APIs Enabled**
   ```bash
   gcloud services enable \
     cloudresourcemanager.googleapis.com \
     run.googleapis.com \
     container.googleapis.com \
     sqladmin.googleapis.com \
     --project=project-sidney-prod
   ```

3. **IAM Permissions**
   - Cloud Run Admin
   - Cloud SQL Admin
   - Service Account User
   - Container Registry Service Agent

---

## Step 1: Create Cloud SQL Instance

```bash
gcloud sql instances create sidney-postgres \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --database-flags=cloudsql_iam_authentication=on \
  --project=project-sidney-prod
```

Verify:
```bash
gcloud sql instances describe sidney-postgres --project=project-sidney-prod
```

---

## Step 2: Create Database and User

```bash
# Create database
gcloud sql databases create sidney_db \
  --instance=sidney-postgres \
  --project=project-sidney-prod

# Create user
gcloud sql users create admin \
  --instance=sidney-postgres \
  --password=[SECURE_PASSWORD] \
  --project=project-sidney-prod
```

---

## Step 3: Deploy Backend to Cloud Run

```bash
gcloud run deploy sidney-backend \
  --image=gcr.io/project-sidney-prod/sidney-backend:latest \
  --region=us-central1 \
  --project=project-sidney-prod \
  --allow-unauthenticated \
  --memory=1Gi \
  --cpu=1 \
  --max-instances=10 \
  --min-instances=0 \
  --add-cloudsql-instances=project-sidney-prod:us-central1:sidney-postgres \
  --set-env-vars="NODE_ENV=production,DB_HOST=/cloudsql/project-sidney-prod:us-central1:sidney-postgres,DB_PORT=5432,DB_NAME=sidney_db,DB_USER=admin,DB_PASSWORD=[SECURE_PASSWORD],JWT_SECRET=[SECURE_SECRET]"
```

Get the backend URL:
```bash
BACKEND_URL=$(gcloud run services describe sidney-backend \
  --region=us-central1 \
  --project=project-sidney-prod \
  --format='value(status.url)')
echo "Backend URL: $BACKEND_URL"
```

---

## Step 4: Deploy Frontend to Cloud Run

```bash
gcloud run deploy sidney-frontend \
  --image=gcr.io/project-sidney-prod/sidney-frontend:latest \
  --region=us-central1 \
  --project=project-sidney-prod \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --max-instances=10 \
  --min-instances=0 \
  --set-env-vars="VITE_API_URL=$BACKEND_URL"
```

Get the frontend URL:
```bash
FRONTEND_URL=$(gcloud run services describe sidney-frontend \
  --region=us-central1 \
  --project=project-sidney-prod \
  --format='value(status.url)')
echo "Frontend URL: $FRONTEND_URL"
```

---

## Step 5: Initialize Database Schema

### Start Cloud SQL Proxy

```bash
./cloud_sql_proxy -instances="project-sidney-prod:us-central1:sidney-postgres"=tcp:5432 &
```

### Load Schema

```bash
PGPASSWORD="[SECURE_PASSWORD]" psql \
  -h localhost \
  -p 5432 \
  -U admin \
  -d sidney_db \
  < database/schema.sql
```

### Load Seed Data

```bash
# Load categories
PGPASSWORD="[SECURE_PASSWORD]" psql \
  -h localhost \
  -p 5432 \
  -U admin \
  -d sidney_db \
  < database/seeds/seed_categories.sql

# Load questions
PGPASSWORD="[SECURE_PASSWORD]" psql \
  -h localhost \
  -p 5432 \
  -U admin \
  -d sidney_db \
  < database/seeds/seed_development_m2m.sql
```

### Verify Data Loaded

```bash
PGPASSWORD="[SECURE_PASSWORD]" psql \
  -h localhost \
  -p 5432 \
  -U admin \
  -d sidney_db \
  -c "SELECT COUNT(*) as questions FROM questions; SELECT COUNT(*) as categories FROM categories;"
```

---

## Step 6: Cleanup Old Sydney Services (if they exist)

```bash
# Delete old services
gcloud run services delete sydney-backend \
  --region=us-central1 \
  --project=project-sidney-prod \
  --quiet 2>/dev/null || echo "sydney-backend not found"

gcloud run services delete sydney-frontend \
  --region=us-central1 \
  --project=project-sidney-prod \
  --quiet 2>/dev/null || echo "sydney-frontend not found"

# Delete old images
gcloud container images delete \
  gcr.io/project-sidney-prod/sydney-backend:latest \
  --project=project-sidney-prod \
  --quiet 2>/dev/null || echo "sydney-backend image not found"

gcloud container images delete \
  gcr.io/project-sidney-prod/sydney-frontend:latest \
  --project=project-sidney-prod \
  --quiet 2>/dev/null || echo "sydney-frontend image not found"
```

---

## Verification

### Check Services Are Running

```bash
gcloud run services list --region=us-central1 --project=project-sidney-prod
```

Should show:
- `sidney-backend` - READY
- `sidney-frontend` - READY

### Test Backend API

```bash
curl -s "$BACKEND_URL/api/health" | jq .
```

### Test User Registration

```bash
curl -X POST "$BACKEND_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"Test1234!",
    "username":"testuser",
    "first_name":"Test",
    "last_name":"User"
  }' | jq .
```

### Test Login

```bash
curl -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"Test1234!"
  }' | jq .
```

### Visit Frontend

Open in browser: `$FRONTEND_URL`

---

## Environment Variables Reference

### Backend Requires:
```
NODE_ENV=production
DB_HOST=/cloudsql/project-sidney-prod:us-central1:sidney-postgres
DB_PORT=5432
DB_NAME=sidney_db
DB_USER=admin
DB_PASSWORD=[secure password from Cloud SQL]
JWT_SECRET=[secure random string]
```

### Frontend Requires:
```
VITE_API_URL=https://[backend-cloud-run-url]
```

---

## Database Connection via Cloud SQL Proxy

For local development or troubleshooting:

```bash
# Start proxy (in background)
./cloud_sql_proxy -instances="project-sidney-prod:us-central1:sidney-postgres"=tcp:5432 &

# Connect via psql
PGPASSWORD="[password]" psql -h localhost -p 5432 -U admin -d sidney_db

# Show tables
\dt

# Check question count
SELECT COUNT(*) FROM questions;
SELECT COUNT(*) FROM categories;
```

---

## Monitoring & Logs

### Backend Logs
```bash
gcloud run logs read sidney-backend \
  --region=us-central1 \
  --project=project-sidney-prod \
  --limit=50
```

### Frontend Logs
```bash
gcloud run logs read sidney-frontend \
  --region=us-central1 \
  --project=project-sidney-prod \
  --limit=50
```

### Real-time Logs
```bash
gcloud run logs read sidney-backend \
  --region=us-central1 \
  --project=project-sidney-prod \
  --stream
```

---

## Troubleshooting

### Service Fails to Deploy
- Check logs: `gcloud run logs read [service] --region=us-central1 --stream`
- Verify environment variables are set correctly
- Ensure Cloud SQL instance is running: `gcloud sql instances describe sidney-postgres`

### Database Connection Refused
- Ensure Cloud SQL instance is running
- Verify Cloud SQL Proxy is running (local testing)
- Check firewall rules allow Cloud Run → Cloud SQL

### Frontend Can't Reach Backend
- Verify `VITE_API_URL` env var in frontend
- Check CORS is configured in backend
- Test API directly from browser console

### Old Sydney Services Still Showing
- They were auto-deleted by the deployment script
- If not, run cleanup commands in Step 6

---

## Quick Links

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/arielden/project_sidney |
| Docker Hub | https://hub.docker.com/r/arieldenaro/ |
| GCP Console | https://console.cloud.google.com |
| Full Deployment Guide | GCP_DEPLOYMENT.md |
| Quick Reference | GCP_DEPLOYMENT_QUICKREF.md |

---

**Date**: December 23, 2025  
**Status**: Ready for Manual Deployment  
**Project**: Sidney SAT Learning Platform
