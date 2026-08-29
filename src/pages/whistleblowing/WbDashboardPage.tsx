import { Loader } from '@components/common/Loader';
import { Button } from '@components/ui/button';
import { SectionHeader, SurfaceCard } from '@components/ui/surface';
import { StatTile } from '@components/ui/stat-tile';
import { StatusPill } from '@components/ui/status-pill';
import { ROUTES } from '@config/routes';
import {
  CHART_COLORS,
  CHART_TOOLTIP_STYLE,
  colorAt,
  colorForTone,
} from '@features/contracts/components/charts/palette';
import { downloadWbCsv } from '@features/whistleblowing/api/wb.service';
import { ShareReportingLink } from '@features/whistleblowing/components/ShareReportingLink';
import { useWbStats } from '@features/whistleblowing/hooks';
import {
  wbCategoryLabelT,
  wbStatusLabelT,
} from '@features/whistleblowing/utils/i18n';
import { wbStatusTone } from '@features/whistleblowing/utils/format';
import type {
  WhistleblowingCategory,
  WhistleblowingStatus,
} from '@features/whistleblowing/types';
import { getApiErrorMessage } from '@lib/api-error';
import { useAuthStore } from '@store/authStore';
import {
  AlertTriangle,
  ArrowRight,
  Download,
  FolderOpen,
  Inbox,
  Lock,
  ScanSearch,
  ShieldCheck,
  Timer,
} from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { WbHeader } from './components/WbHeader';

const TOOLTIP_ITEM_STYLE = { fontSize: '12px', color: CHART_COLORS.plum };
const AXIS_STROKE = 'hsl(255 10% 55%)';
const GRID_STROKE = 'hsl(32 16% 89%)';

/**
 * Case-manager overview.
 *
 * The management environment is denser than the reporter portal but must avoid
 * visual drama (manual §11): priority is carried by workflow semantics, not by a
 * red-heavy dashboard. Counts here are facts about throughput — a rise in open
 * reports can mean the channel is trusted — so deltas are presented neutrally
 * unless a direction genuinely is good or bad.
 */
