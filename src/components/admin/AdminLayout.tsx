import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Database, 
  Users, 
  HelpCircle, 
  FileText,
  Activity,
  Settings,
  ChevronRight,
  Home
} from 'lucide-react';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: Breadcrumb[];
}

interface SidebarLink {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const sidebarLinks: SidebarLink[] = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'All Tables', href: '/admin/tables', icon: Database },
  { name: 'Database Management', href: '/admin/database', icon: Settings },
  { name: 'Users', href: '/admin/tables/users', icon: Users },
  { name: 'Questions', href: '/admin/tables/questions', icon: HelpCircle },
  { name: 'Quiz Sessions', href: '/admin/tables/quiz_sessions', icon: FileText },
  { name: 'Activity Log', href: '/admin/activity', icon: Activity },
];

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, breadcrumbs }) => {
  const location = useLocation();
  
  // Generate breadcrumbs from current path if not provided
  const getBreadcrumbs = (): Breadcrumb[] => {
    if (breadcrumbs) return breadcrumbs;
    
    const paths = location.pathname.split('/').filter(Boolean);
    const result: Breadcrumb[] = [];
    
    let currentPath = '';
    for (const path of paths) {
      currentPath += `/${path}`;
      const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/_/g, ' ');
      result.push({ label, href: currentPath });
    }
    
    return result;
  };

  const displayBreadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <nav className="bg-blue-900 shadow-md border-b border-blue-800 fixed top-0 left-0 right-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/admin" className="flex items-center">
                <Settings className="h-8 w-8 text-yellow-400" />
                <span className="ml-2 text-xl font-bold text-white">Admin Panel</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                to="/dashboard" 
                className="flex items-center text-blue-100 hover:text-white transition-colors font-medium"
              >
                <Home className="h-5 w-5 mr-1" />
                <span>Back to App</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md fixed left-0 top-16 bottom-0 overflow-y-auto border-r border-gray-200">
          <nav className="mt-5 px-2">
            <div className="space-y-1">
              {sidebarLinks.map((link) => {
                const isActive = location.pathname === link.href || 
                  (link.href !== '/admin' && location.pathname.startsWith(link.href));
                const Icon = link.icon;
                
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={`
                      group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                      ${isActive 
                        ? 'bg-blue-900 text-white border-l-4 border-blue-900' 
                        : 'text-gray-600 hover:bg-slate-100 hover:text-blue-900'
                      }
                    `}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-yellow-400' : 'text-gray-400 group-hover:text-blue-700'}`} />
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Quick Stats */}
          <div className="mt-8 px-4">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Quick Links
            </h3>
            <div className="mt-3 space-y-2">
              <Link 
                to="/admin/tables/player_ratings" 
                className="block text-sm text-gray-600 hover:text-blue-900 font-medium transition-colors"
              >
                Player Ratings
              </Link>
              <Link 
                to="/admin/tables/micro_ratings" 
                className="block text-sm text-gray-600 hover:text-blue-900 font-medium transition-colors"
              >
                Micro Ratings
              </Link>
              <Link 
                to="/admin/tables/question_attempts" 
                className="block text-sm text-gray-600 hover:text-blue-900 font-medium transition-colors"
              >
                Question Attempts
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-8 overflow-x-hidden max-w-full">
          {/* Breadcrumbs */}
          <nav className="flex mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <Link to="/admin" className="text-gray-400 hover:text-blue-900">
                  <Home className="h-4 w-4" />
                </Link>
              </li>
              {displayBreadcrumbs.map((crumb, index) => (
                <li key={crumb.href || index} className="flex items-center">
                  <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
                  {index === displayBreadcrumbs.length - 1 || !crumb.href ? (
                    <span className="text-sm font-medium text-blue-900">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link 
                      to={crumb.href} 
                      className="text-sm text-gray-500 hover:text-blue-900 font-medium transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          {/* Page Content */}
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
