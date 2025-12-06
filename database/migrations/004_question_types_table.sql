-- Migration: 004_question_types_table.sql
-- Description: Create question_types table and establish FK relationship with questions
-- Date: December 5, 2025
-- Author: Sydney Learning Platform

BEGIN;

-- =============================================================================
-- STEP 1: Create question_types table
-- =============================================================================

CREATE TABLE IF NOT EXISTS question_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_id VARCHAR(50),
    difficulty_level VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT question_types_name_unique UNIQUE (name),
    CONSTRAINT question_types_difficulty_check CHECK (
        difficulty_level IN ('easy', 'medium', 'hard', 'mixed') OR difficulty_level IS NULL
    )
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_question_types_category ON question_types(category_id);
CREATE INDEX IF NOT EXISTS idx_question_types_active ON question_types(is_active);
CREATE INDEX IF NOT EXISTS idx_question_types_display_order ON question_types(display_order);

-- =============================================================================
-- STEP 2: Create updated_at trigger for question_types
-- =============================================================================

CREATE OR REPLACE FUNCTION update_question_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_question_types_updated_at ON question_types;
CREATE TRIGGER trigger_update_question_types_updated_at
    BEFORE UPDATE ON question_types
    FOR EACH ROW
    EXECUTE FUNCTION update_question_types_updated_at();

-- =============================================================================
-- STEP 3: Seed initial question types (66 types across 22 categories)
-- =============================================================================

INSERT INTO question_types (id, name, description, category_id, difficulty_level, display_order) VALUES

-- ALGEBRA - Linear Equations (Category 1)
('linear-eq-1var-basic', 'Linear Equations in One Variable - Basic', 'Solve basic linear equations like 2x + 3 = 7', 'algebra-linear-eq-1var', 'easy', 1),
('linear-eq-1var-intermediate', 'Linear Equations in One Variable - Intermediate', 'Solve equations with fractions and decimals', 'algebra-linear-eq-1var', 'medium', 2),
('linear-eq-1var-advanced', 'Linear Equations in One Variable - Advanced', 'Complex linear equations with multiple steps', 'algebra-linear-eq-1var', 'hard', 3),

-- ALGEBRA - Systems of Equations (Category 2)
('systems-2var-substitution', 'Systems of Equations - Substitution Method', 'Solve 2x2 systems using substitution', 'algebra-systems-2var', 'medium', 4),
('systems-2var-elimination', 'Systems of Equations - Elimination Method', 'Solve 2x2 systems using elimination', 'algebra-systems-2var', 'medium', 5),
('systems-2var-graphical', 'Systems of Equations - Graphical Analysis', 'Interpret systems graphically', 'algebra-systems-2var', 'medium', 6),

-- ALGEBRA - Inequalities (Category 3)
('linear-inequalities-basic', 'Linear Inequalities - Basic', 'Solve and graph basic inequalities', 'algebra-linear-inequalities', 'easy', 7),
('linear-inequalities-compound', 'Linear Inequalities - Compound', 'Solve compound inequalities (AND/OR)', 'algebra-linear-inequalities', 'medium', 8),
('linear-inequalities-absolute', 'Inequalities with Absolute Value', 'Solve |ax + b| < c type inequalities', 'algebra-linear-inequalities', 'hard', 9),

-- ALGEBRA - Linear Functions (Category 4)
('linear-functions-slope', 'Linear Functions - Slope and Rate of Change', 'Calculate and interpret slope', 'algebra-linear-functions', 'easy', 10),
('linear-functions-equation', 'Linear Functions - Writing Equations', 'Write equations in various forms', 'algebra-linear-functions', 'medium', 11),
('linear-functions-applications', 'Linear Functions - Real-World Applications', 'Apply linear models to scenarios', 'algebra-linear-functions', 'medium', 12),

-- ALGEBRA - Quadratic Functions (Category 5)
('quadratic-functions-graphing', 'Quadratic Functions - Graphing', 'Identify vertex, axis of symmetry, intercepts', 'algebra-quadratic-functions', 'medium', 13),
('quadratic-functions-transformations', 'Quadratic Functions - Transformations', 'Understand shifts and stretches', 'algebra-quadratic-functions', 'medium', 14),
('quadratic-functions-applications', 'Quadratic Functions - Applications', 'Optimize and model with quadratics', 'algebra-quadratic-functions', 'hard', 15),

