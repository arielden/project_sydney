-- ============================================================================
-- Development Seed File: Sample Questions (Many-to-Many)
-- Sydney SAT Learning Platform - Development Test Data
-- ============================================================================
-- This file contains sample SAT-style questions for development and testing.
-- Updated for many-to-many relationships between questions and categories.
-- Updated to match 18 new categories (December 18, 2025).
-- 
-- WARNING: This file is for DEVELOPMENT ONLY!
-- Do NOT use in production. Replace with actual production questions.
-- 
-- Execution: Run AFTER seed_categories.sql
-- ============================================================================

-- ============================================================================
-- SECTION 1: SAMPLE SAT MATH QUESTIONS (WITHOUT category_id)
-- ============================================================================
-- Insert sample questions into the questions table for testing and development

INSERT INTO questions (question_text, options, correct_answer, explanation, difficulty_rating, is_diagnostic) VALUES 

-- Easy Level Questions (1000-1100)
('If 3x + 5 = 14, what is the value of x?', '[{"id": "A", "text": "2"}, {"id": "B", "text": "3"}, {"id": "C", "text": "4"}, {"id": "D", "text": "5"}]', 'B', 'Solving for x: 3x + 5 = 14, so 3x = 9, therefore x = 3.', 1050, true),

('What is 25% of 80?', '[{"id": "A", "text": "15"}, {"id": "B", "text": "20"}, {"id": "C", "text": "25"}, {"id": "D", "text": "30"}]', 'B', '25% of 80 = 0.25 × 80 = 20.', 1000, false),

('What is the area of a rectangle with length 8 and width 6?', '[{"id": "A", "text": "14"}, {"id": "B", "text": "28"}, {"id": "C", "text": "48"}, {"id": "D", "text": "56"}]', 'C', 'Area of rectangle = length × width = 8 × 6 = 48.', 1020, false),

('What is 2/3 + 1/6?', '[{"id": "A", "text": "3/9"}, {"id": "B", "text": "3/6"}, {"id": "C", "text": "4/6"}, {"id": "D", "text": "5/6"}]', 'D', 'Convert to common denominator: 2/3 = 4/6, so 4/6 + 1/6 = 5/6.', 1080, true),

('What is 2³?', '[{"id": "A", "text": "6"}, {"id": "B", "text": "8"}, {"id": "C", "text": "9"}, {"id": "D", "text": "12"}]', 'B', '2³ = 2 × 2 × 2 = 8.', 1010, false),

('What is the slope of the line passing through points (2, 3) and (6, 7)?', '[{"id": "A", "text": "1"}, {"id": "B", "text": "2"}, {"id": "C", "text": "1/2"}, {"id": "D", "text": "4"}]', 'A', 'Slope = (y₂ - y₁)/(x₂ - x₁) = (7 - 3)/(6 - 2) = 4/4 = 1.', 1030, true),

-- Medium Level Questions (1100-1300)
('If x² - 5x + 6 = 0, what are the possible values of x?', '[{"id": "A", "text": "x = 2 or x = 3"}, {"id": "B", "text": "x = 1 or x = 6"}, {"id": "C", "text": "x = -2 or x = -3"}, {"id": "D", "text": "x = 2 or x = -3"}]', 'A', 'Factor: (x - 2)(x - 3) = 0, so x = 2 or x = 3.', 1180, true),

('If 2x + y = 8 and x - y = 1, what is the value of x?', '[{"id": "A", "text": "2"}, {"id": "B", "text": "3"}, {"id": "C", "text": "4"}, {"id": "D", "text": "5"}]', 'B', 'Add the equations: 3x = 9, so x = 3.', 1220, true),

('If f(x) = 2x + 3, what is f(4)?', '[{"id": "A", "text": "8"}, {"id": "B", "text": "11"}, {"id": "C", "text": "14"}, {"id": "D", "text": "17"}]', 'B', 'f(4) = 2(4) + 3 = 8 + 3 = 11.', 1150, false),

