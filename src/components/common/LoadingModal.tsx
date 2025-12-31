import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingModalProps {
  isOpen: boolean;
  message: string;
  error?: string | null;
  onRetry?: () => void;
}

const LoadingModal: React.FC<LoadingModalProps> = ({
  isOpen,
  message,
  error,
  onRetry
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-navy-dark bg-opacity-80 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="text-center">
          {/* Loading Animation */}
          {!error && (
            <div className="mb-4">
              <div className="relative inline-block">
                {/* Outer rotating ring */}
                <div className="w-16 h-16 border-4 border-yellow-200 rounded-full animate-spin">
                  <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-yellow-500 rounded-full animate-spin" />
                </div>
                {/* Inner gear icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" style={{ animationDirection: 'reverse' }} />
                </div>
              </div>
            </div>
          )}

          {/* Error Icon */}
          {error && (
            <div className="mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
          )}

          {/* Message */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {error ? 'Submission Failed' : 'Submitting Quiz'}
          </h3>

          <p className="text-gray-600 mb-4">
            {error || message}
          </p>

          {/* Retry Button */}
          {error && onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-md transition-colors duration-200"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingModal;