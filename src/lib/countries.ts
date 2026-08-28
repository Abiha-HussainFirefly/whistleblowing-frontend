/**
 * Country / currency / time-zone reference data, sourced from the bundled
 * `countries_complete_app_ready.json` (249 ISO 3166-1 territories, each with its
 * ISO 4217 currencies and IANA time zones). This is the single source of truth
 * for the Region, Currency and Timezone pickers — no hand-maintained lists.
 *
 * This module is JSX-free: it returns plain option *models* (with a `flagCode`),
 * and the picker components turn those into rendered options (attaching a
 * `<FlagIcon>`). Everything is computed once at module load and cached.
 */
import rawJson from '@assets/countries_complete_app_ready.json';
import i18n from '@/i18n';

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
}

export interface Country {
  /** ISO 3166-1 alpha-2 code. */
  code: string;
  name: string;
  capital: string;
  /** Continent bucket (Asia, Europe, …). */
  region: string;
  /** Primary ISO 4217 currency code, or null (e.g. Antarctica). */
  currency: string | null;
  currencies: CurrencyInfo[];
  timezones: string[];
}

interface RawCountry {
  code: string;
  name: string;
  capital?: string | null;
  region?: string | null;
  currency?: string | null;
  currencies?: CurrencyInfo[];
  timezones?: string[];
}

