import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api';

// Create Context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until auth is resolved
  const [error, setError] = useState(null);

  // On app load, verify token by fetching fresh profile from backend
  // This avoids stale user data and validates the token is still good
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Verify the token is still valid by hitting the profile endpoint
        const response = await authAPI.getProfile();
        setUser(response.data);
      } catch (err) {
        // Token is invalid or expired — clear everything
        localStorage.removeItem('token');
        localStorage.removeItem('userType');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Register function
  const register = async (userData) => {
    try {
      setError(null);
      const response = await authAPI.register(userData);

      // Only store the token — fetch user profile from server, don't cache sensitive user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userType', response.data.userType);
      setUser(response.data);

      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message || 'Registration failed');
      return { success: false, error: err.message };
    }
  };

  // Login function
  const login = async (credentials) => {
    try {
      setError(null);
      const response = await authAPI.login(credentials);

      // Only store the token — not the full user object
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userType', response.data.userType);
      setUser(response.data);

      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message || 'Login failed');
      return { success: false, error: err.message };
    }
  };

  // Logout function — also invalidates token on the backend
  const logout = async () => {
    try {
      await authAPI.logout(); // tell server to blacklist the token
    } catch (err) {
      // Ignore server errors — clear local state regardless
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('userType');
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;