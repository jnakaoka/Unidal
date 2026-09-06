export function normalizarTextoBusca(valor: unknown): string {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt");
}

export function contemTextoBusca(valor: unknown, termo: unknown): boolean {
  const termoNormalizado = normalizarTextoBusca(termo);
  return !termoNormalizado
    || normalizarTextoBusca(valor).includes(termoNormalizado);
}
