import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { Cliente } from '@/types/cliente';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Pagination, { usePagination } from "@/components/pagination-utils";
import LoadingState from "@/components/LoadingState";

const Clientes: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<{ nome: string; is_active: boolean }>({ nome: '', is_active: true });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

  // paginação (mesmo hook do RegistroHoras)
  const { pageItems, currentPage, setCurrentPage, totalPages } =
    usePagination<Cliente>(clientes, 20); // ajuste 20 se quiser

  const load = async () => {
    const { data } = await api.get<Cliente[]>('/clientes/');
    setClientes(data);
    // opcional: se página atual passar do limite após um CRUD, volte pra última válida
    // (o hook geralmente lida bem, mas deixo o exemplo)
    if (currentPage > Math.max(1, Math.ceil(data.length / 20))) {
      setCurrentPage(1);
    }
  };

  useEffect(() => {
    let montado = true;

    async function carregarInicial() {
      try {
        setCarregando(true);
        setErroCarregamento(null);

        const { data } = await api.get<Cliente[]>("/clientes/");

        if (!montado) return;

        setClientes(data);

        if (
          currentPage
          > Math.max(1, Math.ceil(data.length / 20))
        ) {
          setCurrentPage(1);
        }
      } catch {
        if (montado) {
          setErroCarregamento(
            "Não foi possível carregar os clientes."
          );
        }
      } finally {
        if (montado) {
          setCarregando(false);
        }
      }
    }

    void carregarInicial();

    return () => {
      montado = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const abrirNovo = () => {
    setIsEditing(false);
    setEditingId(null);
    setForm({ nome: '', is_active: true });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const editar = (c: Cliente) => {
    setIsEditing(true);
    setEditingId(c.id);
    setForm({ nome: c.nome, is_active: c.is_active });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelar = () => {
    setShowForm(false);
    setIsEditing(false);
    setEditingId(null);
    setForm({ nome: '', is_active: true });
  };

  const salvar = async () => {
    if (!form.nome.trim()) return alert('Informe o nome.');
    try {
      setIsSubmitting(true);
      if (isEditing && editingId) {
        await api.put(`/clientes/${editingId}`, form);
      } else {
        await api.post('/clientes/', form);
      }
      cancelar();
      await load();
    } finally {
      setIsSubmitting(false);
    }
  };

  const excluir = async (id: number) => {
    if (!confirm('Excluir cliente?')) return;
    await api.delete(`/clientes/${id}`);
    load();
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <h1 className="mb-6 text-3xl font-bold text-gray-800">
          Clientes
        </h1>

        <LoadingState message="A carregar clientes..." />
      </div>
    );
  }

  if (erroCarregamento) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <h1 className="mb-6 text-3xl font-bold text-gray-800">
          Clientes
        </h1>

        <div
          role="alert"
          className={[
            "rounded-lg border border-red-200",
            "bg-red-50 p-4 text-sm text-red-700",
          ].join(" ")}
        >
          {erroCarregamento}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Clientes</h2>
        <Button className="btn-bg-green-600 hover:bg-blue-700 text-white" onClick={abrirNovo}>+ Novo Cliente</Button>
      </div>

      {showForm && (
        <section className="bg-white rounded-xl shadow-xl border p-6 space-y-4 mb-4" aria-labelledby="titulo-form-cliente">
          <h3 id="titulo-form-cliente" className="text-xl font-semibold text-gray-700">
            {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 align-float-left">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                <span>Ativo</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button className="btn-bg-blue-500" onClick={salvar} disabled={isSubmitting} aria-busy={isSubmitting}>
              {isSubmitting ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Salvar')}
            </Button>
            <Button className="generic-btn" variant="outline" onClick={cancelar} disabled={isSubmitting}>
              Cancelar
            </Button>
          </div>
        </section>
      )}

      <div className="rounded-xl shadow overflow-x-auto bg-white">
        <table cellSpacing="0" cellPadding="20" className="w-full table-auto text-sm divide-y divide-gray-200 table-spacing-0">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide text-left">
            <tr className="head-lista">
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Nome</th>
              <th className="px-4 py-2 text-left">Ativo</th>
              <th className="px-4 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-gray-50 text-xs text-gray-500 tracking-wide text-left">
            {pageItems.map((c, index) => (
              <tr key={c.id} className={index % 2 === 0 ? 'line-bg-white-600' : 'line-bg-gray-100'}>
                <td className="px-4 py-2">{c.id}</td>
                <td className="px-4 py-2">{c.nome}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${c.is_active ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                    {c.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-2 text-right space-x-2">
                  <Button className="px-3 py-1 btn-bg-blue-500 text-white rounded hover:bg-yellow-600 text-sm" variant="outline" onClick={() => editar(c)}>Editar</Button>
                  <Button className="px-3 py-1 btn-bg-red-500 text-white rounded hover:bg-yellow-600 text-sm" variant="destructive" onClick={() => excluir(c.id)}>Excluir</Button>
                </td>
              </tr>
            ))}
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">Nenhum cliente</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* controles de paginação */}
        <div className="mt-4">
          <Pagination
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            siblingCount={1}
            boundaryCount={1}
          />
        </div>
      </div>
    </div>
  );
};

export default Clientes;


// import React, { useEffect, useState } from 'react';
// import api from '@/services/api';
// import { Cliente } from '@/types/cliente';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';

// const Clientes: React.FC = () => {
//   const [clientes, setClientes] = useState<Cliente[]>([]);
//   const [modalAberto, setModalAberto] = useState(false);
//   const [isEditing, setIsEditing] = useState(false);
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [form, setForm] = useState<{ nome: string; is_active: boolean }>({ nome: '', is_active: true });

//   const load = async () => {
//     const { data } = await api.get<Cliente[]>('/clientes/');
//     setClientes(data);
//   };

//   useEffect(() => { load(); }, []);

//   const salvar = async () => {
//     if (!form.nome.trim()) return alert('Informe o nome.');
//     if (isEditing && editingId) {
//       await api.put(`/clientes/${editingId}`, form);
//     } else {
//       await api.post('/clientes/', form);
//     }
//     setModalAberto(false); setIsEditing(false); setEditingId(null);
//     setForm({ nome: '', is_active: true });
//     load();
//   };

//   const editar = (c: Cliente) => {
//     setEditingId(c.id);
//     setForm({ nome: c.nome, is_active: c.is_active });
//     setIsEditing(true);
//     setModalAberto(true);
//   };

//   const excluir = async (id: number) => {
//     if (!confirm('Excluir cliente?')) return;
//     await api.delete(`/clientes/${id}`);
//     load();
//   };

//   return (
//     <div className="p-6 space-y-6 bg-gray-100 min-h-screen">
//       <div className="flex justify-between items-center">
//         <h2 className="text-2xl font-bold">Clientes</h2>
//         <Button onClick={() => { setIsEditing(false); setEditingId(null); setForm({ nome: '', is_active: true }); setModalAberto(true); }}>
//           + Novo Cliente
//         </Button>
//       </div>

//       <div className="rounded-xl shadow overflow-x-auto bg-white">
//         <table className="w-full text-sm">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-4 py-2 text-left">ID</th>
//               <th className="px-4 py-2 text-left">Nome</th>
//               <th className="px-4 py-2 text-left">Ativo</th>
//               <th className="px-4 py-2 text-right">Ações</th>
//             </tr>
//           </thead>
//           <tbody>
//             {clientes.map((c) => (
//               <tr key={c.id} className="border-t">
//                 <td className="px-4 py-2">{c.id}</td>
//                 <td className="px-4 py-2">{c.nome}</td>
//                 <td className="px-4 py-2">
//                   <span className={`px-2 py-1 rounded-full text-xs ${c.is_active ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
//                     {c.is_active ? 'Ativo' : 'Inativo'}
//                   </span>
//                 </td>
//                 <td className="px-4 py-2 text-right space-x-2">
//                   <Button variant="outline" onClick={() => editar(c)}>Editar</Button>
//                   <Button variant="destructive" onClick={() => excluir(c.id)}>Excluir</Button>
//                 </td>
//               </tr>
//             ))}
//             {clientes.length === 0 && (
//               <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">Nenhum cliente</td></tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {modalAberto && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4">
//             <h3 className="text-lg font-semibold">{isEditing ? 'Editar Cliente' : 'Novo Cliente'}</h3>

//             <div className="space-y-3">
//               <div>
//                 <Label>Nome</Label>
//                 <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
//               </div>
//               <label className="flex items-center gap-2">
//                 <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
//                 <span>Ativo</span>
//               </label>
//             </div>

//             <div className="flex justify-end gap-2">
//               <Button variant="outline" onClick={() => setModalAberto(false)}>Cancelar</Button>
//               <Button onClick={salvar}>{isEditing ? 'Atualizar' : 'Salvar'}</Button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Clientes;
