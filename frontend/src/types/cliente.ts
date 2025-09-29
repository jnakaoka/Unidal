// src/types/cliente.ts

/** Entidade Cliente retornada pelo backend */
export interface Cliente {
  id: number;
  nome: string;
  is_active: boolean;
}

/** Payload para criar cliente */
export type ClienteCreate = {
  nome: string;
  is_active?: boolean; // default no backend pode ser true
};

/** Payload para atualizar cliente */
export type ClienteUpdate = Partial<Omit<Cliente, "id">>;

/** Filtros opcionais para listagem */
export type ClienteFilters = {
  q?: string;         // busca por nome (se existir no backend)
  is_active?: boolean;
};