-- ALGEBRA - Exponential Functions (Category 6)
('exponential-growth-decay', 'Exponential Functions - Growth and Decay', 'Model growth/decay situations', 'algebra-exponential-functions', 'medium', 16),
('exponential-properties', 'Exponential Functions - Properties', 'Use exponent rules and properties', 'algebra-exponential-functions', 'medium', 17),
('exponential-equations', 'Exponential Functions - Solving Equations', 'Solve exponential equations', 'algebra-exponential-functions', 'hard', 18),

-- ALGEBRA - Polynomial Functions (Category 7)
('polynomial-operations', 'Polynomial Functions - Operations', 'Add, subtract, multiply polynomials', 'algebra-polynomial-functions', 'easy', 19),
('polynomial-factoring', 'Polynomial Functions - Factoring', 'Factor polynomials completely', 'algebra-polynomial-functions', 'medium', 20),
('polynomial-graphs', 'Polynomial Functions - Graphs and Behavior', 'Analyze end behavior and zeros', 'algebra-polynomial-functions', 'hard', 21),

-- ALGEBRA - Rational Functions (Category 8)
('rational-operations', 'Rational Functions - Operations', 'Add, subtract, multiply, divide rational expressions', 'algebra-rational-functions', 'medium', 22),
('rational-equations', 'Rational Functions - Solving Equations', 'Solve rational equations', 'algebra-rational-functions', 'medium', 23),
('rational-asymptotes', 'Rational Functions - Asymptotes and Graphs', 'Identify asymptotes and holes', 'algebra-rational-functions', 'hard', 24),

-- ADVANCED MATH - Quadratic Equations (Category 9)
('quadratic-factoring', 'Quadratic Equations - Factoring', 'Solve by factoring', 'advanced-quadratic-equations', 'easy', 25),
('quadratic-completing-square', 'Quadratic Equations - Completing the Square', 'Solve by completing the square', 'advanced-quadratic-equations', 'medium', 26),
('quadratic-formula', 'Quadratic Equations - Quadratic Formula', 'Apply quadratic formula', 'advanced-quadratic-equations', 'medium', 27),

-- ADVANCED MATH - Polynomial Expressions (Category 10)
('polynomial-expr-complex', 'Polynomial Expressions - Complex Operations', 'Advanced polynomial manipulation', 'advanced-polynomial-expressions', 'hard', 28),
('polynomial-expr-theorems', 'Polynomial Expressions - Theorems', 'Remainder theorem, factor theorem', 'advanced-polynomial-expressions', 'hard', 29),
('polynomial-expr-zeros', 'Polynomial Expressions - Finding Zeros', 'Rational root theorem applications', 'advanced-polynomial-expressions', 'hard', 30),

-- ADVANCED MATH - Rational Expressions (Category 11)
('rational-expr-simplify', 'Rational Expressions - Simplification', 'Simplify complex rational expressions', 'advanced-rational-expressions', 'medium', 31),
('rational-expr-partial-fractions', 'Rational Expressions - Partial Fractions', 'Decompose into partial fractions', 'advanced-rational-expressions', 'hard', 32),
('rational-expr-complex', 'Rational Expressions - Complex Operations', 'Multi-step rational operations', 'advanced-rational-expressions', 'hard', 33),

-- ADVANCED MATH - Radical Expressions (Category 12)
('radical-simplify', 'Radical Expressions - Simplification', 'Simplify radicals and rationalize', 'advanced-radical-expressions', 'medium', 34),
('radical-equations', 'Radical Expressions - Solving Equations', 'Solve equations with radicals', 'advanced-radical-expressions', 'medium', 35),
('radical-complex', 'Radical Expressions - Complex Radicals', 'Operations with higher-order radicals', 'advanced-radical-expressions', 'hard', 36),

-- ADVANCED MATH - Exponential Functions (Category 13)
('exponential-adv-modeling', 'Exponential Functions - Advanced Modeling', 'Continuous growth models', 'advanced-exponential-functions', 'hard', 37),
('exponential-adv-transformations', 'Exponential Functions - Transformations', 'Complex exponential transformations', 'advanced-exponential-functions', 'hard', 38),
('exponential-adv-systems', 'Exponential Functions - Systems', 'Systems with exponentials', 'advanced-exponential-functions', 'hard', 39),

