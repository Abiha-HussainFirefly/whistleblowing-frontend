import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import type { ApiError } from '@lib/axios';
import { contextQueryKey } from '@lib/context-query-key';
import { wbService } from '../api/wb.service';
import type {
  AssignInput,
  CloseInput,
  CommentInput,
  EscalateInput,
  LinkInput,
  ManualCreateInput,
  PaginatedResponse,
  ParticipantInput,
  ResolveInput,
  ReviewInput,
  SetPriorityInput,
  TriageInput,
  UpdateCaseDetailsInput,
  UpdateSynopsisInput,
  UserRef,
  WbCaseDetail,
  WbCaseListItem,
  WbCaseListParams,
  WbStats,
} from '../types';

export const wbKeys = {
  get all() { return contextQueryKey('whistleblowing'); },
  list: (params?: WbCaseListParams) => [...wbKeys.all, 'list', params] as const,
  detail: (id: string) => [...wbKeys.all, 'detail', id] as const,
  stats: () => [...wbKeys.all, 'stats'] as const,
  investigators: (caseId?: string) => [...wbKeys.all, 'investigators', caseId] as const,
} as const;

/** Org-admin oversight reads from a separate key tree — refresh it too so an
 *  action taken from the org-admin Whistleblowing oversight updates its view. */
function invalidateOversight(qc: ReturnType<typeof useQueryClient>): void {
  void qc.invalidateQueries({ queryKey: contextQueryKey('wb-oversight') });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>): void {
  void qc.invalidateQueries({ queryKey: wbKeys.all });
  invalidateOversight(qc);
}

function invalidateDetail(qc: ReturnType<typeof useQueryClient>, id: string): void {
  void qc.invalidateQueries({ queryKey: wbKeys.detail(id) });
  void qc.invalidateQueries({ queryKey: [...wbKeys.all, 'list'] });
  void qc.invalidateQueries({ queryKey: wbKeys.stats() });
  invalidateOversight(qc);
}

// ── Queries ──────────────────────────────────────────────────────────────────

export function useWbCases(
  params?: WbCaseListParams,
): UseQueryResult<PaginatedResponse<WbCaseListItem>, ApiError> {
  return useQuery({ queryKey: wbKeys.list(params), queryFn: () => wbService.list(params) });
}

export function useWbCase(id: string): UseQueryResult<WbCaseDetail, ApiError> {
  return useQuery({
    queryKey: wbKeys.detail(id),
    queryFn: () => wbService.get(id),
    enabled: id.length > 0,
  });
}

export function useWbStats(): UseQueryResult<WbStats, ApiError> {
  return useQuery({
    queryKey: wbKeys.stats(),
    queryFn: () => wbService.getStats(),
    staleTime: 30_000,
  });
}

export function useWbInvestigators(
  enabled: boolean,
  caseId?: string,
): UseQueryResult<UserRef[], ApiError> {
  return useQuery({
    queryKey: wbKeys.investigators(caseId),
    queryFn: () => wbService.investigators(caseId),
    enabled,
    staleTime: 60_000,
  });
}

// ── Mutations ────────────────────────────────────────────────────────────────

export function useManualCreateCase(): UseMutationResult<
  WbCaseDetail,
  ApiError,
  ManualCreateInput
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => wbService.manualCreate(data),
    onSuccess: () => {
      invalidateAll(qc);
    },
  });
}

type DetailMutation<I> = UseMutationResult<WbCaseDetail, ApiError, { id: string; data: I }>;

function useDetailMutation<I>(
  fn: (id: string, data: I) => Promise<WbCaseDetail>,
): DetailMutation<I> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: I }) => fn(id, data),
    onSuccess: (_r, v) => {
      invalidateDetail(qc, v.id);
    },
  });
}

export const useTriageCase = (): DetailMutation<TriageInput> =>
  useDetailMutation((id, data) => wbService.triage(id, data));
export const useSetPriority = (): DetailMutation<SetPriorityInput> =>
  useDetailMutation((id, data) => wbService.setPriority(id, data));
export const useAssignCase = (): DetailMutation<AssignInput> =>
  useDetailMutation((id, data) => wbService.assign(id, data));
export const useEscalateCase = (): DetailMutation<EscalateInput> =>
  useDetailMutation((id, data) => wbService.escalate(id, data));
export const useResolveCase = (): DetailMutation<ResolveInput> =>
  useDetailMutation((id, data) => wbService.resolve(id, data));
export const useReviewCase = (): DetailMutation<ReviewInput> =>
  useDetailMutation((id, data) => wbService.review(id, data));
export const useCloseCase = (): DetailMutation<CloseInput> =>
  useDetailMutation((id, data) => wbService.close(id, data));
export const useLinkCase = (): DetailMutation<LinkInput> =>
  useDetailMutation((id, data) => wbService.link(id, data));
export const useCommentCase = (): DetailMutation<CommentInput> =>
  useDetailMutation((id, data) => wbService.addComment(id, data));
export const useUpdateCaseDetails = (): DetailMutation<UpdateCaseDetailsInput> =>
  useDetailMutation((id, data) => wbService.updateDetails(id, data));
export const useUpdateSynopsis = (): DetailMutation<UpdateSynopsisInput> =>
  useDetailMutation((id, data) => wbService.updateSynopsis(id, data));
export const useAddParticipant = (): DetailMutation<ParticipantInput> =>
  useDetailMutation((id, data) => wbService.addParticipant(id, data));

export function useUpdateParticipant(): UseMutationResult<
  WbCaseDetail,
  ApiError,
  { id: string; participantId: string; data: Partial<ParticipantInput> }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, participantId, data }) =>
      wbService.updateParticipant(id, participantId, data),
    onSuccess: (_r, v) => {
      invalidateDetail(qc, v.id);
    },
  });
}

export function useRemoveParticipant(): UseMutationResult<
  WbCaseDetail,
  ApiError,
  { id: string; participantId: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, participantId }) => wbService.removeParticipant(id, participantId),
    onSuccess: (_r, v) => {
      invalidateDetail(qc, v.id);
    },
  });
}

export function useUnlinkCase(): UseMutationResult<
  WbCaseDetail,
  ApiError,
  { id: string; relatedId: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, relatedId }) => wbService.unlink(id, relatedId),
    onSuccess: (_r, v) => {
      invalidateDetail(qc, v.id);
    },
  });
}

export function useAddWbAttachment(): UseMutationResult<
  WbCaseDetail,
  ApiError,
  { id: string; file: File; label?: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file, label }) => wbService.addAttachment(id, file, label),
    onSuccess: (_r, v) => {
      invalidateDetail(qc, v.id);
    },
  });
}
