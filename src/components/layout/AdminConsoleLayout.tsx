import { useState, type ReactElement } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { BadgeDollarSign, Boxes, KeyRound, LayoutDashboard, Menu, Settings, Shield, Users, X } from 'lucide-react';
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
  { to: ROUTES.ADMIN.PLANS, label: 'Licensing Plans', icon: BadgeDollarSign },
  { to: ROUTES.ADMIN.CAPABILITIES, label: 'Capabilities', icon: Shield },
  { to: ROUTES.ADMIN.USERS, label: 'Users', icon: Users },
  { to: ROUTES.ADMIN.SETTINGS, label: 'Settings', icon: Settings },
];

export function AdminConsoleLayout(): ReactElement {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const close = (): void => setMobileOpen(false);
  return (
    <div className="flex h-[100dvh] min-h-0 w-full overflow-hidden bg-ink">
      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-ink text-porcelain transition-all duration-200 lg:static lg:translate-x-0 ${mobileOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full'} ${expanded ? 'lg:w-64' : 'lg:w-[4.5rem]'}`}>
        <div className={`flex h-16 shrink-0 items-center justify-between gap-2 px-5 ${expanded ? '' : 'lg:justify-center lg:px-0'}`}>
          <Link to={ROUTES.ADMIN.DASHBOARD} onClick={close} className="overflow-hidden"><BrandLogo white={expanded} iconOnly={!expanded} className={expanded ? 'h-8 w-auto max-w-[10.5rem]' : 'h-8 w-8'} /></Link>
          {expanded && <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-porcelain/70">System Console</span>}
          <button type="button" onClick={close} className="rounded-md p-1 text-porcelain/70 hover:bg-white/10 hover:text-porcelain lg:hidden" aria-label="Close menu"><X className="h-6 w-6" /></button>
        </div>
        <nav className="sidebar-scroll flex-1 space-y-1 overflow-y-auto p-3">
          {items.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === ROUTES.ADMIN.DASHBOARD} onClick={close} title={expanded ? undefined : label} className={({ isActive }) => `flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${expanded ? 'gap-3' : 'lg:mx-auto lg:h-10 lg:w-10 lg:justify-center lg:p-0'} ${isActive ? 'bg-signal text-white' : 'text-porcelain/65 hover:bg-white/10 hover:text-porcelain'}`}><Icon className="h-5 w-5 shrink-0" /><span className={expanded ? '' : 'lg:hidden'}>{label}</span></NavLink>)}
        </nav>
        <div className={`flex shrink-0 items-center border-t border-white/10 p-3 ${expanded ? '' : 'lg:justify-center lg:px-0'}`}><PortalUserMenu placement="sidebar" sidebarCollapsed={!expanded} profileRoute={ROUTES.ADMIN.SETTINGS} settingsRoute={ROUTES.ADMIN.MFA_SETTINGS} logoutRoute={ROUTES.AUTH.ADMIN_LOGIN} /></div>
      </aside>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-ink/60 lg:hidden" onClick={close} aria-hidden="true" />}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-porcelain lg:rounded-s-2xl">
        <header className="flex min-h-16 items-center justify-between gap-2 border-b border-border bg-card px-3 py-2 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3"><button type="button" onClick={() => { if (window.innerWidth < 1024) setMobileOpen((value) => !value); else setExpanded((value) => !value); }} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Toggle sidebar"><Menu className="h-5 w-5 shrink-0" /></button><h1 className="truncate text-base font-semibold text-foreground sm:text-lg">System Console</h1></div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3"><span className="hidden text-xs text-muted-foreground sm:inline">Platform-wide</span><LanguageSwitcher /><PortalNotificationsBell /><PortalUserMenu placement="header" profileRoute={ROUTES.ADMIN.SETTINGS} settingsRoute={ROUTES.ADMIN.MFA_SETTINGS} logoutRoute={ROUTES.AUTH.ADMIN_LOGIN} /></div>
        </header>
        <main className="app-main-content wash-porcelain min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-3 sm:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
