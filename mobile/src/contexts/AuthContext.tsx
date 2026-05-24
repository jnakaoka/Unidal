import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { authApi } from "../services/api";

type Perfil = {
  id: number;
  nome: string;
};

type User = {
  id: number;
  email: string;
  name: string;
  perfil: Perfil | null;
};

type AuthState = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const ACCESS_KEY = "unidal_access_token";
const REFRESH_KEY = "unidal_refresh_token";

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function bootstrap() {
    try {
      const access = await SecureStore.getItemAsync(ACCESS_KEY);
      const refresh = await SecureStore.getItemAsync(REFRESH_KEY);

      if (!access || !refresh) {
        setUser(null);
        return;
      }

      const me = await authApi.me();
      setUser(me);
    } catch (error) {
      setUser(null);
      await SecureStore.deleteItemAsync(ACCESS_KEY);
      await SecureStore.deleteItemAsync(REFRESH_KEY);
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    setIsLoading(true);
    try {
      await authApi.login(email, password);
      const me = await authApi.me();
      setUser(me);
    } finally {
      setIsLoading(false);
    }
  }

  async function signOut() {
    await authApi.logout();
    setUser(null);
  }

  useEffect(() => {
    bootstrap();
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      signIn,
      signOut,
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}