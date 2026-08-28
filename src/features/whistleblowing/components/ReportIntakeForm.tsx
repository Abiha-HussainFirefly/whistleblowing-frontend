import { type ReactElement, type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, EyeOff, FileText, Globe, Info, User } from 'lucide-react';

import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Select } from '@components/ui/select';
import { StepBar } from '@components/ui/step-bar';
import { Textarea } from '@components/ui/textarea';
import { getApiErrorMessage } from '@lib/api-error';
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
import { InvolvedPersonsField } from './InvolvedPersonsField';

type ReportStepKey = 'incident' | 'location' | 'details' | 'identity' | 'review';

interface ReportStep {
  key: ReportStepKey;
  titleKey: string;
  fallback: string;
}

const REPORT_STEPS: readonly ReportStep[] = [
  { key: 'incident', titleKey: 'form.steps.incident', fallback: 'Incident details' },
  { key: 'location', titleKey: 'form.steps.location', fallback: 'Location' },
  { key: 'details', titleKey: 'form.steps.details', fallback: 'People & timing' },
  { key: 'identity', titleKey: 'form.steps.identity', fallback: 'Identity' },
  { key: 'review', titleKey: 'form.steps.review', fallback: 'Review & submit' },
] as const;

const INCIDENT_STEP_INDEX = 0;
const IDENTITY_STEP_INDEX = 3;
const REVIEW_STEP_INDEX = 4;

