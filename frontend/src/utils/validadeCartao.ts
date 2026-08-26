export type SituacaoValidadeCartao =
  | "sem_validade"
  | "expirado"
  | "vence_em_breve"
  | "regular";

interface DadosValidadeCartao {
  validade_mes: number | null;
  validade_ano: number | null;
}

export function obterSituacaoValidadeCartao(
  cartao: DadosValidadeCartao,
  agora = new Date(),
): SituacaoValidadeCartao {
  if (
    cartao.validade_mes === null
    || cartao.validade_ano === null
  ) {
    return "sem_validade";
  }

  const mesAtual = agora.getMonth() + 1;
  const anoAtual = agora.getFullYear();

  const mesesAteValidade = (
    (cartao.validade_ano - anoAtual) * 12
    + cartao.validade_mes
    - mesAtual
  );

  if (mesesAteValidade < 0) {
    return "expirado";
  }

  if (mesesAteValidade <= 2) {
    return "vence_em_breve";
  }

  return "regular";
}

export function formatarValidadeCartao(
  cartao: DadosValidadeCartao,
): string {
  if (
    cartao.validade_mes === null
    || cartao.validade_ano === null
  ) {
    return "—";
  }

  return (
    String(cartao.validade_mes).padStart(2, "0")
    + `/${cartao.validade_ano}`
  );
}