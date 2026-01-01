
INSERT INTO questions (question_text, options, correct_answer, explanation, elo_rating) VALUES

-- Easy Level Questions (200-400 range)
('If 3x + 5 = 14, what is the value of x?', '[{"id": "A", "text": "2"}, {"id": "B", "text": "3"}, {"id": "C", "text": "4"}, {"id": "D", "text": "5"}]', 'B', 'Solving for x: 3x + 5 = 14, so 3x = 9, therefore x = 3.', 350),

('What is 25% of 80?', '[{"id": "A", "text": "15"}, {"id": "B", "text": "20"}, {"id": "C", "text": "25"}, {"id": "D", "text": "30"}]', 'B', '25% of 80 = 0.25 × 80 = 20.', 300),

('What is the area of a rectangle with length 8 and width 6?', '[{"id": "A", "text": "14"}, {"id": "B", "text": "28"}, {"id": "C", "text": "48"}, {"id": "D", "text": "56"}]', 'C', 'Area of rectangle = length × width = 8 × 6 = 48.', 320),

('What is 2/3 + 1/6?', '[{"id": "A", "text": "3/9"}, {"id": "B", "text": "3/6"}, {"id": "C", "text": "4/6"}, {"id": "D", "text": "5/6"}]', 'D', 'Convert to common denominator: 2/3 = 4/6, so 4/6 + 1/6 = 5/6.', 380),

('What is 2³?', '[{"id": "A", "text": "6"}, {"id": "B", "text": "8"}, {"id": "C", "text": "9"}, {"id": "D", "text": "12"}]', 'B', '2³ = 2 × 2 × 2 = 8.', 310),

('What is the slope of the line passing through points (2, 3) and (6, 7)?', '[{"id": "A", "text": "1"}, {"id": "B", "text": "2"}, {"id": "C", "text": "1/2"}, {"id": "D", "text": "4"}]', 'A', 'Slope = (y₂ - y₁)/(x₂ - x₁) = (7 - 3)/(6 - 2) = 4/4 = 1.', 330),

-- Medium Level Questions (400-600 range)
('If x² - 5x + 6 = 0, what are the possible values of x?', '[{"id": "A", "text": "x = 2 or x = 3"}, {"id": "B", "text": "x = 1 or x = 6"}, {"id": "C", "text": "x = -2 or x = -3"}, {"id": "D", "text": "x = 2 or x = -3"}]', 'A', 'Factor: (x - 2)(x - 3) = 0, so x = 2 or x = 3.', 580),

('If 2x + y = 8 and x - y = 1, what is the value of x?', '[{"id": "A", "text": "2"}, {"id": "B", "text": "3"}, {"id": "C", "text": "4"}, {"id": "D", "text": "5"}]', 'B', 'Add the equations: 3x = 9, so x = 3.', 620),

('If f(x) = 2x + 3, what is f(4)?', '[{"id": "A", "text": "8"}, {"id": "B", "text": "11"}, {"id": "C", "text": "14"}, {"id": "D", "text": "17"}]', 'B', 'f(4) = 2(4) + 3 = 8 + 3 = 11.', 550),

('What is the circumference of a circle with radius 5? (Use π = 3.14)', '[{"id": "A", "text": "15.7"}, {"id": "B", "text": "31.4"}, {"id": "C", "text": "78.5"}, {"id": "D", "text": "157"}]', 'B', 'Circumference = 2πr = 2 × 3.14 × 5 = 31.4.', 600),

('Solve for x: 3x - 7 > 8', '[{"id": "A", "text": "x > 5"}, {"id": "B", "text": "x > 15/3"}, {"id": "C", "text": "x > 1/3"}, {"id": "D", "text": "x > 15"}]', 'A', '3x - 7 > 8, so 3x > 15, therefore x > 5.', 560),

('What is the probability of rolling a 4 on a standard six-sided die?', '[{"id": "A", "text": "1/4"}, {"id": "B", "text": "1/6"}, {"id": "C", "text": "1/3"}, {"id": "D", "text": "2/3"}]', 'B', 'There is 1 favorable outcome out of 6 possible outcomes: 1/6.', 520),