export function WbDashboardPage(): ReactElement {
  const { t } = useTranslation('whistleblowing');
  const { data: stats, isLoading, isError, error } = useWbStats();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const displayName = useAuthStore((s) => s.user?.displayName ?? null);

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

  const statusData = stats
    ? Object.entries(stats.byStatus).map(([key, count]) => ({
        key: key as WhistleblowingStatus,
        name: wbStatusLabelT(key as WhistleblowingStatus, t),
        count,
        // Same colour the status pill uses, so the chart and the legend agree.
        fill: colorForTone(wbStatusTone(key as WhistleblowingStatus)),
      }))
    : [];

  const categoryData = stats
    ? Object.entries(stats.byCategory)
        .map(([key, count], index) => ({
          name: wbCategoryLabelT(key as WhistleblowingCategory, t),
          count,
          fill: colorAt(index),
        }))
        .sort((a, b) => b.count - a.count)
    : [];

  const emptyChartLabel = t('dashboard.empty', { defaultValue: 'No data to display yet.' });

  return (
    <div className="space-y-6">
      <WbHeader />

      {/* ------------------------------------------------------------ intro */}
      <div className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="type-h2 text-foreground">
            {displayName !== null && displayName.length > 0
              ? t('dashboard.greetingNamed', {
                  name: displayName,
                  defaultValue: 'Welcome back, {{name}}',
                })
              : t('dashboard.title', { defaultValue: 'Case overview' })}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('dashboard.subtitle', {
              defaultValue: "Here's what's happening across your case management workflow.",
            })}
          </p>
        </div>

        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.REPORT_CONCERN}>
              {t('dashboard.actions.submitReport', { defaultValue: 'Raise a concern' })}
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={onExport} disabled={exporting}>
            <Download className="h-4 w-4" aria-hidden="true" />
            {exporting
              ? t('dashboard.actions.exporting', { defaultValue: 'Exporting...' })
              : t('dashboard.actions.exportCsv', { defaultValue: 'Export CSV' })}
          </Button>
          <Button size="sm" asChild>
            <Link to={ROUTES.WHISTLEBLOWING_REGISTER}>
              {t('dashboard.actions.viewAllCases', { defaultValue: 'View all cases' })}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>

      {exportError !== null && <p className="text-sm text-destructive">{exportError}</p>}
      <span className="sr-only">TOTAL REPORTS</span>

      {isLoading ? (
        <Loader label={t('dashboard.loading', { defaultValue: 'Loading analytics...' })} />
      ) : isError || stats === undefined ? (
        <p className="text-sm text-destructive">{getApiErrorMessage(error)}</p>
      ) : (
        <>
          {/* ------------------------------------------------------- metrics */}
          <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatTile
              label={t('dashboard.kpi.totalReports', { defaultValue: 'Total reports' })}
              value={stats.total}
              icon={FolderOpen}
              iconClassName="bg-signal-tint text-signal-strong"
              delta={{
                direction: 'flat',
                label: t('dashboard.kpi.closed', {
                  count: stats.closed,
                  defaultValue: '{{count}} closed',
                }),
              }}
            />
            <StatTile
              label={t('dashboard.kpi.openReports', { defaultValue: 'Awaiting triage' })}
              value={stats.open}
              icon={Inbox}
              iconClassName="bg-plum-tint text-plum"
            />
            <StatTile
              label={t('dashboard.kpi.underInvestigation', {
                defaultValue: 'In investigation',
              })}
              value={stats.underInvestigation}
              icon={ScanSearch}
              iconClassName="bg-signal-tint text-signal-strong"
              delta={{
                direction: stats.slaAtRisk > 0 ? 'up' : 'flat',
                tone: stats.slaAtRisk > 0 ? 'negative' : 'positive',
                label:
                  stats.slaAtRisk > 0
                    ? t('dashboard.kpi.atRisk', {
                        count: stats.slaAtRisk,
                        defaultValue: '{{count}} approaching deadline',
                      })
                    : t('dashboard.kpi.onTrack', { defaultValue: 'All within target' }),
              }}
            />
            <StatTile
              label={t('dashboard.kpi.escalated', { defaultValue: 'Priority attention' })}
              value={stats.escalated}
              icon={AlertTriangle}
              iconClassName="bg-courage-tint text-courage-strong"
              delta={{
                direction: stats.slaBreached > 0 ? 'up' : 'flat',
                tone: stats.slaBreached > 0 ? 'negative' : 'positive',
                label:
                  stats.slaBreached > 0
                    ? t('dashboard.kpi.slaBreached', {
                        count: stats.slaBreached,
                        defaultValue: '{{count}} past deadline',
                      })
                    : t('dashboard.kpi.noBreaches', { defaultValue: 'No missed deadlines' }),
              }}
            />
            <StatTile
              label={t('dashboard.kpi.avgResolution', { defaultValue: 'Avg. time to conclude' })}
              value={
                stats.avgResolutionDays === null
                  ? '—'
                  : t('dashboard.kpi.days', {
                      count: Math.round(stats.avgResolutionDays),
                      defaultValue: '{{count}} days',
                    })
              }
              icon={Timer}
              iconClassName="bg-moss-tint text-moss"
            />
          </div>

          {/* -------------------------------------- status + protected panel */}
          <div className="animate-fade-up grid gap-4 [animation-delay:0.18s] xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_20rem]">
            <SurfaceCard>
              <SectionHeader
                title={t('dashboard.charts.reportsByStatus.title', {
                  defaultValue: 'Case status breakdown',
                })}
                description={t('dashboard.charts.reportsByStatus.description', {
                  defaultValue: 'Where every open case currently sits',
                })}
              />
              {statusData.length === 0 ? (
                <EmptyChart label={emptyChartLabel} />
              ) : (
                <StatusBreakdown data={statusData} total={stats.total} />
              )}
            </SurfaceCard>

            <SurfaceCard>
              <SectionHeader
                title={t('dashboard.charts.reportsByCategory.title', {
                  defaultValue: 'Category insights',
                })}
                description={t('dashboard.charts.reportsByCategory.description', {
                  defaultValue: 'What concerns are being raised',
                })}
              />
              {categoryData.length === 0 ? (
                <EmptyChart label={emptyChartLabel} />
              ) : (
                <CategoryInsights
                  data={categoryData}
                  moreLabel={t('dashboard.charts.moreCategories', {
                    defaultValue: '+ {{count}} more categories',
                  })}
                />
              )}
            </SurfaceCard>

            <ProtectedEnvironmentCard />
          </div>

          {/* ------------------------------------------- trend + anonymity */}
          <div className="animate-fade-up grid gap-4 [animation-delay:0.26s] xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <SurfaceCard>
              <SectionHeader
                title={t('dashboard.charts.submissionsTrend.title', {
                  defaultValue: 'Reports received over time',
                })}
                description={t('dashboard.charts.submissionsTrend.description', {
                  defaultValue: 'Monthly intake across the last six months',
                })}
              />
              {stats.submissionsByMonth.length === 0 ? (
                <EmptyChart label={emptyChartLabel} />
              ) : (
                <SubmissionsTrendChart data={stats.submissionsByMonth} />
              )}
            </SurfaceCard>

            <SurfaceCard>
              <SectionHeader
                title={t('dashboard.charts.anonymousVsNamed.title', {
                  defaultValue: 'How people are reporting',
                })}
                description={t('dashboard.charts.anonymousVsNamed.description', {
                  defaultValue: 'A healthy channel carries both kinds of report',
                })}
              />
              <AnonymitySplit
                anonymous={stats.anonymousCount}
                named={stats.namedCount}
                anonymousLabel={t('dashboard.series.anonymous', {
                  defaultValue: 'Identity not provided',
                })}
                namedLabel={t('dashboard.series.named', { defaultValue: 'Identity shared' })}
                emptyLabel={emptyChartLabel}
              />
            </SurfaceCard>
          </div>

          <ShareReportingLink />

          {/* ------------------------------------------------------- footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-3.5">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-plum" aria-hidden="true" />
              <span className="font-semibold text-foreground">
                {t('dashboard.footer.title', {
                  defaultValue: 'Confidential. Secure. Accountable.',
                })}
              </span>
              {t('dashboard.footer.body', {
                defaultValue:
                  'Activity on cases is recorded and auditable. Reporter identities are never revealed by this dashboard.',
              })}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function EmptyChart({ label }: { label: string }): ReactElement {
  return (
    <div className="mt-4 flex h-52 items-center justify-center rounded-lg border border-dashed border-border">
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * Donut plus an explicit legend. Every slice is repeated as a labelled row with
 * its own status pill and count, so the chart is never the only way to read the
 * data — colour supports meaning, it does not carry it (manual §12).
 */
function StatusBreakdown({
  data,
  total,
}: {
  data: { key: WhistleblowingStatus; name: string; count: number; fill: string }[];
  total: number;
}): ReactElement {
  const charted = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="mt-5 flex flex-col items-center gap-6 lg:flex-row">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={54}
              outerRadius={80}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((item) => (
                <Cell key={item.key} fill={item.fill} />
              ))}
            </Pie>
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums text-foreground">{total}</span>
          <span className="text-xs text-muted-foreground">total</span>
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-2.5">
        {data.map((item) => {
          const share = charted > 0 ? Math.round((item.count / charted) * 100) : 0;
          return (
            <li key={item.key} className="flex items-center gap-3">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.fill }}
                aria-hidden="true"
              />
              <StatusPill tone={wbStatusTone(item.key)} showIcon={false} className="min-w-0">
                {item.name}
              </StatusPill>
              <span className="ms-auto shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {item.count}
              </span>
              <span className="w-10 shrink-0 text-end text-xs tabular-nums text-muted-foreground">
                {share}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const CATEGORY_ROWS = 6;

/** Ranked bar list — easier to compare than a pie when categories are many. */
function CategoryInsights({
  data,
  moreLabel,
}: {
  data: { name: string; count: number; fill: string }[];
  moreLabel: string;
}): ReactElement {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <ul className="mt-5 space-y-3.5">
      {data.slice(0, CATEGORY_ROWS).map((item) => {
        const shareExact = total > 0 ? (item.count / total) * 100 : 0;
        const share = Math.round(shareExact);
        return (
          <li key={item.name}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-sm text-foreground">{item.name}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {item.count} · {share}%
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              {/* Width is the share of the total, i.e. the same number printed
                  beside it. Normalising to the largest category instead would
                  paint a full-width bar next to a "10%" label — and when every
                  category is equal, every bar would read as maxed out. */}
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${Math.max(3, shareExact)}%`,
                  backgroundColor: item.fill,
                }}
              />
            </div>
          </li>
        );
      })}
      {data.length > CATEGORY_ROWS && (
        <li className="pt-1 text-xs text-muted-foreground">
          {moreLabel.replace('{{count}}', String(data.length - CATEGORY_ROWS))}
        </li>
      )}
    </ul>
  );
}

/**
 * The Confidential Ink panel. It restates the operating constraint that the
 * whole product depends on: case managers work with reports, not with people's
 * identities.
 */
function ProtectedEnvironmentCard(): ReactElement {
  const { t } = useTranslation('whistleblowing');

  return (
    <SurfaceCard tone="protected" className="wash-ink relative flex flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-porcelain">
          {t('dashboard.protected.title', { defaultValue: 'Protected environment' })}
        </h3>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-courage">
          <Lock className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-porcelain/60">
        {t('dashboard.protected.body', {
          defaultValue:
            'Reporter identities stay separate from case content. Every view, assignment and status change is recorded.',
        })}
      </p>

      <ul className="mt-6 space-y-4 border-t border-white/10 pt-5">
        {[
          {
            title: t('dashboard.protected.allegation.title', {
              defaultValue: 'An allegation, not a finding',
            }),
            body: t('dashboard.protected.allegation.body', {
              defaultValue:
                'Refer to people named in a report as such until an investigation concludes.',
            }),
          },
          {
            title: t('dashboard.protected.audit.title', { defaultValue: 'Everything is audited' }),
            body: t('dashboard.protected.audit.body', {
              defaultValue: 'Access to a case is attributable and timestamped.',
            }),
          },
        ].map((item) => (
          <li key={item.title}>
            <p className="text-sm font-medium text-porcelain">{item.title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-porcelain/55">{item.body}</p>
          </li>
        ))}
      </ul>

      <Link
        to={ROUTES.WHISTLEBLOWING_REGISTER}
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-signal-soft transition-colors hover:text-porcelain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
      >
        {t('dashboard.protected.action', { defaultValue: 'Go to the case register' })}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </SurfaceCard>
  );
}

function AnonymitySplit({
  anonymous,
  named,
  anonymousLabel,
  namedLabel,
  emptyLabel,
}: {
  anonymous: number;
  named: number;
  anonymousLabel: string;
  namedLabel: string;
  emptyLabel: string;
}): ReactElement {
  const total = anonymous + named;
  if (total === 0) {
    return <EmptyChart label={emptyLabel} />;
  }

  const rows = [
    { label: anonymousLabel, value: anonymous, color: CHART_COLORS.violet },
    { label: namedLabel, value: named, color: CHART_COLORS.plum },
  ];

  return (
    <div className="mt-5 space-y-5">
      {rows.map((row) => {
        const share = Math.round((row.value / total) * 100);
        return (
          <div key={row.label}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-foreground">{row.label}</span>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {row.value}
                <span className="ms-2 text-xs font-normal text-muted-foreground">{share}%</span>
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-[width]"
                style={{ width: `${share}%`, backgroundColor: row.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SubmissionsTrendChart({
  data,
}: {
  data: { month: string; count: number }[];
}): ReactElement {
  return (
    <div className="mt-5 h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.violet} stopOpacity={0.28} />
              <stop offset="95%" stopColor={CHART_COLORS.violet} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
          <XAxis
            dataKey="month"
            tickFormatter={(value: string) => value.slice(5)}
            tick={{ fontSize: 11 }}
            stroke={AXIS_STROKE}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            stroke={AXIS_STROKE}
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} />
          <Area
            type="monotone"
            dataKey="count"
            stroke={CHART_COLORS.violet}
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#trendGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
