import { useTranslation } from 'react-i18next';
import { PageIntro } from '@/components/common/PageIntro';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';

export function CatalogPage() {
  const { t } = useTranslation('catalog');

  return (
    <AppShell>
      <PageIntro eyebrow={t('eyebrow')} title={t('title')} description={t('description')} />
      <Card className="space-y-3">
        <h3 className="text-lg font-semibold">{t('placeholder.title')}</h3>
        <p className="text-sm leading-6 text-slate-600">{t('placeholder.description')}</p>
      </Card>
    </AppShell>
  );
}

