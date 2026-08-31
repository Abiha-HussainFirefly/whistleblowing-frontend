import { forwardRef, type LabelHTMLAttributes } from 'react';
import { cn } from '@lib/utils';

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

/**
 * Generic form label.
 *
 * The association is the caller's responsibility: every use either passes
 * `htmlFor` or nests its control. That contract is not visible from inside this
 * component, so the rule cannot verify it here — the checks that matter run at
 * the call sites, which this config also lints.
 */
export const Label = forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => (
  // eslint-disable-next-line jsx-a11y/label-has-associated-control -- see above
  <label
    ref={ref}
    className={cn('mb-1.5 block text-sm font-medium text-foreground', className)}
    {...props}
  />
));
Label.displayName = 'Label';
