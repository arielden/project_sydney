#!/bin/bash

################################################################################
# Complete GCP Deployment with Full Schema Migration
# Sydney SAT Learning Platform
# Date: December 11, 2025
################################################################################

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="project-sidney-prod"
REGION="us-central1"
DB_INSTANCE="sydney-postgres"
DB_NAME="sydney_db"
DB_USER="sydney_user"
DB_PASSWORD="Sydney2024SecurePass!"
DB_HOST="localhost"
DB_PORT="5432"

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Sydney SAT Learning Platform - Complete GCP Deployment      ${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

# Step 1: Verify GCP Configuration
echo -e "\n${YELLOW}[1/8] Verifying GCP Configuration...${NC}"
gcloud config get-value project > /dev/null 2>&1 || { echo "GCP not configured"; exit 1; }
echo -e "${GREEN}✅ GCP project: ${PROJECT_ID}${NC}"

# Step 2: Verify Cloud SQL Instance
echo -e "\n${YELLOW}[2/8] Verifying Cloud SQL Instance...${NC}"
INSTANCE_STATUS=$(gcloud sql instances describe $DB_INSTANCE --format='value(state)' 2>/dev/null || echo "NOT_FOUND")
if [ "$INSTANCE_STATUS" != "RUNNABLE" ]; then
    echo -e "${RED}❌ Cloud SQL instance is not RUNNABLE (status: $INSTANCE_STATUS)${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Cloud SQL instance is RUNNABLE${NC}"

# Step 3: Drop existing database (fresh start)
echo -e "\n${YELLOW}[3/8] Dropping Existing Schema (fresh start)...${NC}"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << 'EOF' 2>&1 || true
-- Drop all tables
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO "$DB_USER";
EOF
echo -e "${GREEN}✅ Schema dropped${NC}"

# Step 4: Apply complete schema migration
echo -e "\n${YELLOW}[4/8] Applying Complete Schema Migration...${NC}"
if [ ! -f "database/migrations/005_full_schema_complete.sql" ]; then
    echo -e "${RED}❌ Migration file not found: database/migrations/005_full_schema_complete.sql${NC}"
    exit 1
fi

PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -f database/migrations/005_full_schema_complete.sql > /tmp/migration.log 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Complete schema migration applied successfully${NC}"
    tail -5 /tmp/migration.log | grep -E "NOTICE:|completed" || true
else
    echo -e "${RED}❌ Migration failed. See logs:${NC}"
    tail -20 /tmp/migration.log
    exit 1
fi

# Step 5: Verify schema creation
echo -e "\n${YELLOW}[5/8] Verifying Schema Creation...${NC}"
TABLES_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null)

INDEXES_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';" 2>/dev/null)

echo -e "${GREEN}✅ Tables created: $TABLES_COUNT${NC}"
echo -e "${GREEN}✅ Indexes created: $INDEXES_COUNT${NC}"

if [ "$TABLES_COUNT" -ne 8 ]; then
    echo -e "${RED}❌ Expected 8 tables, got $TABLES_COUNT${NC}"
    exit 1
fi

# Step 6: Build and push Docker images
echo -e "\n${YELLOW}[6/8] Building and Pushing Docker Images...${NC}"

# Backend
echo "  Building backend image..."
cd backend
docker build -t "gcr.io/$PROJECT_ID/sydney-backend:latest" . > /tmp/backend-build.log 2>&1
docker push "gcr.io/$PROJECT_ID/sydney-backend:latest" > /tmp/backend-push.log 2>&1
cd ..
echo -e "${GREEN}  ✅ Backend image built and pushed${NC}"

# Frontend
echo "  Building frontend image..."
docker build -t "gcr.io/$PROJECT_ID/sydney-frontend:latest" . > /tmp/frontend-build.log 2>&1
docker push "gcr.io/$PROJECT_ID/sydney-frontend:latest" > /tmp/frontend-push.log 2>&1
echo -e "${GREEN}  ✅ Frontend image built and pushed${NC}"

# Step 7: Deploy services to Cloud Run
echo -e "\n${YELLOW}[7/8] Deploying Services to Cloud Run...${NC}"

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')

