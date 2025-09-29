// src/components/FiltroRegistros.tsx
import { useState } from "react";

type Cliente = { id: number; nome: string };
type Obra    = { id: number; nome: string; cliente_id: number };

type Props = {
  clientes: Cliente[];
  obras: Obra[]; // obras do cliente atualmente selecionado
  onChangeCliente: (clienteId: number | null) => void; // pai carrega obras
  onFilter: (filtros: { clienteId: number | null; obraId: number | null; usuario: string }) => void;
};

export function FiltroRegistros({ clientes, obras, onChangeCliente, onFilter }: Props) {
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [obraId, setObraId]       = useState<number | null>(null);
  const [usuario, setUsuario]     = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilter({ clienteId, obraId, usuario: usuario.trim() });
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%" }} className="flex flex-wrap items-end gap-4 mb-6">
      {/* Cliente */}
      <div className="dv-bloco-filtros">
        <label className="block text-sm font-medium lbl-filtros">Cliente</label>
        <select
          value={clienteId ?? ""}
          onChange={(e) => {
            const v = e.target.value ? Number(e.target.value) : null;
            setClienteId(v);
            setObraId(null);           // limpa obra
            onChangeCliente(v);        // pai carrega obras do cliente
          }}
          className="mt-1 block border border-gray-300 rounded-md px-2 py-1"
        >
          <option value="">Todos</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
      </div>

      {/* Obra (depende do cliente) */}
      <div className="dv-bloco-filtros">
        <label className="block text-sm font-medium lbl-filtros">Obra</label>
        <select
          value={obraId ?? ""}
          onChange={(e) => setObraId(e.target.value ? Number(e.target.value) : null)}
          disabled={!clienteId}
          className="mt-1 block border border-gray-300 rounded-md px-2 py-1"
        >
          <option value="">{clienteId ? "Todas" : "Selecione um cliente"}</option>
          {obras.map((o) => (
            <option key={o.id} value={o.id}>{o.nome}</option>
          ))}
        </select>
      </div>

      {/* Líder equipa */}
      <div className="dv-bloco-filtros">
        <label className="block text-sm font-medium lbl-filtros">Líder equipa</label>
        <input
          type="text"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          placeholder="Nome ou e-mail do usuário"
          className="mt-1 block border border-gray-300 rounded-md px-2 py-1"
        />
      </div>

      <button
        type="submit"
        style={{ padding: "0.3%" }}
        className="btn-bg-blue-500 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition dv-bloco-filtros"
      >
        Filtrar
      </button>
    </form>
  );
}






// import { useState } from "react";

// type Props = {
//   //onFilter: (filtros: { mes: string; ano: string; cliente: string; usuario: string; }) => void;
//   onFilter: (filtros: { cliente: string; usuario: string; obra:  }) => void;
// };

// export function FiltroRegistros({ onFilter }: Props) {
//   const [mes, setMes] = useState("");
//   const [ano, setAno] = useState("");
//   const [cliente, setCliente] = useState("");
//   const [usuario, setUsuario] = useState("");
//   const [obra, setObra] = useState(false);

//   const meses = [
//     { value: "01", label: "Janeiro" },
//     { value: "02", label: "Fevereiro" },
//     { value: "03", label: "Março" },
//     { value: "04", label: "Abril" },
//     { value: "05", label: "Maio" },
//     { value: "06", label: "Junho" },
//     { value: "07", label: "Julho" },
//     { value: "08", label: "Agosto" },
//     { value: "09", label: "Setembro" },
//     { value: "10", label: "Outubro" },
//     { value: "11", label: "Novembro" },
//     { value: "12", label: "Dezembro" },
//   ];

//   const anos = Array.from({ length: 6 }, (_, i) => 2023 + i);

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     onFilter({  cliente, usuario, obra });
//   };

//   return (
//     <form onSubmit={handleSubmit} style={{ width: "100%" }} className="flex flex-wrap items-end gap-4 mb-6">
//       {/* <div className="dv-bloco-filtros">
//         <label className="block text-sm font-medium lbl-filtros">Mês</label>
//         <select
//           value={mes}
//           onChange={(e) => setMes(e.target.value)}
//           className="mt-1 block border border-gray-300 rounded-md px-2 py-1"
//         >
//           <option value="">Todos</option>
//           {meses.map((m) => (
//             <option key={m.value} value={m.value}>{m.label}</option>
//           ))}
//         </select>
//       </div>

//       <div className="dv-bloco-filtros">
//         <label className="block text-sm font-medium lbl-filtros">Ano</label>
//         <select
//           value={ano}
//           onChange={(e) => setAno(e.target.value)}
//           className="mt-1 block border border-gray-300 rounded-md px-2 py-1"
//         >
//           <option value="">Todos</option>
//           {anos.map((a) => (
//             <option key={a} value={a}>{a}</option>
//           ))}
//         </select>
//       </div> */}

//       {/* <div className="dv-bloco-filtros">
//         <label className="block text-sm font-medium lbl-filtros">Cliente</label>
//         <input
//           type="text"
//           value={cliente}
//           onChange={(e) => setCliente(e.target.value)}
//           placeholder="Nome do cliente"
//           className="mt-1 block border border-gray-300 rounded-md px-2 py-1"
//         />
//       </div> */}

//       <div className="dv-bloco-filtros">
//         <label className="block text-sm font-medium lbl-filtros">Líder equipa</label>
//         <input
//           type="text"
//           value={usuario}
//           onChange={(e) => setUsuario(e.target.value)}
//           placeholder="Nome ou e-mail do usuário"
//           className="mt-1 block border border-gray-300 rounded-md px-2 py-1"
//         />
//       </div>

//       <button
//         type="submit"
//         style={{ padding: "0.3%" }}
//         className="btn-bg-blue-500 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition dv-bloco-filtros"
//       >
//         Filtrar
//       </button>
//     </form>
//   );
// }
