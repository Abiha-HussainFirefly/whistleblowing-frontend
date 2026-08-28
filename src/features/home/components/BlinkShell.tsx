import type { ReactNode } from 'react';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export function BlinkShell({ icon: Icon, iconColor, title, subtitle, to, isLoading, isError, children }: { icon: LucideIcon; iconColor: string; title: string; subtitle?: string; to: string; isLoading?: boolean; isError?: boolean; children: ReactNode }) { return <section className="source-chart-card"><div className="page-titlebar"><Link to={to} className="wb-heading"><span className={`wb-icon ${iconColor}`}><Icon size={20} /></span><span><strong>{title}</strong>{subtitle && <small>{subtitle}</small>}</span></Link><Link to={to} className="source-button source-button-outline">Open <ArrowRight size={14} /></Link></div>{isLoading ? <div className="source-state">Loading…</div> : isError ? <div className="source-state">Unavailable</div> : children}</section>; }
export function MiniKpi({ label, value, tone = 'default' }: { label: string; value: string | number; tone?: 'default' | 'danger' | 'success' | 'warning' }) { return <div className="source-stat-card"><strong className={tone === 'danger' ? 'danger' : tone === 'warning' ? 'warning' : ''}>{value}</strong><span>{label}</span></div>; }
export function BlinkChartHeading({ children }: { children: ReactNode }) { return <p className="source-eyebrow">{children}</p>; }

