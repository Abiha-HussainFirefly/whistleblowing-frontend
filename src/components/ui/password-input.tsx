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
            'flex h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 pr-11 text-sm text-slate-900 placeholder:text-slate-400',
            'focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/25',
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
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          <ToggleIcon className="h-4 w-4" />
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';
