import type { ReactElement } from 'react';
import { Building2, CheckCircle2, Globe2, KeyRound, MailCheck, ShieldCheck, UserCircle } from 'lucide-react';

import { Loader } from '@components/common/Loader';
import { PageTitle } from '@components/ui/page-title';
import { Badge } from '@components/ui/badge';
import { useAuthStore } from '@store/authStore';

function portalLabel(platformRole: string | undefined): string {
  return platformRole === 'TENANT' ? 'Organization admin' : 'Organization user';
}

export function ProfilePage(): ReactElement {
  const user = useAuthStore((state) => state.user);
  const activeOrganization = useAuthStore((state) => state.activeOrganization);
  const activeRegion = useAuthStore((state) => state.activeRegion);
  const availableRegions = useAuthStore((state) => state.availableRegions);

  if (!user) {
    return <Loader label="Loading your profile..." />;
  }

  const displayName = user.displayName?.trim() || user.email;
  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="w-full space-y-6">
      <header className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-accent text-white shadow-sm">
          <UserCircle className="h-5 w-5" />
        </span>
        <div>
          <PageTitle className="text-foreground">Profile</PageTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            View your account details and current organization access.
          </p>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.8fr)]">
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-signal-tint/70 via-card to-card p-6 sm:p-8">
            <div className="absolute -right-10 -top-16 h-44 w-44 rounded-full bg-brand-accent/10" />
            <div className="relative flex flex-wrap items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-accent text-lg font-semibold text-white shadow-sm">
                {initials || <UserCircle className="h-8 w-8" />}
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-semibold text-foreground">{displayName}</h2>
                <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                  <MailCheck className="h-4 w-4 shrink-0" />
                  {user.email}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant={user.status === 'ACTIVE' ? 'success' : 'warning'}>
                    {user.status}
                  </Badge>
                  <Badge variant={user.emailVerifiedAt ? 'info' : 'warning'}>
                    {user.emailVerifiedAt ? 'Email verified' : 'Email pending'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-foreground">Account details</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Identity and access information from your current session.
                </p>
              </div>
              <span className="rounded-lg bg-brand-accent/10 p-2 text-brand-accent">
                <ShieldCheck className="h-4 w-4" />
              </span>
            </div>

            <dl className="mt-5 divide-y divide-border text-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0">
                <dt className="text-muted-foreground">Account status</dt>
                <dd className="font-medium text-foreground">{user.status}</dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 py-3">
                <dt className="text-muted-foreground">Portal access</dt>
                <dd className="font-medium text-foreground">{portalLabel(user.platformRole)}</dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 py-3 last:pb-0">
                <dt className="text-muted-foreground">Email verification</dt>
                <dd className="font-medium text-foreground">
                  {user.emailVerifiedAt ? 'Verified' : 'Pending'}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-accent/10 text-brand-accent">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold text-foreground">Organization access</h2>
                <p className="mt-1 text-xs text-muted-foreground">The context used for this session.</p>
              </div>
            </div>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Organization</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {activeOrganization?.name ?? 'Organization'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Active region</dt>
                <dd className="mt-1 flex items-center gap-1.5 font-medium text-foreground">
                  <Globe2 className="h-4 w-4 text-brand-accent" />
                  {activeRegion ?? 'All regions'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Available regions</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {availableRegions.length || 'All assigned regions'}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-accent/10 text-brand-accent">
                  <KeyRound className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-semibold text-foreground">Account security</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Additional sign-in protection.</p>
                </div>
              </div>
              <Badge variant={user.mfaEnabled ? 'success' : 'warning'}>
                {user.mfaEnabled ? 'Enabled' : 'Not enabled'}
              </Badge>
            </div>
            <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-muted-foreground">
              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-brand-accent" />
              Multi-factor authentication helps protect access to your organization portal.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