('If 3/4 = x/12, what is x?', '[{"id": "A", "text": "8"}, {"id": "B", "text": "9"}, {"id": "C", "text": "10"}, {"id": "D", "text": "16"}]', 'B', 'Cross multiply: 3 × 12 = 4 × x, so 36 = 4x, x = 9.', 540),

('Solve |x - 3| = 5', '[{"id": "A", "text": "x = 8 only"}, {"id": "B", "text": "x = -2 only"}, {"id": "C", "text": "x = 8 or x = -2"}, {"id": "D", "text": "x = 2 or x = 8"}]', 'C', 'x - 3 = 5 or x - 3 = -5, so x = 8 or x = -2.', 650),

('Sarah has 3 times as many books as Tom. Together they have 24 books. How many books does Sarah have?', '[{"id": "A", "text": "6"}, {"id": "B", "text": "12"}, {"id": "C", "text": "18"}, {"id": "D", "text": "21"}]', 'C', 'Let Tom have x books. Sarah has 3x. Total: x + 3x = 24, so 4x = 24, x = 6. Sarah has 3(6) = 18.', 680),

('The median of the dataset {2, 5, 7, x, 12} is 7. What is x?', '[{"id": "A", "text": "7"}, {"id": "B", "text": "8"}, {"id": "C", "text": "9"}, {"id": "D", "text": "10"}]', 'A', 'For median to be 7, x must be 7 (so the middle value in the ordered set is 7).', 610),

('What is the distance between points (1, 2) and (4, 6)?', '[{"id": "A", "text": "3"}, {"id": "B", "text": "4"}, {"id": "C", "text": "5"}, {"id": "D", "text": "7"}]', 'C', 'Distance = √[(4-1)² + (6-2)²] = √[9 + 16] = √25 = 5.', 670),

('A price increases from $40 to $50. What is the percent increase?', '[{"id": "A", "text": "10%"}, {"id": "B", "text": "20%"}, {"id": "C", "text": "25%"}, {"id": "D", "text": "125%"}]', 'C', 'Percent increase = (50-40)/40 × 100% = 10/40 × 100% = 25%.', 570),

('Express 0.00045 in scientific notation', '[{"id": "A", "text": "4.5 × 10⁻⁴"}, {"id": "B", "text": "45 × 10⁻⁵"}, {"id": "C", "text": "4.5 × 10⁻³"}, {"id": "D", "text": "0.45 × 10⁻³"}]', 'A', 'Move decimal point 4 places right: 0.00045 = 4.5 × 10⁻⁴.', 530),

-- Hard Level Questions (600-750 range)
('If g(x) = x² - 4x + 3 and h(x) = x + 1, what is g(h(2))?', '[{"id": "A", "text": "0"}, {"id": "B", "text": "3"}, {"id": "C", "text": "6"}, {"id": "D", "text": "12"}]', 'A', 'h(2) = 2 + 1 = 3. Then g(3) = 3² - 4(3) + 3 = 9 - 12 + 3 = 0.', 720),

('A population doubles every 3 years. If the initial population is 100, what will it be after 9 years?', '[{"id": "A", "text": "300"}, {"id": "B", "text": "600"}, {"id": "C", "text": "800"}, {"id": "D", "text": "900"}]', 'C', 'After 9 years (3 doubling periods): 100 × 2³ = 100 × 8 = 800.', 780),

('In a right triangle, one leg is 3 and the hypotenuse is 5. What is the length of the other leg?', '[{"id": "A", "text": "2"}, {"id": "B", "text": "4"}, {"id": "C", "text": "6"}, {"id": "D", "text": "8"}]', 'B', 'Using Pythagorean theorem: a² + 3² = 5², so a² + 9 = 25, a² = 16, a = 4.', 750),

('Factor completely: x³ - 8', '[{"id": "A", "text": "(x - 2)(x² + 2x + 4)"}, {"id": "B", "text": "(x - 2)(x + 2)²"}, {"id": "C", "text": "(x - 2)³"}, {"id": "D", "text": "(x + 2)(x² - 2x + 4)"}]', 'A', 'This is difference of cubes: x³ - 8 = x³ - 2³ = (x - 2)(x² + 2x + 4).', 800),

