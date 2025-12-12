#!/bin/bash

# Deploy to Cloud Run
set -e

PROJECT_ID="project-sidney-prod"
REGION="us-central1"
DB_INSTANCE="sydney-postgres"

echo "==============================================="
echo "Sydney SAT - Cloud Run Deployment"
echo "==============================================="
echo ""

# Step 1: Deploy Backend
echo "[1/4] Deploying Backend Service..."
gcloud run deploy sydney-backend \
  --image=gcr.io/${PROJECT_ID}/sydney-backend:latest \
  --platform=managed \
  --region=${REGION} \
  --port=3000 \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=300 \
  --add-cloudsql-instances=${PROJECT_ID}:${REGION}:${DB_INSTANCE} \
  --set-env-vars="NODE_ENV=production,DATABASE_URL=postgresql://sydney_user:Sydney2024SecurePass!@localhost/sydney_db?host=/cloudsql/${PROJECT_ID}:${REGION}:${DB_INSTANCE}" \
  --no-allow-unauthenticated \
  --quiet

echo "✅ Backend deployed"
echo ""

# Get backend URL
BACKEND_URL=$(gcloud run services describe sydney-backend --region=${REGION} --format='value(status.url)')
echo "Backend URL: $BACKEND_URL"

# Step 2: Deploy Frontend
echo ""
echo "[2/4] Deploying Frontend Service..."
gcloud run deploy sydney-frontend \
  --image=gcr.io/${PROJECT_ID}/sydney-frontend:latest \
  --platform=managed \
  --region=${REGION} \
  --port=80 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=60 \
  --set-env-vars="VITE_API_URL=${BACKEND_URL}" \
  --no-allow-unauthenticated \
  --quiet

echo "✅ Frontend deployed"
echo ""

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe sydney-frontend --region=${REGION} --format='value(status.url)')
echo "Frontend URL: $FRONTEND_URL"

# Step 3: Make services public
echo ""
echo "[3/4] Making services publicly accessible..."

gcloud run services add-iam-policy-binding sydney-backend \
  --region=${REGION} \
  --member=allUsers \
  --role=roles/run.invoker \
  --quiet 2>/dev/null || echo "Backend already public"

gcloud run services add-iam-policy-binding sydney-frontend \
  --region=${REGION} \
  --member=allUsers \
  --role=roles/run.invoker \
  --quiet 2>/dev/null || echo "Frontend already public"

echo "✅ Services are now public"
echo ""

# Step 4: Display summary
echo "==============================================="
echo "[4/4] Deployment Complete!"
echo "==============================================="
echo ""
echo "📊 Service URLs:"
echo "  Frontend: $FRONTEND_URL"
echo "  Backend:  $BACKEND_URL"
echo ""
echo "⚠️  IMPORTANT - Next Step:"
echo ""
echo "Apply the complete database schema with:"
echo "  ./cloud_sql_proxy -instances=\"${PROJECT_ID}:${REGION}:${DB_INSTANCE}\"=tcp:5433 &"
echo "  sleep 3"
echo "  PGPASSWORD=\"Sydney2024SecurePass!\" psql -h localhost -p 5433 \\"
echo "    -U sydney_user -d sydney_db -f database/migrations/005_full_schema_complete.sql"
echo ""
echo "==============================================="
