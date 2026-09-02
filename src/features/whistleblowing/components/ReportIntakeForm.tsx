import { type ReactElement, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  EyeOff,
  KeyRound,
  Lock,
  Send,
} from 'lucide-react';

import { Button } from '@components/ui/button';
import { Callout } from '@components/ui/callout';
import { detectSelfIdentification } from '../utils/self-identification';
import { Input } from '@components/ui/input';
import { Select } from '@components/ui/select';
import { StepBar, StepBarCompact } from '@components/ui/step-bar';
import { Textarea } from '@components/ui/textarea';
import { getApiErrorMessage } from '@lib/api-error';
import { cn } from '@lib/utils';
import { reporterService } from '../api/reporter.service';
import { useReportTour } from '../hooks/useReportTour';
import {
  WB_AWARENESS_OPTIONS,
  WB_DURATION_OPTIONS,
  WB_PREVIOUSLY_REPORTED_OPTIONS,
  WB_RELATIONSHIP_OPTIONS,
} from '../utils/format';
import {
  wbAwarenessLabelT,
  wbCategoryLabelT,
  wbDurationLabelT,
  wbPreviouslyReportedLabelT,
  wbRelationshipLabelT,
} from '../utils/i18n';
import type {
  InvolvedPerson,
  PortalOrgInfo,
  ReporterSubmitResult,
  SubmitReportInput,
  WbAwarenessSource,
  WbConductDuration,
  WbPreviouslyReported,
  WbRelationship,
  WhistleblowingCategory,
} from '../types';
import { CategoryPicker } from './CategoryPicker';
import { InvolvedPersonsField } from './InvolvedPersonsField';

type ReportStepKey = 'incident' | 'location' | 'details' | 'identity' | 'review';

interface ReportStep {
  key: ReportStepKey;
  titleKey: string;
  fallback: string;
}

const REPORT_STEPS: readonly ReportStep[] = [
  { key: 'incident', titleKey: 'form.steps.incident', fallback: 'About the concern' },
  { key: 'location', titleKey: 'form.steps.location', fallback: 'Where it happened' },
  { key: 'details', titleKey: 'form.steps.details', fallback: 'People & timing' },
  { key: 'identity', titleKey: 'form.steps.identity', fallback: 'Identity & contact' },
  { key: 'review', titleKey: 'form.steps.review', fallback: 'Review & submit' },
] as const;

const INCIDENT_STEP_INDEX = 0;
const IDENTITY_STEP_INDEX = 3;
const REVIEW_STEP_INDEX = 4;

const DESCRIPTION_MAX = 20_000;

interface ReportIntakeFormProps {
  organizationSlug: string;
  orgInfo: PortalOrgInfo;
  onSubmitted: (result: ReporterSubmitResult) => void;
  tourTriggerTime?: number;
}

/**
 * English fallbacks for the self-identification advice.
 *
 * Wording follows the brand voice: it describes what the reader can check, and
 * never implies the report is wrong or that anonymity has already failed.
 */
const SELF_ID_FALLBACKS: Record<string, string> = {
  'contact-details': 'Your message appears to include contact details such as an email address or phone number.',
  'explicit-identity': 'Your message appears to state your name.',
  'unique-role': 'Your message describes a role only one person holds, which may point to you.',
  'small-group': 'Your message narrows this to a small group, which may point to you.',
};

export function ReportIntakeForm({
  organizationSlug,
  orgInfo,
  onSubmitted,
  tourTriggerTime = 0,
}: ReportIntakeFormProps): ReactElement {
  const { t } = useTranslation('whistleblowing');
  const submit = useMutation({
    mutationFn: (data: SubmitReportInput) => reporterService.submit(data),
  });
  const [step, setStep] = useState(0);
  const formTopRef = useRef<HTMLDivElement>(null);
  const currentStep: ReportStep = REPORT_STEPS[step] ?? {
    key: 'incident',
    titleKey: 'form.steps.incident',
    fallback: 'About the concern',
  };
  const reportStepTitles = REPORT_STEPS.map((item) =>
    t(item.titleKey, { defaultValue: item.fallback }),
  );
  const isFirstStep = step === 0;
  const isLastStep = step === REPORT_STEPS.length - 1;
  const { startTour } = useReportTour({
    onStepChange: setStep,
  });

  useEffect(() => {
    if (tourTriggerTime > 0) {
      startTour();
    }
  }, [tourTriggerTime, startTour]);

  const [category, setCategory] = useState<WhistleblowingCategory | ''>('');
  const [description, setDescription] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [region, setRegion] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [stateProvince, setStateProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [relationship, setRelationship] = useState<WbRelationship | ''>('');
  const [involved, setInvolved] = useState<InvolvedPerson[]>([]);
  const [previouslyReported, setPreviouslyReported] = useState<WbPreviouslyReported | ''>('');
  const [whenLast, setWhenLast] = useState('');
  const [duration, setDuration] = useState<WbConductDuration | ''>('');
  const [awareness, setAwareness] = useState<WbAwarenessSource | ''>('');
  const [anonymous, setAnonymous] = useState(true);

  /**
   * Advisory check on the reporter's own draft. Runs in the browser only - the
   * text is never sent anywhere to be analysed, which would create exactly the
   * exposure being warned about. Skipped once the reporter has chosen to be
   * named, since there is then nothing to reveal accidentally.
   */
  const selfIdentificationFindings = useMemo(
    () => (anonymous ? detectSelfIdentification(description) : []),
    [anonymous, description],
  );
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredContact, setPreferredContact] = useState('');
  const [conflictOfInterestDeclared, setConflictOfInterestDeclared] = useState(false);
  const [excludedIndependentReviewerIds, setExcludedIndependentReviewerIds] = useState<string[]>(
    [],
  );
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const independentAdminCount = orgInfo.complianceTeam.filter(
    (reviewer) => reviewer.isAdmin,
  ).length;
  const excludedIndependentAdminCount = orgInfo.complianceTeam.filter(
    (reviewer) => reviewer.isAdmin && excludedIndependentReviewerIds.includes(reviewer.id),
  ).length;

  const cleanedInvolved = (): InvolvedPerson[] =>
    involved
      .map((p) => ({
        firstName: p.firstName?.trim() ?? '',
        lastName: p.lastName?.trim() ?? '',
        title: p.title?.trim() ?? '',
      }))
      .filter((p) => p.firstName.length > 0 || p.lastName.length > 0 || p.title.length > 0);

  const validateIncidentStep = (): string | null => {
    if (category === '') {
      return t('form.validation.category', {
        defaultValue: 'Please choose an incident category.',
      });
    }
    if (description.trim().length < 10) {
      return t('form.validation.description', {
        defaultValue: 'Please provide a fuller description (at least 10 characters).',
      });
    }
    if (description.length > DESCRIPTION_MAX) {
      return t('form.validation.descriptionTooLong', {
        defaultValue: 'Please shorten the description to 20,000 characters or fewer.',
      });
    }
    if (incidentDate.length > 0 && incidentDate > new Date().toISOString().slice(0, 10)) {
      return t('form.validation.futureDate', {
        defaultValue: 'The incident date cannot be in the future.',
      });
    }
    return null;
  };

  const validateIdentityStep = (): string | null => {
    if (!anonymous && email.trim().length === 0) {
      return t('form.validation.email', {
        defaultValue: 'Provide an email, or choose to report anonymously.',
      });
    }
    return null;
  };

  const validateReviewStep = (): string | null => {
    if (!agreed) {
      return t('form.validation.terms', {
        defaultValue: 'Please accept the terms and conditions to submit your report.',
      });
    }
    return null;
  };

  const validateCurrentStep = (): string | null => {
    if (currentStep.key === 'incident') {
      return validateIncidentStep();
    }
    if (currentStep.key === 'identity') {
      return validateIdentityStep();
    }
    if (currentStep.key === 'review') {
      return validateReviewStep();
    }
    return null;
  };

  /**
   * Bring the top of the wizard back into view after a step change.
   *
   * The step buttons sit at the BOTTOM of a long form, so without this the
   * reporter presses "Continue" and is left staring at the footer of the next
   * step with no visible indication that anything happened. Scrolls the
   * scrollable ancestor when there is one (the authenticated shell scrolls a
   * `<main>`, not the window).
   */
  const scrollToTop = (): void => {
    if (typeof window === 'undefined') {
      return;
    }
    const anchor = formTopRef.current;
    if (anchor === null) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const goBack = (): void => {
    setError(null);
    setStep((value) => Math.max(0, value - 1));
    scrollToTop();
  };

  const goNext = (): void => {
    const validationError = validateCurrentStep();
    if (validationError !== null) {
      setError(validationError);
      return;
    }
    setError(null);
    scrollToTop();
    setStep((value) => Math.min(REPORT_STEPS.length - 1, value + 1));
  };

  const onSubmit = (): void => {
    const incidentError = validateIncidentStep();
    if (incidentError !== null) {
      setStep(INCIDENT_STEP_INDEX);
      setError(incidentError);
      return;
    }

    const identityError = validateIdentityStep();
    if (identityError !== null) {
      setStep(IDENTITY_STEP_INDEX);
      setError(identityError);
      return;
    }

    const reviewError = validateReviewStep();
    if (reviewError !== null) {
      setStep(REVIEW_STEP_INDEX);
      setError(reviewError);
      return;
    }

    const selectedCategory = category;
    if (selectedCategory === '') {
      setStep(INCIDENT_STEP_INDEX);
      setError(
        t('form.validation.category', {
          defaultValue: 'Please choose an incident category.',
        }),
      );
      return;
    }

    setError(null);
    const people = cleanedInvolved();
    const data: SubmitReportInput = {
      organizationSlug,
      category: selectedCategory,
      incidentDescription: description.trim(),
      isAnonymous: anonymous,
      acceptedTerms: true,
      ...(incidentDate.length > 0 ? { incidentDate } : {}),
      ...(location.trim().length > 0 ? { incidentLocation: location.trim() } : {}),
      ...(city.trim().length > 0 ? { locationCity: city.trim() } : {}),
      ...(stateProvince.trim().length > 0 ? { locationState: stateProvince.trim() } : {}),
      ...(postalCode.trim().length > 0 ? { locationPostalCode: postalCode.trim() } : {}),
      ...(country.trim().length > 0 ? { locationCountry: country.trim() } : {}),
      ...(relationship !== '' ? { relationshipToOrg: relationship } : {}),
      ...(people.length > 0 ? { involvedPersons: people } : {}),
      ...(previouslyReported !== '' ? { previouslyReported } : {}),
      ...(whenLast.trim().length > 0 ? { whenLastOccurred: whenLast.trim() } : {}),
      ...(duration !== '' ? { conductDuration: duration } : {}),
      ...(awareness !== '' ? { awarenessSource: awareness } : {}),
      ...(region.length > 0 ? { regionCode: region } : {}),
      ...(!anonymous && email.trim().length > 0 ? { reporterEmail: email.trim() } : {}),
      ...(!anonymous && phone.trim().length > 0 ? { reporterPhone: phone.trim() } : {}),
      ...(!anonymous && preferredContact.trim().length > 0
        ? { reporterPreferredContact: preferredContact.trim() }
        : {}),
      ...(conflictOfInterestDeclared
        ? {
            conflictOfInterestDeclared: true,
            ...(excludedIndependentReviewerIds.length > 0
              ? { hiddenFromUserPublicIds: excludedIndependentReviewerIds }
              : {}),
          }
        : {}),
    };
    submit.mutate(data, {
      onSuccess: onSubmitted,
      onError: (e) => {
        setError(getApiErrorMessage(e));
      },
    });
  };

  return (
    <div ref={formTopRef} className="w-full scroll-mt-24 space-y-6">
      {/* ---------------------------------------------------------- progress */}
      <div className="rounded-xl border border-border bg-card p-5">
        <StepBar
          titles={reportStepTitles}
          current={step}
          className="hidden sm:block"
          onStepSelect={(index) => {
            setError(null);
            setStep(index);
            scrollToTop();
          }}
        />
        <StepBarCompact titles={reportStepTitles} current={step} className="sm:hidden" />
      </div>

      {/* ------------------------------------------------- step 1: incident */}
      {currentStep.key === 'incident' && (
        <div key="incident" className="animate-fade-up space-y-6">
          <QuestionCard
            number={1}
            title={t('form.q.category.title', { defaultValue: 'What is your concern about?' })}
            hint={t('form.q.category.hint', {
              defaultValue: 'Choose the category that best matches your concern.',
            })}
            required
          >
            <div data-tour="category">
              <CategoryPicker
                categories={orgInfo.categories}
                value={category}
                onChange={setCategory}
                labelFor={(value) => wbCategoryLabelT(value, t)}
                searchPlaceholder={t('form.placeholders.searchCategory', {
                  defaultValue: 'Search categories...',
                })}
                emptyLabel={t('form.placeholders.noCategoryMatch', {
                  defaultValue: 'No category matches that search.',
                })}
                showAllLabel={t('form.placeholders.showAllCategories', {
                  defaultValue: 'Show {{count}} more categories',
                })}
                showLessLabel={t('form.placeholders.showFewerCategories', {
                  defaultValue: 'Show fewer categories',
                })}
              />
            </div>
          </QuestionCard>

          <QuestionCard
            number={2}
            title={t('form.q.description.title', {
              defaultValue: 'Please describe the concern in detail',
            })}
            hint={t('form.q.description.hint', {
              defaultValue: 'Include what happened, how often, and who was involved.',
            })}
            required
          >
            <div data-tour="description" className="space-y-2">
              <Textarea
                value={description}
                maxLength={DESCRIPTION_MAX}
                onChange={(e) => {
                  setDescription(e.target.value);
                }}
                rows={9}
                placeholder={t('form.placeholders.whatHappened', {
                  defaultValue:
                    'Provide as much detail as you can — who, what, where, when, and how you know this.',
                })}
              />
              <CharacterCount value={description.length} max={DESCRIPTION_MAX} />
              {/*
                A persistent live region rather than a conditionally mounted one:
                screen readers announce changes inside an existing region
                reliably, but often miss one that appears at the same moment. It
                is `polite` so it never interrupts someone mid-sentence.
              */}
              <div aria-live="polite" className="empty:hidden">
                {selfIdentificationFindings.length > 0 ? (
                  <Callout
                    tone="caution"
                    className="mt-2"
                    title={t('selfIdentification.heading', {
                      defaultValue: 'This may reveal who you are',
                    })}
                  >
                    <ul className="list-disc space-y-1 ps-5">
                      {selfIdentificationFindings.map((finding) => (
                        <li key={finding.risk}>
                          {t(finding.messageKey, {
                            defaultValue: SELF_ID_FALLBACKS[finding.risk] ?? '',
                          })}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2">
                      {t('selfIdentification.footer', {
                        defaultValue:
                          'You can still send your report exactly as written — this is only a prompt to check.',
                      })}
                    </p>
                  </Callout>
                ) : null}
              </div>
            </div>

            <Callout tone="tip" className="mt-4">
              {t('form.tips.beSpecific', {
                defaultValue:
                  'Stick to facts you know, and include specific details like dates, times, places and what was said. If you are unsure about something, say so — an incomplete report is still worth making.',
              })}
            </Callout>
          </QuestionCard>
        </div>
      )}

      {/* ------------------------------------------------- step 2: location */}
      {currentStep.key === 'location' && (
        <div key="location" className="animate-fade-up space-y-6">
          <QuestionCard
            number={3}
            title={t('form.q.location.title', { defaultValue: 'Where did this happen?' })}
            hint={t('form.q.location.hint', {
              defaultValue: 'Location or department where the incident occurred.',
            })}
          >
            <div data-tour="location">
              <Textarea
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                }}
                rows={3}
                placeholder={t('form.placeholders.location', {
                  defaultValue: 'Physical address, branch, department and/or store number',
                })}
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label={t('form.fields.city', { defaultValue: 'City' })}>
                <Input
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                  }}
                />
              </Field>
              <Field label={t('form.fields.state', { defaultValue: 'State / Province' })}>
                <Input
                  value={stateProvince}
                  onChange={(e) => {
                    setStateProvince(e.target.value);
                  }}
                />
              </Field>
              <Field label={t('form.fields.postalCode', { defaultValue: 'Zip / Postal code' })}>
                <Input
                  value={postalCode}
                  onChange={(e) => {
                    setPostalCode(e.target.value);
                  }}
                />
              </Field>
              <Field label={t('form.fields.country', { defaultValue: 'Country' })}>
                <Input
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                  }}
                />
              </Field>
            </div>

            {orgInfo.regions.length > 0 && (
              <div className="mt-4">
                <Field
                  label={t('form.fields.region', { defaultValue: 'Region / business unit' })}
                >
                  <Select
                    value={region}
                    onChange={(e) => {
                      setRegion(e.target.value);
                    }}
                  >
                    <option value="">
                      {t('form.placeholders.notSpecified', { defaultValue: 'Not specified' })}
                    </option>
                    {orgInfo.regions.map((r) => (
                      <option key={r.regionCode} value={r.regionCode}>
                        {r.displayName}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            )}
          </QuestionCard>
        </div>
      )}

      {/* -------------------------------------------------- step 3: details */}
      {currentStep.key === 'details' && (
        <div key="details" className="animate-fade-up space-y-6">
          <QuestionCard
            number={4}
            title={t('form.q.people.title', { defaultValue: 'Who is involved?' })}
            hint={t('form.q.people.hint', {
              defaultValue:
                'Naming someone here records them as a person named in the report. It is not a finding against them.',
            })}
          >
            <div data-tour="relationship">
              <Field
                label={t('form.fields.relationship', {
                  defaultValue: 'Your relationship to the organization',
                })}
              >
                <Select
                  value={relationship}
                  onChange={(e) => {
                    setRelationship(e.target.value as WbRelationship | '');
                  }}
                >
                  <option value="">
                    {t('form.placeholders.selectOne', { defaultValue: 'Select one...' })}
                  </option>
                  {WB_RELATIONSHIP_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {wbRelationshipLabelT(o.value, t)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div data-tour="involved" className="mt-4">
              <Field
                label={t('form.fields.involved', {
                  defaultValue: 'Person(s) named in this report',
                })}
              >
                <InvolvedPersonsField value={involved} onChange={setInvolved} />
              </Field>
            </div>

            <div className="mt-5">
              <span className="text-sm font-medium text-foreground">
                {t('form.fields.previouslyReported', {
                  defaultValue: 'Has this been raised with management before?',
                })}
              </span>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {WB_PREVIOUSLY_REPORTED_OPTIONS.map((o) => (
                  <label
                    key={o.value}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-lg border px-3.5 py-2 text-sm transition-colors',
                      previouslyReported === o.value
                        ? 'border-signal bg-signal-tint text-signal-strong'
                        : 'border-border bg-card text-foreground hover:border-signal/40',
                    )}
                  >
                    <input
                      type="radio"
                      name="previouslyReported"
                      checked={previouslyReported === o.value}
                      onChange={() => {
                        setPreviouslyReported(o.value);
                      }}
                      className="h-4 w-4 accent-signal"
                    />
                    {wbPreviouslyReportedLabelT(o.value, t)}
                  </label>
                ))}
              </div>
            </div>
          </QuestionCard>

          <QuestionCard
            number={5}
            title={t('form.q.timing.title', { defaultValue: 'When did this happen?' })}
            hint={t('form.q.timing.hint', {
              defaultValue: 'Approximate answers are fine. Leave anything blank if you are unsure.',
            })}
          >
            <div className="grid gap-4 sm:grid-cols-2" data-tour="dates">
              <Field
                label={t('form.fields.dateOfOccurrence', { defaultValue: 'Date of occurrence' })}
              >
                <input
                  type="date"
                  value={incidentDate}
                  onChange={(e) => {
                    setIncidentDate(e.target.value);
                  }}
                  className="flex h-11 w-full rounded-lg border border-border bg-muted/50 px-4 text-sm text-foreground transition-colors [color-scheme:light] focus:border-signal focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-80"
                />
              </Field>
              <Field
                label={t('form.fields.whenLast', { defaultValue: 'When did this last happen?' })}
              >
                <Input
                  value={whenLast}
                  onChange={(e) => {
                    setWhenLast(e.target.value);
                  }}
                  placeholder={t('form.placeholders.whenLast', {
                    defaultValue: 'e.g. Two weeks ago',
                  })}
                />
              </Field>
              <Field
                label={t('form.fields.duration', {
                  defaultValue: 'How long has this been happening?',
                })}
              >
                <Select
                  value={duration}
                  onChange={(e) => {
                    setDuration(e.target.value as WbConductDuration | '');
                  }}
                >
                  <option value="">
                    {t('form.placeholders.selectOne', { defaultValue: 'Select one...' })}
                  </option>
                  {WB_DURATION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {wbDurationLabelT(o.value, t)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label={t('form.fields.awareness', {
                  defaultValue: 'How did you become aware of this?',
                })}
              >
                <Select
                  value={awareness}
                  onChange={(e) => {
                    setAwareness(e.target.value as WbAwarenessSource | '');
                  }}
                >
                  <option value="">
                    {t('form.placeholders.selectOne', { defaultValue: 'Select one...' })}
                  </option>
                  {WB_AWARENESS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {wbAwarenessLabelT(o.value, t)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </QuestionCard>
        </div>
      )}

      {/* ------------------------------------------------- step 4: identity */}
      {currentStep.key === 'identity' && (
        <div key="identity" className="animate-fade-up space-y-6">
          <QuestionCard
            number={6}
            title={t('form.q.identity.title', { defaultValue: 'How should we contact you?' })}
            hint={t('form.q.identity.hint', {
              defaultValue:
                'You can submit without providing your identity. Either way, your private case credentials let you return and respond.',
            })}
          >
            <div data-tour="anonymous" className="grid gap-3 sm:grid-cols-2">
              <IdentityChoice
                selected={anonymous}
                onSelect={() => {
                  setAnonymous(true);
                }}
                icon={EyeOff}
                title={t('form.identity.anonymous.title', {
                  defaultValue: 'Do not include my identity',
                })}
                body={t('form.identity.anonymous.body', {
                  defaultValue:
                    'Your name and contact details are not attached to this report. You can still receive questions and reply.',
                })}
              />
              <IdentityChoice
                selected={!anonymous}
                onSelect={() => {
                  setAnonymous(false);
                }}
                icon={Send}
                title={t('form.identity.named.title', {
                  defaultValue: 'Share my contact details',
                })}
                body={t('form.identity.named.body', {
                  defaultValue:
                    'Reviewers can reach you directly. Your details are visible only to the people handling this case.',
                })}
              />
            </div>

            {!anonymous && (
              <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
                <Field
                  label={t('form.fields.email', { defaultValue: 'Your email (for updates)' })}
                  required
                >
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                    }}
                    placeholder={t('form.placeholders.email', {
                      defaultValue: 'you@example.com',
                    })}
                  />
                </Field>
                <Field label={t('form.fields.phone', { defaultValue: 'Your phone number' })}>
                  <Input
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                    }}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field
                    label={t('form.fields.bestTime', { defaultValue: 'Best time to reach you' })}
                  >
                    <Input
                      value={preferredContact}
                      onChange={(e) => {
                        setPreferredContact(e.target.value);
                      }}
                      placeholder={t('form.placeholders.bestTime', {
                        defaultValue: 'e.g. Weekday mornings',
                      })}
                    />
                  </Field>
                </div>
              </div>
            )}
          </QuestionCard>

          {/* Conflict of interest — a routing control, not an accusation. */}
          <div data-tour="conflict">
            <QuestionCard
              number={7}
              title={t('form.q.conflict.title', { defaultValue: 'Is there a conflict of interest?' })}
              hint={t('form.q.conflict.hint', {
                defaultValue:
                  'Only answer this if your concern involves someone who would normally review reports.',
              })}
            >
              <label
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                  conflictOfInterestDeclared
                    ? 'border-courage/40 bg-courage-tint'
                    : 'border-border bg-card hover:border-courage/30',
                )}
              >
                <input
                  type="checkbox"
                  checked={conflictOfInterestDeclared}
                  onChange={(e) => {
                    setConflictOfInterestDeclared(e.target.checked);
                    if (!e.target.checked) {
                      setExcludedIndependentReviewerIds([]);
                    }
                  }}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-signal"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">
                    {t('form.conflict.title', {
                      defaultValue: 'Route this to independent review',
                    })}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {t('form.conflict.description', {
                      defaultValue:
                        'The report will go to the organization’s independent-review team, and the team that normally handles whistleblowing cases will not receive access.',
                    })}
                  </span>
                </span>
              </label>

              {conflictOfInterestDeclared && (
                <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    {t('conflictReviewerSelection.title', {
                      defaultValue: 'Exclude specific independent reviewers (optional)',
                    })}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t('conflictReviewerSelection.description', {
                      defaultValue:
                        'Select only the independent reviewer(s) who may have a conflict. Other independent reviewers can access this report.',
                    })}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t('conflictReviewerSelection.protected', {
                      defaultValue:
                        'The organization owner is always protected, and at least one eligible administrator must remain available.',
                    })}
                  </p>

                  <div className="mt-3.5 grid gap-2 sm:grid-cols-2">
                    {orgInfo.complianceTeam.map((reviewer) => {
                      const checked = excludedIndependentReviewerIds.includes(reviewer.id);
                      const disabled =
                        !reviewer.canExclude ||
                        (reviewer.isAdmin &&
                          !checked &&
                          excludedIndependentAdminCount >= independentAdminCount - 1);

                      return (
                        <label
                          key={reviewer.id}
                          className={cn(
                            'flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground',
                            disabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer',
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={(event) => {
                              setExcludedIndependentReviewerIds((current) =>
                                event.target.checked
                                  ? [...current, reviewer.id]
                                  : current.filter((id) => id !== reviewer.id),
                              );
                            }}
                            className="h-4 w-4 accent-signal"
                          />
                          <span translate="no" dir="auto">
                            {reviewer.displayName}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  {orgInfo.complianceTeam.length === 0 && (
                    <p className="mt-2.5 text-xs text-muted-foreground">
                      {t('conflictReviewerSelection.none', {
                        defaultValue: 'No independent reviewers are currently configured.',
                      })}
                    </p>
                  )}
                </div>
              )}
            </QuestionCard>
          </div>
        </div>
      )}

      {/* --------------------------------------------------- step 5: review */}
      {currentStep.key === 'review' && (
        <div key="review" className="animate-fade-up space-y-6">
          <QuestionCard
            number={8}
            title={t('form.q.review.title', { defaultValue: 'Review and submit' })}
            hint={t('form.q.review.hint', {
              defaultValue: 'Confirm the terms of making this report before you send it.',
            })}
            required
          >
            <label
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                agreed ? 'border-signal bg-signal-tint' : 'border-border bg-card',
              )}
            >
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => {
                  setAgreed(e.target.checked);
                }}
                className="mt-0.5 h-4 w-4 shrink-0 accent-signal"
              />
              <span className="text-sm leading-relaxed text-foreground">
                {t('form.terms', {
                  defaultValue:
                    'I agree to the terms and conditions of making this report and confirm the information provided is true to the best of my knowledge.',
                })}
              </span>
            </label>
          </QuestionCard>

          {/* The private case receipt is the single most important thing the
              reporter must understand before submitting. */}
          <div className="rounded-xl border border-plum/20 bg-plum-tint p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-plum/12 text-plum">
                <KeyRound className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground">
                  {t('form.expect.title', { defaultValue: 'Stay informed, privately' })}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t('form.expect.lede', {
                    defaultValue:
                      'After you submit, you will receive a private case reference and return key. They are shown once — save them before you close the page.',
                  })}
                </p>

                <ul className="mt-4 space-y-2.5">
                  {[
                    t('form.expect.saveCredentials', {
                      defaultValue: 'Keep your case reference and return key somewhere safe.',
                    }),
                    t('form.expect.returnAnytime', {
                      defaultValue:
                        'You can return at any time to read updates, answer questions and attach evidence.',
                    }),
                    t('form.expect.reviewedFairly', {
                      defaultValue:
                        'Your report is reviewed by the people assigned to it, following a documented process.',
                    }),
                    t('form.expect.noRetaliation', {
                      defaultValue: 'Retaliation against people who raise concerns is prohibited.',
                    }),
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"
                    >
                      <CheckCircle2
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss"
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------ errors */}
      {error !== null && (
        <div
          role="alert"
          className="animate-scale-in flex items-start gap-2.5 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      {/* ------------------------------------------------------ step actions */}
      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={goBack}
          disabled={isFirstStep || submit.isPending}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('form.navigation.back', { defaultValue: 'Back' })}
        </Button>

        {isLastStep ? (
          <Button data-tour="submit" onClick={onSubmit} disabled={submit.isPending}>
            <Lock className="h-4 w-4" aria-hidden="true" />
            {submit.isPending
              ? t('form.submitting', { defaultValue: 'Submitting...' })
              : t('form.submit', { defaultValue: 'Submit report' })}
          </Button>
        ) : (
          <Button type="button" onClick={goNext}>
            {t('form.navigation.next', { defaultValue: 'Continue to next step' })}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>

      
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * One numbered question block. Numbering the questions (rather than the wizard
 * cards) gives a reporter a stable way to refer back to a specific answer, and
 * keeps a long intake feeling like a sequence of small asks.
 */
function QuestionCard({
  number,
  title,
  hint,
  required = false,
  children,
}: {
  number: number;
  title: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}): ReactElement {
  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <header className="mb-5">
        <h3 className="flex items-baseline gap-2 text-base font-semibold text-foreground">
          <span className="text-signal-strong">{number}.</span>
          <span>
            {title}
            {required && (
              <span className="ms-1 text-destructive" aria-hidden="true">
                *
              </span>
            )}
          </span>
        </h3>
        {hint !== undefined && (
          <p className="ms-5 mt-1 text-sm leading-relaxed text-muted-foreground">{hint}</p>
        )}
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}): ReactElement {
  return (
    <div className="w-full space-y-1.5">
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required && (
          <span className="ms-0.5 text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function CharacterCount({ value, max }: { value: number; max: number }): ReactElement {
  const nearLimit = value > max * 0.9;
  return (
    <p
      className={cn(
        'text-end text-xs tabular-nums',
        nearLimit ? 'text-courage-strong' : 'text-muted-foreground/70',
      )}
    >
      {value.toLocaleString()} / {max.toLocaleString()}
    </p>
  );
}

function IdentityChoice({
  selected,
  onSelect,
  icon: Icon,
  title,
  body,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: typeof EyeOff;
  title: string;
  body: string;
}): ReactElement {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex flex-col items-start gap-2.5 rounded-xl border p-4 text-start transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        selected
          ? 'border-signal bg-signal-tint'
          : 'border-border bg-card hover:border-signal/40 hover:bg-signal-tint/40',
      )}
    >
      <span className="flex w-full items-center gap-2.5">
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            selected ? 'bg-signal/15 text-signal-strong' : 'bg-muted text-muted-foreground',
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <span
          className={cn(
            'text-sm font-semibold',
            selected ? 'text-signal-strong' : 'text-foreground',
          )}
        >
          {title}
        </span>
        {selected && (
          <CheckCircle2 className="ms-auto h-4 w-4 shrink-0 text-signal" aria-hidden="true" />
        )}
      </span>
      <span className="text-xs leading-relaxed text-muted-foreground">{body}</span>
    </button>
  );
}
