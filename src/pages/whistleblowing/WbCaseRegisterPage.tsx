import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ChevronDown,
  LayoutGrid,
  List as ListIcon,
  Plus,
  Search,
  ShieldOff,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Pagination } from '@components/ui/pagination';
import { Select } from '@components/ui/select';
import { ServerText } from '@components/ui/server-text';
import { Loader } from '@components/common/Loader';
import { getApiErrorMessage } from '@lib/api-error';
import { cn } from '@lib/utils';
import { ROUTES } from '@config/routes';
import { usePermissions } from '@hooks/usePermissions';
import { useIsCompactViewport } from '@hooks/useMediaQuery';
import { useWbCases } from '@features/whistleblowing/hooks';
import { WB_PERMISSIONS } from '@features/whistleblowing/permissions';
import {
  WB_CATEGORY_OPTIONS,
  WB_PRIORITY_OPTIONS,
  WB_STATUS_OPTIONS,
  formatDate,
  slaDaysRemaining,
} from '@features/whistleblowing/utils/format';
import {
  wbCategoryLabelT,
  wbPriorityLabelT,
  wbStatusLabelT,
} from '@features/whistleblowing/utils/i18n';
import type {
  InvestigationPriority,
  WbCaseListParams,
  WhistleblowingCategory,
  WhistleblowingStatus,
} from '@features/whistleblowing/types';
import { WbHeader } from './components/WbHeader';
import { WbCategoryBadge, WbPriorityBadge, WbStatusBadge } from './components/WbBadges';
import { ManualCaseSheet } from './components/ManualCaseSheet';

type ViewMode = 'grid' | 'list';

