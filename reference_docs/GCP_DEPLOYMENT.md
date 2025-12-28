# GCP Deployment Guide for Sidney (Step-by-step) 🚀

**Purpose:** This document lists exact, copyable commands and notes to deploy the Sidney project to Google Cloud Platform (Cloud Run + Cloud SQL) and seed the DB with the provided schema and seeds.

---

> ⚠️ WARNING: Many of the commands below are destructive (delete services/databases). Double-check project/region and run them intentionally.

## Variables

Change these variables at the top before running commands:

```bash
PROJECT=project-sidney-prod
REGION=us-central1
DB_INSTANCE=sidney-postgres
DB_NAME=sidney_db
DB_USER=admin
DB_PASS='Sidney2024Secure'
BACKEND_IMAGE=gcr.io/$PROJECT/sidney-backend:1.0.0
FRONTEND_IMAGE=gcr.io/$PROJECT/sidney-frontend:1.0.0
```

---

## 0) Prep / Enable APIs 🔧

```bash
gcloud services enable \
  sqladmin.googleapis.com \
  run.googleapis.com \
  iam.googleapis.com \
  containerregistry.googleapis.com \
  --project="$PROJECT"
```

---

## 1) Login & Project setup 🔐

```bash
# Authenticate and set project
gcloud auth login
gcloud config set project $PROJECT

# Confirm
gcloud auth list --filter=status:ACTIVE --format='value(account)'
gcloud config get-value project

gcloud auth configure-docker --quiet  # enable Docker->GCR auth
```

---

## 2) Inspect current resources 🔎

```bash
# Cloud Run services
gcloud run services list --platform=managed --region="$REGION" --project="$PROJECT"

# Cloud Run jobs (if any)
gcloud run jobs list --region="$REGION" --project="$PROJECT"

# Cloud SQL instances
gcloud sql instances list --project="$PROJECT"

# Container images
gcloud container images list --repository=gcr.io/$PROJECT || true
```

---

## 3) Delete every service (destructive) ⚠️

Carefully review the names printed by the commands first.

```bash
# Delete all Cloud Run services in the region
for s in $(gcloud run services list --platform=managed --region="$REGION" --project="$PROJECT" --format='value(metadata.name)'); do
  echo "Deleting Cloud Run service: $s"
  gcloud run services delete "$s" --region="$REGION" --project="$PROJECT" --quiet
done

# Delete all Cloud Run jobs (if used)
for j in $(gcloud run jobs list --region="$REGION" --project="$PROJECT" --format='value(metadata.name)'); do
  echo "Deleting Cloud Run job: $j"
  gcloud run jobs delete "$j" --region="$REGION" --project="$PROJECT" --quiet
done

# Delete Cloud SQL instance (if you intend to remove DB)
gcloud sql instances delete $DB_INSTANCE --project="$PROJECT" --quiet

# (Optional) Delete container images
gcloud container images delete gcr.io/$PROJECT/sidney-backend --force-delete-tags --quiet || true
gcloud container images delete gcr.io/$PROJECT/sidney-frontend --force-delete-tags --quiet || true
```

> Tip: If you want a safer workflow, remove services one-by-one instead of the loops above.

---

## 4) Build & push Docker images (backend + frontend) 📦

Build and push backend:

```bash
# Backend (from repo root)
cd backend
docker build -t $BACKEND_IMAGE .
docker push $BACKEND_IMAGE
cd ..
```

Build frontend (placeholder backend URL; will be rebuilt after backend deploy):

```bash
# Frontend (from repo root)
docker build -t $FRONTEND_IMAGE --build-arg VITE_API_URL="https://example" .
docker push $FRONTEND_IMAGE
```

---

## 5) Create Cloud SQL instance, DB and user 🗄️

```bash
# Create instance (may take a few minutes)
gcloud sql instances create $DB_INSTANCE \
  --database-version=POSTGRES_15 --tier=db-g1-small --region="$REGION" --project="$PROJECT" --quiet

# Wait for instance to be RUNNABLE (check status)
gcloud sql instances describe $DB_INSTANCE --project="$PROJECT" --format='value(state)'

# If still PENDING_CREATE, wait and retry. If FAILED, delete and recreate with a different tier (e.g., db-f1-micro if quota allows).

# Create DB
gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE --project=$PROJECT

# Create admin user
gcloud sql users create $DB_USER --instance=$DB_INSTANCE --password="$DB_PASS" --project=$PROJECT --quiet
```

---

## 6) Deploy backend to Cloud Run (connected to Cloud SQL) 🚀

```bash
gcloud run deploy sidney-backend \
  --image=$BACKEND_IMAGE \
  --region=$REGION --platform=managed --allow-unauthenticated \
  --memory=1Gi --cpu=1 --max-instances=10 --min-instances=0 \
  --add-cloudsql-instances=$PROJECT:$REGION:$DB_INSTANCE \
  --set-env-vars="NODE_ENV=production,DB_HOST=/cloudsql/$PROJECT:$REGION:$DB_INSTANCE,DB_PORT=5432,DB_NAME=$DB_NAME,DB_USER=$DB_USER,DB_PASSWORD=$DB_PASS,JWT_SECRET=sidney-jwt-key-2024" \
  --project=$PROJECT --quiet

# Retrieve backend URL
BACKEND_URL=$(gcloud run services describe sidney-backend --region=$REGION --project=$PROJECT --format='value(status.url)')
echo "Backend URL: $BACKEND_URL"
```

