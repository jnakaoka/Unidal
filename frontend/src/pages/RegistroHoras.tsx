//RegistroHoras.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectItem } from '../components/ui/select';
import axios from 'axios';
import { FiltroRegistros } from "../components/FiltroRegistros";
import Pagination, { usePagination } from "@/components/pagination-utils";
import LoadingState from "@/components/LoadingState";

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

interface Cliente {
  id: number;
  nome: string;
  is_active: boolean;
}

interface Obra {
  id: number;
  nome: string;
  descricao?: string;
  cliente_id: number;
  cliente?: { id: number; nome: string };
}

interface RegistroEquipa {
  user: User;
  intemperie: boolean;
  double_journey: boolean;
}

type IntervencaoMaquinasOpcoes = {
  laserComManobrador?: { checked?: boolean; m2?: string; empresa?: string };
  poComManobrador?:    { checked?: boolean; m2?: string; empresa?: string };
  manobrador?:         { checked?: boolean; qtd?: number; empresa?: string }; // 1 ou 2
  soLaser?:            { checked?: boolean; m2?: string; empresa?: string };
  soPo?:               { checked?: boolean; m2?: string; empresa?: string };
  laserWS940CComManobrador?: { checked?: boolean; m2?: string; empresa?: string };
  lazerYZ30ComManobrador?: { checked?: boolean; m2?: string; empresa?: string };
  soMaqLaserWS940C?: { checked?: boolean; m2?: string; empresa?: string };
  soMaqLazerYZ30?: { checked?: boolean; m2?: string; empresa?: string }; //Só  Maq Lazer YZ30
  manobradores?: ManobradorMaquina[];
};

type OpcaoComManobrador =
  | 'laserComManobrador'
  | 'poComManobrador'
  | 'laserWS940CComManobrador'
  | 'lazerYZ30ComManobrador';

type ManobradorMaquina = {
  user_id: number;
  opcao: OpcaoComManobrador | '';
  m2: string;
  double_journey: boolean;
};

const opcoesComManobrador: { value: OpcaoComManobrador; label: string }[] = [
  { value: 'laserComManobrador', label: 'Máq Laser c/ manobrador' },
  { value: 'poComManobrador', label: 'Máq Pó c/ manobrador' },
  { value: 'laserWS940CComManobrador', label: 'Laser WS940C c/ manobrador' },
  { value: 'lazerYZ30ComManobrador', label: 'Laser YZ30 c/ manobrador' },
];

interface RegistroHoras {
  id: number;
  usuario_id: number;
  projeto_id: number;
  data: string;
  horas: string;

  cliente_id: number | null;
  obra_id: number | null;
  cliente?: Cliente | null;   // ← objeto vindo do backend
  obra?: Obra | null;         // ← objeto vindo do backend
  metros_quadrados?: string;

  preparacao: boolean;
  bruto: boolean;
  colagem: boolean;
  acabamento: boolean;
  serragem: boolean;
  coli: boolean;
  optipav: boolean;
  double_journey_lider: boolean;
  intervencao_maquinas: boolean;
  intervencao_maquinas_opcoes?: IntervencaoMaquinasOpcoes | null;

  modificado_por?: number | null;   // id do usuário que editou por último
  modificado_em?: string | null;    // timestamp ISO vindo da API

  user?: User;
  projeto?: Projeto;

  origem?: string;
  destino?: string;
  matricula: string;
  km_rodados: number;
  maquinas_transportadas: string;

  equipa: RegistroEquipa[]; // cada item tem a forma { user: { id, name, email } }
}

const empresaColors: Record<string, string> = {
  UNIDAL: 'bg-red-100',
  HPR: 'bg-blue-100',
  HPNC: 'bg-yellow-100',
  ARUNCA: 'bg-orange-100',
  UNISOL: 'bg-orange-100',
  FLORIDAMPLITUDE: 'bg-green-100',
};

const empresasLista = ["UNIDAL","HPR","HPNC","ARUNCA","UNISOL","FLORIDAMPLITUDE"];

