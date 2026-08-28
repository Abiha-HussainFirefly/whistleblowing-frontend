import { describe, expect, it } from 'vitest';
import { canRenderCaseAction, pageCount, validateReporterDraft } from './workflow-logic';

describe('whistleblowing frontend workflow logic', () => {
  it('validates public reporting requirements and future dates', () => {
    const base = { category: 'FRAUD', description: 'A sufficiently detailed report.', acceptedTerms: true, anonymous: true };
    expect(validateReporterDraft(base)).toBeNull();
    expect(validateReporterDraft({ ...base, category: '' })).toBe('category');
    expect(validateReporterDraft({ ...base, description: 'short' })).toBe('description');
    expect(validateReporterDraft({ ...base, incidentDate: '2099-01-01' }, '2026-08-25')).toBe('future-date');
    expect(validateReporterDraft({ ...base, anonymous: false })).toBe('email');
    expect(validateReporterDraft({ ...base, acceptedTerms: false })).toBe('terms');
  });

  it('gates case actions by the real permission keys', () => {
    expect(canRenderCaseAction(['whistleblowing_case:read'], 'investigate')).toBe(false);
    expect(canRenderCaseAction(['whistleblowing_case:investigate'], 'investigate')).toBe(true);
    expect(canRenderCaseAction(['whistleblowing_case:admin'], 'admin')).toBe(true);
  });

  it('calculates reporter and case-list pagination safely', () => {
    expect(pageCount(0, 20)).toBe(1);
    expect(pageCount(21, 20)).toBe(2);
    expect(pageCount(21, 0)).toBe(21);
  });
});
