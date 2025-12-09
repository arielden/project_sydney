-- Complete SAT Math Question Types
-- Sydney SAT Learning Platform
-- Insert all required question type categories

-- Clear existing data to avoid conflicts (except the first two entries)
DELETE FROM question_types WHERE id > 2;

-- Insert the complete list of 20 SAT Math question type categories
INSERT INTO question_types (name, description, category_id, difficulty_level, display_order, is_active) VALUES

-- 1. Percentages (update existing)
-- 2. Areas and Volumes  
('Areas and Volumes', 'Area calculations for 2D shapes and volume calculations for 3D solids', 'geometry-measurement', 'medium', 3, true),

-- 3. Trig
('Trig', 'Trigonometric functions, identities, and applications including unit circle', 'advanced-trigonometry', 'hard', 4, true),

-- 4. Quadratic Equations
('Quadratic Equations', 'Solving quadratic equations using factoring, completing the square, and quadratic formula', 'algebra-quadratic', 'medium', 5, true),

-- 5. Special Triangles
('Special Triangles', '30-60-90 and 45-45-90 triangles, their properties and applications', 'geometry-triangles', 'medium', 6, true),

-- 6. Exponential Equations
('Exponential Equations', 'Solving exponential equations and understanding exponential growth/decay', 'advanced-exponential', 'hard', 7, true),

-- 7. Similar Triangles
('Similar Triangles', 'Properties of similar triangles, scale factors, and proportional relationships', 'geometry-triangles', 'medium', 8, true),

-- 8. Geometry Basics
('Geometry Basics', 'Fundamental geometric concepts, angles, lines, and basic shape properties', 'geometry-fundamentals', 'easy', 9, true),

-- 9. Arcs
('Arcs', 'Arc length, sector area, and properties of circles including central and inscribed angles', 'geometry-circles', 'medium', 10, true),

-- 10. Circle Equations
('Circle Equations', 'Equations of circles, center-radius form, and coordinate geometry of circles', 'geometry-coordinate', 'medium', 11, true),

-- 11. Polynomials
('Polynomials', 'Polynomial operations, factoring, and polynomial function properties', 'algebra-polynomial', 'medium', 12, true),

-- 12. Fractions
('Fractions', 'Operations with fractions, rational expressions, and fraction-based problems', 'algebra-rational', 'easy', 13, true),

-- 13. Exponents
('Exponents', 'Exponent rules, operations with exponents, and exponential expressions', 'algebra-exponents', 'medium', 14, true),

-- 14. Means and Medians
('Means and Medians', 'Measures of central tendency including arithmetic mean, median, and mode', 'statistics-central-tendency', 'easy', 15, true),

-- 15. Probability and Statistics
('Probability and Statistics', 'Basic probability concepts, data analysis, and statistical interpretation', 'statistics-probability', 'medium', 16, true),

-- 16. Linear Equations
('Linear Equations', 'Solving linear equations, systems of linear equations, and linear relationships', 'algebra-linear', 'easy', 17, true),

-- 17. Unit Conversions
('Unit Conversions', 'Converting between different units of measurement and rate problems', 'problem-solving-units', 'easy', 18, true),

-- 18. Function Transformations
('Function Transformations', 'Transformations of functions including shifts, stretches, and reflections', 'algebra-functions', 'hard', 19, true),

-- 19. Systems of Equations
('Systems of Equations', 'Solving systems of linear equations using substitution, elimination, and graphing', 'algebra-systems', 'medium', 20, true),

-- 20. Misc: Functions, Single Variable Equations
('Misc: Functions, Single Variable Equations', 'Miscellaneous function problems and single variable equation solving techniques', 'algebra-miscellaneous', 'mixed', 21, true);

-- Update existing Percentages entry
UPDATE question_types 
SET description = 'Percentage calculations, percent change, and percentage-based word problems',
    category_id = 'problem-solving-percentages',
    difficulty_level = 'medium',
    display_order = 2,
    updated_at = CURRENT_TIMESTAMP
WHERE name = 'Percentages';

-- Verify the insertion
SELECT 
    id, 
    name, 
    category_id, 
    difficulty_level, 
    display_order,
    is_active
FROM question_types 
ORDER BY display_order;