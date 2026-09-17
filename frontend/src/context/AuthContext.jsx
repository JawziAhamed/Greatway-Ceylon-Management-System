import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export const LOCK_TIMEOUT_OPTIONS = [
  { value: 30 * 1000, label: '30 Seconds (Testing)' },
  { value: 60 * 1000, label: '1 Minute (Default)' },
  { value: 2 * 60 * 1000, label: '2 Minutes' },
  { value: 5 * 60 * 1000, label: '5 Minutes' },
  { value: 10 * 60 * 1000, label: '10 Minutes' },
  { value: 15 * 60 * 1000, label: '15 Minutes' },
  { value: 30 * 60 * 1000, label: '30 Minutes' },
  { value: 0, label: 'Disabled (Never Auto-Lock)' },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lockTimeout, setLockTimeoutState] = useState(() => {
    const saved = localStorage.getItem('gw_lock_timeout');
    return saved !== null ? Number(saved) : 60 * 1000;
  });

  const setLockTimeout = (val) => {
    const num = Number(val);
    setLockTimeoutState(num);
    localStorage.setItem('gw_lock_timeout', String(num));
  };

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

  // Cursor & user activity tracker for configurable idle lock
  useEffect(() => {
    if (!user || isLocked || lockTimeout === 0) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        lockSession();
      }, lockTimeout);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));

    // Start timer on mount / settings change
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [user, isLocked, lockTimeout, lockSession]);

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
        lockTimeout,
        setLockTimeout,
        lockTimeoutOptions: LOCK_TIMEOUT_OPTIONS,
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
