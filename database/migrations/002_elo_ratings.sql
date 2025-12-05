-- Migration: 002_elo_ratings.sql
-- Add ELO rating system for adaptive learning

BEGIN;

-- Update player_ratings table to add new columns
-- Note: overall_elo, k_factor, games_played already exist, adding new column
ALTER TABLE player_ratings 
ADD COLUMN IF NOT EXISTS confidence_level DECIMAL(3,2) DEFAULT 0.0 CHECK (confidence_level >= 0.0 AND confidence_level <= 1.0);

-- Create micro_ratings table for category-specific ELO ratings
CREATE TABLE IF NOT EXISTS micro_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    elo_rating INTEGER DEFAULT 1200 CHECK (elo_rating >= 0),
    k_factor DECIMAL(5,2) DEFAULT 100.0,
    attempts INTEGER DEFAULT 0 CHECK (attempts >= 0),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one record per user per category
    UNIQUE(user_id, category)
);

-- Update questions table to add ELO rating columns
-- Note: difficulty_rating exists, adding ELO columns
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS elo_rating INTEGER DEFAULT 1200 CHECK (elo_rating >= 0),
ADD COLUMN IF NOT EXISTS k_factor DECIMAL(5,2) DEFAULT 40.0,
ADD COLUMN IF NOT EXISTS reliability DECIMAL(3,2) DEFAULT 0.0 CHECK (reliability >= 0.0 AND reliability <= 1.0),
ADD COLUMN IF NOT EXISTS times_rated INTEGER DEFAULT 0 CHECK (times_rated >= 0);

-- Update question_attempts table to store ELO data
ALTER TABLE question_attempts
ADD COLUMN IF NOT EXISTS player_elo_before INTEGER,
ADD COLUMN IF NOT EXISTS player_elo_after INTEGER,
ADD COLUMN IF NOT EXISTS question_elo_before INTEGER,
ADD COLUMN IF NOT EXISTS question_elo_after INTEGER,
ADD COLUMN IF NOT EXISTS expected_score DECIMAL(4,3),
ADD COLUMN IF NOT EXISTS elo_change INTEGER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_micro_ratings_user_category ON micro_ratings(user_id, category);
CREATE INDEX IF NOT EXISTS idx_micro_ratings_category ON micro_ratings(category);
CREATE INDEX IF NOT EXISTS idx_questions_elo_rating ON questions(elo_rating);
CREATE INDEX IF NOT EXISTS idx_questions_times_rated ON questions(times_rated);
CREATE INDEX IF NOT EXISTS idx_question_attempts_elo ON question_attempts(player_elo_before, question_elo_before);

-- Function to update k_factor based on games played
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

-- Function to update question k_factor based on times rated
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

-- Function to calculate reliability based on times rated
CREATE OR REPLACE FUNCTION calculate_question_reliability(times_rated INTEGER)
RETURNS DECIMAL(3,2) AS $$
BEGIN
    -- Reliability increases with more ratings, caps at 0.95
    RETURN LEAST(0.95, times_rated::DECIMAL / 100.0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to update k_factor when games_played changes
CREATE OR REPLACE FUNCTION update_player_k_factor()
RETURNS TRIGGER AS $$
BEGIN
    NEW.k_factor = calculate_player_k_factor(NEW.games_played);
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_player_k_factor ON player_ratings;
CREATE TRIGGER trigger_update_player_k_factor
    BEFORE UPDATE ON player_ratings
    FOR EACH ROW
    WHEN (OLD.games_played IS DISTINCT FROM NEW.games_played)
    EXECUTE FUNCTION update_player_k_factor();

-- Trigger to update question reliability and k_factor when times_rated changes
CREATE OR REPLACE FUNCTION update_question_stats()
RETURNS TRIGGER AS $$
BEGIN
    NEW.k_factor = calculate_question_k_factor(NEW.times_rated);
    NEW.reliability = calculate_question_reliability(NEW.times_rated);
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_question_stats ON questions;
CREATE TRIGGER trigger_update_question_stats
    BEFORE UPDATE ON questions
    FOR EACH ROW
    WHEN (OLD.times_rated IS DISTINCT FROM NEW.times_rated)
    EXECUTE FUNCTION update_question_stats();

-- Trigger to update micro_ratings timestamp
CREATE OR REPLACE FUNCTION update_micro_ratings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_micro_ratings_timestamp ON micro_ratings;
CREATE TRIGGER trigger_update_micro_ratings_timestamp
    BEFORE UPDATE ON micro_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_micro_ratings_timestamp();

COMMIT;