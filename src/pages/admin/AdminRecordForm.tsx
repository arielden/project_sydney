import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Save, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { adminService } from '../../services/adminService';
import type { TableSchema } from '../../services/adminService';
import AdminLayout from '../../components/admin/AdminLayout';
import { toast } from 'react-hot-toast';

interface ForeignKeyOption {
  value: number | string;
  label: string;
}

const AdminRecordForm: React.FC = () => {
  const { tableName, recordId } = useParams<{ tableName: string; recordId: string }>();
  const navigate = useNavigate();
  
  // Determine if this is a new record - check for 'new' or invalid/missing recordId
  const isNew = !recordId || recordId === 'new' || recordId === 'undefined' || recordId === 'null';
  
  // Redirect if recordId is invalid (undefined string, null, etc.)
  useEffect(() => {
    if (recordId && recordId !== 'new' && (recordId === 'undefined' || recordId === 'null')) {
      navigate(`/admin/tables/${tableName}`, { replace: true });
    }
  }, [recordId, tableName, navigate]);
  
  const [schema, setSchema] = useState<TableSchema[]>([]);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foreignKeyOptions, setForeignKeyOptions] = useState<Record<string, ForeignKeyOption[]>>({});

  const loadSchema = useCallback(async () => {
    if (!tableName) return;
    
    try {
      const schemaData = await adminService.getTableSchema(tableName);
      setSchema(schemaData);
      
      // Load foreign key options for relevant columns
      const fkColumns = schemaData.filter(col => 
        col.name.endsWith('_id') && col.name !== 'id'
      );
      
      const fkOptionsPromises = fkColumns.map(async (col) => {
        const refTable = col.name.replace('_id', 's'); // Simple pluralization
        // Map common FK patterns
        const tableMap: Record<string, string> = {
          'user_id': 'users',
          'admin_id': 'users',
          'question_id': 'questions',
          'session_id': 'quiz_sessions'
        };
        const actualTable = tableMap[col.name] || refTable;
        
        try {
          const options = await adminService.getForeignKeyOptions(actualTable);
          return { column: col.name, options };
        } catch {
          return { column: col.name, options: [] };
        }
      });
      
      const fkResults = await Promise.all(fkOptionsPromises);
      const fkOptionsMap: Record<string, ForeignKeyOption[]> = {};
      fkResults.forEach(({ column, options }) => {
        fkOptionsMap[column] = options;
      });
      
      // Special handling: Load question_type options from question_types table
      if (tableName === 'questions') {
        try {
          const questionTypeOptions = await adminService.getForeignKeyOptions('question_types');
          // Map to use 'name' field as both value and label
          fkOptionsMap['question_type'] = questionTypeOptions.map(opt => ({
            value: opt.label, // Use the name as the value (not the id)
            label: opt.label
          }));
        } catch {
          console.log('Could not load question_type options');
        }
      }
      
      setForeignKeyOptions(fkOptionsMap);
      
      return schemaData;
    } catch (err) {
      setError('Failed to load schema');
      console.error(err);
      return [];
    }
  }, [tableName]);

  const loadRecord = useCallback(async (_schemaData: TableSchema[]) => {
    if (!tableName || !recordId || isNew) return;
    
    try {
      const record = await adminService.getRecord(tableName, recordId);
      setFormData(record);
    } catch (err) {
      setError('Failed to load record');
      console.error(err);
    }
  }, [tableName, recordId, isNew]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const schemaData = await loadSchema();
      if (schemaData && schemaData.length > 0) {
        await loadRecord(schemaData);
      }
      setLoading(false);
    };
    init();
  }, [loadSchema, loadRecord]);

  const handleChange = (name: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableName) return;
    
    try {
      setSaving(true);
      setError(null);
      
      // Filter out non-editable fields
      const editableData: Record<string, unknown> = {};
      schema.forEach(col => {
        if (!col.isPrimaryKey && 
            !['created_at', 'updated_at', 'password_hash'].includes(col.name) &&
            formData[col.name] !== undefined) {
          editableData[col.name] = formData[col.name];
        }
      });
      
      // Add password for new users (not in schema but required)
      if (isNew && tableName === 'users' && formData.password) {
        editableData.password = formData.password;
      }
      
      if (isNew) {
        await adminService.createRecord(tableName, editableData);
        toast.success('Record created successfully');
      } else if (recordId && recordId !== 'undefined' && recordId !== 'null') {
        await adminService.updateRecord(tableName, recordId, editableData);
        toast.success('Record updated successfully');
      } else {
        throw new Error('Invalid record ID');
      }
      
      navigate(`/admin/tables/${tableName}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save record';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const getInputType = (column: TableSchema): string => {
    const type = column.type.toLowerCase();
    
    if (type.includes('int') || type.includes('decimal') || type.includes('numeric') || type.includes('float') || type.includes('double')) {
      return 'number';
    }
    if (type.includes('bool')) {
      return 'checkbox';
    }
    if (type.includes('date') && !type.includes('timestamp')) {
      return 'date';
    }
    if (type.includes('timestamp') || type.includes('datetime')) {
      return 'datetime-local';
    }
    if (type.includes('text') || type.includes('json')) {
      return 'textarea';
    }
    if (column.name.includes('email')) {
      return 'email';
    }
    if (column.name.includes('password')) {
      return 'password';
    }
    if (column.name.includes('url') || column.name.includes('link')) {
      return 'url';
    }
    
    return 'text';
  };

  const renderField = (column: TableSchema) => {
    const value = formData[column.name];
    const inputType = getInputType(column);
    const isReadOnly = column.isPrimaryKey || 
                       ['created_at', 'updated_at', 'password_hash'].includes(column.name);
    
    // Check if this is a foreign key field or has dropdown options
    if (foreignKeyOptions[column.name] && foreignKeyOptions[column.name].length > 0) {
      // Determine if we should parse as int (for _id fields) or keep as string
      const isIntegerField = column.name.endsWith('_id');
      
      return (
        <select
          id={column.name}
          value={value as string || ''}
          onChange={(e) => {
            const newValue = e.target.value;
            if (!newValue) {
              handleChange(column.name, null);
            } else if (isIntegerField) {
              handleChange(column.name, parseInt(newValue));
            } else {
              handleChange(column.name, newValue);
            }
          }}
          disabled={isReadOnly}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 disabled:bg-gray-100"
        >
          <option value="">Select...</option>
          {foreignKeyOptions[column.name].map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }
    
    // Role field - show as dropdown
    if (column.name === 'role') {
      return (
        <select
          id={column.name}
          value={value as string || 'user'}
          onChange={(e) => handleChange(column.name, e.target.value)}
          disabled={isReadOnly}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 disabled:bg-gray-100"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      );
    }
    
    // Boolean checkbox
    if (inputType === 'checkbox') {
      return (
        <input
          type="checkbox"
          id={column.name}
          checked={Boolean(value)}
          onChange={(e) => handleChange(column.name, e.target.checked)}
          disabled={isReadOnly}
          className="w-5 h-5 text-blue-900 border-gray-300 rounded focus:ring-blue-900 disabled:bg-gray-100"
        />
      );
    }
    
    // Textarea for text/json
    if (inputType === 'textarea') {
      return (
        <textarea
          id={column.name}
          value={value !== null && value !== undefined ? String(value) : ''}
          onChange={(e) => handleChange(column.name, e.target.value)}
          disabled={isReadOnly}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 disabled:bg-gray-100 font-mono text-sm"
        />
      );
    }
    
    // Datetime-local needs special formatting
    if (inputType === 'datetime-local') {
      const dateValue = value ? new Date(value as string).toISOString().slice(0, 16) : '';
      return (
        <input
          type="datetime-local"
          id={column.name}
          value={dateValue}
          onChange={(e) => handleChange(column.name, e.target.value ? new Date(e.target.value).toISOString() : null)}
          disabled={isReadOnly}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 disabled:bg-gray-100"
        />
      );
    }
    
    // Number input
    if (inputType === 'number') {
      return (
        <input
          type="number"
          id={column.name}
          value={value !== null && value !== undefined ? Number(value) : ''}
          onChange={(e) => handleChange(column.name, e.target.value ? parseFloat(e.target.value) : null)}
          disabled={isReadOnly}
          step={column.type.includes('int') ? '1' : 'any'}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 disabled:bg-gray-100"
        />
      );
    }
    
    // Default text input
    return (
      <input
        type={inputType}
        id={column.name}
        value={value !== null && value !== undefined ? String(value) : ''}
        onChange={(e) => handleChange(column.name, e.target.value || null)}
        disabled={isReadOnly}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 disabled:bg-gray-100"
      />
    );
  };

  const editableSchema = schema.filter(col => 
    !['password_hash'].includes(col.name)
  );

  // Add password field for new users
  const showPasswordField = isNew && tableName === 'users';

  return (
    <AdminLayout
      title={isNew ? `New ${tableName}` : `Edit ${tableName} #${recordId}`}
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'Tables', href: '/admin/tables' },
        { label: tableName || '', href: `/admin/tables/${tableName}` },
        { label: isNew ? 'New Record' : `#${recordId}` }
      ]}
    >
      <div className="max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to={`/admin/tables/${tableName}`}
            className="p-2 text-gray-500 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-blue-900">
              {isNew ? `Create New Record` : `Edit Record #${recordId}`}
            </h1>
            <p className="text-gray-600 font-medium">Table: {tableName}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-900" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-6">
              {/* Password field for new users */}
              {showPasswordField && (
                <div>
                  <label 
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    password
                    <span className="ml-1 text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={formData.password as string || ''}
                    onChange={(e) => handleChange('password', e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                    placeholder="Minimum 8 characters"
                    minLength={8}
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Password must be at least 8 characters
                  </p>
                </div>
              )}
              
              {editableSchema.map((column) => {
                const isReadOnly = column.isPrimaryKey || 
                                   ['created_at', 'updated_at'].includes(column.name);
                const inputType = getInputType(column);
                
                return (
                  <div key={column.name} className={inputType === 'checkbox' ? 'flex items-center gap-3' : ''}>
                    <label 
                      htmlFor={column.name}
                      className={`block text-sm font-medium text-gray-700 ${inputType === 'checkbox' ? 'order-2' : 'mb-1'}`}
                    >
                      {column.name}
                      {column.isPrimaryKey && (
                        <span className="ml-1 text-yellow-500" title="Primary Key">🔑</span>
                      )}
                      {!column.isNullable && !column.isPrimaryKey && (
                        <span className="ml-1 text-red-500">*</span>
                      )}
                      {isReadOnly && (
                        <span className="ml-2 text-xs text-gray-400">(read-only)</span>
                      )}
                    </label>
                    
                    <div className={inputType === 'checkbox' ? 'order-1' : ''}>
                      {renderField(column)}
                    </div>
                    
                    {column.defaultValue && !isReadOnly && (
                      <p className="mt-1 text-xs text-gray-500">
                        Default: {column.defaultValue}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-3">
              <Link
                to={`/admin/tables/${tableName}`}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-slate-50 hover:border-blue-900 transition-colors font-medium"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 font-medium transition-colors"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isNew ? 'Create Record' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminRecordForm;
