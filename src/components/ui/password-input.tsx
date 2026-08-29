import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@lib/utils';

export type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

/**
 * Password input with a show/hide toggle, styled to match the
 * other auth inputs.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const ToggleIcon = visible ? EyeOff : Eye;
    return (
      <div className="relative">
        <input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={cn(
            'flex h-11 w-full rounded-lg border border-border bg-muted/50 px-4 pr-11 text-sm text-foreground placeholder:text-muted-foreground/70',
            'focus:border-signal focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-60',
            className,
          )}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => {
            setVisible((v) => !v);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground"
        >
          <ToggleIcon className="h-4 w-4" />
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';