const COUNTRIES: Country[] = (rawJson as unknown as { countries: RawCountry[] }).countries
  .map((c) => ({
    code: c.code,
    name: c.name,
    capital: c.capital ?? '',
    region: c.region !== null && c.region !== undefined && c.region.length > 0 ? c.region : 'Other',
    currency: c.currency ?? null,
    currencies: c.currencies ?? [],
    timezones: c.timezones ?? [],
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export { COUNTRIES };

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

export function countryByCode(code: string): Country | undefined {
  return BY_CODE.get(code);
}

// ── Localized names (industry-standard via the `Intl.DisplayNames` API) ────────
//
// Country and currency names are localized with the platform Intl database rather
// than hand-maintained catalogs, so every UI language (en/ar/fr/de/ur + any added
// later) gets professionally-translated names for all 249 territories and every
// ISO 4217 currency for free. Instances are cached per-locale (they're not cheap
// to construct), and everything falls back to the bundled English name if a
// locale or code isn't recognized by the runtime.

const regionDisplayCache = new Map<string, Intl.DisplayNames | null>();
const currencyDisplayCache = new Map<string, Intl.DisplayNames | null>();

/** The locale to resolve names in — the active UI language unless overridden. */
export function activeLocale(locale?: string): string {
  return locale ?? i18n.resolvedLanguage ?? i18n.language;
}

function regionDisplay(locale: string): Intl.DisplayNames | null {
  if (!regionDisplayCache.has(locale)) {
    try {
      regionDisplayCache.set(locale, new Intl.DisplayNames([locale], { type: 'region' }));
    } catch {
      regionDisplayCache.set(locale, null);
    }
  }
  return regionDisplayCache.get(locale) ?? null;
}

function currencyDisplay(locale: string): Intl.DisplayNames | null {
  if (!currencyDisplayCache.has(locale)) {
    try {
      currencyDisplayCache.set(locale, new Intl.DisplayNames([locale], { type: 'currency' }));
    } catch {
      currencyDisplayCache.set(locale, null);
    }
  }
  return currencyDisplayCache.get(locale) ?? null;
}

/** Localized country name for an ISO 3166-1 alpha-2 code (falls back to English). */
export function localizedCountryName(code: string, locale?: string): string {
  const fallback = BY_CODE.get(code)?.name ?? code;
  if (code.length !== 2) {
    return fallback;
  }
  try {
    return regionDisplay(activeLocale(locale))?.of(code.toUpperCase()) ?? fallback;
  } catch {
    return fallback;
  }
}

/** Localized currency name for an ISO 4217 code (falls back to the given name). */
export function localizedCurrencyName(code: string, fallback: string, locale?: string): string {
  if (code.length !== 3) {
    return fallback;
  }
  try {
    return currencyDisplay(activeLocale(locale))?.of(code.toUpperCase()) ?? fallback;
  } catch {
    return fallback;
  }
}

/** Friendly, localized country name for a code; 'GLOBAL' → localized "Worldwide". */
export function regionName(code: string, locale?: string): string {
  if (code === 'GLOBAL') {
    return i18n.t('region.worldwide');
  }
  return localizedCountryName(code, locale);
}

/** Representative IANA time zone for a region code ('' if none). */
export function regionTimezone(code: string): string {
  if (code === 'GLOBAL') {
    return 'UTC';
  }
  return BY_CODE.get(code)?.timezones[0] ?? '';
}

/** Representative ISO 4217 currency for a region code ('' if none). */
export function regionCurrency(code: string): string {
  if (code === 'GLOBAL') {
    return 'USD';
  }
  return BY_CODE.get(code)?.currency ?? '';
}

// ── Shared option-model types ────────────────────────────────────────────────

export interface OptionModel {
  value: string;
  label: string;
  keywords: string;
  /** alpha-2 (or 'EU') for the flag; omitted → the picker shows a globe. */
  flagCode?: string;
}

export interface OptionGroupModel {
  label?: string;
  options: OptionModel[];
}

// ── Regions ──────────────────────────────────────────────────────────────────

const regionGroupsCache = new Map<string, OptionGroupModel[]>();

/**
 * Region options: a Worldwide entry, then every country sorted A–Z by its
 * localized name (with flags). Names/sort order follow the active UI language;
 * results are cached per locale. Keywords keep the English name and ISO code so
 * search works regardless of the display language.
 */
export function getRegionOptionGroups(locale?: string): OptionGroupModel[] {
  const loc = activeLocale(locale);
  const cached = regionGroupsCache.get(loc);
  if (cached !== undefined) {
    return cached;
  }
  const countries = COUNTRIES.map((c) => ({ c, name: localizedCountryName(c.code, loc) })).sort(
    (a, b) => a.name.localeCompare(b.name, loc),
  );
  const groups: OptionGroupModel[] = [
    {
      options: [
        {
          value: 'GLOBAL',
          label: i18n.t('region.worldwideAll'),
          keywords: 'worldwide global all regions international',
        },
      ],
    },
    {
      label: i18n.t('region.countries'),
      options: countries.map(({ c, name }) => ({
        value: c.code,
        label: name,
        keywords: `${name} ${c.name} ${c.code} ${c.capital} ${c.region}`,
        flagCode: c.code,
      })),
    },
  ];
  regionGroupsCache.set(loc, groups);
  return groups;
}

/**
 * Same region options as {@link getRegionOptionGroups}, restricted to the
 * provided region codes. If `scope` is empty, this returns all regions.
 * `GLOBAL` is treated as a first-class option when requested.
 */
export function getScopedRegionOptionGroups(
  scopedRegionCodes: readonly string[],
  locale?: string,
): OptionGroupModel[] {
  const trimmed = Array.from(
    new Set(
      scopedRegionCodes.map((code) => code.trim().toUpperCase()).filter((code) => code.length > 0),
    ),
  );
  if (trimmed.length === 0) {
    return getRegionOptionGroups(locale);
  }

  const countries = trimmed
    .filter((code) => code !== 'GLOBAL')
    .map((code) => BY_CODE.get(code))
    .filter((country): country is Country => country !== undefined)
    .map((c) => ({ c, name: localizedCountryName(c.code, locale) }))
    .sort((a, b) => a.name.localeCompare(b.name, activeLocale(locale)));

  const showAll = trimmed.includes('GLOBAL');
  const groups: OptionGroupModel[] = [];
  if (showAll) {
    groups.push({
      options: [
        {
          value: 'GLOBAL',
          label: i18n.t('region.worldwideAll'),
          keywords: 'worldwide global all regions international',
        },
      ],
    });
  }

  if (countries.length > 0) {
    groups.push({
      label: i18n.t('region.countries'),
      options: countries.map(({ c, name }) => ({
        value: c.code,
        label: name,
        keywords: `${name} ${c.name} ${c.code} ${c.capital} ${c.region}`,
        flagCode: c.code,
      })),
    });
  }

  return groups;
}

// ── Currencies ───────────────────────────────────────────────────────────────

const COMMON_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'AED',
  'SAR',
  'PKR',
  'QAR',
  'BHD',
  'KWD',
  'OMR',
  'INR',
  'CNY',
  'JPY',
  'CHF',
  'CAD',
  'AUD',
  'SGD',
  'MYR',
];

interface CurrencyEntry extends CurrencyInfo {
  /** A country whose flag represents this currency (EUR → EU). */
  flagCode: string;
}

const CURRENCY_ENTRIES: CurrencyEntry[] = (() => {
  const map = new Map<string, CurrencyEntry>();
  for (const c of COUNTRIES) {
    for (const cur of c.currencies) {
      if (!map.has(cur.code)) {
        map.set(cur.code, { ...cur, flagCode: c.code });
      }
    }
    // Fallback: a primary currency with no entry in `currencies`.
    if (c.currency !== null && !map.has(c.currency)) {
      map.set(c.currency, {
        code: c.currency,
        name: c.currency,
        symbol: c.currency,
        flagCode: c.code,
      });
    }
  }
  const eur = map.get('EUR');
  if (eur !== undefined) {
    eur.flagCode = 'EU'; // The Euro reads better with the EU flag than one member state.
  }
  return [...map.values()].sort((a, b) => a.code.localeCompare(b.code));
})();

function currencyLabel(entry: CurrencyEntry, locale: string): string {
  const name = localizedCurrencyName(entry.code, entry.name, locale);
  const hasSymbol = entry.symbol.length > 0 && entry.symbol !== entry.code;
  return hasSymbol ? `${entry.code} — ${name} (${entry.symbol})` : `${entry.code} — ${name}`;
}

function toCurrencyOption(entry: CurrencyEntry, locale: string): OptionModel {
  const name = localizedCurrencyName(entry.code, entry.name, locale);
  return {
    value: entry.code,
    label: currencyLabel(entry, locale),
    keywords: `${entry.code} ${name} ${entry.name} ${entry.symbol}`,
    flagCode: entry.flagCode,
  };
}

const currencyGroupsCache = new Map<string, OptionGroupModel[]>();

/**
 * Currency options: a "Common" group, then every other currency A–Z. Names follow
 * the active UI language (localized via {@link localizedCurrencyName}); cached per
 * locale. Keywords keep the English name so search works in any language.
 */
export function getCurrencyOptionGroups(locale?: string): OptionGroupModel[] {
  const loc = activeLocale(locale);
  const cached = currencyGroupsCache.get(loc);
  if (cached !== undefined) {
    return cached;
  }
  const byCode = new Map(CURRENCY_ENTRIES.map((e) => [e.code, e]));
  const common = COMMON_CURRENCIES.map((code) => byCode.get(code)).filter(
    (e): e is CurrencyEntry => e !== undefined,
  );
  const commonSet = new Set(common.map((e) => e.code));
  const rest = CURRENCY_ENTRIES.filter((e) => !commonSet.has(e.code));
  const groups: OptionGroupModel[] = [];
  if (common.length > 0) {
    groups.push({
      label: i18n.t('currency.common'),
      options: common.map((e) => toCurrencyOption(e, loc)),
    });
  }
  groups.push({
    label: i18n.t('currency.all'),
    options: rest.map((e) => toCurrencyOption(e, loc)),
  });
  currencyGroupsCache.set(loc, groups);
  return groups;
}

// ── Time zones ───────────────────────────────────────────────────────────────

interface ZoneMeta {
  value: string;
  area: string;
  offset: number;
  flagCode: string;
  countryName: string;
}

/** Current UTC offset (minutes) for a zone — reflects DST in effect now. */
function offsetMinutes(timeZone: string): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date());
    const name = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
    const raw = name.replace('GMT', '').trim();
    if (raw.length === 0) {
      return 0;
    }
    const sign = raw.startsWith('-') ? -1 : 1;
    const [hourPart, minutePart] = raw.replace(/[+-]/, '').split(':');
    const hours = Number.parseInt(hourPart ?? '0', 10) || 0;
    const minutes =
      minutePart !== undefined && minutePart.length > 0 ? Number.parseInt(minutePart, 10) || 0 : 0;
    return sign * (hours * 60 + minutes);
  } catch {
    return 0;
  }
}

