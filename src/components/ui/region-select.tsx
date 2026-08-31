import { type ReactElement, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchableSelect, type SearchableSelectGroup } from './searchable-select';
import { toFlagGroups } from './flag-option-groups';
import {
  getRegionOptionGroups,
  getScopedRegionOptionGroups,
  regionName,
  regionTimezone,
  regionCurrency,
  localizedCountryName,
  localizedCurrencyName,
} from '@lib/countries';

// Re-export the country helpers from the data module so existing call sites can
// keep importing them from '@components/ui/region-select' unchanged.
export { regionName, regionTimezone, regionCurrency, localizedCountryName, localizedCurrencyName };

export interface RegionSelectProps {
  id?: string;
  value?: string;
  /** Event-shaped for drop-in parity with the native select it replaced. */
  onChange?: (event: { target: { value: string } }) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  scopedRegionCodes?: readonly string[];
}

/**
 * Searchable country/region picker over the full ISO 3166 list (from
 * `@lib/countries`), with a flag per country. Same `value`/`onChange` shape as
 * the native select it replaced, so existing call sites need no changes — they
 * just gain search + flags + the complete country list.
 */
export function RegionSelect({
  id,
  value,
  onChange,
  disabled,
  className,
  placeholder,
  scopedRegionCodes,
}: RegionSelectProps): ReactElement {
  const { t, i18n } = useTranslation();
  const regionOptions = useMemo(() => {
    if (scopedRegionCodes !== undefined && scopedRegionCodes.length > 0) {
      return getScopedRegionOptionGroups(scopedRegionCodes, i18n.language);
    }
    return getRegionOptionGroups(i18n.language);
  }, [i18n.language, scopedRegionCodes]);
  const groups = useMemo<SearchableSelectGroup[]>(
    () => toFlagGroups(regionOptions),
    [regionOptions],
  );
  return (
    <SearchableSelect
      id={id}
      value={value ?? ''}
      groups={groups}
      placeholder={placeholder ?? t('region.selectPlaceholder')}
      searchPlaceholder={t('region.searchPlaceholder')}
      disabled={disabled}
      className={className}
      ariaLabel={t('region.ariaLabel')}
      onChange={(v) => onChange?.({ target: { value: v } })}
    />
  );
}
