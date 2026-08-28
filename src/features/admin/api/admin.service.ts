import { apiClient } from '@lib/axios';

export interface AdminDashboardStats { organizations: number; users: number; permissions: number; roles: number; cases: number }
export interface AdminOrganization { id: string; name: string; slug: string; status: string; members: number; cases: number; createdAt: string }
export interface AdminPermission { id: string; key: string; resource: string; action: string; roles: number; isActive: boolean; locked: boolean }
export interface AdminRolePermission { id: string; key: string }
export interface AdminRole { id: string; name: string; scope: string; organizationId: string | null; system: boolean; locked: boolean; permissions: AdminRolePermission[] }
export interface AdminUser { id: string; email: string; displayName: string | null; platformRole: string; roles: string[]; status: string; organizations: number; createdAt: string }
export interface AdminSettings { product: string; apiEnvironment: string; organizations: number; users: number; cases: number }

export const adminService = {
  dashboard: () => apiClient.get<AdminDashboardStats>('/admin/dashboard').then((r) => r.data),
  organizations: () => apiClient.get<AdminOrganization[]>('/admin/organizations').then((r) => r.data),
  createOrganization: (input: { name: string; slug: string }) => apiClient.post<AdminOrganization>('/admin/organizations', input).then((r) => r.data),
  updateOrganization: (id: string, input: { name?: string; whistleblowingEnabled?: boolean }) => apiClient.patch<AdminOrganization>(`/admin/organizations/${id}`, input).then((r) => r.data),
  permissions: () => apiClient.get<AdminPermission[]>('/admin/permissions').then((r) => r.data),
  createPermission: (input: { resource: string; action: string }) => apiClient.post<AdminPermission>('/admin/permissions', input).then((r) => r.data),
  updatePermission: (id: string, input: { isActive: boolean }) => apiClient.patch<AdminPermission>(`/admin/permissions/${id}`, input).then((r) => r.data),
  roles: () => apiClient.get<AdminRole[]>('/admin/roles').then((r) => r.data),
  createRole: (input: { name: string; organizationId?: string; permissionIds?: string[] }) => apiClient.post<AdminRole>('/admin/roles', input).then((r) => r.data),
  updateRole: (id: string, input: { name?: string; permissionIds?: string[] }) => apiClient.patch<AdminRole>(`/admin/roles/${id}`, input).then((r) => r.data),
  users: () => apiClient.get<AdminUser[]>('/admin/users').then((r) => r.data),
  createUser: (input: { email: string; password: string; displayName?: string }) => apiClient.post<AdminUser>('/admin/users', input).then((r) => r.data),
  updateUser: (id: string, input: { status?: 'Active' | 'Suspended'; displayName?: string | null }) => apiClient.patch<AdminUser>(`/admin/users/${id}`, input).then((r) => r.data),
  settings: () => apiClient.get<AdminSettings>('/admin/settings').then((r) => r.data),
  plans: () => apiClient.get<unknown[]>('/admin/plans').then((r) => r.data),
  configPacks: () => apiClient.get<unknown[]>('/admin/config-packs').then((r) => r.data),
  capabilities: () => apiClient.get<AdminPermission[]>('/admin/capabilities').then((r) => r.data),
};
