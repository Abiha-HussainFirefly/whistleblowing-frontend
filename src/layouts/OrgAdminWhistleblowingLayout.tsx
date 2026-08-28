import { useEffect, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  BarChart3,
  ChevronDown,
  Globe,
  HelpCircle,
  Link2,
  LayoutDashboard,
  Menu,
  MessageSquareWarning,
  Plug,
  Settings,
  Shield,
  ShieldAlert,
  Users,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BrandLogo } from '@components/common/BrandLogo';
import { LanguageSwitcher } from '@components/common/LanguageSwitcher';
import { OrganizationScopePill } from '@components/layout/OrganizationScopePill';
import { PortalGlobalSearch } from '@components/layout/PortalGlobalSearch';
import { OrgAdminRegionSwitcher } from '@components/layout/OrgAdminRegionSwitcher';
import { PortalNotificationsBell } from '@components/layout/PortalNotificationsBell';
import { PortalUserMenu } from '@components/layout/PortalUserMenu';
import { ROUTES } from '@config/routes';
import { useAuthStore } from '@store/authStore';

interface AdminNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface AdminNavGroup {
  key: 'insights' | 'organization' | 'administration' | 'help';
  label: string;
  icon: LucideIcon;
  items: AdminNavItem[];
}

const adminNavGroups: AdminNavGroup[] = [
  {
    key: 'insights',
    label: 'Insights',
    icon: BarChart3,
    items: [{ to: ROUTES.ORG_ADMIN.REPORTING, label: 'Reporting', icon: BarChart3 }],
  },
  {
    key: 'organization',
    label: 'Organization',
    icon: Users,
    items: [
      { to: ROUTES.ORG_ADMIN.MEMBERS, label: 'Members', icon: Users },
      { to: ROUTES.ORG_ADMIN.ROLES, label: 'Roles', icon: Shield },
      { to: ROUTES.ORG_ADMIN.REGIONS, label: 'Regions', icon: Globe },
    ],
  },
  {
    key: 'administration',
    label: 'Administration',
    icon: Settings,
    items: [
      { to: ROUTES.ORG_ADMIN.PLAN, label: 'Plan & Limits', icon: Link2 },
      { to: ROUTES.ORG_ADMIN.INTEGRATIONS, label: 'Integrations', icon: Plug },
      { to: ROUTES.ORG_ADMIN.SETTINGS, label: 'Settings', icon: Settings },
    ],
  },
  {
    key: 'help',
    label: 'Help',
    icon: HelpCircle,
    items: [{ to: ROUTES.ORG_ADMIN.HELP, label: 'Help & Concepts', icon: HelpCircle }],
  },
];

