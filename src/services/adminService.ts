import api, { apiHelpers } from './api';

// =============================================================================
// Admin Service Types
// =============================================================================

export interface TableInfo {
  name: string;
  recordCount: number;
  count: number; // Alias for compatibility
  columns: string[];
}

export interface TableSchema {
  column_name: string;
  name: string; // Alias for compatibility
  data_type: string;
  type: string; // Alias for compatibility
  is_nullable: string;
  isNullable: boolean; // Alias for compatibility
  column_default: string | null;
  defaultValue: string | null; // Alias for compatibility
  character_maximum_length: number | null;
  is_primary_key: boolean;
  isPrimaryKey: boolean; // Alias for compatibility
  is_foreign_key: boolean;
  foreign_table?: string;
  foreign_column?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ForeignKeyOption {
  id: string;
  value: number; // Alias for compatibility
  label: string;
}

export interface AdminStats {
  users: {
    total_users: string;
    admin_count: string;
    new_users_week: string;
  };
  questions: {
    total_questions: string;
    categories: string;
    avg_attempts: string;
  };
  sessions: {
    total_sessions: string;
    completed_sessions: string;
    sessions_this_week: string;
  };
  attempts: {
    total_attempts: string;
    correct_attempts: string;
    accuracy_rate: string;
  };
  ratings: {
    avg_rating: string;
    min_rating: number;
    max_rating: number;
  };
  // Computed aliases for UI convenience
  totalUsers: number;
  adminUsers: number;
  totalQuestions: number;
  totalQuizSessions: number;
  totalAttempts: number;
  totalRatings: number;
  avgCorrectRate: number;
  totalMicroRatings: number;
  questionsPerCategory: { category: string; count: number }[];
}

export interface AdminActivity {
  id: string;
  action: string;
  table_name: string;
  record_id?: string;
  created_at: string;
  admin_username?: string;
  admin_email?: string;
  username?: string;
  activity_type?: string;
  details?: Record<string, unknown>;
}

export interface GetTableDataParams {
  page?: number;
  limit?: number;
  search?: string;
  sortColumn?: string;
  sortBy?: string; // Alias
  sortDirection?: 'ASC' | 'DESC';
  sortOrder?: 'asc' | 'desc'; // Alias
  filters?: Record<string, unknown>;
}

// =============================================================================
// Admin Service
// =============================================================================

export const adminService = {
  /**
   * Get list of all manageable tables
   */
  async getTables(): Promise<TableInfo[]> {
    try {
      const response = await api.get('/admin/tables');
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get tables');
      }
      
      // Add alias for count
      return response.data.data.map((table: TableInfo) => ({
        ...table,
        count: table.recordCount || table.count || 0
      }));
    } catch (error: unknown) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Get table schema/structure
   */
  async getTableSchema(tableName: string): Promise<TableSchema[]> {
    try {
      const response = await api.get(`/admin/tables/${tableName}/schema`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get table schema');
      }
      
      // Add aliases for compatibility
      return response.data.data.map((col: TableSchema) => ({
        ...col,
        name: col.column_name || col.name,
        type: col.data_type || col.type,
        isPrimaryKey: col.is_primary_key || col.isPrimaryKey,
        isNullable: col.is_nullable === 'YES' || col.isNullable,
        defaultValue: col.column_default || col.defaultValue
      }));
    } catch (error: unknown) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Get paginated table data
   */
  async getTableData(
    tableName: string,
    params: GetTableDataParams = {}
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      // Support both sortColumn and sortBy
      const sortCol = params.sortColumn || params.sortBy;
      if (sortCol) queryParams.append('sortColumn', sortCol);
      // Support both sortDirection and sortOrder
      const sortDir = params.sortDirection || (params.sortOrder?.toUpperCase() as 'ASC' | 'DESC');
      if (sortDir) queryParams.append('sortDirection', sortDir);
      
      // Add any additional filters
      if (params.filters) {
        for (const [key, value] of Object.entries(params.filters)) {
          queryParams.append(key, String(value));
        }
      }
      
      const queryString = queryParams.toString();
      const url = `/admin/tables/${tableName}${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get table data');
      }
      
      return response.data.data;
    } catch (error: unknown) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Get a single record by ID
   */
  async getRecord(tableName: string, id: string | number): Promise<Record<string, unknown>> {
    try {
      const response = await api.get(`/admin/tables/${tableName}/${id}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get record');
      }
      
      return response.data.data;
    } catch (error: unknown) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Create a new record
   */
  async createRecord(tableName: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const response = await api.post(`/admin/tables/${tableName}`, data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create record');
      }
      
      return response.data.data;
    } catch (error: unknown) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Update an existing record
   */
  async updateRecord(tableName: string, id: string | number, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const response = await api.put(`/admin/tables/${tableName}/${id}`, data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update record');
      }
      
      return response.data.data;
    } catch (error: unknown) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Delete a record
   */
  async deleteRecord(tableName: string, id: string | number): Promise<boolean> {
    try {
      const response = await api.delete(`/admin/tables/${tableName}/${id}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete record');
      }
      
      return true;
    } catch (error: unknown) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Get foreign key options for a column
   */
  async getForeignKeyOptions(tableName: string, column?: string): Promise<ForeignKeyOption[]> {
    try {
      // If no column specified, get options directly from the table
      const url = column 
        ? `/admin/tables/${tableName}/fk/${column}`
        : `/admin/tables/${tableName}/options`;
      const response = await api.get(url);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get FK options');
      }
      
      // Map to add value alias
      return response.data.data.map((opt: ForeignKeyOption) => ({
        ...opt,
        value: opt.id ?? opt.value,
        label: opt.label
      }));
    } catch (error: unknown) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Get dashboard statistics
   */
  async getStats(): Promise<AdminStats> {
    try {
      const response = await api.get('/admin/stats');
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get stats');
      }
      
      const data = response.data.data;
      
      // Add computed aliases for UI convenience
      return {
        ...data,
        totalUsers: parseInt(data.users?.total_users) || 0,
        adminUsers: parseInt(data.users?.admin_count) || 0,
        totalQuestions: parseInt(data.questions?.total_questions) || 0,
        totalQuizSessions: parseInt(data.sessions?.total_sessions) || 0,
        totalAttempts: parseInt(data.attempts?.total_attempts) || 0,
        totalRatings: parseInt(data.ratings?.total_ratings) || 0,
        avgCorrectRate: parseFloat(data.attempts?.accuracy_rate) || 0,
        totalMicroRatings: parseInt(data.ratings?.total_ratings) || 0,
        questionsPerCategory: []
      };
    } catch (error: unknown) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Get recent admin activity
   */
  async getRecentActivity(limit: number = 20): Promise<AdminActivity[]> {
    try {
      const response = await api.get(`/admin/activity?limit=${limit}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get activity');
      }
      
      return response.data.data;
    } catch (error: unknown) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Get recent system activity
   */
  async getSystemActivity(limit: number = 20): Promise<AdminActivity[]> {
    try {
      const response = await api.get(`/admin/system-activity?limit=${limit}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get system activity');
      }
      
      return response.data.data;
    } catch (error: unknown) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },
};

export default adminService;
