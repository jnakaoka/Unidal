// api.ts
import axios from "axios";

const baseURL = process.env.REACT_APP_API_URL || "https://api.unidal.pt";

const api = axios.create({
  baseURL,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Helper: pega o token de onde quer que esteja (compatível com chaves antigas)
function getAccessToken(): string | null {
  return (
    localStorage.getItem("accessToken") || // ✅ padrão recomendado
    localStorage.getItem("access_token") || // legados
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("access_token")
  );
}

// Interceptor para anexar Authorization (pula apenas login/refresh)
api.interceptors.request.use(
  (config) => {
    const url = (config.url || "").toLowerCase();
    const isLogin =
      url.endsWith("/auth/login") || url.endsWith("/auth/login/");
    const isRefresh =
      url.endsWith("/auth/refresh") || url.endsWith("/auth/refresh/");

    const token = getAccessToken();

    if (!isLogin && !isRefresh && token) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;














//old
// import axios from "axios";

// // para uso da versao antiga
// // const baseURL = process.env.REACT_APP_API_URL || "https://api.apontamento-unidal.duckdns.org";

// const baseURL = process.env.REACT_APP_API_URL || "https://api.unidal.pt";

// const api = axios.create({
//   baseURL: baseURL,
//   // não usamos cookies agora; tokens são no Authorization.
//   withCredentials: false,
//   headers: {
//     // por defeito para POST forms:
//     //"Content-Type": "application/x-www-form-urlencoded",
//     "Content-Type": "application/json",
//     "Accept": "application/json",

//   },
// });

// // Interceptor para adicionar Authorization quando houver token
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("access_token");
//   if (token && config && config.headers) {
//     config.headers["Authorization"] = `Bearer ${token}`;
//   }
//   return config;
// }, (error) => Promise.reject(error));

// export default api;



// import axios from "axios";
// import { API_BASE_URL } from "../config";

// const api = axios.create({
//   baseURL: API_BASE_URL,
//   withCredentials: false,
// });

// export default api;

// import axios from "axios";

// const api = axios.create({
//   baseURL: "http://localhost:8000", // ou o endereço do seu backend
//   withCredentials: false, // ou true, dependendo do CORS/autenticação
// });

// export default api;