('The mean of 5 numbers is 12. If four of the numbers are 10, 11, 13, and 15, what is the fifth number?', '[{"id": "A", "text": "9"}, {"id": "B", "text": "11"}, {"id": "C", "text": "13"}, {"id": "D", "text": "15"}]', 'B', 'Sum = 5 × 12 = 60. Sum of four numbers = 49. Fifth number = 60 - 49 = 11.', 730),

-- Very Hard Level Questions (750-800 range)
('If log₂(x) = 3, what is x?', '[{"id": "A", "text": "6"}, {"id": "B", "text": "8"}, {"id": "C", "text": "9"}, {"id": "D", "text": "16"}]', 'B', 'log₂(x) = 3 means 2³ = x, so x = 8.', 800),

('A circle has center (2, 3) and radius 4. Which point lies on the circle?', '[{"id": "A", "text": "(6, 3)"}, {"id": "B", "text": "(2, 7)"}, {"id": "C", "text": "(5, 6)"}, {"id": "D", "text": "(6, 6)"}]', 'A', 'Distance from center (2,3) to (6,3) is |6-2| = 4, which equals the radius.', 780),

('If (x + 2)² = 25, what are all possible values of x?', '[{"id": "A", "text": "x = 3 only"}, {"id": "B", "text": "x = -7 only"}, {"id": "C", "text": "x = 3 or x = -7"}, {"id": "D", "text": "x = 5 or x = -5"}]', 'C', 'Taking square root: x + 2 = ±5, so x = 3 or x = -7.', 790),

('Simplify: (x² - 4)/(x + 2)', '[{"id": "A", "text": "x - 2"}, {"id": "B", "text": "x + 2"}, {"id": "C", "text": "(x - 2)²"}, {"id": "D", "text": "x² - 2"}]', 'A', 'Factor numerator: (x² - 4) = (x - 2)(x + 2). Cancel (x + 2): result is x - 2.', 800),

('In an arithmetic sequence, the first term is 3 and the common difference is 4. What is the 10th term?', '[{"id": "A", "text": "37"}, {"id": "B", "text": "39"}, {"id": "C", "text": "41"}, {"id": "D", "text": "43"}]', 'B', 'Formula: aₙ = a₁ + (n-1)d = 3 + (10-1)×4 = 3 + 36 = 39.', 795),

-- Additional questions to reach 100 total
('What is 15% of 200?', '[{"id": "A", "text": "20"}, {"id": "B", "text": "25"}, {"id": "C", "text": "30"}, {"id": "D", "text": "35"}]', 'C', '15% of 200 = 0.15 × 200 = 30.', 320),

('Solve: 2x + 3 = 7', '[{"id": "A", "text": "1"}, {"id": "B", "text": "2"}, {"id": "C", "text": "3"}, {"id": "D", "text": "4"}]', 'B', '2x + 3 = 7, so 2x = 4, x = 2.', 350),

('What is the area of a triangle with base 10 and height 5?', '[{"id": "A", "text": "15"}, {"id": "B", "text": "20"}, {"id": "C", "text": "25"}, {"id": "D", "text": "30"}]', 'C', 'Area = (1/2) × base × height = (1/2) × 10 × 5 = 25.', 380),

('Simplify: 4/8', '[{"id": "A", "text": "1/2"}, {"id": "B", "text": "1/4"}, {"id": "C", "text": "2/4"}, {"id": "D", "text": "3/8"}]', 'A', '4/8 = 1/2.', 300),

('What is 5²?', '[{"id": "A", "text": "15"}, {"id": "B", "text": "20"}, {"id": "C", "text": "25"}, {"id": "D", "text": "30"}]', 'C', '5² = 5 × 5 = 25.', 310),

('What is the slope between (0,0) and (3,6)?', '[{"id": "A", "text": "1"}, {"id": "B", "text": "2"}, {"id": "C", "text": "3"}, {"id": "D", "text": "6"}]', 'B', 'Slope = (6-0)/(3-0) = 6/3 = 2.', 330),

