import { describe, expect, it } from 'vitest';
import { detectSelfIdentification } from './self-identification';

const risks = (text: string) => detectSelfIdentification(text).map((f) => f.risk);

describe('self-identification detection', () => {
  describe('stays quiet on ordinary reports', () => {
    it.each([
      'A manager approved invoices for a company he owns.',
      'Safety guards were removed from the press in the west workshop.',
      'Expenses were claimed for travel that did not take place.',
      'Two suppliers were paid for the same delivery in March.',
      '',
      '   ',
    ])('finds nothing in: %s', (text) => {
      expect(detectSelfIdentification(text)).toEqual([]);
    });
  });

  describe('contact details', () => {
    it('warns about an email address', () => {
      expect(risks('Contact me at jane.doe@example.com if needed.')).toContain('contact-details');
    });

    it('warns about a phone number', () => {
      expect(risks('You can reach me on +44 7700 900123.')).toContain('contact-details');
    });

    it('does not treat a short number as a phone number', () => {
      // Dates, amounts and case references must not trigger the warning.
      expect(risks('This happened on 12 March 2026 and involved 4500 pounds.')).not.toContain('contact-details');
    });
  });

  describe('explicit identity', () => {
    it('warns when the reporter states their name', () => {
      expect(risks('My name is Jane Doe and I work in finance.')).toContain('explicit-identity');
    });

    it('warns on a sign-off', () => {
      expect(risks('Please look into this. Signed, Jane')).toContain('explicit-identity');
    });
  });

  describe('inferable identity', () => {
    it('warns when the reporter describes a unique role', () => {
      // This is the failure mode the feature exists for: nothing here is a name,
      // but it identifies one person to anyone who knows the team.
      expect(risks('I am the only person who reconciles these accounts.')).toContain('unique-role');
      expect(risks("I'm the only one with access to that system.")).toContain('unique-role');
    });

    it('warns when the reporter narrows themselves to a small group', () => {
      expect(risks('I am one of two people on the night shift.')).toContain('small-group');
      expect(risks('Only three of us were in the room.')).toContain('small-group');
    });
  });

  it('reports each distinct risk once', () => {
    const findings = detectSelfIdentification(
      'My name is Jane Doe, reach me at jane@example.com or +44 7700 900123.',
    );
    expect(findings).toHaveLength(2);
    expect(findings.map((f) => f.risk).sort()).toEqual(['contact-details', 'explicit-identity']);
  });

  it('returns a translation key for every finding', () => {
    for (const finding of detectSelfIdentification('I am the only auditor here, email me@example.com')) {
      expect(finding.messageKey).toMatch(/^selfIdentification\./);
    }
  });
});
