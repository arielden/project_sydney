import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../contexts/QuizContext';
import { ArrowRight, Clock, Target, BookOpen } from 'lucide-react';

const QuizStartPage: React.FC = () => {
  const navigate = useNavigate();
  const { startQuiz, loading } = useQuiz();
  
  const [selectedType, setSelectedType] = useState('practice');
  
  const questionTypes = [
    { 
      id: 'practice', 
      name: 'Practice Session', 
      description: '20 mixed practice questions',
      icon: BookOpen,
      features: ['Adaptive difficulty', 'Mixed question types', 'No time pressure']
    },
    { 
      id: 'diagnostic', 
      name: 'Diagnostic Test', 
      description: '44-question comprehensive assessment',
      icon: Target,
      features: ['Complete assessment', 'Skill evaluation', 'Performance analysis']
    },
    { 
      id: 'timed', 
      name: 'Timed Test', 
      description: '20 questions under time pressure',
      icon: Clock,
      features: ['Time pressure', 'Test conditions', 'Performance tracking']
    }
  ];

  const handleStartQuiz = async () => {
    try {
      const config = {
        sessionType: selectedType,
        forceNew: true // Always start fresh
      };
      
      const sessionId = await startQuiz(config);
      navigate(`/quiz/active?sessionId=${sessionId}`);
    } catch (error: any) {
      console.error('Failed to start quiz:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Start New Quiz
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose your quiz type and challenge yourself with adaptive questions
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="max-w-4xl mx-auto">
            {/* Quiz Type Selection */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Choose Quiz Type</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {questionTypes.map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <label
                        key={type.id}
                        className={`block p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          selectedType === type.id
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="questionType"
                          value={type.id}
                          checked={selectedType === type.id}
                          onChange={(e) => setSelectedType(e.target.value)}
                          className="sr-only"
                        />
                        <div className="text-center">
                          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${
                            selectedType === type.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                          }`}>
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2">{type.name}</h3>
                          <p className="text-sm text-gray-600 mb-4">{type.description}</p>
                          <div className="space-y-1">
                            {type.features.map((feature, index) => (
                              <div key={index} className="text-xs text-gray-500 flex items-center justify-center">
                                <div className={`w-1 h-1 rounded-full mr-2 ${
                                  selectedType === type.id ? 'bg-blue-400' : 'bg-gray-400'
                                }`}></div>
                                {feature}
                              </div>
                            ))}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Start Button */}
              <div className="pt-6 border-t">
                <div className="flex justify-center">
                  <button
                    onClick={handleStartQuiz}
                    disabled={loading}
                    className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-lg text-lg transition-colors shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                        Starting Quiz...
                      </>
                    ) : (
                      <>
                        Start Quiz
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </button>
                </div>
                <p className="text-center text-sm text-gray-500 mt-3">
                  Your progress will be automatically saved
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizStartPage;