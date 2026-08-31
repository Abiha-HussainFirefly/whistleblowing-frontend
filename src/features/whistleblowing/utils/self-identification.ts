/**
 * Warns an anonymous reporter when their own words may identify them.
 *
 * The most common way anonymity fails on a platform like this is not a technical
 * flaw — it is the reporter writing "I'm the only person on the night shift who
 * handles these invoices" and not realising that names them. Nobody else can spot
 * that for them: the investigator reading it already knows the team.
 *
 * Design constraints, in order of importance:
 *
 *   1. **This never blocks a submission.** Someone deciding to identify
 *      themselves is making a legitimate choice, and a reporter who has worked up
 *      to filing must not be stopped by a heuristic. It advises; it does not gate.
 *   2. **It runs entirely in the browser.** The draft is not sent anywhere to be
 *      analysed — that would create exactly the exposure being warned about.
 *   3. **It is deliberately conservative.** A false alarm costs a moment's
 *      reading; a missed one can cost someone their job. Where the two trade off,
 *      it errs towards warning.
 */

export type SelfIdentificationRisk =
  | 'contact-details'
  | 'explicit-identity'
  | 'unique-role'
  | 'small-group';

export interface SelfIdentificationFinding {
  risk: SelfIdentificationRisk;
  /** Translation key for the advice shown to the reporter. */
  messageKey: string;
}

interface Rule {
  risk: SelfIdentificationRisk;
  messageKey: string;
  pattern: RegExp;
}

const RULES: readonly Rule[] = [
  {
    risk: 'contact-details',
    messageKey: 'selfIdentification.contactDetails',
    // Email address.
    pattern: /[\w.+-]+@[\w-]+\.[\w.-]{2,}/,
  },
  {
    risk: 'contact-details',
    messageKey: 'selfIdentification.contactDetails',
    // Phone-like run of digits, allowing spaces, dashes and a country prefix.
    pattern: /(?:\+\d{1,3}[\s-]?)?(?:\d[\s-]?){9,}\d/,
  },
  {
    risk: 'explicit-identity',
    messageKey: 'selfIdentification.explicitIdentity',
    pattern: /\b(my name is|i am called|this is [A-Z][a-z]+ [A-Z][a-z]+|signed,?\s+[A-Z][a-z]+)\b/i,
  },
  {
    risk: 'unique-role',
    messageKey: 'selfIdentification.uniqueRole',
    // "I am the only ...", "the sole person who ...", "I'm the sole".
    pattern: /\b(i am the only|i'm the only|the only (?:one|person|member) who|the sole (?:person|employee|member))\b/i,
  },
  {
    risk: 'small-group',
    messageKey: 'selfIdentification.smallGroup',
    // "one of two people", "only three of us", "just the two of us".
    pattern: /\b(one of (?:two|three|four|2|3|4)\b|only (?:two|three|four|2|3|4) of us|just the (?:two|three) of us)\b/i,
  },
];

/**
 * Returns the distinct risks detected in the draft.
 *
 * Empty when nothing matched, which is the normal case — the warning should be
 * rare enough that seeing it means something.
 */
export function detectSelfIdentification(text: string): SelfIdentificationFinding[] {
  if (text.trim().length === 0) return [];

  const seen = new Set<SelfIdentificationRisk>();
  const findings: SelfIdentificationFinding[] = [];

  for (const rule of RULES) {
    if (seen.has(rule.risk)) continue;
    if (!rule.pattern.test(text)) continue;
    seen.add(rule.risk);
    findings.push({ risk: rule.risk, messageKey: rule.messageKey });
  }

  return findings;
}
