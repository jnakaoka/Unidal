import React from "react";
import { Link } from "react-router-dom";

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-4xl font-bold text-gray-700">404</h1>
      <p className="mt-2 text-lg">Página não encontrada.</p>
      <Link to="/" className="mt-4 text-blue-600 underline">Voltar para o início</Link>
    </div>
  );
};

export default NotFound;
