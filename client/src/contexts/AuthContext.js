import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/axiosConfig';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        // Verify token with backend (token is automatically added by interceptor)
        const response = await api.get('/api/auth/verify');

        if (response.data.success) {
          setUser(response.data.user);
          setIsAuthenticated(true);
          // Update stored user data
          localStorage.setItem('user', JSON.stringify(response.data.user));
        } else {
          // Token invalid, clear storage
          logout();
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        // Token invalid or expired, clear storage
        logout();
      }
    } else {
      // No token found
      setIsAuthenticated(false);
      setUser(null);
    }

    setLoading(false);
  };

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const getToken = () => {
    return localStorage.getItem('token');
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    updateUser,
    checkAuth,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

