import { useEffect, useCallback, memo } from 'react';
import { MapPin, Flag, X } from 'lucide-react';

// Question status type - now includes combined state
export type QuestionStatus = 'unanswered' | 'answered' | 'review' | 'answered-review' | 'current';

export interface QuestionNavigatorProps {
  isOpen: boolean;
  onClose: () => void;
  currentQuestionIndex: number;
  totalQuestions: number;
  answeredQuestions: Set<number>;
  reviewQuestions: Set<number>;
  onQuestionSelect: (index: number) => void;
}

// Individual question square component with flag overlay
const QuestionSquare = memo(({
  questionNumber,
  isAnswered,
  isMarkedForReview,
  isCurrent,
  onClick
}: {
  questionNumber: number;
  isAnswered: boolean;
  isMarkedForReview: boolean;
  isCurrent: boolean;
  onClick: () => void;
}) => {
  // Visual Priority Rules:
  // 1. Current question = Blue with ring + pin icon
  // 2. Answered (with or without review) = Blue background
  // 3. Review only (not answered) = Orange background
  // 4. Unanswered = Gray background
  
  const getBackgroundStyles = (): string => {
    if (isCurrent) {
      return 'bg-blue-primary text-white border-blue-dark ring-2 ring-blue-light ring-offset-1';
    }
    if (isAnswered) {
      // Blue for answered, regardless of review status
      return 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700';
    }
    if (isMarkedForReview) {
      // Orange only if NOT answered
      return 'bg-orange-500 text-white border-orange-600 hover:bg-orange-600';
    }
    // Default: unanswered
    return 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200';
  };

  // Build aria label with all states
  const getAriaLabel = (): string => {
    const states: string[] = [];
    if (isCurrent) states.push('Current');
    if (isAnswered) states.push('Answered');
    if (isMarkedForReview) states.push('Marked for review');
    if (!isAnswered && !isMarkedForReview && !isCurrent) states.push('Unanswered');
    return `Question ${questionNumber} - ${states.join(', ')}`;
  };

  return (
    <button
      onClick={onClick}
      className={`
        relative w-12 h-12 rounded-lg border-2 font-semibold text-sm
        transition-all duration-200 ease-in-out
        flex items-center justify-center
        hover:scale-105 active:scale-95
        focus:outline-none focus:ring-2 focus:ring-blue-primary focus:ring-offset-2
        ${getBackgroundStyles()}
      `}
      aria-label={getAriaLabel()}
      title={getAriaLabel()}
    >
      {/* Question Number */}
      {questionNumber}
      
      {/* Review Flag - ALWAYS show when marked for review (red flag in top-right) */}
      {isMarkedForReview && (
        <Flag 
          className="absolute -top-1 -right-1 w-4 h-4 text-red-600 fill-red-600 drop-shadow"
          strokeWidth={2}
        />
      )}
      
      {/* Current Question Indicator - Pin icon above square */}
      {isCurrent && (
        <MapPin 
          className="absolute -top-5 left-1/2 -translate-x-1/2 w-4 h-4 text-blue-primary fill-blue-primary"
        />
      )}
    </button>
  );
});

QuestionSquare.displayName = 'QuestionSquare';

// Legend item component - now supports custom icon elements
const LegendItem = memo(({
  icon,
  label
}: {
  icon: React.ReactNode;
  label: string;
}) => (
  <div className="flex items-center space-x-2">
    {icon}
    <span className="text-sm text-gray-600">{label}</span>
  </div>
));

LegendItem.displayName = 'LegendItem';