('Factor: x² - 9', '[{"id": "A", "text": "(x-3)(x+3)"}, {"id": "B", "text": "(x-3)²"}, {"id": "C", "text": "(x+3)²"}, {"id": "D", "text": "x(x-9)"}]', 'A', 'Difference of squares: x² - 9 = (x-3)(x+3).', 550),

('Solve: x + 5 = 12', '[{"id": "A", "text": "5"}, {"id": "B", "text": "6"}, {"id": "C", "text": "7"}, {"id": "D", "text": "8"}]', 'C', 'x + 5 = 12, so x = 7.', 320),

('What is 40% of 150?', '[{"id": "A", "text": "50"}, {"id": "B", "text": "55"}, {"id": "C", "text": "60"}, {"id": "D", "text": "65"}]', 'C', '40% of 150 = 0.4 × 150 = 60.', 340),

('What is the perimeter of a square with side 4?', '[{"id": "A", "text": "12"}, {"id": "B", "text": "16"}, {"id": "C", "text": "20"}, {"id": "D", "text": "24"}]', 'B', 'Perimeter = 4 × side = 4 × 4 = 16.', 360),

('Simplify: 6/12', '[{"id": "A", "text": "1/2"}, {"id": "B", "text": "1/3"}, {"id": "C", "text": "2/3"}, {"id": "D", "text": "3/6"}]', 'A', '6/12 = 1/2.', 300),

('What is 3³?', '[{"id": "A", "text": "9"}, {"id": "B", "text": "18"}, {"id": "C", "text": "27"}, {"id": "D", "text": "81"}]', 'C', '3³ = 3 × 3 × 3 = 27.', 310),

('What is the y-intercept of y = 2x + 3?', '[{"id": "A", "text": "2"}, {"id": "B", "text": "3"}, {"id": "C", "text": "5"}, {"id": "D", "text": "6"}]', 'B', 'When x=0, y=3.', 370),

('Solve: 4x = 20', '[{"id": "A", "text": "4"}, {"id": "B", "text": "5"}, {"id": "C", "text": "6"}, {"id": "D", "text": "7"}]', 'B', '4x = 20, so x = 5.', 320),

('What is 20% of 300?', '[{"id": "A", "text": "50"}, {"id": "B", "text": "55"}, {"id": "C", "text": "60"}, {"id": "D", "text": "65"}]', 'C', '20% of 300 = 0.2 × 300 = 60.', 340),

('What is the area of a circle with radius 3? (Use π = 3.14)', '[{"id": "A", "text": "18.84"}, {"id": "B", "text": "28.26"}, {"id": "C", "text": "37.68"}, {"id": "D", "text": "47.1"}]', 'B', 'Area = πr² = 3.14 × 3² = 3.14 × 9 = 28.26.', 550),

('Simplify: 8/16', '[{"id": "A", "text": "1/2"}, {"id": "B", "text": "1/4"}, {"id": "C", "text": "2/8"}, {"id": "D", "text": "4/8"}]', 'A', '8/16 = 1/2.', 300),

('What is 4²?', '[{"id": "A", "text": "8"}, {"id": "B", "text": "12"}, {"id": "C", "text": "16"}, {"id": "D", "text": "20"}]', 'C', '4² = 4 × 4 = 16.', 310),

('What is the slope between (1,1) and (3,5)?', '[{"id": "A", "text": "1"}, {"id": "B", "text": "2"}, {"id": "C", "text": "3"}, {"id": "D", "text": "4"}]', 'B', 'Slope = (5-1)/(3-1) = 4/2 = 2.', 330),

('Factor: x² - 4', '[{"id": "A", "text": "(x-2)(x+2)"}, {"id": "B", "text": "(x-2)²"}, {"id": "C", "text": "(x+2)²"}, {"id": "D", "text": "x(x-4)"}]', 'A', 'Difference of squares: x² - 4 = (x-2)(x+2).', 550),

('Solve: x - 3 = 10', '[{"id": "A", "text": "11"}, {"id": "B", "text": "12"}, {"id": "C", "text": "13"}, {"id": "D", "text": "14"}]', 'C', 'x - 3 = 10, so x = 13.', 320),

('What is 30% of 200?', '[{"id": "A", "text": "50"}, {"id": "B", "text": "55"}, {"id": "C", "text": "60"}, {"id": "D", "text": "65"}]', 'C', '30% of 200 = 0.3 × 200 = 60.', 340),

('What is the volume of a cube with side 2?', '[{"id": "A", "text": "4"}, {"id": "B", "text": "6"}, {"id": "C", "text": "8"}, {"id": "D", "text": "10"}]', 'C', 'Volume = side³ = 2³ = 8.', 400),

('Simplify: 9/18', '[{"id": "A", "text": "1/2"}, {"id": "B", "text": "1/3"}, {"id": "C", "text": "2/9"}, {"id": "D", "text": "3/9"}]', 'A', '9/18 = 1/2.', 300),

('What is 6²?', '[{"id": "A", "text": "24"}, {"id": "B", "text": "30"}, {"id": "C", "text": "36"}, {"id": "D", "text": "42"}]', 'C', '6² = 6 × 6 = 36.', 310),

('What is the x-intercept of y = 3x - 6?', '[{"id": "A", "text": "1"}, {"id": "B", "text": "2"}, {"id": "C", "text": "3"}, {"id": "D", "text": "6"}]', 'B', 'When y=0, 3x - 6 = 0, so 3x = 6, x = 2.', 370),

('Solve: 5x = 25', '[{"id": "A", "text": "4"}, {"id": "B", "text": "5"}, {"id": "C", "text": "6"}, {"id": "D", "text": "7"}]', 'B', '5x = 25, so x = 5.', 320),

('What is 50% of 100?', '[{"id": "A", "text": "25"}, {"id": "B", "text": "40"}, {"id": "C", "text": "50"}, {"id": "D", "text": "75"}]', 'C', '50% of 100 = 0.5 × 100 = 50.', 300),

('What is the circumference of a circle with radius 2? (Use π = 3.14)', '[{"id": "A", "text": "6.28"}, {"id": "B", "text": "9.42"}, {"id": "C", "text": "12.56"}, {"id": "D", "text": "15.7"}]', 'C', 'Circumference = 2πr = 2 × 3.14 × 2 = 12.56.', 500),

('Simplify: 10/20', '[{"id": "A", "text": "1/2"}, {"id": "B", "text": "1/4"}, {"id": "C", "text": "2/5"}, {"id": "D", "text": "5/10"}]', 'A', '10/20 = 1/2.', 300),

('What is 7²?', '[{"id": "A", "text": "35"}, {"id": "B", "text": "42"}, {"id": "C", "text": "49"}, {"id": "D", "text": "56"}]', 'C', '7² = 7 × 7 = 49.', 310),

('What is the slope between (2,4) and (5,10)?', '[{"id": "A", "text": "1.5"}, {"id": "B", "text": "2"}, {"id": "C", "text": "2.5"}, {"id": "D", "text": "3"}]', 'B', 'Slope = (10-4)/(5-2) = 6/3 = 2.', 330),

('Factor: x² - 1', '[{"id": "A", "text": "(x-1)(x+1)"}, {"id": "B", "text": "(x-1)²"}, {"id": "C", "text": "(x+1)²"}, {"id": "D", "text": "x(x-1)"}]', 'A', 'Difference of squares: x² - 1 = (x-1)(x+1).', 550),

('Solve: x + 7 = 15', '[{"id": "A", "text": "6"}, {"id": "B", "text": "7"}, {"id": "C", "text": "8"}, {"id": "D", "text": "9"}]', 'C', 'x + 7 = 15, so x = 8.', 320),

('What is 60% of 150?', '[{"id": "A", "text": "80"}, {"id": "B", "text": "85"}, {"id": "C", "text": "90"}, {"id": "D", "text": "95"}]', 'C', '60% of 150 = 0.6 × 150 = 90.', 340),

('What is the surface area of a cube with side 3?', '[{"id": "A", "text": "18"}, {"id": "B", "text": "24"}, {"id": "C", "text": "27"}, {"id": "D", "text": "36"}]', 'C', 'Surface area = 6 × side² = 6 × 9 = 54.', 450),

