import { Building2 } from 'lucide-react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@store/authStore';

export function OrganizationScopePill({ admin = false }: { admin?: boolean }): ReactElement {
  const { t } = useTranslation();
  const organization = useAuthStore((state) => state.activeOrganization);
  return (
    <div className="hidden max-w-[15rem] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm md:flex">
      <Building2 className="h-4 w-4 shrink-0 text-brand-accent" />
      <span className="truncate" title={organization?.name ?? undefined}>
        {organization?.name ?? t('shell.organizationFallback', { defaultValue: 'Organization' })}
      </span>
      <span className="text-slate-300">/</span>
      <span className="font-medium text-slate-500">{admin ? 'Tenant' : 'User'}</span>
    </div>
  );
}
