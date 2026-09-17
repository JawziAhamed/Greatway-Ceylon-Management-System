import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

const IDLE_LOCK_TIME = 60 * 1000; // 1 minute of inactivity

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(() => {
    return sessionStorage.getItem('gw_locked') === 'true';
  });

  const timerRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('gw_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('gw_user');
      }
    }
    setLoading(false);
  }, []);

  // Manual or automatic lock
  const lockSession = useCallback(() => {
    setIsLocked(true);
    sessionStorage.setItem('gw_locked', 'true');
  }, []);

  // Unlock by verifying password against backend
  const unlockSession = async (password) => {
    if (!user?.email) throw new Error('User not identified');
    const res = await axiosClient.post('/auth/login', {
      email: user.email,
      password,
    });
    if (res.data && res.data.success) {
      setIsLocked(false);
      sessionStorage.removeItem('gw_locked');
      const refreshed = res.data.data;
      setUser(refreshed);
      localStorage.setItem('gw_user', JSON.stringify(refreshed));
      return true;
    }
    throw new Error('Invalid password');
  };

  // Cursor & user activity tracker for 1-minute idle lock
  useEffect(() => {
    if (!user || isLocked) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        lockSession();
      }, IDLE_LOCK_TIME);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));

    // Start 1-minute timer on mount
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [user, isLocked, lockSession]);

  const login = async (email, password) => {
    const res = await axiosClient.post('/auth/login', { email, password });
    if (res.data && res.data.success) {
      const userData = res.data.data;
      setUser(userData);
      setIsLocked(false);
      sessionStorage.removeItem('gw_locked');
      localStorage.setItem('gw_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const logout = () => {
    setUser(null);
    setIsLocked(false);
    sessionStorage.removeItem('gw_locked');
    localStorage.removeItem('gw_user');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isLocked,
        lockSession,
        unlockSession,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