// Main QuestionNavigator component
export const QuestionNavigator = memo(({
  isOpen,
  onClose,
  currentQuestionIndex,
  totalQuestions,
  answeredQuestions,
  reviewQuestions,
  onQuestionSelect
}: QuestionNavigatorProps) => {
  // Handle escape key to close modal
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  // Add/remove escape key listener and body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Check question states
  const isAnswered = useCallback((index: number): boolean => {
    return answeredQuestions.has(index);
  }, [answeredQuestions]);

  const isMarkedForReview = useCallback((index: number): boolean => {
    return reviewQuestions.has(index);
  }, [reviewQuestions]);

  const isCurrent = useCallback((index: number): boolean => {
    return index === currentQuestionIndex;
  }, [currentQuestionIndex]);

  // Handle question selection
  const handleQuestionClick = useCallback((index: number) => {
    onQuestionSelect(index);
    onClose();
  }, [onQuestionSelect, onClose]);

  // Generate array of question numbers
  const questions = Array.from({ length: totalQuestions }, (_, i) => i);

  // Calculate summary stats
  const answeredCount = answeredQuestions.size;
  const reviewCount = reviewQuestions.size;
  const unansweredCount = totalQuestions - answeredCount;

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="navigator-title"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
        aria-hidden="true"
      />
      
      {/* Modal Content */}
      <div 
        className="
          relative bg-white rounded-xl shadow-2xl
          w-full max-w-2xl max-h-[80vh]
          flex flex-col
          animate-slideIn
          overflow-hidden
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <MapPin className="w-5 h-5 text-blue-primary" />
            <h2 id="navigator-title" className="text-lg font-semibold text-gray-900">
              Question Navigator
            </h2>
          </div>
          <button
            onClick={onClose}
            className="
              p-2 rounded-lg text-gray-500 hover:text-gray-700 
              hover:bg-gray-200 transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-primary
            "
            aria-label="Close navigator"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-blue-600" />
              <span className="font-medium text-gray-700">
                Answered: <span className="text-blue-600">{answeredCount}</span>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative w-3 h-3">
                <div className="w-3 h-3 rounded bg-orange-500" />
                <Flag className="absolute -top-0.5 -right-0.5 w-2 h-2 text-red-600 fill-red-600" />
              </div>
              <span className="font-medium text-gray-700">
                For Review: <span className="text-orange-600">{reviewCount}</span>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-gray-300" />
              <span className="font-medium text-gray-700">
                Remaining: <span className="text-gray-600">{unansweredCount}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Question Grid */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="
            grid gap-3
            grid-cols-5 sm:grid-cols-8 md:grid-cols-10
          ">
            {questions.map((index) => (
              <QuestionSquare
                key={index}
                questionNumber={index + 1}
                isAnswered={isAnswered(index)}
                isMarkedForReview={isMarkedForReview(index)}
                isCurrent={isCurrent(index)}
                onClick={() => handleQuestionClick(index)}
              />
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <LegendItem 
              icon={<div className="w-6 h-6 rounded bg-gray-100 border-2 border-gray-300" />}
              label="Unanswered" 
            />
            <LegendItem 
              icon={<div className="w-6 h-6 rounded bg-blue-600" />}
              label="Answered" 
            />
            <LegendItem 
              icon={
                <div className="relative w-6 h-6 rounded bg-orange-500">
                  <Flag className="absolute -top-1 -right-1 w-3 h-3 text-red-600 fill-red-600" />
                </div>
              }
              label="Review (Unanswered)" 
            />
            <LegendItem 
              icon={
                <div className="relative w-6 h-6 rounded bg-blue-600">
                  <Flag className="absolute -top-1 -right-1 w-3 h-3 text-red-600 fill-red-600" />
                </div>
              }
              label="Answered + Review" 
            />
            <LegendItem 
              icon={<MapPin className="w-5 h-5 text-blue-primary fill-blue-primary" />}
              label="Current" 
            />
          </div>
        </div>

        {/* Footer with Close Button */}
        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="
              w-full py-2.5 px-4 rounded-lg
              bg-blue-primary text-white font-medium
              hover:bg-blue-dark transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-primary focus:ring-offset-2
            "
          >
            Close Navigator
          </button>
        </div>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
});

QuestionNavigator.displayName = 'QuestionNavigator';

export default QuestionNavigator;