-- ADVANCED MATH - Logarithmic Functions (Category 14)
('logarithm-properties', 'Logarithmic Functions - Properties', 'Apply log properties', 'advanced-logarithmic-functions', 'medium', 40),
('logarithm-equations', 'Logarithmic Functions - Solving Equations', 'Solve logarithmic equations', 'advanced-logarithmic-functions', 'hard', 41),
('logarithm-applications', 'Logarithmic Functions - Applications', 'pH, decibels, Richter scale', 'advanced-logarithmic-functions', 'hard', 42),

-- ADVANCED MATH - Trigonometric Functions (Category 15)
('trig-unit-circle', 'Trigonometric Functions - Unit Circle', 'Use unit circle to find values', 'advanced-trig-functions', 'medium', 43),
('trig-identities', 'Trigonometric Functions - Identities', 'Apply trigonometric identities', 'advanced-trig-functions', 'hard', 44),
('trig-equations', 'Trigonometric Functions - Solving Equations', 'Solve trigonometric equations', 'advanced-trig-functions', 'hard', 45),

-- PROBLEM SOLVING - Ratios (Category 16)
('ratios-proportions-basic', 'Ratios and Proportions - Basic', 'Solve simple proportion problems', 'problem-solving-ratios', 'easy', 46),
('ratios-proportions-complex', 'Ratios and Proportions - Complex', 'Multi-step ratio problems', 'problem-solving-ratios', 'medium', 47),
('ratios-scale-factors', 'Ratios - Scale Factors', 'Scale drawings and models', 'problem-solving-ratios', 'medium', 48),

-- PROBLEM SOLVING - Percentages (Category 17)
('percentages-basic', 'Percentages - Basic Calculations', 'Find percentage of a number', 'problem-solving-percentages', 'easy', 49),
('percentages-change', 'Percentages - Percent Change', 'Calculate increase/decrease', 'problem-solving-percentages', 'medium', 50),
('percentages-applications', 'Percentages - Real-World Applications', 'Tax, tip, discount, interest', 'problem-solving-percentages', 'medium', 51),

-- PROBLEM SOLVING - Unit Conversion (Category 18)
('unit-conversion-basic', 'Unit Conversion - Basic', 'Convert within same system', 'problem-solving-unit-conversion', 'easy', 52),
('unit-conversion-rates', 'Unit Conversion - Rates', 'Speed, density, flow rate', 'problem-solving-unit-conversion', 'medium', 53),
('unit-conversion-multi-step', 'Unit Conversion - Multi-Step', 'Complex conversion chains', 'problem-solving-unit-conversion', 'medium', 54),

-- PROBLEM SOLVING - Data Interpretation (Category 19)
('data-tables-charts', 'Data Interpretation - Tables and Charts', 'Extract info from data displays', 'problem-solving-data-interpretation', 'easy', 55),
('data-statistics', 'Data Interpretation - Statistics', 'Mean, median, mode, range', 'problem-solving-data-interpretation', 'medium', 56),
('data-trends', 'Data Interpretation - Trends and Predictions', 'Analyze patterns in data', 'problem-solving-data-interpretation', 'medium', 57),

-- GEOMETRY - Coordinate Geometry (Category 20)
('coord-geometry-distance', 'Coordinate Geometry - Distance Formula', 'Find distance between points', 'geometry-coordinate', 'easy', 58),
('coord-geometry-midpoint', 'Coordinate Geometry - Midpoint Formula', 'Find midpoint of segments', 'geometry-coordinate', 'easy', 59),
('coord-geometry-circles', 'Coordinate Geometry - Circles', 'Equations and properties of circles', 'geometry-coordinate', 'medium', 60),

-- GEOMETRY - Trigonometry Applications (Category 21)
('trig-applications-right-triangles', 'Trigonometry - Right Triangle Applications', 'Solve right triangles', 'geometry-trig-applications', 'medium', 61),
('trig-applications-non-right', 'Trigonometry - Non-Right Triangles', 'Law of sines, law of cosines', 'geometry-trig-applications', 'hard', 62),
('trig-applications-real-world', 'Trigonometry - Real-World Applications', 'Angles of elevation/depression', 'geometry-trig-applications', 'hard', 63),