interface ReportIntakeFormProps {
  organizationSlug: string;
  orgInfo: PortalOrgInfo;
  onSubmitted: (result: ReporterSubmitResult) => void;
  tourTriggerTime?: number;
}

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
  // eslint-disable-next-line security/detect-object-injection -- step is clamped by wizard navigation
  const currentStep: ReportStep = REPORT_STEPS[step] ?? {
    key: 'incident',
    titleKey: 'form.steps.incident',
    fallback: 'Incident details',
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
    if (description.length > 20_000) {
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

  const goBack = (): void => {
    setError(null);
    setStep((value) => Math.max(0, value - 1));
  };

  const goNext = (): void => {
    const validationError = validateCurrentStep();
    if (validationError !== null) {
      setError(validationError);
      return;
    }
    setError(null);
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
    <div className="w-full space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5">
        <StepBar titles={reportStepTitles} current={step} />
      </div>

      {currentStep.key === 'incident' && (
        <SectionCard
          number="1"
          title={t('form.cards.overview.title', { defaultValue: 'Incident Overview' })}
          subtitle={t('form.cards.overview.subtitle', {
            defaultValue: "Describe the nature of the concern you're reporting",
          })}
          icon={<FileText />}
        >
          <div data-tour="category">
            <FormField
              label={t('form.fields.category', { defaultValue: 'Incident category' })}
              required
            >
              <Select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as WhistleblowingCategory | '');
                }}
              >
                <option value="">
                  {t('form.placeholders.selectCategory', {
                    defaultValue: 'Select a category...',
                  })}
                </option>
                {orgInfo.categories.map((c) => (
                  <option key={c} value={c}>
                    {wbCategoryLabelT(c, t)}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div data-tour="description">
            <FormField
              label={t('form.fields.whatHappened', { defaultValue: 'What happened?' })}
              required
              hint={t('form.fields.whatHappenedHint', {
                defaultValue: 'Who, what, where, when, and how. Your anonymity is protected.',
              })}
            >
              <Textarea
                value={description}
                maxLength={20_000}
                onChange={(e) => {
                  setDescription(e.target.value);
                }}
                rows={7}
                placeholder={t('form.placeholders.whatHappened', {
                  defaultValue:
                    'Please provide as much detail as possible - who, what, where, when and how you know this. Avoid including your own identity if you wish to remain anonymous.',
                })}
              />
            </FormField>
          </div>
          <p className="text-right text-xs text-slate-400">
            {t('form.characters', {
              count: description.length,
              defaultValue: '{{count}} characters',
            })}
          </p>
        </SectionCard>
      )}

      {currentStep.key === 'location' && (
        <SectionCard
          number="2"
          title={t('form.cards.location.title', { defaultValue: 'Where Did This Happen?' })}
          subtitle={t('form.cards.location.subtitle', {
            defaultValue: 'Help us understand the location of the incident',
          })}
          icon={<Globe />}
        >
          <div data-tour="location">
            <FormField
              label={t('form.fields.location', {
                defaultValue: 'Location where incident occurred',
              })}
            >
              <Textarea
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                }}
                rows={3}
                placeholder={t('form.placeholders.location', {
                  defaultValue: 'Physical address, branch and/or store number',
                })}
              />
            </FormField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t('form.fields.city', { defaultValue: 'City' })}>
              <Input
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                }}
              />
            </FormField>
            <FormField label={t('form.fields.state', { defaultValue: 'State / Province' })}>
              <Input
                value={stateProvince}
                onChange={(e) => {
                  setStateProvince(e.target.value);
                }}
              />
            </FormField>
            <FormField label={t('form.fields.postalCode', { defaultValue: 'Zip / Postal code' })}>
              <Input
                value={postalCode}
                onChange={(e) => {
                  setPostalCode(e.target.value);
                }}
              />
            </FormField>
            <FormField label={t('form.fields.country', { defaultValue: 'Country' })}>
              <Input
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                }}
              />
            </FormField>
          </div>
          {orgInfo.regions.length > 0 && (
            <FormField label={t('form.fields.region', { defaultValue: 'Region / business unit' })}>
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
            </FormField>
          )}
        </SectionCard>
      )}

      {currentStep.key === 'details' && (
        <SectionCard
          number="3"
          title={t('form.cards.more.title', { defaultValue: 'Tell Us More' })}
          subtitle={t('form.cards.more.subtitle', {
            defaultValue: 'Additional context helps us investigate thoroughly',
          })}
          icon={<Info />}
        >
          <div data-tour="relationship">
            <FormField
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
            </FormField>
          </div>

          <div data-tour="involved">
            <FormField
              label={t('form.fields.involved', {
                defaultValue: 'Person(s) engaged in this behavior',
              })}
            >
              <div className="[&_button:not([type='submit'])]:border-[#007d89] [&_button:not([type='submit'])]:text-[#007d89] [&_button:not([type='submit'])]:transition-colors [&_button:not([type='submit'])]:hover:bg-[#007d89] [&_button:not([type='submit'])]:hover:text-white">
                <InvolvedPersonsField value={involved} onChange={setInvolved} />
              </div>
            </FormField>
          </div>

          <div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {t('form.fields.previouslyReported', {
                defaultValue: 'Has this been previously reported to management?',
              })}
            </span>
            <div className="mt-2 flex flex-wrap gap-4">
              {WB_PREVIOUSLY_REPORTED_OPTIONS.map((o) => (
                <label
                  key={o.value}
                  className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                >
                  <input
                    type="radio"
                    name="previouslyReported"
                    checked={previouslyReported === o.value}
                    onChange={() => {
                      setPreviouslyReported(o.value);
                    }}
                    className="h-4 w-4 accent-[#007d89]"
                  />
                  {wbPreviouslyReportedLabelT(o.value, t)}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2" data-tour="dates">
            <FormField
              label={t('form.fields.dateOfOccurrence', { defaultValue: 'Date of occurrence' })}
            >
              <div className="relative">
                <input
                  type="date"
                  value={incidentDate}
                  onChange={(e) => {
                    setIncidentDate(e.target.value);
                  }}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-colors [color-scheme:light] focus:border-[#007d89] focus:outline-none focus:ring-2 focus:ring-[#007d89]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-40 [&::-webkit-calendar-picker-indicator]:hover:opacity-70"
                />
              </div>
            </FormField>
            <FormField
              label={t('form.fields.whenLast', {
                defaultValue: 'When did this last happen?',
              })}
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
            </FormField>
            <FormField
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
            </FormField>
            <FormField
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
            </FormField>
          </div>
        </SectionCard>
      )}

      {currentStep.key === 'identity' && (
        <div className="space-y-5">
          <SectionCard
            number="4"
            title={t('form.cards.identity.title', { defaultValue: 'Identity & Confidentiality' })}
            subtitle={t('form.cards.identity.subtitle', {
              defaultValue: 'Choose how we may contact you and who should be excluded',
            })}
            icon={<User />}
          >
            <div
              data-tour="anonymous"
              className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60"
            >
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => {
                    setAnonymous(e.target.checked);
                  }}
                  className="h-4 w-4 accent-[#007d89]"
                />
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {t('form.anonymous.title', { defaultValue: 'Submit anonymously' })}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {anonymous
                      ? t('form.anonymous.on', {
                          defaultValue: 'Your identity will not be shared.',
                        })
                      : t('form.anonymous.off', {
                          defaultValue: 'Your contact details will be included.',
                        })}
                  </p>
                </div>
              </label>
            </div>

            {!anonymous && (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label={t('form.fields.email', { defaultValue: 'Your email (for updates)' })}
                  required
                >
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                    }}
                    placeholder={t('form.placeholders.email', { defaultValue: 'you@example.com' })}
                  />
                </FormField>
                <FormField label={t('form.fields.phone', { defaultValue: 'Your phone number' })}>
                  <Input
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                    }}
                  />
                </FormField>
                <div className="sm:col-span-2">
                  <FormField
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
                  </FormField>
                </div>
              </div>
            )}

            <div
              data-tour="conflict"
              className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-800/40 dark:bg-amber-900/20"
            >
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={conflictOfInterestDeclared}
                  onChange={(e) => {
                    setConflictOfInterestDeclared(e.target.checked);
                    if (!e.target.checked) {
                      setExcludedIndependentReviewerIds([]);
                    }
                  }}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#007d89]"
                />
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-amber-800 dark:text-amber-400">
                    <EyeOff className="h-4 w-4" />
                    {t('form.conflict.title', { defaultValue: 'Conflict of interest' })}
                  </span>
                  <span className="mt-1.5 block text-xs leading-relaxed text-amber-900/70 dark:text-amber-300/70">
                    {t('form.conflict.description', {
                      defaultValue:
                        'If this report involves someone who may normally handle whistleblowing cases, select this option. The report will be routed to the organization’s independent-review team and the ordinary team will not receive access.',
                    })}
                  </span>
                </span>
              </label>
              {conflictOfInterestDeclared && (
                <div className="mt-4 border-t border-amber-200 pt-3 dark:border-amber-800/40">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-300">
                    {t('conflictReviewerSelection.title', {
                      defaultValue: 'Exclude specific independent reviewers (optional)',
                    })}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-amber-900/70 dark:text-amber-300/70">
                    {t('conflictReviewerSelection.description', {
                      defaultValue:
                        'Select only the independent reviewer(s) who may have a conflict. Other independent reviewers can access this report.',
                    })}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-amber-900/70 dark:text-amber-300/70">
                    {t('conflictReviewerSelection.protected', {
                      defaultValue:
                        'The organization owner is always protected, and at least one eligible administrator must remain available.',
                    })}
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {orgInfo.complianceTeam.map((reviewer) => (
                      <label
                        key={reviewer.id}
                        className={`flex items-center gap-2 rounded-md border border-amber-200 bg-white/70 px-3 py-2 text-sm text-slate-700 dark:border-amber-800/40 dark:bg-slate-900/40 dark:text-slate-200 ${reviewer.canExclude ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                      >
                        <input
                          type="checkbox"
                          checked={excludedIndependentReviewerIds.includes(reviewer.id)}
                          disabled={
                            !reviewer.canExclude ||
                            (reviewer.isAdmin &&
                              !excludedIndependentReviewerIds.includes(reviewer.id) &&
                              excludedIndependentAdminCount >= independentAdminCount - 1)
                          }
                          onChange={(event) => {
                            setExcludedIndependentReviewerIds((current) =>
                              event.target.checked
                                ? [...current, reviewer.id]
                                : current.filter((id) => id !== reviewer.id),
                            );
                          }}
                          className="h-4 w-4 accent-[#007d89]"
                        />
                        <span translate="no" dir="auto">
                          {reviewer.displayName}
                        </span>
                      </label>
                    ))}
                  </div>
                  {orgInfo.complianceTeam.length === 0 && (
                    <p className="mt-2 text-xs text-amber-900/70 dark:text-amber-300/70">
                      {t('conflictReviewerSelection.none', {
                        defaultValue: 'No independent reviewers are currently configured.',
                      })}
                    </p>
                  )}
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      )}

      {currentStep.key === 'review' && (
        <SectionCard
          number="5"
          title={t('form.cards.review.title', { defaultValue: 'Review & Submit' })}
          subtitle={t('form.cards.review.subtitle', {
            defaultValue: 'Confirm the report terms before submitting',
          })}
          icon={<CheckCircle2 />}
        >
          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => {
                setAgreed(e.target.checked);
              }}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#007d89]"
            />
            <span className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {t('form.terms', {
                defaultValue:
                  'I agree to the terms and conditions of making this report and confirm the information provided is true to the best of my knowledge.',
              })}
            </span>
          </label>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {t('form.expect.title', { defaultValue: 'What to expect' })}
            </p>
            <ul className="space-y-2.5">
              {[
                t('form.expect.directToCompliance', {
                  defaultValue: 'Your report goes directly to the Compliance team.',
                }),
                t('form.expect.caseReference', {
                  defaultValue: "You'll receive a case reference to track progress.",
                }),
                t('form.expect.noRetaliation', {
                  defaultValue: 'Retaliation against reporters is strictly prohibited.',
                }),
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#007d89]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </SectionCard>
      )}

      {error !== null && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={goBack}
          disabled={isFirstStep || submit.isPending}
        >
          {t('form.navigation.back', { defaultValue: 'Back' })}
        </Button>

        {isLastStep ? (
          <Button
            data-tour="submit"
            className="h-11 rounded-lg bg-[#007d89] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#007d89]/90"
            onClick={onSubmit}
            disabled={submit.isPending}
          >
            {submit.isPending
              ? t('form.submitting', { defaultValue: 'Submitting...' })
              : t('form.submit', { defaultValue: 'Submit report' })}
          </Button>
        ) : (
          <Button
            type="button"
            className="h-11 rounded-lg bg-[#007d89] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#007d89]/90"
            onClick={goNext}
          >
            {t('form.navigation.next', { defaultValue: 'Next' })}
          </Button>
        )}
      </div>
    </div>
  );
}

function SectionCard({
  number,
  title,
  subtitle,
  icon,
  children,
}: {
  number: string;
  title: string;
  subtitle: string;
  icon: ReactElement;
  children: ReactNode;
}): ReactElement {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-900">
      <div className="flex items-start gap-4 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#007d89] text-sm font-bold text-white">
          {number}
        </span>
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-[#007d89] [&>svg]:h-6 [&>svg]:w-6 [&>svg]:stroke-[2]">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold leading-tight text-slate-800 dark:text-slate-100">
            {title}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
      </div>

      <div className="space-y-5 p-6">{children}</div>
    </div>
  );
}

function FormField({
  label,
  required = false,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactElement;
}): ReactElement {
  return (
    <div className="block w-full space-y-1">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {hint !== undefined && hint.length > 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>
      )}
      {children}
    </div>
  );
}
