import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Award, BarChart3, Calendar, Zap, TrendingUp } from 'lucide-react';
import { ResponsiveRadar } from '@nivo/radar';
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
    
    const fetchData = async () => {
      setError(null);
      setIsLoading(true);
      
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
          console.log('Micro ratings loaded:', microResult.value);
          console.log('Number of ratings:', microResult.value.length);
          microResult.value.forEach((r: any, i: number) => {
            console.log(`[${i}] ${r.category_name} (ID: ${r.category_id}): ${r.elo_rating}`);
          });
          setMicroRatings(microResult.value);
        } else {
          console.error('Failed to fetch micro ratings:', microResult.reason);
          setError('Failed to load some dashboard data. Please try again later.');
        }
        
        setIsLoading(false);
      });
    };
    
    fetchData();
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

  // Simplify grouping - just return all ratings
  const groupCategoriesByType = useMemo(() => {
    console.log('Normalizing ratings:', normalizedRatings.length);
    if (normalizedRatings.length === 0) return [];
    return [{ title: 'Your Category Performance', data: normalizedRatings }];
  }, [normalizedRatings]);

  const formatRadarData = (ratings: typeof normalizedRatings) => {
    return ratings.map(rating => ({
      category: rating.name.substring(0, 12),
      'Current Rating': Math.min(800, rating.rating),
      'Target (700)': 700,
      fullData: rating,
    }));
  };

  const getTopCategories = (ratings: typeof normalizedRatings, count: number = 3) => {
    return [...ratings]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, count);
  };

  const getWeakestCategories = (ratings: typeof normalizedRatings, count: number = 3) => {
    return [...ratings]
      .sort((a, b) => a.rating - b.rating)
      .slice(0, count);
  };

  const getOverallProgress = (ratings: typeof normalizedRatings) => {
    if (ratings.length === 0) return 0;
    const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    return Math.round(avg);
  };

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
            <div className="space-y-8">
              {groupCategoriesByType.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No category data available. Complete a quiz to see your ratings.</p>
                </div>
              ) : (
                <>
                  {/* Overall Progress */}
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold">Overall Progress</h3>
                      <span className="text-3xl font-bold">{getOverallProgress(normalizedRatings)}</span>
                    </div>
                    <div className="w-full bg-blue-900 rounded-full h-3">
                      <div 
                        className="bg-yellow-accent h-3 rounded-full" 
                        style={{ width: `${Math.min(100, (getOverallProgress(normalizedRatings) / 800) * 100)}%` }}
                      />
                    </div>
                    <p className="text-blue-100 text-sm mt-2">Target: 700</p>
                  </div>

                  {/* Enhanced Radar Chart */}
                  {groupCategoriesByType.map((group, idx) => {
                    const radarData = formatRadarData(group.data);
                    
                    return (
                      <div key={idx} className="space-y-6">
                        <h3 className="text-xl font-semibold text-navy-dark">{group.title}</h3>
                        <div style={{ width: '100%', height: '600px' }}>
                          <ResponsiveRadar
                            data={radarData}
                            keys={['Current Rating', 'Target (700)']}
                            indexBy="category"
                            maxValue={800}
                            margin={{ top: 80, right: 100, bottom: 80, left: 100 }}
                            curve="catmullRomClosed"
                            borderWidth={3}
                            borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                            gridLevels={8}
                            gridShape="circular"
                            gridLabelOffset={20}
                            enableDots={true}
                            dotSize={10}
                            dotColor="#fff"
                            dotBorderWidth={3}
                            dotBorderColor={{ from: 'color' }}
                            enableDotLabel={false}
                            colors={['#086CB4', '#FFD340']}
                            fillOpacity={0.15}
                            blendMode="normal"
                            animate={true}
                            motionConfig="gentle"
                            legends={[
                              {
                                anchor: 'top',
                                direction: 'row',
                                translateY: -50,
                                itemWidth: 120,
                                itemHeight: 20,
                                symbolSize: 16,
                                symbolShape: 'circle'
                              }
                            ]}
                            theme={{
                              axis: {
                                ticks: {
                                  text: {
                                    fontSize: 11,
                                    fontWeight: 600
                                  }
                                }
                              },
                              grid: {
                                line: {
                                  stroke: '#ddd',
                                  strokeWidth: 1
                                }
                              }
                            }}
                          />
                        </div>

                        {/* Top & Weakest Categories */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Top 3 Strongest */}
                          <div className="bg-green-50 rounded-xl border-2 border-green-200 p-6">
                            <h4 className="font-semibold text-green-900 mb-4">💪 Top 3 Strongest</h4>
                            <div className="space-y-3">
                              {getTopCategories(group.data, 3).map((cat, i) => (
                                <div key={i} className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                                  <span className="font-bold text-green-600">{cat.rating}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Top 3 Weakest */}
                          <div className="bg-red-50 rounded-xl border-2 border-red-200 p-6">
                            <h4 className="font-semibold text-red-900 mb-4">📌 Top 3 to Improve</h4>
                            <div className="space-y-3">
                              {getWeakestCategories(group.data, 3).map((cat, i) => (
                                <div key={i} className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                                  <span className="font-bold text-red-600">{cat.rating}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
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