import { type ReactElement } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@lib/utils';

/**
 * Compact wizard progress indicator: a segment per step + "Step n of m · Title".
 *
 * Dynamic by design — each segment reflects its state relative to the active
 * step, so the bar fills in as the user completes steps:
 *   - completed (index < current): solid accent with a check
 *   - current  (index === current): solid accent (where you are now)
 *   - upcoming (index > current): muted
 *
 * Forward navigation in our wizards is gated on per-step validity, so a segment
 * left behind is also a step that was completed correctly.
 */
export function StepBar({
  titles,
  current,
  className,
}: {
  titles: readonly string[];
  current: number;
  className?: string;
}): ReactElement {
  // eslint-disable-next-line security/detect-object-injection
  const currentTitle = titles[current] ?? '';

  return (
    <div className={cn('mt-3', className)}>
      <div className="flex items-center gap-1.5">
        {titles.map((title, index) => {
          const done = index < current;
          const isCurrent = index === current;
          return (
            <div
              key={title}
              className="flex flex-1 items-center gap-1.5"
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-colors',
                  done || isCurrent ? 'bg-brand-accent' : 'bg-slate-200 dark:bg-white/10',
                )}
              />
              {done && <Check className="h-3 w-3 shrink-0 text-brand-accent" aria-hidden="true" />}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          Step {current + 1} of {titles.length}
        </span>
        {' · '}
        {currentTitle}
      </p>
    </div>
  );
}
