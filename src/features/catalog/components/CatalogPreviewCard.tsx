import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { usePokemonCatalog } from '@/features/catalog/hooks/usePokemonCatalog';

function formatPokemonId(id: number) {
  return `#${id.toString().padStart(3, '0')}`;
}

export function CatalogPreviewCard() {
  const { t } = useTranslation('catalog');
  const { data: catalog, isLoading } = usePokemonCatalog();
  const featuredPokemon = catalog?.slice(0, 3) ?? [];
  const firstPokemon = featuredPokemon[0];
  const totalPokemon = catalog?.length ?? 0;

  return (
    <Link
      to="/catalog"
      className="menu-tile group flex h-full flex-col gap-5 bg-[radial-gradient(circle_at_top_left,_rgba(255,218,120,0.28),_transparent_34%),linear-gradient(180deg,_rgba(255,255,255,0.94),_rgba(255,251,240,0.9))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
    >
      <div className="absolute right-4 top-4 rounded-full bg-slate-950 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white">
        Dex
      </div>
      <div className="absolute bottom-8 right-8 h-24 w-24 rounded-full bg-amber-200/40 blur-2xl" />

      <div className="relative space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t('preview.kicker')}</p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black tracking-tight">{t('preview.title')}</h3>
            <p className="text-sm text-slate-500">{t('preview.description')}</p>
          </div>
          <div className="rounded-full border border-amber-200/80 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700 shadow-[0_8px_18px_rgba(217,119,6,0.12)]">
            {isLoading ? t('preview.statusLoading') : `${totalPokemon} ${t('preview.badge')}`}
          </div>
        </div>
      </div>

      <div className="relative grid gap-4 rounded-[1.75rem] border border-amber-100/80 bg-white/72 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">{t('preview.rosterTitle')}</p>
            <p className="mt-1 max-w-xs text-sm leading-6 text-slate-500">{t('preview.rosterDescription')}</p>
          </div>
          <div className="min-w-[6rem] rounded-[1.25rem] border border-amber-100/80 bg-amber-50/70 px-4 py-3 text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">{t('preview.totalLabel')}</p>
            <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">{isLoading ? '--' : totalPokemon}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-[1.5rem] border border-white/80 bg-white/80 p-4">
                <div className="h-20 rounded-[1.25rem] bg-slate-100" />
                <div className="mt-3 h-3 w-14 rounded-full bg-slate-100" />
                <div className="mt-2 h-5 w-20 rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        ) : featuredPokemon.length ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {featuredPokemon.map((pokemon) => (
              <div
                key={pokemon.id}
                className="rounded-[1.5rem] border border-white/90 bg-white/84 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition duration-300 group-hover:-translate-y-0.5"
              >
                <div className="flex h-20 items-center justify-center rounded-[1.1rem] bg-[radial-gradient(circle_at_top,_rgba(255,236,181,0.95),_rgba(255,255,255,0.92)_58%)]">
                  <img alt={pokemon.name} className="h-16 w-16 object-contain drop-shadow-[0_10px_12px_rgba(15,23,42,0.16)]" src={pokemon.sprite} />
                </div>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{formatPokemonId(pokemon.id)}</p>
                <p className="mt-1 text-base font-bold capitalize text-ink">{pokemon.name}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-amber-200 bg-white/72 px-4 py-8 text-center text-sm text-slate-500">
            {t('preview.statusEmpty')}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="rounded-[1.35rem] border border-white/90 bg-white/78 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{t('preview.scanLabel')}</p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {firstPokemon ? `${formatPokemonId(firstPokemon.id)} ${firstPokemon.name}` : t('preview.statusEmpty')}
            </p>
          </div>
          <div className="rounded-[1.35rem] border border-white/90 bg-white/78 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{t('preview.featuredLabel')}</p>
            <div className="mt-2 flex items-center justify-end -space-x-3">
              {featuredPokemon.map((pokemon) => (
                <div
                  key={pokemon.id}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[linear-gradient(180deg,_#fff7d9,_#fff)] shadow-[0_8px_18px_rgba(15,23,42,0.08)]"
                >
                  <img alt="" aria-hidden="true" className="h-7 w-7 object-contain" src={pokemon.sprite} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between rounded-[1.45rem] border border-slate-950/8 bg-white/88 px-4 py-3 shadow-[0_16px_28px_rgba(15,23,42,0.08)]">
        <div>
          <p className="text-sm font-black text-ink">{t('preview.cta')}</p>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{t('preview.description')}</p>
        </div>
        <span className="rounded-full bg-slate-950 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition duration-300 group-hover:translate-x-1">
          {t('preview.pillLabel')}
        </span>
      </div>
    </Link>
  );
}
