import React, { useEffect, useState } from 'react';
import { RefreshCw, Filter, Calendar } from 'lucide-react';
import { adminService } from '../../services/adminService';
import type { AdminActivity } from '../../services/adminService';
import AdminLayout from '../../components/admin/AdminLayout';

const AdminActivityLog: React.FC = () => {
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(50);
  const [filterAction, setFilterAction] = useState<string>('');
  const [filterTable, setFilterTable] = useState<string>('');

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getRecentActivity(limit);
      setActivities(data);
    } catch (err) {
      setError('Failed to load activity log');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [limit]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'text-green-600 bg-green-100';
      case 'UPDATE':
        return 'text-blue-600 bg-blue-100';
      case 'DELETE':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const uniqueActions = Array.from(new Set(activities.map(a => a.action)));
  const uniqueTables = Array.from(new Set(activities.map(a => a.table_name)));

  const filteredActivities = activities.filter(activity => {
    if (filterAction && activity.action !== filterAction) return false;
    if (filterTable && activity.table_name !== filterTable) return false;
    return true;
  });

  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = new Date(activity.created_at).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, AdminActivity[]>);

  return (
    <AdminLayout
      title="Activity Log"
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'Activity Log' }
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Activity Log</h1>
            <p className="text-gray-500 mt-1">
              {filteredActivities.length} of {activities.length} activities
            </p>
          </div>
          <button
            onClick={loadActivities}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Actions</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
          
          <select
            value={filterTable}
            onChange={(e) => setFilterTable(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Tables</option>
            {uniqueTables.map(table => (
              <option key={table} value={table}>{table}</option>
            ))}
          </select>
          
          <select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value={25}>Last 25</option>
            <option value={50}>Last 50</option>
            <option value={100}>Last 100</option>
            <option value={200}>Last 200</option>
          </select>
          
          {(filterAction || filterTable) && (
            <button
              onClick={() => {
                setFilterAction('');
                setFilterTable('');
              }}
              className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700"
            >
              Clear Filters
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">No activity records found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedActivities).map(([date, dayActivities]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <h3 className="font-medium text-gray-700">{date}</h3>
                  <span className="text-sm text-gray-500">({dayActivities.length} actions)</span>
                </div>
                
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Record</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {dayActivities.map((activity) => (
                        <tr key={activity.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                            {new Date(activity.created_at).toLocaleTimeString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(activity.action)}`}>
                              {activity.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                            {activity.table_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                            {activity.record_id ? `#${activity.record_id}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                            {activity.admin_email || '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                            {activity.details ? (
                              <span title={JSON.stringify(activity.details)}>
                                {JSON.stringify(activity.details).substring(0, 50)}...
                              </span>
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminActivityLog;
