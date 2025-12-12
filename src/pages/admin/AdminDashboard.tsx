import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  HelpCircle, 
  ClipboardList, 
  TrendingUp,
  Activity,
  Database,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import type { AdminStats } from '../../services/adminService';
import AdminLayout from '../../components/admin/AdminLayout';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const statsData = await adminService.getStats();
      setStats(statsData);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const statCards = stats ? [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      link: '/admin/tables/users'
    },
    {
      title: 'Admin Users',
      value: stats.adminUsers,
      icon: Users,
      color: 'bg-purple-500',
      link: '/admin/tables/users'
    },
    {
      title: 'Total Questions',
      value: stats.totalQuestions,
      icon: HelpCircle,
      color: 'bg-green-500',
      link: '/admin/tables/questions'
    },
    {
      title: 'Quiz Sessions',
      value: stats.totalQuizSessions,
      icon: ClipboardList,
      color: 'bg-orange-500',
      link: '/admin/tables/quiz_sessions'
    },
    {
      title: 'Question Attempts',
      value: stats.totalAttempts,
      icon: Activity,
      color: 'bg-pink-500',
      link: '/admin/tables/question_attempts'
    },
    {
      title: 'Player Ratings',
      value: stats.totalRatings,
      icon: TrendingUp,
      color: 'bg-indigo-500',
      link: '/admin/tables/player_ratings'
    }
  ] : [];

  return (
    <AdminLayout 
      title="Admin Dashboard" 
      breadcrumbs={[{ label: 'Dashboard' }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-500 mt-1">Monitor and manage your application data</p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading && !stats ? (
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {statCards.map((card) => (
                <Link
                  key={card.title}
                  to={card.link}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{card.title}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {card.value.toLocaleString()}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${card.color}`}>
                      <card.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Database className="w-5 h-5" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  to="/admin/tables"
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <span className="font-medium">View All Tables</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </Link>
                <Link
                  to="/admin/tables/users/new"
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <span className="font-medium">Add New User</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </Link>
                <Link
                  to="/admin/tables/questions/new"
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <span className="font-medium">Add Question</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </Link>
                <Link
                  to="/admin/activity"
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <span className="font-medium">Activity Log</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </Link>
              </div>
            </div>

            {/* Database Statistics */}
            {stats && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance Metrics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600">
                      {stats.avgCorrectRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Average Correct Rate</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">
                      {stats.questionsPerCategory.length}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Question Categories</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-3xl font-bold text-purple-600">
                      {stats.totalMicroRatings}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Micro Ratings</p>
                  </div>
                </div>

                {stats.questionsPerCategory.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-medium text-gray-900 mb-3">Questions by Category</h3>
                    <div className="space-y-2">
                      {stats.questionsPerCategory.map((cat) => (
                        <div key={cat.category} className="flex items-center gap-4">
                          <span className="w-32 text-sm text-gray-600 truncate">{cat.category}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-4">
                            <div
                              className="bg-blue-500 h-4 rounded-full"
                              style={{ 
                                width: `${(cat.count / stats.totalQuestions) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-12 text-right">
                            {cat.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
