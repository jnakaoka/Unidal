//RegistroHoras.tsx
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
import { FiltroRegistros } from "../components/FiltroRegistros";
import { stringify } from 'querystring';

interface User {
  id: number;
  name: string;
  email: string;
  empresa: string;
}

interface Projeto {
  id: number;
  nome: string;
}

interface RegistroEquipa {
  user: User;
}

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

  user?: User;
  projeto?: Projeto;

  equipa: RegistroEquipa[]; // cada item tem a forma { user: { id, name, email } }
}

const empresaColors: Record<string, string> = {
  Unidal: 'bg-red-100',
  HPR: 'bg-blue-100',
  HPNC: 'bg-yellow-100',
  Aruncasols: 'bg-orange-100',
  Floridamplitude: 'bg-green-100',
};

const RegistroHoras: React.FC = () => {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [registrosFiltrados, setRegistrosFiltrados] = useState<RegistroHoras[]>([]);
  const [registroHoras, setRegistroHoras] = useState<RegistroHoras[]>([]);
  const [registroHorasFullList, setRegistroHorasFullList] = useState<RegistroHoras[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [registros, setRegistros] = useState<RegistroHoras[]>([]);
  const [descricao, setDescricao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRegistroHoras, setEditingRegistroHoras] = useState<RegistroHoras | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const registrosPorPagina = 10;
  const indexUltimoRegistro = currentPage * registrosPorPagina;
  const indexPrimeiroRegistro = indexUltimoRegistro - registrosPorPagina;
  const registrosPaginados = registroHoras.slice(indexPrimeiroRegistro, indexUltimoRegistro);
  const totalPaginas = Math.ceil(registroHoras.length / registrosPorPagina);
  const [formData, setFormData] = useState({id: 0, usuario_id: 0,
  projeto_id: 1,
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
  equipa: [] as { user_id: number; email: string, empresa: string }[],
  });
  const { accessToken } = useAuth();

  useEffect(() => {
    fetchProjetos();
    fetchUsuarios();
    async function fetchRegistros() {
      const response = await fetch("/registro-horas/");
      const data = await response.json();
      setRegistrosFiltrados(data);
    }
    fetchRegistroHoras();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const response = await api.get<User[]>('/users');
      const usuariosData = response.data;
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
      
      const projetosData = response.data;
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
        const response = await api.get<RegistroHoras[]>('/registro-horas/');
        setRegistroHoras(response.data);
        setRegistroHorasFullList(response.data);
        console.log('response do registro de horas', response.data);
      } catch (error) {
        console.error('Erro ao buscar registro de horas:', error);
      }
    };

    type Filtros = { mes: string; ano: string; cliente: string };

  const handleFiltro = ({ mes, ano, cliente }: Filtros) => {
    console.log('Filtro recebido:', { mes, ano, cliente });

    // Caso não tenha nenhum filtro, retorna a lista completa
    if (!mes && !ano && !cliente) {
      console.log('Sem filtros: resetando lista');
      setRegistrosFiltrados([]);
      setRegistroHoras(registroHorasFullList);
      return;
    }

    // Base da filtragem SEMPRE parte da lista original
    let filtrados = [...registroHorasFullList];

    if (ano && mes) {
      console.log('Filtrando por ano e mês');
      filtrados = filtrados.filter((r) => r.data.startsWith(`${ano}-${mes}`));
    } else if (ano) {
      console.log('Filtrando por ano');
      filtrados = filtrados.filter((r) => r.data.startsWith(`${ano}`));
    }

    if (cliente) {
      console.log('Filtrando por cliente');
      filtrados = filtrados.filter((r) =>
        r.cliente?.toLowerCase().includes(cliente.toLowerCase())
      );
    }

    console.log('Resultado da filtragem:', filtrados);

    setRegistrosFiltrados(filtrados);
    setRegistroHoras(filtrados);
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
    };
  
  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este registo?')) return;
    try {
      await api.delete(`/registro-horas/${id}`);
      fetchRegistroHoras();
    } catch (error) {
      console.error('Erro ao excluir registo:', error);
    }
  };

  const handleEditClick = (regHora: RegistroHoras) => {
    const equipeSelecionada = regHora.equipa.map(e => e.user.id);
    setSelectedUsers(equipeSelecionada);
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
      //projeto_id: regHora.projeto_id,
      projeto_id: 1,
      usuario_id: regHora.usuario_id,
      data: regHora.data,
      horas: regHora?.horas ?? '',
      equipa: regHora.equipa?.map((e) => ({
        user_id: e.user.id,
        email: e.user.email,
        name: e.user.name,
        empresa: e.user.empresa
      })) ?? [],
    });
    setSelectedUsers(equipeSelecionada);
    setIsEditing(true);
    setModalAberto(true);
  };

  const handleSalvarRegistroHoras = async () => {
    try {
      
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
      
      if(!formData.data || !formData.cliente || !formData.obra) {
        alert('Por favor, preencha todos os campos obrigatórios. Data, Cliente e Obra.');
        return
      }


      const payload = {
          id: formData.id,
          //projeto_id: formData.projeto_id, nao estamos mais usando esse campo por enquanto
          projeto_id: 1,
          usuario_id: user?.id,
          data: formData.data,
          //horas: parseFloat(formData.horas),

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
      };

      console.log('payload', payload);
      if (isEditing && editingRegistroHoras) {
        console.log('user edit', user);
        console.log('edit selected user', selectedUsers);

        await api.put(`/registro-horas/${editingRegistroHoras.id}`,payload);
      } else {
        console.log('create selected user', selectedUsers);
        await api.post('/registro-horas/', payload);
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
      equipa: [] as { user_id: number; email: string, empresa: string }[]});
    setEditingRegistroHoras(null);
    setIsEditing(false);
    setModalAberto(false);
  };

  // Função para mostrar o nome do usuário pelo ID
  const getUserName = (id: number) => {
    const user = usuarios.find((u) => u.id === id);
    return user ? user.name : `ID: ${id}`;
  };

  const usuariosPorEmpresa = usuarios.reduce((acc, user) => {
    const empresa = (user.empresa || 'Sem Empresa').trim();
    if (!acc[empresa]) acc[empresa] = [];
    acc[empresa].push(user);
    return acc;
  }, {} as Record<string, User[]>);

  useEffect(() => {
    setFormData((prev: any) => ({
      ...prev,
      equipa: selectedUsers
    }));
  }, [selectedUsers]);

  return (
    <div className="p-6 space-y-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold border-b pb-2 mb-6">Registos de Horas</h2>
        
        <Button
          onClick={() => {
            resetForm();
            setModalAberto(true);
          }}
          className="btn-bg-green-600 hover:bg-blue-700 text-white"
        >
          + Novo Registo
        </Button>
      </div>
      <div className="flex justify-between items-center">
        <FiltroRegistros onFilter={handleFiltro} />
      </div>
      {/* Tabela */}
      <div className="rounded-xl shadow overflow-x-auto">
        <table cellSpacing="0" cellPadding="20" className="w-full table-auto text-sm divide-y divide-gray-200 table-spacing-0">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide text-left">
            <tr className="head-lista">
              <th className="px-4 py-2">Usuário</th>
              {/* <th className="px-4 py-2">Projeto</th> */}
              <th className="px-4 py-2">Data</th>
              {/* <th className="px-4 py-2">Horas</th> */}
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2">Obra</th>
              <th className="px-4 py-2">m²</th>
              <th className="px-4 py-2">Equipa</th>
              <th className="px-4 py-2">Etapas</th>
              <th className="px-4 py-2">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-gray-50 text-xs text-gray-500 tracking-wide text-left">
            {registroHoras.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-500">Nenhum registo encontrado</td>
              </tr>
            ) : (
              registroHoras
              .slice((currentPage - 1) * registrosPorPagina, currentPage * registrosPorPagina)
              .map((reg, index) => (
                <tr key={reg.id} className={index % 2 === 0 ? 'line-bg-white-600' : 'line-bg-gray-100'}>
                  <td className="px-4 py-2">{reg.user?.name}</td>
                  {/* <td className="px-4 py-2">{reg.projeto?.nome}</td> */}
                  <td className="px-4 py-2">{reg.data}</td>
                  {/* <td className="px-4 py-2">{reg.horas}</td> */}
                  <td className="px-4 py-2">{reg.cliente}</td>
                  <td className="px-4 py-2">{reg.obra}</td>
                  <td className="px-4 py-2">{reg.metros_quadrados}</td>
                  <td className="px-4 py-2">
                    {reg.equipa?.map(e =>
                      e.user
                        ? `${e.user.name} (${e.user.empresa})`
                        : `ID ${(e.user as any)?.id ?? 'N/A'}`
                    ).join(', ')}
                  </td>
                  {/* <td className="px-4 py-2">{reg.equipa?.map(e => e.user?.name + ' (' + e.user?.empresa + ')' ?? `ID ${e.user?.id ?? 'N/A'}`).join(', ')}</td> */}
                  {/* <td>{reg.equipa?.map(u => u.nome).join(', ')}</td> */}
                  <td className="px-4 py-2">
                    {['preparacao', 'bruto', 'colagem', 'acabamento', 'serragem', 'intervencao_maquinas']
                      .filter((campo) => (reg as any)[campo]) // workaround temporário se quiser
                      .map((campo) => campo[0].toUpperCase() + campo.slice(1))
                      .join(', ')
                    }
                  </td>
                  <td className="px-4 py-2 space-x-2" style={{ float: 'right' }}>
                    <Button className="px-3 py-1 btn-bg-blue-500 text-white rounded hover:bg-yellow-600 text-sm" variant="outline" onClick={() => handleEditClick(reg)}>
                      Editar
                    </Button>
                    <Button className="px-3 py-1 btn-bg-red-500 text-white rounded hover:bg-yellow-600 text-sm" variant="destructive" onClick={() => handleDelete(reg.id)}>
                      Excluir
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="flex justify-center mt-4 space-x-2" style={{ margin: '1% 0 1% 0' }}>
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-300 text-gray-600' : 'bg-blue-500 text-white'}`}
          >
            Anterior
          </button>

          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded ${
                currentPage === page
                  ? 'bg-blue-700 text-white font-bold'
                  : 'bg-white text-gray-800 border border-gray-300'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPaginas))}
            disabled={currentPage === totalPaginas}
            className={`px-3 py-1 rounded ${currentPage === totalPaginas ? 'bg-gray-300 text-gray-600' : 'bg-blue-500 text-white'}`}
          >
            Próxima
          </button>
        </div>
      </div>

      {/* Modal de edição/criação */}
      {modalAberto && (
        <div className="relative inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" style={{ zIndex: 9999, width: '100%' }}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              {isEditing ? 'Editar Registro' : 'Novo Registro'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 align-float-left">
              <div className="space-y-4 align-float-left" style={{ marginBottom: '1%' }}>
                <div className="ff-class-form-registro-hora-elements align-float-left" >
                  <Label className="ff-class-form-registro-hora-elements-lbl">Usuário</Label>
                  <Input
                    type="text"
                    value={user?.name || 'Usuário não encontrado'}
                    readOnly
                    className='bg-gray-100 cursor-not-allowed'
                  />
                </div>
                {/* <div className="ff-class-form-registro-hora-elements" style={{ float: 'left' }}>
                  <Label className="mb-1 block ff-class-form-registro-hora-elements-lbl">Projeto</Label>
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
                </div> */}
                <div className="ff-class-form-registro-hora-elements align-float-left" >
                  <Label className="ff-class-form-registro-hora-elements-lbl">Data</Label>
                  <Input
                    type="date"
                    value={formData.data}
                    required
                    className={`bg-gray-100 cursor-not-allowed px-3 py-1 rounded ${formData?.data === '' ? 'border-red-500' : 'border-gray-300'}`}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  />
                </div>
                <div className="ff-class-form-registro-hora-elements align-float-left" >
                  <Label className="ff-class-form-registro-hora-elements-lbl">Cliente</Label>
                  <Input
                    value={formData.cliente ?? ''}
                    required
                    className={`bg-gray-100 cursor-not-allowed px-3 py-1 rounded ${formData?.cliente === '' ? 'border-red-500' : 'border-gray-300'}`}
                    onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                  />
                </div>
                <div className="ff-class-form-registro-hora-elements align-float-left" >
                  <Label className="ff-class-form-registro-hora-elements-lbl">Obra</Label>
                  <Input
                    value={formData.obra ?? ''}
                    required
                    className={`bg-gray-100 cursor-not-allowed px-3 py-1 rounded ${formData?.obra === '' ? 'border-red-500' : 'border-gray-300'}`}
                    onChange={(e) => setFormData({ ...formData, obra: e.target.value })}
                  />
                </div>
              
                <div className="ff-class-form-registro-hora-elements align-float-left" >
                  <Label className="ff-class-form-registro-hora-elements-lbl">Metros Quadrados</Label>
                  <Input
                    value={formData.metros_quadrados ?? ''}
                    onChange={(e) => setFormData({ ...formData, metros_quadrados: e.target.value })}
                  />
                </div>
              </div>
              {/* Campos booleanos como checkboxes */}
              <div className="align-float-left" style={{ marginBottom: '1%' }}>
                <label className="block text-sm font-medium text-gray-700 ff-class-form-registro-hora-elements-100">Descrição de Serviço</label>
                {["preparacao", "bruto", "colagem", "acabamento", "serragem", "intervencao_maquinas"].map((field) => (
                  <div key={field} className="mt-1 grid grid-cols-2 gap-2" style={{ float: 'left' }}>
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
                  </div>
                ))}
              </div>
              <div className="mt-1 space-y-3">
                <div className="bg-red-100 p-4 rounded text-black">
                  Se você está vendo essa cor vermelha clara, Tailwind está funcionando
                </div>
                {Object.entries(usuariosPorEmpresa).map(([empresa, lista], index) => (
                  <div
                    key={empresa}
                    className={`rounded p-3 ${
                      empresa === 'Unidal' ? 'empresa-bg-red-100' :
                      empresa === 'HPR' ? 'empresa-bg-blue-100' :
                      empresa === 'HPNC' ? 'empresa-bg-yellow-100' :
                      empresa === 'Aruncasols' ? 'empresa-bg-orange-100' :
                      empresa === 'Floridamplitude' ? 'empresa-bg-green-100' :
                      'bg-gray-100'
                    }`}
                  >
                    <h4 className="font-semibold text-gray-700 mb-2">{empresa}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {lista.map((u) => (
                        <label key={u.id} className="block text-sm text-gray-800">
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
                ))}
              </div>

              {/* <div className="" style={{ marginBottom: '1%', float: 'left' }}>
                <label className="block text-sm font-medium text-gray-700 ff-class-form-registro-hora-elements-100">Equipa</label>
                <div className="mt-1 grid grid-cols-2 gap-2" style={{ float: 'left'}}>
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
              </div> */}
            </div>

            <div className="flex justify-end gap-2 div-form-btn">
              <Button className='generic-btn' variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button className='btn-bg-blue-500' onClick={handleSalvarRegistroHoras}>
                {isEditing ? 'Atualizar' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistroHoras;
