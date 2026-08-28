import { type ReactElement, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { History } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Select } from '@components/ui/select';
import { Textarea } from '@components/ui/textarea';
import { Sheet } from '@components/ui/sheet';
import { useFormDraft } from '@hooks/useFormDraft';
import { getApiErrorMessage, getApiSuccessMessage } from '@lib/api-error';
import { ROUTES } from '@config/routes';
import { toast } from '@store/toastStore';
import { useManualCreateCase } from '@features/whistleblowing/hooks';
import {
  WB_CASE_TYPE_OPTIONS,
  WB_CATEGORY_OPTIONS,
  WB_INTAKE_METHOD_OPTIONS,
  WB_PRIORITY_OPTIONS,
  WB_RELATIONSHIP_OPTIONS,
} from '@features/whistleblowing/utils/format';
import {
  wbCaseTypeLabelT,
  wbCategoryLabelT,
  wbIntakeMethodLabelT,
  wbPriorityLabelT,
  wbRelationshipLabelT,
} from '@features/whistleblowing/utils/i18n';
import { InvolvedPersonsField } from '@features/whistleblowing/components/InvolvedPersonsField';
import type {
  InvestigationPriority,
  InvolvedPerson,
  ManualCreateInput,
  WbCaseType,
  WbIntakeMethod,
  WbRelationship,
  WhistleblowingCategory,
} from '@features/whistleblowing/types';

interface ManualCaseSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const FIRST_CATEGORY: WhistleblowingCategory = WB_CATEGORY_OPTIONS[0] ?? 'OTHER_MISCONDUCT';

/**
 * Serializable snapshot of the manual-intake form for draft autosave. This is
 * the *internal* compliance-officer intake only — the public/anonymous reporter
 * form is deliberately never persisted to localStorage (confidentiality).
 */
interface ManualCaseDraft {
  category: WhistleblowingCategory;
  priority: InvestigationPriority;
  caseType: WbCaseType;
  intakeMethod: WbIntakeMethod;
  description: string;
  incidentDate: string;
  location: string;
  city: string;
  stateProvince: string;
  country: string;
  relationship: WbRelationship | '';
  involved: InvolvedPerson[];
}

/** Pristine = no substantive input yet (dropdown defaults don't count). */
function isManualCaseDraftPristine(d: ManualCaseDraft): boolean {
  return (
    d.description.trim().length === 0 &&
    d.incidentDate.length === 0 &&
    d.location.trim().length === 0 &&
    d.city.trim().length === 0 &&
    d.stateProvince.trim().length === 0 &&
    d.country.trim().length === 0 &&
    d.relationship === '' &&
    d.involved.length === 0
  );
}

