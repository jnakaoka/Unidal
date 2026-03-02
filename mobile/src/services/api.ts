import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://SEU_IP:8000";

const ACCESS_KEY = "unidal_access_token";
const REFRESH_KEY = "unidal_refresh_token";

async function getAccessToken() {
  return SecureStore.getItemAsync(ACCESS_KEY);
}
async function getRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_KEY);
}
async function setTokens(access: string, refresh: string) {
  await SecureStore.setItemAsync(ACCESS_KEY, access);
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
}
async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let queue: Array<(token: string | null) => void> = [];

function resolveQueue(token: string | null) {
  queue.forEach((cb) => cb(token));
  queue = [];
}

async function refreshAccessToken(): Promise<string> {
  const refresh = await getRefreshToken();
  if (!refresh) throw new Error("No refresh token");

  const body = new URLSearchParams();
  body.append("refresh_token", refresh);

  const res = await axios.post(`${API_BASE_URL}/auth/refresh`, body.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 20000,
  });

  const newAccess = res.data?.access_token;
  const sameRefresh = res.data?.refresh_token || refresh;
  if (!newAccess) throw new Error("Refresh failed");

  await setTokens(newAccess, sameRefresh);
  return newAccess;
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original: any = error.config;

    if (status !== 401 || original?._retry) return Promise.reject(error);
    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push((token) => {
          if (!token) return reject(error);
          original.headers.Authorization = `Bearer ${token}`;
          resolve(api(original));
        });
      });
    }

    isRefreshing = true;
    try {
      const newToken = await refreshAccessToken();
      resolveQueue(newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch {
      resolveQueue(null);
      await clearTokens();
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);

export const authApi = {
  async login(emailOrUsername: string, password: string) {
    const payload = { email: emailOrUsername, password };
    const res = await api.post("/auth/login/", payload, {
      headers: { "Content-Type": "application/json" },
    });

    const { access_token, refresh_token } = res.data || {};
    if (!access_token || !refresh_token) throw new Error("Login não retornou tokens");

    await setTokens(access_token, refresh_token);
    return res.data;
  },

  async me() {
    const res = await api.get("/auth/me");
    return res.data;
  },

  async logout() {
    await clearTokens();
  },
};
