import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { QuizProvider } from './contexts/QuizContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import QuizPage from './pages/QuizPage';
import QuizStartPage from './pages/QuizStartPage';
import QuizResultsPage from './pages/QuizResultsPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTables from './pages/admin/AdminTables';
import AdminTableDetail from './pages/admin/AdminTableDetail';
import AdminRecordForm from './pages/admin/AdminRecordForm';
import AdminActivityLog from './pages/admin/AdminActivityLog';
import DatabaseManagement from './pages/admin/DatabaseManagement';

// Component to conditionally render header
function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  
  // Hide header and footer on quiz pages for full-screen experience
  const hideHeader = location.pathname.startsWith('/quiz/active') || 
                     location.pathname.startsWith('/quiz/results') ||
                     location.pathname.startsWith('/admin');
  
  const hideFooter = location.pathname.startsWith('/quiz/active') || 
                     location.pathname.startsWith('/quiz/results') ||
                     location.pathname.startsWith('/admin') ||
                     location.pathname === '/login' ||
                     location.pathname === '/register';
  
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {!hideHeader && <Header />}
      <main className="flex-grow">
        {children}
      </main>
      {!hideFooter && <Footer />}
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
      <Toaster position="top-right" />
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
                
                {/* Admin routes */}
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } />
                <Route path="/admin/tables" element={
                  <AdminRoute>
                    <AdminTables />
                  </AdminRoute>
                } />
                <Route path="/admin/tables/:tableName" element={
                  <AdminRoute>
                    <AdminTableDetail />
                  </AdminRoute>
                } />
                <Route path="/admin/tables/:tableName/new" element={
                  <AdminRoute>
                    <AdminRecordForm />
                  </AdminRoute>
                } />
                <Route path="/admin/tables/:tableName/:recordId" element={
                  <AdminRoute>
                    <AdminRecordForm />
                  </AdminRoute>
                } />
                <Route path="/admin/activity" element={
                  <AdminRoute>
                    <AdminActivityLog />
                  </AdminRoute>
                } />
                <Route path="/admin/database" element={
                  <AdminRoute>
                    <DatabaseManagement />
                  </AdminRoute>
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
