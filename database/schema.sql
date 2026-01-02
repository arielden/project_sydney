-- ============================================================================
-- Sydney SAT Learning Platform - Database Schema
-- ============================================================================

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM (
    'user',
    'admin'
);

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Calculate dynamic K-factor for players based on games played
DROP FUNCTION IF EXISTS public.calculate_player_k_factor(integer);
CREATE FUNCTION public.calculate_player_k_factor(games_played integer)
RETURNS numeric
LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
    RETURN ROUND(25.0 / (1.0 + games_played / 15.0), 2);
END;
$$;

-- Calculate dynamic K-factor for questions based on times rated
DROP FUNCTION IF EXISTS public.calculate_question_k_factor(integer);
CREATE FUNCTION public.calculate_question_k_factor(times_rated integer)
RETURNS numeric
LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
    IF times_rated < 20 THEN
        RETURN 40.0;
    ELSE
        RETURN 20.0;
    END IF;
END;
$$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Users table
DROP TABLE IF EXISTS public.users CASCADE;
CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(30) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    age INTEGER,
    gender VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    zip_code VARCHAR(20),
    phone VARCHAR(20),
    role user_role DEFAULT 'user'::user_role,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Categories table
DROP TABLE IF EXISTS public.categories CASCADE;
CREATE TABLE public.categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
DROP TABLE IF EXISTS public.questions CASCADE;
CREATE TABLE public.questions (
    id SERIAL PRIMARY KEY,
    question_text TEXT NOT NULL,
    options JSONB,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    difficulty_rating DECIMAL(3,2) CHECK (difficulty_rating >= 0 AND difficulty_rating <= 1),
    elo_rating INTEGER DEFAULT 500,
    times_answered INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Question categories junction table
DROP TABLE IF EXISTS public.question_categories CASCADE;
CREATE TABLE public.question_categories (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(question_id, category_id)
);

-- Player ratings table
DROP TABLE IF EXISTS public.player_ratings CASCADE;
CREATE TABLE public.player_ratings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    overall_elo INTEGER DEFAULT 500,
    k_factor DECIMAL(5,2) DEFAULT 25.00,
    games_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    best_rating INTEGER DEFAULT 500,
    confidence_level DECIMAL(3,2) DEFAULT 0.5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Quiz sessions table
DROP TABLE IF EXISTS public.quiz_sessions CASCADE;
CREATE TABLE public.quiz_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_type VARCHAR(20) CHECK (session_type IN ('practice', 'diagnostic', 'timed', 'quick-test')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    paused_at TIMESTAMP WITH TIME ZONE,
    resumed_at TIMESTAMP WITH TIME ZONE,
    total_time_spent INTEGER DEFAULT 0,
    total_pause_duration INTEGER DEFAULT 0,
    is_paused BOOLEAN DEFAULT false,
    score_percentage DECIMAL(5,2),
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    incorrect_answers INTEGER DEFAULT 0,
    skipped_answers INTEGER DEFAULT 0,
    accuracy_percentage DECIMAL(5,2) DEFAULT 0.00,
    avg_time_per_question DECIMAL(6,2) DEFAULT 0.00,
    elo_change INTEGER DEFAULT 0,
    questions_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Question attempts table
DROP TABLE IF EXISTS public.question_attempts CASCADE;
CREATE TABLE public.question_attempts (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    user_answer TEXT,
    is_correct BOOLEAN,
    time_spent INTEGER, -- in seconds
    elo_change INTEGER DEFAULT 0,
    question_elo_before INTEGER,
    question_elo_after INTEGER,
    player_elo_before INTEGER,
    player_elo_after INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, question_id)
);

-- Micro ratings table (user performance per category)
DROP TABLE IF EXISTS public.micro_ratings CASCADE;
CREATE TABLE public.micro_ratings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    elo_rating INTEGER DEFAULT 500,
    attempts INTEGER DEFAULT 0,
    correct_attempts INTEGER DEFAULT 0,
    success_rate DECIMAL(5,4) DEFAULT 0,
    confidence DECIMAL(3,2) DEFAULT 0.5,
    last_attempt TIMESTAMP WITH TIME ZONE,
    recent_accuracy DECIMAL(5,2) DEFAULT 0.00,
    trend VARCHAR(20) DEFAULT 'stable' CHECK (trend IN ('improving', 'declining', 'stable')),
    questions_mastered INTEGER DEFAULT 0,
    questions_available INTEGER DEFAULT 0,
    priority_score DECIMAL(5,2) DEFAULT 0.00,
    last_practice_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category_id)
);

