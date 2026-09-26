import React, { createContext, useContext, useState } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Decodes a JWT payload and checks if the token has expired.
 * Returns true only if token is structurally valid AND not past its `exp` claim.
 */
const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    // atob works on base64url after padding fix
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp) return false;
    // exp is in seconds; Date.now() is in milliseconds
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedToken = localStorage.getItem('mentora_token');
      // If the stored token is already expired, clear storage immediately
      if (!isTokenValid(savedToken)) {
        localStorage.removeItem('mentora_token');
        localStorage.removeItem('mentora_user');
        return null;
      }
      const savedUser = localStorage.getItem('mentora_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      localStorage.removeItem('mentora_user');
      localStorage.removeItem('mentora_token');
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    const t = localStorage.getItem('mentora_token');
    return isTokenValid(t) ? t : null;
  });

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('mentora_token', newToken);
    localStorage.setItem('mentora_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('mentora_token');
    localStorage.removeItem('mentora_user');
  };

  // isAuthenticated is true only when a valid, non-expired token exists
  const isAuthenticated = isTokenValid(token);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated }}>
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
