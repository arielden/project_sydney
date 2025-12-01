import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuiz } from '../contexts/QuizContext';
import { useAuth } from '../contexts/AuthContext';
import { useTimer } from '../hooks/useTimer';
import { Calculator, BookOpen, MoreHorizontal, Bookmark, Pause, Play, Clock, X } from 'lucide-react';

export default function QuizPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { 
    currentSession, 
    currentQuestion, 
    questionNumber,
    totalQuestions,
    loading, 
    error,
    nextQuestion, 
    submitAnswer,
    pauseQuiz,
    resumeQuiz,
    completeQuiz,
    exitQuiz 
  } = useQuiz();
  
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [markedForReview, setMarkedForReview] = useState(false);
  const sessionId = searchParams.get('sessionId');

  // Initialize timer (no time limit for now as backend doesn't have this field)
  const timeLimit = 0; // Will be implemented when backend supports time limits
  const { timeLeft, formatTime, isPaused, pause, resume } = useTimer({
    initialTime: timeLimit,
    onTimeUp: () => {
      handleCompleteQuiz();
    }
  });

  useEffect(() => {
    if (!sessionId || !currentSession) {
      navigate('/quiz/start');
      return;
    }

    if (currentSession.status === 'completed') {
      navigate(`/quiz/results/${sessionId}`);
      return;
    }
  }, [sessionId, currentSession, navigate]);

  const handleAnswerSelect = (answerId: string) => {
    setSelectedAnswer(answerId);
  };

  const handleNextQuestion = async () => {
    if (!selectedAnswer) {
      alert('Please select an answer before proceeding.');
      return;
    }

    try {
      await submitAnswer(selectedAnswer, markedForReview);
      
      const hasNext = await nextQuestion();
      if (!hasNext) {
        // Quiz completed
        navigate(`/quiz/results/${sessionId}`);
      } else {
        // Reset for next question
        setSelectedAnswer('');
        setMarkedForReview(false);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const handlePreviousQuestion = () => {
    // For now, we'll just show an alert since we need to implement navigation history
    alert('Previous question navigation will be implemented in the next version.');
  };

  const handlePauseResume = async () => {
    try {
      if (isPaused) {
        await resumeQuiz();
        resume();
      } else {
        await pauseQuiz();
        pause();
      }
    } catch (error) {
      console.error('Error pausing/resuming quiz:', error);
    }
  };

  const handleCompleteQuiz = async () => {
    try {
      await completeQuiz();
      navigate(`/quiz/results/${sessionId}`);
    } catch (error) {
      console.error('Error completing quiz:', error);
    }
  };

  const handleExitQuiz = async () => {
    if (window.confirm('Are you sure you want to exit? Your progress will be lost.')) {
      try {
        await exitQuiz();
        navigate('/dashboard');
      } catch (error) {
        console.error('Error exiting quiz:', error);
        // Navigate anyway since user wants to exit
        navigate('/dashboard');
      }
    }
  };

  const handleMarkForReview = () => {
    setMarkedForReview(!markedForReview);
  };

  if (loading) {
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
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-blue-primary text-white px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Left: Section Title */}
          <div className="flex-1">
            <h1 className="text-lg font-medium">
              {currentSession.session_type === 'practice' ? 'Practice Session' : 
               currentSession.session_type === 'diagnostic' ? 'Diagnostic Test' :
               currentSession.session_type === 'timed' ? 'Timed Test' :
               'Quiz Session'}
            </h1>
          </div>
          
          {/* Center: Timer */}
          <div className="flex-1 text-center">
            <div className={`text-xl font-mono font-bold flex items-center justify-center ${
              timeLimit > 0 && timeLeft <= 300 ? 'text-red-300' : ''
            }`}>
              <Clock className="w-5 h-5 mr-2" />
              {timeLimit > 0 ? formatTime(timeLeft) : 'No limit'}
            </div>
          </div>
          
          {/* Right: Action Icons */}
          <div className="flex-1 flex justify-end space-x-4">
            <button 
              onClick={handlePauseResume}
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
              onClick={handleExitQuiz}
              className="p-2 hover:bg-red-600 rounded transition-colors text-red-300 hover:text-white"
              title="Exit Quiz"
            >
              <X className="w-5 h-5" />
            </button>
            <button 
              onClick={handleCompleteQuiz}
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

      {/* Main Content Area */}
      <main className="flex-1 pt-32 pb-20 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4">
          {/* Question Header */}
          <div className="flex items-center justify-between mb-6">
            {/* Question Number Badge */}
            <div className="bg-blue-primary text-white w-10 h-10 rounded flex items-center justify-center font-bold text-lg">
              {questionNumber}
            </div>
            
            {/* Mark for Review */}
            <button 
              onClick={handleMarkForReview}
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
                Difficulty: {currentQuestion.difficulty_rating} | Type: {currentQuestion.question_type}
              </div>
              <div className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
                {currentQuestion.question_text}
              </div>
            </div>
            
            {/* Answer Options */}
            <div className="space-y-4">
              {currentQuestion.options.map((option: any, index: number) => {
                const optionId = String.fromCharCode(65 + index); // A, B, C, D
                return (
                  <label 
                    key={optionId}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedAnswer === optionId
                        ? 'border-blue-primary bg-blue-light/20'
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
                        onChange={(e) => handleAnswerSelect(e.target.value)}
                        className="w-5 h-5 text-blue-primary"
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
      </main>

      {/* Fixed Footer */}
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
          
          {/* Center: Question Counter */}
          <div className="flex-1 text-center">
            <span className="bg-blue-primary text-white px-4 py-2 rounded text-sm font-medium">
              Question {questionNumber} of {totalQuestions}
            </span>
          </div>
          
          {/* Right: Navigation Buttons */}
          <div className="flex-1 flex justify-end space-x-3">
            <button 
              onClick={handlePreviousQuestion}
              disabled={questionNumber === 1}
              className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Back
            </button>
            <button 
              onClick={handleNextQuestion}
              disabled={!selectedAnswer || loading}
              className="px-6 py-2 bg-blue-primary text-white rounded hover:bg-blue-dark disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Submitting...' : (questionNumber === totalQuestions ? 'Finish' : 'Next')}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}