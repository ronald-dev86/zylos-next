"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, TenantContext } from '../types/common';

interface AuthState {
  user: AuthUser | null;
  tenant: TenantContext | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string, subdomain?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    tenant: null,
    isAuthenticated: false,
    isLoading: true
  });

  const refreshAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setState({
            user: data.data.user,
            tenant: data.data.tenant,
            isAuthenticated: true,
            isLoading: false
          });
          return;
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    }

    setState({
      user: null,
      tenant: null,
      isAuthenticated: false,
      isLoading: false
    });
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  const login = async (email: string, password: string, subdomain?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, subdomain })
      });

      const data = await response.json();

      if (data.success) {
        setState({
          user: data.data.user,
          tenant: data.data.tenant,
          isAuthenticated: true,
          isLoading: false
        });
        return { success: true };
      }
      return { success: false, error: data.error || 'Error al iniciar sesión' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Error al conectar con el servidor' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }

    setState({
      user: null,
      tenant: null,
      isAuthenticated: false,
      isLoading: false
    });
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      logout,
      refreshAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}