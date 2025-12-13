# 22 SAT Math Categories - Complete Reference

This document defines the 22 official SAT math categories used by the micro-rating system.

## Category Structure

The 22 categories are organized into 4 main groups, matching the official College Board SAT Math taxonomy:

### Group 1: Algebra & Functions (9 categories)

1. **linear_equations_one_variable**
   - Linear equations and inequalities with one variable
   - Topics: Solving equations, isolating variables, multi-step equations

2. **linear_equations_systems**
   - Systems of linear equations
   - Topics: Substitution, elimination, graphical solutions

3. **linear_inequalities**
   - Linear inequalities and compound inequalities
   - Topics: Solving inequalities, number line representation, systems of inequalities

4. **functions_notation**
   - Function notation and evaluation
   - Topics: f(x) notation, domain/range, function evaluation

5. **functions_linear**
   - Linear functions and equations
   - Topics: Slope, y-intercept, point-slope form, standard form

6. **functions_quadratic**
   - Quadratic functions and parabolas
   - Topics: Vertex form, standard form, axis of symmetry, transformations

7. **functions_exponential**
   - Exponential functions and growth/decay
   - Topics: Base, exponents, exponential growth, compound interest

8. **functions_polynomial**
   - Polynomial functions and operations
   - Topics: Degree, end behavior, factoring, zeros

9. **functions_rational**
   - Rational functions and operations
   - Topics: Asymptotes, domain, simplification

### Group 2: Advanced Math (7 categories)

10. **quadratic_equations**
    - Quadratic equations and solutions
    - Topics: Factoring, quadratic formula, completing the square

11. **polynomial_operations**
    - Polynomial arithmetic and factoring
    - Topics: Adding/subtracting, multiplying polynomials, GCF, trinomial factoring

12. **rational_expressions**
    - Rational expressions and equations
    - Topics: Simplifying, multiplying, dividing, solving rational equations

13. **radical_expressions**
    - Radical expressions and equations
    - Topics: Simplifying radicals, rationalizing, solving radical equations

14. **exponential_equations**
    - Exponential equations with various bases
    - Topics: Using logarithms, change of base, solving exponential equations

15. **logarithmic_functions**
    - Logarithmic functions and properties
    - Topics: log properties, change of base, solving logarithmic equations

16. **trigonometric_functions**
    - Trigonometric functions and identities
    - Topics: sin, cos, tan, unit circle, periodicity, identities

### Group 3: Problem Solving & Data Analysis (4 categories)

17. **ratios_proportions**
    - Ratios, proportions, and scaling
    - Topics: Setting up ratios, solving proportions, scale factors

18. **percentages**
    - Percent calculations and applications
    - Topics: Percent change, percent of, discount, tax, tips

19. **unit_conversion**
    - Unit conversion and rates
    - Topics: Converting units, rate problems, dimensional analysis

20. **data_interpretation**
    - Data interpretation and analysis
    - Topics: Tables, charts, graphs, mean/median/mode, outliers

### Group 4: Geometry & Trigonometry (2 categories)

21. **coordinate_geometry**
    - Coordinate geometry and analytic geometry
    - Topics: Distance formula, midpoint, slope, equations of lines, transformations

22. **trigonometry_applications**
    - Trigonometry applications
    - Topics: Right triangle trigonometry, angles, Law of Sines/Cosines, applications

## Database Implementation

Each user receives all 22 micro-rating categories initialized at registration:
- Initial ELO: 1200
- Initial attempts: 0
- K-factor: 100 (scales with experience)

Categories track performance independently and are updated after each question attempt in that category.

## Usage in System

The micro-rating system allows users to:
1. **See strengths and weaknesses** across all 22 SAT math topics
2. **Get targeted recommendations** based on category performance
3. **Track progress** in specific areas of weakness
4. **Visualize growth** over time in each category
