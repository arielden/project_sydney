import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuiz } from '../contexts/QuizContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  RotateCcw, 
  Home, 
  Share2,
  Award,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface QuizResults {
  session: {
    id: string;
    type: string;
    status: string;
    startTime: string;
    endTime: string;
    totalTime: number;
    activeTime: number;
    pauseTime: number;
    username: string;
  };
  score: {
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    score: number;
    totalTimeSpent: number;
    averageTimePerQuestion: number;
  };
  attempts: Array<{
    questionId: string;
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    timeSpent: number;
    explanation?: string;
    options: any;
  }>;
}

const QuizResultsPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getQuizResults, loading } = useQuiz();
  const [results, setResults] = useState<QuizResults | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown'>('overview');

  useEffect(() => {
    const loadResults = async () => {
      if (!sessionId) {
        navigate('/quiz/start');
        return;
      }

      try {
        const resultsData = await getQuizResults(sessionId);
        setResults(resultsData);
      } catch (error) {
        console.error('Failed to load quiz results:', error);
        navigate('/quiz/start');
      }
    };

    loadResults();
  }, [sessionId, getQuizResults, navigate]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getPerformanceLevel = (percentage: number): { label: string; color: string; icon: React.ReactNode } => {
    if (percentage >= 90) return { 
      label: 'Excellent', 
      color: 'text-green-600 bg-green-50 border-green-200', 
      icon: <Trophy className="w-5 h-5" /> 
    };
    if (percentage >= 80) return { 
      label: 'Very Good', 
      color: 'text-blue-600 bg-blue-50 border-blue-200', 
      icon: <Award className="w-5 h-5" /> 
    };
    if (percentage >= 70) return { 
      label: 'Good', 
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200', 
      icon: <Target className="w-5 h-5" /> 
    };
    if (percentage >= 60) return { 
      label: 'Fair', 
      color: 'text-orange-600 bg-orange-50 border-orange-200', 
      icon: <AlertCircle className="w-5 h-5" /> 
    };
    return { 
      label: 'Needs Improvement', 
      color: 'text-red-600 bg-red-50 border-red-200', 
      icon: <TrendingDown className="w-5 h-5" /> 
    };
  };

  // Calculate percentage safely
  const percentage = results ? Math.round(((results.score?.correctAnswers || 0) / (results.score?.totalQuestions || 1)) * 100) : 0;

  const handleRetakeQuiz = () => {
    navigate('/quiz/start');
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  const handleShareResults = async () => {
    if (navigator.share && results) {
      try {
        await navigator.share({
          title: 'My Quiz Results',
          text: `I just completed a ${results.session?.type || 'practice'} quiz and scored ${percentage}%!`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Results link copied to clipboard!');
    }
  };

  if (loading || !results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  const performance = getPerformanceLevel(percentage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className={`inline-flex items-center px-4 py-2 rounded-full border-2 ${performance.color} font-semibold`}>
              {performance.icon}
              <span className="ml-2">{performance.label}</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Quiz Complete!
          </h1>
          <p className="text-xl text-gray-600">
            Great job, {user?.first_name || user?.username || 'Student'}! Here are your results.
          </p>
        </div>

        {/* Score Overview */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="border-r border-gray-200 last:border-r-0">
              <div className="text-3xl font-bold text-blue-600 mb-2">{percentage}%</div>
              <div className="text-gray-600">Final Score</div>
            </div>
            <div className="border-r border-gray-200 last:border-r-0">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {results.score?.correctAnswers || 0}/{results.score?.totalQuestions || 0}
              </div>
              <div className="text-gray-600">Correct Answers</div>
            </div>
            <div className="border-r border-gray-200 last:border-r-0">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {formatTime(results.session?.activeTime || 0)}
              </div>
              <div className="text-gray-600">Time Taken</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2 text-blue-600">
                {percentage}%
              </div>
              <div className="text-gray-600">Score</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('breakdown')}
                className={`flex-1 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'breakdown'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Question Breakdown
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiz Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Session Type:</span>
                        <span className="font-medium capitalize">{results.session?.type?.replace('_', ' ') || 'Practice'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium capitalize">{results.session?.status || 'Completed'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Questions:</span>
                        <span className="font-medium">{results.score?.totalQuestions || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Average Time per Question:</span>
                        <span className="font-medium">
                          {formatTime(results.score?.averageTimePerQuestion || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Progress</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Previous Rating:</span>
                        <span className="font-medium">{results.previousRating}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">New Rating:</span>
                        <span className="font-medium">{results.newRating}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Change:</span>
                        <div className="flex items-center">
                          {results.ratingChange >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                          )}
                          <span className={`font-medium ${results.ratingChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {results.ratingChange >= 0 ? '+' : ''}{results.ratingChange} points
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">
                    <TrendingUp className="w-5 h-5 inline mr-2" />
                    Recommendations
                  </h3>
                  <div className="text-blue-800 space-y-2">
                    {percentage >= 90 && (
                      <p>Excellent work! You're ready for more challenging questions. Consider increasing the difficulty level.</p>
                    )}
                    {percentage >= 70 && percentage < 90 && (
                      <p>Good performance! Review the questions you missed and practice similar problems to improve further.</p>
                    )}
                    {percentage >= 50 && percentage < 70 && (
                      <p>You're making progress! Focus on the areas where you struggled and consider reviewing fundamental concepts.</p>
                    )}
                    {percentage < 50 && (
                      <p>Keep practicing! Consider starting with easier difficulty levels and building your foundation gradually.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'breakdown' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Question-by-Question Analysis</h3>
                <div className="space-y-4">
                  {results.attempts?.map((question, index) => (
                    <div
                      key={question.questionId}
                      className={`border rounded-lg p-6 ${
                        question.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          {question.isCorrect ? (
                            <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-600 mr-3" />
                          )}
                          <div>
                            <div className="font-semibold text-gray-900">
                              Question {index + 1}
                            </div>
                            <div className="text-sm text-gray-600">
                              Time: {formatTime(question.timeSpent || 0)}
                            </div>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          question.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {question.isCorrect ? 'Correct' : 'Incorrect'}
                        </div>
                      </div>
                      
                      <div className="text-gray-800 mb-4 leading-relaxed">
                        {question.questionText.length > 200 
                          ? `${question.questionText.substring(0, 200)}...`
                          : question.questionText
                        }
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Your Answer: </span>
                          <span className={question.isCorrect ? 'text-green-700' : 'text-red-700'}>
                            {question.userAnswer}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Correct Answer: </span>
                          <span className="text-green-700">{question.correctAnswer}</span>
                        </div>
                      </div>
                      
                      {question.explanation && (
                        <div className="mt-4 p-4 bg-white rounded border">
                          <div className="font-medium text-gray-700 mb-2">Explanation:</div>
                          <div className="text-gray-600 text-sm">{question.explanation}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
          <button
            onClick={handleRetakeQuiz}
            className="flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Take Another Quiz
          </button>
          
          <button
            onClick={handleShareResults}
            className="flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
          >
            <Share2 className="w-5 h-5 mr-2" />
            Share Results
          </button>
          
          <button
            onClick={handleGoHome}
            className="flex items-center justify-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizResultsPage;