import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Loader } from 'lucide-react';

interface LocationState {
  from?: {
    pathname: string;
  };
}

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, isAuthenticated, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const state = location.state as LocationState;
  const from = state?.from?.pathname || '/dashboard';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Add a small delay to prevent navigation conflicts
      const timer = setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, navigate, from]);

  // Clear error when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      await login(formData.email, formData.password);
      // Navigation will be handled by the useEffect above
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-light to-white pt-24 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-elevation max-w-md w-full border border-sky-blue-light">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-navy-dark mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to Sopharium</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-error bg-opacity-10 border border-red-error rounded-lg">
            <p className="text-red-error text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-navy-dark font-semibold mb-2 text-sm">
              Email Address
            </label>
            <input 
              id="email"
              name="email"
              type="email" 
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-sky-blue-light rounded-lg focus:ring-2 focus:ring-navy-dark focus:border-transparent transition-all bg-sky-blue-light bg-opacity-30"
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-navy-dark font-semibold mb-2 text-sm">
              Password
            </label>
            <div className="relative">
              <input 
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 pr-12 border border-sky-blue-light rounded-lg focus:ring-2 focus:ring-navy-dark focus:border-transparent transition-all bg-sky-blue-light bg-opacity-30"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-navy-dark hover:text-sky-blue"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isSubmitting || !formData.email || !formData.password}
            className="w-full bg-gradient-to-r from-navy-dark to-navy-medium text-white py-3 rounded-lg hover:from-navy-medium hover:to-sky-blue focus:ring-2 focus:ring-navy-dark focus:ring-offset-2 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm hover:shadow-card"
          >
            {isSubmitting ? (
              <>
                <Loader className="animate-spin mr-2" size={20} />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            New to Sopharium?{' '}
            <Link 
              to="/register" 
              state={{ from: state?.from }}
              className="text-sky-blue hover:text-navy-dark font-semibold transition-colors"
            >
              Create account
            </Link>
          </p>
        </div>

        {/* Demo Info */}
        <div className="mt-6 p-4 bg-yellow-accent bg-opacity-10 border border-yellow-accent rounded-lg">
          <p className="text-navy-dark text-sm text-center font-medium">
            💡 <strong>Demo:</strong> Create an account or use test credentials
          </p>
        </div>
      </div>
    </div>
  );
}