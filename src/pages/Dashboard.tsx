import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Award, BarChart3, Calendar, Clock, Mail, User, Zap } from 'lucide-react';
import { eloRatingService } from '../services/eloRatingService';
import { ELO_RATING_LEVELS } from '../types';

export default function Dashboard() {
  const { user } = useAuth();
  const [overallRating, setOverallRating] = useState(null);
  const [microRatings, setMicroRatings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);
    Promise.allSettled([
      eloRatingService.getOverallRating(),
      eloRatingService.getMicroRatings(),
    ]).then(([overallResult, microResult]) => {
      if (overallResult.status === 'fulfilled') setOverallRating(overallResult.value);
      if (microResult.status === 'fulfilled') setMicroRatings(microResult.value);
      setIsLoading(false);
    });
  }, [user?.id]);

  const normalizedRatings = useMemo(() => {
    return microRatings.map((rating) => ({
      id: rating.category_id,
      name: rating.category_name,
      rating: rating.elo_rating ?? 1200,
      attempts: rating.attempts_count ?? 0,
      correct: rating.correct_count ?? 0,
      successRate: rating.success_rate ?? null,
      lastAttempt: rating.last_attempt_date ?? null,
    }));
  }, [microRatings]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return 'N/A';
    return parsed.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const getRatingLevel = (rating) => {
    if (rating < 1000) return ELO_RATING_LEVELS.beginner;
    if (rating < 1300) return ELO_RATING_LEVELS.intermediate;
    if (rating < 1600) return ELO_RATING_LEVELS.advanced;
    return ELO_RATING_LEVELS.expert;
  };
  const getRatingColor = (rating) => getRatingLevel(rating).color;

  const currentElo = overallRating?.overall_elo ?? 1200;
  const ratingLevel = getRatingLevel(currentElo);
  const questionsAnswered = overallRating?.times_played ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Learning Dashboard</h1>
          <p className="text-gray-600">Welcome back! Track your SAT math progress and continue learning.</p>
        </div>

        {/* ELO/Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current ELO Rating</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold" style={{ color: getRatingColor(currentElo) }}>{currentElo}</span>
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-100" style={{ color: ratingLevel.color }}>{ratingLevel.label}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">{ratingLevel.description}</p>
              </div>
              <Zap size={28} className="text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Questions Answered</p>
                <p className="text-2xl font-bold text-blue-primary">{questionsAnswered}</p>
                <p className="text-xs text-gray-500 mt-2">Total attempts recorded</p>
              </div>
              <BarChart3 size={26} className="text-blue-primary" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Last Active</p>
                <p className="text-lg font-semibold text-gray-900">{formatDate(user?.last_login)}</p>
              </div>
              <Clock size={26} className="text-gray-500" />
            </div>
          </div>
        </div>

        {/* Rating System */}
        <div className="bg-white rounded-xl shadow-card p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Rating System</h2>
          <p className="text-gray-600 mb-6">
            Your adaptive SAT rating reflects how well you are performing across Math topics. It adjusts after every
            attempt based on both the question difficulty and your current rating.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(ELO_RATING_LEVELS).map(([key, level]) => (
              <div
                key={key}
                className="p-4 rounded-lg border-2"
                style={{ borderColor: level.color, backgroundColor: `${level.color}10` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: level.color }} />
                  <span className="font-semibold" style={{ color: level.color }}>{level.label}</span>
                </div>
                <p className="text-xs text-gray-600">{level.min.toLocaleString()} - {level.max.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-2">{level.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Category Ratings */}
        <div className="bg-white rounded-xl shadow-card p-8">
          <div className="flex items-center gap-3 mb-4">
            <Award size={28} className="text-blue-primary" />
            <h2 className="text-2xl font-bold text-gray-900">Category Ratings</h2>
          </div>
          {error && (
            <div className="mb-4 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
          )}
          {isLoading ? (
            <div className="flex flex-col items-center py-10 text-gray-600">
              <div className="animate-spin"><Zap size={28} className="text-blue-primary" /></div>
              <p className="mt-2 text-sm">Loading category ratings...</p>
            </div>
          ) : normalizedRatings.length === 0 ? (
            <p className="text-sm text-gray-600">We will populate your category ratings as soon as you begin practicing.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Rating</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Level</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Attempts</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Success</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Last Attempt</th>
                  </tr>
                </thead>
                <tbody>
                  {normalizedRatings.map((rating) => {
                    const categoryLevel = getRatingLevel(rating.rating);
                    return (
                      <tr key={rating.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{rating.name}</td>
                        <td className="py-3 px-4 text-sm">
                          <span className="font-semibold" style={{ color: getRatingColor(rating.rating) }}>
                            {rating.rating}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span 
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold"
                            style={{ backgroundColor: `${categoryLevel.color}20`, color: categoryLevel.color }}
                          >
                            {categoryLevel.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">{rating.attempts}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {rating.successRate !== null ? `${(rating.successRate * 100).toFixed(1)}%` : '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
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

        {/* Quick Actions (unchanged, but styled) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Continue Practice</h2>
            <p className="text-gray-600 mb-6">Resume your adaptive learning session</p>
            <Link to="/quiz/start" className="inline-flex items-center px-6 py-3 bg-blue-primary text-white rounded-lg hover:bg-blue-dark transition-colors font-medium">Start Practice</Link>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Diagnostic Assessment</h2>
            <p className="text-gray-600 mb-6">Take a 44-question diagnostic to update your skill ratings</p>
            <button className="inline-flex items-center px-6 py-3 border-2 border-blue-primary text-blue-primary rounded-lg hover:bg-blue-primary hover:text-white transition-colors font-medium">Take Diagnostic</button>
          </div>
        </div>
      </div>
    </div>
  );
}