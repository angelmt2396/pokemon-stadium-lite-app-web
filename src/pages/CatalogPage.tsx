import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageIntro } from '@/components/common/PageIntro';
import { AppShell } from '@/components/layout/AppShell';
import { PokemonCard } from '@/features/catalog/components/PokemonCard';
import { PokemonDetailPanel } from '@/features/catalog/components/PokemonDetailPanel';
import { usePokemonCatalog, usePokemonDetail } from '@/features/catalog/hooks/usePokemonCatalog';

export function CatalogPage() {
  const { t } = useTranslation('catalog');
  const [selectedPokemonId, setSelectedPokemonId] = useState<number | null>(null);
  const { data: catalog, isLoading, isError } = usePokemonCatalog();
  const { data: pokemonDetail, isLoading: detailLoading } = usePokemonDetail(selectedPokemonId);

  const hasCatalog = (catalog?.length ?? 0) > 0;

  useEffect(() => {
    if (!selectedPokemonId && catalog?.length) {
      setSelectedPokemonId(catalog[0].id);
    }
  }, [catalog, selectedPokemonId]);

  return (
    <AppShell>
      <PageIntro eyebrow={t('eyebrow')} title={t('title')} description={t('description')} />
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="game-frame border-slate-900/8 bg-white/90 p-5">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 9 }).map((_, index) => (
                <div key={index} className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-4">
                  <div className="h-32 rounded-[1.25rem] bg-white" />
                  <div className="mt-4 h-4 w-16 rounded-full bg-white" />
                  <div className="mt-3 h-6 w-24 rounded-full bg-white" />
                </div>
              ))}
            </div>
          ) : null}

          {isError ? (
            <div className="flex min-h-[420px] items-center justify-center rounded-[1.75rem] bg-slate-50 p-6 text-sm text-slate-500">
              {t('states.error')}
            </div>
          ) : null}

          {!isLoading && !isError && !hasCatalog ? (
            <div className="flex min-h-[420px] items-center justify-center rounded-[1.75rem] bg-slate-50 p-6 text-sm text-slate-500">
              {t('states.empty')}
            </div>
          ) : null}

          {hasCatalog ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {catalog?.map((pokemon) => (
                <PokemonCard
                  key={pokemon.id}
                  pokemon={pokemon}
                  selected={selectedPokemonId === pokemon.id}
                  onSelect={setSelectedPokemonId}
                />
              ))}
            </div>
          ) : null}
        </div>

        <PokemonDetailPanel loading={detailLoading} pokemon={pokemonDetail ?? null} />
      </section>
    </AppShell>
  );
}
