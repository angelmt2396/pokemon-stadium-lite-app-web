import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[linear-gradient(135deg,_#0f172a,_#1d4ed8)] text-white shadow-[0_16px_32px_rgba(15,23,42,0.24)] hover:brightness-110',
  secondary:
    'bg-white/95 text-ink ring-1 ring-slate-300 shadow-[0_10px_22px_rgba(15,23,42,0.08)] hover:bg-white',
  ghost: 'bg-transparent text-ink hover:bg-white/70',
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
