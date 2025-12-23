# Sidney Deployment Scripts

## Available Scripts

### deploy-gcp-sidney.sh
Main deployment script for Google Cloud Platform.

**Usage:**
```bash
./deploy-gcp-sidney.sh
```

**What it does:**
- Enables required GCP APIs (Cloud SQL, Cloud Run, Compute)
- Creates Cloud SQL instance (sidney-postgres)
- Creates database (sidney_db)
- Creates database user (admin)
- Deploys backend service to Cloud Run
- Deploys frontend service to Cloud Run
- Initializes database schema and seed data

**Prerequisites:**
- gcloud CLI installed and authenticated
- GCP project configured (project-sidney-prod)
- Docker images already pushed to GCR

---

## Manual Deployment

For step-by-step manual deployment instructions, see **DEPLOYMENT_GUIDE.md** in the project root.
