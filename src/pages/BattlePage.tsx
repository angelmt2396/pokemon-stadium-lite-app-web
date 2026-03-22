import { useTranslation } from 'react-i18next';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useSession } from '@/features/session/context/SessionContext';

export function BattlePage() {
  const { t } = useTranslation('battle');
  const { session } = useSession();

  return (
    <AppShell>
      <section className="mb-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="game-frame relative overflow-hidden px-6 py-7 md:px-8 md:py-8">
          <div className="absolute right-[-18px] top-[-18px] h-28 w-28 rounded-full border border-white/20 bg-white/8" />
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge label={t('lobby.badge')} tone="warning" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {t('lobby.player', { nickname: session?.nickname ?? 'Trainer' })}
              </span>
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-black tracking-tight md:text-5xl">{t('lobby.title')}</h2>
              <p className="max-w-2xl text-base text-slate-600 md:text-lg">{t('lobby.description')}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button className="rounded-2xl px-6 py-3 text-base font-bold">{t('lobby.primaryAction')}</Button>
              <Button variant="secondary" className="rounded-2xl px-6 py-3 text-base font-bold">
                {t('lobby.secondaryAction')}
              </Button>
            </div>
          </div>
        </div>

        <Card className="game-frame space-y-4 border-slate-950/8 bg-white/90">
          <StatusBadge label={t('status.badge')} tone="info" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{t('status.title')}</h3>
            <p className="text-sm text-slate-500">{t('status.description')}</p>
          </div>
          <div className="space-y-3">
            <div className="h-3 rounded-full bg-slate-100">
              <div className="h-3 w-[26%] rounded-full bg-tide" />
            </div>
            <div className="grid gap-2">
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{t('status.stepOne')}</div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{t('status.stepTwo')}</div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{t('status.stepThree')}</div>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="game-frame border-slate-950/8 bg-[linear-gradient(160deg,_rgba(8,12,34,0.98),_rgba(19,30,61,0.92))] text-white">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">{t('arena.kicker')}</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight">{t('arena.title')}</h3>
            </div>
            <StatusBadge label={t('arena.turnBadge')} tone="info" className="bg-white/10 text-white" />
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div className="rounded-[1.75rem] bg-white/6 p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-white/45">{t('arena.playerOne')}</p>
              <h4 className="mt-2 text-2xl font-bold">{t('arena.playerOnePokemon')}</h4>
              <div className="mt-4 h-3 rounded-full bg-white/10">
                <div className="h-3 w-[74%] rounded-full bg-emerald-400" />
              </div>
            </div>
            <div className="flex justify-center">
              <div className="rounded-full border border-white/12 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-white/65">
                VS
              </div>
            </div>
            <div className="rounded-[1.75rem] bg-white/8 p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-white/45">{t('arena.playerTwo')}</p>
              <h4 className="mt-2 text-2xl font-bold">{t('arena.playerTwoPokemon')}</h4>
              <div className="mt-4 h-3 rounded-full bg-white/10">
                <div className="h-3 w-[54%] rounded-full bg-amber-300" />
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-6">
          <Card className="game-frame border-slate-950/8 bg-white/90">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t('team.title')}</h3>
              <Button variant="secondary" className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em]">
                {t('team.action')}
              </Button>
            </div>
            <div className="grid gap-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700">Squirtle</div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700">Venusaur</div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700">Wartortle</div>
            </div>
          </Card>

          <Card className="game-frame border-slate-950/8 bg-white/90">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t('log.title')}</h3>
              <StatusBadge label={t('log.badge')} tone="neutral" />
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{t('log.itemOne')}</div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{t('log.itemTwo')}</div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{t('log.itemThree')}</div>
            </div>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
