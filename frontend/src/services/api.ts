// api.ts
import axios from "axios";
import { API_BASE_URL } from "../config";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
});

export default api;

// import axios from "axios";

// const api = axios.create({
//   baseURL: "http://localhost:8000", // ou o endereço do seu backend
//   withCredentials: false, // ou true, dependendo do CORS/autenticação
// });

// export default api;