const RegistroHoras: React.FC = () => {
  type FormData = {
    id: number;
    usuario_id: number;
    projeto_id: number;
    data: string;
    horas: string;
    cliente_id: number | null;
    obra_id: number | null;
    metros_quadrados: string;
    preparacao: boolean;
    bruto: boolean;
    colagem: boolean;
    acabamento: boolean;
    serragem: boolean;
    coli: boolean;
    optipav: boolean;
    double_journey_lider: boolean;
    intervencao_maquinas: boolean;
    intervencao_maquinas_opcoes: IntervencaoMaquinasOpcoes;
    origem?: string;
    destino?: string;
    matricula?: string;
    km_rodados?: string;
    maquinas_transportadas?: string;
    equipa: { user_id: number; email: string; empresa: string; intemperie?: boolean; double_journey?: boolean }[];
  };
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [registrosFiltrados, setRegistrosFiltrados] = useState<RegistroHoras[]>([]);
  const [registroHoras, setRegistroHoras] = useState<RegistroHoras[]>([]);
  const [registroHorasFullList, setRegistroHorasFullList] = useState<RegistroHoras[]>([]);
  //const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [carregandoPagina, setCarregandoPagina] = useState(true);
  // --- NOVOS clientes antigo ---
  // const [showPopup, setShowPopup] = useState(false);
  // const [modalClienteObraAberto, setModalClienteObraAberto] = useState(false);
  // const [novoClienteNome, setNovoClienteNome] = useState('');
  // const [novaObraNome, setNovaObraNome] = useState('');
  // const [novaObraDescricao, setNovaObraDescricao] = useState('');
  // const [criandoClienteObra, setCriandoClienteObra] = useState(false);

  // --- POPUPS separados ---
  const [showClientePopup, setShowClientePopup] = useState(false);
  const [showObraPopup, setShowObraPopup] = useState(false);

  const [novoClienteNome, setNovoClienteNome] = useState('');
  const [criandoCliente, setCriandoCliente] = useState(false);

  const [novaObraNome, setNovaObraNome] = useState('');
  const [novaObraDescricao, setNovaObraDescricao] = useState('');
  const [obraClienteId, setObraClienteId] = useState<number | null>(null); // cliente escolhido dentro do popup de Obra
  const [criandoObra, setCriandoObra] = useState(false);

  const [registros, setRegistros] = useState<RegistroHoras[]>([]);
  const [descricao, setDescricao] = useState('');
  const [editingRegistroHoras, setEditingRegistroHoras] = useState<RegistroHoras | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const registrosPorPagina = 10;
  const { pageItems, currentPage, setCurrentPage, totalPages } =
  usePagination<RegistroHoras>(registroHoras, 20);
  const [empresasAbertas, setEmpresasAbertas] = useState<Record<string, boolean>>({});
  const [obrasFiltro, setObrasFiltro] = useState<Obra[]>([]);
  const [intemperiePorUserId, setIntemperiePorUserId] = useState<Record<number, boolean>>({});
  const [doubleJourneyPorUserId, setDoubleJourneyPorUserId] = useState<Record<number, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{type: 'success'|'error'|'info', text: string} | null>(null);
  const [searchUser, setSearchUser] = useState('');
  const [showSugestoes, setShowSugestoes] = useState(false);

  const loadObrasFiltro = async (clienteId: number | null) => {
    if (!clienteId) { setObrasFiltro([]); return; }
    try {
      const { data } = await api.get<Obra[]>(`/obras/?cliente_id=${clienteId}`);
      setObrasFiltro(data);
    } catch {
      setObrasFiltro([]);
    }
  };

  //const totalPaginas = Math.max(1, Math.ceil(registroHoras.length / registrosPorPagina));
  // const indexUltimoRegistro = currentPage * registrosPorPagina;
  // const indexPrimeiroRegistro = indexUltimoRegistro - registrosPorPagina;
  // const registrosPaginados = registroHoras.slice(indexPrimeiroRegistro, indexUltimoRegistro);
  // const totalPaginas = Math.ceil(registroHoras.length / registrosPorPagina);
  const [formData, setFormData] = useState<FormData>({
    id: 0,
    usuario_id: 0,
    projeto_id: 1,
    data: '',
    horas: '',
    cliente_id: null,   // <- ok ser null
    obra_id: null,      // <- ok ser null
    metros_quadrados: '',
    preparacao: false,
    bruto: false,
    colagem: false,
    optipav: false,
    double_journey_lider: false,
    acabamento: false,
    serragem: false,
    coli: false,
    intervencao_maquinas: false,
    intervencao_maquinas_opcoes: {
      laserComManobrador: { checked: false, m2: '', empresa: '' },
      poComManobrador:    { checked: false, m2: '', empresa: '' },
      manobrador:         { checked: false, qtd: 1, empresa: '' },
      soLaser:            { checked: false, m2: '', empresa: '' },
      soPo:               { checked: false,  m2: '', empresa: '' },
      laserWS940CComManobrador: { checked: false,  m2: '', empresa: '' },
      lazerYZ30ComManobrador: { checked: false,  m2: '', empresa: '' },
      soMaqLaserWS940C: { checked: false,  m2: '', empresa: '' },
      soMaqLazerYZ30: { checked: false,  m2: '', empresa: '' }, //Só  Maq Lazer YZ30
      manobradores: [],
    },
    origem: "",
    destino: "",
    matricula: "",
    km_rodados: "",
    maquinas_transportadas: "",
    equipa: [],

    // id: 0, usuario_id: 0,
  // projeto_id: 1,
  // data: '',
  // horas: '',
  // cliente_id: 0,
  // obra_id: 0,
  // // cliente: '',
  // // obra: '',
  // metros_quadrados: '',
  // preparacao: false,
  // bruto: false,
  // colagem: false,
  // acabamento: false,
  // serragem: false,
  // intervencao_maquinas: false,
  // intervencao_maquinas_opcoes: {
  //   laserComManobrador: { checked: false, m2: '' },
  //   poComManobrador:    { checked: false, m2: '' },
  //   manobrador:         { checked: false, qtd: 1 },
  //   soLaser:            { checked: false, m2: '' },
  //   soPo:               { checked: false,  m2: '' },
  // } as IntervencaoMaquinasOpcoes,
  // equipa: [] as { user_id: number; email: string, empresa: string }[],
  });
  const { accessToken } = useAuth();

  const rawPerfil =
  (user as any)?.perfil?.nome ??
  (user as any)?.perfil_nome ??
  (user as any)?.perfil ??
  "";

  const perfil = String(rawPerfil).trim().toLowerCase();
  const isOperador = perfil === "operador";
  const isMotorista = perfil === "motorista";
  const isOperadorOuMotorista = isOperador || isMotorista;
  const isAdmin = perfil === "admin" || perfil === "administrador";

  // useEffect(() => {
  //   //fetchProjetos();
  //   fetchUsuarios();
  //   fetchClientes();
  //   if (formData.cliente_id) {
  //     fetchObrasByCliente(formData.cliente_id);
  //   } else {
  //     setObras([]);
  //   }

  //   // async function fetchRegistros() {
  //   //   const response = await fetch("/registro-horas/");
  //   //   const data = await response.json();
  //   //   setRegistrosFiltrados(data);
  //   // }

  //   fetchRegistroHoras();
  //   // const anyOpen = modalAberto || showClientePopup || showObraPopup;
  //   // document.body.style.overflow = anyOpen ? 'hidden' : '';
  //   const anyPopup = showClientePopup || showObraPopup; // só para os popups reais
  //   document.body.style.overflow = anyPopup ? 'hidden' : '';
  //   return () => { document.body.style.overflow = ''; };

  // }, [modalAberto, showClientePopup, showObraPopup, user?.id, isOperador]);


  useEffect(() => {
    let componenteAtivo = true;

    async function carregarDadosIniciais() {
      if (!user?.id) {
        return;
      }

      try {
        setCarregandoPagina(true);

        await Promise.all([
          fetchUsuarios(),
          fetchClientes(),
          fetchRegistroHoras(),
        ]);
      } catch (error) {
        console.error(
          "Erro ao carregar registos:",
          error,
        );
      } finally {
        if (componenteAtivo) {
          setCarregandoPagina(false);
        }
      }
    }

    void carregarDadosIniciais();

    return () => {
      componenteAtivo = false;
    };
  }, [user?.id]);

  useEffect(() => {
    const algumPopupAberto =
      showClientePopup || showObraPopup;

    document.body.style.overflow =
      algumPopupAberto ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [showClientePopup, showObraPopup]);

  const fetchUsuarios = async () => {
    try {
      const response = await api.get<User[]>('/users/', {
        params: { is_active: true },
      });
      //console.log('usuarios',response.data);
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

  const fetchClientes = async () => {
    try {
      const { data } = await api.get<Cliente[]>('/clientes/');
      console.log('clientes', data);
      setClientes(data);
    } catch (e) {
      console.error('Erro ao buscar clientes:', e);
    }
  };

  const fetchObrasByCliente = async (clienteId: number) => {
    console.log('fetchObrasByCliente', clienteId);
    if (!clienteId) { setObras([]); return; }
    try {
      const { data } = await api.get<Obra[]>(`/obras/?cliente_id=${clienteId}`);
      console.log('obras', data);
      setObras(data);
    } catch (e) {
      console.error('Erro ao buscar obras:', e);
      setObras([]);
    }
  };

  // const fetchProjetos = async () => {
  //   try {
  //     const response = await axios.get<Projeto[]>(
  //       `${import.meta.env.VITE_API_URL}/projetos/projetos`
  //     );

  //     const projetosData = response.data;
  //     if (Array.isArray(projetosData)) {
  //       setProjetos(projetosData);
  //     } else {
  //       console.error("Resposta de perfis inválida:", projetosData);
  //     }

  //     if (projetosData.length > 0 && formData.projeto_id === 0) {
  //       setFormData((prev) => ({ ...prev, projeto_id: projetosData[0].id }));
  //     }
  //   } catch (error) {
  //     console.error("Erro ao buscar perfis:", error);
  //   }
  // };

  // const fetchRegistroHoras = async () => {
  //   try {
  //       const response = await api.get<RegistroHoras[]>('/registro-horas/');
  //       setRegistroHoras(response.data);
  //       setRegistroHorasFullList(response.data);
  //       console.log('response do registro de horas', response.data);
  //   } catch (error) {
  //     console.error('Erro ao buscar registro de horas:', error);
  //   }
  // };

  const fetchRegistroHoras = async () => {
    try {
      // Tente filtrar no backend (se a API aceitar ?usuario_id=)
      if (isOperadorOuMotorista && user?.id) {
        const { data } = await api.get<RegistroHoras[]>('/registro-horas/', {
          params: { usuario_id: user.id },
        });
        console.log('response do registro de horas', data);
        setRegistroHoras(data);
        setRegistroHorasFullList(data);
        return;
      }

      // Senão, pega tudo e filtra no cliente como fallback
      const { data } = await api.get<RegistroHoras[]>('/registro-horas/');
      const lista = isOperadorOuMotorista && user?.id
        ? data.filter(r => r.usuario_id === user.id)
        : data;

      setRegistroHoras(lista);
      setRegistroHorasFullList(lista);
    } catch (error) {
      console.error('Erro ao buscar registro de horas:', error);
    }
  };

  type Filtros = { clienteId: number | null; obraId: number | null; usuario: string; funcionario: string };

  const handleFiltro = ({ clienteId, obraId, usuario, funcionario }: Filtros) => {
    let filtrados = [...registroHorasFullList];

    if (clienteId) {
      filtrados = filtrados.filter(r => (r.cliente_id ?? r.cliente?.id ?? null) === clienteId);
    }
    if (obraId) {
      filtrados = filtrados.filter(r => (r.obra_id ?? r.obra?.id ?? null) === obraId);
    }
    if (usuario) {
      const u = usuario.toLowerCase();
      filtrados = filtrados.filter(r => (r.user?.name || "").toLowerCase().includes(u));
    }
    // filtra por FUNCIONÁRIO dentro da equipa (reg.equipa[].user)
    if (funcionario) {
      const f = funcionario.toLowerCase();
      filtrados = filtrados.filter((r) =>
        r.equipa?.some((e) => {
          const nome  = e.user?.name  ?? "";
          const email = e.user?.email ?? "";
          return (
            nome.toLowerCase().includes(f) ||
            email.toLowerCase().includes(f)
          );
        })
      );
    }

    setRegistrosFiltrados(filtrados);
    setRegistroHoras(filtrados);
    setCurrentPage(1);
  };

  // const handleFiltro = ({ mes, ano, cliente, usuario }: Filtros) => {
  //   console.log('Filtro recebido:', { mes, ano, cliente, usuario });

  //   // Caso não tenha nenhum filtro, retorna a lista completa
  //   if (!mes && !ano && !cliente && !usuario) {
  //     console.log('Sem filtros: resetando lista');
  //     setRegistrosFiltrados([]);
  //     setRegistroHoras(registroHorasFullList);
  //     return;
  //   }

  //   // Base da filtragem SEMPRE parte da lista original
  //   let filtrados = [...registroHorasFullList];

  //   if (ano && mes) {
  //     console.log('Filtrando por ano e mês');
  //     filtrados = filtrados.filter((r) => r.data.startsWith(`${ano}-${mes}`));
  //   } else if (ano) {
  //     console.log('Filtrando por ano');
  //     filtrados = filtrados.filter((r) => r.data.startsWith(`${ano}`));
  //   }

  //   if (cliente) {
  //     filtrados = filtrados.filter((r) =>
  //       r.cliente?.nome?.toLowerCase().includes(cliente.toLowerCase())
  //     );
  //   }

  //   if (usuario !== '') {
  //     console.log('Filtrando por usuário');
  //     filtrados = filtrados.filter((r) =>
  //       r.user?.name?.toLowerCase().includes(usuario.toLowerCase())
  //     );
  //   }

  //   console.log('Resultado da filtragem:', filtrados);

  //   setRegistrosFiltrados(filtrados);
  //   setRegistroHoras(filtrados);
  //   setCurrentPage(1);
  // };

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

  // const handleDelete = async (id: number) => {
  //   if (!confirm('Tem certeza que deseja excluir este registo?')) return;
  //   try {
  //     await api.delete(`/registro-horas/${id}`);
  //     fetchRegistroHoras();
  //   } catch (error) {
  //     console.error('Erro ao excluir registo:', error);
  //   }
  // };

  const handleDelete = async (id: number) => {
    // Segurança extra no cliente: operador não pode excluir
    if (isOperadorOuMotorista) return;
    if (!confirm('Tem certeza que deseja excluir este registo?')) return;
    try {
      await api.delete(`/registro-horas/${id}`);
      fetchRegistroHoras();
    } catch (error) {
      console.error('Erro ao excluir registo:', error);
    }
  };

  const handleEditClick = async (regHora: RegistroHoras) => {
    const equipeSelecionada = regHora.equipa.map(e => e.user.id);
    console.log('equipeSelecionada', equipeSelecionada);
    setSelectedUsers(equipeSelecionada);
    setIntemperiePorUserId(
      Object.fromEntries(
        regHora.equipa.map(e => [e.user.id, !!(e as any).intemperie])
      )
    );
    setDoubleJourneyPorUserId(
      Object.fromEntries(
        regHora.equipa.map(e => [e.user.id, !!e.double_journey])
      )
    );

    const cid: number | null = regHora.cliente_id ?? regHora.cliente?.id ?? null;
    const oid: number | null = regHora.obra_id ?? regHora.obra?.id ?? null;

    if (cid) await fetchObrasByCliente(cid);

    setEditingRegistroHoras(regHora);
    console.log('regHora', regHora);
    console.log('intervencao_maquinas_opcoes', regHora.intervencao_maquinas_opcoes);
    setFormData({
      id: regHora.id,
      cliente_id: cid,
      obra_id: oid,
      metros_quadrados: regHora.metros_quadrados ?? '',
      preparacao: regHora.preparacao,
      bruto: regHora.bruto,
      colagem: regHora.colagem,
      acabamento: regHora.acabamento,
      serragem: regHora.serragem,
      coli: regHora.coli,
      optipav: regHora.optipav,
      double_journey_lider: !!regHora.double_journey_lider,
      intervencao_maquinas: regHora.intervencao_maquinas,
      intervencao_maquinas_opcoes: {
        laserComManobrador: { checked: !!regHora.intervencao_maquinas_opcoes?.laserComManobrador?.checked,
                              m2: regHora?.intervencao_maquinas_opcoes?.laserComManobrador?.m2 ?? '',
                              empresa: regHora.intervencao_maquinas_opcoes?.laserComManobrador?.empresa ?? ''
                            },
        poComManobrador:    { checked: !!regHora.intervencao_maquinas_opcoes?.poComManobrador?.checked,
                              m2: regHora?.intervencao_maquinas_opcoes?.poComManobrador?.m2 ?? '',
                              empresa: regHora.intervencao_maquinas_opcoes?.poComManobrador?.empresa ?? ''
                            },
        manobrador:         { checked: !!regHora.intervencao_maquinas_opcoes?.manobrador?.checked,
                              qtd: regHora?.intervencao_maquinas_opcoes?.manobrador?.qtd ?? 1,
                              empresa: regHora.intervencao_maquinas_opcoes?.manobrador?.empresa ?? ''
                            },
        soLaser:            { checked: !!regHora.intervencao_maquinas_opcoes?.soLaser?.checked,
                              m2: regHora?.intervencao_maquinas_opcoes?.soLaser?.m2 ?? '',
                              empresa: regHora.intervencao_maquinas_opcoes?.soLaser?.empresa ?? ''
                            },
        soPo:               { checked: !!regHora.intervencao_maquinas_opcoes?.soPo?.checked,
                              m2: regHora?.intervencao_maquinas_opcoes?.soPo?.m2 ?? '',
                              empresa: regHora.intervencao_maquinas_opcoes?.soPo?.empresa ?? ''
                            },
        laserWS940CComManobrador: { checked: !!regHora.intervencao_maquinas_opcoes?.laserWS940CComManobrador?.checked,
                                    m2: regHora?.intervencao_maquinas_opcoes?.laserWS940CComManobrador?.m2 ?? '',
                                    empresa: regHora.intervencao_maquinas_opcoes?.laserWS940CComManobrador?.empresa ?? ''
                                  },
        lazerYZ30ComManobrador: { checked: !!regHora.intervencao_maquinas_opcoes?.lazerYZ30ComManobrador?.checked,
                                  m2: regHora?.intervencao_maquinas_opcoes?.lazerYZ30ComManobrador?.m2 ?? '',
                                  empresa: regHora.intervencao_maquinas_opcoes?.lazerYZ30ComManobrador?.empresa ?? ''
                                },
        soMaqLaserWS940C: { checked: !!regHora.intervencao_maquinas_opcoes?.soMaqLaserWS940C?.checked,
                            m2: regHora?.intervencao_maquinas_opcoes?.soMaqLaserWS940C?.m2 ?? '',
                            empresa: regHora.intervencao_maquinas_opcoes?.soMaqLaserWS940C?.empresa ?? ''
                          },
        soMaqLazerYZ30: { checked: !!regHora.intervencao_maquinas_opcoes?.soMaqLazerYZ30?.checked,
                          m2: regHora?.intervencao_maquinas_opcoes?.soMaqLazerYZ30?.m2 ?? '',
                          empresa: regHora.intervencao_maquinas_opcoes?.soMaqLazerYZ30?.empresa ?? ''
                        },
        manobradores: regHora.intervencao_maquinas_opcoes?.manobradores ?? [],
      },
      projeto_id: 1,
      usuario_id: regHora.usuario_id,
      data: regHora.data,
      horas: regHora?.horas ?? '',
      origem: regHora.origem ?? "",
      destino: regHora.destino ?? "",
      matricula: regHora.matricula ?? "",
      km_rodados: regHora.km_rodados != null ? String(regHora.km_rodados) : "",
      maquinas_transportadas: regHora.maquinas_transportadas ?? "",
      equipa: regHora.equipa?.map((e) => ({
        user_id: e.user.id,
        email: e.user.email,
        empresa: e.user.empresa,
        intemperie: !!intemperiePorUserId[e.user.id],
        double_journey: !!e.double_journey,
      })) ?? [],
    });

    setIsEditing(true);
    setModalAberto(true);
  };

  // const handleEditClick = async (regHora: RegistroHoras) => {
  //   const equipeSelecionada = regHora.equipa.map(e => e.user.id);
  //   setSelectedUsers(equipeSelecionada);
  //   console.log('selected user', selectedUsers);
  //   const cid = regHora.cliente_id ?? null;
  //   if (cid) await fetchObrasByCliente(cid);  // garante a lista certa no select

  //   setEditingRegistroHoras(regHora);
  //   setFormData({
  //     id: regHora.id,
  //     cliente_id: cid,
  //     obra_id: regHora.obra_id ?? null,
  //     // cliente: regHora?.cliente ?? '',
  //     // obra: regHora.obra ?? '',
  //     metros_quadrados: regHora.metros_quadrados ?? '',
  //     preparacao: regHora.preparacao,
  //     bruto: regHora.bruto,
  //     colagem: regHora.colagem,
  //     acabamento: regHora.acabamento,
  //     serragem: regHora.serragem,
  //     intervencao_maquinas: regHora.intervencao_maquinas,
  //     intervencao_maquinas_opcoes: {
  //       laserComManobrador: { checked: false, m2: '' },
  //       poComManobrador:    { checked: false, m2: '' },
  //       manobrador:         { checked: false, qtd: 1 },
  //       soLaser:            { checked: false, m2: '' },
  //       soPo:               { checked: false,  m2: '' },
  //     } as IntervencaoMaquinasOpcoes,
  //     //projeto_id: regHora.projeto_id,
  //     projeto_id: 1,
  //     usuario_id: regHora.usuario_id,
  //     data: regHora.data,
  //     horas: regHora?.horas ?? '',
  //     equipa: regHora.equipa?.map((e) => ({
  //       user_id: e.user.id,
  //       email: e.user.email,
  //       name: e.user.name,
  //       empresa: e.user.empresa
  //     })) ?? [],
  //   });
  //   setSelectedUsers(equipeSelecionada);
  //   setIsEditing(true);
  //   setModalAberto(true);
  // };

  const handleSalvarRegistroHoras = async () => {
    if (isSubmitting) return; // evita duplo clique
      setIsSubmitting(true);

    try {

      const equipa_user = selectedUsers
      .map((id) => {
        const user = usuarios.find((u) => u.id === id)
          ?? editingRegistroHoras?.equipa.find((e) => e.user.id === id)?.user;
        if (!user) return null;
        return {
          user_id: user.id,
          email: user.email,
          empresa: user.empresa,
          intemperie: !!intemperiePorUserId[user.id],
          double_journey: !!doubleJourneyPorUserId[user.id],
        };
      })
      .filter(Boolean); // remove nulls se algum id não for encontrado

      const cid = formData.cliente_id && formData.cliente_id > 0 ? formData.cliente_id : null;
      const oid = formData.obra_id && formData.obra_id > 0 ? formData.obra_id : null;

      if (!formData.data || cid == null || oid == null) {
        showNotice('error', 'Preencha Data, Cliente e Obra.');
        return;
      }

      const manobradores = formData.intervencao_maquinas_opcoes.manobradores || [];
      if (manobradores.some(item => !item.user_id || !item.opcao)) {
        showNotice('error', 'Selecione o funcionário e a opção de máquina de cada manobrador.');
        return;
      }

      const vinculos = manobradores.map(item => `${item.user_id}:${item.opcao}`);
      if (new Set(vinculos).size !== vinculos.length) {
        showNotice('error', 'O mesmo manobrador não pode ser repetido na mesma opção de máquina.');
        return;
      }

      if (!formData.data || cid == null || oid == null) {
        alert('Por favor, preencha Data, Cliente e Obra.');
        return;
      }


      // const payload = {
      //     id: formData.id,
      //     //projeto_id: formData.projeto_id, nao estamos mais usando esse campo por enquanto
      //     projeto_id: 1,
      //     usuario_id: user?.id,
      //     data: formData.data,
      //     //horas: parseFloat(formData.horas),

      //     cliente_id: cid,
      //     obra_id: oid,

      //     metros_quadrados: formData.metros_quadrados,

      //     preparacao: !!formData.preparacao,
      //     bruto: !!formData.bruto,
      //     colagem: !!formData.colagem,
      //     acabamento: !!formData.acabamento,
      //     serragem: !!formData.serragem,
      //     coli: !!formData.coli,
      //     intervencao_maquinas: !!formData.intervencao_maquinas,
      //     intervencao_maquinas_opcoes: formData.intervencao_maquinas
      //       ? formData.intervencao_maquinas_opcoes
      //       : null,

      //     equipa: equipa_user,
      // };

      const motoristaPayload = isMotorista ? {
        origem: formData.origem || null,
        destino: formData.destino || null,
        matricula: formData.matricula || null,
        km_rodados: formData.km_rodados ? parseFloat(formData.km_rodados) : null,
        maquinas_transportadas: formData.maquinas_transportadas || null,
      } : {
        origem: null,
        destino: null,
        matricula: null,
        km_rodados: null,
        maquinas_transportadas: null,
      };

      const basePayload = {
        projeto_id: 1,
        data: formData.data,
        horas: parseFloat(formData.horas || "0") || 0,

        cliente_id: cid,
        obra_id: oid,

        metros_quadrados: formData.metros_quadrados,
        preparacao: !!formData.preparacao,
        bruto: !!formData.bruto,
        colagem: !!formData.colagem,
        acabamento: !!formData.acabamento,
        serragem: !!formData.serragem,
        coli: !!formData.coli,
        optipav: !!formData.optipav,
        double_journey_lider: !!formData.double_journey_lider,
        intervencao_maquinas: !!formData.intervencao_maquinas,
        intervencao_maquinas_opcoes: formData.intervencao_maquinas
          ? formData.intervencao_maquinas_opcoes
          : null,
        origem: formData.origem || null,
        destino: formData.destino || null,
        matricula: formData.matricula || null,
        km_rodados: formData.km_rodados ? parseFloat(formData.km_rodados) : null,
        maquinas_transportadas: formData.maquinas_transportadas || null,
        motoristaPayload,
        equipa: equipa_user,
      };

      console.log('payload', basePayload);
      if (isEditing && editingRegistroHoras) {
        console.log('user edit', user);
        console.log('edit selected user', selectedUsers);

        const payloadUpdate = {
          ...basePayload,
          modificado_por: user?.id, // <- OBRIGATÓRIO NO UPDATE
        };

        await api.put(`/registro-horas/${editingRegistroHoras.id}`,payloadUpdate);
        showNotice('success', 'Registo de trabalho atualizado com sucesso.');
      } else {
        console.log('create selected user', selectedUsers);

        const payloadCreate = {
          ...basePayload,
          usuario_id: user?.id, // <- quem criou
        };

        await api.post('/registro-horas/', payloadCreate );
        showNotice('success', 'Registo de trabalho criado com sucesso.');
      }

      resetForm();
      fetchRegistroHoras();
      setSelectedUsers([]);
    }
    catch (error: any) {
      const msg = error?.response?.data?.detail
        ? (Array.isArray(error.response.data.detail)
            ? error.response.data.detail.map((d:any)=>d.msg||JSON.stringify(d)).join('\n')
            : String(error.response.data.detail))
        : (error?.message || 'Erro inesperado ao salvar.');
      console.error(error);
      showNotice('error', msg, 6000);
    } finally {
      setIsSubmitting(false);
    }
    // catch (error: any) {
    //   if (error.response) {
    //     console.error("Erro na resposta:", error.response.data);
    //     alert(JSON.stringify(error.response.data.detail, null, 2));
    //   } else {
    //     console.error("Erro genérico:", error.message);
    //   }
    // }

  };

  const resetForm = () => {
    setFormData({id: 0, usuario_id: 0,
      projeto_id: 0,
      data: '',
      horas: '',
      //cliente: '',
      //obra: '',
      cliente_id: null,
      obra_id: null,
      metros_quadrados: '',
      preparacao: false,
      bruto: false,
      colagem: false,
      acabamento: false,
      serragem: false,
      coli: false,
      optipav: false,
      double_journey_lider: false,
      intervencao_maquinas: false,
      intervencao_maquinas_opcoes: {
        laserComManobrador: { checked: false, m2: '', empresa: '' },
        poComManobrador:    { checked: false, m2: '', empresa: '' },
        manobrador:         { checked: false, qtd: 1, empresa: '' },
        soLaser:            { checked: false, m2: '', empresa: '' },
        soPo:               { checked: false, m2: '', empresa: '' },
        laserWS940CComManobrador: { checked: false, m2: '', empresa: '' },
        lazerYZ30ComManobrador: { checked: false, m2: '', empresa: '' },
        soMaqLaserWS940C: { checked: false, m2: '', empresa: '' },
        soMaqLazerYZ30: { checked: false, m2: '', empresa: '' },
        manobradores: [],
      } as IntervencaoMaquinasOpcoes,
      equipa: [] as { user_id: number; email: string, empresa: string }[]});
    setSelectedUsers([]);
    setIntemperiePorUserId({});
    setDoubleJourneyPorUserId({});
    setEditingRegistroHoras(null);
    setIsEditing(false);
    setModalAberto(false);
  };

  const toggleOpcaoIntervencao = (key: keyof IntervencaoMaquinasOpcoes, checked: boolean) => {
    if (!checked && (formData.intervencao_maquinas_opcoes.manobradores || []).some(item => item.opcao === key)) {
      showNotice('info', 'Remova primeiro os manobradores ligados a esta opção de máquina.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      intervencao_maquinas_opcoes: {
        ...prev.intervencao_maquinas_opcoes,
        [key]: {
          ...(prev.intervencao_maquinas_opcoes as IntervencaoMaquinasOpcoes)[key],
          checked
        }
      }
    }));
  };

  const adicionarManobrador = () => {
    setFormData(prev => ({
      ...prev,
      intervencao_maquinas_opcoes: {
        ...prev.intervencao_maquinas_opcoes,
        manobradores: [
          ...(prev.intervencao_maquinas_opcoes.manobradores || []),
          { user_id: 0, opcao: '', m2: '', double_journey: false },
        ],
      },
    }));
  };

  const atualizarManobrador = (index: number, dados: Partial<ManobradorMaquina>) => {
    setFormData(prev => ({
      ...prev,
      intervencao_maquinas_opcoes: {
        ...prev.intervencao_maquinas_opcoes,
        manobradores: (prev.intervencao_maquinas_opcoes.manobradores || []).map(
          (item, i) => i === index ? { ...item, ...dados } : item
        ),
      },
    }));
  };

  const removerManobrador = (index: number) => {
    setFormData(prev => ({
      ...prev,
      intervencao_maquinas_opcoes: {
        ...prev.intervencao_maquinas_opcoes,
        manobradores: (prev.intervencao_maquinas_opcoes.manobradores || []).filter((_, i) => i !== index),
      },
    }));
  };

  const setValorM2 = (key: Exclude<keyof IntervencaoMaquinasOpcoes, 'manobrador'>, m2: string) => {
    setFormData(prev => ({
      ...prev,
      intervencao_maquinas_opcoes: {
        ...prev.intervencao_maquinas_opcoes,
        [key]: {
          ...(prev.intervencao_maquinas_opcoes as IntervencaoMaquinasOpcoes)[key],
          m2
        }
      }
    }));
  };

  // const abrirModalClienteObra = () => {
  //   console.log('abrirModalClienteObra');
  //   setNovoClienteNome('');
  //   setNovaObraNome('');
  //   setNovaObraDescricao('');
  //   setModalClienteObraAberto(true);
  // };
  // const fecharModalClienteObra = () => setModalClienteObraAberto(false);

  // --- CRIAR CLIENTE + OBRA (em sequência) ---
  // const handleCriarClienteEObra = async () => {
  //   if (!novoClienteNome.trim() || !novaObraNome.trim()) {
  //     alert('Preencha o nome do cliente e o nome da obra.');
  //     return;
  //   }

  //   try {
  //     setCriandoClienteObra(true);

  //     // 1) Cria o cliente
  //     const { data: clienteCriado } = await api.post<Cliente>('/clientes/', {
  //       nome: novoClienteNome.trim(),
  //       is_active: true,
  //     });

  //     // Atualiza a lista de clientes
  //     setClientes((prev) => [...prev, clienteCriado].sort((a, b) => a.nome.localeCompare(b.nome)));

  //     // 2) Cria a obra vinculada a esse cliente
  //     const { data: obraCriada } = await api.post<Obra>('/obras/', {
  //       nome: novaObraNome.trim(),
  //       descricao: novaObraDescricao?.trim() || null,
  //       cliente_id: clienteCriado.id,
  //     });

  //     // Atualiza a lista de obras atual
  //     setObras((prev) => {
  //       const nova = [...prev, obraCriada];
  //       return nova.sort((a, b) => a.nome.localeCompare(b.nome));
  //     });

  //     // Seleciona os dois no form principal
  //     setFormData((prev) => ({
  //       ...prev,
  //       cliente_id: clienteCriado.id,
  //       obra_id: obraCriada.id,
  //     }));

  //     // Se quiser, recarregue as obras desse cliente (garante consistência com backend)
  //     await fetchObrasByCliente(clienteCriado.id);

  //     setModalClienteObraAberto(false);
  //   } catch (err: any) {
  //     console.error(err);
  //     alert(err?.response?.data?.detail ?? 'Erro ao criar cliente/obra.');
  //   } finally {
  //     setCriandoClienteObra(false);
  //   }
  // };

  const abrirPopupCliente = () => {
    setNovoClienteNome('');
    setShowClientePopup(true);
  };

  const abrirPopupObra = () => {
    setNovaObraNome('');
    setNovaObraDescricao('');
    // pré-seleciona o cliente atual do form, se houver
    setObraClienteId(formData.cliente_id ?? null);
    setShowObraPopup(true);
  };

  const handleCriarCliente = async () => {
    if (!novoClienteNome.trim()) { alert('Informe o nome do cliente.'); return; }

    try {
      setCriandoCliente(true);
      const { data: clienteCriado } = await api.post<Cliente>('/clientes/', {
        nome: novoClienteNome.trim(),
        is_active: true,
      });

      // adiciona e ordena a lista
      setClientes(prev => [...prev, clienteCriado].sort((a,b) => a.nome.localeCompare(b.nome)));
      setObraClienteId(clienteCriado.id);

      // seleciona o novo cliente no form e limpa a obra (para forçar a escolha)
      setFormData(prev => ({ ...prev, cliente_id: clienteCriado.id, obra_id: null }));

      // carrega obras do novo cliente (vai vir vazia até criar uma)
      await fetchObrasByCliente(clienteCriado.id);

      setShowClientePopup(false);
    } catch (e: any) {
      alert(e?.response?.data?.detail ?? 'Erro ao criar cliente.');
    } finally {
      setCriandoCliente(false);
    }
  };

  const handleCriarObra = async () => {
    const cid = obraClienteId ?? formData.cliente_id;
    if (!cid) { alert('Selecione um cliente para vincular a obra.'); return; }
    if (!novaObraNome.trim()) { alert('Informe o nome da obra.'); return; }

    try {
      setCriandoObra(true);
      const { data: obraCriada } = await api.post<Obra>('/obras/', {
        nome: novaObraNome.trim(),
        descricao: (novaObraDescricao ?? '').trim() || null,
        cliente_id: cid,
      });

      // sempre recarrega do backend para garantir consistência
      await fetchObrasByCliente(cid);

      // assegura cliente_id correto no form
      setFormData((prev) => ({ ...prev, cliente_id: cid, obra_id: obraCriada.id }));

      setShowObraPopup(false);
    } catch (e: any) {
      alert(e?.response?.data?.detail ?? 'Erro ao criar obra.');
    } finally {
      setCriandoObra(false);
    }
  };

  const renderIntervencoes = (reg: RegistroHoras) => {
    const o = reg.intervencao_maquinas_opcoes;
    if (!reg.intervencao_maquinas || !o) return '—';

    const parts: string[] = [];

    if (o.laserComManobrador?.checked) {
      parts.push(`Laser c/ manobr.: ${o.laserComManobrador.m2 || '0'} m² (${o.laserComManobrador.empresa||'-'})`);
    }
    if (o.poComManobrador?.checked) {
      parts.push(`Pó c/ manobr.: ${o.poComManobrador.m2 || '0'} m² (${o.poComManobrador.empresa||'-'})`);
    }
    if (o.manobrador?.checked) {
      parts.push(`Manobrador: ${o.manobrador.qtd ?? 1} (${o.manobrador.empresa||'-'})`);
    }
    if (o.soLaser?.checked) {
      parts.push(`Só Laser: ${o.soLaser.m2 || '0'} m² (${o.soLaser.empresa||'-'})`);
    }
    if (o.soPo?.checked) {
      parts.push(`Só Pó: ${o.soPo.m2 || '0'} m² (${o.soPo.empresa||'-'})`);
    }
    if(o.laserWS940CComManobrador?.checked) {
      parts.push(`Laser WS940C c/ manobr.: ${o.laserWS940CComManobrador.m2 || '0'} m² (${o.laserWS940CComManobrador.empresa||'-'})`);
    }
    if(o.lazerYZ30ComManobrador?.checked) {
      parts.push(`Lazer YZ30 c/ manobr.: ${o.lazerYZ30ComManobrador.m2 || '0'} m² (${o.lazerYZ30ComManobrador.empresa||'-'})`);
    }
    if(o.soMaqLaserWS940C?.checked) {
      parts.push(`Só Laser WS940C: ${o.soMaqLaserWS940C.m2 || '0'} m² (${o.soMaqLaserWS940C.empresa||'-'})`);
    }
    if(o.soMaqLazerYZ30?.checked) {
      parts.push(`Só Lazer YZ30: ${o.soMaqLazerYZ30.m2 || '0'} m² (${o.soMaqLazerYZ30.empresa||'-'})`);
    }

    (o.manobradores || []).forEach(item => {
      const funcionario = usuarios.find(user => user.id === item.user_id);
      const opcao = opcoesComManobrador.find(opcao => opcao.value === item.opcao)?.label || item.opcao;
      parts.push(
        `Manobrador: ${funcionario?.name || `#${item.user_id}`} (${funcionario?.empresa || '-'}) — ${opcao}: ${item.m2 || '0'} m²${item.double_journey ? ' [Double Journey]' : ''}`
      );
    });

    // return parts.length ? parts.join(' • ') : '—';
    return parts.length ? parts.join(', ') : '—';
  };

  // Função para mostrar o nome do usuário pelo ID
  const getUserName = (id: number) => {
    const user = usuarios.find((u) => u.id === id);
    return user ? user.name : `ID: ${id}`;
  };

  const usuariosPorEmpresa = usuarios.reduce((acc, user) => {
    const empresa = (user.empresa || 'Sem Empresa').trim();
    //console.log('empresa', empresa);
    //console.log('user', user);
    if (!acc[empresa]) acc[empresa] = [];
    acc[empresa].push(user);
    return acc;
  }, {} as Record<string, User[]>);

  // quais empresas estão abertas (por nome)

  // const toggleEmpresa = (empresa: string) => {
  //   setEmpresasAbertas((prev) => ({
  //     ...prev,
  //     [empresa]: !prev[empresa],
  //   }));
  // };

  const toggleEmpresa = (empresa: string) => {
    setEmpresasAbertas((prev) => {
      const estavaAberta = Boolean(prev[empresa]);

      return estavaAberta
        ? {}
        : { [empresa]: true };
    });
  };

  const setEmpresaOpt = (
    key: keyof IntervencaoMaquinasOpcoes,
    empresa: string
  ) => {
    setFormData(prev => ({
      ...prev,
      intervencao_maquinas_opcoes: {
        ...prev.intervencao_maquinas_opcoes,
        [key]: {
          ...(prev.intervencao_maquinas_opcoes as any)[key],
          empresa,
        },
      },
    }));
  };

  function showNotice(type: 'success'|'error'|'info', text: string, timeout = 30000) {
    setNotice({ type, text });
    if (timeout) {
      setTimeout(() => setNotice(null), timeout);
    }
  }

  const usuariosFiltrados = searchUser.trim().length >= 2
  ? usuarios
      .filter(u => !selectedUsers.includes(u.id))
      .filter(u => u.name.toLowerCase().includes(searchUser.toLowerCase()))
      .slice(0, 10) // limita a 10 sugestões
  : [];

  // adiciona o usuário à equipa e abre a empresa dele
  function addUserToEquipe(u: User) {
    setSelectedUsers(prev => prev.includes(u.id) ? prev : [...prev, u.id]);

    // abre a secção da empresa do usuário (para ele ficar visível marcado)
    setEmpresasAbertas(prev => ({ ...prev, [u.empresa?.trim() || 'Sem Empresa']: true }));

    // define intemperie padrão (ajuste se quiser herdar algo)
    setIntemperiePorUserId(prev => ({ ...prev, [u.id]: false }));
    setDoubleJourneyPorUserId(prev => ({ ...prev, [u.id]: false }));

    // limpa busca
    setSearchUser('');
    setShowSugestoes(false);
  }

  // fecha o dropdown ao clicar fora ou apertar ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowSugestoes(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // devolve "João Silva" a partir do id numérico
  function getUserNameById(userId: number | null | undefined, usuariosLista: User[]): string {
    if (!userId) return "-";
    const u = usuariosLista.find(u => u.id === userId);
    return u ? u.name : `ID ${userId}`;
  }

  // formata a data/hora da última modificação num formato curtinho
  function formatDateTime(ts: string | null | undefined): string {
    if (!ts) return "-";
    // tenta converter
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts; // fallback bruto se backend mandar num formato estranho

    // dd/mm/yyyy hh:mm
    const dia   = String(d.getDate()).padStart(2, "0");
    const mes   = String(d.getMonth() + 1).padStart(2, "0");
    const ano   = d.getFullYear();
    const horas = String(d.getHours()).padStart(2, "0");
    const mins  = String(d.getMinutes()).padStart(2, "0");

    return `${dia}/${mes}/${ano} ${horas}:${mins}`;
  }

  // useEffect(() => {
  //   setFormData((prev: any) => ({
  //     ...prev,
  //     equipa: selectedUsers
  //   }));
  // }, [selectedUsers]);

  const classeInputMotorista = [
    "w-full rounded-md",
    "!border !border-gray-300",
    "!bg-white !text-gray-900",
    "shadow-sm",
    "placeholder:!text-gray-400",
    "focus:!border-blue-500",
    "focus:!ring-2 focus:!ring-blue-200",
  ].join(" ");

  if (carregandoPagina) {
    return (
      <div className="min-h-[60vh] bg-gray-100 p-6">
        <h2 className="mb-6 text-3xl font-bold text-gray-800">
          Registo de Trabalho
        </h2>

        <div className="rounded-2xl bg-white shadow-sm">
          <LoadingState message="A carregar registos..." />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold border-b pb-2 mb-6">Registo de Trabalho</h2>

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
      {notice && (
        <div
          className={[
            "rounded-lg px-4 py-2 text-sm border",
            notice.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' :
            notice.type === 'error'   ? 'bg-red-50 text-red-800 border-red-200' :
                                        'bg-blue-50 text-blue-800 border-blue-200'
          ].join(' ')}
          role={notice.type === 'error' ? 'alert' : 'status'}
        >
          {notice.text}
        </div>
      )}
      {/* Modal de edição/criação */}
      {modalAberto && (
        // <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 10000, width: '100%' }}>
        //   <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl shadow-xl">
        <section className="bg-white rounded-xl shadow-xl border p-6 space-y-4 mb-8
                      after:content-[''] after:block after:clear-both" style={{ margin: '0 0 2% 0', borderStyle: 'hidden' }}>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              {isEditing ? 'Editar Registro' : 'Novo Registro'}
            </h2>

            <div className="grid w-full grid-cols-1 gap-6 p-1 xl:grid-cols-2">
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
                <label className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={!!formData.double_journey_lider}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      double_journey_lider: e.target.checked,
                    }))}
                  />
                  <span>
                    <b>Double Journey do chefe de equipa</b>
                    <span className="block text-xs">Marque se o chefe trabalhou noutra obra nesta data.</span>
                  </span>
                </label>
                {/* <div className="ff-class-form-registro-hora-elements align-float-left" >
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
                </div> */}

                {/* Cliente */}
                <div className="ff-class-form-registro-hora-elements align-float-left" >
                  <Label className="ff-class-form-registro-hora-elements-lbl">Cliente</Label>
                  <select
                    value={formData.cliente_id ?? ''}
                    onChange={(e) => {
                      // const v = e.target.value === '' ? null : Number(e.target.value);
                      // const v = Number(e.target.value);
                      // setFormData({ ...formData, cliente_id: v, obra_id: null }); // reset obra ao trocar cliente
                      // fetchObrasByCliente(v);
                      const v = e.target.value ? Number(e.target.value) : null; // 👈 aqui
                      setFormData((prev) => ({ ...prev, cliente_id: v, obra_id: null }));
                      if (v) fetchObrasByCliente(v); else setObras([]);
                    }}
                  >
                    <option value="">Selecione</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                  {/* Wrapper âncora do botão + popup */}
                  <div className="relative inline-block ml-2 align-top" style={{ margin: '0 0 0 1%', width: '70%' }}>
                    {/* <Button
                      type="button"
                      className="btn-bg-blue-500"
                      style={{ padding: '0.1em 1.2em !important'  }}
                      onClick={() => {
                        setNovoClienteNome('');
                        setNovaObraNome('');
                        setNovaObraDescricao('');
                        setShowPopup((v) => !v);
                      }}
                    >
                      + Cliente & Obra
                    </Button> */}

                    <Button type="button" className="btn-bg-blue-500" onClick={abrirPopupCliente}>
                      + Cliente
                    </Button>

                    {/* POPUP: Novo Cliente */}
                    {showClientePopup && (
                      <div
                        className="relative inset-0 z-[12000] flex items-start justify-center p-4 bg-black/40"
                        role="dialog" aria-modal="true"
                        style={{ width: '70%' }}
                        onClick={() => setShowClientePopup(false)}  // fecha ao clicar fora
                      >
                        <div
                          className="bg-white w-full max-w-md rounded-xl shadow-2xl border p-5"
                          style={{ padding: '2%' }}
                          onClick={(e) => e.stopPropagation()}      // evita fechar ao clicar dentro
                        >
                          <h3 className="text-base font-semibold mb-3">Novo cliente</h3>

                          <div className="space-y-3">
                            <div>
                              <Label>Nome do cliente</Label>
                              <Input
                                placeholder="Ex.: ACME Ltda"
                                value={novoClienteNome}
                                onChange={(e) => setNovoClienteNome(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 mt-4">
                            <Button className="btn-bg-gray-500" variant="outline" onClick={() => setShowClientePopup(false)} disabled={criandoCliente}>
                              Cancelar
                            </Button>
                            <Button className="btn-bg-blue-500" onClick={handleCriarCliente} disabled={criandoCliente}>
                              {criandoCliente ? 'Criando...' : 'Criar'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                  {/* <Button type="button" className="btn-bg-blue-500" onClick={abrirModalClienteObra}>
                    + Cliente & Obra
                  </Button> */}
                </div>
                {/* <Label>Cliente</Label>
                <select
                  value={formData.cliente_id || ''}
                  onChange={(e) => setFormData({ ...formData, cliente_id: Number(e.target.value), obra_id: 0 })}
                  className="border rounded px-3 py-1 bg-white"
                >
                  <option value="">Selecione</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select> */}

                {/* Obra (carrega pelas do cliente selecionado) */}
                <div className="ff-class-form-registro-hora-elements align-float-left" >
                  <Label className="ff-class-form-registro-hora-elements-lbl">Obra</Label>
                  <select
                    value={formData.obra_id ?? ''}                  // '' quando null
                    onChange={(e) => setFormData({
                      ...formData,
                      obra_id: e.target.value ? Number(e.target.value) : null,
                    })}
                    disabled={!formData.cliente_id}
                    className="border rounded px-3 py-1 bg-white"
                  >
                    <option value="">Selecione</option>
                    {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                  </select>
                  <div className="relative inline-block ml-2 align-top" style={{ margin: '0 0 0 1%', width: '85%' }}>
                    <Button type="button" className="btn-bg-blue-500" onClick={abrirPopupObra}>
                      + Obra
                    </Button>
                    {/* POPUP: Nova Obra */}
                    {showObraPopup && (
                      <div
                        className="relative inset-0 z-[12000] flex items-start justify-center p-4 bg-black/40"
                        style={{ width: '85%' }}
                        role="dialog" aria-modal="true"
                        onClick={() => setShowObraPopup(false)}
                      >
                        <div
                          className="bg-white w-full max-w-lg rounded-xl shadow-2xl border p-5"
                          style={{ padding: '2%' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <h3 className="text-base font-semibold mb-3">Nova obra</h3>

                          <div className="space-y-3">
                            <div>
                              <Label>Cliente da obra</Label>
                              <select
                                className="border rounded px-3 py-1 w-full bg-white"
                                value={obraClienteId ?? ''}
                                onChange={(e) => setObraClienteId(e.target.value ? Number(e.target.value) : null)}
                              >
                                <option value="">Selecione</option>
                                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                              </select>
                            </div>

                            <div>
                              <Label>Nome da obra</Label>
                              <Input
                                placeholder="Ex.: 1194"
                                value={novaObraNome}
                                onChange={(e) => setNovaObraNome(e.target.value)}
                              />
                            </div>

                            <div>
                              <Label>Descrição (opcional)</Label>
                              <Input
                                placeholder="Descrição da obra"
                                value={novaObraDescricao}
                                onChange={(e) => setNovaObraDescricao(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 mt-4">
                            <Button className="btn-bg-gray-500" variant="outline" onClick={() => setShowObraPopup(false)} disabled={criandoObra}>
                              Cancelar
                            </Button>
                            <Button className="btn-bg-blue-500" onClick={handleCriarObra} disabled={criandoObra}>
                              {criandoObra ? 'Criando...' : 'Criar e selecionar'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* <Label>Obra</Label>
                <select
                  value={formData.obra_id || ''}
                  onChange={(e) => setFormData({ ...formData, obra_id: Number(e.target.value) })}
                  disabled={!formData.cliente_id}
                  className="border rounded px-3 py-1 bg-white"
                >
                  <option value="">Selecione</option>
                  {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                </select> */}


              </div>
              <div className="ff-class-form-registro-hora-elements align-float-left" >
                <Label className="ff-class-form-registro-hora-elements-lbl">Metros Quadrados</Label>
                <Input
                  value={formData.metros_quadrados ?? ''}
                  onChange={(e) => setFormData({ ...formData, metros_quadrados: e.target.value })}
                />
              </div>
              {/* Campos booleanos como checkboxes */}
              {/* Serviço e dados de transporte */}

              <section
                className={[
                  "min-w-0 xl:col-span-2",
                  "rounded-xl border border-gray-200",
                  "bg-gray-50 p-4",
                ].join(" ")}
              >
                <h3 className="mb-3 text-sm font-semibold text-gray-700">
                  Descrição do Serviço
                </h3>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                  {[
                    "preparacao",
                    "bruto",
                    "colagem",
                    "acabamento",
                    "serragem",
                    "optipav",
                    "coli",
                    "intervencao_maquinas",
                  ].map((field) => (
                    <label
                      key={field}
                      className="flex cursor-pointer items-center gap-2 text-sm text-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={
                          formData[
                            field as keyof typeof formData
                          ] as boolean
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [field]: e.target.checked,
                          })
                        }
                        className="h-4 w-4 accent-red-600"
                      />

                      <span className="capitalize">
                        {field.replaceAll("_", " ")}
                      </span>
                    </label>
                  ))}
                </div>
              </section>

              {formData.intervencao_maquinas && (
                <div className="sm:col-span-2 mt-2 p-4 rounded-xl border border-gray-200 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Opções de Intervenção de Máquinas
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Máq Laser c/ manobrador (m2) */}
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.intervencao_maquinas_opcoes.laserComManobrador?.checked}
                        onChange={(e) => toggleOpcaoIntervencao('laserComManobrador', e.target.checked)}
                      />
                      <span className="min-w-[14ch]">Máq Laser c/ manobrador (m²)</span>
                      <Input
                        type="number"
                        placeholder="m²"
                        className="w-32"
                        disabled={!formData.intervencao_maquinas_opcoes.laserComManobrador?.checked}
                        value={formData.intervencao_maquinas_opcoes.laserComManobrador?.m2}
                        onChange={(e) => setValorM2('laserComManobrador', e.target.value)}
                      />
                    </label>

                    {/* Máq Pó c/ manobrador (m2) */}
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.intervencao_maquinas_opcoes.poComManobrador?.checked}
                        onChange={(e) => toggleOpcaoIntervencao('poComManobrador', e.target.checked)}
                      />
                      <span className="min-w-[14ch]">Máq Pó c/ manobrador (m²)</span>
                      <Input
                        type="number"
                        placeholder="m²"
                        className="w-32"
                        disabled={!formData.intervencao_maquinas_opcoes.poComManobrador?.checked}
                        value={formData.intervencao_maquinas_opcoes.poComManobrador?.m2}
                        onChange={(e) => setValorM2('poComManobrador', e.target.value)}
                      />
                    </label>


                    {/* Só Máq Laser (m2) */}
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.intervencao_maquinas_opcoes.soLaser?.checked}
                        onChange={(e) => toggleOpcaoIntervencao('soLaser', e.target.checked)}
                      />
                      <span className="min-w-[14ch]">Só Máq Laser (m²)</span>
                      <Input
                        type="number"
                        placeholder="m²"
                        className="w-32"
                        disabled={!formData.intervencao_maquinas_opcoes.soLaser?.checked}
                        value={formData.intervencao_maquinas_opcoes.soLaser?.m2}
                        onChange={(e) => setValorM2('soLaser', e.target.value)}
                      />
                      <select
                        className="border rounded px-2 py-1"
                        disabled={!formData.intervencao_maquinas_opcoes.soLaser?.checked}
                        value={formData.intervencao_maquinas_opcoes.soLaser?.empresa || ""}
                        onChange={(e) => setEmpresaOpt('soLaser', e.target.value)}
                      >
                        <option value="">Empresa</option>
                        {empresasLista.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                      </select>
                    </label>

                    {/* Só Máq Pó (m2) */}
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.intervencao_maquinas_opcoes.soPo?.checked}
                        onChange={(e) => toggleOpcaoIntervencao('soPo', e.target.checked)}
                      />
                      <span className="min-w-[14ch]">Só Máq Pó (m²)</span>
                      <Input
                        type="number"
                        placeholder="m²"
                        className="w-32"
                        disabled={!formData.intervencao_maquinas_opcoes.soPo?.checked}
                        value={formData.intervencao_maquinas_opcoes.soPo?.m2}
                        onChange={(e) => setValorM2('soPo', e.target.value)}
                      />
                      <select
                        className="border rounded px-2 py-1"
                        disabled={!formData.intervencao_maquinas_opcoes.soPo?.checked}
                        value={formData.intervencao_maquinas_opcoes.soPo?.empresa || ""}
                        onChange={(e) => setEmpresaOpt('soPo', e.target.value)}
                      >
                        <option value="">Empresa</option>
                        {empresasLista.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                      </select>
                    </label>
                    {/* laser WS940C (m2) com manobrador */}
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.intervencao_maquinas_opcoes.laserWS940CComManobrador?.checked}
                        onChange={(e) => toggleOpcaoIntervencao('laserWS940CComManobrador', e.target.checked)}
                      />
                      <span className="min-w-[14ch]">Laser WS940C c/ manobrador (m²)</span>
                      <Input
                        type="number"
                        placeholder="m²"
                        className="w-32"
                        disabled={!formData.intervencao_maquinas_opcoes.laserWS940CComManobrador?.checked}
                        value={formData.intervencao_maquinas_opcoes.laserWS940CComManobrador?.m2}
                        onChange={(e) => setValorM2('laserWS940CComManobrador', e.target.value)}
                      />
                    </label>
                    {/* lazer YZ30 (m2) com manobrador */}
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.intervencao_maquinas_opcoes.lazerYZ30ComManobrador?.checked}
                        onChange={(e) => toggleOpcaoIntervencao('lazerYZ30ComManobrador', e.target.checked)}
                      />
                      <span className="min-w-[14ch]">Lazer YZ30 c/ manobrador (m²)</span>
                      <Input
                        type="number"
                        placeholder="m²"
                        className="w-32"
                        disabled={!formData.intervencao_maquinas_opcoes.lazerYZ30ComManobrador?.checked}                        value={formData.intervencao_maquinas_opcoes.lazerYZ30ComManobrador?.m2}
                        onChange={(e) => setValorM2('lazerYZ30ComManobrador', e.target.value)}
                      />
                    </label>
                    {/* so maquinas laser WS940C (m2)  */}
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.intervencao_maquinas_opcoes.soMaqLaserWS940C?.checked}
                        onChange={(e) => toggleOpcaoIntervencao('soMaqLaserWS940C', e.target.checked)}
                      />
                      <span className="min-w-[14ch]">Só Máq Laser WS940C (m²)</span>
                      <Input
                        type="number"
                        placeholder="m²"
                        className="w-32"
                        disabled={!formData.intervencao_maquinas_opcoes.soMaqLaserWS940C?.checked}
                        value={formData.intervencao_maquinas_opcoes.soMaqLaserWS940C?.m2}
                        onChange={(e) => setValorM2('soMaqLaserWS940C', e.target.value)}
                      />
                      <select
                        className="border rounded px-2 py-1"
                        disabled={!formData.intervencao_maquinas_opcoes.soMaqLaserWS940C?.checked}
                        value={formData.intervencao_maquinas_opcoes.soMaqLaserWS940C?.empresa || ""}
                        onChange={(e) => setEmpresaOpt('soMaqLaserWS940C', e.target.value)}
                      >
                        <option value="">Empresa</option>
                        {empresasLista.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                      </select>
                    </label>
                    {/* so maquinas laser YZ30 (m2)  */}
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.intervencao_maquinas_opcoes.soMaqLazerYZ30?.checked}
                        onChange={(e) => toggleOpcaoIntervencao('soMaqLazerYZ30', e.target.checked)}
                      />
                      <span className="min-w-[14ch]">Só Máq Laser YZ30 (m²)</span>
                      <Input
                        type="number"
                        placeholder="m²"
                        className="w-32"
                        disabled={!formData.intervencao_maquinas_opcoes.soMaqLazerYZ30?.checked}
                        value={formData.intervencao_maquinas_opcoes.soMaqLazerYZ30?.m2}
                        onChange={(e) => setValorM2('soMaqLazerYZ30', e.target.value)}
                      />
                      <select
                        className="border rounded px-2 py-1"
                        disabled={!formData.intervencao_maquinas_opcoes.soMaqLazerYZ30?.checked}
                        value={formData.intervencao_maquinas_opcoes.soMaqLazerYZ30?.empresa || ""}
                        onChange={(e) => setEmpresaOpt('soMaqLazerYZ30', e.target.value)}
                      >
                        <option value="">Empresa</option>
                        {empresasLista.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                      </select>
                    </label>
                  </div>

                  <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-blue-950">Manobradores por máquina</h4>
                        <p className="text-xs text-blue-800">
                          Selecione o funcionário e a intervenção específica. A empresa vem do cadastro.
                        </p>
                      </div>
                      <Button type="button" className="btn-bg-blue-500" onClick={adicionarManobrador}>
                        + Adicionar manobrador
                      </Button>
                    </div>

                    {(formData.intervencao_maquinas_opcoes.manobradores || []).length === 0 ? (
                      <p className="text-sm text-gray-500">Nenhum manobrador adicionado.</p>
                    ) : (
                      <div className="space-y-3">
                        {(formData.intervencao_maquinas_opcoes.manobradores || []).map((item, index) => {
                          const funcionario = usuarios.find(u => u.id === item.user_id);
                          return (
                            <div key={index} className="grid gap-3 rounded-md border bg-white p-3 md:grid-cols-[1.3fr_1.3fr_0.6fr_0.8fr_auto] md:items-end">
                              <div>
                                <Label>Funcionário</Label>
                                <select
                                  className="w-full rounded border bg-white px-3 py-2"
                                  value={item.user_id || ''}
                                  onChange={(e) => atualizarManobrador(index, { user_id: Number(e.target.value) })}
                                >
                                  <option value="">Selecione</option>
                                  {usuarios.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <Label>Metros (m²)</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="m²"
                                  value={item.m2 || ''}
                                  onChange={(e) => atualizarManobrador(index, { m2: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label>Opção de intervenção</Label>
                                <select
                                  className="w-full rounded border bg-white px-3 py-2"
                                  value={item.opcao}
                                  onChange={(e) => {
                                    const opcao = e.target.value as OpcaoComManobrador;
                                    atualizarManobrador(index, { opcao });
                                    toggleOpcaoIntervencao(opcao, true);
                                  }}
                                >
                                  <option value="">Selecione</option>
                                  {opcoesComManobrador.map(opcao => (
                                    <option key={opcao.value} value={opcao.value}>{opcao.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <Label>Empresa</Label>
                                <div className="rounded border bg-gray-100 px-3 py-2 text-sm">
                                  {funcionario?.empresa || '—'}
                                </div>
                                <label className="mt-2 inline-flex items-center gap-2 text-xs text-amber-800">
                                  <input
                                    type="checkbox"
                                    checked={item.double_journey}
                                    onChange={(e) => atualizarManobrador(index, { double_journey: e.target.checked })}
                                  />
                                  <b>Double Journey</b>
                                </label>
                              </div>
                              <Button type="button" variant="outline" onClick={() => removerManobrador(index)}>
                                Remover
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="min-w-0 space-y-3 xl:col-span-2">
                {/* 🔎 Adicionar membro por nome */}
                <div className="mb-2 relative">
                  <Label className="block text-sm font-medium text-gray-700" style={{ fontWeight: 700 }}>
                    Adicionar membro por nome
                  </Label>
                  <Input
                    placeholder="Digite 2+ letras do nome…"
                    value={searchUser}
                    onChange={(e) => { setSearchUser(e.target.value); setShowSugestoes(true); }}
                    onFocus={() => setShowSugestoes(true)}
                    onBlur={() => setTimeout(() => setShowSugestoes(false), 120)} // pequeno delay p/ permitir clique
                  />

                  {/* Dropdown de sugestões */}
                  {showSugestoes && usuariosFiltrados.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-auto">
                      {usuariosFiltrados.map(u => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => addUserToEquipe(u)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50"
                          title={`Selecionar ${u.name}`}
                        >
                          <div className="text-sm text-gray-900">{u.name}</div>
                          <div className="text-xs text-gray-500">{u.email} • {u.empresa || 'Sem Empresa'}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Sem resultados */}
                  {showSugestoes && searchUser.trim().length >= 2 && usuariosFiltrados.length === 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-sm px-3 py-2 text-sm text-gray-500">
                      Nenhum usuário encontrado.
                    </div>
                  )}
                </div>

                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedUsers.map(id => {
                      const u = usuarios.find(x => x.id === id);
                      if (!u) return null;
                      return (
                        <span key={id} className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-gray-100 text-xs">
                          {u.name} <em className="not-italic text-[11px] text-gray-500">({u.empresa || '—'})</em>
                          <button
                            type="button"
                            className="text-gray-500 hover:text-gray-800"
                            onClick={() => setSelectedUsers(prev => prev.filter(x => x !== id))}
                            title="Remover"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                <label className="block text-sm font-medium text-gray-700" style={{ fontWeight: '700' }} >Equipa</label>
                <div className="space-y-3">
                  {Object.entries(usuariosPorEmpresa).map(([empresa, lista]) => {
                    const opened = !!empresasAbertas[empresa];

                    return (
                      <div
                        key={empresa}
                        className={`overflow-hidden rounded-lg ${
                          empresa === 'UNIDAL' || empresa === 'Unidal' ? 'empresa-bg-red-100' :
                          empresa === 'HPR'    || empresa === 'Hpr'    ? 'empresa-bg-blue-100' :
                          empresa === 'HPNC'   || empresa === 'Hpnc'   ? 'empresa-bg-yellow-100' :
                          empresa === 'ARUNCA' || empresa === 'Arunca' ? 'empresa-bg-orange-100' :
                          empresa === 'UNISOL' || empresa === 'Unisol' ? 'empresa-bg-orange-100' :
                          empresa === 'FLORIDAMPLITUDE' || empresa === 'Floridamplitude' ? 'empresa-bg-green-100' :
                          'bg-gray-100'
                        }`}
                      >
                        {/* Cabeçalho clicável */}
                        <button
                          type="button"
                          onClick={() => toggleEmpresa(empresa)}
                          aria-expanded={opened}
                          aria-controls={`lista-${empresa}`}
                          className={[
                            "flex w-full items-center justify-between",
                            "px-4 py-3 text-left",
                            "transition-colors hover:bg-black/5",
                            "focus:outline-none focus:ring-2",
                            "focus:ring-inset focus:ring-black/10",
                          ].join(" ")}
                        >
                          <span className="font-semibold text-gray-700">
                            {empresa}
                          </span>

                          <span
                            aria-hidden="true"
                            className={[
                              "shrink-0 transition-transform duration-200",
                              opened ? "rotate-90" : "",
                            ].join(" ")}
                          >
                            ▸
                          </span>
                        </button>

                        {/* Lista de usuários (expand/collapse) */}
                        <div
                          id={`lista-${empresa}`}
                          className={
                            opened
                              ? [
                                  "grid max-h-80",
                                  "grid-cols-1 gap-x-6 gap-y-3",
                                  "overflow-y-auto",
                                  "border-t border-black/5",
                                  "bg-white/40 px-4 py-4",
                                  "sm:grid-cols-2",
                                  "lg:grid-cols-3",
                                  "2xl:grid-cols-4",
                                ].join(" ")
                              : "hidden"
                          }
                        >
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
                              {selectedUsers.includes(u.id) && (
                                <span className="ml-2 inline-flex flex-wrap items-center gap-3 text-xs">
                                  <label className="inline-flex items-center gap-1">
                                    <input
                                      type="checkbox"
                                      checked={!!intemperiePorUserId[u.id]}
                                      onChange={(e) =>
                                        setIntemperiePorUserId(prev => ({ ...prev, [u.id]: e.target.checked }))
                                      }
                                    />
                                    <span><b>Intempérie</b></span>
                                  </label>
                                  <label className="inline-flex items-center gap-1 text-amber-800">
                                    <input
                                      type="checkbox"
                                      checked={!!doubleJourneyPorUserId[u.id]}
                                      onChange={(e) =>
                                        setDoubleJourneyPorUserId(prev => ({ ...prev, [u.id]: e.target.checked }))
                                      }
                                    />
                                    <span><b>Double Journey</b></span>
                                  </label>
                                </span>
                              )}
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* {Object.entries(usuariosPorEmpresa).map(([empresa, lista], index) => (
                  <div
                    key={empresa}
                    className={`rounded p-3 ${
                      empresa === 'UNIDAL' || empresa === 'Unidal' ? 'empresa-bg-red-100' :
                      empresa === 'HPR' || empresa === 'Hpr' ? 'empresa-bg-blue-100' :
                      empresa === 'HPNC' || empresa === 'Hpnc' ? 'empresa-bg-yellow-100' :
                      empresa === 'ARUNCA' || empresa === 'Arunca' ? 'empresa-bg-orange-100' :
                      empresa === 'UNISOL' || empresa === 'Unisol' ? 'empresa-bg-orange-100' :
                      empresa === 'FLORIDAMPLITUDE' || empresa === 'Floridamplitude' ? 'empresa-bg-green-100' :
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
                ))} */}
              </div>

              {(isOperadorOuMotorista || isAdmin) && (
                <section
                  className={[
                    "min-w-0 xl:col-span-2",
                    "rounded-xl border border-gray-200",
                    "bg-gray-50 p-4",
                  ].join(" ")}
                >
                  <h3 className="mb-4 text-sm font-semibold text-gray-700">
                    Dados de Motorista
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="min-w-0">
                      <Label className="mb-1 block">Origem</Label>
                      <Input
                        value={formData.origem}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            origem: e.target.value,
                          })
                        }
                        className={classeInputMotorista}
                      />
                    </div>

                    <div className="min-w-0">
                      <Label className="mb-1 block">Destino</Label>
                      <Input
                        value={formData.destino}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            destino: e.target.value,
                          })
                        }
                        className={classeInputMotorista}
                      />
                    </div>

                    <div className="min-w-0">
                      <Label className="mb-1 block">Matrícula</Label>
                      <Input
                        value={formData.matricula}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            matricula: e.target.value,
                          })
                        }
                        className={classeInputMotorista}
                      />
                    </div>

                    <div className="min-w-0">
                      <Label className="mb-1 block">KM Rodados</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.km_rodados}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            km_rodados: e.target.value,
                          })
                        }
                        className={classeInputMotorista}
                      />
                    </div>

                    <div className="min-w-0 md:col-span-2">
                      <Label className="mb-1 block">
                        Máquinas transportadas
                      </Label>

                      <Input
                        placeholder="Ex.: WS940C, YZ30, Pá carregadora..."
                        value={formData.maquinas_transportadas}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maquinas_transportadas: e.target.value,
                          })
                        }
                        className={classeInputMotorista}
                      />
                    </div>
                  </div>
                </section>
              )}

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

            {/* {(isOperadorOuMotorista || isAdmin) && (
              <div className="sm:col-span-2 mt-2 p-4 rounded-xl border border-gray-200 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-700 mb-3" style={{ marginLeft: '1%' }}>Dados de Motorista</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginLeft: '1%' }}>
                  <div className="ff-class-form-registro-hora-elements align-float-left">
                    <Label className="ff-class-form-registro-hora-elements-lbl">Origem</Label>
                    <Input value={formData.origem} onChange={(e)=>setFormData({...formData, origem: e.target.value})}/>
                  </div>

                  <div className="ff-class-form-registro-hora-elements align-float-left">
                    <Label className="ff-class-form-registro-hora-elements-lbl">Destino</Label>
                    <Input value={formData.destino} onChange={(e)=>setFormData({...formData, destino: e.target.value})}/>
                  </div>

                  <div className="ff-class-form-registro-hora-elements align-float-left">
                    <Label className="ff-class-form-registro-hora-elements-lbl">Matrícula</Label>
                    <Input value={formData.matricula} onChange={(e)=>setFormData({...formData, matricula: e.target.value})}/>
                  </div>

                  <div className="ff-class-form-registro-hora-elements align-float-left">
                    <Label className="ff-class-form-registro-hora-elements-lbl">KM Rodados</Label>
                    <Input type="number" value={formData.km_rodados} onChange={(e)=>setFormData({...formData, km_rodados: e.target.value})}/>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="ff-class-form-registro-hora-elements-lbl">Máquinas transportadas</Label>
                    <Input
                      placeholder="Ex.: WS940C, YZ30, Pá carregadora..."
                      value={formData.maquinas_transportadas}
                      onChange={(e)=>setFormData({...formData, maquinas_transportadas: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )} */}


            <div className="flex justify-end gap-2 div-form-btn">
              <Button
                className="btn-bg-blue-500"
                onClick={handleSalvarRegistroHoras}
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Salvar')}
              </Button>
              <Button
                className="generic-btn"
                variant="outline"
                onClick={resetForm}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            </div>

            {/* <div className="flex justify-end gap-2 div-form-btn">
              <Button className='btn-bg-blue-500' onClick={handleSalvarRegistroHoras}>
                {isEditing ? 'Atualizar' : 'Salvar'}
              </Button>
              <Button className='generic-btn' variant="outline" onClick={resetForm}>Cancelar</Button>
            </div> */}
          {/* </div>
        </div> */}
          {isSubmitting && (
            <div className="fixed inset-0 z-[20000] bg-black/30 backdrop-blur-[1px] flex items-center justify-center cursor-wait">
              <div className="bg-white rounded-lg px-4 py-2 shadow border text-sm">
                Processando, por favor aguarde…
              </div>
            </div>
          )}
        </section>
      )}
      {/* {modalClienteObraAberto && (
        <div className="relative inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50
                          bg-black/50" style={{ zIndex: 11000, width: '100%' }}>
          <div className="bg-white w-full max-w-md rounded-xl p-5 space-y-4 shadow-xl">
            <h3 className="text-lg font-semibold">Novo cliente e obra</h3>

            <div className="space-y-3">
              <div>
                <Label>Cliente</Label>
                <Input
                  placeholder="Nome do cliente"
                  value={novoClienteNome}
                  onChange={(e) => setNovoClienteNome(e.target.value)}
                />
              </div>

              <div>
                <Label>Obra</Label>
                <Input
                  placeholder="Nome da obra"
                  value={novaObraNome}
                  onChange={(e) => setNovaObraNome(e.target.value)}
                />
              </div>

              <div>
                <Label>Descrição (opcional)</Label>
                <Input
                  placeholder="Descrição da obra"
                  value={novaObraDescricao}
                  onChange={(e) => setNovaObraDescricao(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={fecharModalClienteObra} disabled={criandoClienteObra}>
                Cancelar
              </Button>
              <Button className="btn-bg-blue-500" onClick={handleCriarClienteEObra} disabled={criandoClienteObra}>
                {criandoClienteObra ? 'Criando...' : 'Criar e selecionar'}
              </Button>
            </div>
          </div>
        </div>
      )} */}
      <div className="flex justify-between items-center">
        <FiltroRegistros
          clientes={clientes}          // lista que você já tem no pai
          obras={obrasFiltro}          // lista carregada conforme o cliente
          onChangeCliente={loadObrasFiltro}
          onFilter={handleFiltro}      // nome certo, sem “1”
        />
      </div>
      {/* Tabela */}
      <div className="rounded-xl shadow overflow-x-auto mt-8 clear-both">
        <table cellSpacing="0" cellPadding="20" className="w-full table-auto text-sm divide-y divide-gray-200 table-spacing-0">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide text-left">
            <tr className="head-lista">
              <th className="px-4 py-2">Líder equipa</th>
              {/* <th className="px-4 py-2">Projeto</th> */}
              <th className="px-4 py-2">Data</th>
              {/* <th className="px-4 py-2">Horas</th> */}
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2">Obra</th>
              <th className="px-4 py-2">m²</th>
              <th className="px-4 py-2">Equipa</th>
              <th className="px-4 py-2">Etapas</th>
              <th className="px-4 py-2">Interv. Máq. (detalhes)</th>
              <th className="px-4 py-2">Modificado por</th>
              <th className="px-4 py-2">Modificado em</th>
              <th className="px-4 py-2">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-gray-50 text-xs text-gray-500 tracking-wide text-left">
            {/* {registroHoras.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-500">Nenhum registo encontrado</td>
              </tr>
            ) : (
              registroHoras
              .slice((currentPage - 1) * registrosPorPagina, currentPage * registrosPorPagina)
              .map((reg, index) => (
                <tr key={reg.id} className={index % 2 === 0 ? 'line-bg-white-600' : 'line-bg-gray-100'}>
                  <td className="px-4 py-2">{reg.user?.name}</td>
                  <td className="px-4 py-2">{reg.data}</td>
                  <td className="px-4 py-2">{reg.cliente?.nome ?? '-'}</td>
                  <td className="px-4 py-2">{reg.obra?.nome ?? '-'}</td>
                  <td className="px-4 py-2">{reg.metros_quadrados}</td>
                  <td className="px-4 py-2">
                    {reg.equipa?.map(e =>
                      e.user
                        ? `${e.user.name} (${e.user.empresa})`
                        : `ID ${(e.user as any)?.id ?? 'N/A'}`
                    ).join(', ')}
                  </td>
                  <td className="px-4 py-2">
                    {['preparacao', 'bruto', 'colagem', 'acabamento', 'serragem']
                      .filter((campo) => (reg as any)[campo]) // workaround temporário se quiser
                      .map((campo) => campo[0].toUpperCase() + campo.slice(1))
                      .join(', ')
                    }
                  </td>
                  <td className="px-4 py-2 whitespace-pre-wrap">
                    {renderIntervencoes(reg)}
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
            )} */}
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center text-gray-500">
                  Nenhum registo encontrado
                </td>
              </tr>
            ) : (
              pageItems.map((reg, index) => {

                const isMoto = reg.origem != null && reg.origem != '';

                const baseRowClass =
                  index % 2 === 0 ? 'line-bg-white-600' : 'line-bg-gray-100';

                const rowClass = isMoto
                  ? `${baseRowClass} line-motorista-overlay`
                  : baseRowClass;

                return (
                  <tr key={reg.id} className={rowClass}>
                    <td className="px-4 py-2">
                      {reg.user?.name}
                      {reg.double_journey_lider && (
                        <strong className="block text-amber-700">[Double Journey]</strong>
                      )}
                    </td>
                    <td className="px-4 py-2">{reg.data}</td>
                    <td className="px-4 py-2">{reg.cliente?.nome ?? '-'}</td>
                    <td className="px-4 py-2">{reg.obra?.nome ?? '-'}</td>
                    <td className="px-4 py-2">{reg.metros_quadrados}</td>

                    <td className="px-4 py-2">
                      {reg.equipa?.map((e, i) => {
                        const label = e.user
                          ? `${e.user.name} (${e.user.empresa})`
                          : `ID ${(e.user as any)?.id ?? 'N/A'}`;

                        return (
                          <span key={e.user?.id ?? i}>
                            {i > 0 && ', '}
                            {label}
                            {e.intemperie && <strong> [Intempérie]</strong>}
                            {e.double_journey && <strong className="text-amber-700"> [Double Journey]</strong>}
                          </span>
                        );
                      })}
                    </td>

                    <td className="px-4 py-2">
                      {[
                        'preparacao',
                        'bruto',
                        'colagem',
                        'acabamento',
                        'serragem',
                        'coli',
                        'optipav'
                      ]
                        .filter((campo) => (reg as any)[campo])
                        .map((campo) => {
                          const nomes: Record<string, string> = {
                            preparacao: 'Preparação',
                            bruto: 'Bruto',
                            colagem: 'Colagem',
                            acabamento: 'Acabamento',
                            serragem: 'Serragem',
                            coli: 'Coli',
                            optipav: 'Optipav',
                          };

                          return nomes[campo];
                        })
                        .join(', ')}
                    </td>

                    <td className="px-4 py-2 whitespace-pre-wrap">
                      {renderIntervencoes(reg)}
                    </td>

                    <td className="px-4 py-2 text-[11px] leading-snug text-gray-700">
                      {reg.modificado_por ? (
                        getUserNameById(reg.modificado_por, usuarios)
                      ) : (
                        <span className="text-gray-400 italic">—</span>
                      )}
                    </td>

                    <td className="px-4 py-2 text-[11px] leading-snug text-gray-600">
                      {reg.modificado_em ? (
                        formatDateTime(reg.modificado_em)
                      ) : (
                        <span className="text-gray-400 italic">—</span>
                      )}
                    </td>

                    <td className="px-4 py-2 space-x-2" style={{ float: 'right' }}>
                      <Button
                        className="px-3 py-1 btn-bg-blue-500 text-white rounded hover:bg-yellow-600 text-sm"
                        variant="outline"
                        onClick={() => handleEditClick(reg)}
                      >
                        Editar
                      </Button>

                      {!isOperadorOuMotorista && (
                        <Button
                          className="px-3 py-1 btn-bg-red-500 text-white rounded hover:bg-yellow-600 text-sm"
                          variant="destructive"
                          onClick={() => handleDelete(reg.id)}
                        >
                          Excluir
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })
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

export default RegistroHoras;
