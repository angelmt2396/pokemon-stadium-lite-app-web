import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function BattlePreviewCard() {
  const { t } = useTranslation('battle');

  return (
    <Card className="menu-tile space-y-5 bg-[linear-gradient(160deg,_rgba(8,12,34,0.98),_rgba(19,30,61,0.92))] text-white">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">{t('preview.kicker')}</p>
        <h3 className="text-2xl font-black tracking-tight">{t('preview.title')}</h3>
        <p className="text-sm text-white/70">{t('preview.description')}</p>
      </div>
      <div className="grid gap-4 rounded-[1.5rem] bg-white/4 p-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="h-20 rounded-2xl bg-white/8" />
          <div className="rounded-full border border-white/12 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/60">
            VS
          </div>
          <div className="h-20 rounded-2xl bg-white/12" />
        </div>
        <div className="h-14 rounded-2xl bg-white/6" />
      </div>
      <Link to="/battle" className="block">
        <Button variant="secondary" className="w-full rounded-2xl py-3 font-bold">
          {t('preview.cta')}
        </Button>
      </Link>
    </Card>
  );
}
