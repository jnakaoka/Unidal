import React from "react";

const Projetos: React.FC = () => {
  const projetos = [
    { id: 1, nome: "Sistema Interno", status: "Ativo" },
    { id: 2, nome: "Site Institucional", status: "Concluído" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-blue-600">Projetos</h1>
      <div className="bg-white p-6 shadow-md rounded-lg">
        <table className="w-full table-auto">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">ID</th>
              <th className="p-2">Nome</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {projetos.map((projeto) => (
              <tr key={projeto.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{projeto.id}</td>
                <td className="p-2">{projeto.nome}</td>
                <td className="p-2">{projeto.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Projetos;