-- MIXED/DIAGNOSTIC (Category 22)
('diagnostic-mixed-easy', 'Diagnostic Assessment - Easy', 'Mixed topics, easy level', 'diagnostic-mixed', 'easy', 64),
('diagnostic-mixed-medium', 'Diagnostic Assessment - Medium', 'Mixed topics, medium level', 'diagnostic-mixed', 'medium', 65),
('diagnostic-mixed-hard', 'Diagnostic Assessment - Hard', 'Mixed topics, hard level', 'diagnostic-mixed', 'hard', 66)

ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- STEP 4: Check existing question_type values before migration
-- =============================================================================

-- Log existing question_type values for mapping reference
DO $$
DECLARE
    type_count INTEGER;
BEGIN
    SELECT COUNT(DISTINCT question_type) INTO type_count FROM questions;
    RAISE NOTICE 'Found % distinct question_type values in questions table', type_count;
END $$;

-- =============================================================================
-- STEP 5: Add question_type_id column to questions table
-- =============================================================================

-- Add new column (nullable initially)
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS question_type_id VARCHAR(50);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_questions_question_type_id ON questions(question_type_id);

-- =============================================================================
-- STEP 6: Migrate existing data
-- =============================================================================

-- First, insert any missing question types from existing data
INSERT INTO question_types (id, name, description, category_id, difficulty_level, display_order)
SELECT DISTINCT
    LOWER(REPLACE(REPLACE(question_type, ' ', '-'), '_', '-')) as id,
    question_type as name,
    'Migrated from existing questions' as description,
    'migrated' as category_id,
    'medium' as difficulty_level,
    100 as display_order
FROM questions
WHERE question_type IS NOT NULL 
  AND question_type != ''
  AND LOWER(REPLACE(REPLACE(question_type, ' ', '-'), '_', '-')) NOT IN (SELECT id FROM question_types)
ON CONFLICT (id) DO NOTHING;

-- Map existing question_type values to new question_type_id
UPDATE questions 
SET question_type_id = CASE 
    -- Direct mappings for known types
    WHEN question_type ILIKE '%linear equation%one variable%' THEN 'linear-eq-1var-basic'
    WHEN question_type ILIKE '%linear equation%' AND question_type NOT ILIKE '%system%' THEN 'linear-eq-1var-intermediate'
    WHEN question_type ILIKE '%system%equation%' THEN 'systems-2var-substitution'
    WHEN question_type ILIKE '%inequalit%' THEN 'linear-inequalities-basic'
    WHEN question_type ILIKE '%linear function%' THEN 'linear-functions-slope'
    WHEN question_type ILIKE '%quadratic function%' THEN 'quadratic-functions-graphing'
    WHEN question_type ILIKE '%quadratic equation%' THEN 'quadratic-factoring'
    WHEN question_type ILIKE '%exponential%' THEN 'exponential-growth-decay'
    WHEN question_type ILIKE '%polynomial%' THEN 'polynomial-operations'
    WHEN question_type ILIKE '%rational%function%' THEN 'rational-operations'
    WHEN question_type ILIKE '%rational%expression%' THEN 'rational-expr-simplify'
    WHEN question_type ILIKE '%radical%' THEN 'radical-simplify'
    WHEN question_type ILIKE '%logarithm%' THEN 'logarithm-properties'
    WHEN question_type ILIKE '%trigonometr%' THEN 'trig-unit-circle'
    WHEN question_type ILIKE '%ratio%' OR question_type ILIKE '%proportion%' THEN 'ratios-proportions-basic'
    WHEN question_type ILIKE '%percent%' THEN 'percentages-basic'
    WHEN question_type ILIKE '%unit%conversion%' THEN 'unit-conversion-basic'
    WHEN question_type ILIKE '%data%' OR question_type ILIKE '%statistic%' THEN 'data-statistics'
    WHEN question_type ILIKE '%coordinate%' THEN 'coord-geometry-distance'
    WHEN question_type ILIKE '%geometry%' THEN 'coord-geometry-distance'
    -- Fallback: use slugified version of original type
    ELSE COALESCE(
        (SELECT id FROM question_types 
         WHERE id = LOWER(REPLACE(REPLACE(question_type, ' ', '-'), '_', '-')) 
         LIMIT 1),
        'diagnostic-mixed-medium'
    )
END
WHERE question_type_id IS NULL AND question_type IS NOT NULL;

-- Set default for any remaining null values
UPDATE questions 
SET question_type_id = 'diagnostic-mixed-medium'
WHERE question_type_id IS NULL;

