import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  RefreshCw, 
  Search, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  AlertCircle
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
  const [rowsPerPage, setRowsPerPage] = useState(20);
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
          limit: rowsPerPage,
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
  }, [tableName, page, rowsPerPage, search, sortBy, sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSort = (column: string) => {
    const isAsc = sortBy === column && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(column);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!tableName || !deleteId) return;
    
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

  const formatValue = (value: unknown, type: string) => {
    if (value === null || value === undefined) return <span className="text-gray-400 italic">null</span>;
    
    if (type === 'boolean') {
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {value ? 'True' : 'False'}
        </span>
      );
    }
    
    if (typeof value === 'object') {
      return <span className="text-xs font-mono truncate max-w-[200px] block">{JSON.stringify(value)}</span>;
    }
    
    if (type === 'timestamp' || type === 'date') {
      return new Date(value as string).toLocaleString();
    }
    
    return String(value);
  };

  if (error) {
    return (
      <AdminLayout title={`Table: ${tableName}`}>
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
          <button onClick={loadData} className="ml-auto underline">Retry</button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Table: ${tableName}`}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search records..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-dark focus:border-navy-dark outline-none transition-all"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={loadData}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <Link
              to={`/admin/tables/${tableName}/new`}
              className="flex items-center gap-2 bg-navy-dark text-white px-4 py-2 rounded-lg hover:bg-navy-medium transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Record</span>
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {schema.map((col) => (
                  <th 
                    key={col.column_name}
                    className="px-4 py-3 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort(col.column_name)}
                  >
                    <div className="flex items-center gap-1">
                      {col.column_name}
                      {sortBy === col.column_name ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-sm font-semibold text-gray-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 animate-pulse">
                    {schema.map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-full"></div></td>
                    ))}
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : data?.data.length === 0 ? (
                <tr>
                  <td colSpan={schema.length + 1} className="px-4 py-12 text-center text-gray-500">
                    No records found
                  </td>
                </tr>
              ) : (
                data?.data.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    {schema.map((col) => (
                      <td key={col.column_name} className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">
                        {formatValue(row[col.column_name], col.data_type)}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => setViewRecord(row)}
                          className="p-1.5 text-gray-500 hover:text-navy-dark hover:bg-gray-100 rounded transition-all"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <Link 
                          to={`/admin/tables/${tableName}/${row.id || row.ID || i}`}
                          className="p-1.5 text-gray-500 hover:text-sky-blue hover:bg-gray-100 rounded transition-all"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Link>
                        <button 
                          onClick={() => setDeleteId(row.id as string || row.ID as string || i)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded transition-all"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{((page - 1) * rowsPerPage) + 1}</span> to <span className="font-medium">{Math.min(page * rowsPerPage, data?.total || 0)}</span> of <span className="font-medium">{data?.total || 0}</span> records
          </div>
          
          <div className="flex items-center gap-2">
            <select 
              className="text-sm border border-gray-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-navy-dark"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(1);
              }}
            >
              {[10, 20, 50, 100].map(n => (
                <option key={n} value={n}>{n} per page</option>
              ))}
            </select>
            
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1 || loading}
                onClick={() => setPage(p => p - 1)}
                className="p-1 rounded border border-gray-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium px-2">Page {page}</span>
              <button
                disabled={!data || page >= Math.ceil(data.total / rowsPerPage) || loading}
                onClick={() => setPage(p => p + 1)}
                className="p-1 rounded border border-gray-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {viewRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-navy-dark">Record Details</h3>
              <button onClick={() => setViewRecord(null)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 gap-4">
                {schema.map(col => (
                  <div key={col.column_name} className="border-b border-gray-50 pb-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{col.column_name}</label>
                    <div className="mt-1 text-gray-700 break-words font-mono text-sm">
                      {typeof viewRecord[col.column_name] === 'object' 
                        ? <pre className="bg-gray-50 p-2 rounded mt-1 overflow-x-auto">{JSON.stringify(viewRecord[col.column_name], null, 2)}</pre>
                        : String(viewRecord[col.column_name] ?? 'null')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button 
                onClick={() => setViewRecord(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <Trash2 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Confirm Delete</h3>
              </div>
              <p className="text-gray-600">
                Are you sure you want to delete this record? This action cannot be undone.
              </p>
            </div>
            <div className="p-4 bg-gray-50 flex justify-end gap-3">
              <button 
                disabled={deleting}
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                disabled={deleting}
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                {deleting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                <span>Delete Record</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminTableDetail;
