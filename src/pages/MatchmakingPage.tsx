import { useTranslation } from 'react-i18next';
import { PageIntro } from '@/components/common/PageIntro';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useSession } from '@/features/session/context/SessionContext';

export function MatchmakingPage() {
  const { t } = useTranslation('matchmaking');
  const { session } = useSession();

  return (
    <AppShell>
      <PageIntro eyebrow={t('eyebrow')} title={t('title')} description={t('description')} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="space-y-5">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{t('session.title')}</h3>
            <p className="text-sm leading-6 text-slate-600">{t('session.description')}</p>
          </div>
          <div className="rounded-[1.5rem] bg-slate-50 p-4 text-sm text-slate-700 ring-1 ring-slate-200">
            <p className="font-semibold text-ink">{session?.nickname}</p>
            <p className="mt-1">{t('session.note')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button>{t('actions.search')}</Button>
            <Button variant="secondary">{t('actions.cancel')}</Button>
          </div>
        </Card>
        <Card className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold">{t('status.title')}</h3>
            <StatusBadge label={t('status.badge')} tone="neutral" />
          </div>
          <ul className="space-y-2 text-sm leading-6 text-slate-600">
            <li>{t('status.itemOne')}</li>
            <li>{t('status.itemTwo')}</li>
            <li>{t('status.itemThree')}</li>
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
