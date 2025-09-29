import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { Cliente } from '@/types/cliente';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Clientes: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<{ nome: string; is_active: boolean }>({ nome: '', is_active: true });

  const load = async () => {
    const { data } = await api.get<Cliente[]>('/clientes/');
    setClientes(data);
  };

  useEffect(() => { load(); }, []);

  const salvar = async () => {
    if (!form.nome.trim()) return alert('Informe o nome.');
    if (isEditing && editingId) {
      await api.put(`/clientes/${editingId}`, form);
    } else {
      await api.post('/clientes/', form);
    }
    setModalAberto(false); setIsEditing(false); setEditingId(null);
    setForm({ nome: '', is_active: true });
    load();
  };

  const editar = (c: Cliente) => {
    setEditingId(c.id);
    setForm({ nome: c.nome, is_active: c.is_active });
    setIsEditing(true);
    setModalAberto(true);
  };

  const excluir = async (id: number) => {
    if (!confirm('Excluir cliente?')) return;
    await api.delete(`/clientes/${id}`);
    load();
  };

  return (
    <div className="p-6 space-y-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Clientes</h2>
        <Button onClick={() => { setIsEditing(false); setEditingId(null); setForm({ nome: '', is_active: true }); setModalAberto(true); }}>
          + Novo Cliente
        </Button>
      </div>

      <div className="rounded-xl shadow overflow-x-auto bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Nome</th>
              <th className="px-4 py-2 text-left">Ativo</th>
              <th className="px-4 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-2">{c.id}</td>
                <td className="px-4 py-2">{c.nome}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${c.is_active ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                    {c.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-2 text-right space-x-2">
                  <Button variant="outline" onClick={() => editar(c)}>Editar</Button>
                  <Button variant="destructive" onClick={() => excluir(c.id)}>Excluir</Button>
                </td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">Nenhum cliente</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold">{isEditing ? 'Editar Cliente' : 'Novo Cliente'}</h3>

            <div className="space-y-3">
              <div>
                <Label>Nome</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                <span>Ativo</span>
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalAberto(false)}>Cancelar</Button>
              <Button onClick={salvar}>{isEditing ? 'Atualizar' : 'Salvar'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clientes;
