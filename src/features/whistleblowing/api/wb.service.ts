import { apiClient } from '@lib/axios';
import type {
  UserRef,
  AssignInput,
  CloseInput,
  CommentInput,
  EscalateInput,
  LinkInput,
  ManualCreateInput,
  PaginatedResponse,
  ParticipantInput,
  ResolveInput,
  SetPriorityInput,
  TriageInput,
  UpdateCaseDetailsInput,
  UpdateSynopsisInput,
  WbCaseDetail,
  WbCaseListItem,
  WbCaseListParams,
  WbStats,
} from '../types';

/**
 * Whistleblowing internal API surface — thin wrappers around `apiClient`.
 * Region scoping is applied transparently via the axios `X-Region` interceptor.
 * Maps the backend `/whistleblowing/cases/*` and `/whistleblowing/dashboard/*`
 * controllers.
 */
export const wbService = {
  list(params?: WbCaseListParams) {
    return apiClient
      .get<PaginatedResponse<WbCaseListItem>>('/whistleblowing/cases', { params })
      .then((r) => r.data);
  },

  get(id: string) {
    return apiClient.get<WbCaseDetail>(`/whistleblowing/cases/${id}`).then((r) => r.data);
  },

  manualCreate(data: ManualCreateInput) {
    return apiClient.post<WbCaseDetail>('/whistleblowing/cases/manual', data).then((r) => r.data);
  },

  // ── Workflow ──────────────────────────────────────────────────────────────

  triage(id: string, data: TriageInput) {
    return apiClient
      .post<WbCaseDetail>(`/whistleblowing/cases/${id}/triage`, data)
      .then((r) => r.data);
  },
  setPriority(id: string, data: SetPriorityInput) {
    return apiClient
      .post<WbCaseDetail>(`/whistleblowing/cases/${id}/priority`, data)
      .then((r) => r.data);
  },
  assign(id: string, data: AssignInput) {
    return apiClient
      .post<WbCaseDetail>(`/whistleblowing/cases/${id}/assign`, data)
      .then((r) => r.data);
  },
  escalate(id: string, data: EscalateInput) {
    return apiClient
      .post<WbCaseDetail>(`/whistleblowing/cases/${id}/escalate`, data)
      .then((r) => r.data);
  },
  resolve(id: string, data: ResolveInput) {
    return apiClient
      .post<WbCaseDetail>(`/whistleblowing/cases/${id}/resolve`, data)
      .then((r) => r.data);
  },
  close(id: string, data: CloseInput) {
    return apiClient
      .post<WbCaseDetail>(`/whistleblowing/cases/${id}/close`, data)
      .then((r) => r.data);
  },

  // ── Case details + synopsis ─────────────────────────────────────────────────

  updateDetails(id: string, data: UpdateCaseDetailsInput) {
    return apiClient
      .patch<WbCaseDetail>(`/whistleblowing/cases/${id}/details`, data)
      .then((r) => r.data);
  },
  updateSynopsis(id: string, data: UpdateSynopsisInput) {
    return apiClient
      .patch<WbCaseDetail>(`/whistleblowing/cases/${id}/synopsis`, data)
      .then((r) => r.data);
  },

  // ── Participants ──────────────────────────────────────────────────────────────

  addParticipant(id: string, data: ParticipantInput) {
    return apiClient
      .post<WbCaseDetail>(`/whistleblowing/cases/${id}/participants`, data)
      .then((r) => r.data);
  },
  updateParticipant(id: string, participantId: string, data: Partial<ParticipantInput>) {
    return apiClient
      .patch<WbCaseDetail>(`/whistleblowing/cases/${id}/participants/${participantId}`, data)
      .then((r) => r.data);
  },
  removeParticipant(id: string, participantId: string) {
    return apiClient
      .delete<WbCaseDetail>(`/whistleblowing/cases/${id}/participants/${participantId}`)
      .then((r) => r.data);
  },

  // ── Case linking ────────────────────────────────────────────────────────────

  link(id: string, data: LinkInput) {
    return apiClient
      .post<WbCaseDetail>(`/whistleblowing/cases/${id}/link`, data)
      .then((r) => r.data);
  },
  unlink(id: string, relatedId: string) {
    return apiClient
      .delete<WbCaseDetail>(`/whistleblowing/cases/${id}/link/${relatedId}`)
      .then((r) => r.data);
  },

  // ── Comment thread ────────────────────────────────────────────────────────

  addComment(id: string, data: CommentInput) {
    return apiClient
      .post<WbCaseDetail>(`/whistleblowing/cases/${id}/comments`, data)
      .then((r) => r.data);
  },

  // ── Evidence ─────────────────────────────────────────────────────────────────

  addAttachment(id: string, file: File, label?: string) {
    const form = new FormData();
    form.append('file', file);
    if (label !== undefined && label.length > 0) {
      form.append('label', label);
    }
    return apiClient
      .post<WbCaseDetail>(`/whistleblowing/cases/${id}/attachments`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  downloadAttachment(id: string, documentId: string) {
    return apiClient
      .get<{ url: string }>(`/whistleblowing/cases/${id}/attachments/${documentId}/download`)
      .then((r) => r.data);
  },

  /** Org users eligible to be assigned as investigators (admin-only). */
  investigators(caseId?: string) {
    return apiClient
      .get<UserRef[]>('/whistleblowing/cases/assignable-investigators', {
        params: caseId !== undefined ? { caseId } : undefined,
      })
      .then((r) => r.data);
  },

  // ── Dashboard ────────────────────────────────────────────────────────────────

  getStats() {
    return apiClient.get<WbStats>('/whistleblowing/dashboard/stats').then((r) => r.data);
  },

  /** Fetch the CSV as a blob (so the bearer + region headers are attached). */
  exportCsv() {
    return apiClient
      .get('/whistleblowing/dashboard/export.csv', { responseType: 'blob' })
      .then((r) => r.data as Blob);
  },
} as const;

/** Trigger a browser download of the CSV export with auth headers attached. */
export async function downloadWbCsv(): Promise<void> {
  const blob = await wbService.exportCsv();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'whistleblowing-cases.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
