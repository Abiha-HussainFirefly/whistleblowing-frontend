import { apiClient } from '@lib/axios';
import { useAuthStore } from '@store/authStore';
import type {
  PaginatedResponse,
  WbCaseDetail,
  WbCaseListItem,
  WbCaseListParams,
  WbStats,
} from '@features/whistleblowing/types';

function getOrgId(): string {
  const org = useAuthStore.getState().activeOrganization;
  if (org) return org.id;
  const storedId = typeof localStorage !== 'undefined' ? localStorage.getItem('wb.organizationId') : null;
  if (storedId) return storedId;
  throw new Error('No active organization context');
}

export interface WbOversightRegion {
  regionCode: string;
  caseCount: number;
}
export interface WbOversightScopeView {
  isCrossRegion: boolean;
  regions: WbOversightRegion[];
}

export type WbOversightCaseParams = WbCaseListParams & { regionCode?: string };
export type WbOversightStatsParams = { regionCode?: string; dateFrom?: string; dateTo?: string };

/**
 * Org-admin **Whistleblowing oversight** API. Read-only, org-scoped, region- and
 * Conflict-of-Interest-aware. Backed by `/organizations/:orgId/whistleblowing/*`
 * (gated by `organization:read`). A case the reporter hid from the calling admin
 * is excluded server-side (list omits it; detail 404s).
 */
export const wbOversightService = {
  getScope() {
    return apiClient
      .get<WbOversightScopeView>(`/organizations/${getOrgId()}/whistleblowing/regions`)
      .then((r) => r.data);
  },

  getStats(params?: WbOversightStatsParams) {
    return apiClient
      .get<WbStats>(`/organizations/${getOrgId()}/whistleblowing/stats`, { params })
      .then((r) => r.data);
  },

  listCases(params?: WbOversightCaseParams) {
    return apiClient
      .get<
        PaginatedResponse<WbCaseListItem>
      >(`/organizations/${getOrgId()}/whistleblowing/cases`, { params })
      .then((r) => r.data);
  },

  getCase(caseId: string) {
    return apiClient
      .get<WbCaseDetail>(`/organizations/${getOrgId()}/whistleblowing/cases/${caseId}`)
      .then((r) => r.data);
  },
} as const;
