import axios from './api';
import { TokenResponse } from '../types';

export const login = async (email: string, password: string): Promise<TokenResponse | null> => {
  try {
    const response = await axios.post<TokenResponse>(
      '/login',
      new URLSearchParams({ username: email, password }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, refresh_token, token_type } = response.data;

    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);

    axios.defaults.headers.common['Authorization'] = `${token_type} ${access_token}`;

    return response.data;
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return null;
  }
};

export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refresh_token = localStorage.getItem('refresh_token');
    if (!refresh_token) return null;

    const response = await axios.post<TokenResponse>('/refresh', { refresh_token });

    const { access_token, token_type } = response.data;

    localStorage.setItem('access_token', access_token);
    axios.defaults.headers.common['Authorization'] = `${token_type} ${access_token}`;

    return access_token;
  } catch (error) {
    console.error('Erro ao atualizar token:', error);
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  delete axios.defaults.headers.common['Authorization'];
};
