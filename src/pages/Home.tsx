import { Link } from 'react-router-dom';
import { Users, TrendingUp, Target, ArrowRight } from 'lucide-react';
import Card from '../components/Card';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Add padding-top to account for fixed header */}
      <div className="pt-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-light/20 to-cream/40 py-20 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Hero Content */}
              <div className="text-center lg:text-left">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
                  YOUR{' '}
                  <span className="relative">
                    <span className="text-blue-primary">PATH</span>
                    <span className="absolute -top-2 -right-8 text-2xl">🎯</span>
                  </span>{' '}
                  TO SAT SUCCESS!
                  <span className="ml-2 text-4xl">📚</span>
                </h1>
                <p className="text-xl lg:text-2xl text-gray-600 mb-8 leading-relaxed max-w-lg">
                  Adaptive learning platform that personalizes your SAT math preparation with 
                  intelligent question selection and real-time performance tracking.
                </p>
                <Link
                  to="/register"
                  className="inline-flex items-center px-8 py-4 bg-blue-primary text-white text-lg font-semibold rounded-xl shadow-lg hover:bg-blue-dark hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  START LEARNING
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>

              {/* Hero Image Placeholder */}
              <div className="flex justify-center lg:justify-end">
                <div className="w-full max-w-lg h-96 bg-gradient-to-br from-blue-light/30 to-blue-primary/20 rounded-2xl flex items-center justify-center border-2 border-blue-light/30">
                  <div className="text-center text-blue-primary">
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-lg font-medium">Learning Dashboard Preview</p>
                    <p className="text-sm opacity-75">Coming Soon</p>
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
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Why Choose Sydney Learning Platform?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Experience personalized SAT math preparation with adaptive learning technology
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Card 1: Adaptive Learning */}
              <Card
                title="Adaptive Learning"
                description="Personalized question selection based on your performance. Master 66 question types with intelligent difficulty matching."
                icon={Users}
                backgroundColor="cream"
                iconText="4000+ Questions"
                link="/register"
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
                description="Take our comprehensive 44-question diagnostic to identify your strengths and areas for improvement."
                icon={Target}
                backgroundColor="rose-light"
                iconText="Start Diagnostic"
                link="/quiz"
                isExternal
              />
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="bg-blue-primary py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to Boost Your SAT Score?
            </h2>
            <p className="text-xl text-blue-light mb-8">
              Join thousands of students who have improved their SAT math scores with adaptive learning
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center px-8 py-3 bg-white text-blue-primary font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Start Free Trial
              </Link>
              <Link
                to="/quiz"
                className="inline-flex items-center px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-primary transition-all duration-200"
              >
                Take Diagnostic
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}