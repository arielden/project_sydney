-- Seed file: SAT Math Micro-Rating Categories
-- Creates the 22 standard SAT math categories for micro-ratings

INSERT INTO micro_ratings (user_id, category, elo_rating, k_factor, attempts) VALUES
-- This will be populated when users register, but here are the 22 categories:

-- Algebra and Functions (8 categories)
-- 'linear_equations' - Linear equations and inequalities
-- 'systems_equations' - Systems of linear equations
-- 'quadratic_functions' - Quadratic functions and equations
-- 'exponential_functions' - Exponential and logarithmic functions
-- 'polynomial_functions' - Polynomial operations and factoring
-- 'rational_expressions' - Rational expressions and equations
-- 'radical_expressions' - Radical expressions and equations
-- 'absolute_value' - Absolute value equations and inequalities

-- Geometry (6 categories)
-- 'coordinate_geometry' - Coordinate geometry and graphing
-- 'geometry_lines_angles' - Lines, angles, and parallel/perpendicular relationships
-- 'triangles_polygons' - Triangles, quadrilaterals, and other polygons
-- 'circles' - Circles, arcs, and sectors
-- 'three_dimensional' - Three-dimensional geometry and volume
-- 'transformations' - Geometric transformations and symmetry

-- Advanced Math (4 categories)
-- 'trigonometry' - Trigonometric functions and identities
-- 'complex_numbers' - Complex numbers and operations
-- 'sequences_series' - Sequences, series, and mathematical induction
-- 'limits_derivatives' - Basic limits and derivatives (Pre-calculus)

-- Statistics and Probability (4 categories)
-- 'statistics_measures' - Measures of central tendency and spread
-- 'probability_basic' - Basic probability and counting principles
-- 'data_analysis' - Data interpretation and analysis
-- 'regression_correlation' - Linear regression and correlation

-- Note: This file defines the categories but actual records are created
-- when users register through the initializeMicroRatings function

-- Validation query to check all 22 categories:
/*
SELECT category, COUNT(*) as user_count 
FROM micro_ratings 
GROUP BY category 
ORDER BY category;

Expected categories:
1. linear_equations
2. systems_equations  
3. quadratic_functions
4. exponential_functions
5. polynomial_functions
6. rational_expressions
7. radical_expressions
8. absolute_value
9. coordinate_geometry
10. geometry_lines_angles
11. triangles_polygons
12. circles
13. three_dimensional
14. transformations
15. trigonometry
16. complex_numbers
17. sequences_series
18. limits_derivatives
19. statistics_measures
20. probability_basic
21. data_analysis
22. regression_correlation
*/