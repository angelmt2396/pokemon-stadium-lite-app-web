import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { LanguageToggle } from '@/components/layout/LanguageToggle';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useSession } from '@/features/session/context/SessionContext';

export function LoginPage() {
  const { t } = useTranslation('login');
  const { status, login, errorMessage, clearSessionError } = useSession();
  const [nickname, setNickname] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authenticated') {
    return <Navigate to="/" replace />;
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
        <div className="absolute left-[8%] top-[10%] h-48 w-48 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="absolute right-[12%] top-[18%] h-64 w-64 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute bottom-[8%] left-[24%] h-56 w-56 rounded-full bg-emerald-200/25 blur-3xl" />
      </div>
      <div className="page-container flex min-h-screen items-center justify-center">
        <div className="relative z-10 w-full max-w-6xl grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="self-center">
            <div className="game-frame relative overflow-hidden px-8 py-10 md:px-10 md:py-12">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-300 via-rose-300 to-blue-400" />
              <div className="absolute -right-12 top-8 h-32 w-32 rounded-full border border-slate-200/70 bg-white/45" />
              <div className="absolute bottom-[-28px] right-20 h-20 w-20 rounded-full bg-slate-950/5" />
              <div className="relative space-y-5">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-ember">{t('eyebrow')}</p>
                <div className="space-y-3">
                  <h1 className="text-6xl font-black tracking-tight md:text-7xl">{t('title')}</h1>
                  <p className="max-w-lg text-lg text-slate-600">{t('description')}</p>
                </div>
                <div className="flex gap-3">
                  <div className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                    Online
                  </div>
                  <div className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                    PvP
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Card className="game-frame space-y-6 border-slate-950/8 bg-white/88 px-7 py-7">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                  {t('form.eyebrow')}
                </p>
                <h2 className="text-3xl font-black tracking-tight">{t('form.title')}</h2>
              </div>
              <LanguageToggle />
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
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

              <Button className="w-full rounded-2xl py-3 text-base font-bold" disabled={submitting}>
                {submitting ? t('form.submitting') : t('form.submit')}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
