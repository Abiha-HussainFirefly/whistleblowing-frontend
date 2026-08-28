import { useState, type ReactElement } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { BarChart3, Boxes, KeyRound, LayoutDashboard, Menu, Settings, Shield, Users, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BrandLogo } from '@components/common/BrandLogo';
import { LanguageSwitcher } from '@components/common/LanguageSwitcher';
import { PortalNotificationsBell } from '@components/layout/PortalNotificationsBell';
import { PortalUserMenu } from '@components/layout/PortalUserMenu';
import { ROUTES } from '@config/routes';

const items: { to: string; label: string; icon: LucideIcon }[] = [
  { to: ROUTES.ADMIN.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.ADMIN.PERMISSIONS, label: 'Permissions', icon: KeyRound },
  { to: ROUTES.ADMIN.ROLES, label: 'Roles', icon: Shield },
  { to: ROUTES.ADMIN.ORGANIZATIONS, label: 'Organizations', icon: Boxes },
  { to: ROUTES.ADMIN.PLANS, label: 'Licensing Plans', icon: BarChart3 },
  { to: ROUTES.ADMIN.CONFIG_PACKS, label: 'Config Packs', icon: Boxes },
  { to: ROUTES.ADMIN.CAPABILITIES, label: 'Capabilities', icon: Shield },
  { to: ROUTES.ADMIN.USERS, label: 'Users', icon: Users },
  { to: ROUTES.ADMIN.SETTINGS, label: 'Settings', icon: Settings },
];

export function AdminConsoleLayout(): ReactElement {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const close = (): void => setMobileOpen(false);
  return (
    <div className="flex h-[100dvh] min-h-0 w-full overflow-hidden bg-white">
      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-white transition-all duration-200 lg:static lg:translate-x-0 ${mobileOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full'} ${expanded ? 'lg:w-64' : 'lg:w-16'}`}>
        <div className={`flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-5 ${expanded ? '' : 'lg:justify-center lg:px-0'}`}>
          <Link to={ROUTES.ADMIN.DASHBOARD} onClick={close} className="overflow-hidden"><BrandLogo className="h-8 w-auto max-w-[170px] object-contain object-left" /></Link>
          {expanded && <span className="rounded bg-brand-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-primary">System Console</span>}
          <button type="button" onClick={close} className="rounded-md p-1 text-brand-primary hover:bg-slate-100 lg:hidden" aria-label="Close menu"><X className="h-6 w-6" /></button>
        </div>
        <nav className="sidebar-scroll flex-1 space-y-1 overflow-y-auto p-3">
          {items.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === ROUTES.ADMIN.DASHBOARD} onClick={close} title={expanded ? undefined : label} className={({ isActive }) => `flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${expanded ? 'gap-3' : 'lg:mx-auto lg:h-10 lg:w-10 lg:justify-center lg:p-0'} ${isActive ? 'bg-slate-100 text-slate-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}><Icon className="h-5 w-5 shrink-0" /><span className={expanded ? '' : 'lg:hidden'}>{label}</span></NavLink>)}
        </nav>
        <div className={`flex shrink-0 items-center border-t border-slate-200 p-3 ${expanded ? '' : 'lg:justify-center lg:px-0'}`}><PortalUserMenu placement="sidebar" sidebarCollapsed={!expanded} profileRoute={ROUTES.ADMIN.SETTINGS} settingsRoute={ROUTES.ADMIN.MFA_SETTINGS} logoutRoute={ROUTES.AUTH.ADMIN_LOGIN} /></div>
        <button type="button" onClick={() => setExpanded((value) => !value)} className="absolute -right-3 bottom-20 hidden h-6 w-6 rounded-full border border-slate-200 bg-white text-brand-primary shadow-sm lg:grid lg:place-items-center" aria-label="Toggle sidebar">{expanded ? '‹' : '›'}</button>
      </aside>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={close} aria-hidden="true" />}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
        <header className="flex min-h-16 items-center justify-between gap-2 bg-white px-3 py-2 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3"><button type="button" onClick={() => { if (window.innerWidth < 1024) setMobileOpen((value) => !value); else setExpanded((value) => !value); }} className="rounded-md p-1.5 text-brand-primary hover:bg-slate-100" aria-label="Toggle sidebar"><Menu className="h-6 w-6 sm:h-7 sm:w-7" /></button><h1 className="truncate text-base font-semibold text-brand-primary sm:text-lg">System Console</h1></div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3"><span className="hidden text-xs text-slate-400 sm:inline">Platform-wide</span><LanguageSwitcher /><PortalNotificationsBell /><PortalUserMenu placement="header" profileRoute={ROUTES.ADMIN.SETTINGS} settingsRoute={ROUTES.ADMIN.MFA_SETTINGS} logoutRoute={ROUTES.AUTH.ADMIN_LOGIN} /></div>
        </header>
        <main className="app-main-content min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain rounded-tl-2xl border-l border-t border-slate-200 bg-slate-50 p-3 sm:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
