import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';

const Header = () => {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Don't show header on quiz page for full-screen experience
  if (location.pathname === '/quiz') {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <Link 
              to="/" 
              className="text-2xl font-bold text-blue-primary hover:text-blue-dark transition-colors duration-200"
            >
              Sydney
            </Link>
          </div>

          {/* Navigation Menu */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/"
              className={`text-base font-medium transition-colors duration-200 ${
                location.pathname === '/' 
                  ? 'text-blue-primary border-b-2 border-blue-primary pb-1' 
                  : 'text-gray-700 hover:text-blue-primary'
              }`}
            >
              Home
            </Link>
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className={`text-base font-medium transition-colors duration-200 ${
                  location.pathname === '/dashboard' 
                    ? 'text-blue-primary border-b-2 border-blue-primary pb-1' 
                    : 'text-gray-700 hover:text-blue-primary'
                }`}
              >
                Dashboard
              </Link>
            )}
            <a
              href="#resources"
              className="text-base font-medium text-gray-700 hover:text-blue-primary transition-colors duration-200"
            >
              Resources
            </a>
            <a
              href="#pricing"
              className="text-base font-medium text-gray-700 hover:text-blue-primary transition-colors duration-200"
            >
              Pricing
            </a>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button - placeholder for now */}
            <div className="md:hidden">
              <button
                type="button"
                className="text-gray-700 hover:text-blue-primary focus:outline-none focus:text-blue-primary transition-colors duration-200"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
            
            {/* Authentication Actions */}
            {isAuthenticated ? (
              <div className="relative">
                {/* User Menu Button */}
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-primary focus:ring-offset-2 rounded-md"
                >
                  <User size={20} />
                  <span className="hidden sm:inline">
                    {user?.first_name || user?.username || 'User'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b">
                        <p className="font-medium">
                          {user?.first_name && user?.last_name 
                            ? `${user.first_name} ${user.last_name}`
                            : user?.username
                          }
                        </p>
                        <p className="text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center space-x-2"
                      >
                        <LogOut size={16} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-700 hover:text-blue-primary transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-primary hover:bg-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-primary transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;