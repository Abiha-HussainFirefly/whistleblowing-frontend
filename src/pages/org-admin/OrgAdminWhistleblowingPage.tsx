import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { type TFunction } from 'i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Eye,
  FileWarning,
  FolderOpen,
  Globe,
  LayoutDashboard,
  LayoutGrid,
  List as ListIcon,
  MessageSquareWarning,
  Search,
  ShieldOff,
  Table2,
  Timer,
  UserCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { Loader } from '@components/common/Loader';
import { Input } from '@components/ui/input';
import { PageTitle } from '@components/ui/page-title';
import { Select } from '@components/ui/select';
import { regionName } from '@components/ui/region-select';
import { ROUTES } from '@config/routes';
import { cn } from '@lib/utils';
import { getApiErrorMessage } from '@lib/api-error';
import {
  useWbOversightCases,
  useWbOversightScope,
  useWbOversightStats,
} from '@features/org-admin/hooks/whistleblowing-oversight';
import {
  WB_CATEGORY_OPTIONS,
  WB_PRIORITY_OPTIONS,
  WB_STATUS_OPTIONS,
  formatDate,
  slaDaysRemaining,
  wbCategoryLabel,
  wbCategoryLabelOf,
  wbPriorityLabel,
  wbPriorityLabelOf,
  wbStatusLabel,
  wbStatusLabelOf,
} from '@features/whistleblowing/utils/format';
import {
  WbCategoryBadge,
  WbPriorityBadge,
  WbStatusBadge,
} from '@pages/whistleblowing/components/WbBadges';
import type {
  InvestigationPriority,
  WhistleblowingCategory,
  WhistleblowingStatus,
} from '@features/whistleblowing/types';

type TabKey = 'overview' | 'register';
type ViewMode = 'grid' | 'list';
const PAGE_SIZE = 10;

// ── Palette (brand-first, cycles for overflow categories) ──────────────────
const CHART_COLORS = [
  '#6F56D9', // brand-accent (teal)
  '#3b82f6', // blue-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#22c55e', // green-500
  '#8b5cf6', // purple-500
  '#4B2E58', // brand-primary (navy)
  '#94a3b8', // slate-400 (overflow)
];

function colorFor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length] ?? '#94a3b8';
}

