// src/routes/PrivateRoute.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";

interface PrivateRouteProps {
  children: React.ReactNode;
  /**
   * Lista de perfis permitidos. Se omitido, qualquer utilizador autenticado tem acesso.
   * Exemplo: ['admin', 'operador']
   */
  allowedProfiles?: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedProfiles }) => {
  const location = useLocation();

  // Normalizações para evitar string | null | undefined
  const token = localStorage.getItem("access_token") ?? "";
  const perfil = (localStorage.getItem("userPerfil") ?? "").toString();

  // Se não estiver autenticado, redireciona para login com next
  if (!token) {
    const pathname = location.pathname ?? "/";
    const search = location.search ?? "";
    const redirectTo = `${pathname}${search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(redirectTo)}`} replace />;
  }

  // Se foi especificado allowedProfiles e o perfil do user não está incluído -> negar
  if (allowedProfiles && Array.isArray(allowedProfiles) && allowedProfiles.length > 0) {
    // Normaliza os itens de allowedProfiles para string (por precaução)
    const normalized = allowedProfiles.map(String);
    if (!normalized.includes(perfil)) {
      // podes mudar para outra rota ou mostrar componente de "Access denied"
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Se tudo OK, renderiza filhos
  return <>{children}</>;
};

export default PrivateRoute;




// import React, { JSX, useEffect, useState } from 'react';
// import { Navigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';

// interface PrivateRouteProps {
//   children: JSX.Element;
//   allowedProfiles: string[];
// }

// const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedProfiles }) => {
//   const { user } = useAuth();
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     // Simula carregamento dos dados do contexto (ex: do localStorage)
//     const timer = setTimeout(() => {
//       setIsLoading(false);
//     }, 100); // ajuste esse tempo conforme necessário

//     return () => clearTimeout(timer);
//   }, []);

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <span className="text-gray-500">Carregando...</span>
//       </div>
//     );
//   }

//   if (!user) return <Navigate to="/login" replace />;
//   if (!allowedProfiles.includes(user.perfil)) return <Navigate to="/unauthorized" replace />;

//   return children;
// };

// export default PrivateRoute;

// import React, { JSX } from 'react';
// import { Navigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';

// interface PrivateRouteProps {
//   children: JSX.Element;
//   allowedProfiles: string[];
// }

// const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedProfiles }) => {
//   const { user } = useAuth();

//   if (!user) return <Navigate to="/login" />;
//   if (!allowedProfiles.includes(user.perfil)) return <Navigate to="/unauthorized" />;

//   return children;
// };

// export default PrivateRoute;
