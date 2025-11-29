-- Seed Data: SAT Math Question Types
-- Sydney SAT Learning Platform
-- Initial question type categories (66 total types)

-- Insert SAT Math Question Types
-- Note: This is structure only - actual questions will be added later

INSERT INTO questions (
    question_type, 
    question_text, 
    options, 
    correct_answer, 
    explanation,
    difficulty_rating,
    is_diagnostic
) VALUES

-- Algebra Categories (20 types)
('linear_equations_one_variable', 'Placeholder: Linear equations in one variable', '[]', 'A', 'Placeholder explanation', 1200, false),
('linear_equations_two_variables', 'Placeholder: Linear equations in two variables', '[]', 'A', 'Placeholder explanation', 1200, false),
('linear_inequalities', 'Placeholder: Linear inequalities', '[]', 'A', 'Placeholder explanation', 1200, false),
('systems_linear_equations', 'Placeholder: Systems of linear equations', '[]', 'A', 'Placeholder explanation', 1300, false),
('quadratic_equations', 'Placeholder: Quadratic equations', '[]', 'A', 'Placeholder explanation', 1400, false),
('quadratic_functions', 'Placeholder: Quadratic functions', '[]', 'A', 'Placeholder explanation', 1400, false),
('exponential_functions', 'Placeholder: Exponential functions', '[]', 'A', 'Placeholder explanation', 1500, false),
('rational_expressions', 'Placeholder: Rational expressions', '[]', 'A', 'Placeholder explanation', 1450, false),
('polynomial_operations', 'Placeholder: Polynomial operations', '[]', 'A', 'Placeholder explanation', 1350, false),
('radical_expressions', 'Placeholder: Radical expressions', '[]', 'A', 'Placeholder explanation', 1400, false),
('absolute_value', 'Placeholder: Absolute value equations', '[]', 'A', 'Placeholder explanation', 1350, false),
('function_notation', 'Placeholder: Function notation', '[]', 'A', 'Placeholder explanation', 1250, false),
('domain_range', 'Placeholder: Domain and range', '[]', 'A', 'Placeholder explanation', 1300, false),
('composite_functions', 'Placeholder: Composite functions', '[]', 'A', 'Placeholder explanation', 1450, false),
('inverse_functions', 'Placeholder: Inverse functions', '[]', 'A', 'Placeholder explanation', 1500, false),
('graphing_linear_functions', 'Placeholder: Graphing linear functions', '[]', 'A', 'Placeholder explanation', 1200, false),
('graphing_quadratic_functions', 'Placeholder: Graphing quadratic functions', '[]', 'A', 'Placeholder explanation', 1350, false),
('transformations', 'Placeholder: Function transformations', '[]', 'A', 'Placeholder explanation', 1400, false),
('word_problems_algebra', 'Placeholder: Algebraic word problems', '[]', 'A', 'Placeholder explanation', 1350, false),
('sequences_series', 'Placeholder: Sequences and series', '[]', 'A', 'Placeholder explanation', 1450, false),

-- Geometry Categories (22 types)
('angles_triangles', 'Placeholder: Angles in triangles', '[]', 'A', 'Placeholder explanation', 1200, false),
('congruent_triangles', 'Placeholder: Congruent triangles', '[]', 'A', 'Placeholder explanation', 1300, false),
('similar_triangles', 'Placeholder: Similar triangles', '[]', 'A', 'Placeholder explanation', 1350, false),
('right_triangles', 'Placeholder: Right triangles', '[]', 'A', 'Placeholder explanation', 1250, false),
('pythagorean_theorem', 'Placeholder: Pythagorean theorem', '[]', 'A', 'Placeholder explanation', 1200, false),
('special_right_triangles', 'Placeholder: Special right triangles', '[]', 'A', 'Placeholder explanation', 1300, false),
('trigonometry_basic', 'Placeholder: Basic trigonometry', '[]', 'A', 'Placeholder explanation', 1400, false),
('circles_basic', 'Placeholder: Basic circle properties', '[]', 'A', 'Placeholder explanation', 1250, false),
('circle_equations', 'Placeholder: Circle equations', '[]', 'A', 'Placeholder explanation', 1400, false),
('area_perimeter', 'Placeholder: Area and perimeter', '[]', 'A', 'Placeholder explanation', 1150, false),
('volume_surface_area', 'Placeholder: Volume and surface area', '[]', 'A', 'Placeholder explanation', 1300, false),
('coordinate_geometry', 'Placeholder: Coordinate geometry', '[]', 'A', 'Placeholder explanation', 1350, false),
('parallel_perpendicular_lines', 'Placeholder: Parallel and perpendicular lines', '[]', 'A', 'Placeholder explanation', 1300, false),
('polygons', 'Placeholder: Polygon properties', '[]', 'A', 'Placeholder explanation', 1200, false),
('quadrilaterals', 'Placeholder: Quadrilateral properties', '[]', 'A', 'Placeholder explanation', 1250, false),
('transformations_geometry', 'Placeholder: Geometric transformations', '[]', 'A', 'Placeholder explanation', 1400, false),
('solid_geometry', 'Placeholder: Solid geometry', '[]', 'A', 'Placeholder explanation', 1450, false),
('geometric_probability', 'Placeholder: Geometric probability', '[]', 'A', 'Placeholder explanation', 1500, false),
('constructions', 'Placeholder: Geometric constructions', '[]', 'A', 'Placeholder explanation', 1350, false),
('proofs', 'Placeholder: Geometric proofs', '[]', 'A', 'Placeholder explanation', 1550, false),
('inscribed_angles', 'Placeholder: Inscribed angles', '[]', 'A', 'Placeholder explanation', 1400, false),
('arc_length_sector_area', 'Placeholder: Arc length and sector area', '[]', 'A', 'Placeholder explanation', 1450, false),