('What is the circumference of a circle with radius 5? (Use π = 3.14)', '[{"id": "A", "text": "15.7"}, {"id": "B", "text": "31.4"}, {"id": "C", "text": "78.5"}, {"id": "D", "text": "157"}]', 'B', 'Circumference = 2πr = 2 × 3.14 × 5 = 31.4.', 1200, false),

('Solve for x: 3x - 7 > 8', '[{"id": "A", "text": "x > 5"}, {"id": "B", "text": "x > 15/3"}, {"id": "C", "text": "x > 1/3"}, {"id": "D", "text": "x > 15"}]', 'A', '3x - 7 > 8, so 3x > 15, therefore x > 5.', 1160, true),

('What is the probability of rolling a 4 on a standard six-sided die?', '[{"id": "A", "text": "1/4"}, {"id": "B", "text": "1/6"}, {"id": "C", "text": "1/3"}, {"id": "D", "text": "2/3"}]', 'B', 'There is 1 favorable outcome out of 6 possible outcomes: 1/6.', 1120, false),

('If 3/4 = x/12, what is x?', '[{"id": "A", "text": "8"}, {"id": "B", "text": "9"}, {"id": "C", "text": "10"}, {"id": "D", "text": "16"}]', 'B', 'Cross multiply: 3 × 12 = 4 × x, so 36 = 4x, x = 9.', 1140, false),

('Solve |x - 3| = 5', '[{"id": "A", "text": "x = 8 only"}, {"id": "B", "text": "x = -2 only"}, {"id": "C", "text": "x = 8 or x = -2"}, {"id": "D", "text": "x = 2 or x = 8"}]', 'C', 'x - 3 = 5 or x - 3 = -5, so x = 8 or x = -2.', 1250, true),

('Sarah has 3 times as many books as Tom. Together they have 24 books. How many books does Sarah have?', '[{"id": "A", "text": "6"}, {"id": "B", "text": "12"}, {"id": "C", "text": "18"}, {"id": "D", "text": "21"}]', 'C', 'Let Tom have x books. Sarah has 3x. Total: x + 3x = 24, so 4x = 24, x = 6. Sarah has 3(6) = 18.', 1280, false),

('The median of the dataset {2, 5, 7, x, 12} is 7. What is x?', '[{"id": "A", "text": "7"}, {"id": "B", "text": "8"}, {"id": "C", "text": "9"}, {"id": "D", "text": "10"}]', 'A', 'For median to be 7, x must be 7 (so the middle value in the ordered set is 7).', 1210, true),

('What is the distance between points (1, 2) and (4, 6)?', '[{"id": "A", "text": "3"}, {"id": "B", "text": "4"}, {"id": "C", "text": "5"}, {"id": "D", "text": "7"}]', 'C', 'Distance = √[(4-1)² + (6-2)²] = √[9 + 16] = √25 = 5.', 1270, false),

('A price increases from $40 to $50. What is the percent increase?', '[{"id": "A", "text": "10%"}, {"id": "B", "text": "20%"}, {"id": "C", "text": "25%"}, {"id": "D", "text": "125%"}]', 'C', 'Percent increase = (50-40)/40 × 100% = 10/40 × 100% = 25%.', 1170, false),

('Express 0.00045 in scientific notation', '[{"id": "A", "text": "4.5 × 10⁻⁴"}, {"id": "B", "text": "45 × 10⁻⁵"}, {"id": "C", "text": "4.5 × 10⁻³"}, {"id": "D", "text": "0.45 × 10⁻³"}]', 'A', 'Move decimal point 4 places right: 0.00045 = 4.5 × 10⁻⁴.', 1130, false),

-- Hard Level Questions (1300-1450)
('If g(x) = x² - 4x + 3 and h(x) = x + 1, what is g(h(2))?', '[{"id": "A", "text": "0"}, {"id": "B", "text": "3"}, {"id": "C", "text": "6"}, {"id": "D", "text": "12"}]', 'A', 'h(2) = 2 + 1 = 3. Then g(3) = 3² - 4(3) + 3 = 9 - 12 + 3 = 0.', 1320, true),

