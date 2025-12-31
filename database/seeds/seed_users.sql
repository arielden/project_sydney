-- ============================================================================
-- Development Seed Data - Users
-- ============================================================================
-- This file contains sample users for development and testing.
-- Sydney SAT Learning Platform - Development Test Data
-- ============================================================================
-- WARNING: This file is for DEVELOPMENT ONLY!
-- Do NOT use in production. Replace with actual user data.
--
-- Execution: Run AFTER seed_categories.sql and seed_questions.sql
-- ============================================================================

-- Create admin user
INSERT INTO users (email, username, password_hash, first_name, last_name, role) VALUES
('arieldenaro@gmail.com', 'arieldenaro', '$2b$10$ewj73jh9vmepbpX2Sa88WOGa2cFxtBXHiQEwqMO0tKzM7mb2jdjcC', 'Ariel', 'Denaro', 'admin') -- password: Pass1234$
ON CONFLICT (email) DO NOTHING;

-- Create regular user
INSERT INTO users (email, username, password_hash, first_name, last_name) VALUES
('charlie@hotmail.com', 'charliebean', '$2b$10$ewj73jh9vmepbpX2Sa88WOGa2cFxtBXHiQEwqMO0tKzM7mb2jdjcC', 'Charlie', 'Bean') -- password: Pass1234$
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- End of Development User Seed Data
-- ============================================================================
-- Sample users have been successfully loaded!
--
-- WARNING: This is test data only. Before production deployment:
-- 1. Remove or disable this seed file
-- 2. Load production users from your actual user database
-- 3. Verify user data and security
-- ============================================================================