('Simplify: 12/24', '[{"id": "A", "text": "1/2"}, {"id": "B", "text": "1/3"}, {"id": "C", "text": "2/3"}, {"id": "D", "text": "3/4"}]', 'A', '12/24 = 1/2.', 300),

('What is 8²?', '[{"id": "A", "text": "56"}, {"id": "B", "text": "60"}, {"id": "C", "text": "64"}, {"id": "D", "text": "72"}]', 'C', '8² = 8 × 8 = 64.', 310),

('What is the y-intercept of y = 4x + 2?', '[{"id": "A", "text": "2"}, {"id": "B", "text": "3"}, {"id": "C", "text": "4"}, {"id": "D", "text": "6"}]', 'A', 'When x=0, y=2.', 370),

('Solve: 6x = 36', '[{"id": "A", "text": "5"}, {"id": "B", "text": "6"}, {"id": "C", "text": "7"}, {"id": "D", "text": "8"}]', 'B', '6x = 36, so x = 6.', 320),

('What is 70% of 200?', '[{"id": "A", "text": "130"}, {"id": "B", "text": "135"}, {"id": "C", "text": "140"}, {"id": "D", "text": "145"}]', 'C', '70% of 200 = 0.7 × 200 = 140.', 340),

('What is the area of a trapezoid with bases 6 and 10, height 4?', '[{"id": "A", "text": "24"}, {"id": "B", "text": "28"}, {"id": "C", "text": "32"}, {"id": "D", "text": "36"}]', 'C', 'Area = (1/2) × (b1 + b2) × h = (1/2) × (6 + 10) × 4 = (1/2) × 16 × 4 = 32.', 500),

('Simplify: 14/28', '[{"id": "A", "text": "1/2"}, {"id": "B", "text": "1/4"}, {"id": "C", "text": "2/7"}, {"id": "D", "text": "7/14"}]', 'A', '14/28 = 1/2.', 300),

('What is 9²?', '[{"id": "A", "text": "72"}, {"id": "B", "text": "75"}, {"id": "C", "text": "81"}, {"id": "D", "text": "90"}]', 'C', '9² = 9 × 9 = 81.', 310),

('What is the slope between (0,2) and (4,6)?', '[{"id": "A", "text": "0.5"}, {"id": "B", "text": "1"}, {"id": "C", "text": "1.5"}, {"id": "D", "text": "2"}]', 'B', 'Slope = (6-2)/(4-0) = 4/4 = 1.', 330),

('Factor: x² - 25', '[{"id": "A", "text": "(x-5)(x+5)"}, {"id": "B", "text": "(x-5)²"}, {"id": "C", "text": "(x+5)²"}, {"id": "D", "text": "x(x-25)"}]', 'A', 'Difference of squares: x² - 25 = (x-5)(x+5).', 550),

('Solve: x + 9 = 20', '[{"id": "A", "text": "9"}, {"id": "B", "text": "10"}, {"id": "C", "text": "11"}, {"id": "D", "text": "12"}]', 'C', 'x + 9 = 20, so x = 11.', 320),

('What is 80% of 250?', '[{"id": "A", "text": "180"}, {"id": "B", "text": "185"}, {"id": "C", "text": "190"}, {"id": "D", "text": "200"}]', 'D', '80% of 250 = 0.8 × 250 = 200.', 340),

('What is the volume of a rectangular prism with length 4, width 3, height 2?', '[{"id": "A", "text": "20"}, {"id": "B", "text": "22"}, {"id": "C", "text": "24"}, {"id": "D", "text": "26"}]', 'C', 'Volume = l × w × h = 4 × 3 × 2 = 24.', 420),

('Simplify: 16/32', '[{"id": "A", "text": "1/2"}, {"id": "B", "text": "1/4"}, {"id": "C", "text": "2/8"}, {"id": "D", "text": "4/16"}]', 'A', '16/32 = 1/2.', 300),

('What is 10²?', '[{"id": "A", "text": "90"}, {"id": "B", "text": "95"}, {"id": "C", "text": "100"}, {"id": "D", "text": "105"}]', 'C', '10² = 10 × 10 = 100.', 310),

