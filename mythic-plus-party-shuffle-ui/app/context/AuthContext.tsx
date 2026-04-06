'use client';

import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import apiUrl from '@/config/apiConfig';

export interface AuthContextType {
  isAuthenticated: boolean | null;
  isAuthChecked: boolean;
  setIsAuthenticated: (value: boolean) => void;
  setIsAuthChecked: (value: boolean) => void;
  handleLogout: () => void;
  checkAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const response = await axios.post<{ isAuthenticated: boolean }>(
        `${apiUrl}/auth/verify-token`,
        {},
        { withCredentials: true },
      );
      setIsAuthenticated(response.data.isAuthenticated);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthChecked) {
      void checkAuth();
    }
  }, [isAuthChecked, checkAuth]);

  const handleLogout = async () => {
    try {
      await axios.post(`${apiUrl}/auth/logout`, {}, { withCredentials: true });
      localStorage.removeItem('session');
      localStorage.removeItem('authToken');
      setIsAuthenticated(false);
      window.location.href = '/login';
    } catch {
      /* ignore */
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAuthChecked,
        setIsAuthenticated,
        setIsAuthChecked,
        handleLogout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
