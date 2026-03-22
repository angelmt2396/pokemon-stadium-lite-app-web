import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function CatalogPreviewCard() {
  const { t } = useTranslation('catalog');

  return (
    <Card className="menu-tile space-y-5">
      <div className="absolute right-4 top-4 rounded-full bg-slate-950 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white">
        Dex
      </div>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t('preview.kicker')}</p>
        <h3 className="text-2xl font-black tracking-tight">{t('preview.title')}</h3>
        <p className="text-sm text-slate-500">{t('preview.description')}</p>
      </div>
      <div className="grid gap-3 rounded-[1.5rem] bg-sand p-5">
        <div className="h-16 rounded-2xl bg-white/70" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-10 rounded-xl bg-white/65" />
          <div className="h-10 rounded-xl bg-white/55" />
          <div className="h-10 rounded-xl bg-white/45" />
        </div>
      </div>
      <Link to="/catalog" className="block">
        <Button variant="secondary" className="w-full rounded-2xl py-3 font-bold">
          {t('preview.cta')}
        </Button>
      </Link>
    </Card>
  );
}
