import type { PropsWithChildren, ReactNode } from 'react';

type PageIntroProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
}>;

export function PageIntro({ eyebrow, title, description, aside, children }: PageIntroProps) {
  return (
    <section className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">{eyebrow}</p>
        <div className="space-y-2">
          <h2 className="text-4xl font-bold tracking-tight text-ink">{title}</h2>
          <p className="max-w-2xl text-base leading-7 text-slate-600">{description}</p>
        </div>
        {children}
      </div>
      {aside ? <div>{aside}</div> : null}
    </section>
  );
}

