import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Perfil } from "../types/perfil";
import axios from 'axios';

interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  is_active: boolean;
  perfil: Perfil;
}

const GestaoUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: "", perfil_id: 0 });
  const [perfis, setPerfis] = useState<Perfil[]>([]);

  useEffect(() => {
    fetchUsuarios();
    fetchPerfis();
  }, []);

  const fetchPerfis = async () => {
    try {
      const response = await axios.get<Perfil[]>(
        `${import.meta.env.VITE_API_URL}/perfis/perfis`
      );
      console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);

      console.log('response')
      console.log(response.data); 
      const perfisData = response.data;
      console.log('perfisData');
      console.log(perfisData);
      if (Array.isArray(perfisData)) {
        setPerfis(perfisData);
      } else {
        console.error("Resposta de perfis inválida:", perfisData);
      }

      if (perfisData.length > 0 && formData.perfil_id === 0) {
        setFormData((prev) => ({ ...prev, perfil_id: perfisData[0].id }));
      }
    } catch (error) {
      console.error("Erro ao buscar perfis:", error);
    }
  };

  const fetchUsuarios = async () => {
    try {
      const response = await api.get<User[]>('/users');
      setUsuarios(response.data);
      console.log(response.data);
      //console.log('usuarios', usuarios);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  // const fetchPerfis = async () => {
  //   try {
  //     const response = await api.get<Perfil[]>('/perfis');
  //     setPerfis(response.data);
  //   } catch (error) {
  //     console.error('Erro ao carregar perfis:', error);
  //   }
  // };

  const handleNovoUsuario = () => {
    const perfilInicial = perfis[0]?.id || 0;
    setFormData({ name: "", email: "", password: "", perfil_id: perfilInicial });
    setModalAberto(true);
    setEditingUser(null);
  };
  
  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsuarios();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    console.log('user.perfil', user.perfil);
    console.log('user', user);
    setFormData({
      name: user.name,
      email: user.email,
      password: user.password,
      perfil_id: typeof user.perfil === 'object' ? user.perfil.id : user.perfil,
    });
    console.log('formData.perfil_id:', formData.perfil_id, typeof formData.perfil_id);
    setIsEditing(true);
    setModalAberto(true);
    console.log('user edit', user);
  };

  const handleSalvarUsuario = async () => {
    try {
      console.log('formData', formData);
      if (isEditing && editingUser) {
        await api.put(`/users/${editingUser.id}`, {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          perfil_id: formData.perfil_id,
        });
      } else {
        await api.post('/users', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          perfil_id: formData.perfil_id,
        });
      }

      resetForm();
      fetchUsuarios();
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
    setFormData({ name: '', email: '', password: '', perfil_id: perfis[0]?.id || 0 });
    setEditingUser(null);
    setIsEditing(false);
    setModalAberto(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Gestão de Usuários</h2>

      <div className="flex justify-between items-center mb-4">
        <Button
          onClick={() => {
            setFormData({ name: '', email: '', password: '', perfil_id: perfis[0]?.id || 0 });
            setIsEditing(false);
            setEditingUser(null);
            setModalAberto(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded"
        >
          + Novo Usuário
        </Button>
      </div>

      <table className="min-w-full text-sm text-left text-gray-600 bg-white border border-gray-200">
        <thead className="bg-gray-100 text-xs uppercase text-gray-700">
          <tr>
            <th className="p-2 text-left">Id</th>
            <th className="p-2 text-left">Nome</th>
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-left">Perfil</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Ações</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((user) => (
            <tr key={user.id} className="border-t hover:bg-gray-50">
              <td className="p-2">{user.id}</td>
              <td className="p-2">{user.name}</td>
              <td className="p-2">{user.email}</td>
              <td className="p-2">{user.perfil?.nome || 'Sem perfil'}</td>
              <td className="p-2">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    user.is_active ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                  }`}
                >
                  {user.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td className="px-6 py-4 flex gap-2">
                <Button variant="outline" onClick={() => handleEditClick(user)}>
                  Editar
                </Button>
                <Button variant="destructive" onClick={() => handleDelete(user.id)}>
                  Excluir
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalAberto && (
        <div className="mt-6 bg-white border border-gray-300 rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">
            {isEditing ? "Editar Usuário" : "Novo Usuário"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1 block">Nome</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label className="mb-1 block">Email</Label>
              <Input
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-1 block">Senha</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="col-span-full">
              <Label className="mb-1 block">Perfil</Label>
              <select
                value={formData.perfil_id ?? ''}
                onChange={(e) => setFormData({ ...formData, perfil_id: parseInt(e.target.value) })}
              >
                <option value="">Selecione um perfil</option>
                {perfis.map((perfil) => (
                  <option key={perfil.id} value={perfil.id}>
                    {perfil.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-6 gap-4">
            <Button onClick={handleSalvarUsuario}>
              {isEditing ? "Atualizar" : "Criar"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setModalAberto(false);
                setEditingUser(null);
                setFormData({ name: "", email: "", password: "", perfil_id: perfis[0]?.id || 0 });
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

export default GestaoUsuarios;
