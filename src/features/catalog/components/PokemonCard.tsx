import type { PokemonListItem } from '@/features/catalog/types';
import { cn } from '@/lib/utils/cn';

type PokemonCardProps = {
  pokemon: PokemonListItem;
  selected?: boolean;
  onSelect: (pokemonId: number) => void;
};

export function PokemonCard({ pokemon, selected = false, onSelect }: PokemonCardProps) {
  return (
    <button
      type="button"
      className={cn(
        'group rounded-[1.75rem] border border-slate-900/8 bg-white/90 p-4 text-left shadow-[0_18px_50px_rgba(16,24,40,0.12)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(16,24,40,0.16)]',
        selected ? 'ring-2 ring-tide' : '',
      )}
      onClick={() => onSelect(pokemon.id)}
    >
      <div className="flex items-center justify-center rounded-[1.25rem] bg-slate-50 p-4">
        <img alt={pokemon.name} className="h-24 w-24 object-contain" src={pokemon.sprite} />
      </div>
      <div className="mt-4 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">#{pokemon.id}</p>
        <h3 className="text-lg font-bold capitalize text-ink">{pokemon.name}</h3>
      </div>
    </button>
  );
}

