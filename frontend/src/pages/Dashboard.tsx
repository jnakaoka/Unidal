// dashcoard.tsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const Dashboard: React.FC = () => {
  const stats = {
    projetosAtivos: 12,
    horasMes: 340,
    operadoresAtivos: 5,
  };

  const dadosHorasPorProjeto = [
    { projeto: 'Projeto A', horas: 120 },
    { projeto: 'Projeto B', horas: 80 },
    { projeto: 'Projeto C', horas: 60 },
    { projeto: 'Projeto D', horas: 40 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Dashboard</h1>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {/* <div className="bg-blue-50 border border-blue-100 shadow rounded-2xl p-6">
          <h2 className="text-sm font-medium text-blue-700">Projetos Ativos</h2>
          <p className="text-4xl font-bold text-blue-900 mt-2">{stats.projetosAtivos}</p>
        </div> */}
        <div className="bg-white shadow rounded-lg p-4 text-center border">
          <p className="text-sm text-gray-500">Projetos Ativos</p>
          <p className="text-2xl font-bold text-blue-600">12</p>
        </div>
        <div className="bg-green-50 border border-green-100 shadow rounded-2xl p-6">
          <h2 className="text-sm font-medium text-green-700">Horas no Mês</h2>
          <p className="text-4xl font-bold text-green-900 mt-2">{stats.horasMes}</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 shadow rounded-2xl p-6">
          <h2 className="text-sm font-medium text-purple-700">Operadores Ativos</h2>
          <p className="text-4xl font-bold text-purple-900 mt-2">{stats.operadoresAtivos}</p>
        </div>
      </div>

      {/* Gráfico de barras */}
      <div className="bg-white shadow rounded-lg p-4 mt-6 border">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Horas por Projeto</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dadosHorasPorProjeto}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="projeto" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="horas" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;


// import React from "react";

// const Dashboard: React.FC = () => {
//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-bold text-blue-600">Painel do Administrador</h1>
//       <p className="mt-4">Bem-vindo, admin. Aqui você gerencia o sistema.</p>
//     </div>
//   );
// };

// export default Dashboard;
