import React, { useState, useRef } from 'react';
import { Sprout, Database, Trash2, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';

const DatabaseManagement: React.FC = () => {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Table Management state
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [clearingTables, setClearingTables] = useState(false);
  const [_clearResult, setClearResult] = useState<any>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Predefined seed files state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadStatus, setLoadStatus] = useState<'idle' | 'selected' | 'loading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Table Management Functions
  const availableTables = [
    'users',
    'categories',
    'questions',
    'question_categories',
    'question_attempts',
    'quiz_sessions',
    'player_ratings',
    'micro_ratings'
  ];

  const handleTableSelection = (tableName: string) => {
    setSelectedTables(prev =>
      prev.includes(tableName)
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    );
  };

  const clearSelectedTables = async () => {
    if (selectedTables.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one table to clear' });
      return;
    }

    setClearingTables(true);
    setMessage(null);

    try {
      const response = await api.post('/admin/database/clear-tables', {
        tableNames: selectedTables,
        confirmation: 'DELETE'
      });

      setClearResult(response.data.data);
      setMessage({
        type: response.data.success ? 'success' : 'error',
        text: response.data.message
      });
      setSelectedTables([]);
      setShowClearConfirm(false);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to clear tables'
      });
    } finally {
      setClearingTables(false);
    }
  };

  // Seed Loading Function
  const loadSeedFile = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a seed file first' });
      return;
    }

    setLoadStatus('loading');
    setUploadProgress(0);
    setMessage(null);

    const startTime = Date.now();
    const minDuration = 2000; // 2 seconds minimum

    try {
      const formData = new FormData();
      formData.append('seedFile', selectedFile);

      const response = await api.post('/admin/database/load-seeds', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(percentCompleted);
        },
      });

      // Ensure minimum loading time for better UX
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minDuration - elapsedTime);

      if (remainingTime > 0) {
        // Animate progress to 100% smoothly
        const animationSteps = 20;
        const stepDuration = remainingTime / animationSteps;

        for (let i = 0; i <= animationSteps; i++) {
          setTimeout(() => {
            const progress = Math.min(100, 80 + (i / animationSteps) * 20); // Go from current progress to 100%
            setUploadProgress(progress);
          }, i * stepDuration);
        }

        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      setLoadStatus('success');
      setMessage({
        type: 'success',
        text: `Seed file loaded successfully! ${(Object.values(response.data.data.insertedRows) as number[]).reduce((a: number, b: number) => a + b, 0)} rows inserted.`
      });

      // Clear the selected file after successful upload
      setTimeout(() => {
        setSelectedFile(null);
        setLoadStatus('idle');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 3000); // Show success state for 3 seconds

    } catch (error: any) {
      // Ensure minimum loading time even for errors
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minDuration - elapsedTime);

      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      setLoadStatus('error');
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to load seed file'
      });
    }
  };

  // File selection handler
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.sql')) {
        setMessage({ type: 'error', text: 'Please select a .sql file' });
        return;
      }
      setSelectedFile(file);
      setLoadStatus('selected');
      setMessage(null);
    }
  };

  // Button click handler
  const handleButtonClick = () => {
    if (selectedFile && loadStatus === 'selected') {
      loadSeedFile();
    } else {
      fileInputRef.current?.click();
    }
  };

  return (
    <AdminLayout
      breadcrumbs={[
        { label: 'Home', href: '/admin' },
        { label: 'Database Management' }
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-blue-900">Database Management</h1>
            <p className="text-gray-600 mt-1">Manage table data and load predefined seed files</p>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-lg border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {message.text}
          </div>
        )}

        {/* Table Data Management Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="text-red-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-red-600">Table Data Management</h2>
              <p className="text-sm text-gray-600">Clear data from tables without affecting schema</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Tables to Clear
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {availableTables.map(table => (
                  <label key={table} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedTables.includes(table)}
                      onChange={() => handleTableSelection(table)}
                      className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                    />
                    <span className="text-sm text-gray-700 capitalize">{table.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Clear Data Warning */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <Trash2 className="text-red-600" size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-red-800 mb-1">⚠️ Data Deletion Warning</h3>
                  <p className="text-sm text-red-700 mb-2">
                    This action will permanently delete all data from the selected tables. This cannot be undone.
                  </p>
                  <p className="text-sm text-red-700">
                    <strong>Note:</strong> Table schemas and relationships will remain intact. Foreign key constraints may prevent deletion if related data exists in other tables.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(true)}
                disabled={selectedTables.length === 0}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <Trash2 size={16} />
                Clear Selected Tables
              </button>
              <button
                onClick={() => setSelectedTables([])}
                disabled={selectedTables.length === 0}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors duration-200"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>

        {/* Predefined Seed Data Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <RefreshCw className="text-purple-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-purple-600">Predefined Seed Data</h2>
              <p className="text-sm text-gray-600">Quick load common seed data files</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Seed Data Upload */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Database className="text-purple-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Seed Data Upload</h3>
                  <p className="text-sm text-gray-600">Upload any .sql seed file (users, categories, questions, relationships, etc.)</p>
                </div>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".sql"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Status Bar */}
              <div className="h-8 mb-4 flex items-center">
                {loadStatus === 'idle' && (
                  <span className="text-sm text-gray-500">No file selected</span>
                )}
                {loadStatus === 'selected' && selectedFile && (
                  <span className="text-sm text-purple-700 flex items-center gap-2">
                    📄 {selectedFile.name}
                  </span>
                )}
                {loadStatus === 'loading' && (
                  <span className="text-sm text-orange-700 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </span>
                )}
                {loadStatus === 'success' && (
                  <span className="text-sm text-green-700 flex items-center gap-2">
                    ✅ Successfully loaded
                  </span>
                )}
                {loadStatus === 'error' && (
                  <span className="text-sm text-red-700 flex items-center gap-2">
                    ❌ Upload failed
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              {loadStatus === 'loading' && (
                <div className="mb-6">
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-600 mt-2 text-center">
                    {uploadProgress < 100 ? `${uploadProgress}% uploaded` : 'Processing...'}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleButtonClick}
                disabled={loadStatus === 'loading'}
                className={`w-full px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 ${
                  selectedFile && loadStatus === 'selected'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {selectedFile && loadStatus === 'selected' ? (
                  <>
                    <Sprout size={18} />
                    Load Seed File
                  </>
                ) : (
                  <>
                    <Database size={18} />
                    Browse SQL File...
                  </>
                )}
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">File Upload Instructions</h4>
              <div className="space-y-2 text-sm text-blue-800">
                <p>• Click <strong>"Browse SQL File..."</strong> to select any <code>.sql</code> seed file</p>
                <p>• Button changes to <strong>"Load Seed File"</strong> after selection</p>
                <p>• Progress bar shows upload status during loading</p>
                <p>• Success confirmation shows number of rows inserted</p>
                <p>• Supports any seed file: users, categories, questions, question_categories, etc.</p>
                <p>• Use files from the <code>database/seeds/</code> directory</p>
              </div>
            </div>
          </div>
        </div>

        {/* Clear Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirm Data Deletion</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-700 mb-3">
                  You are about to delete all data from the following tables:
                </p>
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <ul className="text-sm text-red-800 space-y-1">
                    {selectedTables.map(table => (
                      <li key={table} className="capitalize">• {table.replace('_', ' ')}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={clearSelectedTables}
                  disabled={clearingTables}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {clearingTables && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  {clearingTables ? 'Deleting...' : 'Delete Data'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default DatabaseManagement;