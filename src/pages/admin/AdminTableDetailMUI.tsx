import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  TextField,
  Button,
  IconButton,
  Toolbar,
  Typography,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { adminService } from '../../services/adminService';
import type { TableSchema, PaginatedResult } from '../../services/adminService';
import AdminLayout from '../../components/admin/AdminLayout';
import { toast } from 'react-hot-toast';

const AdminTableDetailMUI: React.FC = () => {
  const { tableName } = useParams<{ tableName: string }>();
  
  const [schema, setSchema] = useState<TableSchema[]>([]);
  const [data, setData] = useState<PaginatedResult<Record<string, unknown>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination & filtering
  const [page, setPage] = useState(0); // MUI uses 0-based pagination
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
          page: page + 1, // Convert to 1-based for API
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
    setPage(0);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
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

  const formatCellValue = (value: unknown, col: TableSchema): string => {
    if (value === null || value === undefined) return '-';
    if (col.name.includes('date') || col.name.includes('_at')) {
      return new Date(value as string).toLocaleString();
    }
    if (typeof value === 'boolean') return value ? '✓' : '✗';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const getPrimaryKey = (): string => {
    const pkColumn = schema.find(col => col.isPrimaryKey);
    return pkColumn?.name || 'id';
  };

  const exportToCSV = () => {
    if (!data || !schema) return;
    
    const headers = visibleColumns.map(col => col.name).join(',');
    const rows = data.data.map(row => 
      visibleColumns.map(col => {
        const value = formatCellValue(row[col.name], col);
        return `"${value.replace(/"/g, '""')}"`;
      }).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
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
  );

  return (
    <AdminLayout
      title={tableName || 'Table'}
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'Tables', href: '/admin/tables' },
        { label: tableName || '' }
      ]}
    >
      <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
        {/* Header */}
        <Paper sx={{ mb: 2, p: 2, maxWidth: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h4" component="h1" gutterBottom sx={{ wordBreak: 'break-word' }}>
                {tableName}
              </Typography>
              {data && (
                <Typography variant="body2" color="text.secondary">
                  {data.total.toLocaleString()} records · {schema.length} columns
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                startIcon={<DownloadIcon />}
                onClick={exportToCSV}
                disabled={!data || data.data.length === 0}
                variant="outlined"
              >
                Export CSV
              </Button>
              <Button
                startIcon={<RefreshIcon />}
                onClick={loadData}
                disabled={loading}
                variant="outlined"
              >
                Refresh
              </Button>
              <Button
                component={Link}
                to={`/admin/tables/${tableName}/new`}
                startIcon={<AddIcon />}
                variant="contained"
              >
                Add Record
              </Button>
            </Box>
          </Box>

          {/* Search */}
          <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              placeholder="Search records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button type="submit" variant="contained" sx={{ minWidth: 100 }}>
              Search
            </Button>
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <CircularProgress />
          </Box>
        ) : data && data.data.length > 0 ? (
          <Paper sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 400px)', width: '100%' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    {visibleColumns.map((col) => (
                      <TableCell
                        key={col.name}
                        sortDirection={sortBy === col.name ? sortOrder : false}
                        sx={{ minWidth: 120, fontWeight: 'bold', bgcolor: 'grey.50' }}
                      >
                        <TableSortLabel
                          active={sortBy === col.name}
                          direction={sortBy === col.name ? sortOrder : 'asc'}
                          onClick={() => handleSort(col.name)}
                        >
                          {col.name}
                          {col.isPrimaryKey && (
                            <Chip label="PK" size="small" color="primary" sx={{ ml: 1, height: 20 }} />
                          )}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                    <TableCell align="right" sx={{ minWidth: 150, fontWeight: 'bold', bgcolor: 'grey.50' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.data.map((row, index) => {
                    const pk = getPrimaryKey();
                    const recordId = row[pk] as number;
                    
                    return (
                      <TableRow key={recordId || index} hover>
                        {visibleColumns.map((col) => (
                          <TableCell 
                            key={col.name}
                            sx={{ 
                              maxWidth: 300,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {formatCellValue(row[col.name], col)}
                          </TableCell>
                        ))}
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => setViewRecord(row)}
                              color="primary"
                              title="View"
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              component={Link}
                              to={`/admin/tables/${tableName}/${recordId}`}
                              color="primary"
                              title="Edit"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => setDeleteId(recordId)}
                              color="error"
                              title="Delete"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 20, 50, 100]}
              component="div"
              count={data.total}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        ) : (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No records found
            </Typography>
            <Button
              component={Link}
              to={`/admin/tables/${tableName}/new`}
              startIcon={<AddIcon />}
              variant="contained"
              sx={{ mt: 2 }}
            >
              Add First Record
            </Button>
          </Paper>
        )}

        {/* View Record Dialog */}
        <Dialog
          open={!!viewRecord}
          onClose={() => setViewRecord(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Record Details</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'grid', gap: 2 }}>
              {viewRecord && schema.filter(col => !['password_hash', 'password'].includes(col.name)).map((col) => (
                <Box key={col.name} sx={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                    {col.name}
                    {col.isPrimaryKey && ' 🔑'}
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    {formatCellValue(viewRecord[col.name], col)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewRecord(null)}>Close</Button>
            {viewRecord && (
              <Button
                component={Link}
                to={`/admin/tables/${tableName}/${viewRecord[getPrimaryKey()]}`}
                variant="contained"
              >
                Edit Record
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteId !== null}
          onClose={() => setDeleteId(null)}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete record #{deleteId}? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteId(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button onClick={handleDelete} disabled={deleting} color="error" variant="contained">
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
};

export default AdminTableDetailMUI;
