import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { User, LogOut, Menu, Shield, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const Header = () => {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Don't show header on quiz page for full-screen experience
  if (location.pathname === '/quiz') {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-header border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <Link 
              to="/" 
              className="text-2xl font-bold bg-gradient-to-r from-navy-dark to-sky-blue bg-clip-text text-transparent hover:from-navy-medium hover:to-sky-blue transition-all duration-200"
            >
              Sopharium
            </Link>
          </div>

          {/* Desktop Navigation Menu */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/"
              className={`text-base font-medium transition-colors duration-200 ${
                isActive('/') 
                  ? 'text-navy-dark border-b-2 border-navy-dark pb-1' 
                  : 'text-gray-600 hover:text-navy-dark'
              }`}
            >
              Home
            </Link>
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className={`text-base font-medium transition-colors duration-200 ${
                  isActive('/dashboard') 
                    ? 'text-navy-dark border-b-2 border-navy-dark pb-1' 
                    : 'text-gray-600 hover:text-navy-dark'
                }`}
              >
                Dashboard
              </Link>
            )}
            <a
              href="#resources"
              className="text-base font-medium text-gray-600 hover:text-navy-dark transition-colors duration-200"
            >
              Resources
            </a>
            <a
              href="#about"
              className="text-base font-medium text-gray-600 hover:text-navy-dark transition-colors duration-200"
            >
              About
            </a>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="text-gray-600 hover:text-navy-dark focus:outline-none transition-colors duration-200"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
            
            {/* Authentication Actions */}
            {isAuthenticated ? (
              <div 
                className="relative"
                onMouseLeave={() => setShowUserMenu(false)}
              >
                {/* User Menu Button */}
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-navy-dark transition-colors duration-200 focus:outline-none rounded-lg hover:bg-sky-blue-light"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-navy-medium to-sky-blue rounded-full flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                  <span className="hidden sm:inline text-gray-700">
                    {user?.first_name || user?.username || 'User'}
                  </span>
                  <ChevronDown size={16} className={`transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-card ring-1 ring-black ring-opacity-5 overflow-hidden z-50">
                    <div className="bg-gradient-to-r from-navy-dark to-sky-blue px-6 py-4">
                      <p className="font-semibold text-white">
                        {user?.first_name && user?.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : user?.username
                        }
                      </p>
                      <p className="text-sky-blue-light text-sm truncate">{user?.email}</p>
                    </div>
                    <div className="py-2">
                      <Link
                        to="/profile"
                        className="block px-6 py-2 text-sm text-gray-700 hover:bg-sky-blue-light transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Profile Settings
                      </Link>
                      <Link
                        to="/dashboard"
                        className="block px-6 py-2 text-sm text-gray-700 hover:bg-sky-blue-light transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Dashboard
                      </Link>
                      {user?.role === 'admin' && (
                        <>
                          <div className="border-t border-gray-100 my-2"></div>
                          <Link
                            to="/admin"
                            className="block px-6 py-2 text-sm text-navy-dark font-medium hover:bg-yellow-accent hover:bg-opacity-10 transition-colors flex items-center space-x-2"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Shield size={16} />
                            <span>Admin Panel</span>
                          </Link>
                        </>
                      )}
                      <div className="border-t border-gray-100 my-2"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-6 py-2 text-sm text-red-error hover:bg-red-error hover:bg-opacity-5 transition-colors flex items-center space-x-2 font-medium"
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
                  className="text-sm font-medium text-navy-dark hover:text-navy-medium transition-colors duration-200 hidden sm:inline"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-navy-dark to-navy-medium hover:from-navy-medium hover:to-sky-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-dark transition-all duration-200 shadow-sm hover:shadow-card"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-100 bg-white py-4">
            <nav className="flex flex-col space-y-2">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/')
                    ? 'bg-sky-blue-light text-navy-dark'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setShowMobileMenu(false)}
              >
                Home
              </Link>
              {isAuthenticated && (
                <Link
                  to="/dashboard"
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-sky-blue-light text-navy-dark'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Dashboard
                </Link>
              )}
              <a
                href="#resources"
                className="px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                Resources
              </a>
              <a
                href="#about"
                className="px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                About
              </a>
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg font-medium text-navy-dark hover:bg-sky-blue-light transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;