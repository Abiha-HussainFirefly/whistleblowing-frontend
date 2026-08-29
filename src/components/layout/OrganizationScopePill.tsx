import { Building2 } from 'lucide-react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@store/authStore';

export function OrganizationScopePill({ admin = false }: { admin?: boolean }): ReactElement {
  const { t } = useTranslation();
  const organization = useAuthStore((state) => state.activeOrganization);
  return (
    <div className="hidden max-w-[15rem] items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5 text-xs text-muted-foreground shadow-sm md:flex">
      <Building2 className="h-4 w-4 shrink-0 text-brand-accent" />
      <span className="truncate" title={organization?.name ?? undefined}>
        {organization?.name ?? t('shell.organizationFallback', { defaultValue: 'Organization' })}
      </span>
      <span className="text-muted-foreground/70">/</span>
      <span className="font-medium text-muted-foreground">{admin ? 'Tenant' : 'User'}</span>
    </div>
  );
}