-- Statistics and Probability Categories (12 types)
('mean_median_mode', 'Placeholder: Mean, median, mode', '[]', 'A', 'Placeholder explanation', 1100, false),
('standard_deviation', 'Placeholder: Standard deviation', '[]', 'A', 'Placeholder explanation', 1400, false),
('probability_basic', 'Placeholder: Basic probability', '[]', 'A', 'Placeholder explanation', 1200, false),
('conditional_probability', 'Placeholder: Conditional probability', '[]', 'A', 'Placeholder explanation', 1450, false),
('combinations_permutations', 'Placeholder: Combinations and permutations', '[]', 'A', 'Placeholder explanation', 1400, false),
('data_interpretation', 'Placeholder: Data interpretation', '[]', 'A', 'Placeholder explanation', 1250, false),
('scatter_plots', 'Placeholder: Scatter plots', '[]', 'A', 'Placeholder explanation', 1300, false),
('linear_regression', 'Placeholder: Linear regression', '[]', 'A', 'Placeholder explanation', 1450, false),
('histograms', 'Placeholder: Histograms', '[]', 'A', 'Placeholder explanation', 1200, false),
('box_plots', 'Placeholder: Box plots', '[]', 'A', 'Placeholder explanation', 1350, false),
('normal_distribution', 'Placeholder: Normal distribution', '[]', 'A', 'Placeholder explanation', 1500, false),
('sampling_bias', 'Placeholder: Sampling and bias', '[]', 'A', 'Placeholder explanation', 1400, false),

-- Advanced Topics Categories (12 types)
('logarithms', 'Placeholder: Logarithmic functions', '[]', 'A', 'Placeholder explanation', 1500, false),
('complex_numbers', 'Placeholder: Complex numbers', '[]', 'A', 'Placeholder explanation', 1550, false),
('matrices', 'Placeholder: Matrix operations', '[]', 'A', 'Placeholder explanation', 1600, false),
('parametric_equations', 'Placeholder: Parametric equations', '[]', 'A', 'Placeholder explanation', 1550, false),
('polar_coordinates', 'Placeholder: Polar coordinates', '[]', 'A', 'Placeholder explanation', 1600, false),
('limits', 'Placeholder: Limits', '[]', 'A', 'Placeholder explanation', 1650, false),
('derivatives_basic', 'Placeholder: Basic derivatives', '[]', 'A', 'Placeholder explanation', 1700, false),
('optimization', 'Placeholder: Optimization problems', '[]', 'A', 'Placeholder explanation', 1750, false),
('trigonometric_identities', 'Placeholder: Trigonometric identities', '[]', 'A', 'Placeholder explanation', 1500, false),
('inverse_trig_functions', 'Placeholder: Inverse trigonometric functions', '[]', 'A', 'Placeholder explanation', 1550, false),
('vectors', 'Placeholder: Vector operations', '[]', 'A', 'Placeholder explanation', 1600, false),
('logic_proofs', 'Placeholder: Logic and proofs', '[]', 'A', 'Placeholder explanation', 1650, false);

-- Update question count
UPDATE questions 
SET times_answered = 0, times_correct = 0 
WHERE question_text LIKE 'Placeholder:%';