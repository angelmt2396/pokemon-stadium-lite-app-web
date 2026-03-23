import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useHealthStatus } from '@/features/health/hooks/useHealthStatus';

export function HealthStatusCard() {
  const { t } = useTranslation('home');
  const { isLoading, isError } = useHealthStatus();

  const tone = isError ? 'warning' : 'success';
  const badgeLabel = isLoading
    ? t('health.loading')
    : isError
      ? t('health.error')
      : t('health.ready');
  const title = isLoading
    ? t('health.playerLoadingTitle')
    : isError
      ? t('health.playerErrorTitle')
      : t('health.playerReadyTitle');
  const description = isLoading
    ? t('health.playerLoadingDescription')
    : isError
      ? t('health.playerErrorDescription')
      : t('health.playerReadyDescription');

  return (
    <Card className="game-frame relative overflow-hidden border-slate-950/8 bg-white/90 p-4 md:p-5">
      <div className="absolute -right-4 top-3 h-20 w-20 rounded-full border border-emerald-200/70" />
      <div className={`absolute right-8 top-8 h-2.5 w-2.5 rounded-full ${isError ? 'bg-amber-500' : 'bg-emerald-500'} shadow-[0_0_18px_currentColor]`} />

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <StatusBadge label={badgeLabel} tone={tone} />
          <h3 className="text-lg font-semibold">{t('health.title')}</h3>
        </div>
        <div className={`rounded-[1rem] border px-3 py-2 text-left sm:text-right ${isError ? 'border-amber-200 bg-amber-50/70' : 'border-emerald-200 bg-emerald-50/70'}`}>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${isError ? 'text-amber-700' : 'text-emerald-700'}`}>
            {t('health.statusLabel')}
          </p>
          <p className="mt-1 text-lg font-black tracking-tight text-slate-950">
            {isLoading ? t('health.loading') : isError ? t('health.error') : t('health.ready')}
          </p>
        </div>
      </div>

      <div className="relative mt-4 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${isError ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          <div className={`h-2 flex-1 rounded-full ${isError ? 'bg-amber-100' : 'bg-emerald-100'}`}>
            <div className={`h-2 w-[78%] rounded-full ${isError ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          </div>
        </div>
        <div className="rounded-[1rem] border border-slate-200/80 bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{t('health.statusLabel')}</p>
          <p className="mt-2 text-[1.35rem] font-black tracking-tight text-ink">{title}</p>
          {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
        </div>
      </div>
    </Card>
  );
}
