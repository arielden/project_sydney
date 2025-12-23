# Multi-stage build for Sidney Learning Platform Frontend

# Development stage
FROM node:20-alpine AS development

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port for Vite dev server
EXPOSE 5173

# Start development server with host binding for Docker
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Production build stage
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Accept build arguments for environment
ARG VITE_API_URL=https://sidney-backend-jh5r4kunnq-uc.a.run.app/api

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application with API URL
RUN VITE_API_URL=${VITE_API_URL} npm run build

# Production stage
FROM nginx:alpine AS production

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080 (Cloud Run requirement)
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]