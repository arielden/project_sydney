-- Sample SAT Math Questions for Sydney Learning Platform
-- This file contains realistic SAT-style questions with various difficulty levels
-- Updated to use auto-generated integer IDs and proper question type names

-- Insert sample questions into the questions table
INSERT INTO questions (question_type, question_text, options, correct_answer, explanation, difficulty_rating, is_diagnostic) VALUES 

-- Easy Level Questions (1000-1100)
('Linear Equations', 'If 3x + 5 = 14, what is the value of x?', '[{"id": "A", "text": "2"}, {"id": "B", "text": "3"}, {"id": "C", "text": "4"}, {"id": "D", "text": "5"}]', 'B', 'Solving for x: 3x + 5 = 14, so 3x = 9, therefore x = 3.', 1050, true),

('Percentages', 'What is 25% of 80?', '[{"id": "A", "text": "15"}, {"id": "B", "text": "20"}, {"id": "C", "text": "25"}, {"id": "D", "text": "30"}]', 'B', '25% of 80 = 0.25 × 80 = 20.', 1000, false),

('Areas and Volumes', 'What is the area of a rectangle with length 8 and width 6?', '[{"id": "A", "text": "14"}, {"id": "B", "text": "28"}, {"id": "C", "text": "48"}, {"id": "D", "text": "56"}]', 'C', 'Area of rectangle = length × width = 8 × 6 = 48.', 1020, false),

('Fractions', 'What is 2/3 + 1/6?', '[{"id": "A", "text": "3/9"}, {"id": "B", "text": "3/6"}, {"id": "C", "text": "4/6"}, {"id": "D", "text": "5/6"}]', 'D', 'Convert to common denominator: 2/3 = 4/6, so 4/6 + 1/6 = 5/6.', 1080, true),

('Exponents', 'What is 2³?', '[{"id": "A", "text": "6"}, {"id": "B", "text": "8"}, {"id": "C", "text": "9"}, {"id": "D", "text": "12"}]', 'B', '2³ = 2 × 2 × 2 = 8.', 1010, false),

-- Medium Level Questions (1100-1300)
('Quadratic Equations', 'If x² - 5x + 6 = 0, what are the possible values of x?', '[{"id": "A", "text": "x = 2 or x = 3"}, {"id": "B", "text": "x = 1 or x = 6"}, {"id": "C", "text": "x = -2 or x = -3"}, {"id": "D", "text": "x = 2 or x = -3"}]', 'A', 'Factor: (x - 2)(x - 3) = 0, so x = 2 or x = 3.', 1180, true),

('Systems of Equations', 'If 2x + y = 8 and x - y = 1, what is the value of x?', '[{"id": "A", "text": "2"}, {"id": "B", "text": "3"}, {"id": "C", "text": "4"}, {"id": "D", "text": "5"}]', 'B', 'Add the equations: 3x = 9, so x = 3.', 1220, true),

('Function Transformations', 'If f(x) = 2x + 3, what is f(4)?', '[{"id": "A", "text": "8"}, {"id": "B", "text": "11"}, {"id": "C", "text": "14"}, {"id": "D", "text": "17"}]', 'B', 'f(4) = 2(4) + 3 = 8 + 3 = 11.', 1150, false),

('Circle Equations', 'What is the circumference of a circle with radius 5? (Use π = 3.14)', '[{"id": "A", "text": "15.7"}, {"id": "B", "text": "31.4"}, {"id": "C", "text": "78.5"}, {"id": "D", "text": "157"}]', 'B', 'Circumference = 2πr = 2 × 3.14 × 5 = 31.4.', 1200, false),

('Linear Equations', 'Solve for x: 3x - 7 > 8', '[{"id": "A", "text": "x > 5"}, {"id": "B", "text": "x > 15/3"}, {"id": "C", "text": "x > 1/3"}, {"id": "D", "text": "x > 15"}]', 'A', '3x - 7 > 8, so 3x > 15, therefore x > 5.', 1160, true),

