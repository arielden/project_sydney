-- ============================================================================
-- Sydney SAT Learning Platform - Complete Database Schema Generation Script
-- ============================================================================
-- This script recreates the entire database schema from scratch.
-- It includes all tables, functions, triggers, indexes, and constraints.
-- No data is included - use this to initialize an empty database.
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

CREATE TYPE public.user_role AS ENUM (
    'user',
    'admin'
);

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Calculate dynamic K-factor for players based on games played
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

-- Calculate dynamic K-factor for questions based on times rated
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

-- Calculate question reliability based on rating history
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

-- Update micro_ratings timestamp
CREATE FUNCTION public.update_micro_ratings_timestamp() 
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Update player K-factor on rating changes
CREATE FUNCTION public.update_player_k_factor() 
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.k_factor = calculate_player_k_factor(NEW.games_played);
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Update question K-factor on rating changes
CREATE FUNCTION public.update_question_k_factor() 
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.k_factor = calculate_question_k_factor(NEW.times_rated);
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Update question reliability on rating changes
CREATE FUNCTION public.update_question_reliability() 
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.reliability = calculate_question_reliability(NEW.times_rated);
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Update question stats (K-factor and reliability)
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

-- Update question_types timestamp
CREATE FUNCTION public.update_question_types_updated_at() 
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Generic function to update updated_at column
CREATE FUNCTION public.update_updated_at_column() 
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Users Table
CREATE TABLE public.users (
    id integer NOT NULL,
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

COMMENT ON TABLE public.users IS 'User accounts and profile information';
COMMENT ON COLUMN public.users.is_active IS 'Whether the user account is active';
COMMENT ON COLUMN public.users.role IS 'User role: user (default) or admin';

-- Player Ratings Table
CREATE TABLE public.player_ratings (
    id integer NOT NULL,
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
    CONSTRAINT player_ratings_user_id_fkey FOREIGN KEY (user_id) 
        REFERENCES public.users(id) ON DELETE CASCADE
);

COMMENT ON TABLE public.player_ratings IS 'Overall ELO ratings and performance metrics';
COMMENT ON COLUMN public.player_ratings.overall_elo IS 'Overall ELO rating (starting 1200)';
COMMENT ON COLUMN public.player_ratings.k_factor IS 'Dynamic K-factor based on games played';
COMMENT ON COLUMN public.player_ratings.confidence_level IS 'Confidence metric between 0.0 and 1.0';

-- Categories Table (renamed from question_types for many-to-many support)
CREATE TABLE public.categories (
    id integer NOT NULL,
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
        ((difficulty_level)::text = ANY ((ARRAY['easy'::character varying, 
         'medium'::character varying, 'hard'::character varying, 
         'mixed'::character varying])::text[])) 
        OR (difficulty_level IS NULL)
    ))
);

COMMENT ON TABLE public.categories IS 'SAT Math question categories';

-- Micro Ratings Table
CREATE TABLE public.micro_ratings (
    id integer NOT NULL,
    user_id integer NOT NULL,
    category_id integer NOT NULL,
    elo_rating integer DEFAULT 1200,
    confidence numeric(3,2) DEFAULT 0.5,
    attempts integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT micro_ratings_pkey PRIMARY KEY (id),
    CONSTRAINT micro_ratings_user_id_category_id_key 
        UNIQUE (user_id, category_id),
    CONSTRAINT micro_ratings_attempts_check CHECK ((attempts >= 0)),
    CONSTRAINT micro_ratings_confidence_check CHECK (((confidence >= (0)::numeric) 
        AND (confidence <= (1)::numeric))),
    CONSTRAINT micro_ratings_elo_rating_check CHECK ((elo_rating >= 0)),
    CONSTRAINT micro_ratings_user_id_fkey FOREIGN KEY (user_id) 
        REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT micro_ratings_category_id_fkey FOREIGN KEY (category_id)
        REFERENCES public.categories(id) ON DELETE CASCADE
);

