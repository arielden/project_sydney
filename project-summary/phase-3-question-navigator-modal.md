# Quiz Question Navigator Modal Component

**Date:** December 7, 2025  
**Phase:** 2 - Quiz System Enhancement  
**Feature:** Question Navigation Modal + Enhanced Navigation System

---

## Overview

Implemented a floating modal component that displays a visual grid of all quiz questions, allowing users to see their progress at a glance and identify questions that need attention. Also enhanced the quiz navigation system with improved Next/Back button functionality and keyboard shortcuts.

---

## Files Created

### 1. `src/components/quiz/QuestionNavigator.tsx`

**Purpose:** Main modal component for question navigation during quizzes.

**Components:**

| Component | Description |
|-----------|-------------|
| `QuestionSquare` | Individual clickable button representing a single question with visual status indicators and flag overlay |
| `LegendItem` | Reusable component for displaying legend entries with custom icon and label |
| `QuestionNavigator` | Main modal container with header, grid, legend, and footer |

**Props Interface:**
```typescript
interface QuestionNavigatorProps {
  isOpen: boolean;                    // Controls modal visibility
  onClose: () => void;                // Callback to close modal
  currentQuestionIndex: number;       // 0-indexed current question
  totalQuestions: number;             // Total questions in quiz
  answeredQuestions: Set<number>;     // Set of answered question indices
  reviewQuestions: Set<number>;       // Set of questions marked for review
  onQuestionSelect: (index: number) => void;  // Navigation callback
}
```

**Visual States (Priority Order):**

| State | Background | Flag | Description |
|-------|------------|------|-------------|
| `current` | Blue (`bg-blue-primary`) + ring | Based on review | Currently active question with pin icon above |
| `answered` | Blue (`bg-blue-600`) | Yes if reviewed | Question has been answered |
| `answered + review` | Blue (`bg-blue-600`) | Yes (red) | Answered and marked for review |
| `review` (unanswered) | Orange (`bg-orange-500`) | Yes (red) | Marked for review but not answered |
| `unanswered` | Gray (`bg-gray-100`) | No | Question not yet answered |

**Features:**
- Responsive grid layout (5 columns mobile, 8 tablet, 10 desktop)
- Summary statistics bar showing answered/review/remaining counts
- Red flag overlay for reviewed questions (visible on any background)
- MapPin icon above current question
- Legend with visual examples of all 5 states
- Backdrop click to close
- Escape key to close
- Body scroll lock when open
- Smooth fade and slide animations
- Hover scale effects on question squares

---

### 2. `src/components/quiz/index.ts`

**Purpose:** Barrel export file for quiz components.

**Exports:**
- `QuestionNavigator` component
- `QuestionNavigatorProps` interface
- `QuestionStatus` type

---

## Files Modified

### `src/pages/QuizPage.tsx`

**Changes Made:**

1. **Updated Imports:**
   - Added `ChevronDown`, `ChevronLeft`, `ChevronRight` icons
   - Removed `Grid3X3` from header (moved to footer)
   - `QuestionNavigator` from components/quiz

2. **New State Variables:**
   ```typescript
   const [isNavigatorOpen, setIsNavigatorOpen] = useState(false);
   const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
   const [reviewQuestions, setReviewQuestions] = useState<Set<number>>(new Set());
   const [questionAnswers, setQuestionAnswers] = useState<Map<number, string>>(new Map());
   ```

3. **Updated `handleAnswerSelect`:**
   - Now auto-saves answer to local state when selected

4. **Updated `handleNextQuestion`:**
   - Allows proceeding without selecting an answer (skip questions)
   - Saves answer if selected before navigating
   - Requires answer only on last question (to finish)
   - Restores previous answer and review flag when navigating

5. **Updated `handlePreviousQuestion`:**
   - Saves current answer before showing limitation message
   - Explains that backend architecture doesn't support going back

6. **Updated `handleToggleReview`:**
   - Updates `reviewQuestions` Set for navigator display

7. **New Keyboard Shortcuts:**
   - `←` (ArrowLeft): Previous question
   - `→` (ArrowRight): Next question
   - `R`: Toggle review flag
   - `G`: Open question navigator

8. **QuizHeader Changes:**
   - Removed `onOpenNavigator` prop
   - Removed Grid3X3 button

9. **QuizFooter Changes:**
   - Added `onOpenNavigator` prop
   - Made "Question X of Y" clickable with ChevronDown icon
   - Updated button styles with icons (ChevronLeft, ChevronRight)
   - Removed answer requirement from Next button (allows skipping)

---

## User Interface

### Opening the Navigator
- Click **"Question X of Y"** in the footer (has dropdown arrow indicator)
- Press **G** key on keyboard

### Footer Layout
```
┌───────────────────────────────────────────────────────────────────┐
│  Student Name     │  Question 5 of 30 ▼  │     ← Back    Next →   │
└───────────────────────────────────────────────────────────────────┘
```

### Modal Layout
```
┌─────────────────────────────────────────┐
│ 📍 Question Navigator              [X]  │  ← Header
├─────────────────────────────────────────┤
│  ■ Answered: 5  🚩 Review: 2  □ Remaining: 23  │  ← Stats
├─────────────────────────────────────────┤
│       📍                                │
│  [1] [2] [3] [4] [5] [6] [7] [8] [9] [10] │
│  [11][12]🚩[14][15][16][17][18][19][20] │  ← Grid
│  [21][22][23][24][25][26][27][28][29][30] │
├─────────────────────────────────────────┤
│  □ Unanswered  ■ Answered  🟧🚩 Review  ■🚩 Ans+Review  📍 Current │
├─────────────────────────────────────────┤
│           [ Close Navigator ]           │  ← Footer
└─────────────────────────────────────────┘
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` | Go to previous question |
| `→` | Go to next question |
| `R` | Toggle "Mark for Review" |
| `G` | Open Question Navigator |
| `Esc` | Close Navigator (when open) |

---

## Accessibility

- `role="dialog"` and `aria-modal="true"` on modal
- `aria-labelledby` pointing to title
- `aria-label` on each question button with full status description
- Keyboard navigation support (Tab, Escape, shortcuts)
- Focus ring on interactive elements
- Button titles with shortcut hints

---

## Navigation Behavior

### Next Button
- If answer selected: Saves answer, submits to backend, moves to next
- If no answer selected: Simply moves to next question (skip)
- On last question: Requires answer to finish quiz

### Back Button
- Currently shows informational message
- Backend architecture serves questions dynamically based on ELO
- Future enhancement will add full back navigation

### Answer Persistence
- Answers saved to local Map when selected
- Review flags saved to Set when toggled
- Both restored when navigating between questions

---

## Future Enhancements

- Direct question navigation (requires backend changes for question history)
- Full back navigation support
- Touch gestures for mobile swipe navigation
- Question filtering by status in navigator