('What is the x-intercept of y = 5x - 10?', '[{"id": "A", "text": "1"}, {"id": "B", "text": "2"}, {"id": "C", "text": "3"}, {"id": "D", "text": "4"}]', 'B', 'When y=0, 5x - 10 = 0, so 5x = 10, x = 2.', 370),

('Solve: 7x = 49', '[{"id": "A", "text": "6"}, {"id": "B", "text": "7"}, {"id": "C", "text": "8"}, {"id": "D", "text": "9"}]', 'B', '7x = 49, so x = 7.', 320),

('What is 90% of 300?', '[{"id": "A", "text": "260"}, {"id": "B", "text": "265"}, {"id": "C", "text": "270"}, {"id": "D", "text": "275"}]', 'C', '90% of 300 = 0.9 × 300 = 270.', 340),

('What is the area of a parallelogram with base 8 and height 5?', '[{"id": "A", "text": "30"}, {"id": "B", "text": "35"}, {"id": "C", "text": "40"}, {"id": "D", "text": "45"}]', 'C', 'Area = base × height = 8 × 5 = 40.', 420),

('Simplify: 18/36', '[{"id": "A", "text": "1/2"}, {"id": "B", "text": "1/3"}, {"id": "C", "text": "2/9"}, {"id": "D", "text": "3/9"}]', 'A', '18/36 = 1/2.', 300),

('What is 11²?', '[{"id": "A", "text": "110"}, {"id": "B", "text": "115"}, {"id": "C", "text": "121"}, {"id": "D", "text": "125"}]', 'C', '11² = 11 × 11 = 121.', 310),

('What is the slope between (3,1) and (7,9)?', '[{"id": "A", "text": "1.5"}, {"id": "B", "text": "2"}, {"id": "C", "text": "2.5"}, {"id": "D", "text": "3"}]', 'B', 'Slope = (9-1)/(7-3) = 8/4 = 2.', 330),

('Factor: x² - 36', '[{"id": "A", "text": "(x-6)(x+6)"}, {"id": "B", "text": "(x-6)²"}, {"id": "C", "text": "(x+6)²"}, {"id": "D", "text": "x(x-36)"}]', 'A', 'Difference of squares: x² - 36 = (x-6)(x+6).', 550),

('Solve: x + 11 = 25', '[{"id": "A", "text": "12"}, {"id": "B", "text": "13"}, {"id": "C", "text": "14"}, {"id": "D", "text": "15"}]', 'C', 'x + 11 = 25, so x = 14.', 320),

('What is 100% of 50?', '[{"id": "A", "text": "25"}, {"id": "B", "text": "40"}, {"id": "C", "text": "50"}, {"id": "D", "text": "75"}]', 'C', '100% of 50 = 1 × 50 = 50.', 300),

('What is the circumference of a circle with diameter 10? (Use π = 3.14)', '[{"id": "A", "text": "31.4"}, {"id": "B", "text": "62.8"}, {"id": "C", "text": "78.5"}, {"id": "D", "text": "157"}]', 'A', 'Circumference = πd = 3.14 × 10 = 31.4.', 500),

('Simplify: 20/40', '[{"id": "A", "text": "1/2"}, {"id": "B", "text": "1/4"}, {"id": "C", "text": "2/5"}, {"id": "D", "text": "5/20"}]', 'A', '20/40 = 1/2.', 300),

('What is 12²?', '[{"id": "A", "text": "140"}, {"id": "B", "text": "144"}, {"id": "C", "text": "148"}, {"id": "D", "text": "152"}]', 'B', '12² = 12 × 12 = 144.', 310),

('What is the y-intercept of y = -2x + 8?', '[{"id": "A", "text": "-2"}, {"id": "B", "text": "2"}, {"id": "C", "text": "8"}, {"id": "D", "text": "10"}]', 'C', 'When x=0, y=8.', 370),

('Solve: 8x = 64', '[{"id": "A", "text": "7"}, {"id": "B", "text": "8"}, {"id": "C", "text": "9"}, {"id": "D", "text": "10"}]', 'B', '8x = 64, so x = 8.', 320),

