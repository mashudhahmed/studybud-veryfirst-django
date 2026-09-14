import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authApi from '../api/auth';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // Only true while the app is bootstrapping auth from localStorage — NOT during login/register.
  // Using the same flag for login caused GuestRoute/ProtectedRoute to unmount the form
  // (full-page "Loading...") and wipe any error message when login failed.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const userData = await authApi.getCurrentUser();
      setUser(userData);
    } catch (err) {
      localStorage.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (username, password) => {
    setError(null);

    try {
      const data = await authApi.login(username, password);
      const userData = await authApi.getCurrentUser();
      setUser(userData);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const register = useCallback(async (userData) => {
    setError(null);

    try {
      const data = await authApi.register(userData);
      // Prefer nested user from response; fall back to /me/ if needed
      if (data?.user) {
        setUser(data.user);
      } else {
        const me = await authApi.getCurrentUser();
        setUser(me);
      }
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    setError(null);

    try {
      const updatedProfile = await authApi.updateProfile(profileData);
      // Refresh user so navbar avatar/name stay in sync when possible
      try {
        const userData = await authApi.getCurrentUser();
        setUser(userData);
      } catch (_) {
        /* profile may still have updated */
      }
      return updatedProfile;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default AuthProvider;
