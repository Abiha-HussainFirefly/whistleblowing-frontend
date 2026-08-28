import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { ApiError } from '@lib/axios';
import { contextQueryKey } from '@lib/context-query-key';
import { useAuthStore } from '@store/authStore';
import {
  wbOversightService,
  type WbOversightCaseParams,
  type WbOversightStatsParams,
  type WbOversightScopeView,
} from '../api/whistleblowing-oversight.service';
import type {
  PaginatedResponse,
  WbCaseDetail,
  WbCaseListItem,
  WbStats,
} from '@features/whistleblowing/types';

const keys = {
  get all() { return contextQueryKey('wb-oversight'); },
  scope: () => [...keys.all, 'scope'] as const,
  stats: (params?: WbOversightStatsParams) => [...keys.all, 'stats', params ?? {}] as const,
  cases: (params?: WbOversightCaseParams) => [...keys.all, 'cases', params] as const,
  case: (id: string) => [...keys.all, 'case', id] as const,
};

export function useWbOversightScope(): UseQueryResult<WbOversightScopeView, ApiError> {
  const hasOrganization = useAuthStore((state) => state.activeOrganization !== null);
  return useQuery({ queryKey: keys.scope(), queryFn: () => wbOversightService.getScope(), enabled: hasOrganization });
}

export function useWbOversightStats(params?: WbOversightStatsParams): UseQueryResult<WbStats, ApiError> {
  const hasOrganization = useAuthStore((state) => state.activeOrganization !== null);
  return useQuery({
    queryKey: keys.stats(params),
    queryFn: () => wbOversightService.getStats(params),
    enabled: hasOrganization,
    staleTime: 30_000,
  });
}

export function useWbOversightCases(
  params?: WbOversightCaseParams,
): UseQueryResult<PaginatedResponse<WbCaseListItem>, ApiError> {
  const hasOrganization = useAuthStore((state) => state.activeOrganization !== null);
  return useQuery({
    queryKey: keys.cases(params),
    queryFn: () => wbOversightService.listCases(params),
    enabled: hasOrganization,
  });
}

export function useWbOversightCase(id: string): UseQueryResult<WbCaseDetail, ApiError> {
  return useQuery({
    queryKey: keys.case(id),
    queryFn: () => wbOversightService.getCase(id),
    enabled: id.length > 0,
  });
}
