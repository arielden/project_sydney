import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { QuizProvider } from './contexts/QuizContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import Header from './components/common/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import QuizPage from './pages/QuizPage';
import QuizStartPage from './pages/QuizStartPage';
import QuizResultsPage from './pages/QuizResultsPage';

// Component to conditionally render header
function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  
  // Hide header on quiz pages for full-screen experience
  const hideHeader = location.pathname.startsWith('/quiz/active') || location.pathname.startsWith('/quiz/results');
  
  return (
    <div className="min-h-screen bg-white">
      {!hideHeader && <Header />}
      {children}
    </div>
  );
}

function App() {
  // Add global promise rejection handler
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      // Prevent the default browser behavior (logging to console)
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <QuizProvider>
            <AppLayout>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                
                {/* Quiz routes */}
                <Route path="/quiz/start" element={
                  <ProtectedRoute>
                    <QuizStartPage />
                  </ProtectedRoute>
                } />
                <Route path="/quiz/active" element={
                  <ProtectedRoute>
                    <QuizPage />
                  </ProtectedRoute>
                } />
                <Route path="/quiz/results/:sessionId" element={
                  <ProtectedRoute>
                    <QuizResultsPage />
                  </ProtectedRoute>
                } />
                
                {/* Legacy quiz route - redirect to new structure */}
                <Route path="/quiz" element={
                  <ProtectedRoute>
                    <QuizStartPage />
                  </ProtectedRoute>
                } />
              </Routes>
            </AppLayout>
          </QuizProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App
