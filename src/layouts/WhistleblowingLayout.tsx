import { LayoutDashboard, Menu, MessageSquareWarning, ShieldAlert, X } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandLogo } from '@components/common/BrandLogo';
import { LanguageSwitcher } from '@components/common/LanguageSwitcher';
import { OrganizationScopePill } from '@components/layout/OrganizationScopePill';
import { PortalGlobalSearch } from '@components/layout/PortalGlobalSearch';
import { PortalNotificationsBell } from '@components/layout/PortalNotificationsBell';
import { PortalUserMenu } from '@components/layout/PortalUserMenu';
import { useAuthStore } from '@store/authStore';
import { ROUTES } from '@config/routes';

export function WhistleblowingLayout(): ReactElement {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const activeOrganization = useAuthStore((state) => state.activeOrganization);
  const close = (): void => setMobileOpen(false);

  return (
    <div className="flex h-[100dvh] min-h-0 w-full overflow-hidden bg-white">
      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-white transition-all duration-200 lg:static lg:translate-x-0 ${mobileOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full'} ${expanded ? 'lg:w-64' : 'lg:w-16'}`}>
        <div className={`flex h-16 items-center justify-between gap-2 border-b border-slate-100 px-5 ${expanded ? '' : 'lg:justify-center lg:px-0'}`}>
          <Link to={ROUTES.WHISTLEBLOWING} onClick={close} className="overflow-hidden">
            <BrandLogo className={`h-8 w-auto max-w-[170px] object-contain object-left ${expanded ? '' : 'lg:max-w-none'}`} />
          </Link>
          <button type="button" onClick={close} className="rounded-md p-1 text-brand-primary hover:bg-slate-100 lg:hidden" aria-label="Close menu"><X className="h-6 w-6" /></button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-5">
          <NavItem to={ROUTES.DASHBOARD} label={t('nav.dashboard', { defaultValue: 'Dashboard' })} icon={LayoutDashboard} expanded={expanded} onClick={close} />
          <NavItem to={ROUTES.WHISTLEBLOWING} label={t('modules.whistleblowing', { defaultValue: 'Whistleblowing' })} icon={MessageSquareWarning} expanded={expanded} onClick={close} />
        </nav>
        <div className={`flex items-center border-t border-slate-200 p-3 ${expanded ? '' : 'lg:justify-center lg:px-0'}`}>
          {expanded ? <PortalUserMenu placement="sidebar" profileRoute={ROUTES.PROFILE} settingsRoute={ROUTES.MFA_SETTINGS} logoutRoute={ROUTES.AUTH.LOGIN} /> : <PortalUserMenu placement="sidebar" sidebarCollapsed profileRoute={ROUTES.PROFILE} settingsRoute={ROUTES.MFA_SETTINGS} logoutRoute={ROUTES.AUTH.LOGIN} />}
        </div>
        <button type="button" onClick={() => setExpanded((value) => !value)} className="absolute -right-3 bottom-20 hidden h-6 w-6 rounded-full border border-slate-200 bg-white text-brand-primary shadow-sm lg:grid lg:place-items-center" aria-label="Toggle sidebar">{expanded ? '‹' : '›'}</button>
      </aside>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={close} aria-hidden="true" />}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex min-h-16 items-center justify-between gap-2 bg-white px-3 py-2 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3"><button type="button" onClick={() => { if (window.innerWidth < 1024) setMobileOpen((value) => !value); else setExpanded((value) => !value); }} className="rounded-md p-1.5 text-brand-primary hover:bg-slate-100" aria-label={t('shell.toggleSidebar', { defaultValue: 'Toggle sidebar' })}><Menu className="h-6 w-6 sm:h-7 sm:w-7" /></button><strong className="truncate text-base font-semibold text-brand-primary sm:text-lg">{t('shell.organizationPortal', { organization: activeOrganization?.name ?? t('shell.organizationFallback', { defaultValue: 'Organization' }), defaultValue: 'Atlyis Legal Portal' })}</strong></div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2 lg:gap-3"><PortalGlobalSearch /><Link to={ROUTES.REPORT_CONCERN} className="flex items-center gap-1.5 rounded-md border border-slate-200 p-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 sm:px-2.5 sm:py-1.5"><ShieldAlert className="h-5 w-5" /><span className="hidden lg:inline">{t('shell.reportConcern', { defaultValue: 'Report a concern' })}</span></Link><OrganizationScopePill /><LanguageSwitcher /><PortalNotificationsBell /><PortalUserMenu placement="header" profileRoute={ROUTES.PROFILE} settingsRoute={ROUTES.MFA_SETTINGS} logoutRoute={ROUTES.AUTH.LOGIN} /></div>
        </header>
        <main className="app-main-content min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain rounded-tl-2xl border-l border-t border-slate-200 bg-slate-50 p-3 sm:p-6"><Outlet /></main>
      </div>
    </div>
  );
}

function NavItem({ to, label, icon: Icon, expanded, onClick, end = false }: { to: string; label: string; icon: typeof LayoutDashboard; expanded: boolean; onClick: () => void; end?: boolean }): ReactElement {
  return <NavLink to={to} end={end} onClick={onClick} title={expanded ? undefined : label} className={({ isActive }) => `flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${expanded ? 'gap-3' : 'lg:justify-center'} ${isActive ? 'bg-slate-100 text-brand-primary' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}><Icon className="h-5 w-5 shrink-0" /><span className={expanded ? '' : 'lg:hidden'}>{label}</span></NavLink>;
}
