import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex flex-col items-center pt-10">
        {/* Logo */}
        <img style={{ width: '40%' }} src="/logo_unidal_editado.png" alt="Logo Unidal" className="w-40 h-auto mb-4" />

        {/* Título */}
        <h2 className="text-2xl font-bold text-gray-800 mb-8">Login</h2>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="w-full max-w-[40%] min-w-[300px] space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 text-center">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              style={{ borderRadius: '5px' }}
              onChange={e => setEmail(e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Digite seu email"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 text-center">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              style={{ borderRadius: '5px' }}
              onChange={e => setPassword(e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Digite sua senha"
              required
            />
          </div>
          <button
            type="submit"
            style={{ margin: '2% 0 0 0' }}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