('A population doubles every 3 years. If the initial population is 100, what will it be after 9 years?', '[{"id": "A", "text": "300"}, {"id": "B", "text": "600"}, {"id": "C", "text": "800"}, {"id": "D", "text": "900"}]', 'C', 'After 9 years (3 doubling periods): 100 × 2³ = 100 × 8 = 800.', 1380, true),

('In a right triangle, one leg is 3 and the hypotenuse is 5. What is the length of the other leg?', '[{"id": "A", "text": "2"}, {"id": "B", "text": "4"}, {"id": "C", "text": "6"}, {"id": "D", "text": "8"}]', 'B', 'Using Pythagorean theorem: a² + 3² = 5², so a² + 9 = 25, a² = 16, a = 4.', 1350, false),

('Factor completely: x³ - 8', '[{"id": "A", "text": "(x - 2)(x² + 2x + 4)"}, {"id": "B", "text": "(x - 2)(x + 2)²"}, {"id": "C", "text": "(x - 2)³"}, {"id": "D", "text": "(x + 2)(x² - 2x + 4)"}]', 'A', 'This is difference of cubes: x³ - 8 = x³ - 2³ = (x - 2)(x² + 2x + 4).', 1400, true),

('The mean of 5 numbers is 12. If four of the numbers are 10, 11, 13, and 15, what is the fifth number?', '[{"id": "A", "text": "9"}, {"id": "B", "text": "11"}, {"id": "C", "text": "13"}, {"id": "D", "text": "15"}]', 'B', 'Sum = 5 × 12 = 60. Sum of four numbers = 49. Fifth number = 60 - 49 = 11.', 1330, false),

-- Very Hard Level Questions (1450+)
('If log₂(x) = 3, what is x?', '[{"id": "A", "text": "6"}, {"id": "B", "text": "8"}, {"id": "C", "text": "9"}, {"id": "D", "text": "16"}]', 'B', 'log₂(x) = 3 means 2³ = x, so x = 8.', 1480, true),

('A circle has center (2, 3) and radius 4. Which point lies on the circle?', '[{"id": "A", "text": "(6, 3)"}, {"id": "B", "text": "(2, 7)"}, {"id": "C", "text": "(5, 6)"}, {"id": "D", "text": "(6, 6)"}]', 'A', 'Distance from center (2,3) to (6,3) is |6-2| = 4, which equals the radius.', 1450, true),

('If (x + 2)² = 25, what are all possible values of x?', '[{"id": "A", "text": "x = 3 only"}, {"id": "B", "text": "x = -7 only"}, {"id": "C", "text": "x = 3 or x = -7"}, {"id": "D", "text": "x = 5 or x = -5"}]', 'C', 'Taking square root: x + 2 = ±5, so x = 3 or x = -7.', 1460, false),

('Simplify: (x² - 4)/(x + 2)', '[{"id": "A", "text": "x - 2"}, {"id": "B", "text": "x + 2"}, {"id": "C", "text": "(x - 2)²"}, {"id": "D", "text": "x² - 2"}]', 'A', 'Factor numerator: (x² - 4) = (x - 2)(x + 2). Cancel (x + 2): result is x - 2.', 1490, true),

('In an arithmetic sequence, the first term is 3 and the common difference is 4. What is the 10th term?', '[{"id": "A", "text": "37"}, {"id": "B", "text": "39"}, {"id": "C", "text": "41"}, {"id": "D", "text": "43"}]', 'B', 'Formula: aₙ = a₁ + (n-1)d = 3 + (10-1)×4 = 3 + 36 = 39.', 1470, false);

-- ============================================================================
-- SECTION 2: LINK QUESTIONS TO CATEGORIES (Many-to-Many)
-- ============================================================================
-- Map questions to their categories using names
-- Updated to match 18 new categories (December 18, 2025)

-- Question 1 (Single Variable Equations: If 3x + 5 = 14...) -> Single Variable Equations (ID 18)
INSERT INTO question_categories (question_id, category_id, is_primary) 
SELECT q.id, c.id, true FROM questions q, categories c 
WHERE q.question_text = 'If 3x + 5 = 14, what is the value of x?' 
AND c.name = 'Single Variable Equations' ON CONFLICT DO NOTHING;

