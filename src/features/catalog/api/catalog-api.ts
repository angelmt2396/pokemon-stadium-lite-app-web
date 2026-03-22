import { apiRequest } from '@/lib/api/client';
import type { PokemonDetail, PokemonListItem } from '@/features/catalog/types';

export function getPokemonCatalog() {
  return apiRequest<PokemonListItem[]>('/api/v1/pokemon');
}

export function getPokemonDetail(id: number) {
  return apiRequest<PokemonDetail>(`/api/v1/pokemon/${id}`);
}

