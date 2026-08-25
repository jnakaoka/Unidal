// api.ts
import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
}

interface RetryableRequest
  extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const baseURL =
  import.meta.env.VITE_API_URL
  || "https://api.unidal.pt";

const api = axios.create({
  baseURL,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

let refreshEmCurso: Promise<string> | null = null;

function obterAccessToken(): string | null {
  return (
    localStorage.getItem("access_token")
    || sessionStorage.getItem("access_token")
    || localStorage.getItem("accessToken")
    || sessionStorage.getItem("accessToken")
  );
}

function obterRefreshToken(): string | null {
  return (
    localStorage.getItem("refresh_token")
    || sessionStorage.getItem("refresh_token")
    || localStorage.getItem("refreshToken")
    || sessionStorage.getItem("refreshToken")
  );
}

function guardarAccessToken(token: string): void {
  localStorage.setItem("access_token", token);

  if (localStorage.getItem("accessToken") !== null) {
    localStorage.setItem("accessToken", token);
  }

  if (sessionStorage.getItem("access_token") !== null) {
    sessionStorage.setItem("access_token", token);
  }

  if (sessionStorage.getItem("accessToken") !== null) {
    sessionStorage.setItem("accessToken", token);
  }
}

function limparAutenticacao(): void {
  const chaves = [
    "access_token",
    "refresh_token",
    "accessToken",
    "refreshToken",
    "userEmail",
    "userName",
    "userPerfil",
    "userId",
  ];

  chaves.forEach((chave) => {
    localStorage.removeItem(chave);
    sessionStorage.removeItem(chave);
  });
}

function redirecionarParaLogin(): void {
  if (window.location.pathname === "/login") {
    return;
  }

  const paginaAtual = (
    window.location.pathname
    + window.location.search
    + window.location.hash
  );

  const parametros = new URLSearchParams({
    next: paginaAtual,
    reason: "session_expired",
  });

  window.location.assign(
    `/login?${parametros.toString()}`,
  );
}

function urlDeAutenticacao(url?: string): boolean {
  const caminho = (url || "").toLowerCase();

  return (
    caminho.includes("/auth/login")
    || caminho.includes("/auth/refresh")
  );
}

async function renovarAccessToken(): Promise<string> {
  const refreshToken = obterRefreshToken();

  if (!refreshToken) {
    throw new Error("Refresh token ausente.");
  }

  const formulario = new URLSearchParams();
  formulario.set("refresh_token", refreshToken);

  const urlRefresh = (
    `${baseURL.replace(/\/$/, "")}/auth/refresh`
  );

  const response = await axios.post<TokenResponse>(
    urlRefresh,
    formulario,
    {
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
    },
  );

  const novoAccessToken = response.data.access_token;

  if (!novoAccessToken) {
    throw new Error(
      "A renovação não devolveu um access token.",
    );
  }

  guardarAccessToken(novoAccessToken);

  if (response.data.refresh_token) {
    localStorage.setItem(
      "refresh_token",
      response.data.refresh_token,
    );
  }

  api.defaults.headers.common.Authorization =
    `Bearer ${novoAccessToken}`;

  return novoAccessToken;
}

function obterRenovacaoEmCurso(): Promise<string> {
  if (!refreshEmCurso) {
    refreshEmCurso = renovarAccessToken()
      .finally(() => {
        refreshEmCurso = null;
      });
  }

  return refreshEmCurso;
}

api.interceptors.request.use(
  (config) => {
    const token = obterAccessToken();

    if (
      token
      && !urlDeAutenticacao(config.url)
    ) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (
    error: AxiosError,
  ) => {
    const requisicao =
      error.config as RetryableRequest | undefined;

    if (
      error.response?.status !== 401
      || !requisicao
      || urlDeAutenticacao(requisicao.url)
    ) {
      return Promise.reject(error);
    }

    if (requisicao._retry) {
      limparAutenticacao();
      redirecionarParaLogin();
      return Promise.reject(error);
    }

    requisicao._retry = true;

    try {
      const novoToken =
        await obterRenovacaoEmCurso();

      requisicao.headers.Authorization =
        `Bearer ${novoToken}`;

      return api(requisicao);
    } catch (erroRefresh) {
      limparAutenticacao();
      redirecionarParaLogin();
      return Promise.reject(erroRefresh);
    }
  },
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