function formatOffset(mins: number): string {
  const sign = mins < 0 ? '−' : '+';
  const abs = Math.abs(mins);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `UTC${sign}${hh}:${mm}`;
}

const ZONES: ZoneMeta[] = (() => {
  const map = new Map<string, ZoneMeta>();
  for (const c of COUNTRIES) {
    for (const tz of c.timezones) {
      if (!map.has(tz)) {
        map.set(tz, {
          value: tz,
          area: tz.includes('/') ? (tz.split('/')[0] ?? 'Other') : 'Other',
          offset: offsetMinutes(tz),
          flagCode: c.code,
          countryName: c.name,
        });
      }
    }
  }
  return [...map.values()];
})();

const ZONE_BY_VALUE = new Map(ZONES.map((z) => [z.value, z]));

function zonePlace(tz: string): string {
  return tz.includes('/') ? tz.split('/').slice(1).join(' / ').replace(/_/g, ' ') : tz;
}

function toZoneOption(z: ZoneMeta): OptionModel {
  return {
    value: z.value,
    label: `(${formatOffset(z.offset)}) ${zonePlace(z.value)}`,
    keywords: `${z.value} ${z.countryName} ${zonePlace(z.value)}`,
    flagCode: z.flagCode,
  };
}

/** The viewer's current time zone, e.g. "Asia/Karachi". */
export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

