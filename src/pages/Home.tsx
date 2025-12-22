import { Link } from 'react-router-dom';
import { Users, TrendingUp, Target, ArrowRight, Zap, Brain, Award } from 'lucide-react';
import Card from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Add padding-top to account for fixed header */}
      <div className="pt-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-navy-dark via-navy-medium to-sky-blue py-20 lg:py-32 text-white relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-accent opacity-5 rounded-full -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-blue opacity-10 rounded-full -ml-40 -mb-40"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Hero Content */}
              <div className="text-center lg:text-left">
                <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
                  Master SAT Math <span className="text-yellow-accent">Adaptively</span>
                </h1>
                <p className="text-xl text-sky-blue-light mb-8 leading-relaxed max-w-lg">
                  Personalized SAT math preparation with intelligent question selection. Get questions calibrated exactly to your level.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    as={Link}
                    to={isAuthenticated ? "/dashboard" : "/register"}
                    variant="accent"
                    size="lg"
                    className="justify-center"
                  >
                    {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    as={Link}
                    to="/quiz"
                    variant="outline"
                    size="lg"
                    className="justify-center border-white text-white hover:bg-white hover:text-navy-dark"
                  >
                    Try Practice Quiz
                  </Button>
                </div>
              </div>

              {/* Hero Visual */}
              <div className="flex justify-center lg:justify-end">
                <div className="relative w-full max-w-md">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-accent to-yellow-light opacity-20 rounded-2xl blur-2xl"></div>
                  <div className="relative bg-white rounded-2xl shadow-elevation p-8 text-center">
                    <div className="mb-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-navy-dark to-sky-blue rounded-xl mb-4">
                        <Brain className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-navy-dark mb-2">Smart Learning</p>
                    <p className="text-gray-600 mb-6">ELO-based difficulty scaling adjusts to your level in real-time</p>
                    <div className="space-y-3 text-left">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-yellow-accent rounded-full"></div>
                        <span className="text-sm text-gray-700">18 SAT math categories</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-yellow-accent rounded-full"></div>
                        <span className="text-sm text-gray-700">4000+ practice questions</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-yellow-accent rounded-full"></div>
                        <span className="text-sm text-gray-700">Performance tracking</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-navy-dark mb-4">
                Why Students Love Sopharium
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Science-backed learning approach with intelligent difficulty scaling
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1: Adaptive Learning */}
              <Card
                title="Adaptive Learning"
                description="Questions adapt to your skill level in real-time. Master 18 SAT math categories with ELO-based difficulty matching."
                icon={Zap}
                variant="secondary"
                link={!isAuthenticated ? "/quiz" : undefined}
              />

              {/* Feature 2: Track Progress */}
              <Card
                title="Real-Time Analytics"
                description="Monitor your performance across all 22 micro-skill ratings. See detailed breakdowns of your strengths and areas to improve."
                icon={TrendingUp}
                variant="default"
                link="/dashboard"
              />

              {/* Feature 3: Expert Content */}
              <Card
                title="Expert-Curated Content"
                description="Practice with 4000+ questions curated by SAT prep experts. Every question is strategically designed for maximum learning."
                icon={Award}
                variant="primary"
              />

              {/* Feature 4: Diagnostic Test */}
              <Card
                title="Diagnostic Assessment"
                description="Start with our comprehensive 44-question diagnostic to identify your strengths and prioritize your study plan."
                icon={Brain}
                variant="outline"
              />

              {/* Feature 5: Performance Dashboard */}
              <Card
                title="Performance Dashboard"
                description="Beautiful visualizations of your progress. Track improvement over time with detailed statistics and actionable insights."
                icon={Users}
                variant="secondary"
                link="/dashboard"
              />

              {/* Feature 6: Personalized Study Path */}
              <Card
                title="Smart Study Path"
                description="AI-powered recommendations prioritize topics you need most. Maximize your study time with intelligent question selection."
                icon={Target}
                variant="accent"
              />
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-gradient-to-r from-navy-dark to-sky-blue py-16 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-yellow-accent mb-2">18</div>
                <p className="text-lg text-sky-blue-light">SAT Math Categories</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-yellow-accent mb-2">4000+</div>
                <p className="text-lg text-sky-blue-light">Practice Questions</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-yellow-accent mb-2">22</div>
                <p className="text-lg text-sky-blue-light">Micro-Skill Ratings</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gray-light">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-navy-dark mb-4">
              Ready to Transform Your SAT Prep?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Join thousands of students achieving their target scores with Sopharium
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                as={Link}
                to={isAuthenticated ? "/dashboard" : "/register"}
                variant="primary"
                size="lg"
                className="justify-center"
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Start Free Trial'}
              </Button>
              <Button
                as={Link}
                to="#pricing"
                variant="outline"
                size="lg"
                className="justify-center"
              >
                View Pricing
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
