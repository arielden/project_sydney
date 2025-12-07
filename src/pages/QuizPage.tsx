import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuiz } from '../contexts/QuizContext';
import { useAuth } from '../contexts/AuthContext';
import { useTimer } from '../hooks/useTimer';
import { Calculator, BookOpen, MoreHorizontal, Bookmark, Pause, Play, Clock, X, ChevronDown, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Flag } from 'lucide-react';
import { QuestionNavigator } from '../components/quiz';

// Memoized Header Component - prevents unnecessary re-renders
const QuizHeader = memo(({ 
  sessionType, 
  timeRemaining, 
  formatTime, 
  isPaused, 
  onPauseResume, 
  onExit, 
  onComplete
}: {
  sessionType: string;
  timeRemaining: number;
  formatTime: (time: number) => string;
  isPaused: boolean;
  onPauseResume: () => void;
  onExit: () => void;
  onComplete: () => void;
}) => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-blue-primary text-white px-4 py-3 shadow-lg">
    <div className="flex items-center justify-between max-w-7xl mx-auto">
      {/* Left: Section Title */}
      <div className="flex-1">
        <h1 className="text-lg font-medium">
          {sessionType === 'practice' ? 'Practice Session' : 
           sessionType === 'diagnostic' ? 'Diagnostic Test' :
           sessionType === 'timed' ? 'Timed Test' :
           'Quiz Session'}
        </h1>
      </div>
      
      {/* Center: Timer */}
      <div className="flex-1 text-center">
        <div className="text-xl font-mono font-bold flex items-center justify-center text-white">
          <Clock className="w-5 h-5 mr-2" />
          {formatTime(timeRemaining)}
        </div>
      </div>
      
      {/* Right: Action Icons */}
      <div className="flex-1 flex justify-end space-x-4">
        <button 
          onClick={onPauseResume}
          className="p-2 hover:bg-blue-dark rounded transition-colors"
          title={isPaused ? 'Resume Quiz' : 'Pause Quiz'}
        >
          {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
        </button>
        <button className="p-2 hover:bg-blue-dark rounded transition-colors">
          <Calculator className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-blue-dark rounded transition-colors">
          <BookOpen className="w-5 h-5" />
        </button>
        <button 
          onClick={onExit}
          className="p-2 hover:bg-red-600 rounded transition-colors text-red-300 hover:text-white"
          title="Exit Quiz"
        >
          <X className="w-5 h-5" />
        </button>
        <button 
          onClick={onComplete}
          className="p-2 hover:bg-blue-dark rounded transition-colors"
          title="End Quiz"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
    </div>
    
    {/* Practice Test Banner */}
    <div className="bg-blue-dark text-center py-2 mt-2 rounded">
      <span className="text-sm font-medium">
        {isPaused ? 'QUIZ PAUSED' : 'ACTIVE QUIZ SESSION'}
      </span>
    </div>
  </header>
));

