import type { PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '@/components/layout/LanguageToggle';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/features/session/context/SessionContext';
import { cn } from '@/lib/utils/cn';

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-full px-3 py-2 text-sm font-semibold transition',
    isActive
      ? 'bg-slate-950 text-white shadow-[0_12px_30px_rgba(16,24,40,0.18)]'
      : 'text-slate-600 hover:bg-white/70 hover:text-ink',
  );

export function AppShell({ children }: PropsWithChildren) {
  const { t } = useTranslation('common');
  const { session, logout, errorMessage } = useSession();

  return (
    <div className="min-h-screen text-ink">
      <div className="page-container">
        <header className="game-frame sticky top-4 z-20 mb-8 flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.4rem] bg-slate-950 text-lg font-black text-white">
              PA
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ember">{t('brandTag')}</p>
              <h1 className="text-2xl font-black tracking-tight">{t('brandTitle')}</h1>
            </div>
            {session ? (
              <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 md:block">
                {t('sessionLabel', { nickname: session.nickname })}
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <nav className="flex flex-wrap gap-2 rounded-full bg-white/65 p-1">
              <NavLink className={navLinkClassName} to="/">
                {t('navigation.home')}
              </NavLink>
              <NavLink className={navLinkClassName} to="/catalog">
                {t('navigation.catalog')}
              </NavLink>
              <NavLink className={navLinkClassName} to="/battle">
                {t('navigation.battle')}
              </NavLink>
            </nav>
            <Button
              type="button"
              variant="secondary"
              className="rounded-full text-xs uppercase tracking-[0.14em]"
              onClick={() => {
                void logout();
              }}
            >
              {t('navigation.logout')}
            </Button>
            <LanguageToggle />
          </div>
        </header>
        {errorMessage ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {errorMessage}
          </div>
        ) : null}
        <main>{children}</main>
      </div>
    </div>
  );
}
