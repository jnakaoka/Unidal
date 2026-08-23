import api from "@/services/api";

import type {
  AssociacaoCreate,
  AssociacaoFiltros,
  Cartao,
  CartaoCreate,
  CartaoUpdate,
  CartaoVeiculoAssociacao,
  EstadoCartao,
  TipoCartao,
  TransferenciaCreate,
  Veiculo,
  VeiculoCreate,
  VeiculoUpdate,
  Condutor,
  CondutorAssociacaoCreate,
  CondutorAssociacaoFiltros,
  CondutorTransferenciaCreate,
  VeiculoCondutorAssociacao,
} from "@/types/cartao";


export async function listarVeiculos(
  ativo?: boolean,
): Promise<Veiculo[]> {
  const response = await api.get<Veiculo[]>(
    "/veiculos/",
    {
      params: {
        ativo,
      },
    },
  );

  return response.data;
}


export async function criarVeiculo(
  payload: VeiculoCreate,
): Promise<Veiculo> {
  const response = await api.post<Veiculo>(
    "/veiculos/",
    payload,
  );

  return response.data;
}


export async function atualizarVeiculo(
  veiculoId: number,
  payload: VeiculoUpdate,
): Promise<Veiculo> {
  const response = await api.put<Veiculo>(
    `/veiculos/${veiculoId}`,
    payload,
  );

  return response.data;
}


export async function listarCartoes(
  tipo?: TipoCartao,
  estado?: EstadoCartao,
): Promise<Cartao[]> {
  const response = await api.get<Cartao[]>(
    "/cartoes/",
    {
      params: {
        tipo,
        estado,
      },
    },
  );

  return response.data;
}


export async function criarCartao(
  payload: CartaoCreate,
): Promise<Cartao> {
  const response = await api.post<Cartao>(
    "/cartoes/",
    payload,
  );

  return response.data;
}


export async function atualizarCartao(
  cartaoId: number,
  payload: CartaoUpdate,
): Promise<Cartao> {
  const response = await api.put<Cartao>(
    `/cartoes/${cartaoId}`,
    payload,
  );

  return response.data;
}


export async function listarAssociacoes(
  filtros: AssociacaoFiltros = {},
): Promise<CartaoVeiculoAssociacao[]> {
  const response = await api.get<
    CartaoVeiculoAssociacao[]
  >(
    "/cartao-veiculo-associacoes/",
    {
      params: filtros,
    },
  );

  return response.data;
}


export async function obterAssociacaoAtiva(
  cartaoId: number,
): Promise<CartaoVeiculoAssociacao> {
  const response = await api.get<
    CartaoVeiculoAssociacao
  >(
    (
      "/cartao-veiculo-associacoes/"
      + `cartoes/${cartaoId}/ativa`
    ),
  );

  return response.data;
}


export async function obterHistoricoCartao(
  cartaoId: number,
): Promise<CartaoVeiculoAssociacao[]> {
  const response = await api.get<
    CartaoVeiculoAssociacao[]
  >(
    (
      "/cartao-veiculo-associacoes/"
      + `cartoes/${cartaoId}/historico`
    ),
  );

  return response.data;
}


export async function associarCartao(
  payload: AssociacaoCreate,
): Promise<CartaoVeiculoAssociacao> {
  const response = await api.post<
    CartaoVeiculoAssociacao
  >(
    "/cartao-veiculo-associacoes/",
    payload,
  );

  return response.data;
}


export async function transferirCartao(
  cartaoId: number,
  payload: TransferenciaCreate,
): Promise<CartaoVeiculoAssociacao> {
  const response = await api.post<
    CartaoVeiculoAssociacao
  >(
    (
      "/cartao-veiculo-associacoes/"
      + `cartoes/${cartaoId}/transferir`
    ),
    payload,
  );

  return response.data;
}


export async function desassociarCartao(
  cartaoId: number,
): Promise<CartaoVeiculoAssociacao> {
  const response = await api.post<
    CartaoVeiculoAssociacao
  >(
    (
      "/cartao-veiculo-associacoes/"
      + `cartoes/${cartaoId}/desassociar`
    ),
  );

  return response.data;
}

export async function listarCondutores(): Promise<
  Condutor[]
> {
  const response = await api.get<Condutor[]>("/users/");

  return response.data.filter(
    (utilizador) => (
      utilizador.is_active
      && utilizador.e_condutor
    ),
  );
}


export async function listarAssociacoesCondutores(
  filtros: CondutorAssociacaoFiltros = {},
): Promise<VeiculoCondutorAssociacao[]> {
  const response = await api.get<
    VeiculoCondutorAssociacao[]
  >(
    "/veiculo-condutor-associacoes/",
    {
      params: filtros,
    },
  );

  return response.data;
}


export async function associarCondutor(
  payload: CondutorAssociacaoCreate,
): Promise<VeiculoCondutorAssociacao> {
  const response = await api.post<
    VeiculoCondutorAssociacao
  >(
    "/veiculo-condutor-associacoes/",
    payload,
  );

  return response.data;
}


export async function transferirCondutor(
  condutorId: number,
  payload: CondutorTransferenciaCreate,
): Promise<VeiculoCondutorAssociacao> {
  const response = await api.post<
    VeiculoCondutorAssociacao
  >(
    (
      "/veiculo-condutor-associacoes/"
      + `condutores/${condutorId}/transferir`
    ),
    payload,
  );

  return response.data;
}


export async function desassociarCondutor(
  veiculoId: number,
): Promise<VeiculoCondutorAssociacao> {
  const response = await api.post<
    VeiculoCondutorAssociacao
  >(
    (
      "/veiculo-condutor-associacoes/"
      + `veiculos/${veiculoId}/desassociar`
    ),
  );

  return response.data;
}


export async function obterHistoricoCondutoresVeiculo(
  veiculoId: number,
): Promise<VeiculoCondutorAssociacao[]> {
  const response = await api.get<
    VeiculoCondutorAssociacao[]
  >(
    (
      "/veiculo-condutor-associacoes/"
      + `veiculos/${veiculoId}/historico`
    ),
  );

  return response.data;
}


export async function obterHistoricoVeiculosCondutor(
  condutorId: number,
): Promise<VeiculoCondutorAssociacao[]> {
  const response = await api.get<
    VeiculoCondutorAssociacao[]
  >(
    (
      "/veiculo-condutor-associacoes/"
      + `condutores/${condutorId}/historico`
    ),
  );

  return response.data;
}