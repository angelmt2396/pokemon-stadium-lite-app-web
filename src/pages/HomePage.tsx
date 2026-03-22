import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { BattlePreviewCard } from '@/features/battle/components/BattlePreviewCard';
import { CatalogPreviewCard } from '@/features/catalog/components/CatalogPreviewCard';
import { HealthStatusCard } from '@/features/health/components/HealthStatusCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useSession } from '@/features/session/context/SessionContext';

export function HomePage() {
  const { t } = useTranslation('home');
  const { session } = useSession();

  return (
    <AppShell>
      <section className="mb-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="game-frame relative overflow-hidden px-6 py-7 md:px-8 md:py-8">
          <div className="absolute right-[-30px] top-[-30px] h-36 w-36 rounded-full border border-slate-200/80 bg-white/40" />
          <div className="absolute bottom-[-40px] right-24 h-28 w-28 rounded-full bg-amber-200/30 blur-2xl" />
          <div className="relative space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ember">{t('eyebrow')}</p>
            <div className="space-y-2">
              <h2 className="text-4xl font-black tracking-tight md:text-5xl">{t('title')}</h2>
              <p className="max-w-xl text-base text-slate-600 md:text-lg">{t('description')}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/battle">
                <Button className="rounded-2xl px-6 py-3 text-base font-bold">{t('actions.primary')}</Button>
              </Link>
              <Link to="/catalog">
                <Button variant="secondary" className="rounded-2xl px-6 py-3 text-base font-bold">
                  {t('actions.secondary')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <HealthStatusCard />
      </section>
      {session?.currentLobbyId || session?.currentBattleId ? (
        <Card className="game-frame mb-8 flex items-center justify-between gap-4 border-slate-950/8 bg-white/90">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">{t('resume.title')}</h3>
            <p className="text-sm text-slate-500">{session.currentBattleId ? t('resume.battle') : t('resume.lobby')}</p>
          </div>
          <Link to="/battle">
            <Button variant="secondary">{t('resume.cta')}</Button>
          </Link>
        </Card>
      ) : null}
      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <CatalogPreviewCard />
        <BattlePreviewCard />
      </section>
    </AppShell>
  );
}
