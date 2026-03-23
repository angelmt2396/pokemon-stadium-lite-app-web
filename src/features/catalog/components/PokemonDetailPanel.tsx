import type { PokemonDetail } from '@/features/catalog/types';
import { StatusBadge } from '@/components/ui/StatusBadge';

type PokemonDetailPanelProps = {
  pokemon: PokemonDetail | null;
  loading: boolean;
};

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}

export function PokemonDetailPanel({ pokemon, loading }: PokemonDetailPanelProps) {
  if (loading) {
    return (
      <div className="game-frame space-y-4 border-slate-900/8 bg-white/90 p-4 sm:p-5 md:p-6">
        <div className="h-5 w-28 rounded-full bg-slate-100" />
        <div className="h-40 rounded-[1.5rem] bg-slate-100 md:h-48 md:rounded-[1.75rem]" />
        <div className="space-y-3">
          <div className="h-12 rounded-2xl bg-slate-50" />
          <div className="h-12 rounded-2xl bg-slate-50" />
          <div className="h-12 rounded-2xl bg-slate-50" />
        </div>
      </div>
    );
  }

  if (!pokemon) {
    return (
      <div className="game-frame flex min-h-[240px] items-center justify-center border-slate-900/8 bg-white/90 p-5 text-center md:min-h-[420px] md:p-6">
        <p className="max-w-[18rem] text-sm leading-6 text-slate-500">Selecciona un Pokémon.</p>
      </div>
    );
  }

  return (
    <div className="game-frame space-y-4 border-slate-900/8 bg-white/90 p-4 sm:p-5 md:space-y-5 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">#{pokemon.id}</p>
          <h3 className="text-2xl font-black capitalize tracking-tight sm:text-3xl">{pokemon.name}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {pokemon.type.map((type) => (
            <StatusBadge key={type} label={type} tone="info" />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center rounded-[1.5rem] bg-slate-50 p-4 md:rounded-[1.75rem] md:p-6">
        <img alt={pokemon.name} className="h-32 w-32 object-contain sm:h-36 sm:w-36 md:h-40 md:w-40" src={pokemon.sprite} />
      </div>

      <div className="grid gap-3">
        <StatRow label="HP" value={pokemon.hp} />
        <StatRow label="Attack" value={pokemon.attack} />
        <StatRow label="Defense" value={pokemon.defense} />
        <StatRow label="Speed" value={pokemon.speed} />
      </div>
    </div>
  );
}
