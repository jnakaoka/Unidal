import React from "react";
import { Link } from "react-router-dom";

const Unauthorized: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-3xl font-bold text-red-500">Acesso Negado</h1>
      <p className="mt-4">Você não tem permissão para acessar esta página.</p>
      <Link to="/" className="mt-6 text-blue-600 underline">Voltar para o início</Link>
    </div>
  );
};

export default Unauthorized;
