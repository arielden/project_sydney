-- ============================================================================
-- Seed: Categories (18 SAT Math Categories - Updated)
-- ============================================================================
-- Insert the 18 SAT Math categories into the categories table
-- Updated: December 18, 2025

INSERT INTO categories (name, description, difficulty_level, display_order, is_active) VALUES

-- 1. Percentages
('Percentages', 'Percentage calculations, percent change, and percentage-based word problems', 'medium', 1, true),

-- 2. Areas and Volumes
('Areas and Volumes', 'Area calculations for 2D shapes and volume calculations for 3D solids', 'medium', 2, true),

-- 3. Trig
('Trig', 'Trigonometric functions, identities, and applications including unit circle', 'hard', 3, true),

-- 4. Quadratic Equations
('Quadratic Equations', 'Solving quadratic equations using factoring, completing the square, and quadratic formula', 'medium', 4, true),

-- 5. Special Triangles
('Special Triangles', '30-60-90 and 45-45-90 triangles, their properties and applications', 'medium', 5, true),

-- 6. Exponential Equations
('Exponential Equations', 'Solving exponential equations and understanding exponential growth/decay', 'hard', 6, true),

-- 7. Similar Triangles
('Similar Triangles', 'Properties of similar triangles, scale factors, and proportional relationships', 'medium', 7, true),

-- 8. Angle Properties
('Angle Properties', 'Angle relationships, complementary, supplementary angles, and angle theorems', 'easy', 8, true),

-- 9. Circles
('Circles', 'Circle properties, circumference, area, arc length, and sector area', 'medium', 9, true),

-- 10. Polynomials
('Polynomials', 'Polynomial operations, factoring, and polynomial function properties', 'medium', 10, true),

-- 11. Fractions & Exponents
('Fractions & Exponents', 'Operations with fractions, rational expressions, exponent rules, and exponential expressions', 'medium', 11, true),

-- 12. Means and Medians
('Means and Medians', 'Measures of central tendency including arithmetic mean, median, and mode', 'easy', 12, true),

-- 13. Probability and Statistics
('Probability and Statistics', 'Basic probability concepts, data analysis, and statistical interpretation', 'medium', 13, true),

-- 14. Linear Equations
('Linear Equations', 'Solving linear equations, systems of linear equations, and linear relationships', 'easy', 14, true),

-- 15. Rates
('Rates', 'Rate calculations, unit conversions, distance-speed-time problems, and work rates', 'medium', 15, true),

-- 16. Function Transformations
('Function Transformations', 'Transformations of functions including shifts, stretches, and reflections', 'hard', 16, true),

-- 17. Systems of Equations
('Systems of Equations', 'Solving systems of linear equations using substitution, elimination, and graphing', 'medium', 17, true),

-- 18. Single Variable Equations
('Single Variable Equations', 'Solving single variable equations, inequalities, and absolute value equations', 'medium', 18, true);

-- Verify insertion
SELECT 'Categories Seeded' as status, COUNT(*) as count FROM categories;