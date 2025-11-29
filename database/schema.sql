-- Sydney SAT Learning Platform Database Schema
-- Core database structure for adaptive learning system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
-- Stores user account information and basic profile data
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Player_Ratings Table
-- Tracks overall ELO ratings and performance metrics for each user
CREATE TABLE player_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    overall_elo INTEGER DEFAULT 1200,
    k_factor DECIMAL(4,2) DEFAULT 100.00,
    games_played INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Questions Table
-- Stores all SAT math questions with difficulty ratings and metadata
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_type VARCHAR(100) NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of answer options with labels
    correct_answer VARCHAR(10) NOT NULL,
    explanation TEXT,
    difficulty_rating INTEGER DEFAULT 1200,
    stem_id UUID, -- References parent question for variations
    clone_number INTEGER DEFAULT 0,
    times_answered INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    is_diagnostic BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stem_id) REFERENCES questions(id) ON DELETE SET NULL
);

-- Quiz_Sessions Table
-- Tracks user practice/diagnostic sessions with timing and pause functionality
CREATE TABLE quiz_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('practice', 'diagnostic', 'timed')),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    is_paused BOOLEAN DEFAULT false,
    pause_time TIMESTAMP WITH TIME ZONE,
    total_pause_duration INTEGER DEFAULT 0, -- Total seconds paused
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Question_Attempts Table
-- Records each question attempt with ELO rating changes and performance data
CREATE TABLE question_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_answer VARCHAR(10),
    is_correct BOOLEAN NOT NULL,
    time_spent INTEGER NOT NULL, -- Time in seconds
    player_rating_before INTEGER NOT NULL,
    player_rating_after INTEGER NOT NULL,
    question_rating_before INTEGER NOT NULL,
    question_rating_after INTEGER NOT NULL,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_player_ratings_user_id ON player_ratings(user_id);
CREATE INDEX idx_questions_type ON questions(question_type);
CREATE INDEX idx_questions_difficulty ON questions(difficulty_rating);
CREATE INDEX idx_questions_stem_id ON questions(stem_id);
CREATE INDEX idx_quiz_sessions_user_id ON quiz_sessions(user_id);
CREATE INDEX idx_quiz_sessions_status ON quiz_sessions(status);
CREATE INDEX idx_question_attempts_session_id ON question_attempts(session_id);
CREATE INDEX idx_question_attempts_user_id ON question_attempts(user_id);
CREATE INDEX idx_question_attempts_question_id ON question_attempts(question_id);

-- Trigger to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to tables with updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_player_ratings_updated_at BEFORE UPDATE ON player_ratings 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts and profile information';
COMMENT ON TABLE player_ratings IS 'ELO ratings and performance metrics for users';
COMMENT ON TABLE questions IS 'SAT math questions with difficulty ratings and metadata';
COMMENT ON TABLE quiz_sessions IS 'User practice and diagnostic sessions';
COMMENT ON TABLE question_attempts IS 'Individual question attempts with rating changes';

COMMENT ON COLUMN questions.options IS 'JSONB array of answer choices: [{"id": "A", "text": "answer"}, ...]';
COMMENT ON COLUMN questions.stem_id IS 'Parent question ID for question variations and clones';
COMMENT ON COLUMN quiz_sessions.total_pause_duration IS 'Total time paused in seconds';
COMMENT ON COLUMN question_attempts.time_spent IS 'Time spent on question in seconds';