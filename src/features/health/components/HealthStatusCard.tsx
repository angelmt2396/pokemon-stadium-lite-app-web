import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function HealthStatusCard() {
  const { t } = useTranslation('home');

  return (
    <Card className="game-frame space-y-4 border-slate-950/8 bg-white/90">
      <StatusBadge label={t('health.badge')} tone="info" />
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{t('health.title')}</h3>
        <p className="text-sm text-slate-500">{t('health.description')}</p>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-500" />
          <div className="h-2 flex-1 rounded-full bg-emerald-100">
            <div className="h-2 w-[78%] rounded-full bg-emerald-500" />
          </div>
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
            <span className="text-slate-500">Server</span>
            <span className="font-semibold text-ink">Ready</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
            <span className="text-slate-500">Socket</span>
            <span className="font-semibold text-ink">Idle</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