-- Admin activity log table (audit trail for admin actions)
DROP TABLE IF EXISTS public.admin_activity_log CASCADE;
CREATE TABLE public.admin_activity_log (
    id SERIAL PRIMARY KEY,
    admin_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(100),
    record_id INTEGER,
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz questions junction table (from migration 008)
DROP TABLE IF EXISTS public.quiz_questions CASCADE;
CREATE TABLE public.quiz_questions (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    question_order INTEGER NOT NULL CHECK (question_order > 0),
    category_id INTEGER REFERENCES categories(id),
    question_elo_at_selection INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, question_id),
    UNIQUE(session_id, question_order)
);

-- User question history table (from migration 010)
DROP TABLE IF EXISTS public.user_question_history CASCADE;
CREATE TABLE public.user_question_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id),
    times_seen INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    times_incorrect INTEGER DEFAULT 0,
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE,
    last_session_id INTEGER REFERENCES quiz_sessions(id),
    is_retired BOOLEAN DEFAULT false,
    retirement_date TIMESTAMP WITH TIME ZONE,
    queue_priority INTEGER DEFAULT 0 CHECK (queue_priority >= 0 AND queue_priority <= 3),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

-- Category practice priority table (from migration 012)
DROP TABLE IF EXISTS public.category_practice_priority CASCADE;
CREATE TABLE public.category_practice_priority (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    selection_weight DECIMAL(5,2) DEFAULT 1.00,
    questions_needed INTEGER DEFAULT 0,
    elo_deficit INTEGER DEFAULT 0,
    accuracy_deficit DECIMAL(5,2) DEFAULT 0.00,
    last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    next_practice_recommended TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_questions_elo ON questions(elo_rating);
CREATE INDEX idx_questions_difficulty ON questions(difficulty_rating);
CREATE INDEX idx_player_ratings_user ON player_ratings(user_id);
CREATE INDEX idx_quiz_sessions_user ON quiz_sessions(user_id);
CREATE INDEX idx_quiz_sessions_status ON quiz_sessions(status);
CREATE INDEX idx_quiz_sessions_accuracy ON quiz_sessions(accuracy_percentage);
CREATE INDEX idx_quiz_sessions_user_accuracy ON quiz_sessions(user_id, accuracy_percentage);
CREATE INDEX idx_quiz_sessions_elo_change ON quiz_sessions(user_id, elo_change);
CREATE INDEX idx_quiz_sessions_questions_json ON quiz_sessions USING GIN (questions_json);
CREATE INDEX idx_question_attempts_session ON question_attempts(session_id);
CREATE INDEX idx_quiz_questions_session ON quiz_questions(session_id);
CREATE INDEX idx_quiz_questions_question ON quiz_questions(question_id);
CREATE INDEX idx_quiz_questions_category ON quiz_questions(category_id);
CREATE INDEX idx_user_question_history_user ON user_question_history(user_id);
CREATE INDEX idx_user_question_history_category ON user_question_history(user_id, category_id);
CREATE INDEX idx_user_question_history_retired ON user_question_history(user_id, is_retired);
CREATE INDEX idx_user_question_history_queue ON user_question_history(user_id, queue_priority DESC);
CREATE INDEX idx_user_question_history_last_seen ON user_question_history(user_id, last_seen_at);
CREATE INDEX idx_user_question_history_question ON user_question_history(question_id);
CREATE INDEX idx_micro_ratings_user ON micro_ratings(user_id);
CREATE INDEX idx_micro_ratings_category ON micro_ratings(category_id);
CREATE INDEX idx_micro_ratings_priority ON micro_ratings(user_id, priority_score DESC);
CREATE INDEX idx_micro_ratings_recent_accuracy ON micro_ratings(user_id, recent_accuracy);
CREATE INDEX idx_micro_ratings_trend ON micro_ratings(user_id, trend);
CREATE INDEX idx_category_priority_user_weight ON category_practice_priority(user_id, selection_weight DESC);
CREATE INDEX idx_category_priority_user_calculated ON category_practice_priority(user_id, last_calculated_at);
CREATE INDEX idx_category_priority_recommended ON category_practice_priority(user_id, next_practice_recommended);
CREATE INDEX idx_admin_activity_log_admin_user ON admin_activity_log(admin_user_id);
CREATE INDEX idx_admin_activity_log_created ON admin_activity_log(created_at);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_player_ratings_updated_at BEFORE UPDATE ON player_ratings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quiz_sessions_updated_at BEFORE UPDATE ON quiz_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_micro_ratings_updated_at BEFORE UPDATE ON micro_ratings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_question_history_updated_at BEFORE UPDATE ON user_question_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_category_practice_priority_updated_at BEFORE UPDATE ON category_practice_priority FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
