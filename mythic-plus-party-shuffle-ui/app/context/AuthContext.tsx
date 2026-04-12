'use client';

import React, { createContext, useCallback } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

export interface AuthContextType {
  isAuthenticated: boolean | null;
  isAuthChecked: boolean;
  username: string | null;
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
  const { user, isLoading, checkSession } = useUser();

  const isAuthenticated = isLoading ? null : !!user;
  const isAuthChecked = !isLoading;
  const username = user?.nickname ?? user?.name ?? null;

  const handleLogout = () => {
    window.location.href = '/api/auth/logout';
  };

  const checkAuth = useCallback(async () => {
    await checkSession();
  }, [checkSession]);

  const noop = () => {};

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAuthChecked,
        username,
        setIsAuthenticated: noop,
        setIsAuthChecked: noop,
        handleLogout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
