import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function NotFoundPage() {
  const { t } = useTranslation('common');

  return (
    <AppShell>
      <Card className="mx-auto max-w-xl space-y-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">404</p>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">{t('notFound.title')}</h2>
          <p className="text-sm leading-6 text-slate-600">{t('notFound.description')}</p>
        </div>
        <div className="flex justify-center">
          <Link to="/">
            <Button>{t('notFound.action')}</Button>
          </Link>
        </div>
      </Card>
    </AppShell>
  );
}
