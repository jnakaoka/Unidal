export type TipoVeiculo =
  | "carrinha"
  | "camiao"
  | "automovel"
  | "outro";

export type TipoCartao =
  | "bancario"
  | "combustivel"
  | "via_verde"
  | "outro";

export type EstadoCartao =
  | "ativo"
  | "bloqueado"
  | "perdido"
  | "cancelado"
  | "expirado";


export interface Veiculo {
  id: number;
  matricula: string;
  tipo: TipoVeiculo;
  descricao: string | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface VeiculoCreate {
  matricula: string;
  tipo: TipoVeiculo;
  descricao?: string | null;
}

export interface VeiculoUpdate {
  matricula?: string;
  tipo?: TipoVeiculo;
  descricao?: string | null;
  ativo?: boolean;
}


export interface Cartao {
  id: number;
  nome: string;
  identificador: string;
  tipo: TipoCartao;
  emissor: string | null;
  ultimos_quatro: string | null;
  validade_mes: number | null;
  validade_ano: number | null;
  estado: EstadoCartao;
  observacoes: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface CartaoCreate {
  nome: string;
  identificador: string;
  tipo: TipoCartao;
  emissor?: string | null;
  ultimos_quatro?: string | null;
  validade_mes?: number | null;
  validade_ano?: number | null;
  estado?: EstadoCartao;
  observacoes?: string | null;
}

export interface CartaoUpdate {
  nome?: string;
  identificador?: string;
  tipo?: TipoCartao;
  emissor?: string | null;
  ultimos_quatro?: string | null;
  validade_mes?: number | null;
  validade_ano?: number | null;
  estado?: EstadoCartao;
  observacoes?: string | null;
}


export interface CartaoResumo {
  id: number;
  nome: string;
  identificador: string;
  tipo: TipoCartao;
  estado: EstadoCartao;
}

export interface VeiculoResumo {
  id: number;
  matricula: string;
  tipo: TipoVeiculo;
  ativo: boolean;
}

export interface UsuarioResumo {
  id: number;
  name: string;
}

export interface CartaoVeiculoAssociacao {
  id: number;
  cartao_id: number;
  veiculo_id: number;
  associado_em: string;
  desassociado_em: string | null;
  associado_por_id: number;
  desassociado_por_id: number | null;
  observacoes: string | null;
  ativa: boolean;
  criado_em: string;
  atualizado_em: string;
  cartao: CartaoResumo;
  veiculo: VeiculoResumo;
  associado_por: UsuarioResumo;
  desassociado_por: UsuarioResumo | null;
}

export interface AssociacaoCreate {
  cartao_id: number;
  veiculo_id: number;
  observacoes?: string | null;
}

export interface TransferenciaCreate {
  veiculo_destino_id: number;
  observacoes?: string | null;
}

export interface AssociacaoFiltros {
  cartao_id?: number;
  veiculo_id?: number;
  ativa?: boolean;
}