COMMENT ON TABLE public.micro_ratings IS 'Category-specific ELO ratings for adaptive learning';
COMMENT ON COLUMN public.micro_ratings.elo_rating IS 'Category-specific ELO rating';
COMMENT ON COLUMN public.micro_ratings.confidence IS 'Category-specific confidence metric';

-- Questions Table
CREATE TABLE public.questions (
    id integer NOT NULL,
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
    CONSTRAINT questions_reliability_check CHECK (((reliability >= 0.0) 
        AND (reliability <= 1.0))),
    CONSTRAINT questions_times_rated_check CHECK ((times_rated >= 0)),
    CONSTRAINT questions_stem_id_fkey FOREIGN KEY (stem_id) 
        REFERENCES public.questions(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.questions IS 'SAT math questions with ELO and difficulty ratings';
COMMENT ON COLUMN public.questions.options IS 'JSONB array of answer choices';
COMMENT ON COLUMN public.questions.elo_rating IS 'Question difficulty as ELO rating';
COMMENT ON COLUMN public.questions.reliability IS 'Question reliability based on rating history';

-- Question-Category Junction Table (Many-to-Many)
CREATE TABLE public.question_categories (
    id integer NOT NULL,
    question_id integer NOT NULL,
    category_id integer NOT NULL,
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT question_categories_pkey PRIMARY KEY (id),
    CONSTRAINT question_categories_question_id_category_id_key 
        UNIQUE (question_id, category_id),
    CONSTRAINT question_categories_question_id_fkey FOREIGN KEY (question_id)
        REFERENCES public.questions(id) ON DELETE CASCADE,
    CONSTRAINT question_categories_category_id_fkey FOREIGN KEY (category_id)
        REFERENCES public.categories(id) ON DELETE CASCADE
);

COMMENT ON TABLE public.question_categories IS 'Junction table: questions can have multiple categories, categories can have multiple questions';
COMMENT ON COLUMN public.question_categories.is_primary IS 'Whether this is the primary category for the question';

-- Quiz Sessions Table
CREATE TABLE public.quiz_sessions (
    id integer NOT NULL,
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
    CONSTRAINT quiz_sessions_user_id_fkey FOREIGN KEY (user_id) 
        REFERENCES public.users(id) ON DELETE CASCADE
);

COMMENT ON TABLE public.quiz_sessions IS 'User quiz sessions with timing and pause tracking';
COMMENT ON COLUMN public.quiz_sessions.total_pause_duration IS 'Total pause time in seconds';

-- Question Attempts Table
CREATE TABLE public.question_attempts (
    id integer NOT NULL,
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
    player_elo_before integer,
    player_elo_after integer,
    question_elo_before integer,
    question_elo_after integer,
    CONSTRAINT question_attempts_pkey PRIMARY KEY (id),
    CONSTRAINT question_attempts_user_id_fkey FOREIGN KEY (user_id) 
        REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT question_attempts_question_id_fkey FOREIGN KEY (question_id) 
        REFERENCES public.questions(id) ON DELETE CASCADE,
    CONSTRAINT question_attempts_session_id_fkey FOREIGN KEY (session_id) 
        REFERENCES public.quiz_sessions(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.question_attempts IS 'Individual question attempts with ELO changes';
COMMENT ON COLUMN public.question_attempts.time_spent IS 'Time spent on question in seconds';
COMMENT ON COLUMN public.question_attempts.expected_score IS 'Expected outcome probability';
COMMENT ON COLUMN public.question_attempts.elo_change IS 'ELO rating change from this attempt';

-- Admin Activity Log Table
CREATE TABLE public.admin_activity_log (
    id integer NOT NULL,
    admin_user_id integer NOT NULL,
    action character varying(50) NOT NULL,
    table_name character varying(100),
    record_id character varying(100),
    details jsonb,
    ip_address character varying(45),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT admin_activity_log_pkey PRIMARY KEY (id),
    CONSTRAINT admin_activity_log_admin_user_id_fkey FOREIGN KEY (admin_user_id) 
        REFERENCES public.users(id) ON DELETE CASCADE
);

COMMENT ON TABLE public.admin_activity_log IS 'Audit trail for admin actions';

-- ============================================================================
-- SEQUENCES
-- ============================================================================

CREATE SEQUENCE public.admin_activity_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.admin_activity_log_id_seq OWNED BY public.admin_activity_log.id;

CREATE SEQUENCE public.micro_ratings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.micro_ratings_id_seq OWNED BY public.micro_ratings.id;

CREATE SEQUENCE public.player_ratings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.player_ratings_id_seq OWNED BY public.player_ratings.id;

CREATE SEQUENCE public.question_attempts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.question_attempts_id_seq OWNED BY public.question_attempts.id;

CREATE SEQUENCE public.question_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.question_types_id_seq OWNED BY public.categories.id;

CREATE SEQUENCE public.question_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.question_categories_id_seq OWNED BY public.question_categories.id;

CREATE SEQUENCE public.questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.questions_id_seq OWNED BY public.questions.id;

CREATE SEQUENCE public.quiz_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.quiz_sessions_id_seq OWNED BY public.quiz_sessions.id;

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;

-- ============================================================================
-- SET COLUMN DEFAULTS FROM SEQUENCES
-- ============================================================================

ALTER TABLE ONLY public.admin_activity_log ALTER COLUMN id 
    SET DEFAULT nextval('public.admin_activity_log_id_seq'::regclass);

ALTER TABLE ONLY public.micro_ratings ALTER COLUMN id 
    SET DEFAULT nextval('public.micro_ratings_id_seq'::regclass);

ALTER TABLE ONLY public.player_ratings ALTER COLUMN id 
    SET DEFAULT nextval('public.player_ratings_id_seq'::regclass);

ALTER TABLE ONLY public.question_attempts ALTER COLUMN id 
    SET DEFAULT nextval('public.question_attempts_id_seq'::regclass);

ALTER TABLE ONLY public.categories ALTER COLUMN id 
    SET DEFAULT nextval('public.question_types_id_seq'::regclass);

ALTER TABLE ONLY public.question_categories ALTER COLUMN id 
    SET DEFAULT nextval('public.question_categories_id_seq'::regclass);

ALTER TABLE ONLY public.questions ALTER COLUMN id 
    SET DEFAULT nextval('public.questions_id_seq'::regclass);

ALTER TABLE ONLY public.quiz_sessions ALTER COLUMN id 
    SET DEFAULT nextval('public.quiz_sessions_id_seq'::regclass);

ALTER TABLE ONLY public.users ALTER COLUMN id 
    SET DEFAULT nextval('public.users_id_seq'::regclass);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_email ON public.users USING btree (email);
CREATE INDEX idx_users_username ON public.users USING btree (username);

-- Player Ratings indexes
CREATE INDEX idx_player_ratings_user_id ON public.player_ratings USING btree (user_id);
CREATE INDEX idx_player_ratings_elo ON public.player_ratings USING btree (overall_elo);
CREATE INDEX idx_player_ratings_user ON public.player_ratings USING btree (user_id);

-- Micro Ratings indexes
CREATE INDEX idx_micro_ratings_user ON public.micro_ratings USING btree (user_id);
CREATE INDEX idx_micro_ratings_category ON public.micro_ratings USING btree (category_id);
CREATE INDEX idx_micro_ratings_user_category ON public.micro_ratings 
    USING btree (user_id, category_id);

-- Categories indexes
CREATE INDEX idx_categories_active ON public.categories USING btree (is_active);
CREATE INDEX idx_categories_display_order ON public.categories 
    USING btree (display_order);
CREATE INDEX idx_categories_name ON public.categories USING btree (name);

-- Questions indexes
CREATE INDEX idx_questions_difficulty ON public.questions USING btree (difficulty_rating);
CREATE INDEX idx_questions_elo_rating ON public.questions USING btree (elo_rating);
CREATE INDEX idx_questions_stem_id ON public.questions USING btree (stem_id);
CREATE INDEX idx_questions_times_rated ON public.questions USING btree (times_rated);

-- Question Categories indexes (junction table)
CREATE INDEX idx_question_categories_question_id ON public.question_categories 
    USING btree (question_id);
CREATE INDEX idx_question_categories_category_id ON public.question_categories 
    USING btree (category_id);
CREATE INDEX idx_question_categories_is_primary ON public.question_categories 
    USING btree (is_primary);

-- Quiz Sessions indexes
CREATE INDEX idx_quiz_sessions_user_id ON public.quiz_sessions USING btree (user_id);
CREATE INDEX idx_quiz_sessions_type ON public.quiz_sessions USING btree (session_type);
CREATE INDEX idx_quiz_sessions_status ON public.quiz_sessions USING btree (status);
CREATE INDEX idx_quiz_sessions_user ON public.quiz_sessions USING btree (user_id);

-- Question Attempts indexes
CREATE INDEX idx_question_attempts_user_id ON public.question_attempts USING btree (user_id);
CREATE INDEX idx_question_attempts_question_id ON public.question_attempts 
    USING btree (question_id);
CREATE INDEX idx_question_attempts_session_id ON public.question_attempts 
    USING btree (session_id);
CREATE INDEX idx_question_attempts_created ON public.question_attempts 
    USING btree (created_at);
CREATE INDEX idx_question_attempts_user ON public.question_attempts USING btree (user_id);
CREATE INDEX idx_question_attempts_question ON public.question_attempts 
    USING btree (question_id);
CREATE INDEX idx_question_attempts_session ON public.question_attempts 
    USING btree (session_id);
CREATE INDEX idx_question_attempts_elo ON public.question_attempts 
    USING btree (player_elo_before, question_elo_before);

-- Admin Activity Log indexes
CREATE INDEX idx_admin_activity_log_admin_user ON public.admin_activity_log 
    USING btree (admin_user_id);
CREATE INDEX idx_admin_activity_log_action ON public.admin_activity_log USING btree (action);
CREATE INDEX idx_admin_activity_log_table ON public.admin_activity_log 
    USING btree (table_name);
CREATE INDEX idx_admin_activity_log_created ON public.admin_activity_log 
    USING btree (created_at DESC);
CREATE INDEX idx_admin_activity_action ON public.admin_activity_log USING btree (action);
CREATE INDEX idx_admin_activity_created ON public.admin_activity_log USING btree (created_at);
CREATE INDEX idx_admin_activity_user ON public.admin_activity_log USING btree (admin_user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Users table triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Player Ratings triggers
CREATE TRIGGER update_player_ratings_updated_at BEFORE UPDATE ON public.player_ratings 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_player_k_factor BEFORE UPDATE ON public.player_ratings 
    FOR EACH ROW EXECUTE FUNCTION public.update_player_k_factor();

-- Micro Ratings triggers
CREATE TRIGGER update_micro_ratings_timestamp BEFORE UPDATE ON public.micro_ratings 
    FOR EACH ROW EXECUTE FUNCTION public.update_micro_ratings_timestamp();

-- Categories triggers (formerly question_types)
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Questions triggers
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questions 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_question_k_factor BEFORE UPDATE ON public.questions 
    FOR EACH ROW EXECUTE FUNCTION public.update_question_k_factor();

CREATE TRIGGER trigger_update_question_reliability BEFORE UPDATE ON public.questions 
    FOR EACH ROW EXECUTE FUNCTION public.update_question_reliability();

-- ============================================================================
-- END OF SCHEMA CREATION
-- ============================================================================
-- Database schema successfully created!
-- All tables, functions, triggers, indexes, and constraints are in place.
-- The database is ready for data import or use.
-- ============================================================================
