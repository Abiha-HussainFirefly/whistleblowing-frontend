import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@config/env';
import { getReporterToken } from '../reporterSession';
import type {
  PortalOrgInfo,
  ReporterCaseView,
  ReporterCommentPage,
  ReporterSession,
  ReporterSubmitResult,
  SubmitReportInput,
} from '../types';

/**
 * Dedicated Axios instance for the anonymous reporter portal. It is fully
 * isolated from the platform `apiClient`: it never reads the user auth store and
 * attaches ONLY the case-scoped reporter token (from sessionStorage) when one
 * exists. Public routes (portal info, submit, login) carry no token at all.
 */
const reporterClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  withCredentials: false,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

reporterClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getReporterToken();
  if (token !== null && token.length > 0) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

export const reporterService = {
  portalInfo(slug: string) {
    return reporterClient
      .get<PortalOrgInfo>(`/whistleblowing/portal/org/${encodeURIComponent(slug)}`)
      .then((r) => r.data);
  },

  submit(data: SubmitReportInput) {
    return reporterClient
      .post<ReporterSubmitResult>('/whistleblowing/portal/reports', data)
      .then((r) => r.data);
  },

  login(caseReferenceNumber: string, password: string) {
    return reporterClient
      .post<ReporterSession>('/whistleblowing/portal/login', { caseReferenceNumber, password })
      .then((r) => r.data);
  },

  myCase() {
    return reporterClient.get<ReporterCaseView>('/whistleblowing/portal/me').then((r) => r.data);
  },

  myComments(page: number, pageSize: number) {
    return reporterClient
      .get<ReporterCommentPage>('/whistleblowing/portal/me/comments', {
        params: { page, pageSize },
      })
      .then((r) => r.data);
  },

  addComment(content: string) {
    return reporterClient
      .post<ReporterCaseView>('/whistleblowing/portal/me/comments', { content })
      .then((r) => r.data);
  },

  addAttachment(file: File) {
    const form = new FormData();
    form.append('file', file);
    return reporterClient
      .post<ReporterCaseView>('/whistleblowing/portal/me/attachments', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
} as const;
