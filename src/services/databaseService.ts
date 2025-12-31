import api from './api';

export interface DatabaseOperationResponse {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
}

export interface ClearTablesRequest {
  tableNames: string[];
  confirmation: string;
}

export interface TableInfo {
  name: string;
  rowCount: number;
  isProtected: boolean;
  isCaution: boolean;
  hasForeignKeys: boolean;
}

export interface ClearTablesResponse extends DatabaseOperationResponse {
  data?: {
    clearedTables: string[];
    failedTables: { table: string; error: string }[];
    warnings?: string[];
  };
}

class DatabaseService {
  async getTableList(): Promise<string[]> {
    const response = await api.get('/admin/database/tables');
    return response.data.data;
  }

  async getTableInfo(): Promise<TableInfo[]> {
    const response = await api.get('/admin/database/tables-info');
    return response.data.data;
  }

  async clearTables(tableNames: string[], confirmation: string): Promise<ClearTablesResponse> {
    const response = await api.post('/admin/database/clear-tables', {
      tableNames,
      confirmation
    });
    return response.data;
  }

  async uploadSchema(file: File): Promise<DatabaseOperationResponse> {
    const formData = new FormData();
    formData.append('schemaFile', file);

    const response = await api.post('/admin/database/execute-schema', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async uploadSeeds(file: File): Promise<DatabaseOperationResponse> {
    const formData = new FormData();
    formData.append('seedFile', file);

    const response = await api.post('/admin/database/load-seeds', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async exportSchema(): Promise<Blob> {
    const response = await api.get('/admin/database/export-schema', {
      responseType: 'blob'
    });
    return response.data;
  }
}

export default new DatabaseService();