// src/components/FiltroUsuarios.tsx
import { useState } from "react";

export interface FiltrosUsuarios {
  nome?: string;
  email?: string;
  empresa?: string;
  perfil?: string;
}

interface FiltroUsuariosProps {
  onFiltrar: (filtros: FiltrosUsuarios) => void;
}

export const FiltroUsuarios: React.FC<FiltroUsuariosProps> = ({ onFiltrar }) => {
  const [filtros, setFiltros] = useState<FiltrosUsuarios>({
    nome: "",
    email: "",
    empresa: "",
    perfil: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltrar(filtros);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ width: "85%" }} className="flex flex-wrap items-end gap-4 mb-6"
    >
      <div className="dv-bloco-filtros">
        <label className="block text-sm font-medium lbl-filtros">Nome</label>
        <input
          type="text"
          name="nome"
          placeholder="Nome"
          value={filtros.nome}
          onChange={handleChange}
          className="border p-2 rounded"
        />
      </div>
      <div className="dv-bloco-filtros">
        <label className="block text-sm font-medium lbl-filtros">Email</label>
        <input
          type="text"
          name="email"
          placeholder="Email"
          value={filtros.email}
          onChange={handleChange}
          className="border p-2 rounded"
        />
      </div>
      <div className="dv-bloco-filtros">
        <label className="block text-sm font-medium lbl-filtros">Empresa</label>
        <input
          type="text"
          name="empresa"
          placeholder="Empresa"
          value={filtros.empresa}
          onChange={handleChange}
          className="border p-2 rounded"
        />
      </div>
      <div className="dv-bloco-filtros">
        <label className="block text-sm font-medium lbl-filtros">Perfil</label>
        <input
          type="text"
          name="perfil"
          placeholder="Perfil"
          value={filtros.perfil}
          onChange={handleChange}
          className="border p-2 rounded"
        />
      </div>
      
      <button
        type="submit"
        style={{ padding: "0.3%" }}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition dv-bloco-filtros generic-btn"
      >
        Filtrar
      </button>
    </form>
  );
};
