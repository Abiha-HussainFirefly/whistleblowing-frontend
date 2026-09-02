import { apiClient } from '@lib/axios';
import { useAuthStore } from '@store/authStore';

function organizationId(): string {
  const organization = useAuthStore.getState().activeOrganization;
  if (organization) return organization.id;
  const storedId = typeof localStorage !== 'undefined' ? localStorage.getItem('wb.organizationId') : null;
  if (storedId) return storedId;
  throw new Error('No active organization context');
}

export interface TenantStats {
  organization: { id: string; name: string; slug: string; whistleblowingEnabled: boolean };
  members: number;
  admins: number;
  users: number;
  activeRegions: number;
  enabledModules: string[];
}

export interface TenantMember {
  id: string;
  userId: string;
  displayName: string | null;
  email: string;
  status: string;
  accountStatus: string;
  regionCode: string | null;
  roles: { id: string; name: string; permissions: string[] }[];
  joinedAt: string;
}

export interface TenantInvitation {
  id: string;
  email: string;
  displayName: string | null;
  regionCode: string | null;
  status: string;
  expiresAt: string;
  invitedBy?: { id: string | null; email: string | null; displayName: string | null } | null;
  inviteUrl?: string;
  delivery?: 'development-preview';
}

export interface TenantRole {
  id: string;
  name: string;
  system: boolean;
  memberCount: number;
  permissions: { id: string; key: string; resource?: string; action?: string }[];
}

export interface TenantRegion {
  id: string;
  regionCode: string;
  displayName: string;
  timezone: string;
  currency: string | null;
  isHeadquarter: boolean;
  isActive: boolean;
  memberCount: number;
}

export interface TenantSettings {
  id: string;
  name: string;
  slug: string;
  status: string;
  whistleblowingEnabled: boolean;
  logoUrl: string | null;
  brandColor: string | null;
}

export const tenantAdminService = {
  stats() { return apiClient.get<TenantStats>(`/organizations/${organizationId()}/stats`).then((r) => r.data); },
  members(params?: { page?: number; pageSize?: number; search?: string }) { return apiClient.get<{ data: TenantMember[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }>(`/organizations/${organizationId()}/members`, { params }).then((r) => r.data); },
  exportMembersPdf(search?: string) { return apiClient.get<Blob>(`/organizations/${organizationId()}/members/export.pdf`, { params: search ? { search } : undefined, responseType: 'blob' }).then((r) => r.data); },
  updateMember(id: string, data: { status?: string; regionCode?: string | null; roleIds?: string[] }) { return apiClient.patch(`/organizations/${organizationId()}/members/${id}`, data); },
  deleteMember(id: string) { return apiClient.delete(`/organizations/${organizationId()}/members/${id}`); },
  invitations(params?: { page?: number; pageSize?: number }) { return apiClient.get<{ data: TenantInvitation[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }>(`/organizations/${organizationId()}/invitations`, { params }).then((r) => r.data); },
  createInvitation(data: { email: string; displayName?: string; regionCode?: string; roleId?: string }) { return apiClient.post<TenantInvitation>(`/organizations/${organizationId()}/invitations`, data).then((r) => r.data); },
  revokeInvitation(id: string) { return apiClient.delete(`/organizations/${organizationId()}/invitations/${id}`); },
  roles() { return apiClient.get<TenantRole[]>(`/organizations/${organizationId()}/roles`).then((r) => r.data); },
  permissionCatalog() { return apiClient.get<{ id: string; key: string; resource: string; action: string }[]>(`/organizations/${organizationId()}/roles/permission-catalog`).then((r) => r.data); },
  createRole(data: { name: string; permissionIds: string[] }) { return apiClient.post<TenantRole>(`/organizations/${organizationId()}/roles`, data).then((r) => r.data); },
  deleteRole(id: string) { return apiClient.delete(`/organizations/${organizationId()}/roles/${id}`); },
  regions() { return apiClient.get<TenantRegion[]>(`/organizations/${organizationId()}/regions`).then((r) => r.data); },
  createRegion(data: { regionCode: string; displayName: string }) { return apiClient.post<TenantRegion>(`/organizations/${organizationId()}/regions`, data).then((r) => r.data); },
  updateRegion(id: string, data: { displayName?: string; isActive?: boolean }) { return apiClient.patch<TenantRegion>(`/organizations/${organizationId()}/regions/${id}`, data).then((r) => r.data); },
  deactivateRegion(id: string) { return apiClient.delete(`/organizations/${organizationId()}/regions/${id}`); },
  settings() { return apiClient.get<TenantSettings>(`/organizations/${organizationId()}/settings`).then((r) => r.data); },
  updateSettings(data: Partial<Pick<TenantSettings, 'name' | 'logoUrl' | 'brandColor'>>) { return apiClient.patch<TenantSettings>(`/organizations/${organizationId()}/settings`, data).then((r) => r.data); },
  plan() { return apiClient.get<{ name: string; status: string; limits: Record<string, { used: number; max: number | null }>; enabledModules: string[] }>(`/organizations/${organizationId()}/plan`).then((r) => r.data); },
  integrations() { return apiClient.get<{ integrations: { key: string; name: string; mode: string; status: string }[] }>(`/organizations/${organizationId()}/integrations`).then((r) => r.data); },
};
