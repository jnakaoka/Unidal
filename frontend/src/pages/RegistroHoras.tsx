import React, { use, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectItem } from '../components/ui/select';
import axios from 'axios';
import { u, U } from 'framer-motion/dist/types.d-CtuPurYT';

interface RegistroHoras {
  id: number;
  usuario_id: number;
  projeto_id: number;
  data: string;
  horas: string;

  cliente?: string;
  obra?: string;
  metros_quadrados?: string;

  preparacao: boolean;
  bruto: boolean;
  colagem: boolean;
  acabamento: boolean;
  serragem: boolean;
  intervencao_maquinas: boolean;

  usuario?: {
    id: number;
    nome: string;
  };

  projeto?: {
    id: number;
    nome: string;
  };

  equipa: {
    id: number;
    email: string;
    name: string;
    }[];
}
interface Projeto {
  id: number;
  nome: string;
}

interface User {
  id: number;
  name: string;
  email: string; // <- isso precisa estar declarado
}

const RegistroHoras: React.FC = () => {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  
  const [registroHoras, setRegistroHoras] = useState<RegistroHoras[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [registros, setRegistros] = useState<RegistroHoras[]>([]);
  //const [projetoId, setProjetoId] = useState('');
  //const [data, setData] = useState('');
  //const [horas, setHoras] = useState('');
  const [descricao, setDescricao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRegistroHoras, setEditingRegistroHoras] = useState<RegistroHoras | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [formData, setFormData] = useState({id: 0, usuario_id: 0,
  projeto_id: 0,
  data: '',
  horas: '',
  cliente: '',
  obra: '',
  metros_quadrados: '',
  preparacao: false,
  bruto: false,
  colagem: false,
  acabamento: false,
  serragem: false,
  intervencao_maquinas: false,
  equipa: [] as { user_id: number; email: string }[],
  //equipa: { user_id: number; email: string }[]; 
  });
  const { accessToken } = useAuth();

  useEffect(() => {
    fetchProjetos();
    fetchRegistroHoras();
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const response = await api.get<User[]>('/users');
      // const response = await axios.get<User[]>(
      //   `${import.meta.env.VITE_API_URL}/users`
      // );
      console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);

      console.log('response')
      console.log(response.data); 
      const usuariosData = response.data;
      console.log('perfisData');
      console.log(usuariosData);
      if (Array.isArray(usuariosData)) {
        setUsuarios(usuariosData);
      } else {
        console.error("Resposta de perfis inválida:", usuariosData);
      }

      if (usuariosData.length > 0 && formData.usuario_id === 0) {
        setFormData((prev) => ({ ...prev, usuario_id: usuariosData[0].id }));
      }
    } catch (error) {
      console.error("Erro ao buscar perfis:", error);
    }
  };

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
      //console.log(response.data);
      //console.log('usuarios', usuarios);
    } catch (error) {
      console.error('Erro ao buscar registro de horas:', error);
    }
  };

  const handleEquipaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    let updatedSelectedUsers: number[];

    if (event.target.checked) {
      updatedSelectedUsers = [...selectedUsers, value];
    } else {
      updatedSelectedUsers = selectedUsers.filter((id) => id !== value);
    }

    console.log('updatedSelectedUsers', updatedSelectedUsers);
    setSelectedUsers(updatedSelectedUsers);

    const equipa_user = updatedSelectedUsers
      .map((id) => {
        const user = usuarios.find((u) => u.id === id);
        if (!user) return null;
        return {
          user_id: user.id,
          email: user.email,
        };
      })
      .filter(Boolean); // remove nulls se algum id não for encontrado
    console.log('equipa', equipa_user);
    // setFormData((prev: any) => ({
    //   ...prev,
    //   equipa_user, // aqui estamos enviando [{ user_id: 1, email: "teste@x.com" }, ...]
    // }));
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

  const handleEditClick = (regHora: RegistroHoras) => {
    console.log('selected user', selectedUsers);
    setEditingRegistroHoras(regHora);
    setFormData({
      id: regHora.id,
      cliente: regHora?.cliente ?? '',
      obra: regHora.obra ?? '',
      metros_quadrados: regHora.metros_quadrados ?? '',
      preparacao: regHora.preparacao,
      bruto: regHora.bruto,
      colagem: regHora.colagem,
      acabamento: regHora.acabamento,
      serragem: regHora.serragem,
      intervencao_maquinas: regHora.intervencao_maquinas,
      projeto_id: regHora.projeto_id,
      usuario_id: regHora.usuario_id,
      data: regHora.data,
      horas: regHora?.horas ?? '',
      equipa: regHora.equipa?.map((u) => ({
        user_id: u.id,
        email: u.email
      })) ?? [],
    });
    setIsEditing(true);
    setModalAberto(true);
  };

  const handleSalvarRegistroHoras = async () => {
    try {
      console.log('formData to save', formData);
      console.log('selectedUsers', selectedUsers);

      const equipa_user = selectedUsers
      .map((id) => {
        const user = usuarios.find((u) => u.id === id);
        if (!user) return null;
        return {
          user_id: user.id,
          email: user.email,
        };
      })
      .filter(Boolean); // remove nulls se algum id não for encontrado
      
      console.log('equipe user', equipa_user);
      const payload = {
          id: formData.id,
          projeto_id: formData.projeto_id,
          usuario_id: user?.id,
          data: formData.data,
          horas: parseFloat(formData.horas),

          cliente: formData.cliente,
          obra: formData.obra,
          metros_quadrados: formData.metros_quadrados,

          preparacao: !!formData.preparacao,
          bruto: !!formData.bruto,
          colagem: !!formData.colagem,
          acabamento: !!formData.acabamento,
          serragem: !!formData.serragem,
          intervencao_maquinas: !!formData.intervencao_maquinas,

          equipa: equipa_user,

          // equipa: selectedUsers
          // .filter((u) => u?.id && typeof u.id === 'number')
          // .map((u) => ({
          //   user_id: u.id,
          //   email: u.email
          // })), // selectedUsers.filter((id) => typeof id === 'number'),
          // projeto_id: formData.projeto_id,
          // data: formData.data,
          // horas: formData.horas,
          // usuario_id: formData.usuario_id, // user?.id,
          // equipa: selectedUsers
        };

      console.log('payload', payload);
      if (isEditing && editingRegistroHoras) {
        console.log('user edit', user);
        console.log('edit selected user', selectedUsers);

        await api.put(`/registros-hora/registros-horas/${editingRegistroHoras.id}`,payload);
      } else {
        console.log('create selected user', selectedUsers);
        await api.post('/registros-hora/registros-horas/', payload);
      }

      resetForm();
      fetchRegistroHoras();
      setSelectedUsers([]);
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
    setFormData({id: 0, usuario_id: 0,
      projeto_id: 0,
      data: '',
      horas: '',
      cliente: '',
      obra: '',
      metros_quadrados: '',
      preparacao: false,
      bruto: false,
      colagem: false,
      acabamento: false,
      serragem: false,
      intervencao_maquinas: false,
      equipa: [] as { user_id: number; email: string }[], });
    setEditingRegistroHoras(null);
    setIsEditing(false);
    setModalAberto(false);
  };

  // Função para mostrar o nome do usuário pelo ID
  const getUserName = (id: number) => {
    const user = usuarios.find((u) => u.id === id);
    return user ? user.name : `ID: ${id}`;
  };

  useEffect(() => {
    setFormData((prev: any) => ({
      ...prev,
      equipa: selectedUsers
    }));
  }, [selectedUsers]);

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
    <div className="p-6 space-y-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Registros de Horas</h1>
        <Button
          onClick={() => {
            resetForm();
            setModalAberto(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          + Novo Registo
        </Button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Projeto</th>
              <th>Data</th>
              <th>Horas</th>
              <th>Cliente</th>
              <th>Obra</th>
              <th>m²</th>
              <th>Equipa</th>
              <th>Etapas</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {registroHoras.map(reg => (
              <tr key={reg.id}>
                <td>{reg.usuario?.nome}</td>
                <td>{reg.projeto?.nome}</td>
                <td>{reg.data}</td>
                <td>{reg.horas}</td>
                <td>{reg.cliente}</td>
                <td>{reg.obra}</td>
                <td>{reg.metros_quadrados}</td>
                <td>{reg.equipa?.map(u => u.id).join(', ')}</td>
                {/* <td>{reg.equipa?.map(u => u.nome).join(', ')}</td> */}
                <td>
                  {['preparacao', 'bruto', 'colagem', 'acabamento', 'serragem', 'intervencao_maquinas']
                    .filter((campo) => (reg as any)[campo]) // workaround temporário se quiser
                    .map((campo) => campo[0].toUpperCase() + campo.slice(1))
                    .join(', ')
                  }
                </td>
                <td className="px-4 py-2 space-x-2">
                   <Button className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm" variant="outline" onClick={() => handleEditClick(reg)}>
                     Editar
                   </Button>
                   <Button className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm" variant="destructive" onClick={() => handleDelete(reg.id)}>
                     Excluir
                   </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de edição/criação */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              {isEditing ? 'Editar Registro' : 'Novo Registro'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-4">
                {/* <Label>Usuário</Label>
                <Input
                  type="number"
                  value={formData.usuario_id}
                  onChange={(e) => setFormData({ ...formData, usuario_id: Number(e.target.value) })}
                /> */}

                <Label>Usuário</Label>
                <Input
                  type="text"
                  value={user?.name || 'Usuário não encontrado'}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />

                <Label className="mb-1 block">Projeto</Label>
               <select
                 value={formData.projeto_id ?? ''}
                 onChange={(e) => setFormData({ ...formData, projeto_id: parseInt(e.target.value) })}
               >
                 <option value="">Selecione um projeto</option>
                 {projetos.map((projeto) => (
                   <option key={projeto.id} value={projeto.id}>
                     {projeto.nome}
                   </option>
                 ))}
               </select>

                <Label>Data</Label>
                <Input
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                />

                <Label>Horas</Label>
                <Input
                  type="text"
                  value={formData.horas}
                  onChange={(e) => setFormData({ ...formData, horas: e.target.value })}
                />

                <Label>Cliente</Label>
                <Input
                  value={formData.cliente ?? ''}
                  onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                />

                <Label>Obra</Label>
                <Input
                  value={formData.obra ?? ''}
                  onChange={(e) => setFormData({ ...formData, obra: e.target.value })}
                />

                <Label>Metros Quadrados</Label>
                <Input
                  value={formData.metros_quadrados ?? ''}
                  onChange={(e) => setFormData({ ...formData, metros_quadrados: e.target.value })}
                />
              </div>
              {/* Campos booleanos como checkboxes */}
              <div className="grid grid-cols-2 gap-2">
                {["preparacao", "bruto", "colagem", "acabamento", "serragem", "intervencao_maquinas"].map((field) => (
                  <label key={field} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData[field as keyof typeof formData] as boolean}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [field]: e.target.checked
                        })
                      }
                    />
                    <span className="capitalize">{field.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Equipa</label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                 {usuarios.map((u) => (
                   <label key={u.id} className="block">
                     <input
                       type="checkbox"
                       value={u.id}
                       checked={selectedUsers.includes(u.id)}
                       onChange={handleEquipaChange}
                       className="mr-2"
                     />
                     {u.name}
                   </label>
                 ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button onClick={handleSalvarRegistroHoras}>
                {isEditing ? 'Atualizar' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );


  // return (
  //   <div className="p-4">
  //     <div className="flex justify-between items-center mb-6">
  //       <h1 className="text-2xl font-semibold text-gray-800">Registro de Horas</h1>
  //       <Button
  //         onClick={() => {
  //           setFormData({ projeto_id: 0, usuario_id: 0, data: '', horas: '', equipa: [] });
  //           setIsEditing(false);
  //           setEditingRegistroHoras(null);
  //           setModalAberto(true);
  //         }}
  //         className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
  //       >
  //         + Novo Registo
  //       </Button>
  //     </div>
  //     <div className="overflow-x-auto bg-white shadow rounded-lg">
  //       <table className="min-w-full table-auto border-collapse">
  //         <thead className="bg-gray-100">
  //           <tr>
  //             <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Id</th>
  //             <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Projeto Id</th>
  //             <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Usuario Id</th>
  //             <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Data</th>
  //             <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Horas</th>
  //             <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Equipa</th>
  //             <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Ações</th>
  //           </tr>
  //         </thead>
  //         <tbody>
  //           {registroHoras.map((regh) => (
  //             <tr key={regh.id} className="border-t hover:bg-gray-50">
  //               <td className="px-4 py-2">{regh.id}</td>
  //               <td className="px-4 py-2">{regh.projeto_id}</td>
  //               <td className="px-4 py-2">{getUserName(regh.usuario_id)}</td>
  //               {/* <td className="px-4 py-2">{regh.usuario_id}</td> */}
  //               <td className="px-4 py-2">{regh.data}</td>
  //               <td className="px-4 py-2">{regh.horas}</td>
  //               <td className="px-4 py-2">
  //                 <strong>Equipa:</strong>{' '}
  //                 {regh.equipa?.map((u) => u.name).join(', ') || 'Nenhum'}
  //               </td>
  //               {/* <td className="p-2">{regh.perfil?.nome || 'Sem perfil'}</td> */}
  //               {/* <td className="p-2">
  //                 <span
  //                   className={`px-2 py-1 text-xs font-semibold rounded-full ${
  //                     registroHoras.is_active ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
  //                   }`}
  //                 >
  //                   {registroHoras.is_active ? 'Ativo' : 'Inativo'}
  //                 </span>
  //               </td> */}
  //               <td className="px-4 py-2 space-x-2">
  //                 <Button className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm" variant="outline" onClick={() => handleEditClick(regh)}>
  //                   Editar
  //                 </Button>
  //                 <Button className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm" variant="destructive" onClick={() => handleDelete(regh.id)}>
  //                   Excluir
  //                 </Button>
  //               </td>
  //             </tr>
  //           ))}
  //         </tbody>
  //       </table>
  //     </div>
  //     {modalAberto && (
  //       <div className="mt-6 bg-white border border-gray-300 rounded-xl p-6 shadow-md">
  //         <h3 className="text-xl font-semibold mb-4 text-gray-800">
  //           {isEditing ? "Editar Usuário" : "Novo Usuário"}
  //         </h3>

  //         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  //           <div className="col-span-full">
  //             <Label className="mb-1 block">Projeto</Label>
  //             <select
  //               value={formData.projeto_id ?? ''}
  //               onChange={(e) => setFormData({ ...formData, projeto_id: parseInt(e.target.value) })}
  //             >
  //               <option value="">Selecione um perfil</option>
  //               {projetos.map((projeto) => (
  //                 <option key={projeto.id} value={projeto.id}>
  //                   {projeto.nome}
  //                 </option>
  //               ))}
  //             </select>
  //           </div>

  //           <div>
  //             <Label className="mb-1 block">Data</Label>
  //             <Input 
  //               type="date"
  //               value={formData.data}
  //               onChange={(e) => setFormData({ ...formData, data: e.target.value })}
  //             />
  //           </div>
  //           <div>
  //             <Label className="mb-1 block">Horas</Label>
  //             <Input
  //               type="number"
  //               value={formData.horas}
  //               onChange={(e) => setFormData({ ...formData, horas: e.target.value })}
  //             />
  //           </div>
  //           <div>
  //             <label className="block text-sm font-medium text-gray-700">Equipa</label>
  //             <div className="mt-1 grid grid-cols-2 gap-2">
  //               {usuarios.map((u) => (
  //                 <label key={u.id} className="block">
  //                   <input
  //                     type="checkbox"
  //                     value={u.id}
  //                     checked={selectedUsers.includes(u.id)}
  //                     onChange={handleEquipaChange}
  //                     className="mr-2"
  //                   />
  //                   {u.name}
  //                 </label>
  //               ))}
  //             </div>
  //           </div>
  //         </div>

  //         <div className="flex justify-end mt-6 gap-4">
  //           <Button onClick={handleSalvarRegistroHoras}>
  //             {isEditing ? "Atualizar" : "Criar"}
  //           </Button>
  //           <Button
  //             variant="secondary"
  //             onClick={() => {
  //               setModalAberto(false);
  //               setEditingRegistroHoras(null);
  //               setFormData({ projeto_id: projetos[0]?.id || 1, usuario_id: 0, data: "", horas: "" , equipa: [] as number[] });
  //             }}
  //           >
  //             Cancelar
  //           </Button>
  //         </div>
  //       </div>
  //     )}
      
  //   </div>
  // );
};

export default RegistroHoras;