-- Question 2 (Percentages: What is 25% of 80?) -> Percentages (ID 1)
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c 
WHERE q.question_text = 'What is 25% of 80?' 
AND c.name = 'Percentages' ON CONFLICT DO NOTHING;

-- Question 3 (Areas and Volumes) -> Areas and Volumes (ID 2)
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c 
WHERE q.question_text = 'What is the area of a rectangle with length 8 and width 6?' 
AND c.name = 'Areas and Volumes' ON CONFLICT DO NOTHING;

-- Question 4 (Fractions & Exponents) -> Fractions & Exponents (ID 11)
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c 
WHERE q.question_text = 'What is 2/3 + 1/6?' 
AND c.name = 'Fractions & Exponents' ON CONFLICT DO NOTHING;

-- Question 5 (Fractions & Exponents: Exponents) -> Fractions & Exponents (ID 11)
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c 
WHERE q.question_text = 'What is 2³?' 
AND c.name = 'Fractions & Exponents' ON CONFLICT DO NOTHING;

-- Question 6 (Angle Properties: slope) -> Angle Properties (ID 8)
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c 
WHERE q.question_text = 'What is the slope of the line passing through points (2, 3) and (6, 7)?' 
AND c.name = 'Angle Properties' ON CONFLICT DO NOTHING;

-- Question 7 (Quadratic Equations) -> Quadratic Equations (ID 4)
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c 
WHERE q.question_text = 'If x² - 5x + 6 = 0, what are the possible values of x?' 
AND c.name = 'Quadratic Equations' ON CONFLICT DO NOTHING;

-- Question 8 (Systems) -> Systems of Equations (ID 17)
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c 
WHERE q.question_text = 'If 2x + y = 8 and x - y = 1, what is the value of x?' 
AND c.name = 'Systems of Equations' ON CONFLICT DO NOTHING;

-- Question 9 (Function Transformations) -> Function Transformations (ID 16)
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c 
WHERE q.question_text = 'If f(x) = 2x + 3, what is f(4)?' 
AND c.name = 'Function Transformations' ON CONFLICT DO NOTHING;

-- Question 10 (Circles) -> Circles (ID 9)
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c 
WHERE q.question_text = 'What is the circumference of a circle with radius 5? (Use π = 3.14)' 
AND c.name = 'Circles' ON CONFLICT DO NOTHING;

-- Question 11 (Linear Equations: Inequalities) -> Linear Equations (ID 14)
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c 
WHERE q.question_text = 'Solve for x: 3x - 7 > 8' 
AND c.name = 'Linear Equations' ON CONFLICT DO NOTHING;

-- Question 12 (Probability) -> Probability and Statistics (ID 13)
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c 
WHERE q.question_text = 'What is the probability of rolling a 4 on a standard six-sided die?' 
AND c.name = 'Probability and Statistics' ON CONFLICT DO NOTHING;

-- Question 13 (Percentages: ratio) -> Percentages (ID 1)
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c 
WHERE q.question_text = 'If 3/4 = x/12, what is x?' 
AND c.name = 'Percentages' ON CONFLICT DO NOTHING;

-- Question 14 (Absolute value) -> Single Variable Equations (ID 18)
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c 
WHERE q.question_text = 'Solve |x - 3| = 5' 
AND c.name = 'Single Variable Equations' ON CONFLICT DO NOTHING;

-- Question 15 (Systems: word problem) -> Systems of Equations (ID 17)
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c 
WHERE q.question_text = 'Sarah has 3 times as many books as Tom. Together they have 24 books. How many books does Sarah have?' 
AND c.name = 'Systems of Equations' ON CONFLICT DO NOTHING;

-- Question 16 (Median) -> Means and Medians (ID 12)
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c 
WHERE q.question_text = 'The median of the dataset {2, 5, 7, x, 12} is 7. What is x?' 
AND c.name = 'Means and Medians' ON CONFLICT DO NOTHING;