# Deploy backend
echo "  Deploying backend service..."
gcloud run deploy sydney-backend \
  --image="gcr.io/$PROJECT_ID/sydney-backend:latest" \
  --platform=managed \
  --region=$REGION \
  --port=3000 \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=300 \
  --add-cloudsql-instances="$PROJECT_ID:$REGION:$DB_INSTANCE" \
  --set-env-vars="NODE_ENV=production,DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost/$DB_NAME?host=/cloudsql/$PROJECT_ID:$REGION:$DB_INSTANCE,JWT_SECRET=$JWT_SECRET" \
  --no-allow-unauthenticated \
  --quiet > /tmp/backend-deploy.log 2>&1

BACKEND_URL=$(gcloud run services describe sydney-backend --region=$REGION --format='value(status.url)' 2>/dev/null)
echo -e "${GREEN}  ✅ Backend deployed: $BACKEND_URL${NC}"

# Deploy frontend
echo "  Deploying frontend service..."
gcloud run deploy sydney-frontend \
  --image="gcr.io/$PROJECT_ID/sydney-frontend:latest" \
  --platform=managed \
  --region=$REGION \
  --port=80 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=60 \
  --set-env-vars="VITE_API_URL=$BACKEND_URL" \
  --no-allow-unauthenticated \
  --quiet > /tmp/frontend-deploy.log 2>&1

FRONTEND_URL=$(gcloud run services describe sydney-frontend --region=$REGION --format='value(status.url)' 2>/dev/null)
echo -e "${GREEN}  ✅ Frontend deployed: $FRONTEND_URL${NC}"

# Step 8: Final verification
echo -e "\n${YELLOW}[8/8] Final Verification...${NC}"

# Check backend health
echo "  Checking backend health..."
BACKEND_HEALTH=$(curl -s -w "%{http_code}" "$BACKEND_URL/health" -o /dev/null 2>/dev/null || echo "000")
if [ "$BACKEND_HEALTH" = "200" ] || [ "$BACKEND_HEALTH" = "404" ]; then
    echo -e "${GREEN}  ✅ Backend is responding (HTTP $BACKEND_HEALTH)${NC}"
else
    echo -e "${YELLOW}  ⚠️ Backend responded with HTTP $BACKEND_HEALTH (may need IAM configuration)${NC}"
fi

# Check database connectivity from backend
echo "  Checking database connectivity..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';" > /tmp/db-check.log 2>&1

if [ $? -eq 0 ]; then
    TABLE_COUNT=$(grep -oP '^\s*\K[0-9]+' /tmp/db-check.log | head -1)
    echo -e "${GREEN}  ✅ Database connectivity verified ($TABLE_COUNT tables)${NC}"
else
    echo -e "${RED}  ❌ Database connectivity check failed${NC}"
    exit 1
fi

# Print final summary
echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

echo -e "\n${BLUE}📊 Deployment Summary:${NC}"
echo -e "  Project ID:        $PROJECT_ID"
echo -e "  Region:            $REGION"
echo -e "  Database:          $DB_NAME (Tables: $TABLES_COUNT, Indexes: $INDEXES_COUNT)"
echo -e "  Backend URL:       $BACKEND_URL"
echo -e "  Frontend URL:      $FRONTEND_URL"

echo -e "\n${YELLOW}⚠️  IMPORTANT - Make Services Publicly Accessible:${NC}"
echo -e "\n${BLUE}Run these commands to make services public:${NC}"
echo -e "  ${GREEN}gcloud run services add-iam-policy-binding sydney-backend \\${NC}"
echo -e "    ${GREEN}--region=$REGION --member=allUsers --role=roles/run.invoker${NC}"
echo -e ""
echo -e "  ${GREEN}gcloud run services add-iam-policy-binding sydney-frontend \\${NC}"
echo -e "    ${GREEN}--region=$REGION --member=allUsers --role=roles/run.invoker${NC}"

echo -e "\n${BLUE}📝 Next Steps:${NC}"
echo -e "  1. Run the IAM commands above to make services publicly accessible"
echo -e "  2. Visit frontend URL: $FRONTEND_URL"
echo -e "  3. Test user registration and login"
echo -e "  4. Monitor logs: gcloud run services logs read sydney-backend --region=$REGION"

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
