# Phase 3: Admin Panel Implementation

## Overview
Implementation of a Django-like admin panel that allows administrators to manage all database tables through a web interface. The admin section is only accessible to users with admin privileges.

## Implementation Date
December 5, 2025

---

## Database Changes

### Migration: `003_admin_roles.sql`
```sql
-- Added role column to users table
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';

-- Created admin activity log table
CREATE TABLE admin_activity_log (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id INTEGER,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Backend Implementation

### 1. Admin Middleware (`backend/src/middleware/adminAuth.ts`)

#### `requireAdmin`
- Validates JWT token
- Checks if user has `role === 'admin'`
- Returns 403 if not authorized

#### `logAdminActivity`
- Logs all admin actions to `admin_activity_log` table
- Captures: admin_id, action, table_name, record_id, details

### 2. Admin Service (`backend/src/services/adminService.ts`)

| Method | Description |
|--------|-------------|
| `getTableList()` | Returns all manageable tables with record counts |
| `getTableSchema(tableName)` | Returns column definitions for a table |
| `getTableData(tableName, options)` | Paginated data with search/sort/filter |
| `getRecord(tableName, id)` | Single record by ID |
| `createRecord(tableName, data)` | Insert new record |
| `updateRecord(tableName, id, data)` | Update existing record |
| `deleteRecord(tableName, id)` | Remove record |
| `getStats()` | Dashboard statistics |
| `getRecentActivity(limit)` | Recent admin actions |
| `getForeignKeyOptions(tableName)` | Dropdown options for FK fields |

**Managed Tables:**
- `users`
- `questions`
- `question_attempts`
- `quiz_sessions`
- `player_ratings`
- `micro_ratings`
- `admin_activity_log`

### 3. Admin Routes (`backend/src/routes/admin.ts`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/tables` | GET | List all tables |
| `/api/admin/tables/:tableName` | GET | Get paginated table data |
| `/api/admin/tables/:tableName/schema` | GET | Get table schema |
| `/api/admin/tables/:tableName` | POST | Create record |
| `/api/admin/tables/:tableName/:id` | GET | Get single record |
| `/api/admin/tables/:tableName/:id` | PUT | Update record |
| `/api/admin/tables/:tableName/:id` | DELETE | Delete record |
| `/api/admin/stats` | GET | Dashboard statistics |
| `/api/admin/activity` | GET | Recent activity log |

---

## Frontend Implementation

### 1. Admin Service (`src/services/adminService.ts`)
API wrapper with TypeScript interfaces for all admin operations.

**Key Types:**
```typescript
interface TableInfo {
  name: string;
  recordCount: number;
  columns: string[];
}

interface TableSchema {
  column_name: string;
  data_type: string;
  is_nullable: string;
  is_primary_key: boolean;
  is_foreign_key: boolean;
}

interface AdminStats {
  totalUsers: number;
  adminUsers: number;
  totalQuestions: number;
  totalQuizSessions: number;
  totalAttempts: number;
  avgCorrectRate: number;
}

interface AdminActivity {
  id: string;
  action: string;
  table_name: string;
  record_id?: string;
  admin_email?: string;
  created_at: string;
}
```

### 2. Components

#### `AdminRoute` (`src/components/common/AdminRoute.tsx`)
- Protected route wrapper for admin pages
- Checks authentication and admin role
- Redirects unauthorized users to dashboard

#### `AdminLayout` (`src/components/admin/AdminLayout.tsx`)
- Consistent admin panel layout
- Sidebar navigation with links to:
  - Dashboard
  - All Tables
  - Users
  - Questions
  - Quiz Sessions
  - Activity Log
- Dynamic breadcrumb navigation
- "Back to App" link

### 3. Admin Pages

#### `AdminDashboard` (`src/pages/admin/AdminDashboard.tsx`)
- Statistics cards (users, questions, sessions, attempts)
- Quick action links
- Recent activity feed
- Performance metrics with category breakdown

#### `AdminTables` (`src/pages/admin/AdminTables.tsx`)
- Grid of all database tables
- Shows table name, column count, record count
- Search/filter functionality