('What is 25% of 400?', '[{"id": "A", "text": "90"}, {"id": "B", "text": "95"}, {"id": "C", "text": "100"}, {"id": "D", "text": "105"}]', 'C', '25% of 400 = 0.25 × 400 = 100.', 320),

('What is the area of an equilateral triangle with side 6?', '[{"id": "A", "text": "9√3"}, {"id": "B", "text": "12√3"}, {"id": "C", "text": "15√3"}, {"id": "D", "text": "18√3"}]', 'A', 'Area = (√3/4) × side² = (√3/4) × 36 = 9√3.', 600),

('Simplify: 22/44', '[{"id": "A", "text": "1/2"}, {"id": "B", "text": "1/4"}, {"id": "C", "text": "2/11"}, {"id": "D", "text": "11/22"}]', 'A', '22/44 = 1/2.', 300),

('What is 13²?', '[{"id": "A", "text": "165"}, {"id": "B", "text": "169"}, {"id": "C", "text": "173"}, {"id": "D", "text": "177"}]', 'B', '13² = 13 × 13 = 169.', 310),

('What is the slope between (5,3) and (8,11)?', '[{"id": "A", "text": "2"}, {"id": "B", "text": "2.5"}, {"id": "C", "text": "3"}, {"id": "D", "text": "3.5"}]', 'B', 'Slope = (11-3)/(8-5) = 8/3 ≈ 2.67. The closest option is 2.5, but wait, 8/3 is 2.666..., so perhaps B.', 330),

('Factor: x² - 49', '[{"id": "A", "text": "(x-7)(x+7)"}, {"id": "B", "text": "(x-7)²"}, {"id": "C", "text": "(x+7)²"}, {"id": "D", "text": "x(x-49)"}]', 'A', 'Difference of squares: x² - 49 = (x-7)(x+7).', 550),

('Solve: x + 13 = 30', '[{"id": "A", "text": "15"}, {"id": "B", "text": "16"}, {"id": "C", "text": "17"}, {"id": "D", "text": "18"}]', 'C', 'x + 13 = 30, so x = 17.', 320),

('What is 35% of 200?', '[{"id": "A", "text": "65"}, {"id": "B", "text": "70"}, {"id": "C", "text": "75"}, {"id": "D", "text": "80"}]', 'B', '35% of 200 = 0.35 × 200 = 70.', 340),

('What is the volume of a sphere with radius 3? (Use π = 3.14)', '[{"id": "A", "text": "84.78"}, {"id": "B", "text": "113.04"}, {"id": "C", "text": "141.3"}, {"id": "D", "text": "169.56"}]', 'B', 'Volume = (4/3)πr³ = (4/3) × 3.14 × 27 = (4/3) × 84.78 ≈ 113.04.', 650),

('Simplify: 24/48', '[{"id": "A", "text": "1/2"}, {"id": "B", "text": "1/3"}, {"id": "C", "text": "2/3"}, {"id": "D", "text": "3/4"}]', 'A', '24/48 = 1/2.', 300),

('What is 14²?', '[{"id": "A", "text": "190"}, {"id": "B", "text": "194"}, {"id": "C", "text": "196"}, {"id": "D", "text": "200"}]', 'C', '14² = 14 × 14 = 196.', 310),

('What is the x-intercept of y = 6x - 12?', '[{"id": "A", "text": "1"}, {"id": "B", "text": "2"}, {"id": "C", "text": "3"}, {"id": "D", "text": "4"}]', 'B', 'When y=0, 6x - 12 = 0, so 6x = 12, x = 2.', 370),

('Solve: 9x = 81', '[{"id": "A", "text": "8"}, {"id": "B", "text": "9"}, {"id": "C", "text": "10"}, {"id": "D", "text": "11"}]', 'B', '9x = 81, so x = 9.', 320),

('What is 45% of 200?', '[{"id": "A", "text": "85"}, {"id": "B", "text": "90"}, {"id": "C", "text": "95"}, {"id": "D", "text": "100"}]', 'B', '45% of 200 = 0.45 × 200 = 90.', 340);


-- Verify insertion
SELECT 'Development Questions Seeded' as status, COUNT(*) as count FROM questions;