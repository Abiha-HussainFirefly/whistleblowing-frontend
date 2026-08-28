import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, LayoutGrid, List as ListIcon, Plus, Search, ShieldOff } from 'lucide-react';
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
  const canAdmin = has(WB_PERMISSIONS.admin);
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
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">
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

      {/* Filters */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={assignedToMe}
            onChange={(e) => {
              setAssignedToMe(e.target.checked);
              setPage(1);
            }}
            className="h-4 w-4 rounded border-slate-300"
          />
          {t('cases.filters.assignedToMe', { defaultValue: 'Assigned to me' })}
        </label>

        {/* View toggle */}
        <div className="flex items-center justify-start lg:justify-end">
          <div className="flex items-center rounded-md border border-slate-200 bg-white p-0.5 dark:border-white/10 dark:bg-[#0b1626]">
            <button
              type="button"
              title={t('cases.view.grid', { defaultValue: 'Grid view' })}
              onClick={() => {
                setView('grid');
              }}
              className={cn(
                'rounded p-1.5 transition-colors',
                view === 'grid'
                  ? 'bg-brand-accent text-white dark:bg-brand-accent'
                  : 'bg-white text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/10',
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
                'rounded p-1.5 transition-colors',
                view === 'list'
                  ? 'bg-brand-accent text-white dark:bg-brand-accent'
                  : 'bg-white text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/10',
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
        <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
      ) : data.data.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800">
          {t('cases.empty', { defaultValue: 'No cases match your filters.' })}
        </div>
      ) : view === 'list' ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <table className="w-full text-sm" dir={isRtl ? 'rtl' : 'ltr'}>
            <thead
              className={cn(
                'border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-700 dark:bg-slate-900/40',
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
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
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
                    className="cursor-pointer transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-accent/40 dark:hover:bg-slate-700/30"
                  >
                    <td className="px-4 py-3">
                      <ServerText className="font-medium text-slate-900 dark:text-slate-100">
                        {c.caseReferenceNumber}
                      </ServerText>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        {reporterLabel} · {c.reporterAlias}
                        {c.hiddenFromCount > 0 && (
                          <span
                            className="inline-flex items-center gap-0.5 text-amber-600"
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
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {c.assignedInvestigator?.displayName ?? c.assignedInvestigator?.email ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {breached ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {t('cases.sla.breached', { defaultValue: 'Breached' })}
                        </span>
                      ) : days === null ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (
                        <span
                          className={`text-xs ${days <= 7 ? 'font-medium text-amber-600' : 'text-slate-500'}`}
                        >
                          {t('cases.sla.daysLeft', {
                            count: days,
                            defaultValue: '{{count}}d left',
                          })}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(c.submittedAt)}</td>
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
                className="group flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 transition-all hover:border-brand-accent/40 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:hover:border-brand-accent/60"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <ServerText className="block truncate font-medium text-slate-900 dark:text-slate-100">
                      {c.caseReferenceNumber}
                    </ServerText>
                    <p className="flex items-center gap-1 text-xs text-slate-400">
                      {reporterLabel} · {c.reporterAlias}
                      {c.hiddenFromCount > 0 && (
                        <span
                          className="inline-flex items-center gap-0.5 text-amber-600"
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

                <div className="mt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <ServerText className="truncate">
                    {c.assignedInvestigator?.displayName ??
                      c.assignedInvestigator?.email ??
                      t('cases.unassigned', { defaultValue: 'Unassigned' })}
                  </ServerText>
                  {breached ? (
                    <span className="inline-flex shrink-0 items-center gap-1 font-medium text-red-600">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {t('cases.sla.breached', { defaultValue: 'Breached' })}
                    </span>
                  ) : days !== null ? (
                    <span className={`shrink-0 ${days <= 7 ? 'font-medium text-amber-600' : ''}`}>
                      {t('cases.sla.daysLeft', {
                        count: days,
                        defaultValue: '{{count}}d left',
                      })}
                    </span>
                  ) : null}
                </div>

                <p className="text-xs text-slate-400">{formatDate(c.submittedAt)}</p>
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
