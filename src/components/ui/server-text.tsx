import { type ReactElement, type ReactNode } from 'react';
import { cn } from '@lib/utils';

interface ServerTextProps {
  children: ReactNode;
  className?: string;
}

export function ServerText({ children, className }: ServerTextProps): ReactElement {
  return (
    <span className={cn('notranslate', className)} translate="no" dir="auto">
      {children}
    </span>
  );
}
