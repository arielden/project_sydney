import { Link } from 'react-router-dom';
import { BookOpen, Users, Award, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-cream pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Learning Dashboard</h1>
          <p className="text-gray-600">Welcome back! Track your SAT math progress and continue learning.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Questions Completed</p>
                <p className="text-2xl font-bold text-blue-primary">247</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-light" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Study Streak</p>
                <p className="text-2xl font-bold text-blue-primary">7 days</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-light" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Skills Mastered</p>
                <p className="text-2xl font-bold text-blue-primary">8/22</p>
              </div>
              <Award className="h-8 w-8 text-blue-light" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">ELO Rating</p>
                <p className="text-2xl font-bold text-blue-primary">1342</p>
              </div>
              <Users className="h-8 w-8 text-blue-light" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Continue Practice</h2>
            <p className="text-gray-600 mb-6">Resume your adaptive learning session</p>
            <Link 
              to="/quiz" 
              className="inline-flex items-center px-6 py-3 bg-blue-primary text-white rounded-lg hover:bg-blue-dark transition-colors font-medium"
            >
              Start Practice
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Diagnostic Assessment</h2>
            <p className="text-gray-600 mb-6">Take a 44-question diagnostic to update your skill ratings</p>
            <button className="inline-flex items-center px-6 py-3 border-2 border-blue-primary text-blue-primary rounded-lg hover:bg-blue-primary hover:text-white transition-colors font-medium">
              Take Diagnostic
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}