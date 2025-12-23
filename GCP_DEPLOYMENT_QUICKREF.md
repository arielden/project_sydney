# 🚀 Sidney GCP Deployment - Quick Reference

## 📋 Pre-Deployment Checklist

- [ ] GCP Project: `project-sidney-prod` created
- [ ] Cloud SQL instance: `sidney-postgres` created (db-f1-micro)
- [ ] Cloud SQL database: `sidney_db` created
- [ ] Cloud SQL user: `admin` created with password
- [ ] `.env.prod` file configured with credentials
- [ ] Docker images pushed to gcr.io
- [ ] GitHub branch: `phase3` up to date

## ⚡ Quick Deployment (5 min)

```bash
cd /media/arielden/DATA-M2/Projects/Software/project_sidney

# Make script executable
chmod +x scripts/deploy-gcp-sidney.sh

# Run deployment
./scripts/deploy-gcp-sidney.sh
```

## 📊 What Gets Deployed

| Component | Details |
|-----------|---------|
| **Backend** | Node.js/Express, 1Gi, 1 CPU, 0-10 auto-scale |
| **Frontend** | React/Vite, 512Mi, 1 CPU, 0-10 auto-scale |
| **Database** | PostgreSQL 15, db-f1-micro, Cloud SQL |
| **Region** | us-central1 (Iowa) |
| **Access** | Publicly accessible (unauthenticated) |

## 🗄️ Database Setup (After Deployment)

```bash
# Start Cloud SQL Proxy
./cloud_sql_proxy -instances="project-sidney-prod:us-central1:sidney-postgres"=tcp:5432 &

# Load schema
PGPASSWORD="[YOUR_PASSWORD]" psql -h localhost -p 5432 -U admin -d sidney_db < database/schema.sql

# Load seed data
PGPASSWORD="[YOUR_PASSWORD]" psql -h localhost -p 5432 -U admin -d sidney_db < database/seeds/seed_categories.sql
PGPASSWORD="[YOUR_PASSWORD]" psql -h localhost -p 5432 -U admin -d sidney_db < database/seeds/seed_development_m2m.sql

# Verify
PGPASSWORD="[YOUR_PASSWORD]" psql -h localhost -p 5432 -U admin -d sidney_db -c "SELECT COUNT(*) FROM questions;"
```

## 🧹 Cleanup Old Sydney Services

```bash
# Delete old services
gcloud run services delete sydney-backend --region=us-central1 --quiet
gcloud run services delete sydney-frontend --region=us-central1 --quiet

# Delete old images
gcloud container images delete gcr.io/project-sidney-prod/sydney-backend:latest --quiet
gcloud container images delete gcr.io/project-sidney-prod/sydney-frontend:latest --quiet

# Delete old instance (if separate)
gcloud sql instances delete sydney-postgres --quiet
```

## 📡 Verify Deployment

```bash
# Check services
gcloud run services list --region=us-central1 | grep sidney

# Check logs
gcloud run logs read sidney-backend --region=us-central1 --limit=20
gcloud run logs read sidney-frontend --region=us-central1 --limit=20

# Get URLs
gcloud run services describe sidney-backend --region=us-central1 --format='value(status.url)'
gcloud run services describe sidney-frontend --region=us-central1 --format='value(status.url)'
```

## 🧪 Test Deployment

```bash
# Get frontend URL
FRONTEND_URL=$(gcloud run services describe sidney-frontend --region=us-central1 --format='value(status.url)')
BACKEND_URL=$(gcloud run services describe sidney-backend --region=us-central1 --format='value(status.url)')

# Test backend is up
curl -s $BACKEND_URL/api/health | jq .

# Open frontend in browser
echo "Visit: $FRONTEND_URL"
```

## 📊 Database Content

After seeding:
- **Categories**: 18 SAT Math categories
- **Questions**: 29 sample questions (Easy, Medium, Hard, Very Hard)
- **Relationships**: 29 question-category mappings
- **Users**: Ready for registration

## 🔗 Important URLs

| Service | Type | Status |
|---------|------|--------|
| Frontend | React/Vite | Cloud Run |
| Backend | Node.js/Express | Cloud Run |
| Database | PostgreSQL 15 | Cloud SQL |
| Container Registry | GCR | gcr.io/project-sidney-prod |

## 📝 Environment Variables

**Backend** needs:
```
NODE_ENV=production
DB_HOST=/cloudsql/project-sidney-prod:us-central1:sidney-postgres
DB_NAME=sidney_db
DB_USER=admin
DB_PASSWORD=[SECURE]
JWT_SECRET=[SECURE]
```

**Frontend** needs:
```
VITE_API_URL=https://[BACKEND_CLOUD_RUN_URL]
```

## 🆘 Troubleshooting

### Service won't start
```bash
# Check logs
gcloud run logs read sidney-backend --region=us-central1 --stream

# Verify environment variables
gcloud run services describe sidney-backend --region=us-central1 \
  --format="value(spec.template.spec.containers[0].env)"
```

### Database connection failed
```bash
# Check Cloud SQL instance
gcloud sql instances describe sidney-postgres

# Test connection via proxy
./cloud_sql_proxy -instances="project-sidney-prod:us-central1:sidney-postgres"=tcp:5432 &
PGPASSWORD="[PASSWORD]" psql -h localhost -p 5432 -U admin -d sidney_db -c "\dt"
```

### Frontend can't reach backend
- Verify `VITE_API_URL` env var matches backend Cloud Run URL
- Check CORS settings in backend
- Review browser console for errors
- Test API directly: `curl [BACKEND_URL]/api/ratings/overall`

## 📚 Documentation

- **Full Guide**: `GCP_DEPLOYMENT.md` (531 lines)
- **Deployment Script**: `scripts/deploy-gcp-sidney.sh` (165 lines)
- **GitHub**: https://github.com/arielden/project_sidney (phase3 branch)

## ✅ Summary

✓ Sidney project ready for GCP deployment
✓ Old Sydney services to be removed
✓ 29 sample questions seeded
✓ Adaptive learning system configured
✓ Docker images on Docker Hub & GCR
✓ Automated deployment script available

**Last Updated**: December 23, 2025