export function WbCaseRegisterPage(): ReactElement {
  const { t, i18n } = useTranslation('whistleblowing');
  const { has } = usePermissions();
  const navigate = useNavigate();
  const canCreateManual = has(WB_PERMISSIONS.create);
  const isRtl = i18n.dir() === 'rtl';
  const tableHeaderClass = cn('px-4 py-2.5 font-medium', isRtl ? 'text-right' : 'text-left');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<WhistleblowingStatus | ''>('');
  const [category, setCategory] = useState<WhistleblowingCategory | ''>('');
  const [priority, setPriority] = useState<InvestigationPriority | ''>('');
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showManual, setShowManual] = useState(false);
  const [view, setView] = useState<ViewMode>('list');
  // A seven-column register is unreadable on a phone, so below `lg` the
  // card view is used regardless of the toggle. The toggle itself is
  // hidden at those widths rather than being silently ignored.
  const isCompact = useIsCompactViewport();
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Surfaced on the collapsed control so a narrowed list is never a mystery.
  const activeFilterCount =
    (search.length > 0 ? 1 : 0) +
    (status !== '' ? 1 : 0) +
    (category !== '' ? 1 : 0) +
    (priority !== '' ? 1 : 0) +
    (assignedToMe ? 1 : 0);
  const effectiveView: ViewMode = isCompact ? 'grid' : view;

  const params: WbCaseListParams = {
    ...(search.length > 0 ? { search } : {}),
    ...(status !== '' ? { status } : {}),
    ...(category !== '' ? { category } : {}),
    ...(priority !== '' ? { priority } : {}),
    ...(assignedToMe ? { assignedToMe: true } : {}),
    page,
    pageSize,
  };
  const { data, isLoading, isError, error } = useWbCases(params);

  return (
    <div className="space-y-6">
      <WbHeader />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">
          {t('cases.title', { defaultValue: 'Case register' })}
        </h2>
        {canCreateManual && (
          <Button
            size="sm"
            onClick={() => {
              setShowManual(true);
            }}
          >
            <Plus className="h-4 w-4" />
            {t('cases.actions.newManualCase', { defaultValue: 'New manual case' })}
          </Button>
        )}
      </div>

      {/* Filters. Below `lg` these are four full-width controls that would push
          the first case off-screen, so they collapse behind a toggle that
          reports how many are active. */}
      <button
        type="button"
        onClick={() => {
          setFiltersOpen((open) => !open);
        }}
        aria-expanded={filtersOpen}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:border-signal/40 lg:hidden"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          {t('cases.filters.toggle', { defaultValue: 'Search & filters' })}
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-signal px-2 py-0.5 text-xs font-semibold text-white">
              {activeFilterCount}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 transition-transform', filtersOpen && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      <div
        className={cn(
          'grid gap-3 sm:grid-cols-2 lg:grid-cols-6',
          filtersOpen ? 'animate-fade-in' : 'hidden lg:grid',
        )}
      >
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t('cases.filters.searchPlaceholder', {
              defaultValue: 'Search reference / description...',
            })}
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as WhistleblowingStatus | '');
            setPage(1);
          }}
        >
          <option value="">
            {t('cases.filters.allStatuses', { defaultValue: 'All statuses' })}
          </option>
          {WB_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {wbStatusLabelT(s, t)}
            </option>
          ))}
        </Select>
        <Select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value as WhistleblowingCategory | '');
            setPage(1);
          }}
        >
          <option value="">
            {t('cases.filters.allCategories', { defaultValue: 'All categories' })}
          </option>
          {WB_CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {wbCategoryLabelT(c, t)}
            </option>
          ))}
        </Select>
        <Select
          value={priority}
          onChange={(e) => {
            setPriority(e.target.value as InvestigationPriority | '');
            setPage(1);
          }}
        >
          <option value="">
            {t('cases.filters.allRiskRatings', { defaultValue: 'All risk ratings' })}
          </option>
          {WB_PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {wbPriorityLabelT(p, t)}
            </option>
          ))}
        </Select>
        <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={assignedToMe}
            onChange={(e) => {
              setAssignedToMe(e.target.checked);
              setPage(1);
            }}
            className="h-[18px] w-[18px] shrink-0 rounded border-border accent-signal"
          />
          {t('cases.filters.assignedToMe', { defaultValue: 'Assigned to me' })}
        </label>

        {/* View toggle. Hidden below `lg`, where the card view is forced. */}
        <div className="hidden items-center justify-start lg:flex lg:justify-end">
          <div className="flex items-center rounded-md border border-border bg-white p-0.5 dark:border-white/10 dark:bg-[#0b1626]">
            <button
              type="button"
              title={t('cases.view.grid', { defaultValue: 'Grid view' })}
              onClick={() => {
                setView('grid');
              }}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded transition-colors',
                view === 'grid'
                  ? 'bg-brand-accent text-white dark:bg-brand-accent'
                  : 'bg-white text-muted-foreground hover:bg-muted/60 dark:hover:bg-white/10',
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              title={t('cases.view.list', { defaultValue: 'List view' })}
              onClick={() => {
                setView('list');
              }}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded transition-colors',
                view === 'list'
                  ? 'bg-brand-accent text-white dark:bg-brand-accent'
                  : 'bg-white text-muted-foreground hover:bg-muted/60 dark:hover:bg-white/10',
              )}
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <Loader label={t('cases.loading', { defaultValue: 'Loading cases...' })} />
      ) : isError || data === undefined ? (
        <p className="text-sm text-destructive">{getApiErrorMessage(error)}</p>
      ) : data.data.length === 0 ? (
        <div className="rounded-lg border border-border bg-white p-10 text-center text-sm text-muted-foreground">
          {t('cases.empty', { defaultValue: 'No cases match your filters.' })}
        </div>
      ) : effectiveView === 'list' ? (
        <div className="overflow-hidden rounded-lg border border-border bg-white">
          <table className="w-full text-sm" dir={isRtl ? 'rtl' : 'ltr'}>
            <thead
              className={cn(
                'border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground/70',
                isRtl ? 'text-right' : 'text-left',
              )}
            >
              <tr>
                <th className={tableHeaderClass}>
                  {t('cases.table.reference', { defaultValue: 'Reference' })}
                </th>
                <th className={tableHeaderClass}>
                  {t('cases.table.category', { defaultValue: 'Category' })}
                </th>
                <th className={tableHeaderClass}>
                  {t('cases.table.risk', { defaultValue: 'Risk' })}
                </th>
                <th className={tableHeaderClass}>
                  {t('cases.table.status', { defaultValue: 'Status' })}
                </th>
                <th className={tableHeaderClass}>
                  {t('cases.table.investigator', { defaultValue: 'Investigator' })}
                </th>
                <th className={tableHeaderClass}>
                  {t('cases.table.sla', { defaultValue: 'SLA' })}
                </th>
                <th className={tableHeaderClass}>
                  {t('cases.table.submitted', { defaultValue: 'Submitted' })}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.data.map((c) => {
                const days = slaDaysRemaining(c.slaDeadline);
                const breached = c.slaBreachedAt !== null;
                const detailPath = ROUTES.WHISTLEBLOWING_DETAIL(c.id);
                const reporterLabel = c.isAnonymous
                  ? t('cases.reporter.anonymous', { defaultValue: 'Anonymous' })
                  : t('cases.reporter.named', { defaultValue: 'Named' });
                return (
                  <tr
                    key={c.id}
                    role="link"
                    tabIndex={0}
                    onClick={() => {
                      navigate(detailPath);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(detailPath);
                      }
                    }}
                    className="cursor-pointer transition-colors hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring"
                  >
                    <td className="px-4 py-3">
                      <ServerText className="case-id whitespace-nowrap font-semibold text-foreground">
                        {c.caseReferenceNumber}
                      </ServerText>
                      <div className="flex min-w-0 flex-wrap items-center gap-1 text-xs text-muted-foreground/70">
                        {reporterLabel} · {c.reporterAlias}
                        {c.hiddenFromCount > 0 && (
                          <span
                            className="inline-flex items-center gap-0.5 text-courage-strong"
                            title={t('cases.conflictExclusionsApplied', {
                              defaultValue: 'Conflict-of-interest exclusions applied',
                            })}
                          >
                            <ShieldOff className="h-3 w-3" />
                            {c.hiddenFromCount}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <WbCategoryBadge category={c.category} />
                    </td>
                    <td className="px-4 py-3">
                      <WbPriorityBadge priority={c.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <WbStatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.assignedInvestigator?.displayName ?? c.assignedInvestigator?.email ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {breached ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {t('cases.sla.breached', { defaultValue: 'Breached' })}
                        </span>
                      ) : days === null ? (
                        <span className="text-xs text-muted-foreground/70">—</span>
                      ) : (
                        <span
                          className={`text-xs ${days <= 7 ? 'font-medium text-courage-strong' : 'text-muted-foreground'}`}
                        >
                          {t('cases.sla.daysLeft', {
                            count: days,
                            defaultValue: '{{count}}d left',
                          })}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(c.submittedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.data.map((c) => {
            const days = slaDaysRemaining(c.slaDeadline);
            const breached = c.slaBreachedAt !== null;
            const reporterLabel = c.isAnonymous
              ? t('cases.reporter.anonymous', { defaultValue: 'Anonymous' })
              : t('cases.reporter.named', { defaultValue: 'Named' });
            return (
              <Link
                key={c.id}
                to={ROUTES.WHISTLEBLOWING_DETAIL(c.id)}
                className="lift group flex flex-col gap-2 rounded-xl border border-border bg-card p-4 hover:border-signal/40 hover:bg-signal-tint/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <ServerText className="case-id block truncate font-semibold text-foreground">
                      {c.caseReferenceNumber}
                    </ServerText>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground/70">
                      {reporterLabel} · {c.reporterAlias}
                      {c.hiddenFromCount > 0 && (
                        <span
                          className="inline-flex items-center gap-0.5 text-courage-strong"
                          title={t('cases.conflictExclusionsApplied', {
                            defaultValue: 'Conflict-of-interest exclusions applied',
                          })}
                        >
                          <ShieldOff className="h-3 w-3" />
                          {c.hiddenFromCount}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <WbCategoryBadge category={c.category} />
                  <WbPriorityBadge priority={c.priority} />
                  <WbStatusBadge status={c.status} />
                </div>

                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <ServerText className="truncate">
                    {c.assignedInvestigator?.displayName ??
                      c.assignedInvestigator?.email ??
                      t('cases.unassigned', { defaultValue: 'Unassigned' })}
                  </ServerText>
                  {breached ? (
                    <span className="inline-flex shrink-0 items-center gap-1 font-medium text-destructive">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {t('cases.sla.breached', { defaultValue: 'Breached' })}
                    </span>
                  ) : days !== null ? (
                    <span className={`shrink-0 ${days <= 7 ? 'font-medium text-courage-strong' : ''}`}>
                      {t('cases.sla.daysLeft', {
                        count: days,
                        defaultValue: '{{count}}d left',
                      })}
                    </span>
                  ) : null}
                </div>

                <p className="text-xs text-muted-foreground/70">{formatDate(c.submittedAt)}</p>
              </Link>
            );
          })}
        </div>
      )}

      {data !== undefined && (
        <Pagination
          meta={data.meta}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      )}

      <ManualCaseSheet
        isOpen={showManual}
        onClose={() => {
          setShowManual(false);
        }}
      />
    </div>
  );
}
