#!/bin/bash

# Sydney Learning Platform - Production Deployment Script
# This script deploys the application from Docker Hub images

set -e  # Exit on any error

echo "🚀 Deploying Sydney Learning Platform from Docker Hub..."

# Check if .env.prod exists
if [ ! -f .env.prod ]; then
    echo "⚠️  .env.prod file not found!"
    echo "📝 Please copy .env.prod.example to .env.prod and configure it:"
    echo "   cp .env.prod.example .env.prod"
    echo "   # Then edit .env.prod with your production values"
    exit 1
fi

echo "⬇️  Pulling latest images from Docker Hub..."
docker compose -f docker-compose.prod.yml --env-file .env.prod pull

echo "🛑 Stopping existing containers..."
docker compose -f docker-compose.prod.yml --env-file .env.prod down

echo "🔄 Starting services..."
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

echo "⏳ Waiting for services to be ready..."
sleep 10

echo "🔍 Checking service status..."
docker compose -f docker-compose.prod.yml --env-file .env.prod ps

echo "✅ Deployment complete!"
echo "📋 Service URLs:"
echo "   - Frontend: http://localhost:$(grep FRONTEND_PORT .env.prod | cut -d'=' -f2 | head -1)"
echo "   - Backend API: http://localhost:$(grep BACKEND_PORT .env.prod | cut -d'=' -f2 | head -1)/api"
echo "   - pgAdmin: http://localhost:$(grep PGADMIN_PORT .env.prod | cut -d'=' -f2 | head -1)"
echo ""
echo "📊 To view logs:"
echo "   docker compose -f docker-compose.prod.yml logs -f"
echo ""
echo "🛑 To stop services:"
echo "   docker compose -f docker-compose.prod.yml down"