// Memoized Question Content - only re-renders when question changes
const QuestionContent = memo(({ 
  questionNumber,
  currentQuestion,
  selectedAnswer,
  markedForReview,
  onAnswerSelect,
  onToggleReview
}: {
  questionNumber: number;
  currentQuestion: any;
  selectedAnswer: string;
  markedForReview: boolean;
  onAnswerSelect: (answer: string) => void;
  onToggleReview: () => void;
}) => (
  <div className="max-w-4xl mx-auto px-4">
    {/* Question Header */}
    <div className="flex items-center justify-between mb-6">
      {/* Question Number Badge */}
      <div className="bg-blue-primary text-white w-10 h-10 rounded flex items-center justify-center font-bold text-lg">
        {questionNumber}
      </div>
      
      {/* Mark for Review */}
      <button 
        onClick={onToggleReview}
        className={`flex items-center space-x-2 px-3 py-2 rounded transition-colors ${
          markedForReview 
            ? 'bg-orange-100 text-orange-700' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <Bookmark className={`w-4 h-4 ${markedForReview ? 'fill-current' : ''}`} />
        <span className="text-sm font-medium">Mark for Review</span>
      </button>
    </div>

    {/* Question Content */}
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      {/* Question Text */}
      <div className="mb-8">
        <div className="text-gray-600 text-sm mb-4">
          Difficulty: {currentQuestion?.difficulty_rating} | Type: {currentQuestion?.question_type}
        </div>
        <div className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
          {currentQuestion?.question_text}
        </div>
      </div>
      
      {/* Answer Options */}
      <div className="space-y-4">
        {currentQuestion?.options?.map((option: any, index: number) => {
          const optionId = String.fromCharCode(65 + index); // A, B, C, D
          return (
              <label 
              key={optionId}
              className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors relative ${
                selectedAnswer === optionId
                  ? 'border-blue-primary bg-blue-light/20 z-10'
                  : 'border-gray-200 hover:border-blue-primary hover:bg-blue-light/10'
              }`}
            >
              <div className="flex items-center space-x-4 w-full">
                {/* Option Letter Circle */}
                <div className={`w-8 h-8 border-2 rounded-full flex items-center justify-center font-bold ${
                  selectedAnswer === optionId
                    ? 'border-blue-primary text-blue-primary'
                    : 'border-gray-400 text-gray-600'
                }`}>
                  {optionId}
                </div>
                
                {/* Radio Button */}
                <input 
                  type="radio" 
                  name="answer" 
                  value={optionId}
                  checked={selectedAnswer === optionId}
                  onChange={(e) => onAnswerSelect(e.target.value)}
                  className="w-5 h-5 text-blue-primary focus:ring-2 focus:ring-blue-primary focus:ring-offset-2 relative z-10"
                  style={{ scrollMarginTop: '8rem' }}
                />
                
                {/* Option Text */}
                <span className="text-lg text-gray-800 flex-1">
                  {option.text}
                </span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  </div>
));

