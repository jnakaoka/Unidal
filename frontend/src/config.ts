const isProd = import.meta.env.PROD; // Vite sabe se está em produção

// export const API_BASE_URL = isProd
//   ? "https://apontamento-unidal.duckdns.org/api" // Produção
//   : "http://localhost:8000"; // Desenvolvimento

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";