const timezoneGroupsCache = new Map<string, OptionGroupModel[]>();

/**
 * Time-zone options grouped by IANA area, each labelled with its current UTC
 * offset and the flag of the country it belongs to. A "Suggested" group offers
 * the detected zone and UTC up top. The "Suggested"/"detected" labels follow the
 * active UI language; IANA area names and offsets are locale-neutral by design.
 */
export function getTimezoneOptionGroups(locale?: string): OptionGroupModel[] {
  const loc = activeLocale(locale);
  const cached = timezoneGroupsCache.get(loc);
  if (cached !== undefined) {
    return cached;
  }
  const detectedSuffix = i18n.t('timezone.detected');
  const detected = detectTimezone();
  const suggested: OptionModel[] = [];
  const detectedZone = ZONE_BY_VALUE.get(detected);
  if (detectedZone !== undefined) {
    suggested.push({
      ...toZoneOption(detectedZone),
      label: `${toZoneOption(detectedZone).label} — ${detectedSuffix}`,
    });
  } else if (detected !== 'UTC') {
    suggested.push({
      value: detected,
      label: `${detected} — ${detectedSuffix}`,
      keywords: detected,
    });
  }
  suggested.push({ value: 'UTC', label: '(UTC+00:00) UTC', keywords: 'utc gmt universal' });

  const byArea = new Map<string, ZoneMeta[]>();
  for (const z of ZONES) {
    const arr = byArea.get(z.area) ?? [];
    arr.push(z);
    byArea.set(z.area, arr);
  }

  const groups: OptionGroupModel[] = [{ label: i18n.t('timezone.suggested'), options: suggested }];
  for (const area of [...byArea.keys()].sort((a, b) => a.localeCompare(b))) {
    const zones = (byArea.get(area) ?? []).sort(
      (a, b) => a.offset - b.offset || a.value.localeCompare(b.value),
    );
    groups.push({ label: area, options: zones.map(toZoneOption) });
  }
  timezoneGroupsCache.set(loc, groups);
  return groups;
}
