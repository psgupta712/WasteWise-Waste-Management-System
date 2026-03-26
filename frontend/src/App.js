import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

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
// Protected Route Component
// ===============================
const ProtectedRoute = ({ children, allowedUserType }) => {
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has correct userType for this route
  if (allowedUserType && userType !== allowedUserType) {
    // Redirect to their correct dashboard
    if (userType === 'citizen') {
      return <Navigate to="/citizen/dashboard" replace />;
    } else if (userType === 'pickup_agent') {
      return <Navigate to="/agent/dashboard" replace />;
    } else if (userType === 'industry') {
      return <Navigate to="/industry/dashboard" replace />;
    } else {
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
          
          {/* ---------- INDUSTRY PROTECTED ROUTES (Future) ---------- */}
          {/* 
          <Route 
            path="/industry/dashboard" 
            element={
              <ProtectedRoute allowedUserType="industry">
                <IndustryDashboard />
              </ProtectedRoute>
            } 
          />
          */}
          
          {/* ---------- FALLBACK ---------- */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;