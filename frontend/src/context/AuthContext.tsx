//authContext.ts
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout as logoutService } from '../services/auth';
import api from '../services/api';
import Loader from '../components/Loader';

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

interface AuthUser {
  id?: number;
  email: string;
  perfil?: string;
  name?: string;
  perfil_id?: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function base64UrlDecode(payloadPart: string) {
  // replace base64url chars, pad & decode
  payloadPart = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
  // pad with '='
  const pad = payloadPart.length % 4;
  if (pad === 2) payloadPart += '==';
  else if (pad === 3) payloadPart += '=';
  else if (pad === 1) payloadPart += '===';
  try {
    return JSON.parse(Buffer.from(payloadPart, 'base64').toString('utf8'));
  } catch (err) {
    // fallback para browsers que não tem Buffer (rare in CRA/node)
    try {
      // atob fallback (nota: atob espera base64 normal)
      // @ts-ignore
      const decoded = typeof atob === 'function' ? atob(payloadPart) : null;
      return decoded ? JSON.parse(decoded) : null;
    } catch (e) {
      return null;
    }
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const idStr = localStorage.getItem('userId');
    const id = idStr ? Number(idStr) : undefined;
    const name = localStorage.getItem('userName') ?? undefined;
    const email = localStorage.getItem('userEmail') ?? undefined;
    const perfil = localStorage.getItem('userPerfil') ?? undefined;

    if (token && email) {
      setAccessToken(token);
      setUser({ id, email, name, perfil });
    }
    setIsLoading(false);
  }, []);

  if (isLoading) return <Loader />;

  // helper: normaliza perfil
  const normalizePerfil = (v: any) => String(v ?? "").trim().toLowerCase();

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const params = new URLSearchParams();
      params.append("username", email);
      params.append("password", password);

