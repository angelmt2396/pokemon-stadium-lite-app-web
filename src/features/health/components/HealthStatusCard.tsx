import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useHealthStatus } from '@/features/health/hooks/useHealthStatus';

export function HealthStatusCard() {
  const { t } = useTranslation('home');
  const { data, isLoading, isError } = useHealthStatus();

  const tone = isError ? 'warning' : data?.status === 'ok' ? 'success' : 'neutral';
  const badgeLabel = isLoading
    ? t('health.loading')
    : isError
      ? t('health.error')
      : t('health.ready');

  return (
    <Card className="game-frame space-y-4 border-slate-950/8 bg-white/90">
      <StatusBadge label={badgeLabel} tone={tone} />
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{t('health.title')}</h3>
        <p className="text-sm text-slate-500">
          {isLoading ? t('health.descriptionLoading') : isError ? t('health.descriptionError') : data?.service ?? t('health.description')}
        </p>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${isError ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          <div className={`h-2 flex-1 rounded-full ${isError ? 'bg-amber-100' : 'bg-emerald-100'}`}>
            <div className={`h-2 w-[78%] rounded-full ${isError ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          </div>
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
            <span className="text-slate-500">Server</span>
            <span className="font-semibold text-ink">
              {isLoading ? t('health.loading') : isError ? t('health.error') : data?.status ?? t('health.ready')}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
            <span className="text-slate-500">{t('health.serviceLabel')}</span>
            <span className="font-semibold text-ink">{data?.service ?? t('health.serviceFallback')}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
