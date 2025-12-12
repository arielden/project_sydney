-- ============================================================================
-- Migration: 005_full_schema_complete.sql
-- Sydney SAT Learning Platform - Complete Database Schema
-- 
-- Purpose: This is a comprehensive schema migration that contains the full,
--          current database structure. Use this for complete database
--          recreations and fresh deployments.
--
-- Date: December 11, 2025
-- Version: 1.0
-- 
-- Includes:
--  - Complete table definitions with all columns and constraints
--  - ELO rating system for adaptive learning
--  - Admin role system and activity logging
--  - Question type management system
--  - All functions, triggers, and indexes
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

-- ============================================================================
-- SECTION 2: ENUMS & TYPES
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- SECTION 3: CORE TABLES
-- ============================================================================

-- Users Table
-- Primary table for user accounts and authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Player Ratings Table
-- Tracks overall ELO ratings and performance metrics
CREATE TABLE IF NOT EXISTS player_ratings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    overall_elo INTEGER DEFAULT 1200 CHECK (overall_elo >= 0),
    k_factor DECIMAL(5,2) DEFAULT 100.00,
    games_played INTEGER DEFAULT 0 CHECK (games_played >= 0),
    wins INTEGER DEFAULT 0 CHECK (wins >= 0),
    losses INTEGER DEFAULT 0 CHECK (losses >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add optional confidence_level column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'player_ratings' AND column_name = 'confidence_level'
    ) THEN
        ALTER TABLE player_ratings ADD COLUMN confidence_level DECIMAL(3,2) DEFAULT 0.0;
    END IF;
END $$;

-- Micro Ratings Table
-- Category-specific ELO ratings for adaptive learning
CREATE TABLE IF NOT EXISTS micro_ratings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id VARCHAR(50) NOT NULL,
    sub_category VARCHAR(50),
    elo_rating INTEGER DEFAULT 1200 CHECK (elo_rating >= 0),
    k_factor DECIMAL(5,2) DEFAULT 100.0,
    attempts INTEGER DEFAULT 0 CHECK (attempts >= 0),
    confidence DECIMAL(3,2) DEFAULT 0.0 CHECK ((confidence >= 0.0 AND confidence <= 1.0)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category_id, sub_category)
);

-- Question Types Table
-- Defines the types/categories of SAT math questions
CREATE TABLE IF NOT EXISTS question_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category_id VARCHAR(50),
    difficulty_level VARCHAR(20) CHECK (
        difficulty_level IN ('easy', 'medium', 'hard', 'mixed') OR difficulty_level IS NULL
    ),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Questions Table
-- All SAT math questions with metadata and ratings
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    question_type VARCHAR(100) NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer VARCHAR(10) NOT NULL,
    explanation TEXT,
    difficulty_rating INTEGER DEFAULT 1200,
    stem_id INTEGER REFERENCES questions(id) ON DELETE SET NULL,
    clone_number INTEGER DEFAULT 0,
    times_answered INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    is_diagnostic BOOLEAN DEFAULT false,
    elo_rating INTEGER DEFAULT 1200 CHECK (elo_rating >= 0),
    k_factor DECIMAL(5,2) DEFAULT 40.0,
    reliability DECIMAL(3,2) DEFAULT 0.0 CHECK (reliability >= 0.0 AND reliability <= 1.0),
    times_rated INTEGER DEFAULT 0 CHECK (times_rated >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add optional category_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'questions' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE questions ADD COLUMN category_id VARCHAR(100) DEFAULT 'general';
        CREATE INDEX IF NOT EXISTS idx_questions_category_id ON questions(category_id);
    END IF;
END $$;

-- Quiz Sessions Table
-- Tracks user practice/diagnostic sessions
CREATE TABLE IF NOT EXISTS quiz_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('practice', 'diagnostic', 'timed')),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    is_paused BOOLEAN DEFAULT false,
    pause_time TIMESTAMP WITH TIME ZONE,
    total_pause_duration INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Question Attempts Table
-- Records each question attempt with ELO changes
CREATE TABLE IF NOT EXISTS question_attempts (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES quiz_sessions(id) ON DELETE SET NULL,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_answer VARCHAR(10),
    is_correct BOOLEAN NOT NULL,
    time_spent INTEGER,
    player_rating_before INTEGER,
    player_rating_after INTEGER,
    question_rating_before INTEGER,
    question_rating_after INTEGER,
    expected_score DECIMAL(5,4),
    elo_change INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add ELO columns if they don't exist (for existing databases)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'question_attempts' AND column_name = 'player_elo_before'
    ) THEN
        ALTER TABLE question_attempts ADD COLUMN player_elo_before INTEGER;
        ALTER TABLE question_attempts ADD COLUMN player_elo_after INTEGER;
        ALTER TABLE question_attempts ADD COLUMN question_elo_before INTEGER;
        ALTER TABLE question_attempts ADD COLUMN question_elo_after INTEGER;
    END IF;
END $$;

