export type ReporterDraft = { category: string; description: string; incidentDate?: string; acceptedTerms: boolean; anonymous: boolean; email?: string };

export function validateReporterDraft(draft: ReporterDraft, today = new Date().toISOString().slice(0, 10)): string | null {
  if (!draft.category) return 'category';
  if (draft.description.trim().length < 10) return 'description';
  if (draft.description.length > 20_000) return 'description-too-long';
  if (draft.incidentDate && draft.incidentDate > today) return 'future-date';
  if (!draft.anonymous && !draft.email?.trim()) return 'email';
  if (!draft.acceptedTerms) return 'terms';
  return null;
}

export function canRenderCaseAction(permissions: string[], action: 'investigate' | 'admin'): boolean {
  return permissions.includes(`whistleblowing_case:${action}`);
}

export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
}
