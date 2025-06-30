import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectItem } from '../components/ui/select';
import axios from 'axios';

interface RegistroHoras {
  id: number;
  projeto_id: number;
  usuario_id: number;
  data: string;
  horas: string;
}
interface Projeto {
  id: number;
  nome: string;
}

const RegistroHoras: React.FC = () => {
  const { user } = useAuth();
  const [registroHoras, setRegistroHoras] = useState<RegistroHoras[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [projetoId, setProjetoId] = useState('');
  const [data, setData] = useState('');
  const [horas, setHoras] = useState('');
  const [descricao, setDescricao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRegistroHoras, setEditingRegistroHoras] = useState<RegistroHoras | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [formData, setFormData] = useState({ projeto_id: 0, usuario_id: 0, data: '', horas: ''});
  const { accessToken } = useAuth();

  useEffect(() => {
    fetchProjetos();
    fetchRegistroHoras();
  }, []);

  const fetchProjetos = async () => {
    try {
      const response = await axios.get<Projeto[]>(
        `${import.meta.env.VITE_API_URL}/projetos/projetos`
      );
      console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);

      console.log('response')
      console.log(response.data); 
      const projetosData = response.data;
      console.log('perfisData');
      console.log(projetosData);
      if (Array.isArray(projetosData)) {
        setProjetos(projetosData);
      } else {
        console.error("Resposta de perfis inválida:", projetosData);
      }

      if (projetosData.length > 0 && formData.projeto_id === 0) {
        setFormData((prev) => ({ ...prev, projeto_id: projetosData[0].id }));
      }
    } catch (error) {
      console.error("Erro ao buscar perfis:", error);
    }
  };

  const fetchRegistroHoras = async () => {
    try {
      const response = await api.get<RegistroHoras[]>('/registros-hora/registros-horas/');
      setRegistroHoras(response.data);
      console.log(response.data);
      //console.log('usuarios', usuarios);
    } catch (error) {
      console.error('Erro ao buscar registro de horas:', error);
    }
  };
  
  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este registo?')) return;
    try {
      await api.delete(`/registros-hora/registros-horas/${id}`);
      fetchRegistroHoras();
    } catch (error) {
      console.error('Erro ao excluir registo:', error);
    }
  };

  const handleEditClick = (user: RegistroHoras) => {
    setEditingRegistroHoras(user);
    setFormData({
      projeto_id: user.projeto_id,
      usuario_id: user.usuario_id,
      data: user.data,
      horas: user.horas,
    });
    setIsEditing(true);
    setModalAberto(true);
    console.log('user edit', user);
  };

  const handleSalvarRegistroHoras = async () => {
    try {
      console.log('formData', formData);
      const payload = {
        projeto_id: Number(projetoId),
        data,
        horas: Number(horas),
        usuario_id: user?.id,
      };

      if (isEditing && editingRegistroHoras) {
        await api.put(`/registros-hora/registros-horas/${editingRegistroHoras.id}`,{
          projeto_id: formData.projeto_id,
          data: formData.data,
          horas: formData.horas,
          usuario_id: user?.id,
        });
      } else {
        await api.post('/registros-hora/registros-horas/', {
          projeto_id: formData.projeto_id,
          data: formData.data,
          horas: formData.horas,
          usuario_id: user?.id,
        });
      }

      resetForm();
      fetchRegistroHoras();
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
    setFormData({ projeto_id: 0, usuario_id: 0, data: '', horas: '' });
    setEditingRegistroHoras(null);
    setIsEditing(false);
    setModalAberto(false);
  };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setIsSubmitting(true);

  //   console.log('formData', formData);
  //   console.log('user', user);
  //   const payload = {
  //     projeto_id: Number(projetoId),
  //     data,
  //     horas: Number(horas),
  //     usuario_id: user?.id,
  //   };
  //   console.log('payload', payload);
  //   try {
  //     if (isEditing && editingRegistroHoras) {
  //       await api.put(`/registros-hora/registros-horas/${editingRegistroHoras.id}`, payload);
  //       alert('Registro atualizado com sucesso!');
  //     } else {
  //       await api.post('/registros-hora/registros-horas', payload);
  //       // axios.post(
  //       //   '/registros-hora/registros-horas/',
  //       //   data,
  //       //   {
  //       //     headers: {
  //       //       Authorization: `Bearer ${accessToken}`, // Certifique-se que está vindo do contexto de auth
  //       //     },
  //       //   }
  //       // )
  //       alert('Horas registradas com sucesso!');
  //     }

  //     setProjetoId('');
  //     setData('');
  //     setHoras('');
  //     setDescricao('');
  //     setEditingRegistroHoras(null);
  //     setIsEditing(false);
  //     fetchRegistroHoras();
  //   } catch (error) {
  //     console.error('Erro ao salvar registro:', error);
  //     alert('Erro ao salvar registro.');
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Registro de Horas</h2>
      
      <div className="flex justify-between items-center mb-4">
        <Button
          onClick={() => {
            setFormData({ projeto_id: 0, usuario_id: 0, data: '', horas: ''});
            setIsEditing(false);
            setEditingRegistroHoras(null);
            setModalAberto(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded"
        >
          + Novo Registo
        </Button>
      </div>
      <table className="min-w-full text-sm text-left text-gray-600 bg-white border border-gray-200">
        <thead className="bg-gray-100 text-xs uppercase text-gray-700">
          <tr>
            <th className="p-2 text-left">Id</th>
            <th className="p-2 text-left">Projeto Id</th>
            <th className="p-2 text-left">Usuario Id</th>
            <th className="p-2 text-left">Data</th>
            <th className="p-2 text-left">Horas</th>
            <th className="p-2 text-left">Ações</th>
          </tr>
        </thead>
        <tbody>
          {registroHoras.map((regh) => (
            <tr key={regh.id} className="border-t hover:bg-gray-50">
              <td className="p-2">{regh.id}</td>
              <td className="p-2">{regh.projeto_id}</td>
              <td className="p-2">{regh.usuario_id}</td>
              <td className="p-2">{regh.data}</td>
              <td className="p-2">{regh.horas}</td>
              {/* <td className="p-2">{regh.perfil?.nome || 'Sem perfil'}</td> */}
              {/* <td className="p-2">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    registroHoras.is_active ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                  }`}
                >
                  {registroHoras.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </td> */}
              <td className="px-6 py-4 flex gap-2">
                <Button variant="outline" onClick={() => handleEditClick(regh)}>
                  Editar
                </Button>
                <Button variant="destructive" onClick={() => handleDelete(regh.id)}>
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
            <div className="col-span-full">
              <Label className="mb-1 block">Projeto</Label>
              <select
                value={formData.projeto_id ?? ''}
                onChange={(e) => setFormData({ ...formData, projeto_id: parseInt(e.target.value) })}
              >
                <option value="">Selecione um perfil</option>
                {projetos.map((projeto) => (
                  <option key={projeto.id} value={projeto.id}>
                    {projeto.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="mb-1 block">Data</Label>
              <Input 
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-1 block">Horas</Label>
              <Input
                type="number"
                value={formData.horas}
                onChange={(e) => setFormData({ ...formData, horas: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end mt-6 gap-4">
            <Button onClick={handleSalvarRegistroHoras}>
              {isEditing ? "Atualizar" : "Criar"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setModalAberto(false);
                setEditingRegistroHoras(null);
                setFormData({ projeto_id: projetos[0]?.id || 1, usuario_id: 0, data: "", horas: "" });
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

export default RegistroHoras;