// Memoized Footer Component - prevents unnecessary re-renders
const QuizFooter = memo(({
  user,
  questionNumber,
  totalQuestions,
  loading,
  onPreviousQuestion,
  onNextQuestion,
  onOpenNavigator
}: {
  user: any;
  questionNumber: number;
  totalQuestions: number;
  loading: boolean;
  onPreviousQuestion: () => void;
  onNextQuestion: () => void;
  onOpenNavigator: () => void;
}) => (
  <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-3">
    <div className="flex items-center justify-between max-w-7xl mx-auto">
      {/* Left: Student Name */}
      <div className="flex-1">
        <span className="text-gray-700 font-medium">
          {user?.first_name && user?.last_name 
            ? `${user.first_name} ${user.last_name}` 
            : user?.first_name || user?.username || 'Student'
          }
        </span>
      </div>
      
      {/* Center: Question Counter - Clickable to open navigator */}
      <div className="flex-1 text-center">
        <button
          onClick={onOpenNavigator}
          className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors group"
          title="Open Question Navigator"
        >
          <span className="text-sm font-medium text-gray-700">
            Question {questionNumber} of {totalQuestions}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors" />
        </button>
      </div>
      
      {/* Right: Navigation Buttons */}
      <div className="flex-1 flex justify-end space-x-3">
        <button 
          onClick={onPreviousQuestion}
          disabled={questionNumber === 1}
          title="Go to previous question (←)"
          className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button 
          onClick={onNextQuestion}
          disabled={loading}
          title="Go to next question (→)"
          className="flex items-center gap-1 px-4 py-2 bg-blue-primary text-white rounded-lg hover:bg-blue-dark disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Saving...' : (questionNumber === totalQuestions ? 'Finish' : 'Next')}
          {!loading && questionNumber !== totalQuestions && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  </footer>
));

export default function QuizPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { 
    currentSession, 
    currentQuestion,
    questions,
    currentQuestionIndex,
    questionNumber,
    totalQuestions,
    loading, 
    error,
    loadAllQuestions,
    goToQuestion,
    nextQuestion, 
    submitAnswer,
    pauseQuiz,
    resumeQuiz,
    completeQuiz,
    exitQuiz,
    setTimeElapsed
  } = useQuiz();
  
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [markedForReview, setMarkedForReview] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isNavigatorOpen, setIsNavigatorOpen] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [reviewQuestions, setReviewQuestions] = useState<Set<number>>(new Set());
  const [questionAnswers, setQuestionAnswers] = useState<Map<number, string>>(new Map());
  const [submittedQuestions, setSubmittedQuestions] = useState<Set<number>>(new Set()); // Track which questions have been submitted to backend
  const [showUnansweredWarning, setShowUnansweredWarning] = useState(false);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  
  // Per-question time tracking
  const [questionTimes, setQuestionTimes] = useState<Map<number, number>>(new Map());
  const questionStartTimeRef = useRef<number>(Date.now());
  const currentQuestionIndexRef = useRef<number>(0);
  const sessionId = searchParams.get('sessionId');

  // Main countdown timer for entire exam (35 minutes = 2100 seconds)
  // This timer runs continuously regardless of question navigation
  const { time: timeRemaining, formatTime, isPaused, pause, resume, start, isRunning } = useTimer({
    initialTime: 2100, // 35 minutes countdown
    onTick: () => {
      // Timer automatically counts down - no action needed
    },
    onTimeUp: () => {
      // Auto-submit quiz when time is up
      saveCurrentQuestionTime();
      completeQuiz();
    }
  });

  // Function to save time spent on current question
  const saveCurrentQuestionTime = useCallback(() => {
    if (questionStartTimeRef.current && !isPaused) {
      const timeSpentNow = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);
      const questionIndex = currentQuestionIndexRef.current;
      
      setQuestionTimes(prev => {
        const updated = new Map(prev);
        const existingTime = updated.get(questionIndex) || 0;
        updated.set(questionIndex, existingTime + timeSpentNow);
        return updated;
      });
    }
  }, [isPaused]);

  // Track when question changes to save time and restart timer
  useEffect(() => {
    if (currentQuestion && questionNumber > 0) {
      const newQuestionIndex = questionNumber - 1;
      
      // If we're switching questions, save time for the previous question
      if (currentQuestionIndexRef.current !== newQuestionIndex && questionStartTimeRef.current) {
        const timeSpentOnPrevious = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);
        const prevIndex = currentQuestionIndexRef.current;
        
        setQuestionTimes(prev => {
          const updated = new Map(prev);
          const existingTime = updated.get(prevIndex) || 0;
          updated.set(prevIndex, existingTime + timeSpentOnPrevious);
          return updated;
        });
      }
      
      // Update current question index and restart timer
      currentQuestionIndexRef.current = newQuestionIndex;
      questionStartTimeRef.current = Date.now();
    }
  }, [questionNumber, currentQuestion]);

  useEffect(() => {
    if (!sessionId || !currentSession) {
      navigate('/quiz/start');
      return;
    }

    if (currentSession.status === 'completed') {
      navigate(`/quiz/results/${sessionId}`);
      return;
    }

    // Load all questions for the session if not already loaded
    if (currentSession && questions.length === 0) {
      loadAllQuestions(sessionId).catch(err => {
        console.error('Failed to load all questions:', err);
      });
    }

    // Start the countdown timer when quiz is active
    if (currentSession && !isRunning && !isPaused) {
      start();
      questionStartTimeRef.current = Date.now();
    }
    
    // Set initial loading to false once we have a session and questions
    if (currentSession && questions.length > 0 && isInitialLoading) {
      setIsInitialLoading(false);
    }
  }, [sessionId, currentSession, navigate, isRunning, isPaused, start, questions, isInitialLoading, loadAllQuestions]);

  const handleAnswerSelect = useCallback((answerId: string) => {
    setSelectedAnswer(answerId);
    // Auto-save answer to local state when selected
    const questionIndex = questionNumber - 1;
    setQuestionAnswers(prev => new Map(prev).set(questionIndex, answerId));
  }, [questionNumber]);

  const handleNextQuestion = useCallback(async () => {
    const questionIndex = questionNumber - 1;
    
    // Save time for current question before navigating
    saveCurrentQuestionTime();
    
    // If an answer is selected, save it locally (don't submit to backend yet)
    if (selectedAnswer) {
      // Track this question as answered locally
      setAnsweredQuestions(prev => new Set(prev).add(questionIndex));
      // Store the answer locally
      setQuestionAnswers(prev => new Map(prev).set(questionIndex, selectedAnswer));
    }
    
    // Check if we're on the last question
    if (questionNumber === totalQuestions) {
      // On last question, require an answer to finish
      if (!selectedAnswer) {
        alert('Please select an answer before finishing the quiz.');
        return;
      }
      // Quiz completed - will submit all answers via handleFinishQuiz
      navigate(`/quiz/results/${sessionId}`);
      return;
    }
    
    // Navigate to next question locally
    const nextIndex = questionIndex + 1;
    if (nextIndex < questions.length) {
      goToQuestion(nextIndex);
      
      // Restore previous answer if exists
      const savedAnswer = questionAnswers.get(nextIndex);
      setSelectedAnswer(savedAnswer || '');
      
      // Restore review flag for next question
      setMarkedForReview(reviewQuestions.has(nextIndex));
      
      // Reset question timer for new question
      questionStartTimeRef.current = Date.now();
    } else {
      // No more questions locally, try to get from backend (fallback)
      try {
        const hasNext = await nextQuestion();
        if (!hasNext) {
          navigate(`/quiz/results/${sessionId}`);
        } else {
          const nextQuestionIndex = questionNumber;
          const savedAnswer = questionAnswers.get(nextQuestionIndex);
          setSelectedAnswer(savedAnswer || '');
          setMarkedForReview(reviewQuestions.has(nextQuestionIndex));
          questionStartTimeRef.current = Date.now();
        }
      } catch (error) {
        console.error('Error getting next question:', error);
      }
    }
  }, [selectedAnswer, questionNumber, totalQuestions, saveCurrentQuestionTime, questions, goToQuestion, questionAnswers, reviewQuestions, nextQuestion, navigate, sessionId]);

  const handlePreviousQuestion = useCallback(() => {
    // Save time for current question before navigating
    saveCurrentQuestionTime();
    
    // Save current answer if one is selected (but don't submit to backend yet)
    if (selectedAnswer) {
      const questionIndex = questionNumber - 1;
      setQuestionAnswers(prev => new Map(prev).set(questionIndex, selectedAnswer));
      setAnsweredQuestions(prev => new Set(prev).add(questionIndex));
    }
    
    // Navigate to previous question locally
    const prevIndex = currentQuestionIndex - 1;
    if (prevIndex >= 0) {
      goToQuestion(prevIndex);
      
      // Restore previous answer if exists
      const savedAnswer = questionAnswers.get(prevIndex);
      setSelectedAnswer(savedAnswer || '');
      
      // Restore review flag for previous question
      setMarkedForReview(reviewQuestions.has(prevIndex));
      
      // Reset question timer for new question
      questionStartTimeRef.current = Date.now();
    }
  }, [selectedAnswer, questionNumber, currentQuestionIndex, saveCurrentQuestionTime, goToQuestion, questionAnswers, reviewQuestions]);

  const handlePauseResume = useCallback(async () => {
    try {
      if (isPaused) {
        await resumeQuiz();
        resume();
        // Restart question timer after resume
        questionStartTimeRef.current = Date.now();
      } else {
        // Save question time before pausing
        saveCurrentQuestionTime();
        await pauseQuiz();
        pause();
      }
    } catch (error) {
      // Error is handled by QuizContext
    }
  }, [isPaused, resumeQuiz, resume, saveCurrentQuestionTime, pauseQuiz, pause]);

  // Validation functions for quiz submission
  const getUnansweredQuestions = useCallback((): number[] => {
    const unanswered: number[] = [];
    for (let i = 0; i < (questions.length || totalQuestions); i++) {
      if (!answeredQuestions.has(i)) {
        unanswered.push(i + 1); // Convert to 1-indexed for display
      }
    }
    return unanswered;
  }, [answeredQuestions, questions.length, totalQuestions]);

  const hasUnansweredQuestions = useCallback((): boolean => {
    return answeredQuestions.size < (questions.length || totalQuestions);
  }, [answeredQuestions.size, questions.length, totalQuestions]);

  const handleFinishQuiz = useCallback(() => {
    // Check for unanswered questions
    if (hasUnansweredQuestions()) {
      setShowUnansweredWarning(true);
      return;
    }
    
    // All questions answered - show confirmation modal
    setShowSubmitConfirmation(true);
  }, [hasUnansweredQuestions]);

  const handleSubmitQuiz = useCallback(async () => {
    try {
      // Save current question time before completing
      saveCurrentQuestionTime();
      
      // Submit all answers to the backend
      for (const [index, answer] of questionAnswers.entries()) {
        try {
          const question = questions[index];
          if (question && !submittedQuestions.has(index)) {
            const timeSpent = questionTimes.get(index) || 0;
            const isMarkedForReview = reviewQuestions.has(index);
            await submitAnswer(answer, isMarkedForReview);
            setSubmittedQuestions(prev => new Set(prev).add(index));
          }
        } catch (error) {
          console.error(`Error submitting answer for question ${index + 1}:`, error);
          // Continue submitting other answers even if one fails
        }
      }
      
      // Complete the quiz session
      await completeQuiz();
      navigate(`/quiz/results/${sessionId}`);
    } catch (error) {
      // Error is handled by QuizContext
      console.error('Error submitting quiz:', error);
    }
  }, [saveCurrentQuestionTime, questionAnswers, questions, submittedQuestions, questionTimes, reviewQuestions, submitAnswer, completeQuiz, navigate, sessionId]);

  const handleCompleteQuiz = useCallback(async () => {
    handleFinishQuiz();
  }, [handleFinishQuiz]);

  const handleExitQuiz = useCallback(async () => {
    if (window.confirm('Are you sure you want to exit? Your progress will be lost.')) {
      try {
        // Save current question time before exiting
        saveCurrentQuestionTime();
        await exitQuiz();
        navigate('/dashboard');
      } catch (error) {
        // Error is handled by QuizContext
        // Navigate anyway since user wants to exit
        navigate('/dashboard');
      }
    }
  }, [saveCurrentQuestionTime, exitQuiz, navigate]);

  const handleToggleReview = useCallback(() => {
    const newMarkedForReview = !markedForReview;
    setMarkedForReview(newMarkedForReview);
    
    // Update the review questions set (questionNumber is 1-indexed, we use 0-indexed)
    const questionIndex = questionNumber - 1;
    setReviewQuestions(prev => {
      const newSet = new Set(prev);
      if (newMarkedForReview) {
        newSet.add(questionIndex);
      } else {
        newSet.delete(questionIndex);
      }
      return newSet;
    });
  }, [markedForReview, questionNumber]);

  // Navigator handlers
  const handleOpenNavigator = useCallback(() => {
    setIsNavigatorOpen(true);
  }, []);

  const handleCloseNavigator = useCallback(() => {
    setIsNavigatorOpen(false);
  }, []);

  const handleNavigateToQuestion = useCallback((index: number) => {
    // Save time for current question before navigating
    saveCurrentQuestionTime();
    
    // Save current answer if one is selected
    if (selectedAnswer) {
      const currentIndex = questionNumber - 1;
      setQuestionAnswers(prev => new Map(prev).set(currentIndex, selectedAnswer));
      setAnsweredQuestions(prev => new Set(prev).add(currentIndex));
    }
    
    // Navigate to the selected question
    if (index >= 0 && index < questions.length) {
      goToQuestion(index);
      
      // Restore previous answer if exists
      const savedAnswer = questionAnswers.get(index);
      setSelectedAnswer(savedAnswer || '');
      
      // Restore review flag
      setMarkedForReview(reviewQuestions.has(index));
      
      // Reset question timer
      questionStartTimeRef.current = Date.now();
      
      // Close the navigator modal
      setIsNavigatorOpen(false);
    }
  }, [selectedAnswer, questionNumber, saveCurrentQuestionTime, questions.length, goToQuestion, questionAnswers, reviewQuestions]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or if quiz is paused
      if (
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement ||
        isPaused ||
        isNavigatorOpen
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          handlePreviousQuestion();
          break;
        case 'ArrowRight':
          handleNextQuestion();
          break;
        case 'r':
        case 'R':
          if (!e.ctrlKey && !e.metaKey) {
            handleToggleReview();
          }
          break;
        case 'g':
        case 'G':
          if (!e.ctrlKey && !e.metaKey) {
            setIsNavigatorOpen(true);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPaused, isNavigatorOpen, handlePreviousQuestion, handleNextQuestion, handleToggleReview]);

  if (isInitialLoading || (loading && questions.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/quiz/start')} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Start New Quiz
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion || !currentSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No question available</p>
          <button 
            onClick={() => navigate('/quiz/start')} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mt-4"
          >
            Start New Quiz
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Custom styles for proper scroll behavior with fixed header */}
      <style>{`
        .quiz-main * {
          scroll-margin-top: 8rem;
        }
        .quiz-main *:focus {
          z-index: 20;
          position: relative;
        }
      `}</style>
      
      {/* Memoized Header - prevents flickering */}
      <QuizHeader 
        sessionType={currentSession.session_type}
        timeRemaining={timeRemaining}
        formatTime={formatTime}
        isPaused={isPaused}
        onPauseResume={handlePauseResume}
        onExit={handleExitQuiz}
        onComplete={handleCompleteQuiz}
      />

      {/* Question Navigator Modal */}
      <QuestionNavigator
        isOpen={isNavigatorOpen}
        onClose={handleCloseNavigator}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={questions.length || totalQuestions}
        answeredQuestions={answeredQuestions}
        reviewQuestions={reviewQuestions}
        onQuestionSelect={handleNavigateToQuestion}
      />

      {/* Pause Overlay */}
      {isPaused && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 text-center max-w-md mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Quiz Paused</h2>
            <p className="text-gray-600 mb-6">Your quiz is currently paused. Click resume to continue.</p>
            <button
              onClick={handlePauseResume}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Play className="w-5 h-5 inline mr-2" />
              Resume Quiz
            </button>
          </div>
        </div>
      )}

      {/* Unanswered Questions Warning Modal */}
      {showUnansweredWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertCircle className="text-orange-600" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  Unanswered Questions
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  You have {getUnansweredQuestions().length} unanswered {getUnansweredQuestions().length === 1 ? 'question' : 'questions'}.
                </p>
              </div>
            </div>

            {/* Unanswered Question List */}
            <div className="mb-6">
              <p className="text-sm text-gray-700 mb-2">
                Please answer the following questions before submitting:
              </p>
              <div className="max-h-32 overflow-y-auto bg-gray-50 rounded p-3">
                <div className="flex flex-wrap gap-2">
                  {getUnansweredQuestions().map((qNum) => (
                    <span
                      key={qNum}
                      className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700"
                    >
                      #{qNum}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const unanswered = getUnansweredQuestions();
                  if (unanswered.length > 0) {
                    goToQuestion(unanswered[0] - 1);
                    setShowUnansweredWarning(false);
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Go to First Unanswered
              </button>
              <button
                onClick={() => setShowUnansweredWarning(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle className="text-blue-600" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  Submit Quiz?
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  You are about to submit your quiz for grading.
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Questions:</span>
                  <span className="font-medium text-gray-900">{questions.length || totalQuestions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Answered:</span>
                  <span className="font-medium text-green-600">{answeredQuestions.size}</span>
                </div>
                {reviewQuestions.size > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Marked for Review:</span>
                    <span className="font-medium text-orange-600">{reviewQuestions.size}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Warning Message */}
            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Once submitted, you cannot change your answers. 
                Your responses will be sent to the system for evaluation.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitConfirmation(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
              >
                Review Answers
              </button>
              <button
                onClick={() => {
                  setShowSubmitConfirmation(false);
                  handleSubmitQuiz();
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Submit Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area - Memoized to prevent flickering */}
      <main className="flex-1 pt-32 pb-20 overflow-y-auto relative quiz-main">
        <QuestionContent 
          questionNumber={questionNumber}
          currentQuestion={currentQuestion}
          selectedAnswer={selectedAnswer}
          markedForReview={markedForReview}
          onAnswerSelect={handleAnswerSelect}
          onToggleReview={handleToggleReview}
        />
      </main>

      {/* Memoized Footer - prevents flickering */}
      <QuizFooter 
        user={user}
        questionNumber={questionNumber}
        totalQuestions={questions.length || totalQuestions}
        loading={loading}
        onPreviousQuestion={handlePreviousQuestion}
        onNextQuestion={handleNextQuestion}
        onOpenNavigator={handleOpenNavigator}
      />
    </div>
  );
}