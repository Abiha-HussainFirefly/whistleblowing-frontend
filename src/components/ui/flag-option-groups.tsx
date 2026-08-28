import { type SearchableSelectGroup } from './searchable-select';
import { FlagIcon } from './flag-icon';
import { type OptionGroupModel } from '@lib/countries';

/**
 * Turn JSX-free option models from `@lib/countries` into ready-to-render
 * `SearchableSelect` groups, attaching a `<FlagIcon>` per option. Shared by the
 * Region, Currency and Timezone pickers so they stay consistent.
 */
export function toFlagGroups(models: OptionGroupModel[]): SearchableSelectGroup[] {
  return models.map((group) => ({
    ...(group.label !== undefined ? { label: group.label } : {}),
    options: group.options.map((o) => ({
      value: o.value,
      label: o.label,
      keywords: o.keywords,
      icon: <FlagIcon code={o.flagCode} />,
    })),
  }));
}
