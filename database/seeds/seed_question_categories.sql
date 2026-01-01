-- ============================================================================
-- Seed: Question-Category Relationships (Many-to-Many)
-- Sydney SAT Learning Platform - Development Test Data
-- ============================================================================
-- This file links questions to their categories in a many-to-many relationship.
-- Each question can belong to one or more categories.
-- is_primary indicates the main category for the question.
--
-- WARNING: This file is for DEVELOPMENT ONLY!
-- Do NOT use in production. Replace with actual production data.
--
-- Execution: Run AFTER seed_categories.sql and seed_questions.sql
-- ============================================================================

-- ============================================================================
-- QUESTION-CATEGORY RELATIONSHIPS
-- ============================================================================
-- Link questions to categories based on their content
-- Using SELECT to match by question text and category name

-- Single Variable Equations
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c
WHERE q.question_text IN (
    'If 3x + 5 = 14, what is the value of x?',
    'Solve |x - 3| = 5',
    'If g(x) = x² - 4x + 3 and h(x) = x + 1, what is g(h(2))?',
    'Solve: 2x + 3 = 7',
    'Solve: x + 5 = 12',
    'Solve: 4x = 20',
    'Solve: x - 3 = 10',
    'Solve: 5x = 25',
    'Solve: 7x = 49',
    'Solve: x + 7 = 15',
    'Solve: 6x = 36',
    'Solve: x + 9 = 20',
    'Solve: x + 11 = 25',
    'Solve: 8x = 64',
    'Solve: x + 13 = 30',
    'Solve: 9x = 81'
) AND c.name = 'Single Variable Equations' ON CONFLICT DO NOTHING;

-- Percentages
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c
WHERE q.question_text IN (
    'What is 25% of 80?',
    'If 3/4 = x/12, what is x?',
    'A price increases from $40 to $50. What is the percent increase?',
    'What is 15% of 200?',
    'What is 40% of 150?',
    'What is 20% of 300?',
    'What is 30% of 200?',
    'What is 50% of 100?',
    'What is 60% of 150?',
    'What is 70% of 200?',
    'What is 80% of 250?',
    'What is 90% of 300?',
    'What is 100% of 50?',
    'What is 25% of 400?',
    'What is 35% of 200?',
    'What is 45% of 200?'
) AND c.name = 'Percentages' ON CONFLICT DO NOTHING;

-- Areas and Volumes
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c
WHERE q.question_text IN (
    'What is the area of a rectangle with length 8 and width 6?',
    'What is the area of a triangle with base 10 and height 5?',
    'What is the perimeter of a square with side 4?',
    'What is the volume of a cube with side 2?',
    'What is the surface area of a cube with side 3?',
    'What is the area of a trapezoid with bases 6 and 10, height 4?',
    'What is the volume of a rectangular prism with length 4, width 3, height 2?',
    'What is the area of a parallelogram with base 8 and height 5?',
    'What is the area of an equilateral triangle with side 6?',
    'What is the volume of a sphere with radius 3? (Use π = 3.14)'
) AND c.name = 'Areas and Volumes' ON CONFLICT DO NOTHING;

-- Fractions & Exponents
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c
WHERE q.question_text IN (
    'What is 2/3 + 1/6?',
    'What is 2³?',
    'Express 0.00045 in scientific notation',
    'Simplify: (x² - 4)/(x + 2)',
    'Simplify: 4/8',
    'What is 5²?',
    'Simplify: 6/12',
    'What is 3³?',
    'Simplify: 8/16',
    'What is 4²?',
    'Simplify: 9/18',
    'What is 6²?',
    'Simplify: 10/20',
    'What is 7²?',
    'Simplify: 12/24',
    'What is 8²?',
    'Simplify: 14/28',
    'What is 9²?',
    'Simplify: 16/32',
    'What is 10²?',
    'Simplify: 18/36',
    'What is 11²?',
    'Simplify: 20/40',
    'What is 12²?',
    'Simplify: 22/44',
    'What is 13²?',
    'Simplify: 24/48',
    'What is 14²?'
) AND c.name = 'Fractions & Exponents' ON CONFLICT DO NOTHING;