### Grant Cloud Run service account Cloud SQL Client role (if needed)

```bash
# Get service account used by the Cloud Run service
SA=$(gcloud run services describe sidney-backend --region=$REGION --project=$PROJECT --format='value(spec.template.spec.serviceAccountName)')

# Bind role (corrected format)
gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:${SA}" \
  --role="roles/cloudsql.client"
```

---

## 7) Rebuild & deploy frontend with actual backend URL 🔁

```bash
# Rebuild frontend with correct API url (add /api suffix if your frontend expects it)
docker build -t $FRONTEND_IMAGE --build-arg VITE_API_URL="${BACKEND_URL}/api" .
docker push $FRONTEND_IMAGE

# Deploy frontend
gcloud run deploy sidney-frontend \
  --image=$FRONTEND_IMAGE \
  --region=$REGION --platform=managed --allow-unauthenticated \
  --memory=512Mi --cpu=1 \
  --set-env-vars="VITE_API_URL=${BACKEND_URL}/api" \
  --project=$PROJECT --quiet

# Retrieve frontend URL
gcloud run services describe sidney-frontend --region=$REGION --project=$PROJECT --format='value(status.url)'
```

---

## 8) Seed the database (use Cloud SQL Proxy) 🌱

Start the Cloud SQL Proxy (unix socket mode), then run the SQL scripts included in this repo (`database/schema.sql`, `database/seeds/seed_categories.sql`, `database/seeds/seed_development_m2m.sql`):

```bash
# Download or ensure cloud_sql_proxy binary is present
./cloud_sql_proxy -dir=/tmp/cloudsql -instances="$PROJECT:$REGION:$DB_INSTANCE" > /tmp/proxy.log 2>&1 &
PROXY_PID=$!
sleep 4

SOCKET_PATH="/tmp/cloudsql/$PROJECT:$REGION:$DB_INSTANCE"

# Load schema and seeds
PGPASSWORD="$DB_PASS" psql -h "$SOCKET_PATH" -U $DB_USER -d $DB_NAME < database/schema.sql
PGPASSWORD="$DB_PASS" psql -h "$SOCKET_PATH" -U $DB_USER -d $DB_NAME < database/seeds/seed_categories.sql
PGPASSWORD="$DB_PASS" psql -h "$SOCKET_PATH" -U $DB_USER -d $DB_NAME < database/seeds/seed_development_m2m.sql

# Optional verification
PGPASSWORD="$DB_PASS" psql -h "$SOCKET_PATH" -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM categories;"
PGPASSWORD="$DB_PASS" psql -h "$SOCKET_PATH" -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM questions;"

# Stop proxy
kill $PROXY_PID || true
```

> Alternative: you can use `gcloud sql connect $DB_INSTANCE --user=$DB_USER --project=$PROJECT` and `\i` to import files interactively.

---

## 9) Quick health checks ✅

```bash
# Backend health check
curl "${BACKEND_URL}/api/health"

# List Cloud Run services
gcloud run services list --platform=managed --region="$REGION" --project="$PROJECT"

# Example DB check via proxy
PGPASSWORD="$DB_PASS" psql -h "$SOCKET_PATH" -U $DB_USER -d $DB_NAME -c "SELECT NOW();"
```

---

## Troubleshooting & Tips 💡

- If Docker push fails, run `gcloud auth configure-docker` and confirm your gcloud account has permission to push to GCR.
- If Cloud SQL creation fails or gets stuck in PENDING_CREATE/FAILED state, delete the instance and try recreating with a different tier (e.g., db-f1-micro if db-g1-small fails, or vice versa). Ensure billing is enabled and you have sufficient quota.
- If Cloud SQL creation is slow, run `gcloud sql instances describe $DB_INSTANCE --project=$PROJECT` to check the state. Wait until it's RUNNABLE before proceeding to create DB/user.
- Ensure the Cloud Run service account has `roles/cloudsql.client` to connect to the DB. The IAM binding command was corrected to use the proper service account email format.
- If migration/seed SQL files fail, open them and check for syntax tailored to your Postgres version.
- For container image deletion, use `--force-delete-tags` if the command fails due to tag dependencies.

---

## Checklist

- [ ] Confirm `gcloud` login & project
- [ ] Build and push backend image
- [ ] Create Cloud SQL instance & DB (wait for RUNNABLE status)
- [ ] Deploy backend to Cloud Run (connect to Cloud SQL)
- [ ] Rebuild & deploy frontend pointing to backend
- [ ] Seed DB with `database/schema.sql` and seeds
- [ ] Verify counts and endpoints

---

If you want, I can generate a small `deploy.sh` wrapper to run these steps interactively and add safety prompts. Let me know if you want that.
