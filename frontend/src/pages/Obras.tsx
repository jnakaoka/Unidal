import React, { useEffect, useRef, useState } from 'react';
import api from '@/services/api';
import { Obra } from '@/types/obras';
import { Cliente } from '@/types/cliente';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Pagination, { usePagination } from "@/components/pagination-utils";
import LoadingState from '@/components/LoadingState';

const Obras: React.FC = () => {
  const [obras, setObras] = useState<Obra[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filtroCliente, setFiltroCliente] = useState<number | ''>('');

  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [carregandoLista, setCarregandoLista] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

  const primeiraCarga = useRef(true);

  const [form, setForm] = useState<{ nome: string; descricao: string; cliente_id: number | '' }>({
    nome: '',
    descricao: '',
    cliente_id: '',
  });

  // paginação
  const { pageItems, currentPage, setCurrentPage, totalPages } =
    usePagination<Obra>(obras, 20);

  const loadClientes = async () => {
    const { data } = await api.get<Cliente[]>('/clientes/');
    setClientes(data);
  };

  const loadObras = async (mostrarLoader = false) => {
    try {
      if (mostrarLoader) {
        setCarregandoLista(true);
      }

      setErroCarregamento(null);

      const url = filtroCliente
        ? `/obras/?cliente_id=${filtroCliente}`
        : '/obras/';

      const { data } = await api.get<Obra[]>(url);

      setObras(data);

      if (
        currentPage
        > Math.max(1, Math.ceil(data.length / 20))
      ) {
        setCurrentPage(1);
      }
    } catch {
      setErroCarregamento(
        'Não foi possível carregar as obras.'
      );
    } finally {
      if (mostrarLoader) {
        setCarregandoLista(false);
      }
    }
  };

  useEffect(() => {
    let montado = true;

    async function carregarInicial() {
      try {
        setCarregandoInicial(true);
        setErroCarregamento(null);

        await Promise.all([
          loadClientes(),
          loadObras(),
        ]);
      } catch {
        if (montado) {
          setErroCarregamento(
            'Não foi possível carregar os dados das obras.'
          );
        }
      } finally {
        if (montado) {
          setCarregandoInicial(false);
        }
      }
    }

    void carregarInicial();

    return () => {
      montado = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (primeiraCarga.current) {
      primeiraCarga.current = false;
      return;
    }

    void loadObras(true);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroCliente]);

  const abrirNova = () => {
    setIsEditing(false);
    setEditingId(null);
    setForm({ nome: '', descricao: '', cliente_id: filtroCliente || '' });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const editar = (o: Obra) => {
    setIsEditing(true);
    setEditingId(o.id);
    setForm({ nome: o.nome, descricao: o.descricao || '', cliente_id: o.cliente_id });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelar = () => {
    setShowForm(false);
    setIsEditing(false);
    setEditingId(null);
    setForm({ nome: '', descricao: '', cliente_id: '' });
  };

  const salvar = async () => {
    if (!form.nome.trim() || !form.cliente_id) {
      alert('Informe nome e cliente.');
      return;
    }
    try {
      setIsSubmitting(true);
      const payload = {
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || null,
        cliente_id: Number(form.cliente_id),
      };
      if (isEditing && editingId) {
        await api.put(`/obras/${editingId}`, payload);
      } else {
        await api.post('/obras/', payload);
      }
      cancelar();
      await loadObras();
    } finally {
      setIsSubmitting(false);
    }
  };

  const excluir = async (id: number) => {
    if (!confirm('Excluir obra?')) return;
    await api.delete(`/obras/${id}`);
    loadObras();
  };

  if (carregandoInicial) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <h1 className="mb-6 text-3xl font-bold text-gray-800">
          Obras
        </h1>

        <LoadingState message="A carregar obras..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Obras</h2>
        <div className="flex gap-2">
          <select
            className="border rounded px-3 py-2 bg-white"
            value={filtroCliente}
            style={{ margin: '0 2% 0 0' }}
            onChange={(e) => setFiltroCliente(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">Todos os clientes</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <Button className="btn-bg-green-600 hover:bg-blue-700 text-white" onClick={abrirNova}>
            + Nova Obra
          </Button>
        </div>
      </div>

      {erroCarregamento && (
        <div
          role="alert"
          className={[
            "rounded-lg border border-red-200",
            "bg-red-50 p-4 text-sm text-red-700",
          ].join(" ")}
        >
          {erroCarregamento}
        </div>
      )}

      {showForm && (
        <section className="bg-white rounded-xl shadow-xl border p-6 space-y-4 mb-4">
          <h3 className="text-xl font-semibold text-gray-700">
            {isEditing ? 'Editar Obra' : 'Nova Obra'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente</Label>
              <select
                id="cliente"
                className="border rounded px-3 py-2 w-full bg-white"
                value={form.cliente_id}
                onChange={(e) =>
                  setForm({ ...form, cliente_id: e.target.value ? Number(e.target.value) : '' })
                }
              >
                <option value="">Selecione</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <textarea
                id="descricao"
                className="border rounded px-3 py-2 w-full"
                rows={3}
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
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

    <div className="overflow-hidden rounded-xl bg-white shadow">
      {carregandoLista ? (
        <LoadingState
          compact
          message="A atualizar a lista de obras..."
        />
      ) : (
        <>
        <div className="overflow-x-auto">
          <table cellSpacing="0" cellPadding="20" className="w-full table-auto text-sm divide-y divide-gray-200 table-spacing-0">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide text-left">
              <tr className="head-lista">
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Nome</th>
                <th className="px-4 py-2 text-left">Cliente</th>
                <th className="px-4 py-2 text-left">Descrição</th>
                <th className="px-4 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-gray-50 text-xs text-gray-500 tracking-wide text-left">
              {pageItems.map((o, index) => (
                <tr key={o.id} className={index % 2 === 0 ? 'line-bg-white-600' : 'line-bg-gray-100'}>
                  <td className="px-4 py-2">{o.id}</td>
                  <td className="px-4 py-2">{o.nome}</td>
                  <td className="px-4 py-2">{o.cliente?.nome || `#${o.cliente_id}`}</td>
                  <td className="px-4 py-2">{o.descricao}</td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <Button className="px-3 py-1 btn-bg-blue-500 text-white rounded hover:bg-yellow-600 text-sm" variant="outline" onClick={() => editar(o)}>Editar</Button>
                    <Button className="px-3 py-1 btn-bg-red-500 text-white rounded hover:bg-yellow-600 text-sm" variant="destructive" onClick={() => excluir(o.id)}>Excluir</Button>
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">Nenhuma obra</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
        </>
      )}
      </div>
    </div>
  );
};

export default Obras;



// import React, { useEffect, useState } from 'react';
// import api from '@/services/api';
// import { Obra } from '@/types/obras';
// import { Cliente } from '@/types/cliente';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';

// const Obras: React.FC = () => {
//   const [obras, setObras] = useState<Obra[]>([]);
//   const [clientes, setClientes] = useState<Cliente[]>([]);
//   const [filtroCliente, setFiltroCliente] = useState<number | ''>('');
//   const [modalAberto, setModalAberto] = useState(false);
//   const [isEditing, setIsEditing] = useState(false);
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [form, setForm] = useState<{ nome: string; descricao: string; cliente_id: number | '' }>({ nome: '', descricao: '', cliente_id: '' });

//   const loadClientes = async () => {
//     const { data } = await api.get<Cliente[]>('/clientes/');
//     setClientes(data);
//   };

//   const loadObras = async () => {
//     const url = filtroCliente ? `/obras/?cliente_id=${filtroCliente}` : '/obras/';
//     const { data } = await api.get<Obra[]>(url);
//     setObras(data);
//   };

//   useEffect(() => { loadClientes(); }, []);
//   useEffect(() => { loadObras(); }, [filtroCliente]);

//   const salvar = async () => {
//     if (!form.nome.trim() || !form.cliente_id) return alert('Informe nome e cliente.');
//     if (isEditing && editingId) {
//       await api.put(`/obras/${editingId}`, {
//         nome: form.nome,
//         descricao: form.descricao || null,
//         cliente_id: Number(form.cliente_id),
//       });
//     } else {
//       await api.post('/obras/', {
//         nome: form.nome,
//         descricao: form.descricao || null,
//         cliente_id: Number(form.cliente_id),
//       });
//     }
//     setModalAberto(false); setIsEditing(false); setEditingId(null);
//     setForm({ nome: '', descricao: '', cliente_id: '' });
//     loadObras();
//   };

//   const editar = (o: Obra) => {
//     setEditingId(o.id);
//     setForm({ nome: o.nome, descricao: o.descricao || '', cliente_id: o.cliente_id });
//     setIsEditing(true);
//     setModalAberto(true);
//   };

//   const excluir = async (id: number) => {
//     if (!confirm('Excluir obra?')) return;
//     await api.delete(`/obras/${id}`);
//     loadObras();
//   };

//   return (
//     <div className="p-6 space-y-6 bg-gray-100 min-h-screen">
//       <div className="flex justify-between items-center">
//         <h2 className="text-2xl font-bold">Obras</h2>
//         <div className="flex gap-2">
//           <select
//             className="border rounded px-3 py-2 bg-white"
//             value={filtroCliente}
//             onChange={(e) => setFiltroCliente(e.target.value ? Number(e.target.value) : '')}
//           >
//             <option value="">Todos os clientes</option>
//             {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
//           </select>
//           <Button onClick={() => { setIsEditing(false); setEditingId(null); setForm({ nome: '', descricao: '', cliente_id: '' }); setModalAberto(true); }}>
//             + Nova Obra
//           </Button>
//         </div>
//       </div>

//       <div className="rounded-xl shadow overflow-x-auto bg-white">
//         <table className="w-full text-sm">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-4 py-2 text-left">ID</th>
//               <th className="px-4 py-2 text-left">Nome</th>
//               <th className="px-4 py-2 text-left">Cliente</th>
//               <th className="px-4 py-2 text-left">Descrição</th>
//               <th className="px-4 py-2 text-right">Ações</th>
//             </tr>
//           </thead>
//           <tbody>
//             {obras.map(o => (
//               <tr key={o.id} className="border-t">
//                 <td className="px-4 py-2">{o.id}</td>
//                 <td className="px-4 py-2">{o.nome}</td>
//                 <td className="px-4 py-2">{o.cliente?.nome || `#${o.cliente_id}`}</td>
//                 <td className="px-4 py-2">{o.descricao}</td>
//                 <td className="px-4 py-2 text-right space-x-2">
//                   <Button variant="outline" onClick={() => editar(o)}>Editar</Button>
//                   <Button variant="destructive" onClick={() => excluir(o.id)}>Excluir</Button>
//                 </td>
//               </tr>
//             ))}
//             {obras.length === 0 && (
//               <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">Nenhuma obra</td></tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {modalAberto && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 space-y-4">
//             <h3 className="text-lg font-semibold">{isEditing ? 'Editar Obra' : 'Nova Obra'}</h3>

//             <div className="space-y-3">
//               <div>
//                 <Label>Nome</Label>
//                 <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
//               </div>
//               <div>
//                 <Label>Cliente</Label>
//                 <select
//                   className="border rounded px-3 py-2 w-full bg-white"
//                   value={form.cliente_id}
//                   onChange={(e) => setForm({ ...form, cliente_id: e.target.value ? Number(e.target.value) : '' })}
//                 >
//                   <option value="">Selecione</option>
//                   {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
//                 </select>
//               </div>
//               <div>
//                 <Label>Descrição</Label>
//                 <textarea
//                   className="border rounded px-3 py-2 w-full"
//                   rows={3}
//                   value={form.descricao}
//                   onChange={(e) => setForm({ ...form, descricao: e.target.value })}
//                 />
//               </div>
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

// export default Obras;
