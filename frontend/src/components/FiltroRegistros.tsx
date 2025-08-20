// src/components/FiltroRegistros.tsx
import { useState } from "react";

type Props = {
  onFilter: (filtros: { mes: string; ano: string; cliente: string }) => void;
};

export function FiltroRegistros({ onFilter }: Props) {
  const [mes, setMes] = useState("");
  const [ano, setAno] = useState("");
  const [cliente, setCliente] = useState("");

  const meses = [
    { value: "01", label: "Janeiro" },
    { value: "02", label: "Fevereiro" },
    { value: "03", label: "Março" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Maio" },
    { value: "06", label: "Junho" },
    { value: "07", label: "Julho" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ];

  const anos = Array.from({ length: 6 }, (_, i) => 2023 + i);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilter({ mes, ano, cliente });
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%" }} className="flex flex-wrap items-end gap-4 mb-6">
      <div className="dv-bloco-filtros">
        <label className="block text-sm font-medium lbl-filtros">Mês</label>
        <select
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="mt-1 block border border-gray-300 rounded-md px-2 py-1"
        >
          <option value="">Todos</option>
          {meses.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <div className="dv-bloco-filtros">
        <label className="block text-sm font-medium lbl-filtros">Ano</label>
        <select
          value={ano}
          onChange={(e) => setAno(e.target.value)}
          className="mt-1 block border border-gray-300 rounded-md px-2 py-1"
        >
          <option value="">Todos</option>
          {anos.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="dv-bloco-filtros">
        <label className="block text-sm font-medium lbl-filtros">Cliente</label>
        <input
          type="text"
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
          placeholder="Nome do cliente"
          className="mt-1 block border border-gray-300 rounded-md px-2 py-1"
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
}
