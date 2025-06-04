import React, { JSX, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps {
  children: JSX.Element;
  allowedProfiles: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedProfiles }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simula carregamento dos dados do contexto (ex: do localStorage)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100); // ajuste esse tempo conforme necessário

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="text-gray-500">Carregando...</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!allowedProfiles.includes(user.perfil)) return <Navigate to="/unauthorized" replace />;

  return children;
};

export default PrivateRoute;

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
