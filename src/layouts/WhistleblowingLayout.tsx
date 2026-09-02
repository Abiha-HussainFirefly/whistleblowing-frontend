import {
  LayoutDashboard,
  Lock,
  Menu,
  MessageSquareWarning,
  ShieldAlert,
  X,
  type LucideIcon,
} from 'lucide-react';
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

/**
 * Case-manager shell.
 *
 * The rail is Confidential Ink: it is the one persistent reminder that this is a
 * protected environment rather than an ordinary back-office tool. Content sits
 * on warm Porcelain, which keeps the ~60/18 Porcelain-to-Ink ratio the brand
 * manual asks for (§07) without the dashboard reading as a dark app.
 */
export function WhistleblowingLayout(): ReactElement {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const activeOrganization = useAuthStore((state) => state.activeOrganization);
  const mfaEnabled = useAuthStore((state) => state.user?.mfaEnabled ?? false);
  const close = (): void => setMobileOpen(false);

  return (
    <div className="flex h-[100dvh] min-h-0 w-full overflow-hidden bg-ink">
      <aside
        className={`fixed inset-y-0 start-0 z-40 flex flex-col bg-ink text-porcelain transition-all duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full'
        } ${expanded ? 'lg:w-64' : 'lg:w-[4.5rem]'}`}
      >
        <div
          className={`flex h-16 shrink-0 items-center justify-between gap-2 px-5 ${
            expanded ? '' : 'lg:justify-center lg:px-0'
          }`}
        >
          <Link to={ROUTES.DASHBOARD} onClick={close} className="overflow-hidden">
            <BrandLogo
              white={expanded}
              iconOnly={!expanded}
              className={expanded ? 'h-8 w-auto max-w-[10.5rem]' : 'h-8 w-8'}
            />
          </Link>
          <button
            type="button"
            onClick={close}
            className="rounded-md p-1 text-porcelain/70 hover:bg-white/10 hover:text-porcelain lg:hidden"
            aria-label={t('shell.closeMenu', { defaultValue: 'Close menu' })}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-5">
          <NavItem to={ROUTES.DASHBOARD} label={t('nav.dashboard', { defaultValue: 'Dashboard' })} icon={LayoutDashboard} expanded={expanded} onClick={close} />
          <NavItem to={ROUTES.WHISTLEBLOWING} label={t('modules.whistleblowing.label', { defaultValue: 'Whistleblowing' })} icon={MessageSquareWarning} expanded={expanded} onClick={close} />
        </nav>

        {/* The secure-environment reminder from the reference dashboard. It is
            not decoration: case managers act differently when they are aware
            their access is recorded. */}
        {expanded && (
          <Link to={ROUTES.MFA_SETTINGS} onClick={close} className="mx-3 mb-3 block rounded-xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:border-courage/40 hover:bg-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-courage">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <div className="min-w-0"><p className="text-sm font-semibold text-porcelain">{t('shell.secureEnvironment.title', { defaultValue: 'Secure environment' })}</p><p className="mt-0.5 text-[11px] text-porcelain/55">{mfaEnabled ? 'MFA is protecting this account' : 'Account protection can be strengthened'}</p></div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] font-medium"><span className="inline-flex items-center gap-1.5 text-porcelain/70"><span className={`h-1.5 w-1.5 rounded-full ${mfaEnabled ? 'bg-emerald-400' : 'bg-courage'}`} />{mfaEnabled ? 'Protected' : 'Review security settings'}</span><span className="text-courage">Open security →</span></div>
          </Link>
        )}

        <div
          className={`flex items-center border-t border-white/10 p-3 ${
            expanded ? '' : 'lg:justify-center lg:px-0'
          }`}
        >
          <PortalUserMenu
            placement="sidebar"
            {...(expanded ? {} : { sidebarCollapsed: true })}
            profileRoute={ROUTES.PROFILE}
            settingsRoute={ROUTES.MFA_SETTINGS}
            logoutRoute={ROUTES.AUTH.LOGIN}
          />
        </div>

      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink/60 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-porcelain lg:rounded-s-2xl">
        <header className="flex min-h-16 items-center justify-between gap-2 border-b border-border bg-card px-3 py-2 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth < 1024) setMobileOpen((value) => !value);
                else setExpanded((value) => !value);
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={t('shell.toggleSidebar', { defaultValue: 'Toggle sidebar' })}
            >
              <Menu className="h-5 w-5 shrink-0" />
            </button>
            <strong className="truncate text-base font-semibold text-foreground sm:text-lg">
              {t('shell.organizationPortal', {
                organization:
                  activeOrganization?.name ??
                  t('shell.organizationFallback', { defaultValue: 'Organization' }),
                defaultValue: '{{organization}} Portal',
              })}
            </strong>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2 lg:gap-3">
            <PortalGlobalSearch />
            <Link
              to={ROUTES.REPORT_CONCERN}
              className="flex items-center gap-1.5 rounded-lg border border-border p-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-signal/40 hover:bg-signal-tint hover:text-signal-strong sm:px-2.5 sm:py-1.5"
            >
              <ShieldAlert className="h-5 w-5" />
              <span className="hidden lg:inline">
                {t('shell.reportConcern', { defaultValue: 'Raise a concern' })}
              </span>
            </Link>
            <OrganizationScopePill />
            <LanguageSwitcher />
            <PortalNotificationsBell />
            <PortalUserMenu
              placement="header"
              profileRoute={ROUTES.PROFILE}
              settingsRoute={ROUTES.MFA_SETTINGS}
              logoutRoute={ROUTES.AUTH.LOGIN}
            />
          </div>
        </header>

        <main className="app-main-content wash-porcelain min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-3 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  expanded,
  onClick,
  end = false,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  expanded: boolean;
  onClick: () => void;
  end?: boolean;
}): ReactElement {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      title={expanded ? undefined : label}
      className={({ isActive }) =>
        `flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          expanded ? 'gap-3' : 'lg:justify-center'
        } ${
          isActive
            ? 'bg-signal text-white'
            : 'text-porcelain/65 hover:bg-white/10 hover:text-porcelain'
        }`
      }
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className={expanded ? '' : 'lg:hidden'}>{label}</span>
    </NavLink>
  );
}
