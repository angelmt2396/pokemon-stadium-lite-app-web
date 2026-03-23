import type { PropsWithChildren, ReactNode } from 'react';

type PageIntroProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
}>;

export function PageIntro({ eyebrow, title, description, aside, children }: PageIntroProps) {
  return (
    <section className="mb-6 grid gap-5 md:mb-8 md:gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
      <div className="space-y-3 md:space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">{eyebrow}</p>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-[2.2rem] md:text-4xl">{title}</h2>
          <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">{description}</p>
        </div>
        {children}
      </div>
      {aside ? <div className="lg:justify-self-end">{aside}</div> : null}
    </section>
  );
}