-- Angle Properties
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c
WHERE q.question_text IN (
    'What is the slope of the line passing through points (2, 3) and (6, 7)?',
    'What is the distance between points (1, 2) and (4, 6)?',
    'What is the slope between (0,0) and (3,6)?',
    'What is the slope between (1,1) and (3,5)?',
    'What is the slope between (2,4) and (5,10)?',
    'What is the slope between (0,2) and (4,6)?',
    'What is the slope between (3,1) and (7,9)?',
    'What is the slope between (5,3) and (8,11)?'
) AND c.name = 'Angle Properties' ON CONFLICT DO NOTHING;

-- Quadratic Equations
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c
WHERE q.question_text IN (
    'If x² - 5x + 6 = 0, what are the possible values of x?',
    'If (x + 2)² = 25, what are all possible values of x?',
    'Factor: x² - 9',
    'Factor: x² - 4',
    'Factor: x² - 1',
    'Factor: x² - 25',
    'Factor: x² - 36',
    'Factor: x² - 49'
) AND c.name = 'Quadratic Equations' ON CONFLICT DO NOTHING;

-- Systems of Equations
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c
WHERE q.question_text IN (
    'If 2x + y = 8 and x - y = 1, what is the value of x?',
    'Sarah has 3 times as many books as Tom. Together they have 24 books. How many books does Sarah have?'
) AND c.name = 'Systems of Equations' ON CONFLICT DO NOTHING;

-- Function Transformations
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c
WHERE q.question_text IN (
    'If f(x) = 2x + 3, what is f(4)?',
    'In an arithmetic sequence, the first term is 3 and the common difference is 4. What is the 10th term?',
    'What is the y-intercept of y = 2x + 3?',
    'What is the x-intercept of y = 3x - 6?',
    'What is the y-intercept of y = 4x + 2?',
    'What is the x-intercept of y = 5x - 10?',
    'What is the y-intercept of y = -2x + 8?',
    'What is the x-intercept of y = 6x - 12?'
) AND c.name = 'Function Transformations' ON CONFLICT DO NOTHING;

-- Circles
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c
WHERE q.question_text IN (
    'What is the circumference of a circle with radius 5? (Use π = 3.14)',
    'A circle has center (2, 3) and radius 4. Which point lies on the circle?',
    'What is the area of a circle with radius 3? (Use π = 3.14)',
    'What is the circumference of a circle with radius 2? (Use π = 3.14)',
    'What is the circumference of a circle with diameter 10? (Use π = 3.14)'
) AND c.name = 'Circles' ON CONFLICT DO NOTHING;

-- Linear Equations
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c
WHERE q.question_text = 'Solve for x: 3x - 7 > 8'
AND c.name = 'Linear Equations' ON CONFLICT DO NOTHING;

-- Probability and Statistics
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c
WHERE q.question_text = 'What is the probability of rolling a 4 on a standard six-sided die?'
AND c.name = 'Probability and Statistics' ON CONFLICT DO NOTHING;

-- Means and Medians
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c
WHERE q.question_text IN (
    'The median of the dataset {2, 5, 7, x, 12} is 7. What is x?',
    'The mean of 5 numbers is 12. If four of the numbers are 10, 11, 13, and 15, what is the fifth number?'
) AND c.name = 'Means and Medians' ON CONFLICT DO NOTHING;

-- Exponential Equations
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c
WHERE q.question_text = 'A population doubles every 3 years. If the initial population is 100, what will it be after 9 years?'
AND c.name = 'Exponential Equations' ON CONFLICT DO NOTHING;

-- Similar Triangles
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c
WHERE q.question_text = 'In a right triangle, one leg is 3 and the hypotenuse is 5. What is the length of the other leg?'
AND c.name = 'Similar Triangles' ON CONFLICT DO NOTHING;

-- Polynomials
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c
WHERE q.question_text = 'Factor completely: x³ - 8'
AND c.name = 'Polynomials' ON CONFLICT DO NOTHING;

-- Rates
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c
WHERE q.question_text = 'If log₂(x) = 3, what is x?'
AND c.name = 'Rates' ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify the relationships
SELECT 'Question-Category Relationships Created' as status, COUNT(*) as count FROM question_categories;