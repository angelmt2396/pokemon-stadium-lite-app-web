import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function MatchmakingPreviewCard() {
  const { t } = useTranslation('matchmaking');

  return (
    <Card className="menu-tile space-y-5 bg-[linear-gradient(160deg,_rgba(255,245,209,0.95),_rgba(255,255,255,0.88))]">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t('preview.kicker')}</p>
          <h3 className="text-2xl font-black tracking-tight">{t('preview.title')}</h3>
        </div>
        <StatusBadge label={t('preview.badge')} tone="warning" />
      </div>
      <p className="text-sm text-slate-500">{t('preview.description')}</p>
      <div className="grid gap-3 rounded-[1.5rem] bg-slate-100 p-5">
        <div className="h-11 rounded-2xl bg-white" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-14 rounded-2xl bg-white/95" />
          <div className="h-14 rounded-2xl bg-white/75" />
        </div>
      </div>
      <Link to="/matchmaking" className="block">
        <Button className="w-full rounded-2xl py-3 font-bold">{t('preview.cta')}</Button>
      </Link>
    </Card>
  );
}
