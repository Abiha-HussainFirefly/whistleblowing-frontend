import { type ReactElement } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import { PASSWORD_MIN_LENGTH, PASSWORD_RULES } from '@validators/common';
import { cn } from '@lib/utils';

interface PasswordRequirementsProps {
  /** Current password value being typed. */
  value: string;
  className?: string;
}

type ValidationT = TFunction<'validation'>;

function getPasswordRuleLabel(t: ValidationT, ruleId: string, fallback: string): string {
  switch (ruleId) {
    case 'length':
      return t('passwordRequirements.length', { count: PASSWORD_MIN_LENGTH });
    case 'uppercase':
      return t('passwordRequirements.uppercase');
    case 'lowercase':
      return t('passwordRequirements.lowercase');
    case 'number':
      return t('passwordRequirements.number');
    case 'special':
      return t('passwordRequirements.special');
    default:
      return fallback;
  }
}

/**
 * Live password-policy checklist. Each rule turns green the moment it is
 * satisfied, so the user knows exactly what is missing before they submit.
 * Rules come from the shared `PASSWORD_RULES`, so this always matches what
 * `passwordSchema` (and the backend) actually enforce.
 */
export function PasswordRequirements({
  value,
  className,
}: PasswordRequirementsProps): ReactElement {
  const { t } = useTranslation('validation');

  return (
    <ul className={cn('mt-2 space-y-1', className)} aria-live="polite">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(value);
        return (
          <li
            key={rule.id}
            className={cn(
              'flex items-center gap-1.5 text-xs transition-colors',
              met ? 'text-moss' : 'text-muted-foreground/70',
            )}
          >
            {met ? (
              <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
            ) : (
              <X className="h-3.5 w-3.5 shrink-0" aria-hidden />
            )}
            <span>{getPasswordRuleLabel(t, rule.id, rule.label)}</span>
          </li>
        );
      })}
    </ul>
  );
}