-- Question 17 (Distance formula) -> Angle Properties (ID 8)
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c 
WHERE q.question_text = 'What is the distance between points (1, 2) and (4, 6)?' 
AND c.name = 'Angle Properties' ON CONFLICT DO NOTHING;

-- Question 18 (Percent increase) -> Percentages (ID 1)
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c 
WHERE q.question_text = 'A price increases from $40 to $50. What is the percent increase?' 
AND c.name = 'Percentages' ON CONFLICT DO NOTHING;

-- Question 19 (Scientific notation) -> Fractions & Exponents (ID 11)
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c 
WHERE q.question_text = 'Express 0.00045 in scientific notation' 
AND c.name = 'Fractions & Exponents' ON CONFLICT DO NOTHING;

-- Question 20 (Composite function) -> Single Variable Equations (ID 18)
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c 
WHERE q.question_text = 'If g(x) = x² - 4x + 3 and h(x) = x + 1, what is g(h(2))?' 
AND c.name = 'Single Variable Equations' ON CONFLICT DO NOTHING;

-- Question 21 (Exponential growth) -> Exponential Equations (ID 6)
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c 
WHERE q.question_text = 'A population doubles every 3 years. If the initial population is 100, what will it be after 9 years?' 
AND c.name = 'Exponential Equations' ON CONFLICT DO NOTHING;

-- Question 22 (Pythagorean theorem) -> Similar Triangles (ID 7)
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c 
WHERE q.question_text = 'In a right triangle, one leg is 3 and the hypotenuse is 5. What is the length of the other leg?' 
AND c.name = 'Similar Triangles' ON CONFLICT DO NOTHING;

-- Question 23 (Factoring) -> Polynomials (ID 10)
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c 
WHERE q.question_text = 'Factor completely: x³ - 8' 
AND c.name = 'Polynomials' ON CONFLICT DO NOTHING;

-- Question 24 (Mean) -> Means and Medians (ID 12)
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c 
WHERE q.question_text = 'The mean of 5 numbers is 12. If four of the numbers are 10, 11, 13, and 15, what is the fifth number?' 
AND c.name = 'Means and Medians' ON CONFLICT DO NOTHING;

-- Question 25 (Logarithm/Rates) -> Rates (ID 15)
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c 
WHERE q.question_text = 'If log₂(x) = 3, what is x?' 
AND c.name = 'Rates' ON CONFLICT DO NOTHING;

-- Question 26 (Circle: point on circle) -> Circles (ID 9)
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c 
WHERE q.question_text = 'A circle has center (2, 3) and radius 4. Which point lies on the circle?' 
AND c.name = 'Circles' ON CONFLICT DO NOTHING;

-- Question 27 (Quadratic: square root) -> Quadratic Equations (ID 4)
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c 
WHERE q.question_text = 'If (x + 2)² = 25, what are all possible values of x?' 
AND c.name = 'Quadratic Equations' ON CONFLICT DO NOTHING;

-- Question 28 (Rational expressions) -> Fractions & Exponents (ID 11)
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c 
WHERE q.question_text = 'Simplify: (x² - 4)/(x + 2)' 
AND c.name = 'Fractions & Exponents' ON CONFLICT DO NOTHING;

-- Question 29 (Arithmetic sequence) -> Function Transformations (ID 16)
INSERT INTO question_categories (question_id, category_id, is_primary)
SELECT q.id, c.id, true FROM questions q, categories c 
WHERE q.question_text = 'In an arithmetic sequence, the first term is 3 and the common difference is 4. What is the 10th term?' 
AND c.name = 'Function Transformations' ON CONFLICT DO NOTHING;

-- Verify insertion
SELECT 'Development Questions Seeded' as status, COUNT(*) as count FROM questions;
SELECT 'Question-Category Relationships Seeded' as status, COUNT(*) as count FROM question_categories;

-- ============================================================================
-- End of Development Seed Data
-- ============================================================================
-- Sample questions and relationships have been successfully loaded!
-- 
-- WARNING: This is test data only. Before production deployment:
-- 1. Remove or disable this seed file
-- 2. Load production questions from your actual question database
-- 3. Verify question quality and accuracy
-- ============================================================================
