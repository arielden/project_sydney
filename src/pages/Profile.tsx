import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Calendar, Award, Clock, BarChart3, Zap } from 'lucide-react';
import { eloRatingService } from '../services/eloRatingService';
import type { MicroRating, UserELORating } from '../services/eloRatingService';
import { ELO_RATING_LEVELS } from '../types';
import type { RatingLevel } from '../types';

type NormalizedMicroRating = {
  id: string;
  name: string;
  rating: number;
  attempts: number;
  correct: number;
  successRate: number | null;
  lastAttempt: string | null;
};

export default function Profile() {
  const { user } = useAuth();
  const [overallRating, setOverallRating] = useState<UserELORating | null>(null);
  const [microRatings, setMicroRatings] = useState<MicroRating[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const fetchRatings = async () => {
      setIsLoading(true);
      setError(null);

      const [overallResult, microResult] = await Promise.allSettled([
        eloRatingService.getOverallRating(),
        eloRatingService.getMicroRatings(),
      ]);

      if (overallResult.status === 'fulfilled') {
        setOverallRating(overallResult.value);
      } else {
        console.warn('Failed to load overall rating', overallResult.reason);
        setError((prev) => prev ?? 'Unable to load overall rating data.');
      }

      if (microResult.status === 'fulfilled') {
        setMicroRatings(microResult.value);
      } else {
        console.warn('Failed to load micro ratings', microResult.reason);
        setError((prev) => prev ?? 'Unable to load category rating data.');
      }

      setIsLoading(false);
    };

    fetchRatings();
  }, [user?.id]);

  const normalizedRatings = useMemo<NormalizedMicroRating[]>(() => {
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

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return 'N/A';
    return parsed.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRatingLevel = (rating: number): RatingLevel => {
    if (rating < 1000) return ELO_RATING_LEVELS.beginner;
    if (rating < 1300) return ELO_RATING_LEVELS.intermediate;
    if (rating < 1600) return ELO_RATING_LEVELS.advanced;
    return ELO_RATING_LEVELS.expert;
  };

  const getRatingColor = (rating: number) => getRatingLevel(rating).color;

  if (!user) {
    return null;
  }

  const currentElo = overallRating?.overall_elo ?? 1200;
  const ratingLevel = getRatingLevel(currentElo);
  const questionsAnswered = overallRating?.times_played ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="bg-white rounded-xl shadow-card p-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-blue-primary rounded-full flex items-center justify-center">
              <User size={34} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-gray-600">
                <span className="flex items-center gap-1 text-sm">
                  <Mail size={16} />
                  {user.email}
                </span>
                <span className="flex items-center gap-1 text-sm">
                  <Calendar size={16} />
                  Joined {formatDate(user.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current ELO Rating</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold" style={{ color: getRatingColor(currentElo) }}>
                    {currentElo}
                  </span>
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-100" style={{ color: ratingLevel.color }}>
                    {ratingLevel.label}
                  </span>
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
                <p className="text-lg font-semibold text-gray-900">{formatDate(user.last_login)}</p>
              </div>
              <Clock size={26} className="text-gray-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Username</p>
              <p className="text-gray-900">{user.username}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Email Address</p>
              <p className="text-gray-900">{user.email}</p>
            </div>
            {user.first_name && (
              <div>
                <p className="text-sm font-medium text-gray-600">First Name</p>
                <p className="text-gray-900">{user.first_name}</p>
              </div>
            )}
            {user.last_name && (
              <div>
                <p className="text-sm font-medium text-gray-600">Last Name</p>
                <p className="text-gray-900">{user.last_name}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-600">Account Created</p>
              <p className="text-gray-900">{formatDate(user.created_at)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Account Status</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                Active
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Rating System</h2>
          <p className="text-gray-600 mb-6">
            Your adaptive ELO rating reflects how well you are performing across SAT Math topics. It adjusts after every
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
                  <span className="font-semibold" style={{ color: level.color }}>
                    {level.label}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{level.min.toLocaleString()} - {level.max.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-2">{level.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-8">
          <div className="flex items-center gap-3 mb-4">
            <Award size={28} className="text-blue-primary" />
            <h2 className="text-2xl font-bold text-gray-900">Category Ratings</h2>
          </div>

          {error && (
            <div className="mb-4 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center py-10 text-gray-600">
              <div className="animate-spin">
                <Zap size={28} className="text-blue-primary" />
              </div>
              <p className="mt-2 text-sm">Loading category ratings...</p>
            </div>
          ) : normalizedRatings.length === 0 ? (
            <p className="text-sm text-gray-600">We will populate your category ratings as soon as you begin practicing.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {normalizedRatings.map((rating) => {
                const categoryLevel = getRatingLevel(rating.rating);

                return (
                  <div
                    key={rating.id}
                    className="p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-sm font-semibold text-gray-900 truncate mb-3">{rating.name}</h3>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Rating</span>
                        <span className="font-semibold" style={{ color: getRatingColor(rating.rating) }}>
                          {rating.rating}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Level</span>
                        <span
                          className="text-xs font-semibold px-2 py-1 rounded"
                          style={{ backgroundColor: `${categoryLevel.color}20`, color: categoryLevel.color }}
                        >
                          {categoryLevel.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Attempts</span>
                        <span className="font-medium text-gray-900">{rating.attempts}</span>
                      </div>
                      {rating.successRate !== null && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Success</span>
                          <span className="font-medium text-gray-900">{(rating.successRate * 100).toFixed(1)}%</span>
                        </div>
                      )}
                      {rating.lastAttempt && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Last Attempt</span>
                          <span className="font-medium text-gray-900 text-xs">{formatDate(rating.lastAttempt)}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${Math.min(100, (rating.rating / 2000) * 100)}%`,
                          backgroundColor: categoryLevel.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}