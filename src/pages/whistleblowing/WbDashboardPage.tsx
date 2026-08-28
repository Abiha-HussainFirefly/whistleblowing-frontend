import { Loader } from '@components/common/Loader';
import { Button } from '@components/ui/button';
import { ROUTES } from '@config/routes';
import {
  CHART_COLORS,
  CHART_TOOLTIP_STYLE,
  colorAt,
} from '@features/contracts/components/charts/palette';
import { downloadWbCsv } from '@features/whistleblowing/api/wb.service';
import { ShareReportingLink } from '@features/whistleblowing/components/ShareReportingLink';
import { useWbStats } from '@features/whistleblowing/hooks';
import {
  wbCategoryLabelT,
  wbPriorityLabelT,
  wbStatusLabelT,
} from '@features/whistleblowing/utils/i18n';
import type {
  InvestigationPriority,
  WhistleblowingCategory,
  WhistleblowingStatus,
} from '@features/whistleblowing/types';
import { getApiErrorMessage } from '@lib/api-error';
import {
  AlertTriangle,
  Clock,
  Download,
  FileWarning,
  FolderOpen,
  type LucideIcon,
} from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { WbHeader } from './components/WbHeader';

const TOOLTIP_ITEM_STYLE = { fontSize: '12px', color: CHART_COLORS.navy };