-- =============================================================================
-- STEP 7: Add foreign key constraint
-- =============================================================================

-- Make column NOT NULL after migration
ALTER TABLE questions 
ALTER COLUMN question_type_id SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE questions
ADD CONSTRAINT fk_questions_question_type 
FOREIGN KEY (question_type_id) 
REFERENCES question_types(id) 
ON DELETE RESTRICT 
ON UPDATE CASCADE;

-- =============================================================================
-- STEP 8: Rename old column (keep for safety, don't drop yet)
-- =============================================================================

-- Check if old column exists before renaming
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'questions' AND column_name = 'question_type'
    ) THEN
        ALTER TABLE questions RENAME COLUMN question_type TO question_type_old;
        RAISE NOTICE 'Renamed question_type to question_type_old for safety';
    END IF;
END $$;

-- =============================================================================
-- STEP 9: Create helper views
-- =============================================================================

-- View to easily see questions with their type info
CREATE OR REPLACE VIEW v_questions_with_types AS
SELECT 
    q.id,
    q.question_text,
    q.question_type_id,
    qt.name as question_type_name,
    qt.category_id,
    qt.difficulty_level as type_difficulty,
    q.elo_rating,
    q.difficulty_rating,
    q.times_answered,
    q.times_correct,
    CASE WHEN q.times_answered > 0 
        THEN ROUND((q.times_correct::DECIMAL / q.times_answered) * 100, 2)
        ELSE 0 
    END as success_rate,
    q.created_at
FROM questions q
LEFT JOIN question_types qt ON q.question_type_id = qt.id;

-- View for question type statistics
CREATE OR REPLACE VIEW v_question_type_stats AS
SELECT 
    qt.id,
    qt.name,
    qt.category_id,
    qt.difficulty_level,
    qt.display_order,
    COUNT(q.id) as total_questions,
    COALESCE(AVG(q.elo_rating)::INTEGER, 1200) as avg_elo,
    COALESCE(AVG(CASE WHEN q.times_answered > 0 
        THEN (q.times_correct::DECIMAL / q.times_answered) * 100 
        ELSE NULL END)::DECIMAL(5,2), 0) as avg_success_rate,
    COALESCE(SUM(q.times_answered), 0) as total_attempts
FROM question_types qt
LEFT JOIN questions q ON q.question_type_id = qt.id
GROUP BY qt.id, qt.name, qt.category_id, qt.difficulty_level, qt.display_order
ORDER BY qt.display_order;

-- =============================================================================
-- STEP 10: Verify migration
-- =============================================================================

DO $$
DECLARE
    total_types INTEGER;
    total_questions INTEGER;
    orphaned_questions INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_types FROM question_types;
    SELECT COUNT(*) INTO total_questions FROM questions;
    SELECT COUNT(*) INTO orphaned_questions 
    FROM questions 
    WHERE question_type_id NOT IN (SELECT id FROM question_types);
    
    RAISE NOTICE '=== Migration Summary ===';
    RAISE NOTICE 'Total question types: %', total_types;
    RAISE NOTICE 'Total questions: %', total_questions;
    RAISE NOTICE 'Orphaned questions (should be 0): %', orphaned_questions;
    
    IF orphaned_questions > 0 THEN
        RAISE EXCEPTION 'Migration failed: % orphaned questions found', orphaned_questions;
    END IF;
END $$;

COMMIT;

-- =============================================================================
-- ROLLBACK SCRIPT (run separately if needed)
-- =============================================================================
/*
BEGIN;

-- Remove foreign key
ALTER TABLE questions DROP CONSTRAINT IF EXISTS fk_questions_question_type;

-- Restore old column name if it was renamed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'questions' AND column_name = 'question_type_old'
    ) THEN
        ALTER TABLE questions RENAME COLUMN question_type_old TO question_type;
    END IF;
END $$;

-- Remove new column
ALTER TABLE questions DROP COLUMN IF EXISTS question_type_id;

-- Drop views
DROP VIEW IF EXISTS v_questions_with_types;
DROP VIEW IF EXISTS v_question_type_stats;

-- Drop trigger and function
DROP TRIGGER IF EXISTS trigger_update_question_types_updated_at ON question_types;
DROP FUNCTION IF EXISTS update_question_types_updated_at();

-- Drop table
DROP TABLE IF EXISTS question_types CASCADE;

COMMIT;
*/
