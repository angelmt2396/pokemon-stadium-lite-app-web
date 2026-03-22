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
      <section className="mb-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="game-frame relative overflow-hidden px-6 py-6 md:px-8 md:py-7">
          <div className="absolute right-[-24px] top-[-24px] h-28 w-28 rounded-full border border-slate-200/80 bg-white/35" />
          <div className="absolute bottom-[-36px] left-1/3 h-24 w-24 rounded-full bg-amber-200/25 blur-2xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ember">{t('eyebrow')}</p>
              <h2 className="text-4xl font-black tracking-tight md:text-5xl">{t('title')}</h2>
              {t('description') ? <p className="max-w-xl text-base text-slate-600 md:text-lg">{t('description')}</p> : null}
            </div>

            <div className="w-full max-w-xl rounded-[1.7rem] border border-white/80 bg-white/72 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{t('actions.live')}</p>
                  <p className="mt-2 text-2xl font-black capitalize tracking-tight text-ink">{session?.nickname ?? t('hero.trainerFallback')}</p>
                  <p className="mt-1 text-sm text-slate-500">{hasResume ? t('resume.title') : t('health.description')}</p>
                </div>

                {hasResume ? (
                  <Link to="/battle">
                    <Button variant="secondary" className="px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em]">
                      {t('resume.cta')}
                    </Button>
                  </Link>
                ) : (
                  <div className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white">
                    {t('health.ready')}
                  </div>
                )}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.25rem] border border-white/80 bg-white/80 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{t('hero.lobbyLabel')}</p>
                  <p className="mt-2 truncate text-base font-bold text-ink">{session?.currentLobbyId ? session.currentLobbyId : t('hero.lobbyEmpty')}</p>
                </div>
                <div className="rounded-[1.25rem] border border-white/80 bg-white/80 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{t('hero.battleLabel')}</p>
                  <p className="mt-2 truncate text-base font-bold text-ink">{session?.currentBattleId ? session.currentBattleId : t('hero.battleEmpty')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <HealthStatusCard />
      </section>
      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <CatalogPreviewCard />
        <BattlePreviewCard />
      </section>
    </AppShell>
  );
}
