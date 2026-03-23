import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router-dom';
import { LanguageToggle } from '@/components/layout/LanguageToggle';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useSession } from '@/features/session/context/SessionContext';
import { cn } from '@/lib/utils/cn';

const LOGIN_HERO_POKEMON = [
  {
    name: 'Pikachu',
    src: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/25.gif',
    accent: 'from-amber-300/32 via-amber-200/14 to-transparent',
  },
  {
    name: 'Bulbasaur',
    src: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/1.gif',
    accent: 'from-emerald-300/28 via-emerald-200/12 to-transparent',
  },
  {
    name: 'Charmander',
    src: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/4.gif',
    accent: 'from-orange-300/28 via-rose-200/12 to-transparent',
  },
  {
    name: 'Squirtle',
    src: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/7.gif',
    accent: 'from-sky-300/28 via-cyan-200/12 to-transparent',
  },
] as const;

export function LoginPage() {
  const { t } = useTranslation('login');
  const { status, session, login, errorMessage, clearSessionError } = useSession();
  const location = useLocation();
  const [nickname, setNickname] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeVisualIndex, setActiveVisualIndex] = useState(0);
  const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';
  const postLoginRedirect =
    session?.currentLobbyId || session?.currentBattleId
      ? '/battle'
      : redirectTo;

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveVisualIndex((current) => (current + 1) % LOGIN_HERO_POKEMON.length);
    }, 4200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const activeVisual = LOGIN_HERO_POKEMON[activeVisualIndex];
  const secondaryVisual = LOGIN_HERO_POKEMON[(activeVisualIndex + 1) % LOGIN_HERO_POKEMON.length];

  if (status === 'authenticated') {
    return <Navigate to={postLoginRedirect} replace />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearSessionError();
    setSubmitting(true);

    try {
      await login(nickname);
    } catch {
      // error state is stored in session context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden text-ink">
      <div className="pointer-events-none absolute inset-0 opacity-90">
        <div className="absolute left-[4%] top-[6%] h-36 w-36 rounded-full bg-amber-200/40 blur-3xl sm:left-[8%] sm:top-[10%] sm:h-48 sm:w-48" />
        <div className="absolute right-[8%] top-[14%] h-48 w-48 rounded-full bg-blue-200/40 blur-3xl sm:right-[12%] sm:top-[18%] sm:h-64 sm:w-64" />
        <div className="absolute bottom-[6%] left-[18%] h-40 w-40 rounded-full bg-emerald-200/25 blur-3xl sm:bottom-[8%] sm:left-[24%] sm:h-56 sm:w-56" />
      </div>
      <div className="page-container flex min-h-screen items-center justify-center py-8 sm:py-10">
        <div className="relative z-10 grid w-full max-w-6xl gap-5 md:gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <section className="order-2 self-center lg:order-1">
            <div className="game-frame relative overflow-hidden px-5 py-6 sm:px-8 sm:py-8 md:px-10 md:py-12">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-300 via-rose-300 to-blue-400" />
              <div className="absolute -right-8 top-6 h-24 w-24 rounded-full border border-slate-200/70 bg-white/45 sm:-right-12 sm:top-8 sm:h-32 sm:w-32" />
              <div className="absolute bottom-[-18px] right-10 h-14 w-14 rounded-full bg-slate-950/5 sm:bottom-[-28px] sm:right-20 sm:h-20 sm:w-20" />
              <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_150px] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_165px]">
                <div className="relative z-10 space-y-4 sm:space-y-5 lg:max-w-[26rem] xl:max-w-[28rem]">
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-ember">{t('eyebrow')}</p>
                  <div className="space-y-2.5 sm:space-y-3">
                    <h1 className="max-w-[8ch] text-4xl font-black tracking-tight sm:max-w-[9ch] sm:text-5xl md:text-6xl lg:max-w-[7ch] lg:text-[4.2rem] lg:leading-[0.95] xl:max-w-[8ch] xl:text-[4.7rem]">
                      {t('title')}
                    </h1>
                    <p className="max-w-lg text-sm leading-6 text-slate-600 sm:text-base sm:leading-7 md:text-lg">
                      {t('description')}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2.5 sm:gap-3">
                    <div className="rounded-full border border-slate-200 bg-white/80 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 sm:px-4 sm:text-xs">
                      Online
                    </div>
                    <div className="rounded-full border border-slate-200 bg-white/80 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 sm:px-4 sm:text-xs">
                      PvP
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] border border-slate-200/80 bg-white/70 p-3 shadow-[0_16px_34px_rgba(15,23,42,0.08)] lg:hidden">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Roster live</p>
                        <p className="mt-1 text-base font-black tracking-tight text-slate-950">{activeVisual.name}</p>
                      </div>
                      <div className="relative flex h-20 w-24 items-center justify-center rounded-[1.1rem] border border-slate-200/80 bg-slate-50">
                        <div className={cn('absolute inset-2 rounded-full bg-radial-[at_center] blur-2xl', activeVisual.accent)} />
                        <img
                          key={`mobile-${activeVisual.name}`}
                          alt={activeVisual.name}
                          className="relative h-16 w-16 object-contain drop-shadow-[0_14px_18px_rgba(15,23,42,0.14)]"
                          src={activeVisual.src}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative hidden lg:block lg:self-end lg:justify-self-end">
                  <div className="relative h-[168px] w-[138px] xl:h-[190px] xl:w-[155px]">
                    <div className="absolute inset-[12%] rounded-full border border-slate-200/60 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.74),_rgba(255,255,255,0.16)_58%,_transparent_78%)]" />
                    <div className="absolute inset-[26%] rounded-full border border-slate-200/42" />
                    <div className={cn('absolute inset-[20%] rounded-full bg-radial-[at_center] blur-3xl', activeVisual.accent)} />

                    <div className="absolute right-1 top-6 battle-hero-float-slow rounded-[1.25rem] border border-white/75 bg-white/56 px-2.5 py-2.5 shadow-[0_22px_40px_rgba(15,23,42,0.12)] backdrop-blur xl:right-1 xl:top-7">
                      <div className="flex items-center justify-center rounded-[1rem] border border-slate-100/80 bg-white/55 px-2.5 py-2.5">
                        <img
                          key={activeVisual.name}
                          alt={activeVisual.name}
                          className="h-16 w-16 object-contain drop-shadow-[0_24px_32px_rgba(15,23,42,0.16)] xl:h-20 xl:w-20"
                          src={activeVisual.src}
                        />
                      </div>
                    </div>

                    <div className="absolute bottom-1 left-0 battle-hero-float-fast rounded-[0.9rem] border border-white/70 bg-white/62 px-1.5 py-1.5 shadow-[0_18px_32px_rgba(15,23,42,0.12)] backdrop-blur xl:left-1">
                      <img
                        key={secondaryVisual.name}
                        alt={secondaryVisual.name}
                        className="h-6 w-6 object-contain opacity-85 drop-shadow-[0_16px_20px_rgba(15,23,42,0.12)] xl:h-7 xl:w-7"
                        src={secondaryVisual.src}
                      />
                    </div>

                    <div className="absolute bottom-1 right-0 rounded-full border border-slate-200/80 bg-white/75 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.16em] text-slate-500 xl:bottom-1 xl:right-0">
                      {activeVisual.name}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Card className="game-frame order-1 space-y-5 border-slate-950/8 bg-white/88 px-5 py-5 sm:px-6 sm:py-6 md:order-2 md:space-y-6 md:px-7 md:py-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5 sm:space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                  {t('form.eyebrow')}
                </p>
                <h2 className="text-2xl font-black tracking-tight sm:text-3xl">{t('form.title')}</h2>
              </div>
              <div className="self-start sm:self-auto">
                <LanguageToggle />
              </div>
            </div>

            <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="nickname">
                  {t('form.label')}
                </label>
                <Input
                  id="nickname"
                  value={nickname}
                  maxLength={30}
                  placeholder={t('form.placeholder')}
                  onChange={(event) => setNickname(event.target.value)}
                />
                {t('form.help') ? <p className="text-xs text-slate-500">{t('form.help')}</p> : null}
              </div>

              {errorMessage ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {errorMessage}
                </div>
              ) : null}

              <Button
                className="w-full rounded-2xl py-3 text-sm font-black tracking-[0.01em] sm:py-3.5 sm:text-base"
                disabled={submitting}
              >
                {submitting ? t('form.submitting') : t('form.submit')}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
