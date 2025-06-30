import React, { useEffect, useState } from "react";
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import axios from 'axios';

interface Projeto {
  id: number;
  nome: string;
  descricao: string;
  is_active: boolean;
}

const Projetos: React.FC = () => {
  const [projetos, setProjetos] = React.useState<Projeto[]>([]);
  const [editingProjeto, setEditingProjeto] = useState<Projeto | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [formData, setFormData] = useState({ nome: '', descricao: '', is_active: true });

  useEffect(() => {
    fetchProjetos();
  }, []);

  const fetchProjetos = async () => {
    try {
      const response = await api.get<Projeto[]>('/projetos/projetos');
      console.log('projetos', response.data);
      setProjetos(response.data);
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      await api.delete(`/projetos/projetos/${id}`);
      fetchProjetos();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
    }
  };

  const handleEditClick = (projeto: Projeto) => {
    setEditingProjeto(projeto);
    console.log('projeto', projeto);
    setFormData({
      nome: projeto.nome,
      descricao: projeto.descricao,
      is_active: projeto.is_active,
    });
      
    console.log('formData', formData);
    setIsEditing(true);
    setModalAberto(true);
    console.log('projetos edit', projeto);
  };

  const handleSalvarProjeto = async () => {
    try {
      console.log('formData', formData);
      if (isEditing && editingProjeto) {
        await api.put(`/projetos/projetos/${editingProjeto.id}`, {
          nome: formData.nome,
          descricao: formData.descricao,
          is_active: formData.is_active,
        });
      } else {
        await api.post('/projetos/projetos', {
          nome: formData.nome,
          descricao: formData.descricao,
          is_active: formData.is_active,
        });
      }

      resetForm();
      fetchProjetos();
    } 
    catch (error: any) {
      if (error.response) {
        console.error("Erro na resposta:", error.response.data);
        alert(JSON.stringify(error.response.data.detail, null, 2));
      } else {
        console.error("Erro genérico:", error.message);
      }
    }
  };

  const resetForm = () => {
    setFormData({ nome: '', descricao: '', is_active: true});
    setEditingProjeto(null);
    setIsEditing(false);
    setModalAberto(false);
  };

  // const projetos = [
  //   { id: 1, nome: "Sistema Interno", status: "Ativo" },
  //   { id: 2, nome: "Site Institucional", status: "Concluído" },
  // ];

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-blue-600">Projetos</h2>
      <div className="flex justify-between items-center mb-4">
        <Button
          onClick={() => {
            setFormData({ nome: '', descricao: '', is_active: true });
            setIsEditing(false);
            setEditingProjeto(null);
            setModalAberto(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded"
        >
          + Novo Projeto
        </Button>
      </div>
      <div className="bg-white p-6 shadow-md rounded-lg">
        <table className="w-full table-auto">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">ID</th>
              <th className="p-2">Nome</th>
              <th className="p-2">Descrição</th>
              <th className="p-2">Status</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {projetos.map((projeto) => (
              <tr key={projeto.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{projeto.id}</td>
                <td className="p-2">{projeto.nome}</td>
                <td className="p-2">{projeto.descricao}</td>
                <td className="p-2">{projeto.is_active}</td>
                <td className="p-2">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      projeto.is_active ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                    }`}
                  >
                    {projeto.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <Button variant="outline" onClick={() => handleEditClick(projeto)}>
                    Editar
                  </Button>
                  <Button variant="destructive" onClick={() => handleDelete(projeto.id)}>
                    Excluir
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modalAberto && (
        <div className="mt-6 bg-white border border-gray-300 rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">
            {isEditing ? "Editar Usuário" : "Novo Usuário"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1 block">Nome</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>

            <div>
              <Label className="mb-1 block">Descrição</Label>
              <Input
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              />
            </div>
            <div className="col-span-full">
              <Label className="mb-1 block">Status</Label>
              <select
                className="border border-gray-300 p-2 rounded w-full"
                value={formData.is_active ? "1" : "0"}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.value === "1" })
                }
              >
                <option value="1">Ativo</option>
                <option value="0">Inativo</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-6 gap-4">
            <Button onClick={handleSalvarProjeto}>
              {isEditing ? "Atualizar" : "Criar"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setModalAberto(false);
                setEditingProjeto(null);
                setFormData({ nome: "", descricao: "", is_active: true});
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projetos;
