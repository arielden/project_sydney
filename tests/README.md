# Test Cases

This folder contains comprehensive test cases for the Sidney Quiz Application.

## Important: Test Setup Required

These test files are **specifications** that require Jest to be installed and configured. The TypeScript files reference Jest globals (`describe`, `it`, `expect`) which will be available once Jest is set up.

### Initial Setup

1. **Install Jest and dependencies:**
   ```bash
   bash scripts/setup-jest.sh
   ```
   Or manually:
   ```bash
   npm install --save-dev jest @types/jest ts-jest typescript
   ```

2. **Update package.json scripts** (add these to your `scripts` section):
   ```json
   {
     "scripts": {
       "test": "jest",
       "test:watch": "jest --watch",
       "test:coverage": "jest --coverage",
       "test:unit": "jest tests/unit",
       "test:integration": "jest tests/integration"
     }
   }
   ```

## Test Structure

```                                          
tests/
├── unit/
│   ├── eloCalculator.test.ts      # ELO rating calculation tests
│   ├── microRatings.test.ts       # Category-specific rating tests
│   ├── playerRatings.test.ts      # Player overall rating tests
│   └── quizLogic.test.ts          # Quiz logic and scoring tests
├── integration/
│   ├── questionAttempt.test.ts    # Question attempt recording
│   ├── quizSession.test.ts        # Full quiz session flow
│   └── ratingUpdates.test.ts      # End-to-end rating update flow
├── fixtures/
│   ├── testData.ts                # Test data and fixtures
│   └── mockDatabase.ts            # Mock database utilities
└── README.md                       # This file
```

## Running Tests

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### With Coverage
```bash
npm run test:coverage
```

## Test Categories

### 1. ELO Calculator Tests
- Basic ELO calculation
- Expected probability calculation
- Rating change calculations
- K-factor adjustments
- Edge cases (very high/low ratings)

### 2. Micro Ratings Tests
- Initialize user category rating
- Record attempt with ELO change
- Confidence level updates
- Success rate calculation
- Multiple category handling

### 3. Player Ratings Tests
- Initialize player rating
- Update overall ELO
- Track wins/losses/streaks
- Best rating tracking
- K-factor adjustments

### 4. Quiz Logic Tests
- Question selection
- Answer validation
- Session scoring
- Time tracking
- Category progression

### 5. Integration Tests
- Full question attempt flow
- Multi-question quiz session
- Category rating updates
- Player rating updates
- Streak calculation

## Test Data

Test fixtures include:
- Sample questions with various difficulty levels
- Sample categories and subcategories
- Sample users with different experience levels
- Sample quiz sessions
- Sample question attempts

## Debugging

To debug tests:
```bash
npm run test:debug
```

To see detailed logging:
```bash
npm test -- --verbose
```

## Coverage

Current test coverage targets:
- ELO Calculator: 95%+
- Rating Models: 85%+
- Quiz Models: 80%+
- Routes: 70%+
