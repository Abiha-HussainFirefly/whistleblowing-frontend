import { MessageSquareWarning } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWbStats } from '../../whistleblowing/hooks';
import { wbRoutes } from '../../../config/routes';
import { wbStatusLabelOf } from '../../whistleblowing/utils/format';
import { BlinkShell, BlinkChartHeading, MiniKpi } from './BlinkShell';

export function WhistleblowingBlink() { const { data: stats, isLoading, isError } = useWbStats(); return <BlinkShell icon={MessageSquareWarning} iconColor="" title="Whistleblowing" subtitle="Confidential incident reporting and investigation" to={wbRoutes.dashboard} isLoading={isLoading} isError={isError}>{stats && <><div className="source-stat-grid source-stat-grid-four">{[['Total', stats.total], ['Open', stats.open], ['Investigating', stats.underInvestigation], ['At risk', stats.slaAtRisk]].map(([label, value]) => <MiniKpi key={String(label)} label={String(label)} value={value} tone={label === 'At risk' && stats.slaBreached > 0 ? 'danger' : 'default'} />)}</div><BlinkChartHeading>By status</BlinkChartHeading>{Object.entries(stats.byStatus).map(([key, value]) => <p className="chart-row" key={key}><span>{wbStatusLabelOf(key)}</span> <strong>{value}</strong></p>)}<Link className="source-button source-button-outline" to={wbRoutes.dashboard}>Open Whistleblowing</Link></>}</BlinkShell>; }