#### `AdminTableDetail` (`src/pages/admin/AdminTableDetail.tsx`)
- Paginated data table view
- Column sorting
- Search functionality
- View/Edit/Delete actions per row
- CSV export
- Modal for viewing full record details

#### `AdminRecordForm` (`src/pages/admin/AdminRecordForm.tsx`)
- Dynamic form generation based on table schema
- Supports all data types:
  - Text, Number, Boolean
  - Date, DateTime
  - Textarea for JSON/text
  - Dropdowns for foreign keys
  - Role selection for users
- Create and Edit modes
- Validation feedback

#### `AdminActivityLog` (`src/pages/admin/AdminActivityLog.tsx`)
- Filterable activity list
- Filter by action type (CREATE, UPDATE, DELETE)
- Filter by table name
- Grouped by date
- Shows admin email, timestamp, record ID

### 4. Routing Updates

#### `App.tsx`
```typescript
// Admin routes
<Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
<Route path="/admin/tables" element={<AdminRoute><AdminTables /></AdminRoute>} />
<Route path="/admin/tables/:tableName" element={<AdminRoute><AdminTableDetail /></AdminRoute>} />
<Route path="/admin/tables/:tableName/new" element={<AdminRoute><AdminRecordForm /></AdminRoute>} />
<Route path="/admin/tables/:tableName/:recordId" element={<AdminRoute><AdminRecordForm /></AdminRoute>} />
<Route path="/admin/activity" element={<AdminRoute><AdminActivityLog /></AdminRoute>} />
```

#### `Header.tsx`
- Added admin link in user dropdown menu
- Only visible when `user.role === 'admin'`
- Purple styling to distinguish from regular links

---

## Dependencies Added

```json
{
  "react-hot-toast": "^2.x.x"
}
```
Used for success/error notifications on CRUD operations.

---

## Security Features

1. **Authentication Required**: All admin routes require valid JWT
2. **Role-Based Access**: Only users with `role: 'admin'` can access
3. **Sensitive Field Protection**: Password hashes never exposed via API
4. **Audit Trail**: All admin actions logged with timestamp and admin ID
5. **CORS Protected**: Same origin policy enforced

---

## File Structure

```
backend/
├── src/
│   ├── middleware/
│   │   └── adminAuth.ts          # Admin authentication middleware
│   ├── services/
│   │   └── adminService.ts       # Admin business logic
│   └── routes/
│       └── admin.ts              # Admin API endpoints

src/
├── components/
│   ├── common/
│   │   └── AdminRoute.tsx        # Protected route component
│   └── admin/
│       └── AdminLayout.tsx       # Admin panel layout
├── pages/
│   └── admin/
│       ├── AdminDashboard.tsx    # Statistics overview
│       ├── AdminTables.tsx       # Table listing
│       ├── AdminTableDetail.tsx  # Table data view
│       ├── AdminRecordForm.tsx   # Create/Edit form
│       └── AdminActivityLog.tsx  # Activity audit
└── services/
    └── adminService.ts           # Frontend API wrapper

database/
└── migrations/
    └── 003_admin_roles.sql       # Admin role migration
```

---

## Usage

### Accessing the Admin Panel
1. Log in with an admin account
2. Click user menu → "Admin Panel"
3. Or navigate directly to `/admin`

### Managing Records
1. Navigate to desired table
2. Use search/sort to find records
3. Click eye icon to view details
4. Click pencil icon to edit
5. Click trash icon to delete
6. Click "Add Record" to create new

### Promoting User to Admin
```sql
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';
```

---

## Screenshots Reference

| Page | URL |
|------|-----|
| Dashboard | `/admin` |
| Tables List | `/admin/tables` |
| Users Table | `/admin/tables/users` |
| Edit User | `/admin/tables/users/1` |
| New Question | `/admin/tables/questions/new` |
| Activity Log | `/admin/activity` |

---

## Future Enhancements

- [ ] Bulk actions (delete multiple, export selected)
- [ ] Advanced filtering with multiple conditions
- [ ] Table relationship visualization
- [ ] Database backup/restore from UI
- [ ] Admin user management page
- [ ] Custom dashboard widgets
- [ ] Role-based permissions (view-only admin, etc.)
