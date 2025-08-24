const isProd = import.meta.env.PROD; // Vite sabe se está em produção

const publicApi = import.meta.env.VITE_PUBLIC_API_URL;

// export const API_BASE_URL = isProd
//   ? (publicApi || "https://api.apontamento-unidal.duckdns.org")
//   : (import.meta.env.VITE_API_URL || "http://localhost:8000");

export const API_BASE_URL =
  import.meta.env.VITE_PUBLIC_API_URL || "http://localhost:8000";