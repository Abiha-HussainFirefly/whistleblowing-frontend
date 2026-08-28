import { type ReactElement } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@lib/utils';

interface LoaderProps {
  className?: string;
  label?: string;
  fullscreen?: boolean;
}

export function Loader({ className, label, fullscreen = false }: LoaderProps): ReactElement {
  const hasLabel = typeof label === 'string' && label.length > 0;
  const content = (
    <div className="flex flex-col items-center justify-center gap-2">
      <Loader2 className={cn('h-8 w-8 animate-spin text-primary', className)} />
      {hasLabel ? <p className="text-sm text-muted-foreground">{label}</p> : null}
    </div>
  );
  if (fullscreen) {
    return <div className="flex min-h-screen items-center justify-center">{content}</div>;
  }
  return content;
}
