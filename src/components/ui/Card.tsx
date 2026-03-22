import type { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils/cn';

type CardProps = PropsWithChildren<{
  className?: string;
}>;

export function Card({ children, className }: CardProps) {
  return <section className={cn('panel-surface', className)}>{children}</section>;
}

