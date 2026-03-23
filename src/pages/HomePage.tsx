import { useTranslation } from 'react-i18next';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { BattlePreviewCard } from '@/features/battle/components/BattlePreviewCard';
import { CatalogPreviewCard } from '@/features/catalog/components/CatalogPreviewCard';
import { HealthStatusCard } from '@/features/health/components/HealthStatusCard';
import { useSession } from '@/features/session/context/SessionContext';
import { Link } from 'react-router-dom';

export function HomePage() {
  const { t } = useTranslation('home');
  const { session } = useSession();
  const hasResume = Boolean(session?.currentLobbyId || session?.currentBattleId);

  return (
    <AppShell>
      <section className="mb-6 grid gap-4 md:mb-8 md:gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="game-frame relative overflow-hidden px-4 py-4 md:px-7 md:py-6">
          <div className="absolute right-[-24px] top-[-24px] h-28 w-28 rounded-full border border-slate-200/80 bg-white/35" />
          <div className="absolute bottom-[-36px] left-1/3 h-24 w-24 rounded-full bg-amber-200/25 blur-2xl" />

          <div className="relative flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(280px,0.78fr)_minmax(420px,1fr)] lg:items-start lg:gap-8">
            <div className="max-w-[34rem] space-y-2 md:space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ember">{t('eyebrow')}</p>
              <h2 className="max-w-[8ch] text-[2.15rem] font-black tracking-tight leading-[0.96] md:text-[2.85rem] md:leading-[1] xl:text-[3.1rem]">
                {t('title')}
              </h2>
              {t('description') ? <p className="max-w-xl text-sm text-slate-600 md:text-lg">{t('description')}</p> : null}
            </div>

            <div className="w-full rounded-[1.2rem] border border-white/80 bg-white/72 p-0 shadow-[0_14px_30px_rgba(15,23,42,0.07)] backdrop-blur md:rounded-[1.65rem]">
              <div className="flex items-start justify-between gap-3 px-3.5 py-3 md:px-5 md:py-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{t('actions.live')}</p>
                  <p className="mt-1 truncate text-[1.22rem] font-black capitalize tracking-tight text-ink md:mt-2 md:text-2xl">
                    {session?.nickname ?? t('hero.trainerFallback')}
                  </p>
                  <p className="mt-1 text-[13px] text-slate-500 md:text-sm">{hasResume ? t('resume.title') : t('health.description')}</p>
                </div>

                {hasResume ? (
                  <Link className="shrink-0" to="/battle">
                    <Button variant="secondary" className="min-h-8 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] md:min-h-10 md:px-4 md:py-2 md:text-[11px]">
                      {t('resume.cta')}
                    </Button>
                  </Link>
                ) : (
                  <div className="inline-flex shrink-0 rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white md:px-3 md:text-[11px]">
                    {t('health.ready')}
                  </div>
                )}
              </div>

              <div className="grid border-t border-white/80 md:grid-cols-2">
                <div className="px-3.5 py-2.5 md:border-r md:border-white/80 md:px-5 md:py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{t('hero.lobbyLabel')}</p>
                  <p className="mt-1 truncate text-[0.95rem] font-bold tracking-tight text-ink md:mt-2 md:text-xl md:font-black">
                    {session?.currentLobbyId ? session.currentLobbyId : t('hero.lobbyEmpty')}
                  </p>
                </div>
                <div className="border-t border-white/80 px-3.5 py-2.5 md:border-t-0 md:px-5 md:py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{t('hero.battleLabel')}</p>
                  <p className="mt-1 truncate text-[0.95rem] font-bold tracking-tight text-ink md:mt-2 md:text-xl md:font-black">
                    {session?.currentBattleId ? session.currentBattleId : t('hero.battleEmpty')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <HealthStatusCard />
      </section>
      <section className="grid gap-4 md:gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <CatalogPreviewCard />
        <BattlePreviewCard />
      </section>
    </AppShell>
  );
}
