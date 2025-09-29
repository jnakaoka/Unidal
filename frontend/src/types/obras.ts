// src/types/obra.ts
import type { Cliente } from "./cliente";

/** Entidade Obra retornada pelo backend */
export interface Obra {
  id: number;
  nome: string;
  descricao?: string | null;
  cliente_id: number;

  /** Alguns endpoints podem embutir o cliente resumido */
  cliente?: Pick<Cliente, "id" | "nome"> | null;
}

/** Payload para criar obra */
export type ObraCreate = {
  nome: string;
  descricao?: string;
  cliente_id: number;
};

/** Payload para atualizar obra */
export type ObraUpdate = Partial<Omit<Obra, "id" | "cliente">>;

/** Filtros opcionais para listagem */
export type ObraFilters = {
  cliente_id?: number;
  q?: string; // busca por nome/descrição (se existir no backend)
};
