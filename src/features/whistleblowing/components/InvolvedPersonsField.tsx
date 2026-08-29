import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import type { InvolvedPerson } from '../types';

interface Props {
  value: InvolvedPerson[];
  onChange: (next: InvolvedPerson[]) => void;
  max?: number;
}

/**
 * Repeatable "person(s) engaged in this behavior" rows (First / Last / Title),
 * mirroring the NAVEX EthicsPoint intake form. Shared by the public intake form
 * and the manual-create sheet.
 */
export function InvolvedPersonsField({ value, onChange, max = 10 }: Props): ReactElement {
  const { t } = useTranslation('whistleblowing');

  const update = (index: number, patch: Partial<InvolvedPerson>): void => {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };
  const add = (): void => {
    if (value.length < max) {
      onChange([...value, { firstName: '', lastName: '', title: '' }]);
    }
  };
  const remove = (index: number): void => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="hidden gap-2 px-1 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[1fr_1fr_1fr_auto]">
          <span>{t('persons.firstName', { defaultValue: 'First name' })}</span>
          <span>{t('persons.lastName', { defaultValue: 'Last name' })}</span>
          <span>{t('persons.titleRole', { defaultValue: 'Title / role' })}</span>
          <span className="w-8" />
        </div>
      )}
      {value.map((row, i) => (
        <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <Input
            value={row.firstName ?? ''}
            onChange={(e) => {
              update(i, { firstName: e.target.value });
            }}
            placeholder={t('persons.firstName', { defaultValue: 'First name' })}
          />
          <Input
            value={row.lastName ?? ''}
            onChange={(e) => {
              update(i, { lastName: e.target.value });
            }}
            placeholder={t('persons.lastName', { defaultValue: 'Last name' })}
          />
          <Input
            value={row.title ?? ''}
            onChange={(e) => {
              update(i, { title: e.target.value });
            }}
            placeholder={t('persons.titlePlaceholder', { defaultValue: 'e.g. Night Supervisor' })}
          />
          <button
            type="button"
            onClick={() => {
              remove(i);
            }}
            aria-label={t('persons.remove', { defaultValue: 'Remove person' })}
            className="flex h-11 w-8 items-center justify-center rounded-md text-muted-foreground/70 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      {value.length < max && (
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="h-4 w-4" />
          {value.length === 0
            ? t('persons.addFirst', { defaultValue: 'Add a person' })
            : t('persons.addAnother', { defaultValue: 'Add another' })}
        </Button>
      )}
      <p className="text-xs text-muted-foreground/70">
        {t('persons.examples', {
          defaultValue:
            'Examples: "John Doe, Director of Internal Audit" - "Unknown, Unknown, Night Supervisor"',
        })}
      </p>
    </div>
  );
}
