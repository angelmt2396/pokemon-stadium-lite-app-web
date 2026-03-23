import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useSession } from '@/features/session/context/SessionContext';

export function BattlePreviewCard() {
  const { t } = useTranslation('battle');
  const { session } = useSession();
  const hasActiveBattle = Boolean(session?.currentLobbyId || session?.currentBattleId);
  const primaryCta = hasActiveBattle ? t('preview.resumeCta') : t('preview.cta');

  return (
    <Link
      to="/battle"
      state={hasActiveBattle ? undefined : { startSearch: true }}
      className="menu-tile group flex h-full flex-col gap-4 bg-[radial-gradient(circle_at_top_right,_rgba(69,211,255,0.16),_transparent_28%),linear-gradient(160deg,_rgba(8,12,34,0.98),_rgba(19,30,61,0.94))] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 md:gap-5"
    >
      <div className="absolute inset-x-8 top-6 h-px bg-gradient-to-r from-transparent via-white/16 to-transparent" />
      <div className="absolute bottom-0 right-10 h-28 w-28 rounded-full bg-cyan-400/12 blur-3xl" />

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">{t('preview.kicker')}</p>
          <h3 className="text-2xl font-black tracking-tight">{t('preview.title')}</h3>
          <p className="text-sm text-white/70">{t('preview.description')}</p>
        </div>
        <div className="self-start rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-100">
          {hasActiveBattle ? t('preview.statusLive') : t('preview.statusReady')}
        </div>
      </div>

      <div className="relative grid gap-4 rounded-[1.55rem] border border-white/8 bg-[linear-gradient(180deg,_rgba(255,255,255,0.06),_rgba(255,255,255,0.03))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] md:rounded-[1.75rem] md:p-5">
        <div className="space-y-3 md:hidden">
          <div className="rounded-[1.4rem] border border-emerald-300/12 bg-emerald-300/6 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-100/65">{t('preview.you')}</p>
            <p className="mt-1 break-words text-lg font-bold capitalize text-white">{session?.nickname ?? t('preview.trainerFallback')}</p>
            <div className="mt-4 h-2 rounded-full bg-white/10">
              <div className="h-2 w-[76%] rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300" />
            </div>
            <p className="mt-2 text-xs text-white/55">{hasActiveBattle ? t('preview.teamReady') : t('preview.teamPending')}</p>
          </div>

          <div className="flex justify-center">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-cyan-300/22 bg-cyan-300/8">
              <div className="absolute inset-0 rounded-full border border-cyan-200/20 animate-ping" />
              <span className="relative text-xs font-black uppercase tracking-[0.2em] text-cyan-100">VS</span>
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">{t('preview.opponent')}</p>
            <p className="mt-1 break-words text-lg font-bold text-white">{hasActiveBattle ? t('preview.opponentReady') : t('preview.opponentPending')}</p>
            <div className="mt-4 h-2 rounded-full bg-white/10">
              <div className={`h-2 rounded-full ${hasActiveBattle ? 'w-[68%] bg-gradient-to-r from-cyan-300 to-fuchsia-300' : 'w-[38%] bg-white/25'}`} />
            </div>
            <p className="mt-2 text-xs text-white/55">{hasActiveBattle ? t('preview.statusLive') : t('preview.statusReady')}</p>
          </div>
        </div>

        <div className="hidden items-center gap-3 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <div className="rounded-[1.4rem] border border-emerald-300/12 bg-emerald-300/6 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-100/65">{t('preview.you')}</p>
            <p className="mt-1 truncate text-lg font-bold capitalize text-white">{session?.nickname ?? t('preview.trainerFallback')}</p>
            <div className="mt-4 h-2 rounded-full bg-white/10">
              <div className="h-2 w-[76%] rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300" />
            </div>
            <p className="mt-2 text-xs text-white/55">{hasActiveBattle ? t('preview.teamReady') : t('preview.teamPending')}</p>
          </div>

          <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-cyan-300/22 bg-cyan-300/8">
            <div className="absolute inset-0 rounded-full border border-cyan-200/20 animate-ping" />
            <span className="relative text-xs font-black uppercase tracking-[0.2em] text-cyan-100">VS</span>
          </div>

          <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">{t('preview.opponent')}</p>
            <p className="mt-1 text-lg font-bold text-white">{hasActiveBattle ? t('preview.opponentReady') : t('preview.opponentPending')}</p>
            <div className="mt-4 h-2 rounded-full bg-white/10">
              <div className={`h-2 rounded-full ${hasActiveBattle ? 'w-[68%] bg-gradient-to-r from-cyan-300 to-fuchsia-300' : 'w-[38%] bg-white/25'}`} />
            </div>
            <p className="mt-2 text-xs text-white/55">{hasActiveBattle ? t('preview.statusLive') : t('preview.statusReady')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <div className="rounded-[1.3rem] border border-white/8 bg-white/6 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">{t('preview.metaQueue')}</p>
            <p className="mt-1 text-sm font-semibold text-white">{t('preview.metaQueueValue')}</p>
          </div>
          <div className="rounded-[1.3rem] border border-white/8 bg-white/6 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">{t('preview.metaLive')}</p>
            <p className="mt-1 text-sm font-semibold text-white">
              {hasActiveBattle ? t('preview.metaLiveValue') : t('preview.statusReady')}
            </p>
          </div>
          <div className="col-span-2 rounded-[1.3rem] border border-white/8 bg-white/6 px-4 py-3 md:col-span-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">{t('preview.metaFormat')}</p>
            <p className="mt-1 text-sm font-semibold text-white">{t('preview.metaFormatValue')}</p>
          </div>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-3 rounded-[1.45rem] border border-white/12 bg-white px-4 py-3 text-slate-950 shadow-[0_18px_32px_rgba(8,12,34,0.32)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black">{primaryCta}</p>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{t('preview.enterLabel')}</p>
        </div>
        <span className="inline-flex self-start rounded-full bg-slate-950 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition duration-300 group-hover:translate-x-1 sm:self-auto">
          {t('preview.pillLabel')}
        </span>
      </div>
    </Link>
  );
}