function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  hint,
  hintTone = 'default',
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  hint?: string;
  hintTone?: 'default' | 'danger';
}): ReactElement {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label.toUpperCase()}
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
          {typeof hint === 'string' && hint.length > 0 ? (
            <p
              className={`mt-1 text-xs font-medium ${
                hintTone === 'danger'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {hint}
            </p>
          ) : null}
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

interface ChartCardProps {
  title: string;
  description?: string;
  isEmpty: boolean;
  emptyLabel: string;
  children: ReactElement;
}

function ChartCard({
  title,
  description,
  isEmpty,
  emptyLabel,
  children,
}: ChartCardProps): ReactElement {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        {typeof description === 'string' && description.length > 0 && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
      {isEmpty ? (
        <div className="flex h-56 items-center justify-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">{emptyLabel}</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function ReportsByCategoryChart({
  data,
}: {
  data: { name: string; value: number; fill: string }[];
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="chart-cq" dir="ltr">
      <div className="chart-cq-row">
        <div className="chart-cq-canvas">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 6, right: 6, bottom: 6, left: 6 }}>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="58%"
                outerRadius="84%"
                paddingAngle={2}
                stroke="#fff"
                strokeWidth={2}
              >
                {data.map((item) => (
                  // eslint-disable-next-line @typescript-eslint/no-deprecated
                  <Cell key={item.name} fill={item.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul
          className="chart-cq-legend min-w-0"
          style={{ alignItems: 'stretch', justifyContent: 'flex-start', textAlign: 'left' }}
        >
          {data.map((item) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <li
                key={item.name}
                className="flex w-full max-w-[22rem] items-start gap-2 text-left text-xs"
              >
                <span
                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="min-w-0 flex-1 break-words text-slate-600 dark:text-slate-300">
                  {item.name}
                </span>
                <span className="shrink-0 font-semibold text-slate-900 dark:text-slate-100">
                  {item.value}
                </span>
                <span className="shrink-0 text-slate-400">({pct}%)</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function OpenVsEscalatedChart({
  open,
  escalated,
  openLabel,
  escalatedLabel,
}: {
  open: number;
  escalated: number;
  openLabel: string;
  escalatedLabel: string;
}): ReactElement {
  const data = [
    { name: openLabel, cases: open },
    { name: escalatedLabel, cases: escalated },
  ];

  return (
    <div className="flex h-72 w-full flex-col justify-between">
      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 15, right: 15, left: -25, bottom: 5 }}>
            <defs>
              <linearGradient id="openEscalatedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.teal} stopOpacity={0.2} />
                <stop offset="95%" stopColor={CHART_COLORS.teal} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" tickLine={false} />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="#94a3b8"
              allowDecimals={false}
              axisLine={false}
            />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} />
            <Area
              type="monotone"
              dataKey="cases"
              stroke={CHART_COLORS.teal}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#openEscalatedGrad)"
              activeDot={{ r: 6, fill: CHART_COLORS.navy }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ReportsByPriorityChart({ data }: { data: { name: string; count: number }[] }) {
  return (
    <div className="flex h-80 w-full items-end justify-center gap-16 px-4 pb-4">
      {data.slice(0, 2).map((item, idx) => {
        const idString = idx.toString();
        return (
          <div key={idString} className="flex flex-col items-center">
            <ResponsiveContainer width={110} height={210}>
              <BarChart data={[item]} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`grad${idString}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colorAt(idx)} stopOpacity={1} />
                    <stop offset="100%" stopColor={colorAt(idx)} stopOpacity={0.4} />
                  </linearGradient>
                </defs>

                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={CHART_TOOLTIP_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                />

                <Bar
                  dataKey="count"
                  fill={`url(#grad${idString})`}
                  radius={[4, 4, 0, 0]}
                  barSize={65}
                  style={{ cursor: 'pointer' }}
                />
              </BarChart>
            </ResponsiveContainer>
            <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-400">
              {item.name}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function ReportsByStatusChart({ data }: { data: { name: string; count: number; fill: string }[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={0}
            outerRadius={95}
            paddingAngle={1}
            dataKey="count"
          />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function AnonymousVsNamedChart({
  anonymous,
  named,
  anonymousLabel,
  namedLabel,
}: {
  anonymous: number;
  named: number;
  anonymousLabel: string;
  namedLabel: string;
}): ReactElement {
  const total = anonymous + named;
  const anonPercentage = total > 0 ? ((anonymous / total) * 100).toFixed(0) : '0';
  const namedPercentage = total > 0 ? ((named / total) * 100).toFixed(0) : '0';

  return (
    <div className="h-72 w-full">
      <div className="flex h-full flex-col justify-center gap-6">
        {/* Anonymous */}
        <div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {anonymousLabel}
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{anonymous}</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: CHART_COLORS.teal }}>
              {anonPercentage}%
            </p>
          </div>
          <div className="mt-3 h-1 w-full rounded-full bg-slate-100 dark:bg-slate-700">
            <div
              className="h-full rounded-full"
              style={{ width: `${anonPercentage}%`, backgroundColor: CHART_COLORS.teal }}
            />
          </div>
        </div>

        {/* Named */}
        <div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{namedLabel}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{named}</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: CHART_COLORS.navy }}>
              {namedPercentage}%
            </p>
          </div>
          <div className="mt-3 h-1 w-full rounded-full bg-slate-100 dark:bg-slate-700">
            <div
              className="h-full rounded-full"
              style={{ width: `${namedPercentage}%`, backgroundColor: CHART_COLORS.navy }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SubmissionsTrendChart({
  data,
}: {
  data: { month: string; count: number }[];
}): ReactElement {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.teal} stopOpacity={0.3} />
              <stop offset="95%" stopColor={CHART_COLORS.teal} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="month"
            tickFormatter={(value: string) => value.slice(5)}
            tick={{ fontSize: 11 }}
            stroke="#94a3b8"
          />
          <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} />
          <Area
            type="monotone"
            dataKey="count"
            stroke={CHART_COLORS.navy}
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#trendGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WbDashboardPage(): ReactElement {
  const { t } = useTranslation('whistleblowing');
  const { data: stats, isLoading, isError, error } = useWbStats();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const onExport = (): void => {
    setExporting(true);
    setExportError(null);
    downloadWbCsv()
      .catch((e: unknown) => {
        setExportError(getApiErrorMessage(e));
      })
      .finally(() => {
        setExporting(false);
      });
  };

  const categoryData = stats
    ? Object.entries(stats.byCategory).map(([k, v], index) => ({
        name: wbCategoryLabelT(k as WhistleblowingCategory, t),
        value: v,
        fill: colorAt(index),
      }))
    : [];

  const statusData = stats
    ? Object.entries(stats.byStatus).map(([k, v], index) => ({
        name: wbStatusLabelT(k as WhistleblowingStatus, t),
        count: v,
        fill: colorAt(index),
      }))
    : [];

  const priorityData = stats
    ? Object.entries(stats.byPriority).map(([k, v]) => ({
        name: wbPriorityLabelT(k as InvestigationPriority, t),
        count: v,
      }))
    : [];
  const emptyChartLabel = t('dashboard.empty', { defaultValue: 'No data to display yet.' });

  return (
    <div className="space-y-6">
      <WbHeader />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">
          {t('dashboard.title', { defaultValue: 'Board-ready overview' })}
        </h2>
        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <Button
            variant="outline"
            className="h-9 w-full justify-center whitespace-nowrap px-4 sm:w-auto sm:min-w-[9rem]"
            asChild
          >
            <Link to={ROUTES.REPORT_CONCERN}>
              {t('dashboard.actions.submitReport', { defaultValue: 'Submit a report' })}
            </Link>
          </Button>
          <Button
            variant="outline"
            className="h-9 w-full justify-center whitespace-nowrap px-4 sm:w-auto sm:min-w-[9rem]"
            onClick={onExport}
            disabled={exporting}
          >
            <Download className="h-4 w-4" />
            {exporting
              ? t('dashboard.actions.exporting', { defaultValue: 'Exporting...' })
              : t('dashboard.actions.exportCsv', { defaultValue: 'Export CSV' })}
          </Button>
          <Button
            className="h-9 w-full justify-center whitespace-nowrap bg-[#007d89] px-4 text-white hover:bg-[#007d89]/90 sm:w-auto sm:min-w-[9rem]"
            asChild
          >
            <Link to={ROUTES.WHISTLEBLOWING_REGISTER}>
              {t('dashboard.actions.viewAllCases', { defaultValue: 'View all cases' })}
            </Link>
          </Button>
        </div>
      </div>

      {exportError !== null && <p className="text-sm text-red-600">{exportError}</p>}

      <ShareReportingLink />
      <span className="sr-only">TOTAL REPORTS</span>

      {isLoading ? (
        <Loader label={t('dashboard.loading', { defaultValue: 'Loading analytics...' })} />
      ) : isError || stats === undefined ? (
        <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={t('dashboard.kpi.totalReports', { defaultValue: 'Total Reports' })}
              value={stats.total}
              icon={FolderOpen}
              iconColor="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
              hint={t('dashboard.kpi.closed', {
                count: stats.closed,
                defaultValue: '{{count}} closed',
              })}
            />
            <StatCard
              label={t('dashboard.kpi.openReports', { defaultValue: 'Open Reports' })}
              value={stats.open}
              icon={FileWarning}
              iconColor="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
            />
            <StatCard
              label={t('dashboard.kpi.underInvestigation', {
                defaultValue: 'Under Investigation',
              })}
              value={stats.underInvestigation}
              icon={Clock}
              iconColor="bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400"
              hint={
                stats.slaAtRisk > 0
                  ? t('dashboard.kpi.atRisk', {
                      count: stats.slaAtRisk,
                      defaultValue: '{{count}} at risk',
                    })
                  : t('dashboard.kpi.onTrack', { defaultValue: 'On track' })
              }
              hintTone={stats.slaAtRisk > 0 ? 'danger' : 'default'}
            />
            <StatCard
              label={t('dashboard.kpi.escalated', { defaultValue: 'Escalated' })}
              value={stats.escalated}
              icon={AlertTriangle}
              iconColor="bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400"
              hint={t('dashboard.kpi.slaBreached', {
                count: stats.slaBreached,
                defaultValue: '{{count}} SLA breached',
              })}
              hintTone={stats.slaBreached > 0 ? 'danger' : 'default'}
            />
          </div>

          {/* Charts row 1 */}
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title={t('dashboard.charts.reportsByCategory.title', {
                defaultValue: 'Reports by Category',
              })}
              description={t('dashboard.charts.reportsByCategory.description', {
                defaultValue: 'Distribution across the lifecycle',
              })}
              isEmpty={categoryData.length === 0}
              emptyLabel={emptyChartLabel}
            >
              <ReportsByCategoryChart data={categoryData} />
            </ChartCard>
            <ChartCard
              title={t('dashboard.charts.openVsEscalated.title', {
                defaultValue: 'Open vs Escalated',
              })}
              description={t('dashboard.charts.openVsEscalated.description', {
                defaultValue: 'Current intake against escalations',
              })}
              isEmpty={stats.open === 0 && stats.escalated === 0}
              emptyLabel={emptyChartLabel}
            >
              <OpenVsEscalatedChart
                open={stats.open}
                escalated={stats.escalated}
                openLabel={t('dashboard.series.openCases', { defaultValue: 'Open Cases' })}
                escalatedLabel={t('dashboard.series.escalatedCases', {
                  defaultValue: 'Escalated Cases',
                })}
              />
            </ChartCard>
          </div>

          {/* Charts row 2 */}
          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard
              title={t('dashboard.charts.reportsByPriority.title', {
                defaultValue: 'Reports by Priority',
              })}
              isEmpty={priorityData.length === 0}
              emptyLabel={emptyChartLabel}
            >
              <ReportsByPriorityChart data={priorityData} />
            </ChartCard>
            <ChartCard
              title={t('dashboard.charts.reportsByStatus.title', {
                defaultValue: 'Reports by Status',
              })}
              isEmpty={statusData.length === 0}
              emptyLabel={emptyChartLabel}
            >
              <ReportsByStatusChart data={statusData} />
            </ChartCard>
            <ChartCard
              title={t('dashboard.charts.anonymousVsNamed.title', {
                defaultValue: 'Anonymous vs Named',
              })}
              description={t('dashboard.charts.anonymousVsNamed.description', {
                defaultValue: 'Reporting anonymity split',
              })}
              isEmpty={stats.anonymousCount === 0 && stats.namedCount === 0}
              emptyLabel={emptyChartLabel}
            >
              <AnonymousVsNamedChart
                anonymous={stats.anonymousCount}
                named={stats.namedCount}
                anonymousLabel={t('dashboard.series.anonymous', { defaultValue: 'Anonymous' })}
                namedLabel={t('dashboard.series.named', { defaultValue: 'Named' })}
              />
            </ChartCard>
          </div>

          {/* Submissions trend */}
          <ChartCard
            title={t('dashboard.charts.submissionsTrend.title', {
              defaultValue: 'Submissions Trend',
            })}
            description={t('dashboard.charts.submissionsTrend.description', {
              defaultValue: 'Monthly intake (last 6 months)',
            })}
            isEmpty={stats.submissionsByMonth.length === 0}
            emptyLabel={emptyChartLabel}
          >
            <SubmissionsTrendChart data={stats.submissionsByMonth} />
          </ChartCard>
        </>
      )}
    </div>
  );
}
