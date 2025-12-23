#!/bin/bash
# Sidney SAT Platform - Complete GCP Deployment Script
# Date: December 23, 2025
# Purpose: Deploy Sidney platform to Google Cloud Platform, removing old Sydney services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="project-sidney-prod"
REGION="us-central1"
BACKEND_SERVICE="sidney-backend"
FRONTEND_SERVICE="sidney-frontend"
DB_INSTANCE="sidney-postgres"
DB_NAME="sidney_db"
DB_USER="admin"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Sidney SAT Platform - GCP Deployment${NC}"
echo -e "${BLUE}========================================${NC}"

# Set GCP project
echo -e "\n${YELLOW}Setting GCP project...${NC}"
gcloud config set project $PROJECT_ID

# Step 1: Build and Push Docker Images
echo -e "\n${BLUE}[STEP 1] Building and pushing Docker images...${NC}"

echo -e "${YELLOW}Building Backend image...${NC}"
docker build -t gcr.io/$PROJECT_ID/$BACKEND_SERVICE:latest backend/
docker push gcr.io/$PROJECT_ID/$BACKEND_SERVICE:latest
docker tag gcr.io/$PROJECT_ID/$BACKEND_SERVICE:latest gcr.io/$PROJECT_ID/$BACKEND_SERVICE:1.0.0
docker push gcr.io/$PROJECT_ID/$BACKEND_SERVICE:1.0.0
echo -e "${GREEN}✓ Backend images pushed${NC}"

echo -e "${YELLOW}Building Frontend image...${NC}"
docker build -t gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:latest .
docker push gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:latest
docker tag gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:latest gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:1.0.0
docker push gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:1.0.0
echo -e "${GREEN}✓ Frontend images pushed${NC}"

# Step 2: Delete Old Sydney Services
echo -e "\n${BLUE}[STEP 2] Cleaning up old Sydney services...${NC}"

echo -e "${YELLOW}Deleting old sydney-backend service...${NC}"
gcloud run services delete sydney-backend --region=$REGION --quiet 2>/dev/null || echo -e "${YELLOW}(service not found)${NC}"
echo -e "${GREEN}✓ Old backend service removed${NC}"

echo -e "${YELLOW}Deleting old sydney-frontend service...${NC}"
gcloud run services delete sydney-frontend --region=$REGION --quiet 2>/dev/null || echo -e "${YELLOW}(service not found)${NC}"
echo -e "${GREEN}✓ Old frontend service removed${NC}"

echo -e "${YELLOW}Deleting old sydney container images...${NC}"
gcloud container images delete gcr.io/$PROJECT_ID/sydney-backend:latest --quiet 2>/dev/null || echo -e "${YELLOW}(image not found)${NC}"
gcloud container images delete gcr.io/$PROJECT_ID/sydney-frontend:latest --quiet 2>/dev/null || echo -e "${YELLOW}(image not found)${NC}"
echo -e "${GREEN}✓ Old images removed${NC}"

# Step 3: Deploy Backend Service
echo -e "\n${BLUE}[STEP 3] Deploying Backend service to Cloud Run...${NC}"

# Load environment variables
if [ -f .env.prod ]; then
  source .env.prod
else
  echo -e "${RED}ERROR: .env.prod file not found${NC}"
  exit 1
fi

gcloud run deploy $BACKEND_SERVICE \
  --image=gcr.io/$PROJECT_ID/$BACKEND_SERVICE:latest \
  --region=$REGION \
  --allow-unauthenticated \
  --memory=1Gi \
  --cpu=1 \
  --max-instances=10 \
  --min-instances=0 \
  --add-cloudsql-instances=$PROJECT_ID:$REGION:$DB_INSTANCE \
  --set-env-vars="NODE_ENV=production,DB_HOST=/cloudsql/$PROJECT_ID:$REGION:$DB_INSTANCE,DB_PORT=5432,DB_NAME=$DB_NAME,DB_USER=$DB_USER,DB_PASSWORD=$POSTGRES_PASSWORD,JWT_SECRET=$JWT_SECRET,PORT=3000"

