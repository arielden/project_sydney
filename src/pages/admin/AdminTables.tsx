import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Database, Table, RefreshCw, ExternalLink, Search } from 'lucide-react';
import { adminService } from '../../services/adminService';
import type { TableInfo } from '../../services/adminService';
import AdminLayout from '../../components/admin/AdminLayout';

const AdminTables: React.FC = () => {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadTables = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getTables();
      setTables(data);
    } catch (err) {
      setError('Failed to load tables');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTableIcon = (tableName: string) => {
    const icons: Record<string, string> = {
      users: '👤',
      categories: '📂',
      questions: '❓',
      question_categories: '🔗',
      question_attempts: '📝',
      quiz_sessions: '📋',
      player_ratings: '⭐',
      micro_ratings: '📊',
      admin_activity_log: '📜',
      quiz_questions: '🎯',
      user_question_history: '📚',
      category_practice_priority: '⚖️'
    };
    return icons[tableName] || '📁';
  };

  const getTableDescription = (tableName: string) => {
    const descriptions: Record<string, string> = {
      users: 'User accounts and authentication data',
      categories: 'SAT Math categories (20 total)',
      questions: 'Quiz questions with difficulty levels',
      question_categories: 'Many-to-many links between questions and categories',
      question_attempts: 'Individual question answer attempts',
      quiz_sessions: 'Quiz session records and scores with performance metrics',
      player_ratings: 'Overall player ELO ratings',
      micro_ratings: 'Category-specific ELO ratings and performance metrics',
      admin_activity_log: 'Admin action audit trail',
      quiz_questions: 'Adaptive quiz session question assignments',
      user_question_history: 'User question usage tracking and mastery status',
      category_practice_priority: 'Dynamic weights and priority for category-based question selection'
    };
    return descriptions[tableName] || 'Database table';
  };

  return (
    <AdminLayout
      title="Database Tables"
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'Tables' }
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-blue-900 flex items-center gap-2">
              <Database className="w-8 h-8" />
              Database Tables
            </h1>
            <p className="text-gray-600 mt-1">
              {tables.length} tables · {tables.reduce((sum, t) => sum + t.count, 0).toLocaleString()} total records
            </p>
          </div>
          <button
            onClick={loadTables}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
          />
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-900" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTables.map((table) => (
              <Link
                key={table.name}
                to={`/admin/tables/${table.name}`}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-900 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getTableIcon(table.name)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-900">
                        {table.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {getTableDescription(table.name)}
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-900" />
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Table className="w-4 h-4" />
                    <span>{Array.isArray(table.columns) ? table.columns.length : table.columns} columns</span>
                  </div>
                  <span className="text-lg font-bold text-blue-900">
                    {table.count.toLocaleString()} 
                    <span className="text-sm font-normal text-gray-600 ml-1">records</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && filteredTables.length === 0 && searchTerm && (
          <div className="text-center py-12">
            <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No tables found</h3>
            <p className="text-gray-600 mt-1">
              No tables match "{searchTerm}"
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminTables;