export function ManualCaseSheet({ isOpen, onClose }: ManualCaseSheetProps): ReactElement {
  const { t } = useTranslation('whistleblowing');
  const navigate = useNavigate();
  const create = useManualCreateCase();

  const [category, setCategory] = useState<WhistleblowingCategory>(FIRST_CATEGORY);
  const [priority, setPriority] = useState<InvestigationPriority>('PRIORITY_MEDIUM');
  const [caseType, setCaseType] = useState<WbCaseType>('ALLEGATION');
  const [intakeMethod, setIntakeMethod] = useState<WbIntakeMethod>('PHONE');
  const [description, setDescription] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [stateProvince, setStateProvince] = useState('');
  const [country, setCountry] = useState('');
  const [relationship, setRelationship] = useState<WbRelationship | ''>('');
  const [involved, setInvolved] = useState<InvolvedPerson[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [openKey, setOpenKey] = useState('');

  const draftValue = useMemo<ManualCaseDraft>(
    () => ({
      category,
      priority,
      caseType,
      intakeMethod,
      description,
      incidentDate,
      location,
      city,
      stateProvince,
      country,
      relationship,
      involved,
    }),
    [
      category,
      priority,
      caseType,
      intakeMethod,
      description,
      incidentDate,
      location,
      city,
      stateProvince,
      country,
      relationship,
      involved,
    ],
  );

  // Auto-save this internal intake so a long manual capture isn't lost.
  const { readDraft, clearDraft } = useFormDraft<ManualCaseDraft>({
    key: 'wb-manual-create',
    value: draftValue,
    enabled: isOpen,
    isEmpty: isManualCaseDraftPristine,
  });

  const resetFields = (): void => {
    setCategory(FIRST_CATEGORY);
    setPriority('PRIORITY_MEDIUM');
    setCaseType('ALLEGATION');
    setIntakeMethod('PHONE');
    setDescription('');
    setIncidentDate('');
    setLocation('');
    setCity('');
    setStateProvince('');
    setCountry('');
    setRelationship('');
    setInvolved([]);
  };

  const applyDraft = (d: ManualCaseDraft): void => {
    setCategory(d.category);
    setPriority(d.priority);
    setCaseType(d.caseType);
    setIntakeMethod(d.intakeMethod);
    setDescription(d.description);
    setIncidentDate(d.incidentDate);
    setLocation(d.location);
    setCity(d.city);
    setStateProvince(d.stateProvince);
    setCountry(d.country);
    setRelationship(d.relationship);
    setInvolved(d.involved);
  };

  // Restore a saved draft synchronously on open — before the autosave effect
  // runs — so a pristine first render can't wipe the stored draft. Resets the
  // open latch on close so the next open re-reads.
  if (isOpen && openKey !== '1') {
    setOpenKey('1');
    const draft = readDraft();
    if (draft !== null) {
      applyDraft(draft);
      setDraftRestored(true);
    } else {
      setDraftRestored(false);
    }
  } else if (!isOpen && openKey !== '0') {
    setOpenKey('0');
  }

  const submit = (): void => {
    if (description.trim().length < 10) {
      const message = t('manualCase.validation.description', {
        defaultValue: 'Please describe the incident in at least 10 characters.',
      });
      setError(message);
      toast.error(message);
      return;
    }
    setError(null);
    const people = involved
      .map((p) => ({
        firstName: p.firstName?.trim() ?? '',
        lastName: p.lastName?.trim() ?? '',
        title: p.title?.trim() ?? '',
      }))
      .filter((p) => p.firstName.length > 0 || p.lastName.length > 0 || p.title.length > 0);
    const data: ManualCreateInput = {
      category,
      priority,
      caseType,
      intakeMethod,
      incidentDescription: description.trim(),
      ...(incidentDate.length > 0 ? { incidentDate } : {}),
      ...(location.trim().length > 0 ? { incidentLocation: location.trim() } : {}),
      ...(city.trim().length > 0 ? { locationCity: city.trim() } : {}),
      ...(stateProvince.trim().length > 0 ? { locationState: stateProvince.trim() } : {}),
      ...(country.trim().length > 0 ? { locationCountry: country.trim() } : {}),
      ...(relationship !== '' ? { relationshipToOrg: relationship } : {}),
      ...(people.length > 0 ? { involvedPersons: people } : {}),
    };
    create.mutate(data, {
      onSuccess: (c) => {
        toast.success(
          getApiSuccessMessage(c) ??
            t('manualCase.toasts.created', { defaultValue: 'Manual case created.' }),
        );
        clearDraft();
        resetFields();
        setDraftRestored(false);
        onClose();
        navigate(ROUTES.WHISTLEBLOWING_REGISTER);
      },
      onError: (e) => {
        const message = getApiErrorMessage(e);
        setError(message);
        toast.error(message);
      },
    });
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={t('manualCase.title', { defaultValue: 'Create case manually' })}
      description={t('manualCase.description', {
        defaultValue: 'Capture an off-portal report received by email, hotline or in person.',
      })}
      width="2xl"
      footer={
        <div className="form-sheet-footer">
          <Button variant="outline" onClick={onClose} className="text-sm">
            {t('manualCase.actions.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button onClick={submit} disabled={create.isPending} className="text-sm">
            {create.isPending
              ? t('manualCase.actions.creating', { defaultValue: 'Creating...' })
              : t('manualCase.actions.create', { defaultValue: 'Create case' })}
          </Button>
        </div>
      }
    >
      <div className="form-sheet-body space-y-4">
        {draftRestored && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-brand-accent/25 bg-[#e6f5f6]/40 px-3 py-2 text-sm text-brand-primary">
            <span className="flex items-center gap-2">
              <History className="h-4 w-4 shrink-0 text-brand-accent" />
              {t('manualCase.draftRestored', {
                defaultValue: 'Restored your unsaved draft from earlier.',
              })}
            </span>
            <button
              type="button"
              onClick={() => {
                resetFields();
                clearDraft();
                setDraftRestored(false);
              }}
              className="shrink-0 font-medium text-brand-accent hover:underline"
            >
              {t('manualCase.startFresh', { defaultValue: 'Start fresh' })}
            </button>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('manualCase.fields.category', { defaultValue: 'Category' })}>
            <Select
              className="w-full text-base"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as WhistleblowingCategory);
              }}
            >
              {WB_CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {wbCategoryLabelT(c, t)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('manualCase.fields.riskRating', { defaultValue: 'Risk rating' })}>
            <Select
              className="w-full text-base"
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value as InvestigationPriority);
              }}
            >
              {WB_PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {wbPriorityLabelT(p, t)}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label={t('manualCase.fields.description', { defaultValue: 'Incident description' })}>
          <Textarea
            className="w-full text-base"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
            }}
            rows={5}
            placeholder={t('manualCase.placeholders.description', {
              defaultValue: 'What happened?',
            })}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('manualCase.fields.caseType', { defaultValue: 'Case type' })}>
            <Select
              className="w-full text-base"
              value={caseType}
              onChange={(e) => {
                setCaseType(e.target.value as WbCaseType);
              }}
            >
              {WB_CASE_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {wbCaseTypeLabelT(o.value, t)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('manualCase.fields.intakeMethod', { defaultValue: 'Intake method' })}>
            <Select
              className="w-full text-base"
              value={intakeMethod}
              onChange={(e) => {
                setIntakeMethod(e.target.value as WbIntakeMethod);
              }}
            >
              {WB_INTAKE_METHOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {wbIntakeMethodLabelT(o.value, t)}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t('manualCase.fields.dateOfOccurrence', {
              defaultValue: 'Date of occurrence',
            })}
          >
            {/* Added styling to prevent browser default split-lines on date fields */}
            <div className="relative w-full">
              <Input
                type="date"
                className="w-full appearance-none bg-transparent text-base"
                value={incidentDate}
                onChange={(e) => {
                  setIncidentDate(e.target.value);
                }}
              />
            </div>
          </Field>
          <Field
            label={t('manualCase.fields.reporterRelationship', {
              defaultValue: 'Reporter relationship',
            })}
          >
            <Select
              className="w-full text-base"
              value={relationship}
              onChange={(e) => {
                setRelationship(e.target.value as WbRelationship | '');
              }}
            >
              <option value="">
                {t('manualCase.placeholders.notSpecified', { defaultValue: 'Not specified' })}
              </option>
              {WB_RELATIONSHIP_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {wbRelationshipLabelT(o.value, t)}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label={t('manualCase.fields.location', { defaultValue: 'Location' })}>
          <Input
            className="w-full text-base"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
            }}
            placeholder={t('manualCase.placeholders.location', {
              defaultValue: 'Address / site / building',
            })}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('manualCase.fields.city', { defaultValue: 'City' })}>
            <Input
              className="w-full text-base"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
              }}
            />
          </Field>
          <Field label={t('manualCase.fields.stateCountry', { defaultValue: 'State / Country' })}>
            {/* Split layout explicitly broken into fully separated grid blocks to prevent lines */}
            <div className="grid w-full grid-cols-2 gap-4">
              <div>
                <Input
                  className="w-full text-base"
                  value={stateProvince}
                  onChange={(e) => {
                    setStateProvince(e.target.value);
                  }}
                  placeholder={t('manualCase.placeholders.state', { defaultValue: 'State' })}
                />
              </div>
              <div>
                <Input
                  className="w-full text-base"
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                  }}
                  placeholder={t('manualCase.placeholders.country', { defaultValue: 'Country' })}
                />
              </div>
            </div>
          </Field>
        </div>

        <Field
          label={t('manualCase.fields.personsEngaged', {
            defaultValue: 'Person(s) engaged',
          })}
        >
          <div>
            <InvolvedPersonsField value={involved} onChange={setInvolved} />
          </div>
        </Field>

        {error !== null && <p className="text-sm font-medium text-red-600">{error}</p>}
      </div>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: ReactElement }): ReactElement {
  return (
    <label className="block w-full space-y-1.5">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      {children}
    </label>
  );
}