-- Admin Activity Log Table
-- Audit trail for admin actions
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id SERIAL PRIMARY KEY,
    admin_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 4: INDEXES
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Player Ratings indexes
CREATE INDEX IF NOT EXISTS idx_player_ratings_user_id ON player_ratings(user_id);

-- Micro Ratings indexes
CREATE INDEX IF NOT EXISTS idx_micro_ratings_user_category ON micro_ratings(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_micro_ratings_category ON micro_ratings(category_id);

-- Question Types indexes
CREATE INDEX IF NOT EXISTS idx_question_types_category ON question_types(category_id);
CREATE INDEX IF NOT EXISTS idx_question_types_active ON question_types(is_active);
CREATE INDEX IF NOT EXISTS idx_question_types_display_order ON question_types(display_order);

-- Questions indexes
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(question_type);
CREATE INDEX IF NOT EXISTS idx_questions_category_id ON questions(category_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty_rating);
CREATE INDEX IF NOT EXISTS idx_questions_elo_rating ON questions(elo_rating);
CREATE INDEX IF NOT EXISTS idx_questions_stem_id ON questions(stem_id);
CREATE INDEX IF NOT EXISTS idx_questions_times_rated ON questions(times_rated);

-- Quiz Sessions indexes
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_status ON quiz_sessions(status);

-- Question Attempts indexes
CREATE INDEX IF NOT EXISTS idx_question_attempts_session_id ON question_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_user_id ON question_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_question_id ON question_attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_elo ON question_attempts(player_elo_before, question_elo_before);

-- Admin Activity Log indexes
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_user ON admin_activity_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_table ON admin_activity_log(table_name);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action ON admin_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created ON admin_activity_log(created_at DESC);

-- ============================================================================
-- SECTION 5: FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate player K-factor based on games played
CREATE OR REPLACE FUNCTION calculate_player_k_factor(games_played INTEGER)
RETURNS DECIMAL(5,2) AS $$
BEGIN
    IF games_played < 10 THEN
        RETURN 100.0;
    ELSIF games_played < 30 THEN
        RETURN 40.0;
    ELSE
        RETURN 10.0;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate question K-factor based on times rated
CREATE OR REPLACE FUNCTION calculate_question_k_factor(times_rated INTEGER)
RETURNS DECIMAL(5,2) AS $$
BEGIN
    IF times_rated < 20 THEN
        RETURN 40.0;
    ELSIF times_rated < 50 THEN
        RETURN 20.0;
    ELSE
        RETURN 10.0;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate question reliability based on times rated
CREATE OR REPLACE FUNCTION calculate_question_reliability(times_rated INTEGER)
RETURNS DECIMAL(3,2) AS $$
BEGIN
    RETURN LEAST(0.95, times_rated::DECIMAL / 100.0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update micro_ratings timestamp
CREATE OR REPLACE FUNCTION update_micro_ratings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update player K-factor
CREATE OR REPLACE FUNCTION update_player_k_factor()
RETURNS TRIGGER AS $$
BEGIN
    NEW.k_factor = calculate_player_k_factor(NEW.games_played);
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update question K-factor
CREATE OR REPLACE FUNCTION update_question_k_factor()
RETURNS TRIGGER AS $$
BEGIN
    NEW.k_factor = calculate_question_k_factor(NEW.times_rated);
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update question reliability
CREATE OR REPLACE FUNCTION update_question_reliability()
RETURNS TRIGGER AS $$
BEGIN
    NEW.reliability = calculate_question_reliability(NEW.times_rated);
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 6: TRIGGERS
-- ============================================================================

-- Users update trigger
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Player Ratings update trigger
DROP TRIGGER IF EXISTS update_player_ratings_updated_at ON player_ratings;
CREATE TRIGGER update_player_ratings_updated_at
    BEFORE UPDATE ON player_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Player Ratings K-factor trigger
DROP TRIGGER IF EXISTS trigger_update_player_k_factor ON player_ratings;
CREATE TRIGGER trigger_update_player_k_factor
    BEFORE UPDATE ON player_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_player_k_factor();

-- Micro Ratings update trigger
DROP TRIGGER IF EXISTS update_micro_ratings_timestamp ON micro_ratings;
CREATE TRIGGER update_micro_ratings_timestamp
    BEFORE UPDATE ON micro_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_micro_ratings_timestamp();

-- Questions update trigger
DROP TRIGGER IF EXISTS update_questions_updated_at ON questions;
CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Questions K-factor trigger
DROP TRIGGER IF EXISTS trigger_update_question_k_factor ON questions;
CREATE TRIGGER trigger_update_question_k_factor
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_question_k_factor();

-- Questions reliability trigger
DROP TRIGGER IF EXISTS trigger_update_question_reliability ON questions;
CREATE TRIGGER trigger_update_question_reliability
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_question_reliability();

-- Question Types update trigger
DROP TRIGGER IF EXISTS trigger_update_question_types_updated_at ON question_types;
CREATE TRIGGER trigger_update_question_types_updated_at
    BEFORE UPDATE ON question_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 7: TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts and profile information';
COMMENT ON TABLE player_ratings IS 'Overall ELO ratings and performance metrics';
COMMENT ON TABLE micro_ratings IS 'Category-specific ELO ratings for adaptive learning';
COMMENT ON TABLE question_types IS 'Question type categories and metadata';
COMMENT ON TABLE questions IS 'SAT math questions with ELO and difficulty ratings';
COMMENT ON TABLE quiz_sessions IS 'User quiz sessions with timing and pause tracking';
COMMENT ON TABLE question_attempts IS 'Individual question attempts with ELO changes';
COMMENT ON TABLE admin_activity_log IS 'Audit trail for admin actions';

COMMENT ON COLUMN users.role IS 'User role: user (default) or admin';
COMMENT ON COLUMN users.is_active IS 'Whether the user account is active';
COMMENT ON COLUMN player_ratings.overall_elo IS 'Overall ELO rating (starting 1200)';
COMMENT ON COLUMN player_ratings.k_factor IS 'Dynamic K-factor based on games played';
COMMENT ON COLUMN player_ratings.confidence_level IS 'Confidence metric between 0.0 and 1.0';
COMMENT ON COLUMN micro_ratings.elo_rating IS 'Category-specific ELO rating';
COMMENT ON COLUMN micro_ratings.confidence IS 'Category-specific confidence metric';
COMMENT ON COLUMN questions.options IS 'JSONB array of answer choices';
COMMENT ON COLUMN questions.elo_rating IS 'Question difficulty as ELO rating';
COMMENT ON COLUMN questions.reliability IS 'Question reliability based on rating history';
COMMENT ON COLUMN questions.category_id IS 'Question category for adaptive filtering';
COMMENT ON COLUMN quiz_sessions.total_pause_duration IS 'Total pause time in seconds';
COMMENT ON COLUMN question_attempts.time_spent IS 'Time spent on question in seconds';
COMMENT ON COLUMN question_attempts.expected_score IS 'Expected outcome probability';
COMMENT ON COLUMN question_attempts.elo_change IS 'ELO rating change from this attempt';

-- ============================================================================
-- SECTION 8: INITIAL DATA & MIGRATION USER
-- ============================================================================

-- Insert or ignore migration marker user
INSERT INTO users (email, username, password_hash, first_name, last_name, role)
VALUES ('migration@sydney.platform', 'migration_user', 'hash_placeholder', 'Migration', 'Complete', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert or ignore migration marker player rating
INSERT INTO player_ratings (user_id, overall_elo, games_played)
SELECT id, 1200, 0 FROM users WHERE email = 'migration@sydney.platform'
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- SECTION 9: VERIFICATION & SUMMARY
-- ============================================================================

DO $$
DECLARE
    table_count INTEGER;
    index_count INTEGER;
    function_count INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public';
    
    -- Count functions
    SELECT COUNT(*) INTO function_count
    FROM pg_proc
    WHERE pg_catalog.pg_get_userbyid(proowner) = CURRENT_USER;
    
    RAISE NOTICE '=== Migration 005 Complete ===';
    RAISE NOTICE 'Tables created: %', table_count;
    RAISE NOTICE 'Indexes created: %', index_count;
    RAISE NOTICE 'Functions created: %', function_count;
    RAISE NOTICE '================================';
END $$;

-- ============================================================================
-- SECTION 10: SEED DATA (OPTIONAL - UNCOMMENT TO ADD SAMPLE QUESTION TYPES)
-- ============================================================================

/*
-- Sample Question Types for Testing
INSERT INTO question_types (name, description, category_id, difficulty_level, display_order, is_active) VALUES
('Linear Equations - Basic', 'Solve basic linear equations', 'algebra', 'easy', 1, true),
('Linear Equations - Advanced', 'Solve complex linear equations with fractions', 'algebra', 'hard', 2, true),
('Quadratic Functions', 'Work with quadratic equations and graphing', 'algebra', 'medium', 3, true),
('Systems of Equations', 'Solve 2x2 and 3x3 systems', 'algebra', 'medium', 4, true),
('Exponential Functions', 'Model growth and decay with exponentials', 'advanced', 'medium', 5, true),
('Trigonometric Functions', 'Use unit circle and trig identities', 'advanced', 'hard', 6, true),
('Coordinate Geometry', 'Distance, midpoint, and circle equations', 'geometry', 'easy', 7, true),
('Data Interpretation', 'Extract info from tables and charts', 'problem-solving', 'easy', 8, true),
('Percentages and Ratios', 'Work with percentages and proportions', 'problem-solving', 'medium', 9, true),
('Diagnostic Mixed', 'Mixed topics for assessment', 'diagnostic', 'medium', 10, true)
ON CONFLICT (name) DO NOTHING;
*/

COMMIT;

-- ============================================================================
-- Migration complete. Schema is ready for use.
-- ============================================================================
