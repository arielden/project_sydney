# Sydney Learning Platform - Database Setup

This directory contains database configuration and initialization files for the Sydney Adaptive Learning Platform.

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL client (optional, for direct database access)

## Quick Start

### 1. Start the Database Containers

```bash
# Start PostgreSQL and pgAdmin containers
docker-compose up -d

# Check if containers are running
docker-compose ps
```

### 2. Verify PostgreSQL is Running

```bash
# Check PostgreSQL health
docker-compose exec postgres pg_isready -U admin -d sydney_db

# View container logs
docker logs sydney_postgres
```

### 3. Access the Database

#### Option A: Using pgAdmin (Web Interface)
1. Open browser to `http://localhost:5050`
2. Login with:
   - Email: `admin@sydney.com`
   - Password: `admin123`
3. Add new server connection:
   - Name: `Sydney DB`
   - Host: `postgres` (container name)
   - Port: `5432`
   - Username: `admin`
   - Password: `admin123`
   - Database: `sydney_db`

#### Option B: Using psql (Command Line)
```bash
# Connect directly to PostgreSQL container
docker-compose exec postgres psql -U admin -d sydney_db

# Or connect from host machine (if psql installed)
psql -h localhost -p 5432 -U admin -d sydney_db
```

#### Option C: Using External Client (DBeaver, TablePlus, etc.)
- Host: `localhost`
- Port: `5432`
- Database: `sydney_db`
- Username: `admin`
- Password: `admin123`

## Database Configuration

### Environment Variables
Database settings are configured in `.env` file:

```env
POSTGRES_DB=sydney_db
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin123
POSTGRES_PORT=5432
DATABASE_URL=postgresql://admin:admin123@localhost:5432/sydney_db
```

### Data Persistence
- Database data is persisted in Docker volume `postgres_data`
- Data survives container restarts and recreations
- To reset database: `docker-compose down -v` (WARNING: destroys all data)

## Common Commands

### Container Management
```bash
# Start containers in background
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker-compose logs postgres
docker-compose logs pgadmin

# Restart specific service
docker-compose restart postgres

# Remove everything including volumes (DANGER!)
docker-compose down -v
```

### Database Operations
```bash
# Create database backup
docker-compose exec postgres pg_dump -U admin sydney_db > backup.sql

# Restore database backup
docker-compose exec -T postgres psql -U admin -d sydney_db < backup.sql

# Run SQL file
docker-compose exec -T postgres psql -U admin -d sydney_db < your_file.sql
```

## Troubleshooting

### Container Won't Start
```bash
# Check container status
docker-compose ps

# View detailed logs
docker-compose logs postgres

# Check if port is already in use
lsof -i :5432  # On Mac/Linux
netstat -ano | findstr :5432  # On Windows
```

### Can't Connect to Database
1. Ensure containers are running: `docker-compose ps`
2. Check PostgreSQL health: `docker-compose exec postgres pg_isready`
3. Verify environment variables in `.env` file
4. Check if firewall is blocking port 5432

### Reset Everything
```bash
# Stop and remove all containers and volumes
docker-compose down -v

# Remove any orphaned containers
docker container prune

# Start fresh
docker-compose up -d
```

## Security Notes

⚠️ **Development Only**: Current credentials are for development only!

- Username: `admin`
- Password: `admin123`
- Database: `sydney_db`

**For production deployment:**
- Use strong, unique passwords
- Configure SSL/TLS connections
- Implement proper user roles and permissions
- Use secrets management
- Enable audit logging

## Next Steps

Once the database is running:
1. Database schema will be added in future development steps
2. User authentication tables
3. Quiz and learning content tables
4. Analytics and progress tracking tables