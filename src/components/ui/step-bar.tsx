import { type ReactElement } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@lib/utils';

/**
 * Wizard progress rail: a numbered node per step, joined by a connector that
 * fills as the reporter advances.
 *
 * Progressive disclosure is a core principle here (manual §09 rule 05) — the
 * rail exists so a reporter can see the form is finite and how much is left,
 * which is what stops a long intake feeling like an intimidating complaint
 * form. Forward navigation is gated on per-step validity, so a node left behind
 * is also a step that was completed correctly.
 *
 * State is never carried by colour alone: the current step is marked with
 * `aria-current="step"`, completed steps carry a check glyph, and every node
 * shows its own number and title.
 */
export function StepBar({
  titles,
  current,
  className,
  onStepSelect,
}: {
  titles: readonly string[];
  current: number;
  className?: string;
  /** Optional: allow jumping back to an already-completed step. */
  onStepSelect?: (index: number) => void;
}): ReactElement {
  return (
    <nav className={cn('w-full', className)} aria-label="Report progress">
      <ol className="flex items-start">
        {titles.map((title, index) => {
          const done = index < current;
          const isCurrent = index === current;
          const isLast = index === titles.length - 1;
          const canSelect = onStepSelect !== undefined && done;

          const node = (
            <>
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                  done && 'border-signal bg-signal text-white',
                  isCurrent && 'border-signal bg-signal text-white',
                  !done && !isCurrent && 'border-border bg-card text-muted-foreground',
                )}
              >
                {done ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
              </span>
              <span
                className={cn(
                  'mt-2 block max-w-[9rem] text-center text-xs leading-tight',
                  isCurrent ? 'font-semibold text-signal-strong' : 'text-muted-foreground',
                )}
              >
                {title}
              </span>
            </>
          );

          return (
            <li
              key={title}
              className="flex min-w-0 flex-1 flex-col items-center last:flex-none"
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div className="flex w-full items-center">
                {/* Left half-connector keeps every node centred over its label. */}
                <span
                  className={cn(
                    'h-0.5 flex-1 rounded-full',
                    index === 0 ? 'bg-transparent' : done || isCurrent ? 'bg-signal' : 'bg-border',
                  )}
                />
                {canSelect ? (
                  <button
                    type="button"
                    onClick={() => onStepSelect(index)}
                    className="flex flex-col items-center rounded-lg px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {node}
                  </button>
                ) : (
                  <span className="flex flex-col items-center px-1">{node}</span>
                )}
                <span
                  className={cn(
                    'h-0.5 flex-1 rounded-full',
                    isLast ? 'bg-transparent' : done ? 'bg-signal' : 'bg-border',
                  )}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Compact variant for narrow viewports, where a five-node rail would force the
 * labels below a legible size. Reporter controls must stay usable one-handed on
 * a small device (manual §15).
 */
export function StepBarCompact({
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
    <div className={cn('w-full', className)}>
      <div className="flex items-center gap-1.5">
        {titles.map((title, index) => (
          <span
            key={title}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              index <= current ? 'bg-signal' : 'bg-border',
            )}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">
          Step {current + 1} of {titles.length}
        </span>
        {' · '}
        {currentTitle}
      </p>
    </div>
  );
}
