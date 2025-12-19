import { Link } from 'react-router-dom';
import { Users, TrendingUp, Target, ArrowRight } from 'lucide-react';
import Card from '../components/common/Card';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Add padding-top to account for fixed header */}
      <div className="pt-16">
        {/* Hero Section */}
        <section className="bg-gray-50 py-20 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Hero Content */}
              <div className="text-center lg:text-left">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
                  Master SAT Math with Adaptive Learning
                </h1>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-lg">
                  Personalized SAT math preparation with intelligent question selection and real-time performance tracking.
                </p>
                <Link
                  to="/register"
                  className="inline-flex items-center px-6 py-3 bg-blue-primary text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>

              {/* Hero Image Placeholder */}
              <div className="flex justify-center lg:justify-end">
                <div className="w-full max-w-lg h-96 bg-white rounded-xl shadow-card flex items-center justify-center">
                  <div className="text-center text-gray-600">
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-lg font-semibold text-gray-900">Learning Dashboard</p>
                    <p className="text-sm text-gray-500 mt-2">Track your progress</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cards Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Why Choose Sopharium?
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Personalized SAT math preparation with adaptive learning technology
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Card 1: Adaptive Learning */}
              <Card
                title="Adaptive Learning"
                description={isAuthenticated ? "Feature coming soon! We're working hard to bring you personalized question selection." : "Personalized question selection based on your performance. Master 66 question types with intelligent difficulty matching."}
                icon={Users}
                backgroundColor="cream"
                iconText={isAuthenticated ? "Coming Soon" : "4000+ Questions"}
                link={isAuthenticated ? undefined : "/quiz"}
                disabled={isAuthenticated}
              />

              {/* Card 2: Track Progress */}
              <Card
                title="Track Your Progress"
                description="Real-time performance analytics with 22 micro-skill ratings. Monitor your improvement across all SAT math categories."
                icon={TrendingUp}
                backgroundColor="purple-light"
                iconText="Performance Dashboard"
                link="/dashboard"
              />

              {/* Card 3: Diagnostic Assessment */}
              <Card
                title="Diagnostic Assessment"
                description={isAuthenticated ? "Feature coming soon! We're developing a comprehensive diagnostic assessment for you." : "Take our comprehensive 44-question diagnostic to identify your strengths and areas for improvement."}
                icon={Target}
                backgroundColor="rose-light"
                iconText={isAuthenticated ? "Coming Soon" : "Start Diagnostic"}
                link={isAuthenticated ? undefined : "/profile"}
                disabled={isAuthenticated}
              />
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="bg-gray-900 py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Boost Your SAT Score?
            </h2>
            <p className="text-lg text-gray-300 mb-8">
              Join thousands of students improving their SAT math scores
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center px-6 py-3 bg-blue-primary text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
              <Link
                to="/quiz"
                className="inline-flex items-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-gray-900 transition-colors"
              >
                Start Practice
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}