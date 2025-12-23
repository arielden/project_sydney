import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Loader, Check, X } from 'lucide-react';

interface LocationState {
  from?: {
    pathname: string;
  };
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: 'At least 8 characters long', test: (pwd) => pwd.length >= 8 },
  { label: 'Contains uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
  { label: 'Contains lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
  { label: 'Contains a number', test: (pwd) => /\d/.test(pwd) },
  { label: 'Contains special character', test: (pwd) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd) },
];

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);
  
  const { register: registerUser, isAuthenticated, error, clearError } = useAuth();
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

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      return;
    }

    // Validate password requirements
    const unmetRequirements = passwordRequirements.filter(req => !req.test(formData.password));
    if (unmetRequirements.length > 0) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await registerUser({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        first_name: formData.first_name || undefined,
        last_name: formData.last_name || undefined,
      });
      // Navigation will be handled by the useEffect above
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.email &&
      formData.username &&
      formData.password &&
      formData.confirmPassword &&
      formData.password === formData.confirmPassword &&
      passwordRequirements.every(req => req.test(formData.password))
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-light to-white pt-24 flex items-center justify-center py-8">
      <div className="bg-white p-8 rounded-2xl shadow-elevation max-w-md w-full mx-4 border border-sky-blue-light">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-navy-dark mb-2">Create Your Account</h1>
          <p className="text-gray-600">Join Sopharium and start learning</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-error bg-opacity-10 border border-red-error rounded-lg">
            <p className="text-red-error text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-navy-dark font-semibold mb-2 text-sm">
                First Name
              </label>
              <input 
                id="first_name"
                name="first_name"
                type="text" 
                value={formData.first_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-sky-blue-light rounded-lg focus:ring-2 focus:ring-navy-dark focus:border-transparent transition-all bg-sky-blue-light bg-opacity-30"
                placeholder="First name"
                autoComplete="given-name"
              />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-navy-dark font-semibold mb-2 text-sm">
                Last Name
              </label>
              <input 
                id="last_name"
                name="last_name"
                type="text" 
                value={formData.last_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-sky-blue-light rounded-lg focus:ring-2 focus:ring-navy-dark focus:border-transparent transition-all bg-sky-blue-light bg-opacity-30"
                placeholder="Last name"
                autoComplete="family-name"
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-navy-dark font-semibold mb-2 text-sm">
              Email Address *
            </label>
            <input 
              id="email"
              name="email"
              type="email" 
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-sky-blue-light rounded-lg focus:ring-2 focus:ring-navy-dark focus:border-transparent transition-all bg-sky-blue-light bg-opacity-30"
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>

          {/* Username Field */}
          <div>
            <label htmlFor="username" className="block text-navy-dark font-semibold mb-2 text-sm">
              Username *
            </label>
            <input 
              id="username"
              name="username"
              type="text" 
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-sky-blue-light rounded-lg focus:ring-2 focus:ring-navy-dark focus:border-transparent transition-all bg-sky-blue-light bg-opacity-30"
              placeholder="Choose a username"
              required
              autoComplete="username"
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-navy-dark font-semibold mb-2 text-sm">
              Password *
            </label>
            <div className="relative">
              <input 
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setPasswordFocus(true)}
                onBlur={() => setPasswordFocus(false)}
                className="w-full px-4 py-2 pr-12 border border-sky-blue-light rounded-lg focus:ring-2 focus:ring-navy-dark focus:border-transparent transition-all bg-sky-blue-light bg-opacity-30"
                placeholder="Create a password"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-navy-dark hover:text-sky-blue"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {/* Password Requirements */}
            {(passwordFocus || formData.password) && (
              <div className="mt-2 p-3 bg-sky-blue-light bg-opacity-20 rounded-lg border border-sky-blue-light">
                <p className="text-sm text-navy-dark font-semibold mb-2">Password requirements:</p>
                <div className="space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center text-sm">
                      {req.test(formData.password) ? (
                        <Check size={16} className="text-green-success mr-2 flex-shrink-0" />
                      ) : (
                        <X size={16} className="text-gray-400 mr-2 flex-shrink-0" />
                      )}
                      <span className={req.test(formData.password) ? 'text-green-success font-medium' : 'text-gray-600'}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-navy-dark font-semibold mb-2 text-sm">
              Confirm Password *
            </label>
            <div className="relative">
              <input 
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-2 pr-12 border rounded-lg focus:ring-2 focus:ring-navy-dark focus:border-transparent transition-all ${
                  formData.confirmPassword && formData.password !== formData.confirmPassword
                    ? 'border-red-error bg-red-error bg-opacity-10'
                    : 'border-sky-blue-light bg-sky-blue-light bg-opacity-30'
                }`}
                placeholder="Confirm your password"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-navy-dark hover:text-sky-blue"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-red-error text-sm mt-1 font-medium">Passwords do not match</p>
            )}
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isSubmitting || !isFormValid()}
            className="w-full bg-gradient-to-r from-navy-dark to-navy-medium text-white py-3 rounded-lg hover:from-navy-medium hover:to-sky-blue focus:ring-2 focus:ring-navy-dark focus:ring-offset-2 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-6 shadow-sm hover:shadow-card"
          >
            {isSubmitting ? (
              <>
                <Loader className="animate-spin mr-2" size={20} />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Already have an account?{' '}
            <Link 
              to="/login" 
              state={{ from: state?.from }}
              className="text-sky-blue hover:text-navy-dark font-semibold transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}