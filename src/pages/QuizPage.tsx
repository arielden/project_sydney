import { Calculator, BookOpen, MoreHorizontal, Bookmark } from 'lucide-react';

interface QuizPageProps {
  timer: string;
  sectionTitle: string;
  questionNumber: number;
  totalQuestions: number;
  questionText: string;
  questionType: string;
  options: Array<{ id: string; text: string }>;
  studentName: string;
  isMarkedForReview?: boolean;
}

export default function QuizPage({
  timer = "34:33",
  sectionTitle = "Section 2, Module 1: Math",
  questionNumber = 5,
  totalQuestions = 22,
  questionText = "The solution to the given system of equations is (x, y). What is the value of x + y?",
  questionType = "THIS IS A PRACTICE TEST",
  options = [
    { id: "A", text: "-27" },
    { id: "B", text: "-13" },
    { id: "C", text: "13" },
    { id: "D", text: "27" }
  ],
  studentName = "John Yatsko",
  isMarkedForReview = false
}: QuizPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-800 text-white px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Left: Section Title */}
          <div className="flex-1">
            <h1 className="text-lg font-medium">{sectionTitle}</h1>
          </div>
          
          {/* Center: Timer */}
          <div className="flex-1 text-center">
            <div className="text-xl font-mono font-bold">
              {timer}
            </div>
          </div>
          
          {/* Right: Action Icons */}
          <div className="flex-1 flex justify-end space-x-4">
            <button className="p-2 hover:bg-slate-700 rounded transition-colors">
              <Calculator className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-slate-700 rounded transition-colors">
              <BookOpen className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-slate-700 rounded transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Practice Test Banner */}
        <div className="bg-slate-700 text-center py-2 mt-2 rounded">
          <span className="text-sm font-medium">{questionType}</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pt-32 pb-20 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4">
          {/* Question Header */}
          <div className="flex items-center justify-between mb-6">
            {/* Question Number Badge */}
            <div className="bg-slate-800 text-white w-10 h-10 rounded flex items-center justify-center font-bold text-lg">
              {questionNumber}
            </div>
            
            {/* Mark for Review */}
            <button 
              className={`flex items-center space-x-2 px-3 py-2 rounded transition-colors ${
                isMarkedForReview 
                  ? 'bg-orange-100 text-orange-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isMarkedForReview ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">Mark for Review</span>
            </button>
          </div>

          {/* Question Content */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            {/* Mathematical Equations */}
            <div className="text-center mb-6">
              <div className="text-lg mb-2">4x = 20</div>
              <div className="text-lg mb-4">−3x + y = −7</div>
            </div>
            
            {/* Question Text */}
            <p className="text-gray-800 text-lg mb-8 leading-relaxed">
              {questionText}
            </p>
            
            {/* Answer Options */}
            <div className="space-y-4">
              {options.map((option) => (
                <label 
                  key={option.id}
                  className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-4 w-full">
                    {/* Option Letter Circle */}
                    <div className="w-8 h-8 border-2 border-gray-400 rounded-full flex items-center justify-center font-bold text-gray-600">
                      {option.id}
                    </div>
                    
                    {/* Radio Button */}
                    <input 
                      type="radio" 
                      name="answer" 
                      value={option.id}
                      className="w-5 h-5 text-blue-600"
                    />
                    
                    {/* Option Text */}
                    <span className="text-lg text-gray-800 flex-1">
                      {option.text}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Left: Student Name */}
          <div className="flex-1">
            <span className="text-gray-700 font-medium">{studentName}</span>
          </div>
          
          {/* Center: Question Counter */}
          <div className="flex-1 text-center">
            <span className="bg-slate-800 text-white px-4 py-2 rounded text-sm font-medium">
              Question {questionNumber} of {totalQuestions}
            </span>
          </div>
          
          {/* Right: Navigation Buttons */}
          <div className="flex-1 flex justify-end space-x-3">
            <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium">
              Back
            </button>
            <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium">
              Next
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}