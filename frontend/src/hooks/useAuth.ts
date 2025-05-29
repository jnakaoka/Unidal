// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginRequest, logout as logoutRequest } from '../services/auth';
import { TokenResponse } from '../types';

export const useAuth = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setAccessToken(token);
      setIsAuthenticated(true);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response: TokenResponse | null = await loginRequest(email, password);
    if (response?.access_token) {
      setAccessToken(response.access_token);
      setIsAuthenticated(true);
      navigate('/');
    }
  }, [navigate]);

  const logout = useCallback(() => {
    logoutRequest();
    setAccessToken(null);
    setIsAuthenticated(false);
    navigate('/login');
  }, [navigate]);

  return {
    accessToken,
    isAuthenticated,
    login,
    logout,
  };
};
