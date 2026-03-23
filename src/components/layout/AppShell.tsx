import type { PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '@/components/layout/LanguageToggle';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/features/session/context/SessionContext';
import { cn } from '@/lib/utils/cn';

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex-1 rounded-full px-3 py-2 text-center text-sm font-semibold transition sm:flex-none',
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
        <header className="game-frame relative mb-4 flex flex-col gap-2.5 px-3.5 py-3.5 md:sticky md:top-4 md:z-20 md:mb-6 md:gap-0 md:px-6 md:py-5">
          <div className="flex items-start justify-between gap-2.5 md:hidden">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-slate-950 text-sm font-black text-white md:h-14 md:w-14 md:rounded-[1.4rem] md:text-lg">
                PA
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ember md:text-[11px]">
                  {t('brandTag')}
                </p>
                <h1 className="truncate text-lg font-black tracking-tight md:text-2xl">{t('brandTitle')}</h1>
              </div>
            </div>
            <div className="shrink-0 md:hidden">
              <LanguageToggle />
            </div>
          </div>

          <div className="hidden md:flex md:items-center md:justify-between md:gap-6">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.4rem] bg-slate-950 text-lg font-black text-white">
                PA
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ember">{t('brandTag')}</p>
                <h1 className="truncate text-2xl font-black tracking-tight">{t('brandTitle')}</h1>
              </div>
              {session ? (
                <div className="ml-2 max-w-[280px] truncate rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
                  {t('sessionLabel', { nickname: session.nickname })}
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              <nav className="min-w-0 rounded-full bg-white/65 p-1">
                <NavLink className={navLinkClassName} to="/">
                  {t('navigation.home')}
                </NavLink>
              </nav>
              <Button
                type="button"
                variant="secondary"
                className="rounded-full px-5 py-2.5 text-xs uppercase tracking-[0.14em]"
                onClick={() => {
                  void logout();
                }}
              >
                {t('navigation.logout')}
              </Button>
              <LanguageToggle />
            </div>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {session ? (
              <div className="max-w-full truncate rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[13px] text-slate-600">
                {t('sessionLabel', { nickname: session.nickname })}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
              <nav className="col-span-1 min-w-0 rounded-full bg-white/65 p-1">
                <NavLink className={navLinkClassName} to="/">
                  {t('navigation.home')}
                </NavLink>
              </nav>
              <div className="col-span-1 flex min-w-0 items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-9 w-full rounded-full px-3 text-[10px] uppercase tracking-[0.14em] sm:w-auto sm:flex-1 md:min-h-0 md:flex-none md:text-xs"
                  onClick={() => {
                    void logout();
                  }}
                >
                  {t('navigation.logout')}
                </Button>
              </div>
            </div>
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
