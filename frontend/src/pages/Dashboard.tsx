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
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white shadow-md rounded-2xl p-4">
          <h2 className="text-gray-600 text-sm">Projetos Ativos</h2>
          <p className="text-3xl font-bold text-blue-600">{stats.projetosAtivos}</p>
        </div>
        <div className="bg-white shadow-md rounded-2xl p-4">
          <h2 className="text-gray-600 text-sm">Horas no Mês</h2>
          <p className="text-3xl font-bold text-green-600">{stats.horasMes}</p>
        </div>
        <div className="bg-white shadow-md rounded-2xl p-4">
          <h2 className="text-gray-600 text-sm">Operadores Ativos</h2>
          <p className="text-3xl font-bold text-purple-600">{stats.operadoresAtivos}</p>
        </div>
      </div>

      {/* Gráfico de barras */}
      <div className="bg-white shadow-md rounded-2xl p-4">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Horas por Projeto</h2>
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
