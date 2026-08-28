import { useMemo } from 'react';
import { useAuthStore } from '@store/authStore';

export interface UsePermissionsResult {
  permissions: readonly string[];
  has: (permission: string) => boolean;
  hasAny: (permissions: readonly string[]) => boolean;
  hasModule: (moduleKey: string) => boolean;
  accessibleModules: readonly string[];
}

export function usePermissions(): UsePermissionsResult {
  const permissions = useAuthStore((state) => state.permissions);
  const role = useAuthStore((state) => state.user?.platformRole);
  return useMemo(() => {
    const elevated = role === 'SUPER_ADMIN';
    const permissionSet = new Set(permissions);
    const has = (permission: string): boolean => elevated || permissionSet.has(permission);
    const hasAny = (required: readonly string[]): boolean => elevated || required.some((item) => permissionSet.has(item));
    const hasModule = (_moduleKey: string): boolean => elevated || permissions.length > 0;
    return { permissions, has, hasAny, hasModule, accessibleModules: [] };
  }, [permissions, role]);
}
