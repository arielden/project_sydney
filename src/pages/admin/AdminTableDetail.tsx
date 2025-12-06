import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Eye,
  Download,
  Filter
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import type { TableSchema, PaginatedResult } from '../../services/adminService';
import AdminLayout from '../../components/admin/AdminLayout';
import { toast } from 'react-hot-toast';

const AdminTableDetail: React.FC = () => {
  const { tableName } = useParams<{ tableName: string }>();
  
  const [schema, setSchema] = useState<TableSchema[]>([]);
  const [data, setData] = useState<PaginatedResult<Record<string, unknown>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination & filtering
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // View record modal
  const [viewRecord, setViewRecord] = useState<Record<string, unknown> | null>(null);

  const loadData = useCallback(async () => {
    if (!tableName) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [schemaData, tableData] = await Promise.all([
        adminService.getTableSchema(tableName),
        adminService.getTableData(tableName, {
          page,
          limit,
          search: search || undefined,
          sortBy: sortBy || undefined,
          sortOrder
        })
      ]);
      
      setSchema(schemaData);
      setData(tableData);
    } catch (err) {
      setError('Failed to load table data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tableName, page, limit, search, sortBy, sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleDelete = async () => {
    if (!tableName || deleteId === null) return;
    
    try {
      setDeleting(true);
      await adminService.deleteRecord(tableName, deleteId);
      toast.success('Record deleted successfully');
      setDeleteId(null);
      loadData();
    } catch (err) {
      toast.error('Failed to delete record');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const formatCellValue = (value: unknown, column: TableSchema): string => {
    if (value === null || value === undefined) return '—';
    
    if (column.type.includes('timestamp') || column.type.includes('date')) {
      return new Date(value as string).toLocaleString();
    }
    
    if (typeof value === 'boolean') {
      return value ? '✓ Yes' : '✗ No';
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    const strValue = String(value);
    if (strValue.length > 50) {
      return strValue.substring(0, 50) + '...';
    }
    
    return strValue;
  };

  const getPrimaryKey = () => {
    const pk = schema.find(col => col.isPrimaryKey);
    return pk?.name || 'id';
  };

  const exportToCSV = () => {
    if (!data || !tableName) return;
    
    const headers = schema.map(col => col.name).join(',');
    const rows = data.data.map(row => 
      schema.map(col => {
        const value = row[col.name];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      }).join(',')
    ).join('\n');
    
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tableName}_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const visibleColumns = schema.filter(col => 
    !['password_hash', 'password'].includes(col.name)
  ).slice(0, 8); // Show max 8 columns in table view

  return (
    <AdminLayout
      title={tableName || 'Table'}
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'Tables', href: '/admin/tables' },
        { label: tableName || '' }
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{tableName}</h1>
            {data && (
              <p className="text-gray-500 mt-1">
                {data.total.toLocaleString()} records · {schema.length} columns
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportToCSV}
              disabled={!data || data.data.length === 0}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link
              to={`/admin/tables/${tableName}/new`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Record
            </Link>
          </div>
        </div>

        {/* Search & Filter */}
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <Filter className="w-4 h-4" />
            Search
          </button>
        </form>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : data && data.data.length > 0 ? (
          <>
            {/* Data Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {visibleColumns.map((col) => (
                        <th
                          key={col.name}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort(col.name)}
                        >
                          <div className="flex items-center gap-1">
                            {col.name}
                            {col.isPrimaryKey && <span className="text-yellow-500">🔑</span>}
                            {sortBy === col.name && (
                              <ArrowUpDown className="w-3 h-3" />
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.data.map((row, index) => {
                      const pk = getPrimaryKey();
                      const recordId = row[pk] as number;
                      
                      return (
                        <tr key={recordId || index} className="hover:bg-gray-50">
                          {visibleColumns.map((col) => (
                            <td key={col.name} className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                              {formatCellValue(row[col.name], col)}
                            </td>
                          ))}
                          <td className="px-4 py-3 text-right text-sm whitespace-nowrap">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setViewRecord(row)}
                                className="p-1 text-gray-500 hover:text-blue-600"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <Link
                                to={`/admin/tables/${tableName}/${recordId}`}
                                className="p-1 text-gray-500 hover:text-green-600"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => setDeleteId(recordId)}
                                className="p-1 text-gray-500 hover:text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, data.total)} of {data.total} records
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="flex items-center px-3 py-1 bg-gray-100 rounded-lg">
                  Page {page} of {data.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages}
                  className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">No records found</p>
            <Link
              to={`/admin/tables/${tableName}/new`}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add First Record
            </Link>
          </div>
        )}

        {/* View Record Modal */}
        {viewRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold">Record Details</h3>
                <button
                  onClick={() => setViewRecord(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                <dl className="space-y-3">
                  {schema.filter(col => !['password_hash', 'password'].includes(col.name)).map((col) => (
                    <div key={col.name} className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">
                        {col.name}
                        {col.isPrimaryKey && ' 🔑'}
                      </dt>
                      <dd className="text-sm text-gray-900 col-span-2 break-all">
                        {formatCellValue(viewRecord[col.name], col)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
                <button
                  onClick={() => setViewRecord(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <Link
                  to={`/admin/tables/${tableName}/${viewRecord[getPrimaryKey()]}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit Record
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteId !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Confirm Delete
              </h3>
              <p className="text-gray-500 mb-4">
                Are you sure you want to delete record #{deleteId}? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteId(null)}
                  disabled={deleting}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminTableDetail;
