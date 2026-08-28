import { apiClient } from '@lib/axios';

export interface AdminDashboardStats { organizations: number; users: number; permissions: number; roles: number; cases: number }
export interface AdminOrganization { id: string; name: string; slug: string; status: string; members: number; cases: number; createdAt: string }
export interface AdminPermission { id: string; key: string; resource: string; action: string; roles: number }
export interface AdminRole { id: string; name: string; scope: string; system: boolean; permissions: number }
export interface AdminUser { id: string; email: string; displayName: string | null; platformRole: string; status: string; organizations: number; createdAt: string }
export interface AdminSettings { product: string; apiEnvironment: string; organizations: number; users: number; cases: number }

export const adminService = {
  dashboard: () => apiClient.get<AdminDashboardStats>('/admin/dashboard').then((r) => r.data),
  organizations: () => apiClient.get<AdminOrganization[]>('/admin/organizations').then((r) => r.data),
  permissions: () => apiClient.get<AdminPermission[]>('/admin/permissions').then((r) => r.data),
  roles: () => apiClient.get<AdminRole[]>('/admin/roles').then((r) => r.data),
  users: () => apiClient.get<AdminUser[]>('/admin/users').then((r) => r.data),
  settings: () => apiClient.get<AdminSettings>('/admin/settings').then((r) => r.data),
  plans: () => apiClient.get<unknown[]>('/admin/plans').then((r) => r.data),
  configPacks: () => apiClient.get<unknown[]>('/admin/config-packs').then((r) => r.data),
  capabilities: () => apiClient.get<AdminPermission[]>('/admin/capabilities').then((r) => r.data),
};
