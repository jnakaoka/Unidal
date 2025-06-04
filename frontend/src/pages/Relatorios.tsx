import React, { useState } from 'react';

interface Registro {
  operador: string;
  projeto: string;
  data: string;
  horas: number;
}

const Relatorios: React.FC = () => {
  const [filtroProjeto, setFiltroProjeto] = useState('');
  const [filtroOperador, setFiltroOperador] = useState('');
  const [filtroMes, setFiltroMes] = useState('');

  // Simulação de dados
  const registros: Registro[] = [
    { operador: 'João', projeto: 'Projeto A', data: '2025-06-01', horas: 8 },
    { operador: 'Maria', projeto: 'Projeto B', data: '2025-06-02', horas: 6 },
    { operador: 'João', projeto: 'Projeto A', data: '2025-06-03', horas: 7 },
    { operador: 'Maria', projeto: 'Projeto B', data: '2025-06-04', horas: 8 },
  ];

  const registrosFiltrados = registros.filter((r) => {
    const mesRegistro = r.data.slice(0, 7);
    return (
      (!filtroProjeto || r.projeto === filtroProjeto) &&
      (!filtroOperador || r.operador === filtroOperador) &&
      (!filtroMes || mesRegistro === filtroMes)
    );
  });

  const totalHoras = registrosFiltrados.reduce((acc, r) => acc + r.horas, 0);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Relatórios</h1>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <select
          className="p-2 border rounded-lg"
          value={filtroProjeto}
          onChange={(e) => setFiltroProjeto(e.target.value)}
        >
          <option value="">Todos os Projetos</option>
          <option value="Projeto A">Projeto A</option>
          <option value="Projeto B">Projeto B</option>
        </select>

        <select
          className="p-2 border rounded-lg"
          value={filtroOperador}
          onChange={(e) => setFiltroOperador(e.target.value)}
        >
          <option value="">Todos os Operadores</option>
          <option value="João">João</option>
          <option value="Maria">Maria</option>
        </select>

        <input
          type="month"
          className="p-2 border rounded-lg"
          value={filtroMes}
          onChange={(e) => setFiltroMes(e.target.value)}
        />
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow-md">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Data</th>
              <th className="px-4 py-2 text-left">Projeto</th>
              <th className="px-4 py-2 text-left">Operador</th>
              <th className="px-4 py-2 text-left">Horas</th>
            </tr>
          </thead>
          <tbody>
            {registrosFiltrados.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="px-4 py-2">{r.data}</td>
                <td className="px-4 py-2">{r.projeto}</td>
                <td className="px-4 py-2">{r.operador}</td>
                <td className="px-4 py-2">{r.horas}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="p-4 font-semibold bg-gray-50 border-t">
          Total de Horas: {totalHoras}
        </div>
      </div>
    </div>
  );
};

export default Relatorios;
