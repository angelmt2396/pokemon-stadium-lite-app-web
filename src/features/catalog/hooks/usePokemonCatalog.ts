import { useQuery } from '@tanstack/react-query';
import { getPokemonCatalog, getPokemonDetail } from '@/features/catalog/api/catalog-api';

export function usePokemonCatalog() {
  return useQuery({
    queryKey: ['pokemon-catalog'],
    queryFn: getPokemonCatalog,
    staleTime: 5 * 60_000,
  });
}

export function usePokemonDetail(id: number | null) {
  return useQuery({
    queryKey: ['pokemon-detail', id],
    queryFn: () => getPokemonDetail(id as number),
    enabled: id !== null,
    staleTime: 5 * 60_000,
  });
}

