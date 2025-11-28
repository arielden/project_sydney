-- Sydney Adaptive Learning Platform Database Schema
-- Initial setup script for PostgreSQL

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create database schema (tables will be added in future steps)
-- This file serves as the entry point for database initialization

-- Set timezone
SET timezone = 'UTC';

-- Create initial admin user (placeholder for future user management)
-- Tables and data will be added in subsequent development steps

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Sydney Learning Platform database initialized successfully';
END $$;