function ChartCard({
  title,
  description,
  emptyLabel,
  isEmpty,
  children,
}: {
  title: string;
  description?: string;
  emptyLabel: string;
  isEmpty: boolean;
  children: ReactElement;
}): ReactElement {
  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description !== undefined && <p className="text-xs text-muted-foreground/70">{description}</p>}
      <div className="mt-4">
        {isEmpty ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground/70">
            {emptyLabel}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: ReactElement;
}): ReactElement {
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">{label}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-accent/10 text-brand-accent">
          {icon}
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function RadialStatusChart({ data }: { data: Record<string, number> }): ReactElement {
  const entries = Object.entries(data)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const max = entries.reduce((m, [, v]) => Math.max(m, v), 1);
  const chartData = entries.map(([key, value], i) => ({
    name: wbStatusLabelOf(key),
    value,
    fill: colorFor(i),
  }));

  return (
    <div className="flex items-center gap-6">
      <div className="h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="35%"
            outerRadius="100%"
            data={chartData}
            startAngle={90}
            endAngle={-270}
            barSize={12}
          >
            <RadialBar background dataKey="value" cornerRadius={6} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-1.5">
        {chartData.map((d) => (
          <li key={d.name} className="flex min-w-0 items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: d.fill }}
              aria-hidden="true"
            />
            {/* The label yields space; the value never does — it is the datum. */}
            <span className="min-w-0 truncate text-muted-foreground">{d.name}</span>
            <span className="ms-auto shrink-0 font-medium tabular-nums text-foreground">{d.value}</span>
          </li>
        ))}
      </ul>
      <span className="sr-only">Max {max}</span>
    </div>
  );
}

function SubmissionsTrendChart({
  data,
  label,
}: {
  data: { month: string; count: number }[];
  label: string;
}): ReactElement {
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="wbTrendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6F56D9" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#6F56D9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            width={24}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#e2e8f0' }}
            labelStyle={{ fontWeight: 600 }}
          />
          <Area
            type="monotone"
            dataKey="count"
            name={label}
            stroke="#6F56D9"
            strokeWidth={2}
            fill="url(#wbTrendFill)"
            dot={{ r: 3, fill: '#6F56D9' }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-brand-accent" />
        {label}
      </div>
    </div>
  );
}

function VerticalColumnChart({
  data,
  labelOf,
}: {
  data: Record<string, number>;
  labelOf: (k: string) => string;
}): ReactElement {
  const chartData = Object.entries(data)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => ({ name: labelOf(key), value }));

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 16, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="wbColumnFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6F56D9" />
              <stop offset="100%" stopColor="#9fd3d8" />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <YAxis hide allowDecimals={false} />
          <Tooltip
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#e2e8f0' }}
          />
          <Bar dataKey="value" fill="url(#wbColumnFill)" radius={[6, 6, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function CategoryPieChart({
  data,
  labelOf,
}: {
  data: Record<string, number>;
  labelOf: (k: string) => string;
}): ReactElement {
  const entries = Object.entries(data).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
  const chartData = entries.map(([key, value], i) => ({
    name: labelOf(key),
    value,
    fill: colorFor(i),
  }));

  return (
    <div className="flex items-center gap-6">
      <div className="h-36 w-36 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" outerRadius="90%">
              {chartData.map((d) => (
                <Cell key={d.name} fill={d.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-1.5">
        {chartData.map((d) => (
          <li key={d.name} className="flex min-w-0 items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: d.fill }}
              aria-hidden="true"
            />
            {/* The label yields space; the value never does — it is the datum. */}
            <span className="min-w-0 truncate text-muted-foreground">{d.name}</span>
            <span className="ms-auto shrink-0 whitespace-nowrap font-medium tabular-nums text-foreground">
              {d.value} ({Math.round((d.value / total) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AnonymousDonutChart({
  anonymousCount,
  namedCount,
  anonymousLabel,
  namedLabel,
  totalLabel,
}: {
  anonymousCount: number;
  namedCount: number;
  anonymousLabel: string;
  namedLabel: string;
  totalLabel: string;
}): ReactElement {
  const total = anonymousCount + namedCount;
  const chartData = [
    { name: anonymousLabel, value: anonymousCount, fill: '#6F56D9' },
    { name: namedLabel, value: namedCount, fill: '#3b82f6' },
  ].filter((d) => d.value > 0);

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-36 w-36 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius="65%"
              outerRadius="90%"
              paddingAngle={total > 0 ? 2 : 0}
            >
              {chartData.map((d) => (
                <Cell key={d.name} fill={d.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold text-foreground">{total}</span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">{totalLabel}</span>
        </div>
      </div>
      <ul className="space-y-1.5">
        {chartData.map((d) => (
          <li key={d.name} className="flex min-w-0 items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: d.fill }}
              aria-hidden="true"
            />
            {/* The label yields space; the value never does — it is the datum. */}
            <span className="min-w-0 truncate text-muted-foreground">{d.name}</span>
            <span className="ms-auto shrink-0 whitespace-nowrap font-medium tabular-nums text-foreground">
              {d.value} ({total > 0 ? Math.round((d.value / total) * 100) : 0}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function OrgAdminWhistleblowingPage(): ReactElement {
  const { t } = useTranslation('whistleblowing');
  const [searchParams] = useSearchParams();
  const urlRegion = searchParams.get('regionCode') ?? '';
  const [tab, setTab] = useState<TabKey>('overview');
  const [view, setView] = useState<ViewMode>('list');
  const [region, setRegion] = useState(urlRegion);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<WhistleblowingStatus | ''>('');
  const [category, setCategory] = useState<WhistleblowingCategory | ''>('');
  const [priority, setPriority] = useState<InvestigationPriority | ''>('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setRegion(urlRegion);
    setPage(1);
  }, [urlRegion]);

  const { data: scope } = useWbOversightScope();
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    error: statsErr,
  } = useWbOversightStats(region.length > 0 ? { regionCode: region } : undefined);

  const caseParams = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      ...(region.length > 0 ? { regionCode: region } : {}),
      ...(search.trim().length > 0 ? { search: search.trim() } : {}),
      ...(status !== '' ? { status } : {}),
      ...(category !== '' ? { category } : {}),
      ...(priority !== '' ? { priority } : {}),
    }),
    [page, region, search, status, category, priority],
  );
  const { data: caseList, isLoading: casesLoading } = useWbOversightCases(caseParams);

  const regionOptions = scope?.regions ?? [];
  const showRegionFilter = scope !== undefined && (scope.isCrossRegion || regionOptions.length > 1);
  const total = caseList?.meta.total ?? 0;
  const totalPages = caseList?.meta.totalPages ?? 1;

  const tabs: { key: TabKey; label: string; icon: typeof Table2; count?: number }[] = [
    { key: 'overview', label: t('oversight.tabs.overview'), icon: LayoutDashboard },
    { key: 'register', label: t('oversight.tabs.register'), icon: Table2, count: total },
  ];

  return (
    <div className="space-y-6">
      {/* Header + region filter */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-accent text-white">
            <MessageSquareWarning className="h-5 w-5" />
          </div>
          <div>
            <PageTitle className="text-foreground">{t('oversight.title')}</PageTitle>
            <p className="mt-1 text-sm text-muted-foreground">{t('oversight.subtitle')}</p>
          </div>
        </div>

        {showRegionFilter && (
          <div className="relative">
            <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-accent" />
            <Select
              aria-label={t('oversight.filters.region')}
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
                setPage(1);
              }}
              className="w-48 pl-9"
            >
              <option value="">{t('oversight.filters.allRegions')}</option>
              {regionOptions.map((r) => (
                <option key={r.regionCode} value={r.regionCode}>
                  {regionName(r.regionCode)} ({r.caseCount})
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {/* CoI notice */}
      <div className="flex items-start gap-2 rounded-lg border border-courage/35 bg-courage-tint/60 px-4 py-2.5 text-xs text-courage-strong">
        <ShieldOff className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{t('oversight.confidentialityNotice')}</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key);
              }}
              className={cn(
                'flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'border-brand-accent text-brand-accent'
                  : 'border-transparent text-muted-foreground hover:border-brand-accent hover:text-brand-accent',
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span
                  className={cn(
                    'rounded-full px-1.5 text-xs font-medium',
                    active ? 'bg-brand-accent/10 text-brand-accent' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Overview */}
      {tab === 'overview' &&
        (statsLoading ? (
          <Loader label="Loading whistleblowing analytics…" />
        ) : statsError || stats === undefined ? (
          <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive">
            {getApiErrorMessage(statsErr, t('oversight.errors.analytics'))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label={t('oversight.stats.totalCases')}
                value={stats.total}
                icon={<FolderOpen className="h-4 w-4" />}
              />
              <StatCard
                label={t('oversight.stats.open')}
                value={stats.open}
                icon={<FileWarning className="h-4 w-4" />}
              />
              <StatCard
                label={t('oversight.stats.escalated')}
                value={stats.escalated}
                icon={<AlertTriangle className="h-4 w-4" />}
              />
              <StatCard
                label={t('oversight.stats.slaBreached')}
                value={stats.slaBreached}
                icon={<AlertTriangle className="h-4 w-4" />}
              />
              <StatCard
                label={t('oversight.stats.underInvestigation')}
                value={stats.underInvestigation}
                icon={<Timer className="h-4 w-4" />}
              />
              <StatCard
                label={t('oversight.stats.slaAtRisk')}
                value={stats.slaAtRisk}
                icon={<Timer className="h-4 w-4" />}
              />
              <StatCard
                label={t('oversight.stats.closed')}
                value={stats.closed}
                icon={<FolderOpen className="h-4 w-4" />}
              />
              <StatCard
                label={t('oversight.stats.avgResolution')}
                value={
                  stats.avgResolutionDays !== null ? `${String(stats.avgResolutionDays)} d` : '—'
                }
                icon={<Timer className="h-4 w-4" />}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard
                title={t('oversight.charts.casesByStatus.title')}
                description={t('oversight.charts.casesByStatus.description')}
                emptyLabel={t('oversight.emptyChart')}
                isEmpty={Object.values(stats.byStatus).every((v) => v === 0)}
              >
                <RadialStatusChart data={stats.byStatus} />
              </ChartCard>
              <ChartCard
                title={t('oversight.charts.submissionsTrend.title')}
                description={t('oversight.charts.submissionsTrend.description')}
                emptyLabel={t('oversight.emptyChart')}
                isEmpty={stats.submissionsByMonth.length === 0}
              >
                <SubmissionsTrendChart
                  data={stats.submissionsByMonth}
                  label={t('oversight.charts.submissionsTrend.series')}
                />
              </ChartCard>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <ChartCard
                title={t('oversight.charts.byCategory.title')}
                emptyLabel={t('oversight.emptyChart')}
                isEmpty={Object.values(stats.byCategory).every((v) => v === 0)}
              >
                <VerticalColumnChart data={stats.byCategory} labelOf={wbCategoryLabelOf} />
              </ChartCard>
              <ChartCard
                title={t('oversight.charts.byRiskRating.title')}
                emptyLabel={t('oversight.emptyChart')}
                isEmpty={Object.values(stats.byPriority).every((v) => v === 0)}
              >
                <CategoryPieChart data={stats.byPriority} labelOf={wbPriorityLabelOf} />
              </ChartCard>
              <ChartCard
                title={t('oversight.charts.anonymousVsNamed.title')}
                description={t('oversight.charts.anonymousVsNamed.description')}
                emptyLabel={t('oversight.emptyChart')}
                isEmpty={stats.anonymousCount === 0 && stats.namedCount === 0}
              >
                <AnonymousDonutChart
                  anonymousCount={stats.anonymousCount}
                  namedCount={stats.namedCount}
                  anonymousLabel={t('cases.reporter.anonymous')}
                  namedLabel={t('cases.reporter.named')}
                  totalLabel={t('oversight.total')}
                />
              </ChartCard>
            </div>
          </div>
        ))}

      {/* Case register */}

      {tab === 'register' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Select
                aria-label={t('cases.table.status')}
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as WhistleblowingStatus | '');
                  setPage(1);
                }}
                className="h-9 w-40 bg-white"
              >
                <option value="">{t('cases.filters.allStatuses')}</option>
                {WB_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {wbStatusLabel(s)}
                  </option>
                ))}
              </Select>
              <Select
                aria-label={t('cases.table.category')}
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as WhistleblowingCategory | '');
                  setPage(1);
                }}
                className="h-9 w-48 bg-white"
              >
                <option value="">{t('cases.filters.allCategories')}</option>
                {WB_CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {wbCategoryLabel(c)}
                  </option>
                ))}
              </Select>
              <Select
                aria-label={t('cases.table.risk')}
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value as InvestigationPriority | '');
                  setPage(1);
                }}
                className="h-9 w-40 bg-white"
              >
                <option value="">{t('cases.filters.allRiskRatings')}</option>
                {WB_PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {wbPriorityLabel(p)}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                <Input
                  placeholder={t('cases.filters.searchPlaceholder')}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 w-56 bg-white pl-8"
                />
              </div>
              <div className="flex items-center rounded-md border border-border bg-white p-0.5">
                <button
                  type="button"
                  title={t('cases.view.grid')}
                  onClick={() => {
                    setView('grid');
                  }}
                  className={cn(
                    'rounded p-1.5 transition-colors',
                    view === 'grid'
                      ? 'bg-brand-accent text-white'
                      : 'bg-white text-muted-foreground hover:bg-muted/60',
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title={t('cases.view.list')}
                  onClick={() => {
                    setView('list');
                  }}
                  className={cn(
                    'rounded p-1.5 transition-colors',
                    view === 'list'
                      ? 'bg-brand-accent text-white'
                      : 'bg-white text-muted-foreground hover:bg-muted/60',
                  )}
                >
                  <ListIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {casesLoading ? (
            <Loader label={t('cases.loading')} />
          ) : caseList === undefined || caseList.data.length === 0 ? (
            <div className="rounded-lg border border-border bg-white px-5 py-12 text-center text-sm text-muted-foreground/70">
              {t('cases.empty')}
            </div>
          ) : view === 'list' ? (
            <>
              <div className="overflow-hidden rounded-lg border border-border bg-white">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground/70">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">{t('cases.table.reference')}</th>
                      <th className="px-4 py-2.5 font-medium">{t('cases.table.category')}</th>
                      <th className="px-4 py-2.5 font-medium">{t('cases.table.risk')}</th>
                      <th className="px-4 py-2.5 font-medium">{t('cases.table.status')}</th>
                      <th className="px-4 py-2.5 font-medium">{t('cases.table.investigator')}</th>
                      <th className="px-4 py-2.5 font-medium">{t('cases.table.sla')}</th>
                      <th className="px-4 py-2.5 font-medium">{t('cases.table.submitted')}</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {caseList.data.map((c) => {
                      const days = slaDaysRemaining(c.slaDeadline);
                      const breached = c.slaBreachedAt !== null;
                      return (
                        <tr key={c.id} className="hover:bg-muted/60">
                          <td className="px-4 py-3">
                            <Link
                              to={ROUTES.ORG_ADMIN.WHISTLEBLOWING_CASE_DETAIL(c.id)}
                              className="font-medium text-foreground hover:text-brand-primary"
                            >
                              {c.caseReferenceNumber}
                            </Link>
                            <div className="text-xs text-muted-foreground/70">
                              {c.isAnonymous
                                ? t('cases.reporter.anonymous')
                                : t('cases.reporter.named')}
                              {region.length === 0 && c.regionCode !== null
                                ? ` · ${regionName(c.regionCode)}`
                                : ''}
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
                            {c.assignedInvestigator?.displayName ??
                              c.assignedInvestigator?.email ??
                              '—'}
                          </td>
                          <td className="px-4 py-3">
                            {breached ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                {t('cases.sla.breached')}
                              </span>
                            ) : days === null ? (
                              <span className="text-xs text-muted-foreground/70">—</span>
                            ) : (
                              <span
                                className={`text-xs ${days <= 7 ? 'font-medium text-courage-strong' : 'text-muted-foreground'}`}
                              >
                                {t('cases.sla.daysLeft', { count: days })}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{formatDate(c.submittedAt)}</td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              to={ROUTES.ORG_ADMIN.WHISTLEBLOWING_CASE_DETAIL(c.id)}
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-brand-primary"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              {t('cases.actions.view')}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <RegisterPagination
                page={page}
                totalPages={totalPages}
                total={total}
                onPage={setPage}
                t={t}
              />
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {caseList.data.map((c) => {
                  const days = slaDaysRemaining(c.slaDeadline);
                  const breached = c.slaBreachedAt !== null;
                  return (
                    <Link
                      key={c.id}
                      to={ROUTES.ORG_ADMIN.WHISTLEBLOWING_CASE_DETAIL(c.id)}
                      className="group flex flex-col gap-3 rounded-lg border border-border bg-white p-4 transition-all hover:border-brand-accent/40 hover:shadow-sm"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-accent/10 text-brand-accent">
                          <MessageSquareWarning className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground group-hover:text-brand-primary">
                            {c.caseReferenceNumber}
                          </p>
                          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground/70">
                            <UserCircle2 className="h-3 w-3" />
                            {c.isAnonymous
                              ? t('cases.reporter.anonymous')
                              : t('cases.reporter.named')}
                            {c.regionCode !== null ? ` · ${regionName(c.regionCode)}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <WbCategoryBadge category={c.category} />
                        <WbPriorityBadge priority={c.priority} />
                        <WbStatusBadge status={c.status} />
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground/70">
                        <span>
                          {c.assignedInvestigator?.displayName ??
                            c.assignedInvestigator?.email ??
                            t('cases.unassigned')}
                        </span>
                        {breached ? (
                          <span className="inline-flex items-center gap-1 font-medium text-destructive">
                            <AlertTriangle className="h-3 w-3" />
                            {t('cases.sla.breached')}
                          </span>
                        ) : days !== null ? (
                          <span className={days <= 7 ? 'font-medium text-courage-strong' : ''}>
                            {t('cases.sla.daysLeft', { count: days })}
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  );
                })}
              </div>

              <RegisterPagination
                page={page}
                totalPages={totalPages}
                total={total}
                onPage={setPage}
                t={t}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function RegisterPagination({
  page,
  totalPages,
  total,
  onPage,
  t,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPage: (updater: (p: number) => number) => void;
  t: TFunction;
}): ReactElement {
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>{t('cases.pagination.total', { count: total })}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => {
            onPage((p) => Math.max(1, p - 1));
          }}
          className="rounded-md border border-border px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('cases.pagination.previous')}
        </button>
        <span className="text-xs text-muted-foreground/70">
          {t('cases.pagination.pageOf', { page, totalPages })}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => {
            onPage((p) => Math.min(totalPages, p + 1));
          }}
          className="rounded-md border border-border px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('cases.pagination.next')}
        </button>
      </div>
    </div>
  );
}