('Probability and Statistics', 'What is the probability of rolling a 4 on a standard six-sided die?', '[{"id": "A", "text": "1/4"}, {"id": "B", "text": "1/6"}, {"id": "C", "text": "1/3"}, {"id": "D", "text": "2/3"}]', 'B', 'There is 1 favorable outcome out of 6 possible outcomes: 1/6.', 1120, false),

('Geometry Basics', 'What is the slope of the line passing through points (2, 3) and (6, 7)?', '[{"id": "A", "text": "1"}, {"id": "B", "text": "2"}, {"id": "C", "text": "1/2"}, {"id": "D", "text": "4"}]', 'A', 'Slope = (y₂ - y₁)/(x₂ - x₁) = (7 - 3)/(6 - 2) = 4/4 = 1.', 1190, true),

-- Hard Level Questions (1300-1450)
('Misc: Functions, Single Variable Equations', 'If g(x) = x² - 4x + 3 and h(x) = x + 1, what is g(h(2))?', '[{"id": "A", "text": "0"}, {"id": "B", "text": "3"}, {"id": "C", "text": "6"}, {"id": "D", "text": "12"}]', 'A', 'h(2) = 2 + 1 = 3. Then g(3) = 3² - 4(3) + 3 = 9 - 12 + 3 = 0.', 1320, true),

('Exponential Equations', 'A population doubles every 3 years. If the initial population is 100, what will it be after 9 years?', '[{"id": "A", "text": "300"}, {"id": "B", "text": "600"}, {"id": "C", "text": "800"}, {"id": "D", "text": "900"}]', 'C', 'After 9 years (3 doubling periods): 100 × 2³ = 100 × 8 = 800.', 1380, true),

('Special Triangles', 'In a right triangle, one leg is 3 and the hypotenuse is 5. What is the length of the other leg?', '[{"id": "A", "text": "2"}, {"id": "B", "text": "4"}, {"id": "C", "text": "6"}, {"id": "D", "text": "8"}]', 'B', 'Using Pythagorean theorem: a² + 3² = 5², so a² + 9 = 25, a² = 16, a = 4.', 1350, false),

('Polynomials', 'Factor completely: x³ - 8', '[{"id": "A", "text": "(x - 2)(x² + 2x + 4)"}, {"id": "B", "text": "(x - 2)(x + 2)²"}, {"id": "C", "text": "(x - 2)³"}, {"id": "D", "text": "(x + 2)(x² - 2x + 4)"}]', 'A', 'This is difference of cubes: x³ - 8 = x³ - 2³ = (x - 2)(x² + 2x + 4).', 1400, true),

('Means and Medians', 'The mean of 5 numbers is 12. If four of the numbers are 10, 11, 13, and 15, what is the fifth number?', '[{"id": "A", "text": "9"}, {"id": "B", "text": "11"}, {"id": "C", "text": "13"}, {"id": "D", "text": "15"}]', 'B', 'Sum = 5 × 12 = 60. Sum of four numbers = 49. Fifth number = 60 - 49 = 11.', 1330, false),

-- Very Hard Level Questions (1450+)
('Exponents', 'If log₂(x) = 3, what is x?', '[{"id": "A", "text": "6"}, {"id": "B", "text": "8"}, {"id": "C", "text": "9"}, {"id": "D", "text": "16"}]', 'B', 'log₂(x) = 3 means 2³ = x, so x = 8.', 1480, true),

('Circle Equations', 'A circle has center (2, 3) and radius 4. Which point lies on the circle?', '[{"id": "A", "text": "(6, 3)"}, {"id": "B", "text": "(2, 7)"}, {"id": "C", "text": "(5, 6)"}, {"id": "D", "text": "(6, 6)"}]', 'A', 'Distance from center (2,3) to (6,3) is |6-2| = 4, which equals the radius.', 1450, true),

('Quadratic Equations', 'If (x + 2)² = 25, what are all possible values of x?', '[{"id": "A", "text": "x = 3 only"}, {"id": "B", "text": "x = -7 only"}, {"id": "C", "text": "x = 3 or x = -7"}, {"id": "D", "text": "x = 5 or x = -5"}]', 'C', 'Taking square root: x + 2 = ±5, so x = 3 or x = -7.', 1460, false),