      const response = await api.post<{ access_token?: string; refresh_token?: string }>(
        "/auth/login/",
        params,
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      if (!(response.status === 200 && response.data?.access_token)) return false;

      const access_token = response.data.access_token;
      const refresh_token = response.data.refresh_token ?? "";

      // salva tokens
      localStorage.setItem("access_token", access_token);
      if (refresh_token) localStorage.setItem("refresh_token", refresh_token);

      // seta no axios (importantíssimo para a chamada /me)
      api.defaults.headers.common.Authorization = `Bearer ${access_token}`;

      // 🔥 busca usuário real no backend (com perfil)
      // troque o endpoint conforme seu backend
      const me = await api.get("/auth/me");

      // tente achar o perfil em formatos comuns
      const perfilRaw =
        me.data?.perfil?.nome ??
        me.data?.perfil_nome ??
        me.data?.perfil ??
        me.data?.role ??
        "";

      const perfil = normalizePerfil(perfilRaw);

      const id = me.data?.id;
      const name = me.data?.name ?? me.data?.nome ?? "";
      const emailReal = me.data?.email ?? email;

      // salva user
      localStorage.setItem("userEmail", emailReal);
      localStorage.setItem("userName", name);
      localStorage.setItem("userPerfil", perfil);
      if (id != null) localStorage.setItem("userId", String(id));

      setAccessToken(access_token);
      setUser({ id, email: emailReal, name, perfil });

      // redireciona conforme perfil (normalizado)
      if (perfil === "admin") navigate("/dashboard");
      else if (perfil === "operador" || perfil === "motorista") navigate("/operador-dashboard");
      else navigate("/unauthorized");

      return true;
    } catch (err: any) {
      console.error("Erro ao fazer login:", err);
      const msg =
        err?.response?.data?.detail ??
        err?.response?.data ??
        err?.message ??
        "Erro de rede ou servidor";
      alert(typeof msg === "string" ? msg : JSON.stringify(msg));
      return false;
    }
  };

  // const login = async (email: string, password: string): Promise<boolean> => {
  //   try {
  //     const params = new URLSearchParams();
  //     params.append('username', email); // FastAPI espera "username"
  //     params.append('password', password);

  //     // Se precisar enviar cookies/sessão entre domínios, descomente withCredentials
  //     const response = await api.post<{
  //       access_token?: string;
  //       refresh_token?: string;
  //     }>('/auth/login/', params, {
  //       headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  //       // withCredentials: true,
  //     });

  //     if (response.status === 200 && response.data?.access_token) {
  //       const access_token = response.data.access_token;
  //       const refresh_token = response.data.refresh_token ?? '';

  //       // decode JWT (base64url)
  //       const parts = access_token.split('.');
  //       const payload = parts.length >= 2 ? base64UrlDecode(parts[1]) : null;

  //       // fallback para diferentes formatos (sub/email)
  //       const payloadEmail = payload?.email ?? payload?.sub ?? email;
  //       const payloadName = payload?.name ?? '';
  //       const payloadPerfil = payload?.perfil ?? payload?.role ?? '';
  //       const payloadId = payload?.id ?? payload?.user_id ?? undefined;

  //       // store only what exists
  //       localStorage.setItem('access_token', access_token);
  //       if (refresh_token) localStorage.setItem('refresh_token', refresh_token);
  //       if (payloadEmail) localStorage.setItem('userEmail', payloadEmail);
  //       if (payloadName) localStorage.setItem('userName', payloadName);
  //       if (payloadPerfil) localStorage.setItem('userPerfil', payloadPerfil);
  //       if (payloadId !== undefined) localStorage.setItem('userId', String(payloadId));

  //       setAccessToken(access_token);
  //       setUser({
  //         id: payloadId,
  //         email: payloadEmail,
  //         perfil: payloadPerfil,
  //         name: payloadName,
  //       });

  //       // redireciona conforme perfil
  //       if (payloadPerfil === 'admin') {
  //         navigate('/dashboard');
  //       } else if (payloadPerfil === 'operador' || payloadPerfil === 'motorista') {
  //         navigate('/operador-dashboard');
  //       } else {
  //         navigate('/home');
  //       }

  //       return true;
  //     }

  //     return false;
  //   } catch (err: any) {
  //     console.error('Erro ao fazer login:', err);
  //     // tenta extrair mensagem amigável do backend
  //     const msg =
  //       err?.response?.data?.detail ??
  //       err?.response?.data ??
  //       err?.message ??
  //       'Erro de rede ou servidor';
  //     alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
  //     return false;
  //   }
  // };

  const logout = () => {
    // se tiver endpoint de logout, pode chamá-lo via logoutService()
    try {
      logoutService();
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userPerfil');
    localStorage.removeItem('userId');
    setAccessToken(null);
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!accessToken,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};






// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { login as loginService, logout as logoutService } from '../services/auth';
// import { TokenResponse } from '../types';
// import api from '../services/api';
// import Loader from '../components/Loader';


// interface AuthContextType {
//   user: AuthUser | null;
//   accessToken: string | null;
//   isAuthenticated: boolean;
//   login: (email: string, password: string) => Promise<boolean>;
//   logout: () => void;
//   isLoading: boolean;
// }

// interface AuthUser {
//   id: number;
//   email: string;
//   perfil: string;
//   name?: string;
//   perfil_id?: number;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [user, setUser] = useState<AuthUser | null>(null);
// const [accessToken, setAccessToken] = useState<string | null>(null);
// const [isLoading, setIsLoading] = useState(true);
//   const navigate = useNavigate();

//   useEffect(() => {
//         const token = localStorage.getItem('access_token');
//         const id = Number(localStorage.getItem('userId'));
//         const name = localStorage.getItem('userName');
//         const email = localStorage.getItem('userEmail');
//         const perfil = localStorage.getItem('userPerfil');

//         if (token && email && perfil) {
//             setAccessToken(token);
//             setUser({ id, email, name: name ?? '', perfil });
//         }
//         setIsLoading(false);
//     }, []);

// if (isLoading) return <Loader />;

// const login = async (email: string, password: string): Promise<boolean> => {
//   try {
//     const params = new URLSearchParams();
//     params.append("username", email);
//     params.append("password", password);

//     // const response = await api.post("/login", params, {
//     //   headers: { "Content-Type": "application/x-www-form-urlencoded" },
//     // });

//     const response = await api.post<{
//             access_token: string;
//             refresh_token: string;
//         }>("/login/", params, {
//             headers: { "Content-Type": "application/x-www-form-urlencoded" },
//         });

//     if (response.status === 200) {
//       const { access_token, refresh_token } = response.data;

//       // Decode do token JWT
//       const payload = JSON.parse(atob(access_token.split('.')[1]));
//       console.log("payload", payload);
//       const perfil = payload.perfil;

//       // Armazenar tudo no localStorage
//       localStorage.setItem("access_token", access_token);
//       localStorage.setItem("refresh_token", refresh_token);
//       localStorage.setItem("userEmail", payload.email);
//       localStorage.setItem("userName", payload.name);
//       localStorage.setItem("userPerfil", payload.perfil);
//       localStorage.setItem("userId", String(payload.id));

//       setUser({id: payload.id, email, perfil, name: payload.name});
//       setAccessToken(access_token);

//       // Redirecionar com base no perfil
//       if (perfil === 'admin') {
//         navigate('/dashboard');
//       } else if (perfil === 'operador') {
//         navigate('/operador-dashboard');
//       } else {
//         navigate('/home');
//       }

//       return true;
//     } else {
//       return false;
//     }
    
//   } catch (error) {
//     console.error("Erro ao fazer login:", error);
//     alert("Usuário ou senha inválidos.");
//     return false;
//   }
// };
  
// //   const login = async (email: string, password: string): Promise<boolean> => {
// //         try {
// //             const params = new URLSearchParams();
// //             params.append("username", email); // FastAPI espera "username"
// //             params.append("password", password);

// //             const response = await api.post("/login", params, {
// //             headers: {
// //                 "Content-Type": "application/x-www-form-urlencoded",
// //             },
// //             });

// //             // Verificação básica da resposta
// //             if (response.status === 200) {
// //             const data = response.data as {
// //                 access_token: string;
// //                 refresh_token: string;
// //             };

// //             // Salvando tokens e e-mail no localStorage
// //             localStorage.setItem("access_token", data.access_token);
// //             localStorage.setItem("refresh_token", data.refresh_token);
// //             localStorage.setItem("userEmail", email);

// //             return true;
// //             }

// //             return false;
// //         } catch (error) {
// //             console.error("Erro ao fazer login:", error);
// //             return false;
// //         }
// //     };

//   const logout = () => {
//     logoutService();
//     localStorage.removeItem('access_token');
//     localStorage.removeItem('refresh_token');
//     localStorage.removeItem('userEmail');
//     setAccessToken(null);
//     setUser(null);
//     navigate('/login');
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         accessToken,
//         isAuthenticated: !!accessToken,
//         login,
//         logout,
//         isLoading,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = (): AuthContextType => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth deve ser usado dentro de AuthProvider');
//   }
//   return context;
// };





// import React, { createContext, useState, useEffect } from "react";

// interface AuthContextType {
//   isAuthenticated: boolean;
//   login: (email: string, password: string) => Promise<boolean>;
//   logout: () => void;
// }

// export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [isAuthenticated, setIsAuthenticated] = useState(false);

//   useEffect(() => {
//     const token = localStorage.getItem("access_token");
//     setIsAuthenticated(!!token);
//   }, []);

//   const login = async (email: string, password: string) => {
//     try {
//       const res = await fetch("http://localhost:8000/login", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, password }),
//       });

//       if (!res.ok) return false;

//       const data = await res.json();
//       localStorage.setItem("access_token", data.access_token);
//       localStorage.setItem("refresh_token", data.refresh_token);
//       setIsAuthenticated(true);
//       return true;
//     } catch (err) {
//       console.error("Login error", err);
//       return false;
//     }
//   };

//   const logout = () => {
//     localStorage.removeItem("access_token");
//     localStorage.removeItem("refresh_token");
//     setIsAuthenticated(false);
//   };

//   return (
//     <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