export function OrgAdminWhistleblowingLayout(): ReactElement {
  const { t } = useTranslation();
  const activeOrganization = useAuthStore((state) => state.activeOrganization);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<AdminNavGroup['key'][]>([
    'insights',
    'organization',
    'administration',
    'help',
  ]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, []);

  const close = (): void => setMobileOpen(false);

  return (
    <div className="flex h-[100dvh] min-h-0 overflow-hidden bg-slate-50">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col overflow-visible bg-white transition-all duration-300 lg:static lg:translate-x-0 ${
          mobileOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full'
        } ${sidebarExpanded ? 'lg:w-64' : 'lg:w-16'}`}
      >
        <div
          className={`flex h-16 shrink-0 items-center justify-between gap-2.5 bg-white px-5 ${
            sidebarExpanded ? 'lg:justify-start' : 'lg:justify-center lg:px-0'
          }`}
        >
          <div className="flex items-center overflow-hidden">
            <Link to={ROUTES.ORG_ADMIN.WHISTLEBLOWING} onClick={close}>
              <BrandLogo className="h-8 w-auto max-w-[170px] object-contain object-left" />
            </Link>
          </div>
          {sidebarExpanded && (
            <span className="rounded bg-brand-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-primary">
              {t('shell.tenantBadge', { defaultValue: 'Tenant' })}
            </span>
          )}
          <button
            type="button"
            onClick={close}
            className="ml-auto rounded-md p-1 text-brand-primary hover:bg-brand-primary/10 lg:hidden"
            aria-label={t('shell.closeMenu', { defaultValue: 'Close menu' })}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="sidebar-scroll flex-1 overflow-y-auto px-3 py-5">
          <div className="mb-1 space-y-1">
            {[
              { to: ROUTES.ORG_ADMIN.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
              { to: ROUTES.ORG_ADMIN.WHISTLEBLOWING, label: 'Whistleblowing', icon: MessageSquareWarning },
            ].map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === ROUTES.ORG_ADMIN.DASHBOARD}
                onClick={close}
                className={({ isActive }) =>
                  `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-slate-100 text-slate-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
          {adminNavGroups.map((group) => {
            const GroupIcon = group.icon;
            const isOpen = expandedGroups.includes(group.key);
            return (
              <section key={group.key} className="mb-3 last:mb-0">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  title={sidebarExpanded ? undefined : group.label}
                  onClick={() => {
                    setExpandedGroups((current) => current.includes(group.key)
                      ? current.filter((key) => key !== group.key)
                      : [...current, group.key]);
                  }}
                  className={`mb-1 flex items-center rounded-lg text-xs font-semibold uppercase tracking-wide transition-colors ${
                    sidebarExpanded
                      ? 'w-full justify-start gap-2 px-3 py-2'
                      : 'w-full justify-center gap-2 px-3 py-2 lg:mx-auto lg:h-10 lg:w-10 lg:p-0'
                  } text-slate-500 hover:bg-slate-100 hover:text-slate-800`}
                >
                  <GroupIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {sidebarExpanded && <span className="truncate">{group.label}</span>}
                  {sidebarExpanded && (
                    <ChevronDown className={`ms-auto h-4 w-4 shrink-0 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                  )}
                </button>
                {isOpen && (
                  <div className="space-y-1">
                    {group.items.map(({ to, label, icon: Icon }) => (
                      <NavLink
                        key={to}
                        to={to}
                        end={to === ROUTES.ORG_ADMIN.DASHBOARD}
                        onClick={close}
                        title={sidebarExpanded ? undefined : label}
                        className={({ isActive }) =>
                          `flex items-center rounded-lg text-sm font-medium transition-colors ${
                            sidebarExpanded
                              ? 'w-full justify-start gap-3 px-3 py-2'
                              : 'w-full justify-center gap-3 px-3 py-2 lg:mx-auto lg:h-10 lg:w-10 lg:p-0'
                          } ${isActive ? 'bg-slate-100 text-slate-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`
                        }
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {sidebarExpanded && <span>{label}</span>}
                      </NavLink>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </nav>

        <div className="relative flex shrink-0 items-center border-t border-slate-200 p-3">
          {sidebarExpanded ? <PortalUserMenu placement="sidebar" profileRoute={ROUTES.ORG_ADMIN.PROFILE} settingsRoute={ROUTES.ORG_ADMIN.SETTINGS} logoutRoute={ROUTES.AUTH.ORG_LOGIN} /> : <span className="mx-auto"><PortalUserMenu placement="sidebar" sidebarCollapsed profileRoute={ROUTES.ORG_ADMIN.PROFILE} settingsRoute={ROUTES.ORG_ADMIN.SETTINGS} logoutRoute={ROUTES.AUTH.ORG_LOGIN} /></span>}
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={close} aria-hidden="true" />}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
        <header className="flex min-h-16 items-center justify-between gap-2 bg-white px-2.5 py-2 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label={t('shell.toggleSidebar', { defaultValue: 'Toggle sidebar' })}
              className="shrink-0 rounded-md p-1.5 text-brand-primary hover:bg-slate-100"
              onClick={() => {
                if (window.innerWidth < 1024) setMobileOpen((value) => !value);
                else setSidebarExpanded((value) => !value);
              }}
            >
              {mobileOpen ? <X className="h-6 w-6 sm:h-7 sm:w-7" /> : <Menu className="h-6 w-6 sm:h-7 sm:w-7" />}
            </button>
            <h1 className="truncate text-base font-semibold text-brand-primary sm:text-lg">
              {t('shell.organizationPortal', {
                organization: activeOrganization?.name ?? t('shell.organizationFallback', { defaultValue: 'Organization' }),
                defaultValue: 'Atlyis Legal Portal',
              })}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-1 overflow-visible sm:gap-2 lg:gap-3">
            <PortalGlobalSearch admin />
            <Link to={ROUTES.ORG_ADMIN.REPORT_CONCERN} className="flex items-center gap-1.5 rounded-md border border-slate-200 p-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 sm:px-2.5 sm:py-1.5">
              <ShieldAlert className="h-5 w-5" />
              <span className="hidden lg:inline">{t('shell.reportConcern', { defaultValue: 'Report a concern' })}</span>
            </Link>
            <OrganizationScopePill admin />
            <OrgAdminRegionSwitcher />
            <LanguageSwitcher />
            <PortalNotificationsBell route={ROUTES.ORG_ADMIN.NOTIFICATIONS} />
            <PortalUserMenu placement="header" profileRoute={ROUTES.ORG_ADMIN.PROFILE} settingsRoute={ROUTES.ORG_ADMIN.SETTINGS} logoutRoute={ROUTES.AUTH.ORG_LOGIN} />
          </div>
        </header>
        <main className="app-main-content min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain rounded-tl-2xl border-l border-t border-slate-200 bg-slate-50 p-3 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
