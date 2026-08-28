import { ROUTES } from '@config/routes';
import { authService } from '@features/auth';
import { readThemePreference, saveThemePreference, type ThemePreference } from '@lib/theme';
import { useAuthStore } from '@store/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, LogOut, Monitor, Moon, Settings, Sun, User, UserCircle } from 'lucide-react';
import { type ReactElement, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

interface PortalUserMenuProps {
  placement: 'header' | 'sidebar';
  sidebarCollapsed?: boolean;
  profileRoute?: string;
  settingsRoute?: string;
  logoutRoute?: string;
  onClose?: () => void;
}

interface MenuPosition { left: number; bottom: number }

const MENU_WIDTH = 288;
const EDGE_GAP = 16;

/** Civorah's user card, retained for the standalone organization-scoped shell. */
export function PortalUserMenu({ placement, sidebarCollapsed = false, profileRoute = ROUTES.PROFILE, settingsRoute = ROUTES.MFA_SETTINGS, logoutRoute = ROUTES.AUTH.LOGIN, onClose }: PortalUserMenuProps): ReactElement {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const clear = useAuthStore((state) => state.clear);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [theme, setTheme] = useState<ThemePreference>(() => readThemePreference());
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({ left: EDGE_GAP, bottom: EDGE_GAP });
  const shouldPortalSidebarMenu = placement === 'sidebar' && sidebarCollapsed;
  const isRtl = i18n.dir() === 'rtl';
  const rawName = user?.displayName?.trim();
  const email = user?.email?.trim();
  const storedName = typeof localStorage !== 'undefined' ? localStorage.getItem('wb.userDisplayName')?.trim() : '';
  const storedEmail = typeof localStorage !== 'undefined' ? localStorage.getItem('wb.userEmail')?.trim() : '';
  const storedPlatformRole = typeof localStorage !== 'undefined' ? localStorage.getItem('wb.platformRole') : null;
  const name = rawName || email || storedName || storedEmail || (storedPlatformRole === 'SUPER_ADMIN' ? 'Admin' : 'Guest');
  const emailLabel = email || storedEmail || (storedPlatformRole === 'SUPER_ADMIN' ? 'System administrator' : 'Not signed in');

  const themeOptions: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: t('theme.light'), icon: Sun },
    { value: 'dark', label: t('theme.dark'), icon: Moon },
    { value: 'system', label: t('theme.system'), icon: Monitor },
  ];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent): void => {
      const target = event.target as Node;
      if (!ref.current?.contains(target) && !menuRef.current?.contains(target)) { setOpen(false); onClose?.(); }
    };
    const onKeyDown = (event: KeyboardEvent): void => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('mousedown', onPointerDown); document.removeEventListener('keydown', onKeyDown); };
  }, [onClose, open]);

  useEffect(() => {
    if (!open || !shouldPortalSidebarMenu) return;
    const updatePosition = (): void => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      setMenuPosition({ left: Math.max(EDGE_GAP, Math.min(isRtl ? rect.left - MENU_WIDTH - 12 : rect.right + 12, window.innerWidth - MENU_WIDTH - EDGE_GAP)), bottom: Math.max(EDGE_GAP, window.innerHeight - rect.bottom) });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => { window.removeEventListener('resize', updatePosition); window.removeEventListener('scroll', updatePosition, true); };
  }, [isRtl, open, shouldPortalSidebarMenu]);

  const handleLogout = async (): Promise<void> => {
    setLoggingOut(true);
    try { await authService.logout(); } catch { /* Local logout remains authoritative if the API is unavailable. */ }
    clear();
    queryClient.clear();
    onClose?.();
    window.location.replace(logoutRoute);
  };

  const toggle = (): void => { setOpen((value) => !value); if (open) onClose?.(); };
  const trigger = placement === 'header' ? (
    <button type="button" onClick={toggle} className="flex items-center gap-2 rounded-md p-1 text-sm transition-colors sm:px-2 sm:py-1.5 text-slate-600 hover:bg-slate-100 hover:text-brand-accent" aria-haspopup="menu" aria-expanded={open}>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-accent text-white ring-2 ring-brand-accent/20 sm:h-9 sm:w-9"><User className="h-4 w-4 sm:h-5 sm:w-5" /></span>
      <span className="hidden max-w-[6.5rem] truncate text-start font-medium sm:block lg:max-w-40" dir="auto">{name}</span>
    </button>
  ) : (
    <button type="button" onClick={toggle} className="group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start transition-colors hover:bg-slate-100" aria-haspopup="menu" aria-expanded={open}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-accent text-white ring-2 ring-brand-accent/15"><User className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1"><span className="block truncate text-base font-normal text-slate-900">{name}</span><span className="block truncate text-xs text-slate-500">{emailLabel}</span></span>
    </button>
  );

  const menu = open ? (
    <div ref={menuRef} dir={isRtl ? 'rtl' : 'ltr'} className={`absolute isolate z-[9999] overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-700 shadow-xl shadow-brand-accent/15 ${placement === 'header' ? 'top-full mt-2 w-72 ltr:right-0 rtl:left-0' : sidebarCollapsed ? 'fixed w-72' : 'inset-x-0 bottom-full mb-2 w-full'}`} style={shouldPortalSidebarMenu ? { left: menuPosition.left, bottom: menuPosition.bottom } : undefined} role="menu">
      <div className="border-b border-slate-100 bg-white px-4 py-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-accent text-white ring-2 ring-brand-accent/20"><User className="h-5 w-5" /></span><div className="min-w-0"><p className="truncate text-sm font-semibold text-brand-accent" dir="auto">{name}</p><p className="truncate text-xs text-slate-500" dir="auto">{emailLabel}</p></div></div></div>
      <div className="p-1.5">
        <Link to={profileRoute} onClick={() => { setOpen(false); onClose?.(); }} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-[#e6f5f6] hover:text-brand-accent" role="menuitem"><UserCircle className="h-5 w-5 text-[#007d89]" />{t('menu.profile')}</Link>
        <Link to={settingsRoute} onClick={() => { setOpen(false); onClose?.(); }} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-[#e6f5f6] hover:text-brand-accent" role="menuitem"><Settings className="h-5 w-5 text-[#007d89]" />{t('menu.settings')}</Link>
        <div className="border-t border-slate-100 px-3 py-2"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{t('theme.appearance')}</p><div className="grid grid-cols-3 gap-1">{themeOptions.map((option) => { const Icon = option.icon; const disabled = option.value !== 'light'; const active = !disabled && theme === option.value; return <button key={option.value} type="button" disabled={disabled} onClick={() => { if (!disabled) { setTheme(option.value); saveThemePreference(option.value); } }} title={disabled ? t('theme.comingSoon') : option.label} aria-label={disabled ? t('theme.comingSoonAria', { theme: option.label }) : t('theme.useTheme', { theme: option.label })} className={`relative flex h-11 items-center justify-center rounded-md border px-2 py-2 text-xs font-medium ${disabled ? 'cursor-not-allowed opacity-60' : ''} ${active ? 'border-brand-accent bg-[#e6f5f6] text-brand-accent' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>{disabled && <span className="absolute -right-1 -top-1 rounded-full bg-slate-100 px-1 py-px text-[8px] font-semibold uppercase leading-none text-slate-500">{t('theme.soon')}</span>}<Icon className="h-4 w-4" /></button>; })}</div></div>
        <button type="button" onClick={() => void handleLogout()} disabled={loggingOut} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-start text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50" role="menuitem">{loggingOut ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}{t('actions.signOut')}</button>
      </div>
    </div>
  ) : null;

  return <div ref={ref} className="relative">{trigger}{shouldPortalSidebarMenu && menu ? createPortal(menu, document.body) : menu}</div>;
}