echo -e "${GREEN}✓ Backend service deployed${NC}"

# Get backend URL
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region=$REGION --format='value(status.url)')
echo -e "${BLUE}Backend URL: $BACKEND_URL${NC}"

# Step 4: Deploy Frontend Service
echo -e "\n${BLUE}[STEP 4] Deploying Frontend service to Cloud Run...${NC}"

gcloud run deploy $FRONTEND_SERVICE \
  --image=gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:latest \
  --region=$REGION \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --max-instances=10 \
  --min-instances=0 \
  --set-env-vars="VITE_API_URL=$BACKEND_URL"

echo -e "${GREEN}✓ Frontend service deployed${NC}"

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE --region=$REGION --format='value(status.url)')
echo -e "${BLUE}Frontend URL: $FRONTEND_URL${NC}"

# Step 5: Database Setup Confirmation
echo -e "\n${BLUE}[STEP 5] Database status check...${NC}"

# Check if database exists
if gcloud sql instances describe $DB_INSTANCE --region=$REGION &>/dev/null; then
  echo -e "${GREEN}✓ Cloud SQL instance exists: $DB_INSTANCE${NC}"
  
  # Check if database exists
  if gcloud sql databases describe $DB_NAME --instance=$DB_INSTANCE &>/dev/null; then
    echo -e "${GREEN}✓ Database exists: $DB_NAME${NC}"
  else
    echo -e "${YELLOW}Creating database: $DB_NAME${NC}"
    gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE
    echo -e "${GREEN}✓ Database created${NC}"
  fi
else
  echo -e "${RED}ERROR: Cloud SQL instance not found: $DB_INSTANCE${NC}"
  echo -e "${YELLOW}Please create the instance manually:${NC}"
  echo "gcloud sql instances create $DB_INSTANCE --database-version=POSTGRES_15 --tier=db-f1-micro --region=$REGION"
  exit 1
fi

# Step 6: Output Summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✓ DEPLOYMENT COMPLETE!${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "\n${BLUE}Deployment Summary:${NC}"
echo -e "${GREEN}✓ Old Sydney services removed${NC}"
echo -e "${GREEN}✓ New Sidney services deployed${NC}"
echo -e "${GREEN}✓ Backend service: $BACKEND_SERVICE${NC}"
echo -e "${GREEN}✓ Frontend service: $FRONTEND_SERVICE${NC}"

echo -e "\n${BLUE}Service URLs:${NC}"
echo -e "${YELLOW}Frontend: $FRONTEND_URL${NC}"
echo -e "${YELLOW}Backend:  $BACKEND_URL${NC}"

echo -e "\n${BLUE}Next Steps:${NC}"
echo -e "1. Initialize database schema:"
echo -e "   ./cloud_sql_proxy -instances='$PROJECT_ID:$REGION:$DB_INSTANCE'=tcp:5432 &"
echo -e "   PGPASSWORD='$DB_PASSWORD' psql -h localhost -p 5432 -U $DB_USER -d $DB_NAME < database/schema.sql"
echo -e ""
echo -e "2. Load seed data:"
echo -e "   PGPASSWORD='$DB_PASSWORD' psql -h localhost -p 5432 -U $DB_USER -d $DB_NAME < database/seeds/seed_categories.sql"
echo -e "   PGPASSWORD='$DB_PASSWORD' psql -h localhost -p 5432 -U $DB_USER -d $DB_NAME < database/seeds/seed_development_m2m.sql"
echo -e ""
echo -e "3. Visit the frontend:"
echo -e "   $FRONTEND_URL"
echo -e ""
echo -e "${BLUE}Monitoring:${NC}"
echo -e "gcloud run logs read $BACKEND_SERVICE --region=$REGION --limit=50"
echo -e "gcloud run logs read $FRONTEND_SERVICE --region=$REGION --limit=50"

echo -e "\n${BLUE}========================================${NC}"
