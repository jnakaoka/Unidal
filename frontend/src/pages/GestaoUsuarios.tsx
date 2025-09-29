//gestaoUsuarios.tsx
import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Perfil } from "../types/perfil";
import axios from 'axios';
import { FiltroUsuarios } from "@/components/FiltroUsuarios";
import Pagination, { usePagination } from "@/components/pagination-utils";

interface User {
  id: number;
  name: string;
  email: string;
  empresa: string;
  password: string;
  is_active: boolean;
  perfil: Perfil;
}

interface FiltrosUsuarios {
  nome?: string;
  email?: string;
  empresa?: string;
  perfil?: string;
}

const empresasobject = ["UNIDAL", "HPR", "HPNC", "ARUNCA", "UNISOL", "FLORIDAMPLITUDE"];

const GestaoUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [usuariosFullList, setUsuariosFullList] = useState<User[]>([]);
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', empresa: '', password: "", perfil_id: 0 });
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const registrosPorPagina = 10;
  const {
    currentPage,
    setCurrentPage,
    totalPages,
    pageItems,    // << já é User[] da página atual
  } = usePagination<User>(usuarios, registrosPorPagina);
  // const pages = useMemo(
  //   () => getPaginationRange({ totalPages: totalPaginas, currentPage, siblingCount: 1, boundaryCount: 1 }),
  //   [totalPaginas, currentPage]
  // );
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<User[]>([]);
  const indexUltimoRegistro = currentPage * registrosPorPagina;
  const indexPrimeiroRegistro = indexUltimoRegistro - registrosPorPagina;
  const registrosPaginados = usuarios.slice(indexPrimeiroRegistro, indexUltimoRegistro);
  

  useEffect(() => {
    fetchUsuarios();
    fetchPerfis();
  }, [mostrarInativos]);

  function toUpdatePayload(u: User, overrides: Partial<{
    name: string;
    email: string;
    empresa: string;
    password: string;
    perfil_id: number;
    is_active: boolean;
  }>) {
    const base = {
      name: u.name,
      email: u.email,
      empresa: u.empresa,
      perfil_id: typeof u.perfil === 'object' ? u.perfil.id : (u as any).perfil, // garante ID
      // password intencionalmente omitida (só passa se for trocar a senha)
    };
    return { ...base, ...overrides };
  }

  // reutilizando a rota de update (PUT)
  const handleToggleAtivo = async (u: User) => {
    const novoStatus = !u.is_active;
    const acao = novoStatus ? "reativar" : "inativar";
    if (!confirm(`Confirma ${acao} o usuário "${u.name}"?`)) return;

    try {
      await api.put(`/users/${u.id}`, toUpdatePayload(u, { is_active: novoStatus }));
      await fetchUsuarios();
    } catch (e: any) {
      alert(e?.response?.data?.detail ?? "Erro ao alterar status do usuário.");
      console.error(e);
    }
  };

  // const handleToggleAtivo = async (u: User) => {
  //   const novoStatus = u.is_active === false ? true : false;
  //   const acao = novoStatus ? "reativar" : "inativar";
  //   if (!confirm(`Confirma ${acao} o usuário "${u.name}"?`)) return;

  //   try {
  //     await api.patch(`/users/${u.id}`, { is_active: novoStatus });
  //     await fetchUsuarios();
  //   } catch (e: any) {
  //     alert(e?.response?.data?.detail ?? "Erro ao alterar status do usuário.");
  //     console.error(e);
  //   }
  // };
  

  // const DOTS = '…' as const;
  // const range = (start: number, end: number) =>
  //   Array.from({ length: end - start + 1 }, (_, i) => i + start);

  // function getPaginationRange({
  //   totalPages,
  //   currentPage,
  //   siblingCount = 1,
  //   boundaryCount = 1,
  // }: {
  //   totalPages: number;
  //   currentPage: number;
  //   siblingCount?: number;   // vizinhos de cada lado
  //   boundaryCount?: number;  // páginas fixas no começo/fim
  // }): (number | typeof DOTS)[] {
  //   const totalNumbers = boundaryCount * 2 + siblingCount * 2 + 3;
  //   if (totalPages <= totalNumbers) return range(1, totalPages);

  //   const leftBound  = Math.max(currentPage - siblingCount, boundaryCount + 2);
  //   const rightBound = Math.min(currentPage + siblingCount, totalPages - boundaryCount - 1);

  //   const showLeftDots  = leftBound  > boundaryCount + 2;
  //   const showRightDots = rightBound < totalPages   - boundaryCount - 1;

  //   const firstPages = range(1, boundaryCount);
  //   const lastPages  = range(totalPages - boundaryCount + 1, totalPages);

  //   if (!showLeftDots && showRightDots) {
  //     const leftRange = range(1, rightBound + 1);
  //     return [...leftRange, DOTS, ...lastPages];
  //   }
  //   if (showLeftDots && !showRightDots) {
  //     const rightRange = range(leftBound - 1, totalPages);
  //     return [...firstPages, DOTS, ...rightRange];
  //   }
  //   const middleRange = range(leftBound, rightBound);
  //   return [...firstPages, DOTS, ...middleRange, DOTS, ...lastPages];
  // }

  const fetchPerfis = async () => {
    try {
      // const response = await axios.get<Perfil[]>(
      //   `${import.meta.env.VITE_API_URL}/perfis/perfis`
      // );
      const { data: perfisData } = await api.get<Perfil[]>('/perfis/');
      
      //console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);

      //console.log('response')
      //console.log(response.data); 
      //const perfisData = response.data;
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

  // const fetchUsuarios = async () => {
  //   try {
  //     const params = new URLSearchParams();
  //     params.set("is_active", mostrarInativos ? "false" : "true");
  //     const response = await api.get<User[]>('/users/?${params.toString()}');
  //     setUsuarios(response.data);
  //     setUsuariosFullList(response.data); 
  //     console.log(response.data);
  //     //console.log('usuarios', usuarios);
  //   } catch (error) {
  //     console.error('Erro ao buscar usuários:', error);
  //   }
  // };

  const fetchUsuarios = async () => {
    try {
      const { data } = await api.get<User[]>('/users/', {
        params: { is_active: mostrarInativos ? false : true },
      });
      setUsuarios(data);
      setUsuariosFullList(data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  const handleFiltro = ({ nome, email, empresa, perfil }: FiltrosUsuarios) => {
    
    if (!nome && !email && !empresa && !perfil) {
      console.log('Sem filtros: resetando lista');
      setUsuariosFiltrados([]);
      setUsuarios(usuariosFullList);
      return;
    }
    
    let filtrados = [...usuariosFullList];
    console.log('usuarios:', usuariosFullList);  
    console.log('Filtro recebido:', { nome, email, empresa, perfil });
    if (nome) {
      filtrados = filtrados.filter((u) =>
        u.name?.toLowerCase().includes(nome.toLowerCase())
      );
    }
    if (email) {
      filtrados = filtrados.filter((u) =>
        u.email?.toLowerCase().includes(email.toLowerCase())
      );
    }
    if (empresa) {
      filtrados = filtrados.filter((u) =>
        u.empresa?.toLowerCase().includes(empresa.toLowerCase())
      );
    }
    if (perfil) {
      filtrados = filtrados.filter((u) =>
        u.perfil?.nome?.toLowerCase().includes(perfil.toLowerCase())
      );
    }

    setUsuariosFiltrados(filtrados);
    setUsuarios(filtrados);
    setCurrentPage(1);
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
    setFormData({ name: "", email: "", empresa: "", password: "", perfil_id: perfilInicial });
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
      empresa: user.empresa,
      password: user.password,
      perfil_id: typeof user.perfil === 'object' ? user.perfil.id : user.perfil,
    });
    console.log('formData.perfil_id:', formData.perfil_id, typeof formData.perfil_id);
    setIsEditing(true);
    setModalAberto(true);
    console.log('user edit', user);
  };

  const handleSalvarUsuario = async () => {
    
    if(!formData.name || !formData.email || !formData.empresa || !formData.password) {
      alert('Por favor, preencha todos os campos obrigatórios. Nome, Email, Empresa e Senha.');
      return
    }
    try {
      console.log('formData', formData);
      if (isEditing && editingUser) {
        await api.put(`/users/${editingUser.id}`, {
          name: formData.name,
          email: formData.email,
          empresa: formData.empresa,
          password: formData.password,
          perfil_id: formData.perfil_id,
        });
      } else {
        await api.post('/users/', {
          name: formData.name,
          email: formData.email,
          empresa: formData.empresa,
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
    setFormData({ name: '', email: '', empresa: '', password: '', perfil_id: perfis[0]?.id || 0 });
    setEditingUser(null);
    setIsEditing(false);
    setModalAberto(false);
  };

  return (
    <div className="p-6 space-y-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold border-b pb-2 mb-6">Gestão de Usuários</h2>
        <Button
          onClick={() => {
            resetForm();
            setModalAberto(true);
          }}
          className="btn-bg-green-600 hover:bg-blue-700 text-white"
        >
          + Novo Usuário
        </Button>
        
      </div>
      {/* {modalAberto && (
        <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 space-y-4">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {isEditing ? "Editar Usuário" : "Novo Usuário"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 align-float-left">
            <div className="ff-class-form-registro-hora-elements mb-1 block align-float-left" >
              <Label className="mb-1 block">Nome</Label>
              <Input
                value={formData.name}
                required
                className={`bg-gray-100 cursor-not-allowed px-3 py-1 rounded ${formData?.name === '' ? 'border-red-500' : 'border-gray-300'}`}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="ff-class-form-registro-hora-elements mb-1 block align-float-left">
              <Label className="mb-1 block">Email</Label>
              <Input
                value={formData.email}
                required
                className={`bg-gray-100 cursor-not-allowed px-3 py-1 rounded ${formData?.email === '' ? 'border-red-500' : 'border-gray-300'}`}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="ff-class-form-registro-hora-elements mb-1 block align-float-left">
              <Label className="mb-1 block">Empresa</Label>
              <select
                value={formData.empresa ?? ''}
                required
                className={`bg-gray-100 cursor-not-allowed px-3 py-1 rounded ${formData?.empresa === '' ? 'border-red-500' : 'border-gray-300'}`}
                 onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
              >
                <option value="">Selecione a empresa</option>
                {empresasobject.map((empresa) => (
                  <option key={empresa} value={empresa}>
                    {empresa}
                  </option>
                ))}
              </select>
            </div>
            <div className="ff-class-form-registro-hora-elements mb-1 block align-float-left">
              <Label className="mb-1 block">Senha</Label>
              <Input
                type="password"
                value={formData.password}
                required
                className={`bg-gray-100 cursor-not-allowed px-3 py-1 rounded ${formData?.password === '' ? 'border-red-500' : 'border-gray-300'}`}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="ff-class-form-registro-hora-elements mb-1 block align-float-left">
              <Label className="mb-1 block">Perfil</Label>
              <select
                className="p-2 border border-gray-300 rounded-md"
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

          <div className="flex justify-end gap-2 div-form-btn" style={{ margin: '1% 0 1% 0' }}>
            <Button className='btn-bg-blue-500' onClick={handleSalvarUsuario}>
              {isEditing ? "Atualizar" : "Criar"}
            </Button>
            <Button
              className='generic-btn'
              variant="secondary"
              onClick={() => {
                setModalAberto(false);
                setEditingUser(null);
                setFormData({ name: "", email: "", empresa: "", password: "", perfil_id: perfis[0]?.id || 0 });
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )} */}
      {modalAberto && (
        <div className="relative inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50
                          bg-black/50" style={{ zIndex: 10000, width: '100%' }}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-700">
              {isEditing ? "Editar Usuário" : "Novo Usuário"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 align-float-left">
              <div className="ff-class-form-registro-hora-elements mb-1 block align-float-left" >
                <Label className="mb-1 block">Nome</Label>
                <Input
                  value={formData.name}
                  required
                  className={`bg-gray-100 cursor-not-allowed px-3 py-1 rounded ${formData?.name === '' ? 'border-red-500' : 'border-gray-300'}`}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="ff-class-form-registro-hora-elements mb-1 block align-float-left">
                <Label className="mb-1 block">Email</Label>
                <Input
                  value={formData.email}
                  required
                  className={`bg-gray-100 cursor-not-allowed px-3 py-1 rounded ${formData?.email === '' ? 'border-red-500' : 'border-gray-300'}`}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="ff-class-form-registro-hora-elements mb-1 block align-float-left">
                <Label className="mb-1 block">Empresa</Label>
                <select
                  value={formData.empresa ?? ''}
                  required
                  className={`bg-gray-100 cursor-not-allowed px-3 py-1 rounded ${formData?.empresa === '' ? 'border-red-500' : 'border-gray-300'}`}
                  onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                >
                  <option value="">Selecione a empresa</option>
                  {empresasobject.map((empresa) => (
                    <option key={empresa} value={empresa}>
                      {empresa}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ff-class-form-registro-hora-elements mb-1 block align-float-left">
                <Label className="mb-1 block">Senha</Label>
                <Input
                  type="password"
                  value={formData.password}
                  required
                  className={`bg-gray-100 cursor-not-allowed px-3 py-1 rounded ${formData?.password === '' ? 'border-red-500' : 'border-gray-300'}`}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className="ff-class-form-registro-hora-elements mb-1 block align-float-left">
                <Label className="mb-1 block">Perfil</Label>
                <select
                  className="p-2 border border-gray-300 rounded-md"
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

            <div className="flex justify-end gap-2">
              <Button className="btn-bg-blue-500" onClick={handleSalvarUsuario}>
                {isEditing ? "Atualizar" : "Criar"}
              </Button>
              <Button
                className="generic-btn"
                variant="secondary"
                onClick={() => {
                  setModalAberto(false);
                  setEditingUser(null);
                  setFormData({ name: "", email: "", empresa: "", password: "", perfil_id: perfis[0]?.id || 0 });
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-between items-end flex-wrap gap-2 mb-3">
        <FiltroUsuarios onFiltrar={handleFiltro} />
      </div>
      <div className="rounded-xl shadow overflow-x-auto bg-white">
        <table cellSpacing="0" cellPadding="20" className="w-full table-auto text-sm divide-y divide-gray-200 table-spacing-0">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide text-left">
            <tr className="head-lista">
              <th className="px-4 py-2">Id</th>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Empresa</th>
              <th className="px-4 py-2">Perfil</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Ações 
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={mostrarInativos}
                    onChange={(e) => setMostrarInativos(e.target.checked)}
                  />
                  Mostrar inativos
                </label>
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-50 text-xs text-gray-500 tracking-wide text-left">
            {/* {usuarios.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-500">Nenhum usuário encontrado</td>
              </tr>
            ) : (
              usuarios
              .slice((currentPage - 1) * registrosPorPagina, currentPage * registrosPorPagina)
              .map((user, index) => (
                <tr key={user.id} className={index % 2 === 0 ? 'line-bg-white-600' : 'line-bg-gray-100'}>
                  <td className="px-4 py-2">{user.id}</td>
                  <td className="px-4 py-2">{user.name}</td>
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2">{user.empresa}</td>
                  <td className="px-4 py-2">{user.perfil?.nome || 'Sem perfil'}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_active ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                      }`}
                    >
                      {user.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-2 space-x-2" style={{ float: 'right' }}>
                    <Button className="px-3 py-1 btn-bg-blue-500 text-white rounded hover:bg-yellow-600 text-sm" variant="outline" onClick={() => handleEditClick(user)}>
                      Editar
                    </Button>
                    <Button className="px-3 py-1 btn-bg-red-500 text-white rounded hover:bg-yellow-600 text-sm" variant="destructive" onClick={() => handleDelete(user.id)}>
                      Excluir
                    </Button>
                  </td>
                </tr>
              ))
            )} */}
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-500">Nenhum usuário encontrado</td>
              </tr>
            ) : (
              pageItems.map((user, index) => (
                <tr key={user.id} className={index % 2 === 0 ? 'line-bg-white-600' : 'line-bg-gray-100'}>
                  <td className="px-4 py-2">{user.id}</td>
                  <td className="px-4 py-2">{user.name}</td>
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2">{user.empresa}</td>
                  <td className="px-4 py-2">{user.perfil?.nome || 'Sem perfil'}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_active ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                      }`}
                    >
                      {user.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-2 space-x-2" style={{ float: 'right' }}>
                    <Button className="px-3 py-1 btn-bg-blue-500 text-white rounded hover:bg-yellow-600 text-sm" variant="outline" onClick={() => handleEditClick(user)}>
                      Editar
                    </Button>
                    <Button
                      className="px-3 py-1 btn-bg-gray-500 text-white rounded text-sm"
                      variant="outline"
                      onClick={() => handleToggleAtivo(user)}
                    >
                      {user.is_active === false ? "Ativar" : "Inativar"}
                    </Button>
                    <Button className="px-3 py-1 btn-bg-red-500 text-white rounded hover:bg-yellow-600 text-sm" variant="destructive" onClick={() => handleDelete(user.id)}>
                      Excluir
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {/* <div className="flex justify-center mt-4 space-x-2" style={{ margin: '1% 0 1% 0' }}>
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
        </div> */}
        {/* Paginação */}
        <div className="mt-4">
          <Pagination
            totalPages={totalPages}       // << do hook usePagination
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

export default GestaoUsuarios;
