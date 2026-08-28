import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { useUpdateSynopsis } from '@features/whistleblowing/hooks';
import type { WbCaseDetail } from '@features/whistleblowing/types';
import { getApiErrorMessage } from '@lib/api-error';
import { CheckCircle2, Pencil } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CaseEmptyState, CaseField, CaseRecord, CaseSection } from '../WbCaseConsolePrimitives';

function SynopsisInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}): ReactElement {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <Input
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
    </label>
  );
}

export function WbCaseSynopsisTab({
  caseId,
  caseData,
  canEdit,
}: {
  caseId: string;
  caseData: WbCaseDetail;
  canEdit: boolean;
}): ReactElement {
  const { t } = useTranslation('whistleblowing');
  const update = useUpdateSynopsis();
  const [editing, setEditing] = useState(false);
  const [primaryOutcome, setPrimaryOutcome] = useState(caseData.primaryOutcome ?? '');
  const [secondaryOutcome, setSecondaryOutcome] = useState(caseData.secondaryOutcome ?? '');
  const [actionTaken, setActionTaken] = useState(caseData.actionTaken ?? '');
  const [potentialNextSteps, setPotentialNextSteps] = useState(caseData.potentialNextSteps ?? '');
  const [synopsisNotes, setSynopsisNotes] = useState(caseData.synopsisNotes ?? '');

  const hasContent =
    caseData.primaryOutcome !== null ||
    caseData.secondaryOutcome !== null ||
    caseData.actionTaken !== null ||
    caseData.potentialNextSteps !== null ||
    caseData.synopsisNotes !== null;

  const save = (): void => {
    update.mutate(
      {
        id: caseId,
        data: {
          primaryOutcome: primaryOutcome.trim(),
          secondaryOutcome: secondaryOutcome.trim(),
          actionTaken: actionTaken.trim(),
          potentialNextSteps: potentialNextSteps.trim(),
          synopsisNotes: synopsisNotes.trim(),
        },
      },
      {
        onSuccess: () => {
          setEditing(false);
        },
      },
    );
  };

  return (
    <CaseSection
      title={t('caseConsole.panels.synopsisOutcome', { defaultValue: 'Synopsis & outcome' })}
      icon={CheckCircle2}
      action={
        canEdit && !editing ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditing(true);
            }}
          >
            <Pencil className="h-4 w-4" />
            {t('caseConsole.actions.edit', { defaultValue: 'Edit' })}
          </Button>
        ) : null
      }
    >
      {!canEdit && !hasContent ? (
        <CaseEmptyState
          icon={CheckCircle2}
          label={t('caseConsole.synopsis.empty', { defaultValue: 'No synopsis recorded yet.' })}
        />
      ) : editing ? (
        <div className="space-y-4">
          <SynopsisInput
            label={t('caseConsole.fields.primaryOutcome', { defaultValue: 'Primary outcome' })}
            value={primaryOutcome}
            onChange={setPrimaryOutcome}
          />
          <SynopsisInput
            label={t('caseConsole.fields.secondaryOutcome', { defaultValue: 'Secondary outcome' })}
            value={secondaryOutcome}
            onChange={setSecondaryOutcome}
          />
          <SynopsisInput
            label={t('caseConsole.fields.actionTaken', { defaultValue: 'Action taken' })}
            value={actionTaken}
            onChange={setActionTaken}
          />
          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-500">
              {t('caseConsole.fields.potentialNextSteps', { defaultValue: 'Potential next steps' })}
            </span>
            <Textarea
              value={potentialNextSteps}
              onChange={(event) => {
                setPotentialNextSteps(event.target.value);
              }}
              rows={2}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-500">
              {t('caseConsole.fields.synopsisNotes', { defaultValue: 'Synopsis notes' })}
            </span>
            <Textarea
              value={synopsisNotes}
              onChange={(event) => {
                setSynopsisNotes(event.target.value);
              }}
              rows={3}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={update.isPending} onClick={save}>
              {update.isPending
                ? t('caseConsole.actions.saving', { defaultValue: 'Saving...' })
                : t('caseConsole.actions.saveSynopsis', { defaultValue: 'Save synopsis' })}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditing(false);
              }}
            >
              {t('caseConsole.actions.cancel', { defaultValue: 'Cancel' })}
            </Button>
          </div>
          {update.error !== null && (
            <p className="text-xs text-red-600">{getApiErrorMessage(update.error)}</p>
          )}
        </div>
      ) : (
        <dl className="space-y-4">
          {caseData.primaryOutcome !== null && (
            <CaseField
              label={t('caseConsole.fields.primaryOutcome', { defaultValue: 'Primary outcome' })}
              value={caseData.primaryOutcome}
            />
          )}
          {caseData.secondaryOutcome !== null && (
            <CaseField
              label={t('caseConsole.fields.secondaryOutcome', {
                defaultValue: 'Secondary outcome',
              })}
              value={caseData.secondaryOutcome}
            />
          )}
          {caseData.actionTaken !== null && (
            <CaseField
              label={t('caseConsole.fields.actionTaken', { defaultValue: 'Action taken' })}
              value={caseData.actionTaken}
            />
          )}
          {caseData.potentialNextSteps !== null && (
            <CaseRecord
              label={t('caseConsole.fields.potentialNextSteps', {
                defaultValue: 'Potential next steps',
              })}
              value={caseData.potentialNextSteps}
            />
          )}
          {caseData.synopsisNotes !== null && (
            <CaseRecord
              label={t('caseConsole.fields.synopsisNotes', { defaultValue: 'Synopsis notes' })}
              value={caseData.synopsisNotes}
            />
          )}
        </dl>
      )}
    </CaseSection>
  );
}
