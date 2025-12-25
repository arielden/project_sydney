#!/bin/bash
set -e

DB_HOST=${DB_HOST:-postgres}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-sidney_db}
DB_USER=${DB_USER:-admin}
DB_PASSWORD=${DB_PASSWORD:-admin123}

# Install postgresql client if needed
if ! command -v psql &> /dev/null; then
  echo "Installing postgresql client..."
  apk add --no-cache postgresql-client
fi

# Wait for postgres to be ready
echo "Waiting for PostgreSQL to be ready..."
for i in {1..60}; do
  if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" 2>/dev/null; then
    echo "PostgreSQL is ready!"
    break
  fi
  echo "Attempt $i: Waiting for PostgreSQL..."
  sleep 2
done

echo "PostgreSQL is ready. Initializing database schema..."

# Check if database exists, if not create it
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "CREATE DATABASE $DB_NAME"

# Run schema initialization with COMPLETE WORKING SCHEMA
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << 'SCHEMA_SQL'
-- ============================================================================
-- Sidney SAT Learning Platform - Complete Database Schema
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

CREATE FUNCTION public.calculate_player_k_factor(games_played integer) 
RETURNS numeric
LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
    IF games_played < 10 THEN
        RETURN 100.0;
    ELSIF games_played < 30 THEN
        RETURN 40.0;
    ELSE
        RETURN 10.0;
    END IF;
END;
$$;

CREATE FUNCTION public.calculate_question_k_factor(times_rated integer) 
RETURNS numeric
LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
    IF times_rated < 20 THEN
        RETURN 40.0;
    ELSIF times_rated < 50 THEN
        RETURN 20.0;
    ELSE
        RETURN 10.0;
    END IF;
END;
$$;

CREATE FUNCTION public.calculate_question_reliability(times_rated integer) 
RETURNS numeric
LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
    RETURN LEAST(0.95, times_rated::DECIMAL / 100.0);
END;
$$;

-- ============================================================================
-- TRIGGER FUNCTIONS
-- ============================================================================

CREATE FUNCTION public.update_micro_ratings_timestamp() 
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE FUNCTION public.update_player_k_factor() 
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.k_factor = calculate_player_k_factor(NEW.games_played);
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE FUNCTION public.update_question_k_factor() 
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.k_factor = calculate_question_k_factor(NEW.times_rated);
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE FUNCTION public.update_question_reliability() 
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.reliability = calculate_question_reliability(NEW.times_rated);
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE FUNCTION public.update_question_stats() 
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.k_factor = calculate_question_k_factor(NEW.times_rated);
    NEW.reliability = calculate_question_reliability(NEW.times_rated);
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE FUNCTION public.update_question_types_updated_at() 
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE FUNCTION public.update_updated_at_column() 
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- ============================================================================
-- SEQUENCES
-- ============================================================================

CREATE SEQUENCE public.users_id_seq AS integer START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE public.player_ratings_id_seq AS integer START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE public.micro_ratings_id_seq AS integer START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE public.question_types_id_seq AS integer START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE public.questions_id_seq AS integer START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE public.question_categories_id_seq AS integer START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE public.quiz_sessions_id_seq AS integer START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE public.question_attempts_id_seq AS integer START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE public.admin_activity_log_id_seq AS integer START WITH 1 INCREMENT BY 1;

-- ============================================================================
-- TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
    id integer NOT NULL DEFAULT nextval('public.users_id_seq'::regclass),
    email character varying(255) NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_login timestamp with time zone,
    is_active boolean DEFAULT true,
    role character varying(20) DEFAULT 'user'::character varying,
    age integer,
    gender character varying(20),
    address text,
    city character varying(100),
    state character varying(100),
    country character varying(100),
    zip_code character varying(20),
    phone character varying(30),
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_username_key UNIQUE (username)
);

