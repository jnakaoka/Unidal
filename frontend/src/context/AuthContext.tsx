// src/context/authContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginService, logout as logoutService } from '../services/auth';
import { TokenResponse } from '../types';

interface AuthContextType {
  user: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const email = localStorage.getItem('userEmail');
    if (token && email) {
      setUser(email);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const data: TokenResponse | null = await loginService(email, password);
    if (data) {
      localStorage.setItem('userEmail', email);
      setUser(email);
      return true;
    }
    return false;
  };

  const logout = () => {
    logoutService();
    localStorage.removeItem('userEmail');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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

