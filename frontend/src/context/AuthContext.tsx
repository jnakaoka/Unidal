import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginService, logout as logoutService } from '../services/auth';
import { TokenResponse } from '../types';
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
  id: number;
  email: string;
  perfil: string;
  name?: string;
  perfil_id?: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
const [accessToken, setAccessToken] = useState<string | null>(null);
const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
        const token = localStorage.getItem('access_token');
        const id = Number(localStorage.getItem('userId'));
        const name = localStorage.getItem('userName');
        const email = localStorage.getItem('userEmail');
        const perfil = localStorage.getItem('userPerfil');

        if (token && email && perfil) {
            setAccessToken(token);
            setUser({ id, email, name: name ?? '', perfil });
        }
        setIsLoading(false);
    }, []);

if (isLoading) return <Loader />;

const login = async (email: string, password: string): Promise<boolean> => {
  try {
    const params = new URLSearchParams();
    params.append("username", email);
    params.append("password", password);

    // const response = await api.post("/login", params, {
    //   headers: { "Content-Type": "application/x-www-form-urlencoded" },
    // });

    const response = await api.post<{
            access_token: string;
            refresh_token: string;
        }>("/login/", params, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

    if (response.status === 200) {
      const { access_token, refresh_token } = response.data;

      // Decode do token JWT
      const payload = JSON.parse(atob(access_token.split('.')[1]));
      console.log("payload", payload);
      const perfil = payload.perfil;

      // Armazenar tudo no localStorage
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      localStorage.setItem("userEmail", payload.email);
      localStorage.setItem("userName", payload.name);
      localStorage.setItem("userPerfil", payload.perfil);
      localStorage.setItem("userId", String(payload.id));

      setUser({id: payload.id, email, perfil, name: payload.name});
      setAccessToken(access_token);

      // Redirecionar com base no perfil
      if (perfil === 'admin') {
        navigate('/dashboard');
      } else if (perfil === 'operador') {
        navigate('/operador-dashboard');
      } else {
        navigate('/home');
      }

      return true;
    } else {
      return false;
    }
    
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    alert("Usuário ou senha inválidos.");
    return false;
  }
};
  
//   const login = async (email: string, password: string): Promise<boolean> => {
//         try {
//             const params = new URLSearchParams();
//             params.append("username", email); // FastAPI espera "username"
//             params.append("password", password);

//             const response = await api.post("/login", params, {
//             headers: {
//                 "Content-Type": "application/x-www-form-urlencoded",
//             },
//             });

//             // Verificação básica da resposta
//             if (response.status === 200) {
//             const data = response.data as {
//                 access_token: string;
//                 refresh_token: string;
//             };

//             // Salvando tokens e e-mail no localStorage
//             localStorage.setItem("access_token", data.access_token);
//             localStorage.setItem("refresh_token", data.refresh_token);
//             localStorage.setItem("userEmail", email);

//             return true;
//             }

//             return false;
//         } catch (error) {
//             console.error("Erro ao fazer login:", error);
//             return false;
//         }
//     };

  const logout = () => {
    logoutService();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('userEmail');
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

