export type AbaControleCartoes =
  | "resumo"
  | "associacoes"
  | "cartoes"
  | "veiculos"
  | "condutores"
  | "historico";

export type AbaDestinoResumo =
  | "associacoes"
  | "cartoes"
  | "veiculos"
  | "condutores";

export type FiltroContextualCartoes =
  | "todos"
  | "disponiveis"
  | "em_utilizacao"
  | "atencao"
  | "sem_cartao"
  | "sem_condutor";

export interface NavegacaoResumo {
  aba: AbaDestinoResumo;
  filtro: FiltroContextualCartoes;
}