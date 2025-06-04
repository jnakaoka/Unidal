import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000", // ou o endereço do seu backend
  withCredentials: false, // ou true, dependendo do CORS/autenticação
});

export default api;
