import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "https://api.unidal.pt";

console.log("API_BASE_URL:", API_BASE_URL);

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

  if (!config.headers) {
    config.headers = {} as any;
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

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

  if (!refresh) {
    throw new Error("Refresh token não encontrado");
  }

  const body = new URLSearchParams();
  body.append("refresh_token", refresh);

  const res = await axios.post(`${API_BASE_URL}/auth/refresh/`, body.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    timeout: 20000,
  });

  const newAccess = res.data?.access_token;
  const newRefresh = res.data?.refresh_token || refresh;

  if (!newAccess) {
    throw new Error("Falha ao renovar access token");
  }

  await setTokens(newAccess, newRefresh);
  return newAccess;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest: any = error.config;

    if (status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push((token) => {
          if (!token) {
            reject(error);
            return;
          }

          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      const newToken = await refreshAccessToken();
      resolveQueue(newToken);

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      resolveQueue(null);
      await clearTokens();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export const authApi = {
  async login(email: string, password: string) {
    const res = await api.post(
      "/auth/login/",
      { email, password },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const { access_token, refresh_token } = res.data || {};

    if (!access_token || !refresh_token) {
      throw new Error("Login não retornou tokens");
    }

    await setTokens(access_token, refresh_token);
    return res.data;
  },

  async me() {
    const res = await api.get("/auth/me/");
    return res.data;
  },

  async logout() {
    await clearTokens();
  },
};

export const clientesApi = {
  async listar() {
    const res = await api.get("/clientes/");
    return res.data;
  },

  async criar(payload: {
    nome: string;
    is_active?: boolean;
  }) {
    const res = await api.post("/clientes/", payload);
    return res.data;
  },
};

export const obrasApi = {
  async listar() {
    const res = await api.get("/obras/");
    return res.data;
  },

  async listarPorCliente(clienteId: number) {
    const res = await api.get("/obras/", {
      params: {
        cliente_id: clienteId,
      },
    });

    return res.data;
  },

  async criar(payload: {
    nome: string;
    descricao?: string | null;
    cliente_id: number;
  }) {
    const res = await api.post("/obras/", payload);
    return res.data;
  },
};

export const usuariosApi = {
  async listar() {
    const res = await api.get("/users/");
    return res.data;
  },
};

export const registrosHorasApi = {
  async listar(usuarioId?: number) {
    const res = await api.get("/registro-horas/", {
      params: usuarioId
        ? {
            usuario_id: usuarioId,
          }
        : undefined,
    });

    return res.data;
  },

  async obter(id: number) {
    const res = await api.get(`/registro-horas/${id}`);
    return res.data;
  },

  async criar(payload: any) {
    const res = await api.post("/registro-horas/", payload);
    return res.data;
  },

  async atualizar(id: number, payload: any) {
    const res = await api.put(`/registro-horas/${id}`, payload);
    return res.data;
  },

  async excluir(id: number) {
    const res = await api.delete(`/registro-horas/${id}`);
    return res.data;
  },
};