('Fractions', 'Simplify: (x² - 4)/(x + 2)', '[{"id": "A", "text": "x - 2"}, {"id": "B", "text": "x + 2"}, {"id": "C", "text": "(x - 2)²"}, {"id": "D", "text": "x² - 2"}]', 'A', 'Factor numerator: (x² - 4) = (x - 2)(x + 2). Cancel (x + 2): result is x - 2.', 1490, true),

('Misc: Functions, Single Variable Equations', 'In an arithmetic sequence, the first term is 3 and the common difference is 4. What is the 10th term?', '[{"id": "A", "text": "37"}, {"id": "B", "text": "39"}, {"id": "C", "text": "41"}, {"id": "D", "text": "43"}]', 'B', 'Formula: aₙ = a₁ + (n-1)d = 3 + (10-1)×4 = 3 + 36 = 39.', 1470, false),

-- Additional Medium Questions for Practice
('Percentages', 'If 3/4 = x/12, what is x?', '[{"id": "A", "text": "8"}, {"id": "B", "text": "9"}, {"id": "C", "text": "10"}, {"id": "D", "text": "16"}]', 'B', 'Cross multiply: 3 × 12 = 4 × x, so 36 = 4x, x = 9.', 1140, false),

('Linear Equations', 'Solve |x - 3| = 5', '[{"id": "A", "text": "x = 8 only"}, {"id": "B", "text": "x = -2 only"}, {"id": "C", "text": "x = 8 or x = -2"}, {"id": "D", "text": "x = 2 or x = 8"}]', 'C', 'x - 3 = 5 or x - 3 = -5, so x = 8 or x = -2.', 1250, true),

('Systems of Equations', 'Sarah has 3 times as many books as Tom. Together they have 24 books. How many books does Sarah have?', '[{"id": "A", "text": "6"}, {"id": "B", "text": "12"}, {"id": "C", "text": "18"}, {"id": "D", "text": "21"}]', 'C', 'Let Tom have x books. Sarah has 3x. Total: x + 3x = 24, so 4x = 24, x = 6. Sarah has 3(6) = 18.', 1280, false),

('Means and Medians', 'The median of the dataset {2, 5, 7, x, 12} is 7. What is x?', '[{"id": "A", "text": "7"}, {"id": "B", "text": "8"}, {"id": "C", "text": "9"}, {"id": "D", "text": "10"}]', 'A', 'For median to be 7, x must be 7 (so the middle value in the ordered set is 7).', 1210, true),

('Geometry Basics', 'What is the distance between points (1, 2) and (4, 6)?', '[{"id": "A", "text": "3"}, {"id": "B", "text": "4"}, {"id": "C", "text": "5"}, {"id": "D", "text": "7"}]', 'C', 'Distance = √[(4-1)² + (6-2)²] = √[9 + 16] = √25 = 5.', 1270, false),

('Percentages', 'A price increases from $40 to $50. What is the percent increase?', '[{"id": "A", "text": "10%"}, {"id": "B", "text": "20%"}, {"id": "C", "text": "25%"}, {"id": "D", "text": "125%"}]', 'C', 'Percent increase = (50-40)/40 × 100% = 10/40 × 100% = 25%.', 1170, false),

('Exponents', 'Express 0.00045 in scientific notation', '[{"id": "A", "text": "4.5 × 10⁻⁴"}, {"id": "B", "text": "45 × 10⁻⁵"}, {"id": "C", "text": "4.5 × 10⁻³"}, {"id": "D", "text": "0.45 × 10⁻³"}]', 'A', 'Move decimal point 4 places right: 0.00045 = 4.5 × 10⁻⁴.', 1130, false),

('Function Transformations', 'What is the domain of f(x) = 1/(x-3)?', '[{"id": "A", "text": "All real numbers"}, {"id": "B", "text": "All real numbers except 3"}, {"id": "C", "text": "All real numbers except 0"}, {"id": "D", "text": "All positive real numbers"}]', 'B', 'The function is undefined when x - 3 = 0, so x ≠ 3.', 1290, true);

-- Questions will use auto-generated integer IDs
-- No manual ID management needed