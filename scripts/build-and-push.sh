#!/bin/bash

# Sydney Learning Platform - Build and Push Script
# This script builds and pushes all Docker images to Docker Hub

set -e  # Exit on any error

echo "🚀 Building and pushing Sydney Learning Platform images..."

DOCKER_USER="arieldenaro"
VERSION="v1.0"

echo "📦 Building frontend image..."
docker build -t $DOCKER_USER/sydney-frontend:latest -t $DOCKER_USER/sydney-frontend:$VERSION .

echo "📦 Building backend image..."
cd backend
docker build -t $DOCKER_USER/sydney-backend:latest -t $DOCKER_USER/sydney-backend:$VERSION .
cd ..

echo "⬆️  Pushing frontend images..."
docker push $DOCKER_USER/sydney-frontend:latest
docker push $DOCKER_USER/sydney-frontend:$VERSION

echo "⬆️  Pushing backend images..."
docker push $DOCKER_USER/sydney-backend:latest
docker push $DOCKER_USER/sydney-backend:$VERSION

echo "✅ All images pushed successfully!"
echo "📋 Available images:"
echo "   - $DOCKER_USER/sydney-frontend:latest"
echo "   - $DOCKER_USER/sydney-frontend:$VERSION"
echo "   - $DOCKER_USER/sydney-backend:latest"
echo "   - $DOCKER_USER/sydney-backend:$VERSION"
echo ""
echo "🔗 Docker Hub URLs:"
echo "   - https://hub.docker.com/r/$DOCKER_USER/sydney-frontend"
echo "   - https://hub.docker.com/r/$DOCKER_USER/sydney-backend"