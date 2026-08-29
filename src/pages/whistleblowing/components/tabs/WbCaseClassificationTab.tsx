import { Button } from '@components/ui/button';
import { Select } from '@components/ui/select';
import { useUpdateCaseDetails } from '@features/whistleblowing/hooks';
import type { WbCaseDetail, WbCaseType, WbIntakeMethod } from '@features/whistleblowing/types';
import {
  WB_CASE_TYPE_OPTIONS,
  WB_INTAKE_METHOD_OPTIONS,
} from '@features/whistleblowing/utils/format';
import { wbCaseTypeLabelT, wbIntakeMethodLabelT } from '@features/whistleblowing/utils/i18n';
import { getApiErrorMessage } from '@lib/api-error';
import { ClipboardList } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CaseField, CaseSection } from '../WbCaseConsolePrimitives';

export function WbCaseClassificationTab({
  caseId,
  caseData,
  canEdit,
  onSaved,
}: {
  caseId: string;
  caseData: WbCaseDetail;
  canEdit: boolean;
  onSaved?: () => void;
}): ReactElement {
  const { t } = useTranslation('whistleblowing');
  const update = useUpdateCaseDetails();
  const [caseType, setCaseType] = useState<WbCaseType>(caseData.caseType);
  const [intakeMethod, setIntakeMethod] = useState<WbIntakeMethod>(caseData.intakeMethod);
  const dirty = caseType !== caseData.caseType || intakeMethod !== caseData.intakeMethod;

  return (
    <CaseSection
      title={t('caseConsole.panels.classification', { defaultValue: 'Classification' })}
      icon={ClipboardList}
    >
      {!canEdit ? (
        <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
          <CaseField
            label={t('caseConsole.fields.caseType', { defaultValue: 'Case type' })}
            value={wbCaseTypeLabelT(caseData.caseType, t)}
          />
          <CaseField
            label={t('caseConsole.fields.intakeMethod', { defaultValue: 'Intake method' })}
            value={wbIntakeMethodLabelT(caseData.intakeMethod, t)}
          />
        </dl>
      ) : (
        <div className="space-y-4">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              {t('caseConsole.fields.caseType', { defaultValue: 'Case type' })}
            </span>
            <Select
              value={caseType}
              onChange={(event) => {
                setCaseType(event.target.value as WbCaseType);
              }}
            >
              {WB_CASE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {wbCaseTypeLabelT(option.value, t)}
                </option>
              ))}
            </Select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              {t('caseConsole.fields.intakeMethod', { defaultValue: 'Intake method' })}
            </span>
            <Select
              value={intakeMethod}
              onChange={(event) => {
                setIntakeMethod(event.target.value as WbIntakeMethod);
              }}
            >
              {WB_INTAKE_METHOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {wbIntakeMethodLabelT(option.value, t)}
                </option>
              ))}
            </Select>
          </label>
          <Button
            size="sm"
            className="w-full sm:w-auto"
            disabled={update.isPending || !dirty}
            onClick={() => {
              const mutation = { id: caseId, data: { caseType, intakeMethod } };
              if (onSaved === undefined) {
                update.mutate(mutation);
              } else {
                update.mutate(mutation, {
                  onSuccess: () => {
                    onSaved();
                  },
                });
              }
            }}
          >
            {update.isPending
              ? t('caseConsole.actions.saving', { defaultValue: 'Saving...' })
              : t('caseConsole.actions.saveClassification', {
                  defaultValue: 'Save classification',
                })}
          </Button>
          {update.error !== null && (
            <p className="text-xs text-destructive">{getApiErrorMessage(update.error)}</p>
          )}
        </div>
      )}
    </CaseSection>
  );
}