CREATE TABLE IF NOT EXISTS public.player_ratings (
    id integer NOT NULL DEFAULT nextval('public.player_ratings_id_seq'::regclass),
    user_id integer NOT NULL,
    overall_elo integer DEFAULT 1200,
    k_factor numeric(5,2) DEFAULT 40.0,
    games_played integer DEFAULT 0,
    wins integer DEFAULT 0,
    losses integer DEFAULT 0,
    streak integer DEFAULT 0,
    best_rating integer DEFAULT 1200,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    confidence_level numeric(3,2) DEFAULT 0.0,
    CONSTRAINT player_ratings_pkey PRIMARY KEY (id),
    CONSTRAINT player_ratings_user_id_unique UNIQUE (user_id),
    CONSTRAINT player_ratings_elo_rating_check CHECK ((overall_elo >= 0)),
    CONSTRAINT player_ratings_games_played_check CHECK ((games_played >= 0)),
    CONSTRAINT player_ratings_losses_check CHECK ((losses >= 0)),
    CONSTRAINT player_ratings_wins_check CHECK ((wins >= 0)),
    CONSTRAINT player_ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.categories (
    id integer NOT NULL DEFAULT nextval('public.question_types_id_seq'::regclass),
    name character varying(100) NOT NULL,
    description text,
    difficulty_level character varying(20),
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT categories_pkey PRIMARY KEY (id),
    CONSTRAINT categories_name_key UNIQUE (name),
    CONSTRAINT categories_difficulty_level_check CHECK ((
        ((difficulty_level)::text = ANY ((ARRAY['easy'::character varying, 'medium'::character varying, 'hard'::character varying, 'mixed'::character varying])::text[])) 
        OR (difficulty_level IS NULL)
    ))
);

CREATE TABLE IF NOT EXISTS public.micro_ratings (
    id integer NOT NULL DEFAULT nextval('public.micro_ratings_id_seq'::regclass),
    user_id integer NOT NULL,
    category_id integer NOT NULL,
    elo_rating integer DEFAULT 1200,
    confidence numeric(3,2) DEFAULT 0.5,
    attempts integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT micro_ratings_pkey PRIMARY KEY (id),
    CONSTRAINT micro_ratings_user_id_category_id_key UNIQUE (user_id, category_id),
    CONSTRAINT micro_ratings_attempts_check CHECK ((attempts >= 0)),
    CONSTRAINT micro_ratings_confidence_check CHECK (((confidence >= (0)::numeric) AND (confidence <= (1)::numeric))),
    CONSTRAINT micro_ratings_elo_rating_check CHECK ((elo_rating >= 0)),
    CONSTRAINT micro_ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT micro_ratings_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.questions (
    id integer NOT NULL DEFAULT nextval('public.questions_id_seq'::regclass),
    question_text text NOT NULL,
    options jsonb NOT NULL,
    correct_answer character varying(10) NOT NULL,
    explanation text,
    difficulty_rating integer DEFAULT 1200,
    stem_id integer,
    clone_number integer DEFAULT 0,
    times_answered integer DEFAULT 0,
    times_correct integer DEFAULT 0,
    is_diagnostic boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    elo_rating integer DEFAULT 1200,
    k_factor numeric(5,2) DEFAULT 40.0,
    reliability numeric(3,2) DEFAULT 0.0,
    times_rated integer DEFAULT 0,
    CONSTRAINT questions_pkey PRIMARY KEY (id),
    CONSTRAINT questions_elo_rating_check CHECK ((elo_rating >= 0)),
    CONSTRAINT questions_reliability_check CHECK (((reliability >= 0.0) AND (reliability <= 1.0))),
    CONSTRAINT questions_times_rated_check CHECK ((times_rated >= 0)),
    CONSTRAINT questions_stem_id_fkey FOREIGN KEY (stem_id) REFERENCES public.questions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.question_categories (
    id integer NOT NULL DEFAULT nextval('public.question_categories_id_seq'::regclass),
    question_id integer NOT NULL,
    category_id integer NOT NULL,
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT question_categories_pkey PRIMARY KEY (id),
    CONSTRAINT question_categories_question_id_category_id_key UNIQUE (question_id, category_id),
    CONSTRAINT question_categories_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE,
    CONSTRAINT question_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.quiz_sessions (
    id integer NOT NULL DEFAULT nextval('public.quiz_sessions_id_seq'::regclass),
    user_id integer NOT NULL,
    session_type character varying(50) NOT NULL,
    start_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    end_time timestamp with time zone,
    is_paused boolean DEFAULT false,
    pause_time timestamp with time zone,
    total_pause_duration integer DEFAULT 0,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT quiz_sessions_pkey PRIMARY KEY (id),
    CONSTRAINT quiz_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.question_attempts (
    id integer NOT NULL DEFAULT nextval('public.question_attempts_id_seq'::regclass),
    user_id integer NOT NULL,
    question_id integer NOT NULL,
    session_id integer,
    is_correct boolean NOT NULL,
    player_rating_before integer,
    player_rating_after integer,
    question_rating_before integer,
    question_rating_after integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    user_answer character varying(10),
    time_spent integer,
    expected_score numeric(5,4),
    elo_change integer,
    answered_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT question_attempts_pkey PRIMARY KEY (id),
    CONSTRAINT question_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT question_attempts_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE,
    CONSTRAINT question_attempts_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.quiz_sessions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.admin_activity_log (
    id integer NOT NULL DEFAULT nextval('public.admin_activity_log_id_seq'::regclass),
    admin_user_id integer NOT NULL,
    action character varying(50) NOT NULL,
    table_name character varying(100),
    record_id character varying(100),
    details jsonb,
    ip_address character varying(45),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT admin_activity_log_pkey PRIMARY KEY (id),
    CONSTRAINT admin_activity_log_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users USING btree (email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users USING btree (username);

CREATE INDEX IF NOT EXISTS idx_player_ratings_user_id ON public.player_ratings USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_player_ratings_elo ON public.player_ratings USING btree (overall_elo);

CREATE INDEX IF NOT EXISTS idx_micro_ratings_user ON public.micro_ratings USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_micro_ratings_category ON public.micro_ratings USING btree (category_id);
CREATE INDEX IF NOT EXISTS idx_micro_ratings_user_category ON public.micro_ratings USING btree (user_id, category_id);

CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories USING btree (is_active);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories USING btree (display_order);
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories USING btree (name);

CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions USING btree (difficulty_rating);
CREATE INDEX IF NOT EXISTS idx_questions_elo_rating ON public.questions USING btree (elo_rating);
CREATE INDEX IF NOT EXISTS idx_questions_stem_id ON public.questions USING btree (stem_id);
CREATE INDEX IF NOT EXISTS idx_questions_times_rated ON public.questions USING btree (times_rated);

CREATE INDEX IF NOT EXISTS idx_question_categories_question_id ON public.question_categories USING btree (question_id);
CREATE INDEX IF NOT EXISTS idx_question_categories_category_id ON public.question_categories USING btree (category_id);
CREATE INDEX IF NOT EXISTS idx_question_categories_is_primary ON public.question_categories USING btree (is_primary);

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON public.quiz_sessions USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_type ON public.quiz_sessions USING btree (session_type);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_status ON public.quiz_sessions USING btree (status);

CREATE INDEX IF NOT EXISTS idx_question_attempts_user_id ON public.question_attempts USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_question_id ON public.question_attempts USING btree (question_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_session_id ON public.question_attempts USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_created ON public.question_attempts USING btree (created_at);

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_user ON public.admin_activity_log USING btree (admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action ON public.admin_activity_log USING btree (action);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_table ON public.admin_activity_log USING btree (table_name);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created ON public.admin_activity_log USING btree (created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_player_ratings_updated_at ON public.player_ratings;
CREATE TRIGGER update_player_ratings_updated_at BEFORE UPDATE ON public.player_ratings 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_player_k_factor ON public.player_ratings;
CREATE TRIGGER trigger_update_player_k_factor BEFORE UPDATE ON public.player_ratings 
    FOR EACH ROW EXECUTE FUNCTION public.update_player_k_factor();

DROP TRIGGER IF EXISTS update_micro_ratings_timestamp ON public.micro_ratings;
CREATE TRIGGER update_micro_ratings_timestamp BEFORE UPDATE ON public.micro_ratings 
    FOR EACH ROW EXECUTE FUNCTION public.update_micro_ratings_timestamp();

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_questions_updated_at ON public.questions;
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questions 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_question_k_factor ON public.questions;
CREATE TRIGGER trigger_update_question_k_factor BEFORE UPDATE ON public.questions 
    FOR EACH ROW EXECUTE FUNCTION public.update_question_k_factor();

DROP TRIGGER IF EXISTS trigger_update_question_reliability ON public.questions;
CREATE TRIGGER trigger_update_question_reliability BEFORE UPDATE ON public.questions 
    FOR EACH ROW EXECUTE FUNCTION public.update_question_reliability();

SCHEMA_SQL

echo "Database schema initialized successfully!"
