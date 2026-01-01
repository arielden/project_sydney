import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Award, BarChart3, Calendar, Zap, TrendingUp } from 'lucide-react';
import { eloRatingService } from '../services/eloRatingService';
import type { UserELORating, MicroRating } from '../services/eloRatingService';
import { ELO_RATING_LEVELS } from '../types';
import { Button } from '../components/common/Button';

export default function Dashboard() {
  const { user } = useAuth();
  const [overallRating, setOverallRating] = useState<UserELORating | null>(null);
  const [microRatings, setMicroRatings] = useState<MicroRating[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    
    setError(null);
    Promise.allSettled([
      eloRatingService.getOverallRating(),
      eloRatingService.getMicroRatings(),
    ]).then(([overallResult, microResult]) => {
      if (overallResult.status === 'fulfilled') {
        setOverallRating(overallResult.value);
      } else {
        console.error('Failed to fetch overall rating:', overallResult.reason);
        setError('Failed to load some dashboard data. Please try again later.');
      }

      if (microResult.status === 'fulfilled') {
        setMicroRatings(microResult.value);
      } else {
        console.error('Failed to fetch micro ratings:', microResult.reason);
        setError('Failed to load some dashboard data. Please try again later.');
      }
      
      setIsLoading(false);
    });
  }, [user?.id]);

  const normalizedRatings = useMemo(() => {
    return microRatings.map((rating) => ({
      id: rating.category_id,
      name: rating.category_name,
      rating: rating.elo_rating ?? 500,
      attempts: rating.attempts_count ?? 0,
      correct: rating.correct_count ?? 0,
      successRate: rating.success_rate ?? null,
      lastAttempt: rating.last_attempt_date ?? null,
    }));
  }, [microRatings]);

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return 'N/A';
    return parsed.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const getRatingLevel = (rating: number) => {
    if (rating < 400) return ELO_RATING_LEVELS.beginner;
    if (rating < 600) return ELO_RATING_LEVELS.intermediate;
    if (rating < 700) return ELO_RATING_LEVELS.advanced;
    return ELO_RATING_LEVELS.expert;
  };

  const currentElo = overallRating?.overall_elo ?? 500;
  const ratingLevel = getRatingLevel(currentElo);
  const questionsAnswered = overallRating?.times_played ?? 0;

  return (
    <div className="min-h-screen bg-white pt-24 pb-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-navy-dark mb-2">Your Learning Dashboard</h1>
          <p className="text-lg text-gray-600">Welcome back, {user?.first_name || 'Student'}! Track your SAT math progress and continue learning.</p>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ELO Card */}
          <div className="bg-gradient-to-br from-navy-dark to-navy-medium rounded-xl shadow-card p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sky-blue-light text-sm mb-1">Overall ELO Rating</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{currentElo}</span>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-yellow-accent text-navy-dark">{ratingLevel.label}</span>
                </div>
              </div>
              <Zap size={36} className="text-yellow-accent" />
            </div>
            <p className="text-sky-blue-light text-sm">{ratingLevel.description}</p>
          </div>

          {/* Questions Card */}
          <div className="bg-white rounded-xl shadow-card p-6 border border-sky-blue-light">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-600 text-sm mb-1">Questions Answered</p>
                <p className="text-4xl font-bold text-navy-dark">{questionsAnswered}</p>
              </div>
              <BarChart3 size={36} className="text-sky-blue" />
            </div>
            <p className="text-gray-500 text-sm">Total practice attempts</p>
          </div>

          {/* Last Active Card */}
          <div className="bg-sky-blue-light rounded-xl shadow-card p-6 border border-sky-blue">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-navy-dark text-sm mb-1">Last Active</p>
                <p className="text-2xl font-bold text-navy-dark">{formatDate(user?.last_login)}</p>
              </div>
              <Calendar size={36} className="text-navy-dark opacity-50" />
            </div>
            <p className="text-navy-dark text-sm opacity-75">Keep the streak going!</p>
          </div>
        </div>

        {/* Rating System Explanation */}
        <div className="bg-white rounded-xl shadow-card p-8">
          <h2 className="text-2xl font-bold text-navy-dark mb-2">Understanding Your Rating</h2>
          <p className="text-gray-600 mb-6">
            Your adaptive SAT rating (ELO system) reflects your performance across Math topics. It adjusts after every attempt based on both question difficulty and your current rating.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(ELO_RATING_LEVELS).map(([key, level]) => (
              <div
                key={key}
                className="p-4 rounded-lg border-2 hover:shadow-card transition-shadow"
                style={{ borderColor: level.color, backgroundColor: `${level.color}08` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: level.color }} />
                  <span className="font-semibold text-navy-dark">{level.label}</span>
                </div>
                <p className="text-xs text-gray-600 font-medium">{level.min.toLocaleString()} - {level.max.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-2">{level.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Category Ratings Table */}
        <div className="bg-white rounded-xl shadow-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-navy-dark to-sky-blue rounded-lg">
              <Award size={24} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-navy-dark">Category Ratings</h2>
          </div>

          {error && (
            <div className="mb-4 p-4 rounded-lg border border-red-error bg-red-error bg-opacity-5 text-red-error text-sm font-medium">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center py-10 text-gray-600">
              <div className="animate-spin mb-2">
                <Zap size={28} className="text-sky-blue" />
              </div>
              <p className="text-sm">Loading your category performance...</p>
            </div>
          ) : normalizedRatings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Start practicing to see your category ratings!</p>
              <Button as={Link} to="/quiz/start" variant="primary">
                Begin Practice
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-sky-blue-light bg-gray-light">
                    <th className="text-left py-4 px-4 text-sm font-semibold text-navy-dark">Category</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-navy-dark">Rating</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-navy-dark">Level</th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-navy-dark">Attempts</th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-navy-dark">Success Rate</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-navy-dark">Last Attempt</th>
                  </tr>
                </thead>
                <tbody>
                  {normalizedRatings.map((rating, idx) => {
                    const categoryLevel = getRatingLevel(rating.rating);
                    return (
                      <tr 
                        key={rating.id} 
                        className={`border-b border-gray-100 hover:bg-sky-blue-light transition-colors ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-gray-light bg-opacity-30'
                        }`}
                      >
                        <td className="py-4 px-4 text-sm font-medium text-navy-dark">{rating.name}</td>
                        <td className="py-4 px-4 text-sm">
                          <span className="font-bold text-lg" style={{ color: categoryLevel.color }}>
                            {rating.rating}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm">
                          <span 
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: `${categoryLevel.color}15`, color: categoryLevel.color }}
                          >
                            {categoryLevel.label}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-center text-gray-900 font-medium">{rating.attempts}</td>
                        <td className="py-4 px-4 text-sm text-center font-medium">
                          {rating.successRate !== null ? (
                            <span className="inline-flex items-center gap-1 text-green-success">
                              <TrendingUp size={16} />
                              {(rating.successRate * 100).toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {rating.lastAttempt ? formatDate(rating.lastAttempt) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-navy-dark to-sky-blue rounded-xl shadow-card p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Zap size={28} className="text-yellow-accent" />
              <h3 className="text-2xl font-bold">Continue Practice</h3>
            </div>
            <p className="text-sky-blue-light mb-6">Resume your adaptive learning session and keep improving</p>
            <Button as={Link} to="/quiz/start" variant="accent" size="lg">
              Start Practice Session
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-card p-8 border-2 border-sky-blue-light">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp size={28} className="text-navy-dark" />
              <h3 className="text-2xl font-bold text-navy-dark">Diagnostic Assessment</h3>
            </div>
            <p className="text-gray-600 mb-6">Take a comprehensive 44-question diagnostic to update your skill ratings</p>
            <Button as="button" variant="outline" size="lg" className="w-full">
              Take Diagnostic Test
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}