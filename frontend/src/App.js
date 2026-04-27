import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Dashboard Pages
import CitizenDashboard from './pages/CitizenDashboard';
import PickupAgentDashboard from './pages/PickupAgentDashboard';

import './App.css';

// ===============================
// Error Boundary
// Catches unexpected component crashes and shows a friendly message
// instead of a blank white screen.
// ===============================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('App error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh', gap: '16px',
          fontFamily: 'sans-serif', color: '#333'
        }}>
          <h2>Something went wrong</h2>
          <p>Please refresh the page or go back to the home page.</p>
          <a href="/login" style={{ color: '#2d6a4f', fontWeight: 600 }}>Go to Login</a>
        </div>
      );
    }
    return this.props.children;
  }
}

// ===============================
// Not Found Page
// ===============================
const NotFound = () => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: '100vh', gap: '12px',
    fontFamily: 'sans-serif', color: '#333'
  }}>
    <h1 style={{ fontSize: '64px', margin: 0, color: '#2d6a4f' }}>404</h1>
    <h2>Page Not Found</h2>
    <p>The page you're looking for doesn't exist.</p>
    <Link to="/login" style={{ color: '#2d6a4f', fontWeight: 600, marginTop: '8px' }}>
      Back to Login
    </Link>
  </div>
);

// ===============================
// Protected Route Component
// Uses the auth context (not localStorage directly) so it waits
// for auth to initialize before making a redirect decision.
// ===============================
const ProtectedRoute = ({ children, allowedUserType }) => {
  const { isAuthenticated, user, loading } = useAuth();

  // While auth is initializing, show a spinner instead of redirecting
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh'
      }}>
        <div style={{
          width: '40px', height: '40px', border: '4px solid #e0e0e0',
          borderTopColor: '#2d6a4f', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user type doesn't match, redirect to their correct dashboard
  if (allowedUserType && user?.userType !== allowedUserType) {
    if (user?.userType === 'citizen') {
      return <Navigate to="/citizen/dashboard" replace />;
    } else if (user?.userType === 'pickup_agent') {
      return <Navigate to="/agent/dashboard" replace />;
    } else {
      // 'industry' user type — no dashboard yet, send to login
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

// ===============================
// App Component
// ===============================
function App() {
  return (
    <Router>
      <AuthProvider>
        <ErrorBoundary>
          <Routes>
            {/* ---------- PUBLIC ROUTES ---------- */}
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* ---------- CITIZEN PROTECTED ROUTES ---------- */}
            <Route
              path="/citizen/dashboard"
              element={
                <ProtectedRoute allowedUserType="citizen">
                  <CitizenDashboard />
                </ProtectedRoute>
              }
            />

            {/* ---------- PICKUP AGENT PROTECTED ROUTES ---------- */}
            <Route
              path="/agent/dashboard"
              element={
                <ProtectedRoute allowedUserType="pickup_agent">
                  <PickupAgentDashboard />
                </ProtectedRoute>
              }
            />


            {/* ---------- 404 PAGE ---------- */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </Router>
  );
}

export default App;