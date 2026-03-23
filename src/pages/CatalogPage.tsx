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
      <section className="grid gap-4 md:gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="order-2 game-frame border-slate-900/8 bg-white/90 p-3.5 sm:p-4 md:order-1 md:p-5">
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 md:gap-4 xl:grid-cols-3">
              {Array.from({ length: 9 }).map((_, index) => (
                <div key={index} className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-3.5 md:rounded-[1.75rem] md:p-4">
                  <div className="h-28 rounded-[1.15rem] bg-white md:h-32 md:rounded-[1.25rem]" />
                  <div className="mt-4 h-4 w-16 rounded-full bg-white" />
                  <div className="mt-3 h-6 w-24 rounded-full bg-white" />
                </div>
              ))}
            </div>
          ) : null}

          {isError ? (
            <div className="flex min-h-[300px] items-center justify-center rounded-[1.5rem] bg-slate-50 p-5 text-center text-sm text-slate-500 md:min-h-[420px] md:rounded-[1.75rem] md:p-6">
              {t('states.error')}
            </div>
          ) : null}

          {!isLoading && !isError && !hasCatalog ? (
            <div className="flex min-h-[300px] items-center justify-center rounded-[1.5rem] bg-slate-50 p-5 text-center text-sm text-slate-500 md:min-h-[420px] md:rounded-[1.75rem] md:p-6">
              {t('states.empty')}
            </div>
          ) : null}

          {hasCatalog ? (
            <div className="grid gap-3 sm:grid-cols-2 md:gap-4 xl:grid-cols-3">
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

        <div className="order-1 md:order-2">
          <PokemonDetailPanel loading={detailLoading} pokemon={pokemonDetail ?? null} />
        </div>
      </section>
    </AppShell>
  );
}
